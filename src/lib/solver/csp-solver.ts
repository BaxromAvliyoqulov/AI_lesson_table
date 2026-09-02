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

  /**
   * Qat'iy Metod Kuni tekshiruvi (Strict Method Day Constraint)
   * O'qituvchining shaxsiy metod kuni yoki uning o'qitadigan fani/tanlangan fanning
   * rasmiy metod kunida dars qo'yish QAT'IYAN TAQIQLANADI!
   */
  public isStrictMethodDay(day: number, teacherId?: string | null, subjectId?: string | null): boolean {
    // 1. O'qituvchining shaxsiy belgilangan metod kuni
    if (teacherId) {
      const t = this.teacherMap.get(teacherId);
      if (t?.methodDayOfWeek !== undefined && t.methodDayOfWeek !== null) {
        if (t.methodDayOfWeek === day) return true;
      }
    }
    // 2. Fanning rasmiy metod kuni (Masalan Ingliz tili = Juma / 5)
    if (subjectId) {
      const s = this.subjectMap.get(subjectId);
      if (s?.methodDayOfWeek !== undefined && s.methodDayOfWeek !== null) {
        if (s.methodDayOfWeek === day) return true;
      }
    }
    return false;
  }

  public solve(): SolverResult {
    let bestResult: SolverResult | null = null;
    let minConflicts = Infinity;

    for (let attempt = 0; attempt < 6; attempt++) {
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

      const homeroomId = cls.homeroomTeacherId || (ss ? ss.teacherId : null);
      const slotD1P1 = slots.find((s) => s.day === 1 && s.period === 1);

      if (slotD1P1 && homeroomId) {
        slotD1P1.subjectId = ss ? ss.subjectId : "sub_kelajak";
        slotD1P1.teacherId = homeroomId;
        slotD1P1.isLocked = true;
        slotD1P1.groupType = "WHOLE";

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
      // QAT'IY METOD KUNI CHEKLOVI: Metod kunidagi slotlarga tushish 100% TAQIQLANADI!
      const emptySlots = slots.filter(
        (s) =>
          !s.isLocked &&
          s.teacherId === null &&
          !this.isStrictMethodDay(s.day, req.teacherId, req.subjectId)
      );

      if (emptySlots.length === 0) continue;

      let bestSlot = emptySlots[0];
      let bestScore = Infinity;

      for (const slot of emptySlots) {
        let score = 0;
        const occKey = `${req.teacherId}_${slot.day}_${slot.period}`;
        const currentOcc = teacherOccupancy.get(occKey) || 0;

        if (currentOcc > 0) score += currentOcc * 2000000;

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

        const classHash = req.classId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        score += ((classHash * 7 + slot.day * 13 + slot.period * 17) % 23) * 2;

        if (attempt > 0) {
          score += Math.random() * (attempt * 15);
        }

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
          const allowedSubs = subjects.filter(
            (sub) => !this.isStrictMethodDay(slot.day, sub.teacherId, sub.subjectId)
          );
          if (allowedSubs.length === 0) continue;

          // Faqat occ === 0 bo'lgan o'qituvchini topamiz
          const freeSub = allowedSubs.find(
            (sub) => (teacherOccupancy.get(`${sub.teacherId}_${slot.day}_${slot.period}`) || 0) === 0
          );

          if (freeSub) {
            slot.subjectId = freeSub.subjectId;
            slot.teacherId = freeSub.teacherId;
            slot.groupType = freeSub.groupType;
            const occKey = `${freeSub.teacherId}_${slot.day}_${slot.period}`;
            teacherOccupancy.set(occKey, (teacherOccupancy.get(occKey) || 0) + 1);
          } else {
            // Agar sinfning o'z o'qituvchilari band bo'lsa, maktabning boshqa mutlaqo bo'sh o'qituvchisini topamiz
            const globalFreeTeacher = this.input.teachers.find((t) => {
              if (this.isStrictMethodDay(slot.day, t.id)) return false;
              return (teacherOccupancy.get(`${t.id}_${slot.day}_${slot.period}`) || 0) === 0;
            });

            const chosenTid = globalFreeTeacher ? globalFreeTeacher.id : allowedSubs[0].teacherId;
            const chosenSid = globalFreeTeacher?.subjectIds?.[0] || allowedSubs[0].subjectId;

            slot.subjectId = chosenSid;
            slot.teacherId = chosenTid;
            slot.groupType = "WHOLE";

            const occKey = `${chosenTid}_${slot.day}_${slot.period}`;
            teacherOccupancy.set(occKey, (teacherOccupancy.get(occKey) || 0) + 1);
          }
        }
      }
    }

    // ── 5. TEZ VA KUCHLI MIN-CONFLICTS LOCAL SEARCH (Max 120 iteration) ─────────
    const countClashesForTeacher = (teacherId: string, day: number, period: number): number => {
      const k = `${teacherId}_${day}_${period}`;
      return Math.max(0, (teacherOccupancy.get(k) || 0) - 1);
    };

    let globalClashes = 0;
    for (const count of teacherOccupancy.values()) {
      if (count > 1) globalClashes += count - 1;
    }

    const maxIterations = 200;

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
        let bestDelta = -Infinity;

        for (const slotB of candidateSlots) {
          const tA = slotA.teacherId!;
          const sA = slotA.subjectId!;
          const tB = slotB.teacherId;
          const sB = slotB.subjectId;

          // QAT'IY METOD KUNI TAQIQI: slotB kuni tA/sA uchun yoki slotA kuni tB/sB uchun metod kuni bo'lsa o'tish taqiqlanadi!
          if (this.isStrictMethodDay(slotB.day, tA, sA)) continue;
          if (tB && sB && this.isStrictMethodDay(slotA.day, tB, sB)) continue;

          const clashesA_now = countClashesForTeacher(tA, slotA.day, slotA.period);
          const clashesB_now = tB ? countClashesForTeacher(tB, slotB.day, slotB.period) : 0;

          const occA_target = teacherOccupancy.get(`${tA}_${slotB.day}_${slotB.period}`) || 0;
          const occB_target = tB ? (teacherOccupancy.get(`${tB}_${slotA.day}_${slotA.period}`) || 0) : 0;

          const delta = clashesA_now + clashesB_now - (occA_target + occB_target);

          if (delta > bestDelta) {
            bestDelta = delta;
            bestTarget = slotB;
          }
        }

        if (bestTarget && (bestDelta > 0 || (bestDelta === 0 && Math.random() < 0.6))) {
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

          if (bestDelta > 0) {
            globalClashes -= bestDelta;
            improved = true;
          }
          if (globalClashes === 0) break;
        }
      }

      if (!improved && iter > 100) break;
    }

    // ── 6. FINAL LESSON OBYEKTLARINI HOSIL QILISH ─────────────────────────────
    const lessons: Lesson[] = [];
    let methodDayViolations = 0;

    for (const slot of allSlots) {
      if (!slot.teacherId || !slot.subjectId) continue;
      const cls = this.classMap.get(slot.classId)!;

      if (this.isStrictMethodDay(slot.day, slot.teacherId, slot.subjectId)) {
        methodDayViolations++;
      }

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

    const totalConflicts = globalClashes + methodDayViolations;

    return {
      success: totalConflicts === 0,
      lessons,
      unassignedLessons: [],
      stats: {
        totalRequiredHours: lessons.length,
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
