import {
  SolverInput,
  SolverResult,
  Lesson,
  SchoolClass,
  Subject,
  Teacher,
  Room,
  ClassSubject,
} from "@/types";
import { generateStandardCurriculumForClass } from "@/lib/curriculum-templates";
import { Slot, ClassDaySubInfo } from "./core/types";
import {
  checkStrictMethodDay,
  checkSubjectCanHaveDoubleLesson,
  checkTeacherSlotAvailable,
  resolveShiftGroup,
} from "./core/csp-constraints";
import { buildClassSlots } from "./core/csp-slot-builder";
import {
  prepareAndSortLessonRequests,
  executeGreedyPlacement,
} from "./heuristics/csp-greedy-placement";
import {
  executeKempeBumpingAndFallback,
  executeMinConflictsLocalSearch,
} from "./heuristics/csp-local-search";
import {
  executeIntraDayCompaction,
  executeCrossDayGapElimination,
} from "./heuristics/csp-gap-compaction";

export class CSPSolver {
  private input: SolverInput;
  private daysCount: number;
  private subjectMap: Map<string, Subject>;
  private teacherMap: Map<string, Teacher>;
  private classMap: Map<string, SchoolClass>;
  private roomMap: Map<string, Room>;

  constructor(input: SolverInput) {
    this.input = input;
    this.daysCount = input.daysCount || 6;
    this.subjectMap = new Map(input.subjects.map((s) => [s.id, s]));
    this.teacherMap = new Map(input.teachers.map((t) => [t.id, t]));
    this.classMap = new Map(input.classes.map((c) => [c.id, c]));
    this.roomMap = new Map(input.rooms.map((r) => [r.id, r]));
  }

  public isStrictMethodDay(
    day: number,
    teacherId?: string | null,
    subjectId?: string | null,
    classId?: string | null
  ): boolean {
    return checkStrictMethodDay(
      day,
      teacherId,
      subjectId,
      classId,
      this.teacherMap,
      this.subjectMap,
      this.classMap
    );
  }

  public canSubjectHaveDoubleLesson(
    classId: string,
    subjectId: string,
    weeklyHours?: number
  ): boolean {
    return checkSubjectCanHaveDoubleLesson(
      classId,
      subjectId,
      weeklyHours,
      this.classMap,
      this.subjectMap,
      this.daysCount
    );
  }

  public isTeacherSlotAvailable(
    day: number,
    period: number,
    teacherId?: string | null,
    subjectId?: string | null,
    shiftGroup?: "shift1" | "shift2" | string,
    classId?: string | null
  ): boolean {
    return checkTeacherSlotAvailable(
      day,
      period,
      teacherId,
      subjectId,
      shiftGroup,
      classId,
      this.teacherMap,
      this.subjectMap,
      this.classMap
    );
  }

  public solve(): SolverResult {
    let bestResult: SolverResult | null = null;
    let minConflicts = Infinity;

    for (let attempt = 0; attempt < 15; attempt++) {
      const res = this.solveAttempt(attempt);
      if (res.success && res.stats.conflictsCount === 0) {
        return res;
      }
      if (res.stats.conflictsCount < minConflicts) {
        minConflicts = res.stats.conflictsCount;
        bestResult = res;
      }
    }

    return bestResult!;
  }

  private solveAttempt(attempt: number): SolverResult {
    // ── 0. SINFLARNING O'QUV REJALARINI TAYYORLASH (Auto-Standard Fallback) ──────
    const effectiveClassSubjects = new Map<string, ClassSubject[]>();
    const dynamicWorkloadTracker = new Map<string, number>();
    this.input.teachers.forEach((t) => dynamicWorkloadTracker.set(t.id, 0));

    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;

      let subjects = cls.subjects && cls.subjects.length > 0 ? [...cls.subjects] : [];
      const currentHours = subjects.reduce(
        (sum, s) => sum + (s.groupType === "GROUP_2" ? 0 : (Number(s.weeklyHours) || 0)),
        0
      );
      if (currentHours < 15) {
        const standard = generateStandardCurriculumForClass(
          cls.grade,
          cls.id,
          cls.homeroomTeacherId,
          this.input.subjects,
          this.input.teachers,
          dynamicWorkloadTracker
        );
        if (standard.length > 0) {
          const existingSubIds = new Set(subjects.map((s) => s.subjectId));
          const missing = standard.filter((st) => !existingSubIds.has(st.subjectId));
          subjects = [...subjects, ...missing];
        }
      }

      const validatedSubjects: ClassSubject[] = subjects.map((cs) => {
        let tid = cs.teacherId;
        if (!tid || !this.teacherMap.has(tid)) {
          const matchingTeachers = this.input.teachers.filter((t) => t.subjectIds?.includes(cs.subjectId));
          const pool = matchingTeachers.length > 0 ? matchingTeachers : this.input.teachers;

          let bestTeacher = pool[0];
          let minScore = Infinity;

          for (const teacher of pool) {
            const currentLoad = dynamicWorkloadTracker.get(teacher.id) || 0;
            const capacity = teacher.weeklyHourCapacity || 20;
            const score = currentLoad + (currentLoad >= capacity ? 1000 : 0);

            if (score < minScore) {
              minScore = score;
              bestTeacher = teacher;
            }
          }

          tid = bestTeacher ? bestTeacher.id : "t_default";
          const addedHours = Math.max(1, Number(cs.weeklyHours) || 1);
          dynamicWorkloadTracker.set(tid, (dynamicWorkloadTracker.get(tid) || 0) + addedHours);
        }
        return {
          ...cs,
          teacherId: tid,
          weeklyHours: Math.max(1, Number(cs.weeklyHours) || 1),
        };
      });

      effectiveClassSubjects.set(cls.id, validatedSubjects);
    }

    // ── 1 & 2. SLOTLARNI QURISH VA QULFLANGAN DARSLARNI TAYYORLASH ─────────────
    const { classSlots, allSlots, teacherOccupancy, teacherDailyHours } = buildClassSlots(
      this.input.classes,
      effectiveClassSubjects,
      this.daysCount,
      this.classMap,
      this.input.teachers,
      this.subjectMap,
      this.input.subjects,
      this.input.existingLessons,
      this.input.lockedClassIds,
      this.input.lockedTeacherIds,
      this.input.shifts
    );

    // ── 3. DARSLAR TALABINI YIG'ISH VA SARALASH ────────────────────────────────
    const remaining = prepareAndSortLessonRequests(
      this.input.classes,
      effectiveClassSubjects,
      classSlots,
      this.subjectMap
    );

    // ── 4. CHAQMOQDEK TEZ HEURISTIC BIRINCHI JOYLASHTIRISH ─────────────────────
    const unassignedReqs = executeGreedyPlacement(
      remaining,
      classSlots,
      this.classMap,
      this.teacherMap,
      this.subjectMap,
      this.daysCount,
      teacherOccupancy,
      teacherDailyHours,
      this.input.shifts,
      attempt
    );

    // ── 4.5. UNASSIGNED DARSLARNI BUMPING / REPAIR BILAN JOYLASHTIRISH ─────────
    executeKempeBumpingAndFallback(
      unassignedReqs,
      classSlots,
      this.classMap,
      this.teacherMap,
      this.subjectMap,
      this.daysCount,
      teacherOccupancy,
      this.input.shifts
    );

    // ── 5. TEZ VA KUCHLI MIN-CONFLICTS LOCAL SEARCH ────────────────────────────
    const globalClashes = executeMinConflictsLocalSearch(
      allSlots,
      classSlots,
      this.classMap,
      this.teacherMap,
      this.subjectMap,
      this.daysCount,
      teacherOccupancy,
      this.input.shifts
    );

    // ── 5.5. ZERO-GAP CLASS COMPACTION (Oraliq Darchalarni Siqish) ─────────────
    executeIntraDayCompaction(
      this.input.classes,
      classSlots,
      this.classMap,
      this.teacherMap,
      this.subjectMap,
      teacherOccupancy,
      this.input.shifts
    );

    // ── 5.6. CROSS-DAY GAP ELIMINATOR & ISOLATED LESSON RELOCATOR ──────────────
    executeCrossDayGapElimination(
      this.input.classes,
      classSlots,
      this.classMap,
      this.teacherMap,
      this.subjectMap,
      this.daysCount,
      teacherOccupancy,
      this.input.shifts
    );

    // ── 6. FINAL LESSON OBYEKTLARINI HOSIL QILISH VA AUDIT ─────────────────────
    const lessons: Lesson[] = [];
    let methodDayViolations = 0;
    const seenSlots = new Set<string>();

    for (const slot of allSlots) {
      if (!slot.teacherId || !slot.subjectId) continue;
      const slotKey = `${slot.classId}_${slot.day}_${slot.period}_${slot.groupType || "WHOLE"}`;
      if (seenSlots.has(slotKey)) continue;
      seenSlots.add(slotKey);

      const cls = this.classMap.get(slot.classId)!;

      if (
        !this.isTeacherSlotAvailable(
          slot.day,
          slot.period,
          slot.teacherId,
          slot.subjectId,
          resolveShiftGroup(slot.classId, this.classMap, this.input.shifts),
          slot.classId
        )
      ) {
        methodDayViolations++;
      }

      lessons.push({
        id: `l_${slot.classId}_${slot.subjectId}_${slot.day}_${slot.period}_${slot.groupType || "WHOLE"}`,
        scheduleId: "active_schedule",
        schoolId: cls.schoolId,
        classId: slot.classId,
        subjectId: slot.subjectId,
        teacherId: slot.teacherId,
        roomId: null,
        branchId: cls.branchId,
        dayOfWeek: slot.day,
        periodNumber: slot.period,
        groupType: slot.groupType,
        isLocked: slot.isLocked,
      });
    }

    let duplicateViolations = 0;
    const classDaySubjectMap = new Map<string, ClassDaySubInfo>();
    for (const l of lessons) {
      if (l.groupType === "GROUP_2") continue;
      const key = `${l.classId}|||${l.dayOfWeek}|||${l.subjectId}`;
      let info = classDaySubjectMap.get(key);
      if (!info) {
        info = { classId: l.classId, subjectId: l.subjectId, dayOfWeek: l.dayOfWeek, periods: [] };
        classDaySubjectMap.set(key, info);
      }
      info.periods.push(l.periodNumber);
    }

    classDaySubjectMap.forEach((info) => {
      if (info.periods.length > 1) {
        info.periods.sort((a, b) => a - b);
        const allowDouble = this.canSubjectHaveDoubleLesson(info.classId, info.subjectId);

        const isConsecutive = info.periods.length === 2 && info.periods[1] - info.periods[0] === 1;
        if (info.periods.length > 2 || !allowDouble || !isConsecutive) {
          duplicateViolations += info.periods.length - 1;
        }
      }
    });

    let totalCurriculumRequiredHours = 0;
    effectiveClassSubjects.forEach((subs) => {
      subs.forEach((s) => {
        totalCurriculumRequiredHours += Number(s.weeklyHours) || 0;
      });
    });

    const totalConflicts = globalClashes + methodDayViolations + duplicateViolations;

    return {
      success: totalConflicts === 0,
      lessons,
      unassignedLessons: [],
      stats: {
        totalRequiredHours: totalCurriculumRequiredHours || lessons.length,
        placedHours: lessons.length,
        score: Math.max(0, 100 - totalConflicts * 5),
        conflictsCount: totalConflicts,
      },
      explanation:
        totalConflicts === 0
          ? `✅ 100% Ziddiyatsiz (0 Kolliziyali va Metod Kunlari To'liq Saqlangan) Dars Jadvali Tayyor (${lessons.length} ta dars)`
          : `${totalConflicts} ta dars bo'yicha ziddiyat (kolliziya yoki metod kuni buzilishi) aniqlandi`,
    };
  }
}
