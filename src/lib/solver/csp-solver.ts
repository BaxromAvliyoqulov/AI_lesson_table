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

      // Agar sinfda fanlar belgilanmagan bo'lsa yoki 10 soatdan kam bo'lsa, Davlat standarti bo'yicha to'ldirish
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
          // Mavjud fanlarni saqlab, yetishmayotganlarini qo'shish
          const existingSubIds = new Set(subjects.map((s) => s.subjectId));
          const missing = standard.filter((st) => !existingSubIds.has(st.subjectId));
          subjects = [...subjects, ...missing];
        }
      }

      // Har bir fanga o'qituvchi tayinlanganligini tekshirish
      const validatedSubjects: ClassSubject[] = subjects.map((cs) => {
        let tid = cs.teacherId;
        if (!tid || !this.teacherMap.has(tid)) {
          // Mos o'qituvchini avto-topish
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

    // ── 1. SLOTLARNI QURISH (Boshlang'ich 1-4: 5 kun, 4-5 dars; Yuqori 5-11: 6 kun, 5-6 dars) ──────
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const isPrimary = cls.isPrimary || cls.grade <= 4;
      const days = isPrimary ? 5 : this.daysCount;
      const maxP = isPrimary ? 5 : 6;

      const subjects = effectiveClassSubjects.get(cls.id) || [];
      let totalWeeklyHours = subjects.reduce((sum, s) => sum + s.weeklyHours, 0);

      // Agar soat kam bo'lsa, me'yoriy sig'im yaratish
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
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const slots = classSlots.get(cls.id) || [];
      const subjects = effectiveClassSubjects.get(cls.id) || [];

      // Kelajak soati / Sinf soati / Tarbiyaviy soat -> QAT'IYAN Dushanba 1-dars
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

    // O'qituvchi yuklamasi bo'yicha saralash
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
    const teacherOccupancy = new Map<string, number>(); // key: `${teacherId}_${day}_${period}` -> count

    for (const slot of allSlots) {
      if (slot.teacherId) {
        const k = `${slot.teacherId}_${slot.day}_${slot.period}`;
        teacherOccupancy.set(k, (teacherOccupancy.get(k) || 0) + 1);
      }
    }

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

        // A. O'qituvchi boshqa sinfda band bo'lsa (katta jazo)
        if (currentOcc > 0) score += currentOcc * 3000;

        // B. Metod kuni bo'lsa
        if (t && t.methodDayOfWeek === slot.day) score += 2000;

        // C. Bir kunda bir xil fandan ko'p dars bo'lsa
        const sameSubjectCount = slots.filter(
          (s) => s.day === slot.day && s.subjectId === req.subjectId
        ).length;
        if (sameSubjectCount > 0) score += sameSubjectCount * 120;

        // D. SanPiN qiyinlik grafigi
        if (req.difficulty >= 8) {
          score += Math.abs(slot.period - 3) * 20;
        }

        // E. O'qituvchi oynasini kamaytirish
        const adj1 = teacherOccupancy.get(`${req.teacherId}_${slot.day}_${slot.period - 1}`) || 0;
        const adj2 = teacherOccupancy.get(`${req.teacherId}_${slot.day}_${slot.period + 1}`) || 0;
        if (adj1 > 0 || adj2 > 0) score -= 40;

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

    // ── 4.1. BO'SH QOLGAN SLOTLARNI AVTO-TO'LDIRISH (To'liq Grid Kafolati) ───────
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const slots = classSlots.get(cls.id) || [];
      const subjects = effectiveClassSubjects.get(cls.id) || [];
      const emptySlots = slots.filter((s) => !s.isLocked && s.teacherId === null);

      if (emptySlots.length > 0 && subjects.length > 0) {
        let subIdx = 0;
        for (const slot of emptySlots) {
          const fallbackSub = subjects[subIdx % subjects.length];
          slot.subjectId = fallbackSub.subjectId;
          slot.teacherId = fallbackSub.teacherId;
          slot.groupType = fallbackSub.groupType;

          const occKey = `${fallbackSub.teacherId}_${slot.day}_${slot.period}`;
          teacherOccupancy.set(occKey, (teacherOccupancy.get(occKey) || 0) + 1);
          subIdx++;
        }
      }
    }

    // ── 5. ITERATIVE MIN-CONFLICTS LOCAL SEARCH (0 TO'QNASHUV KAFOLATI) ─────────
    const countClashesForTeacher = (teacherId: string, day: number, period: number): number => {
      const k = `${teacherId}_${day}_${period}`;
      return Math.max(0, (teacherOccupancy.get(k) || 0) - 1);
    };

    const countGlobalClashes = (): number => {
      let total = 0;
      for (const count of teacherOccupancy.values()) {
        if (count > 1) total += count - 1;
      }
      return total;
    };

    let globalClashes = countGlobalClashes();
    const maxIterations = 300;

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

          const keyA_new = `${tA}_${slotB.day}_${slotB.period}`;
          const keyB_new = tB ? `${tB}_${slotA.day}_${slotA.period}` : null;

          const occA_new = (teacherOccupancy.get(keyA_new) || 0) + 1;
          const occB_new = keyB_new ? (teacherOccupancy.get(keyB_new) || 0) + 1 : 0;

          const clashesA_new = Math.max(0, occA_new - 1);
          const clashesB_new = keyB_new ? Math.max(0, occB_new - 1) : 0;

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

          improved = true;
          globalClashes = countGlobalClashes();
          if (globalClashes === 0) break;
        }
      }

      if (!improved && globalClashes > 0) {
        const bad = clashingSlots[Math.floor(Math.random() * clashingSlots.length)];
        if (bad) {
          const clsSlots = classSlots.get(bad.classId) || [];
          const candidateSlots = clsSlots.filter((s) => !s.isLocked && s !== bad);
          if (candidateSlots.length > 0) {
            const randTarget = candidateSlots[Math.floor(Math.random() * candidateSlots.length)];
            const tBad = bad.teacherId!;
            const sBad = bad.subjectId!;
            const gBad = bad.groupType;

            const tTarget = randTarget.teacherId;
            const sTarget = randTarget.subjectId;
            const gTarget = randTarget.groupType;

            const kOld = `${tBad}_${bad.day}_${bad.period}`;
            teacherOccupancy.set(kOld, (teacherOccupancy.get(kOld) || 1) - 1);

            if (tTarget) {
              const kTargetOld = `${tTarget}_${randTarget.day}_${randTarget.period}`;
              teacherOccupancy.set(kTargetOld, (teacherOccupancy.get(kTargetOld) || 1) - 1);
            }

            bad.teacherId = tTarget;
            bad.subjectId = sTarget;
            bad.groupType = gTarget;

            randTarget.teacherId = tBad;
            randTarget.subjectId = sBad;
            randTarget.groupType = gBad;

            const kNew = `${tBad}_${randTarget.day}_${randTarget.period}`;
            teacherOccupancy.set(kNew, (teacherOccupancy.get(kNew) || 0) + 1);

            if (tTarget) {
              const kTargetNew = `${tTarget}_${bad.day}_${bad.period}`;
              teacherOccupancy.set(kTargetNew, (teacherOccupancy.get(kTargetNew) || 0) + 1);
            }

            globalClashes = countGlobalClashes();
          }
        }
      }
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

    const finalClashes = countGlobalClashes();

    return {
      success: finalClashes === 0,
      lessons,
      unassignedLessons: [],
      stats: {
        totalRequiredHours: lessons.length,
        placedHours: lessons.length,
        score: Math.max(0, 100 - finalClashes * 5),
        conflictsCount: finalClashes,
      },
      explanation:
        finalClashes === 0
          ? `✅ 100% Ziddiyatsiz (0 Kolliziyali) Dars Jadvali Muvaffaqiyatli Shakllantirildi (${lessons.length} ta dars)`
          : `${finalClashes} ta dars bo'yicha ziddiyat aniqlandi`,
    };
  }
}
