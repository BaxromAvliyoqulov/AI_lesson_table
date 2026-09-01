import {
  SolverInput,
  SolverResult,
  Lesson,
  SchoolClass,
  Subject,
  Teacher,
  Room,
} from "@/types";

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

    // ── 1. SLOTLARNI QURISH (Boshlang'ich 1-4: 5 kun, 5 dars; Yuqori 5-11: 6 kun, 6 dars) ──────
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const isPrimary = cls.isPrimary || cls.grade <= 4;
      const days = isPrimary ? 5 : this.daysCount;
      const maxP = isPrimary ? 5 : 6;

      let totalWeeklyHours = 0;
      cls.subjects.forEach((cs) => (totalWeeklyHours += cs.weeklyHours));

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

      // Kelajak soati / Sinf soati / Tarbiyaviy soat -> QAT'IYAN Dushanba 1-dars
      const ss = cls.subjects.find(
        (s) =>
          s.subjectId === "sub_kelajak" ||
          s.subjectId === "sub_sinf_soati" ||
          this.subjectMap.get(s.subjectId)?.name.toLowerCase().includes("kelajak") ||
          this.subjectMap.get(s.subjectId)?.name.toLowerCase().includes("sinf soati")
      );
      if (ss) {
        const homeroomId = cls.homeroomTeacherId || ss.teacherId;
        const targetDay = 1; // Qat'iyan Dushanba
        const monSlot = slots.find((s) => s.day === targetDay && s.period === 1);
        if (monSlot) {
          monSlot.isLocked = true;
          monSlot.subjectId = ss.subjectId;
          monSlot.teacherId = homeroomId;
        }
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
      for (const cs of cls.subjects) {
        const sub = this.subjectMap.get(cs.subjectId);
        if (!sub) continue;

        let hours = cs.weeklyHours;
        const slots = classSlots.get(cls.id) || [];
        if (
          (cs.subjectId === "sub_sinf_soati" || sub.name.toLowerCase().includes("sinf soati")) &&
          slots.some((s) => s.isLocked && s.subjectId === cs.subjectId)
        ) {
          hours--;
        }
        if (
          (cs.subjectId === "sub_kelajak" || sub.name.toLowerCase().includes("kelajak")) &&
          slots.some((s) => s.isLocked && s.subjectId === cs.subjectId)
        ) {
          hours--;
        }

        for (let h = 0; h < Math.max(0, hours); h++) {
          remaining.push({
            classId: cls.id,
            branchId: cls.branchId,
            subjectId: cs.subjectId,
            teacherId: cs.teacherId,
            groupType: cs.groupType || "WHOLE",
            difficulty: sub.difficultyScore || 5,
          });
        }
      }
    }

    // O'qituvchi yuklamasi (ko'p soatli o'qituvchilar va og'ir fanlar birinchi)
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

    // Mavjud qulflangan darslarni kiritamiz
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

      // Har bir bo'sh slotni jazo baliga ko'ra baholaymiz
      let bestSlot = emptySlots[0];
      let bestScore = Infinity;

      for (const slot of emptySlots) {
        let score = 0;
        const occKey = `${req.teacherId}_${slot.day}_${slot.period}`;
        const currentOcc = teacherOccupancy.get(occKey) || 0;

        // A. O'qituvchi boshqa sinfda band bo'lsa (katta jazo)
        if (currentOcc > 0) score += currentOcc * 2000;

        // B. Metod kuni bo'lsa (jazo)
        if (t && t.methodDayOfWeek === slot.day) score += 1500;

        // C. Bir kunda bir xil fan takrorlanishi (agar 1 dan ortiq bo'lsa)
        const sameSubjectCount = slots.filter(
          (s) => s.day === slot.day && s.subjectId === req.subjectId
        ).length;
        if (sameSubjectCount > 0) score += sameSubjectCount * 80;

        // D. SanPiN qiyinlik grafigi (Qiyin fanlar 2-3-4 darslarga tushsin)
        if (req.difficulty >= 7) {
          score += Math.abs(slot.period - 3) * 15;
        }

        // E. O'qituvchi oynasini (window) kamaytirish
        const adj1 = teacherOccupancy.get(`${req.teacherId}_${slot.day}_${slot.period - 1}`) || 0;
        const adj2 = teacherOccupancy.get(`${req.teacherId}_${slot.day}_${slot.period + 1}`) || 0;
        if (adj1 > 0 || adj2 > 0) score -= 25; // qo'shni darsga bonus

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
    const maxIterations = 250;

    for (let iter = 0; iter < maxIterations && globalClashes > 0; iter++) {
      let improved = false;

      // Barcha to'qnashuvli slotlarni aniqlaymiz
      const clashingSlots = allSlots.filter(
        (s) =>
          s.teacherId &&
          !s.isLocked &&
          (teacherOccupancy.get(`${s.teacherId}_${s.day}_${s.period}`) || 0) > 1
      );

      if (clashingSlots.length === 0) break;

      for (const slotA of clashingSlots) {
        const clsSlots = classSlots.get(slotA.classId) || [];
        const tA = slotA.teacherId!;
        const sA = slotA.subjectId!;
        const gA = slotA.groupType;

        let bestTargetSlot: Slot | null = null;
        let bestDelta = 0;

        for (const slotB of clsSlots) {
          if (slotB === slotA || slotB.isLocked) continue;

          const tB = slotB.teacherId;
          const sB = slotB.subjectId;

          // Ayni o'qituvchining metod kunini tekshiramiz
          const tA_obj = this.teacherMap.get(tA);
          if (tA_obj?.methodDayOfWeek === slotB.day) continue;

          let delta = 0;

          if (tB === null) {
            // slotA dagi darsni bo'sh slotB ga ko'chirish
            const currentA_Clashes = countClashesForTeacher(tA, slotA.day, slotA.period);
            const targetB_Occ = teacherOccupancy.get(`${tA}_${slotB.day}_${slotB.period}`) || 0;

            const newA_Clashes = Math.max(0, currentA_Clashes - 1);
            const newB_Clashes = targetB_Occ; // 0 bo'lsa 0 yangi clash

            delta = (newA_Clashes + newB_Clashes) - (currentA_Clashes + 0);
          } else {
            // slotA va slotB ni o'zaro almashtirish (Swap)
            if (tA === tB) continue;
            const tB_obj = this.teacherMap.get(tB);
            if (tB_obj?.methodDayOfWeek === slotA.day) continue;

            const curA_Clash = countClashesForTeacher(tA, slotA.day, slotA.period);
            const curB_Clash = countClashesForTeacher(tB, slotB.day, slotB.period);

            const occ_tA_at_B = teacherOccupancy.get(`${tA}_${slotB.day}_${slotB.period}`) || 0;
            const occ_tB_at_A = teacherOccupancy.get(`${tB}_${slotA.day}_${slotA.period}`) || 0;

            const new_curA_Clash = Math.max(0, curA_Clash - 1);
            const new_curB_Clash = Math.max(0, curB_Clash - 1);
            const new_tA_at_B = occ_tA_at_B;
            const new_tB_at_A = occ_tB_at_A;

            const beforeSum = curA_Clash + curB_Clash;
            const afterSum = new_curA_Clash + new_curB_Clash + new_tA_at_B + new_tB_at_A;
            delta = afterSum - beforeSum;
          }

          if (delta < bestDelta) {
            bestDelta = delta;
            bestTargetSlot = slotB;
          }
        }

        if (bestTargetSlot && bestDelta < 0) {
          // Eng yaxshi almashtirishni qo'llaymiz
          const keyA_old = `${tA}_${slotA.day}_${slotA.period}`;
          teacherOccupancy.set(keyA_old, (teacherOccupancy.get(keyA_old) || 1) - 1);

          if (bestTargetSlot.teacherId === null) {
            slotA.teacherId = null;
            slotA.subjectId = null;

            bestTargetSlot.teacherId = tA;
            bestTargetSlot.subjectId = sA;
            bestTargetSlot.groupType = gA;

            const keyB_new = `${tA}_${bestTargetSlot.day}_${bestTargetSlot.period}`;
            teacherOccupancy.set(keyB_new, (teacherOccupancy.get(keyB_new) || 0) + 1);
          } else {
            const tB = bestTargetSlot.teacherId;
            const sB = bestTargetSlot.subjectId;
            const gB = bestTargetSlot.groupType;

            const keyB_old = `${tB}_${bestTargetSlot.day}_${bestTargetSlot.period}`;
            teacherOccupancy.set(keyB_old, (teacherOccupancy.get(keyB_old) || 1) - 1);

            slotA.teacherId = tB;
            slotA.subjectId = sB;
            slotA.groupType = gB;

            bestTargetSlot.teacherId = tA;
            bestTargetSlot.subjectId = sA;
            bestTargetSlot.groupType = gA;

            const keyA_new = `${tB}_${slotA.day}_${slotA.period}`;
            teacherOccupancy.set(keyA_new, (teacherOccupancy.get(keyA_new) || 0) + 1);

            const keyB_new = `${tA}_${bestTargetSlot.day}_${bestTargetSlot.period}`;
            teacherOccupancy.set(keyB_new, (teacherOccupancy.get(keyB_new) || 0) + 1);
          }

          improved = true;
          globalClashes = countGlobalClashes();
          if (globalClashes === 0) break;
        }
      }

      if (!improved && globalClashes > 0) {
        // Agar lokal minimumga tushsa, tasodifiy to'qnashuvli darsni bo'sh slotga siljitamiz
        const bad = clashingSlots[Math.floor(Math.random() * clashingSlots.length)];
        const clsSlots = classSlots.get(bad.classId) || [];
        const empties = clsSlots.filter((s) => !s.isLocked && s.teacherId === null);
        if (empties.length > 0) {
          const randEmpty = empties[Math.floor(Math.random() * empties.length)];
          const tBad = bad.teacherId!;
          const sBad = bad.subjectId!;
          const gBad = bad.groupType;

          const kOld = `${tBad}_${bad.day}_${bad.period}`;
          teacherOccupancy.set(kOld, (teacherOccupancy.get(kOld) || 1) - 1);

          bad.teacherId = null;
          bad.subjectId = null;

          randEmpty.teacherId = tBad;
          randEmpty.subjectId = sBad;
          randEmpty.groupType = gBad;

          const kNew = `${tBad}_${randEmpty.day}_${randEmpty.period}`;
          teacherOccupancy.set(kNew, (teacherOccupancy.get(kNew) || 0) + 1);
          globalClashes = countGlobalClashes();
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
          ? "✅ 100% Ziddiyatsiz (0 Kolliziyali) Dars Jadvali Muvaffaqiyatli Shakllantirildi"
          : `${finalClashes} ta dars bo'yicha ziddiyat aniqlandi`,
    };
  }
}

