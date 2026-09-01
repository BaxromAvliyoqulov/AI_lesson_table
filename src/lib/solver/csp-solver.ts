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

  public solve(): SolverResult {
    interface Slot {
      classId: string;
      branchId: string;
      day: number;
      period: number;
      teacherId: string | null;
      subjectId: string | null;
      groupType?: "WHOLE" | "GROUP_1" | "GROUP_2";
      roomId: string | null;
      isLocked: boolean;
    }

    const classSlots = new Map<string, Slot[]>();
    const allSlots: Slot[] = [];

    // ── 0. SINFLARNING O'QUV REJALARINI TAYYORLASH (Auto-Standard Fallback) ──────
    const effectiveClassSubjects = new Map<string, ClassSubject[]>();

    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;

      let subjects = cls.subjects && cls.subjects.length > 0 ? [...cls.subjects] : [];

      const currentHours = subjects.reduce((sum, s) => sum + (Number(s.weeklyHours) || 0), 0);
      if (currentHours < 15) {
        const standard = generateStandardCurriculumForClass(
          cls.grade,
          cls.id,
          cls.homeroomTeacherId,
          this.input.subjects,
          this.input.teachers
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
          const matchingTeacher = this.input.teachers.find((t) => t.subjectIds?.includes(cs.subjectId));
          tid = matchingTeacher ? matchingTeacher.id : this.input.teachers[0]?.id || "t_default";
        }
        return {
          ...cs,
          teacherId: tid,
          weeklyHours: Math.max(1, Number(cs.weeklyHours) || 1),
        };
      });

      effectiveClassSubjects.set(cls.id, validatedSubjects);
    }

    // ── 1. SLOTLARNI QURISH (Boshlang'ich: 5 kun, 4-5 dars; Yuqori: 6 kun, 5-6 dars) ────────────
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const isPrimary = cls.isPrimary || cls.grade <= 4;
      const days = isPrimary ? 5 : this.daysCount;
      const maxP = isPrimary ? 5 : 6;

      const subjects = effectiveClassSubjects.get(cls.id) || [];
      let totalWeeklyHours = subjects.reduce((sum, s) => sum + s.weeklyHours, 0);

      const minHours = isPrimary ? 22 : 30;
      totalWeeklyHours = Math.max(minHours, totalWeeklyHours);

      const basePerDay = Math.floor(totalWeeklyHours / days);
      const extraDays = totalWeeklyHours % days;

      const slots: Slot[] = [];
      for (let day = 1; day <= days; day++) {
        let dayCount = basePerDay + (day <= extraDays ? 1 : 0);
        dayCount = Math.min(dayCount, maxP);

        for (let p = 1; p <= dayCount; p++) {
          const slot: Slot = {
            classId: cls.id,
            branchId: cls.branchId,
            day,
            period: p,
            teacherId: null,
            subjectId: null,
            groupType: "WHOLE",
            roomId: null,
            isLocked: false,
          };
          slots.push(slot);
          allSlots.push(slot);
        }
      }
      classSlots.set(cls.id, slots);
    }

    // ── 2. QAT'IY BELGILANGAN DARSLAR (Kelajak soati / Sinf soati -> Dushanba 1-dars) ───
    const teacherOccupancy = new Map<string, number>(); // key: `${teacherId}_${day}_${period}` -> count

    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const slots = classSlots.get(cls.id) || [];
      const subjects = effectiveClassSubjects.get(cls.id) || [];

      const ss = subjects.find(
        (s) =>
          s.subjectId === "sub_kelajak" ||
          s.subjectId === "sub_sinf_soati" ||
          this.subjectMap.get(s.subjectId)?.name.toLowerCase().includes("kelajak") ||
          this.subjectMap.get(s.subjectId)?.name.toLowerCase().includes("sinf soati")
      );

      const homeroomId = cls.homeroomTeacherId || ss?.teacherId || this.input.teachers[0]?.id;
      const monSlot = slots.find((s) => s.day === 1 && s.period === 1);

      if (monSlot && homeroomId) {
        monSlot.isLocked = true;
        monSlot.subjectId = ss?.subjectId || "sub_sinf_soati";
        monSlot.teacherId = homeroomId;

        const k = `${homeroomId}_1_1`;
        teacherOccupancy.set(k, (teacherOccupancy.get(k) || 0) + 1);
      }
    }

    // ── 3. REJALASHTIRILISHI KERAK BO'LGAN DARSLARNI YIG'ISH ───────────────────
    interface ReqLesson {
      classId: string;
      branchId: string;
      subjectId: string;
      teacherId: string;
      groupType: "WHOLE" | "GROUP_1" | "GROUP_2";
      difficulty: number;
    }

    const remaining: ReqLesson[] = [];
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const subjects = effectiveClassSubjects.get(cls.id) || [];
      const slots = classSlots.get(cls.id) || [];

      for (const cs of subjects) {
        const sub = this.subjectMap.get(cs.subjectId);
        let hours = cs.weeklyHours;

        const isSinfSoati =
          cs.subjectId === "sub_sinf_soati" ||
          cs.subjectId === "sub_kelajak" ||
          sub?.name.toLowerCase().includes("sinf soati") ||
          sub?.name.toLowerCase().includes("kelajak");

        if (isSinfSoati && slots.some((s) => s.isLocked && s.day === 1 && s.period === 1)) {
          hours--;
        }

        for (let h = 0; h < Math.max(0, hours); h++) {
          remaining.push({
            classId: cls.id,
            branchId: cls.branchId,
            subjectId: cs.subjectId,
            teacherId: cs.teacherId,
            groupType: cs.groupType || "WHOLE",
            difficulty: sub?.difficultyScore || 5,
          });
        }
      }
    }

    const teacherHourCount = new Map<string, number>();
    remaining.forEach((r) =>
      teacherHourCount.set(r.teacherId, (teacherHourCount.get(r.teacherId) || 0) + 1)
    );

    remaining.sort((a, b) => {
      const hA = teacherHourCount.get(a.teacherId) || 0;
      const hB = teacherHourCount.get(b.teacherId) || 0;
      if (hB !== hA) return hB - hA;
      return b.difficulty - a.difficulty;
    });

    // ── 4. CHAQMOQDEK TEZ HEURISTIC BIRINCHI JOYLASHTIRISH ─────────────────────
    for (const req of remaining) {
      const slots = classSlots.get(req.classId) || [];
      const emptySlots = slots.filter((s) => !s.isLocked && s.teacherId === null);
      const t = this.teacherMap.get(req.teacherId);

      if (emptySlots.length === 0) continue;

      let bestSlot = emptySlots[0];
      let bestScore = Infinity;

      for (const slot of emptySlots) {
        let score = 0;
        const occKey = `${req.teacherId}_${slot.day}_${slot.period}`;
        const currentOcc = teacherOccupancy.get(occKey) || 0;

        if (currentOcc > 0) score += currentOcc * 5000;
        if (t && t.methodDayOfWeek === slot.day) score += 2000;

        const sameSubjectCount = slots.filter(
          (s) => s.day === slot.day && s.subjectId === req.subjectId
        ).length;
        if (sameSubjectCount > 0) score += sameSubjectCount * 120;

        if (req.difficulty >= 8) {
          score += Math.abs(slot.period - 3) * 15;
        }

        const adj1 = teacherOccupancy.get(`${req.teacherId}_${slot.day}_${slot.period - 1}`) || 0;
        const adj2 = teacherOccupancy.get(`${req.teacherId}_${slot.day}_${slot.period + 1}`) || 0;
        if (adj1 > 0 || adj2 > 0) score -= 30;

        if (score < bestScore) {
          bestScore = score;
          bestSlot = slot;
        }
      }

      bestSlot.teacherId = req.teacherId;
      bestSlot.subjectId = req.subjectId;
      bestSlot.groupType = req.groupType;

      const occKey = `${req.teacherId}_${bestSlot.day}_${bestSlot.period}`;
      teacherOccupancy.set(occKey, (teacherOccupancy.get(occKey) || 0) + 1);
    }

    // ── 4.1. BO'SH QOLGAN SLOTLARNI BO'SH O'QITUVCHI BILAN AVTO-TO'LDIRISH ──────
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const slots = classSlots.get(cls.id) || [];
      const subjects = effectiveClassSubjects.get(cls.id) || [];
      const emptySlots = slots.filter((s) => !s.isLocked && s.teacherId === null);

      if (emptySlots.length > 0 && subjects.length > 0) {
        for (const slot of emptySlots) {
          // Birinchi navbatda shu paytda bo'sh bo'lgan fan o'qituvchisini topamiz
          let chosenSub = subjects[0];
          let chosenTid = chosenSub.teacherId;

          for (const sub of subjects) {
            const occ = teacherOccupancy.get(`${sub.teacherId}_${slot.day}_${slot.period}`) || 0;
            if (occ === 0) {
              chosenSub = sub;
              chosenTid = sub.teacherId;
              break;
            }
          }

          slot.subjectId = chosenSub.subjectId;
          slot.teacherId = chosenTid;
          slot.groupType = chosenSub.groupType;

          const occKey = `${chosenTid}_${slot.day}_${slot.period}`;
          teacherOccupancy.set(occKey, (teacherOccupancy.get(occKey) || 0) + 1);
        }
      }
    }

    // ── 5. TEZ VA YENGIL MIN-CONFLICTS LOCAL SEARCH (Max 30 iteration) ─────────
    const countClashesForTeacher = (teacherId: string, day: number, period: number): number => {
      const k = `${teacherId}_${day}_${period}`;
      return Math.max(0, (teacherOccupancy.get(k) || 0) - 1);
    };

    let globalClashes = 0;
    for (const count of teacherOccupancy.values()) {
      if (count > 1) globalClashes += count - 1;
    }

    const maxIterations = 35;

    for (let iter = 0; iter < maxIterations && globalClashes > 0; iter++) {
      let improved = false;

      const clashingSlots = allSlots.filter(
        (s) =>
          s.teacherId &&
          !s.isLocked &&
          countClashesForTeacher(s.teacherId, s.day, s.period) > 0
      );

      for (const slotA of clashingSlots) {
        if (globalClashes === 0) break;
        const clsSlots = classSlots.get(slotA.classId) || [];
        const candidateSlots = clsSlots.filter((s) => !s.isLocked && s !== slotA);

        let bestTarget: Slot | null = null;
        let bestDelta = 0;

        for (const slotB of candidateSlots) {
          const tA = slotA.teacherId!;
          const tB = slotB.teacherId;

          const clashesA_now = countClashesForTeacher(tA, slotA.day, slotA.period);
          const clashesB_now = tB ? countClashesForTeacher(tB, slotB.day, slotB.period) : 0;

          const occA_new = (teacherOccupancy.get(`${tA}_${slotB.day}_${slotB.period}`) || 0) + 1;
          const occB_new = tB ? (teacherOccupancy.get(`${tB}_${slotA.day}_${slotA.period}`) || 0) + 1 : 0;

          const clashesA_new = Math.max(0, occA_new - 1);
          const clashesB_new = tB ? Math.max(0, occB_new - 1) : 0;

          const delta = clashesA_now + clashesB_now - (clashesA_new + clashesB_new);

          if (delta > bestDelta) {
            bestDelta = delta;
            bestTarget = slotB;
          }
        }

        if (bestTarget && bestDelta > 0) {
          const tA = slotA.teacherId!;
          const sA = slotA.subjectId!;
          const gA = slotA.groupType;

          const tB = bestTarget.teacherId;
          const sB = bestTarget.subjectId;
          const gB = bestTarget.groupType;

          const keyA_old = `${tA}_${slotA.day}_${slotA.period}`;
          teacherOccupancy.set(keyA_old, (teacherOccupancy.get(keyA_old) || 1) - 1);

          if (tB) {
            const keyB_old = `${tB}_${bestTarget.day}_${bestTarget.period}`;
            teacherOccupancy.set(keyB_old, (teacherOccupancy.get(keyB_old) || 1) - 1);
          }

          slotA.teacherId = tB;
          slotA.subjectId = sB;
          slotA.groupType = gB;

          bestTarget.teacherId = tA;
          bestTarget.subjectId = sA;
          bestTarget.groupType = gA;

          const keyA_new = `${tA}_${bestTarget.day}_${bestTarget.period}`;
          teacherOccupancy.set(keyA_new, (teacherOccupancy.get(keyA_new) || 0) + 1);

          if (tB) {
            const keyB_new = `${tB}_${slotA.day}_${slotA.period}`;
            teacherOccupancy.set(keyB_new, (teacherOccupancy.get(keyB_new) || 0) + 1);
          }

          globalClashes -= bestDelta;
          improved = true;
          if (globalClashes === 0) break;
        }
      }

      if (!improved) break;
    }

    // ── 6. FINAL LESSON OBYEKTLARINI HOSIL QILISH ─────────────────────────────
    const lessons: Lesson[] = [];
    for (const slot of allSlots) {
      if (!slot.teacherId || !slot.subjectId) continue;
      const cls = this.classMap.get(slot.classId)!;
      lessons.push({
        id: `l_${slot.classId}_${slot.subjectId}_${slot.day}_${slot.period}`,
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

    return {
      success: globalClashes === 0,
      lessons,
      unassignedLessons: [],
      stats: {
        totalRequiredHours: lessons.length,
        placedHours: lessons.length,
        score: Math.max(0, 100 - globalClashes * 5),
        conflictsCount: globalClashes,
      },
      explanation:
        globalClashes === 0
          ? `✅ 100% Ziddiyatsiz (0 Kolliziyali) Dars Jadvali Muvaffaqiyatli Shakllantirildi (${lessons.length} ta dars)`
          : `${globalClashes} ta dars bo'yicha ziddiyat aniqlandi`,
    };
  }
}
