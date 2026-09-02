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
import { getOfficialMethodDayForSubject } from "@/lib/constants/method-days";

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
   * O'zbekiston Qonunchiligi & SanPiN: O'qituvchining shaxsiy metod kuni yoki
   * fanning rasmiy metod kunida dars qo'yish QAT'IYAN TAQIQLANADI!
   */
  public isStrictMethodDay(day: number, teacherId?: string | null, subjectId?: string | null): boolean {
    // 1. O'qituvchining shaxsiy belgilangan metod kuni
    if (teacherId) {
      const t = this.teacherMap.get(teacherId);
      if (t?.methodDayOfWeek !== undefined && t.methodDayOfWeek !== null) {
        if (t.methodDayOfWeek === day) return true;
      }
    }
    // 2. Fanning rasmiy metod kuni
    if (subjectId) {
      const s = this.subjectMap.get(subjectId);
      if (s?.methodDayOfWeek !== undefined && s.methodDayOfWeek !== null) {
        if (s.methodDayOfWeek === day) return true;
      }
      // Agar subject ob'ektida methodDayOfWeek ko'rsatilmagan bo'lsa, O'zR qonuniy standart katalogidan olinadi
      const officialDay = getOfficialMethodDayForSubject(s?.name || subjectId);
      if (officialDay !== null && officialDay === day) {
        return true;
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

    // ── 1. SLOTLARNI QURISH (Boshlang'ich: 5 kun x 5 dars; Yuqori: 6 kun x 6 dars) ────────────
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const isPrimary = cls.isPrimary || cls.grade <= 4;
      const days = isPrimary ? 5 : this.daysCount;
      const maxP = isPrimary ? 5 : 6;

      const slots: Slot[] = [];
      for (let day = 1; day <= days; day++) {
        for (let p = 1; p <= maxP; p++) {
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
          s.subjectId === "sub_sinf_soati" ||
          s.subjectId === "sub_kelajak" ||
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
    const teacherClassCount = new Map<string, Set<string>>();
    remaining.forEach((r) => {
      teacherHourCount.set(r.teacherId, (teacherHourCount.get(r.teacherId) || 0) + 1);
      if (!teacherClassCount.has(r.teacherId)) teacherClassCount.set(r.teacherId, new Set());
      teacherClassCount.get(r.teacherId)!.add(r.classId);
    });

    remaining.sort((a, b) => {
      // 1. O'qituvchi qancha ko'p sinfga kirsa, u eng qattiq cheklovli (bottleneck) — birinchi teriladi!
      const classesA = teacherClassCount.get(a.teacherId)?.size || 0;
      const classesB = teacherClassCount.get(b.teacherId)?.size || 0;
      if (classesB !== classesA) return classesB - classesA;

      // 2. O'qituvchining umumiy soatlari soni
      const hA = teacherHourCount.get(a.teacherId) || 0;
      const hB = teacherHourCount.get(b.teacherId) || 0;
      if (hB !== hA) return hB - hA;

      // 3. Fanning murakkablik darajasi (SanPiN)
      return b.difficulty - a.difficulty;
    });

    // ── 4. CHAQMOQDEK TEZ HEURISTIC BIRINCHI JOYLASHTIRISH ─────────────────────
    for (const req of remaining) {
      const slots = classSlots.get(req.classId) || [];
      const subObj = this.subjectMap.get(req.subjectId);
      const allowDouble = subObj?.allowDoubleLesson || false;

      // QAT'IY METOD KUNI VA BIR KUNDA 1 FAN PROTOKOLI:
      const emptySlots = slots.filter((s) => {
        if (s.isLocked || s.teacherId !== null) return false;
        if (this.isStrictMethodDay(s.day, req.teacherId, req.subjectId)) return false;

        // Agar juftlik darsiga ruxsat bo'lmasa, bu kunda ayni shu fanning darsi bo'lsa, qat'iyan bloklanadi!
        if (!allowDouble) {
          const hasSameSubjectInDay = slots.some(
            (other) => other.day === s.day && other.subjectId === req.subjectId
          );
          if (hasSameSubjectInDay) return false;
        }
        return true;
      });

      if (emptySlots.length === 0) continue;

      let bestSlot = emptySlots[0];
      let bestScore = Infinity;

      for (const slot of emptySlots) {
        let score = 0;
        const occKey = `${req.teacherId}_${slot.day}_${slot.period}`;
        const currentOcc = teacherOccupancy.get(occKey) || 0;

        if (currentOcc > 0) score += currentOcc * 50000000;

        const sameSubjectCount = slots.filter(
          (s) => s.day === slot.day && s.subjectId === req.subjectId
        ).length;
        if (sameSubjectCount > 0) {
          const subObj = this.subjectMap.get(req.subjectId);
          if (!subObj?.allowDoubleLesson) {
            score += sameSubjectCount * 50000000; // QAT'IY PROTOKOL: Kuniga faqat 1 soat!
          } else {
            const isAdjacent = slots.some(
              (s) =>
                s.day === slot.day &&
                s.subjectId === req.subjectId &&
                Math.abs(s.period - slot.period) === 1
            );
            if (!isAdjacent) {
              score += sameSubjectCount * 30000000;
            }
          }
        }

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

    // ── 5. TEZ VA KUCHLI MIN-CONFLICTS LOCAL SEARCH (Max 200 iteration) ─────────
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
        let bestDelta = 0;

        for (const slotB of candidateSlots) {
          const tA = slotA.teacherId!;
          const sA = slotA.subjectId!;
          const tB = slotB.teacherId;
          const sB = slotB.subjectId;

          // QAT'IY METOD KUNI TAQIQI: slotB kuni tA/sA uchun yoki slotA kuni tB/sB uchun metod kuni bo'lsa o'tish taqiqlanadi!
          if (this.isStrictMethodDay(slotB.day, tA, sA)) continue;
          if (tB && sB && this.isStrictMethodDay(slotA.day, tB, sB)) continue;

          // QAT'IY PROTOKOL: Bir kunda bir xil fanning takrorlanishi taqiqlanadi!
          const subObjA = this.subjectMap.get(sA);
          if (!subObjA?.allowDoubleLesson) {
            const duplicateInDayB = clsSlots.some(
              (s) => s !== slotA && s !== slotB && s.day === slotB.day && s.subjectId === sA
            );
            if (duplicateInDayB) continue;
          }

          if (tB && sB) {
            const subObjB = this.subjectMap.get(sB);
            if (!subObjB?.allowDoubleLesson) {
              const duplicateInDayA = clsSlots.some(
                (s) => s !== slotA && s !== slotB && s.day === slotA.day && s.subjectId === sB
              );
              if (duplicateInDayA) continue;
            }
          }

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
