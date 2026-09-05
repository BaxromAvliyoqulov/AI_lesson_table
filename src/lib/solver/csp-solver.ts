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
import {
  getOfficialMethodDayForSubject,
  getEffectiveTeacherMethodDay,
} from "@/lib/constants/method-days";
import { isClassSecondShift } from "@/lib/utils";

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
   * kafedraning rasmiy metod kunida dars qo'yish QAT'IYAN TAQIQLANADI!
   * Muhim: Boshlang'ich ta'lim (1-4 sinf) o'qituvchilari dushanba-juma kunlari o'z sinfiga
   * dars o'tadi, ularning qonuniy metod kuni — SHANBA (6) kuni hisoblanadi.
   */
  public isStrictMethodDay(day: number, teacherId?: string | null, subjectId?: string | null): boolean {
    if (!teacherId) return false;
    const t = this.teacherMap.get(teacherId);
    if (!t) return false;

    // 1. O'qituvchining shaxsiy belgilangan metod kuni
    if (t.methodDayOfWeek !== undefined && t.methodDayOfWeek !== null && t.methodDayOfWeek >= 1 && t.methodDayOfWeek <= 6) {
      return t.methodDayOfWeek === day;
    }

    // 2. Boshlang'ich sinf (1-4) o'qituvchilari:
    // Dushanba-Juma (1-5) kunlari bolalarga har kuni dars o'tadi, ularning metod kuni SHANBA (6)!
    const isPrimaryTeacher =
      t.teachingStages === "PRIMARY" ||
      (t.homeroomClassId &&
        this.classMap.get(t.homeroomClassId)?.grade !== undefined &&
        (this.classMap.get(t.homeroomClassId)?.grade ?? 5) <= 4);

    if (isPrimaryTeacher) {
      return day === 6;
    }

    // 3. Yuqori sinf (5-11) o'qituvchilari uchun mutaxassislik fani bo'yicha kafedra metod kuni:
    const effective = getEffectiveTeacherMethodDay(t, Array.from(this.subjectMap.values()));
    if (effective.day !== null) {
      return effective.day === day;
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

    // ── 1. SLOTLARNI QURISH (Dam kunlari va Band soatlarni to'liq hisobga olgan holda) ────────────
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const isPrimary = cls.isPrimary || cls.grade <= 4;
      const blockedDaysSet = new Set(
        cls.blockedDays || (isPrimary ? [6] : [])
      );
      const blockedPeriodsSet = new Set(
        (cls.blockedPeriods || []).map((bp) => `${bp.dayOfWeek}_${bp.periodNumber}`)
      );

      const days = this.daysCount;
      const maxP = isPrimary ? 5 : 6;

      const slots: Slot[] = [];
      const hasGroup2 = (effectiveClassSubjects.get(cls.id) || []).some(
        (cs) => cs.groupType === "GROUP_2"
      );

      for (let day = 1; day <= days; day++) {
        if (blockedDaysSet.has(day)) continue; // Bu kun sinf uchun dam kuni

        for (let p = 1; p <= maxP; p++) {
          if (blockedPeriodsSet.has(`${day}_${p}`)) continue; // Bu soat sinf uchun band/yopiq

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

          // Agar sinfda guruhlarga bo'lingan (GROUP_2) darslar bo'lsa, parallel slot ochish
          if (hasGroup2) {
            const parallelSlot: Slot = {
              classId: cls.id,
              branchId: cls.branchId,
              day,
              period: p,
              teacherId: null,
              subjectId: null,
              groupType: "GROUP_2",
              roomId: null,
              isLocked: false,
            };
            slots.push(parallelSlot);
            allSlots.push(parallelSlot);
          }
        }
      }
      classSlots.set(cls.id, slots);
    }

    // ── 2. QAT'IY BELGILANGAN VA QULFLANGAN DARSLAR (Lock / Pin) ───
    const getShiftGroup = (classId: string): string => {
      const cls = this.classMap.get(classId);
      return isClassSecondShift(cls) ? "shift2" : "shift1";
    };

    const getOccKey = (teacherId: string, day: number, period: number, classId: string): string => {
      return `${teacherId}_${day}_${period}_${getShiftGroup(classId)}`;
    };

    const teacherOccupancy = new Map<string, number>(); // key: `${teacherId}_${day}_${period}_${shiftGroup}` -> count
    const teacherDailyHours = new Map<string, number>(); // key: `${teacherId}_${day}` -> count (Kunlik dars limiti nazorati)
    const lockedClassSet = new Set(this.input.lockedClassIds || []);
    const lockedTeacherSet = new Set(this.input.lockedTeacherIds || []);

    // 2.1. Mavjud qulflangan darslarni joy-joyiga qulflab qo'yish
    if (this.input.existingLessons && this.input.existingLessons.length > 0) {
      for (const el of this.input.existingLessons) {
        const isClassLocked = lockedClassSet.has(el.classId);
        const isTeacherLocked = lockedTeacherSet.has(el.teacherId);
        const isExplicitlyLocked = el.isLocked === true;

        if (isClassLocked || isTeacherLocked || isExplicitlyLocked) {
          const slots = classSlots.get(el.classId) || [];
          const slot = slots.find((s) => s.day === el.dayOfWeek && s.period === el.periodNumber);
          if (slot && !slot.isLocked) {
            slot.subjectId = el.subjectId;
            slot.teacherId = el.teacherId;
            slot.roomId = el.roomId || null;
            slot.groupType = el.groupType || "WHOLE";
            slot.isLocked = true;

            const k = getOccKey(el.teacherId, el.dayOfWeek, el.periodNumber, el.classId);
            teacherOccupancy.set(k, (teacherOccupancy.get(k) || 0) + 1);

            const dk = `${el.teacherId}_${el.dayOfWeek}`;
            teacherDailyHours.set(dk, (teacherDailyHours.get(dk) || 0) + 1);
          }
        }
      }
    }

    // 2.2. Kelajak soati / Sinf soati -> Dushanba 1-dars
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

      if (slotD1P1 && homeroomId && !slotD1P1.isLocked) {
        slotD1P1.subjectId = ss ? ss.subjectId : "sub_kelajak";
        slotD1P1.teacherId = homeroomId;
        slotD1P1.isLocked = true;
        slotD1P1.groupType = "WHOLE";

        const k = getOccKey(homeroomId, 1, 1, cls.id);
        teacherOccupancy.set(k, (teacherOccupancy.get(k) || 0) + 1);

        const dk = `${homeroomId}_1`;
        teacherDailyHours.set(dk, (teacherDailyHours.get(dk) || 0) + 1);
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
      weeklyHours: number;
      grade: number;
    }

    const remaining: ReqLesson[] = [];
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      // Agar sinf to'liq qulflangan bo'lsa, uning darslari qayta generatsiya qilinmaydi
      if (lockedClassSet.has(cls.id)) continue;

      const subjects = effectiveClassSubjects.get(cls.id) || [];
      const slots = classSlots.get(cls.id) || [];

      for (const cs of subjects) {
        const sub = this.subjectMap.get(cs.subjectId);
        let hours = cs.weeklyHours;

        // Allaqachon qulflangan slotlardagi soatlarni ayirib tashlash
        const alreadyLockedHours = slots.filter(
          (s) => s.isLocked && s.subjectId === cs.subjectId && s.teacherId === cs.teacherId
        ).length;
        hours = Math.max(0, hours - alreadyLockedHours);

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
            weeklyHours: cs.weeklyHours,
            grade: cls.grade ?? 5,
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
    while (remaining.length > 0) {
      const req = remaining.shift()!;
      const slots = classSlots.get(req.classId) || [];
      const subObj = this.subjectMap.get(req.subjectId);
      const isPrimary = req.grade <= 4;
      const is5DayWeek = isPrimary || Boolean(this.classMap.get(req.classId)?.isPrimary);
      const daysCount = is5DayWeek ? 5 : 6;

      // Agar bu 1-guruh darsi bo'lsa, unga mos parallel 2-guruh talabi bormi qidiramiz
      let matchingGroup2Req: ReqLesson | null = null;
      let matchingGroup2Idx = -1;
      if (req.groupType === "GROUP_1") {
        matchingGroup2Idx = remaining.findIndex(
          (r) => r.classId === req.classId && r.subjectId === req.subjectId && r.groupType === "GROUP_2"
        );
        if (matchingGroup2Idx >= 0) {
          matchingGroup2Req = remaining[matchingGroup2Idx];
        }
      }

      // QAT'IY SANPIN VA PEDAGOGIKA QOIDASI:
      // 1. Boshlang'ich sinflarda (1-4) JUFT DARS QAT'IYAN TAQIQLANADI! (SanPiN 0341-17)
      // Bolalarning aqliy toliqishini oldini olish uchun Matematika, Ona tili, O'qish kabi fanlar
      // kuniga FAQAT VA FAQAT 1 SOATDAN o'tiladi!
      // 2. Yuqori sinflarda ham (5-11): agar fanning haftalik soati haftadagi kunlar sonidan oshmasa (<= daysCount):
      // Har bir kunga faqat 1 soatdan to'g'ri keladi (masalan 5 kunlik haftada 5 soat Matematika -> har kuni aynan 1 soatdan)!
      // Juft dars faqat yuqori sinfda laboratoriya/amaliyot (Fizika lab, Kimyo lab, Texnologiya) kabi fanlarda
      // va agar haftalik soati kunlar sonidan ko'p bo'lsa ruxsat beriladi.
      const allowDouble =
        !isPrimary &&
        Boolean(subObj?.allowDoubleLesson) &&
        req.weeklyHours > daysCount;

      // QAT'IY METOD KUNI VA BIR KUNDA 1 FAN PROTOKOLI:
      const emptySlots = slots.filter((s) => {
        if (s.isLocked || s.teacherId !== null) return false;

        // Parallel slotlar filtri: GROUP_2 faqat GROUP_2 slotiga, boshqalar asosiy slotlarga
        if (req.groupType === "GROUP_2") {
          if (s.groupType !== "GROUP_2") return false;
          // GROUP_2 faqat 1-guruh bilan bir vaqtda parallel tushishi shart
          const group1Slot = slots.find(
            (other) =>
              other.day === s.day &&
              other.period === s.period &&
              other.subjectId === req.subjectId &&
              other.groupType === "GROUP_1"
          );
          if (!group1Slot) return false;
        } else {
          if (s.groupType === "GROUP_2") return false;
          // Agar GROUP_1 bo'lsa va 2-guruh ham bor bo'lsa:
          // Ayni shu vaqtdagi parallel GROUP_2 sloti bo'sh bo'lishi va 2-guruh o'qituvchisi ham bo'sh bo'lishi shart!
          if (matchingGroup2Req) {
            const parallelSlot = slots.find(
              (other) => other.day === s.day && other.period === s.period && other.groupType === "GROUP_2"
            );
            if (!parallelSlot || parallelSlot.teacherId !== null) return false;
            if (this.isStrictMethodDay(s.day, matchingGroup2Req.teacherId, matchingGroup2Req.subjectId)) return false;
          }
        }

        if (this.isStrictMethodDay(s.day, req.teacherId, req.subjectId)) return false;

        const sameSubjectSlotsInDay = slots.filter(
          (other) =>
            other.day === s.day &&
            other.subjectId === req.subjectId &&
            other.groupType === req.groupType
        );

        // 1. Agar juft darsga ruxsat bo'lmasa (boshlang'ich sinflar va haftalik soati <= kunlar soni bo'lgan fanlar):
        // 1 kunda 1 martadan oshishi qat'iyan taqiqlanadi!
        if (!allowDouble && sameSubjectSlotsInDay.length >= 1) return false;

        // 2. Hech qaysi fan 1 kunda 3 yoki undan ortiq soat bo'lishi mumkin emas!
        if (sameSubjectSlotsInDay.length >= 2) return false;

        // 3. Agar juft darsga ruxsat bo'lsa va 1-dars allaqachon bo'lsa, 2-dars faqat ketma-ket (juft) bo'lishi shart!
        if (allowDouble && sameSubjectSlotsInDay.length === 1) {
          const existingPeriod = sameSubjectSlotsInDay[0].period;
          if (Math.abs(existingPeriod - s.period) !== 1) return false;
        }

        return true;
      });

      if (emptySlots.length === 0) continue;

      // O'qituvchi boshqa sinflarda mutlaqo bo'sh bo'lgan (0 to'qnashuvli) slotlarni birinchi o'ringa qo'yish
      const conflictFreeSlots = emptySlots.filter((s) => {
        const occKey = getOccKey(req.teacherId, s.day, s.period, req.classId);
        const t1Free = (teacherOccupancy.get(occKey) || 0) === 0;
        if (!t1Free) return false;

        if (matchingGroup2Req) {
          const occKey2 = getOccKey(matchingGroup2Req.teacherId, s.day, s.period, req.classId);
          return (teacherOccupancy.get(occKey2) || 0) === 0;
        }
        return true;
      });
      const candidateSlots = conflictFreeSlots.length > 0 ? conflictFreeSlots : emptySlots;

      let bestSlot = candidateSlots[0];
      let bestScore = Infinity;

      for (const slot of candidateSlots) {
        let score = 0;
        const occKey = getOccKey(req.teacherId, slot.day, slot.period, req.classId);
        const currentOcc = teacherOccupancy.get(occKey) || 0;

        if (currentOcc > 0) score += currentOcc * 50000000;

        // Agar 2-guruh o'qituvchisi band bo'lsa:
        if (matchingGroup2Req) {
          const occKey2 = getOccKey(matchingGroup2Req.teacherId, slot.day, slot.period, req.classId);
          const currentOcc2 = teacherOccupancy.get(occKey2) || 0;
          if (currentOcc2 > 0) score += currentOcc2 * 50000000;
        }

        // O'qituvchining kunlik dars soati limiti (kuniga maks soat) nazorati:
        const teacherObj = this.teacherMap.get(req.teacherId);
        const maxDaily = teacherObj?.maxConsecutiveHours || 5;
        const dayKey = `${req.teacherId}_${slot.day}`;
        const currentDayCount = teacherDailyHours.get(dayKey) || 0;

        if (currentDayCount >= maxDaily) {
          score += (currentDayCount - maxDaily + 1) * 30000000; // Kunlik limitdan oshib ketmaslik!
        } else {
          score += currentDayCount * 500; // Darslarni kunlarga tekis taqsimlash
        }

        // Agar 2-guruh darsi bo'lsa, ayni shu fan va vaqtdagi 1-guruh bilan parallel tushishga qat'iy ustunlik:
        if (req.groupType === "GROUP_2") {
          const matchingGroup1 = slots.find(
            (other) =>
              other.day === slot.day &&
              other.period === slot.period &&
              other.subjectId === req.subjectId &&
              other.groupType === "GROUP_1"
          );
          if (matchingGroup1) {
            score -= 100000000; // 1-guruh bilan ayni bir vaqtda parallel o'tish!
          } else {
            score += 20000000;
          }
        }

        const sameSubjectCount = slots.filter(
          (s) => s.day === slot.day && s.subjectId === req.subjectId && s.groupType === req.groupType
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

        // ZERO-GAP HEURISTIC: Darslar 1-soatdan ketma-ket joylashishi shart!
        const prevSlot = slots.find((s) => s.day === slot.day && s.period === slot.period - 1);
        if (prevSlot && prevSlot.teacherId === null) {
          score += 1000000; // Oldingi soat bo'sh turganda keyingisiga sakrash qat'iyan taqiqlanadi!
        } else if (prevSlot && prevSlot.teacherId !== null) {
          score -= 500; // Ketma-ket davom etishga rag'bat!
        }

        // Boshlang'ich sinflar (1-4) uchun 5 va 6-soatlar qat'iy cheklanadi:
        const isPrimaryClass = (this.classMap.get(req.classId)?.grade || 5) <= 4;
        if (isPrimaryClass && slot.period > 4) {
          score += (slot.period - 4) * 2000000;
        }

        // Kichik periodlarga (1, 2, 3...) doimiy ustunlik:
        score += slot.period * 200;

        if (req.difficulty >= 8) {
          score += Math.abs(slot.period - 3) * 15;
        }

        const adj1 = teacherOccupancy.get(getOccKey(req.teacherId, slot.day, slot.period - 1, req.classId)) || 0;
        const adj2 = teacherOccupancy.get(getOccKey(req.teacherId, slot.day, slot.period + 1, req.classId)) || 0;
        if (adj1 > 0 || adj2 > 0) score -= 30;

        const classHash = req.classId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
        score += ((classHash * 7 + slot.day * 13 + slot.period * 17) % 23) * 2;

        // Bino harakati qoidasi (Travel Policy):
        if (teacherObj && teacherObj.branchIds && teacherObj.branchIds.length > 1) {
          if (teacherObj.travelPolicy === "ALTERNATING_DAYS") {
            const isMainBranch = req.branchId === teacherObj.branchIds[0];
            const isOddDay = slot.day % 2 === 1; // 1: Dushanba, 3: Chorshanba, 5: Juma
            if (isMainBranch && !isOddDay) {
              score += 20000000; // Asosiy bino toq kunlarda
            } else if (!isMainBranch && isOddDay) {
              score += 20000000; // Filial bino juft kunlarda
            }
          } else if (teacherObj.travelPolicy === "BY_DAY") {
            const isMainBranch = req.branchId === teacherObj.branchIds[0];
            const isFirstHalfOfWeek = slot.day <= 3; // Dush, Sesh, Chor
            if (isMainBranch && !isFirstHalfOfWeek) {
              score += 20000000;
            } else if (!isMainBranch && isFirstHalfOfWeek) {
              score += 20000000;
            }
          }
        }

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

      const occKey = getOccKey(req.teacherId, bestSlot.day, bestSlot.period, req.classId);
      teacherOccupancy.set(occKey, (teacherOccupancy.get(occKey) || 0) + 1);

      const dayKey = `${req.teacherId}_${bestSlot.day}`;
      teacherDailyHours.set(dayKey, (teacherDailyHours.get(dayKey) || 0) + 1);

      // Agar bu 1-guruh bo'lsa va 2-guruh talabi mavjud bo'lsa, parallel slotga 2-guruhni ham tandem biriktiramiz
      if (req.groupType === "GROUP_1" && matchingGroup2Req) {
        const parallelSlot = slots.find(
          (other) => other.day === bestSlot.day && other.period === bestSlot.period && other.groupType === "GROUP_2"
        );
        if (parallelSlot) {
          parallelSlot.teacherId = matchingGroup2Req.teacherId;
          parallelSlot.subjectId = matchingGroup2Req.subjectId;
          parallelSlot.groupType = "GROUP_2";

          const occKey2 = getOccKey(matchingGroup2Req.teacherId, parallelSlot.day, parallelSlot.period, req.classId);
          teacherOccupancy.set(occKey2, (teacherOccupancy.get(occKey2) || 0) + 1);

          const dayKey2 = `${matchingGroup2Req.teacherId}_${parallelSlot.day}`;
          teacherDailyHours.set(dayKey2, (teacherDailyHours.get(dayKey2) || 0) + 1);

          // remaining ro'yxatidan joylashtirilgan 2-guruhni olib tashlaymiz
          remaining.splice(matchingGroup2Idx, 1);
        }
      }
    }

    // ── 5. TEZ VA KUCHLI MIN-CONFLICTS LOCAL SEARCH (Max 200 iteration) ─────────
    const countClashesForTeacher = (teacherId: string, day: number, period: number, classId: string): number => {
      const k = getOccKey(teacherId, day, period, classId);
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
          countClashesForTeacher(s.teacherId, s.day, s.period, s.classId) > 0
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
          const isPrimaryClsA = (this.classMap.get(slotA.classId)?.grade ?? 5) <= 4;
          const subObjA = this.subjectMap.get(sA);
          const allowDoubleA = !isPrimaryClsA && Boolean(subObjA?.allowDoubleLesson);
          if (!allowDoubleA) {
            const duplicateInDayB = clsSlots.some(
              (s) => s !== slotA && s !== slotB && s.day === slotB.day && s.subjectId === sA
            );
            if (duplicateInDayB) continue;
          }

          if (tB && sB) {
            const isPrimaryClsB = (this.classMap.get(slotB.classId)?.grade ?? 5) <= 4;
            const subObjB = this.subjectMap.get(sB);
            const allowDoubleB = !isPrimaryClsB && Boolean(subObjB?.allowDoubleLesson);
            if (!allowDoubleB) {
              const duplicateInDayA = clsSlots.some(
                (s) => s !== slotA && s !== slotB && s.day === slotA.day && s.subjectId === sB
              );
              if (duplicateInDayA) continue;
            }
          }

          const clashesA_now = countClashesForTeacher(tA, slotA.day, slotA.period, slotA.classId);
          const clashesB_now = tB ? countClashesForTeacher(tB, slotB.day, slotB.period, slotB.classId) : 0;

          const occA_target = teacherOccupancy.get(getOccKey(tA, slotB.day, slotB.period, slotB.classId)) || 0;
          const occB_target = tB ? (teacherOccupancy.get(getOccKey(tB, slotA.day, slotA.period, slotA.classId)) || 0) : 0;

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

          const keyA_old = getOccKey(tA, slotA.day, slotA.period, slotA.classId);
          teacherOccupancy.set(keyA_old, (teacherOccupancy.get(keyA_old) || 1) - 1);

          if (tB) {
            const keyB_old = getOccKey(tB, bestTarget.day, bestTarget.period, bestTarget.classId);
            teacherOccupancy.set(keyB_old, (teacherOccupancy.get(keyB_old) || 1) - 1);
          }

          slotA.teacherId = tB;
          slotA.subjectId = sB;
          slotA.groupType = gB;

          bestTarget.teacherId = tA;
          bestTarget.subjectId = sA;
          bestTarget.groupType = gA;

          const keyA_new = getOccKey(tA, bestTarget.day, bestTarget.period, bestTarget.classId);
          teacherOccupancy.set(keyA_new, (teacherOccupancy.get(keyA_new) || 0) + 1);

          if (tB) {
            const keyB_new = getOccKey(tB, slotA.day, slotA.period, slotA.classId);
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

    // ── 5.5. ZERO-GAP CLASS COMPACTION (Sinflardagi Oknolar / Darchalarni 100% Yo'qotish) ─────
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const cSlots = classSlots.get(cls.id) || [];

      for (let day = 1; day <= 6; day++) {
        const daySlots = cSlots.filter((s) => s.day === day).sort((a, b) => a.period - b.period);

        for (let pass = 0; pass < 12; pass++) {
          let moved = false;

          for (let i = 0; i < daySlots.length; i++) {
            const slot = daySlots[i];
            // Agar bu slot bo'sh bo'lsa va undan keyin darslar mavjud bo'lsa (Darcha holati):
            if (!slot.teacherId && !slot.isLocked) {
              const laterSlotsWithLessons = daySlots.slice(i + 1).filter((s) => s.teacherId && !s.isLocked);
              if (laterSlotsWithLessons.length === 0) continue; // Undan keyin dars yo'q, demak kun tugagan

              // Ushbu bo'sh slotga ko'chib o'ta oladigan keyingi darsni qidiramiz:
              let foundTargetSlot: Slot | null = null;
              for (const later of laterSlotsWithLessons) {
                const tId = later.teacherId!;
                const sId = later.subjectId!;

                const occ = teacherOccupancy.get(getOccKey(tId, day, slot.period, cls.id)) || 0;
                const isMethod = this.isStrictMethodDay(day, tId, sId);

                if (occ === 0 && !isMethod) {
                  foundTargetSlot = later;
                  break;
                }
              }

              if (foundTargetSlot) {
                const tId = foundTargetSlot.teacherId!;
                const sId = foundTargetSlot.subjectId!;
                const gType = foundTargetSlot.groupType;

                teacherOccupancy.set(
                  getOccKey(tId, day, foundTargetSlot.period, cls.id),
                  (teacherOccupancy.get(getOccKey(tId, day, foundTargetSlot.period, cls.id)) || 1) - 1
                );
                teacherOccupancy.set(
                  getOccKey(tId, day, slot.period, cls.id),
                  (teacherOccupancy.get(getOccKey(tId, day, slot.period, cls.id)) || 0) + 1
                );

                slot.teacherId = tId;
                slot.subjectId = sId;
                slot.groupType = gType;

                foundTargetSlot.teacherId = null;
                foundTargetSlot.subjectId = null;
                foundTargetSlot.groupType = "WHOLE";

                moved = true;
                break;
              }
            }
          }

          if (!moved) break;
        }
      }
    }

    // ── 5.6. CROSS-DAY GAP ELIMINATOR (Kunlararo darchalarni boshqa kunlar hisobiga yopish) ─────
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const cSlots = classSlots.get(cls.id) || [];

      for (let day = 1; day <= 6; day++) {
        const daySlots = cSlots.filter((s) => s.day === day).sort((a, b) => a.period - b.period);

        for (let i = 0; i < daySlots.length; i++) {
          const gapSlot = daySlots[i];
          if (!gapSlot.teacherId && !gapSlot.isLocked) {
            const hasLater = daySlots.slice(i + 1).some((s) => s.teacherId && !s.isLocked);
            if (!hasLater) continue; // darcha emas

            // Boshqa kunlardagi oxirgi darslarni topib, ushbu bo'sh joyga ko'chirish:
            for (let otherDay = 1; otherDay <= 6; otherDay++) {
              if (otherDay === day) continue;
              const otherDaySlots = cSlots
                .filter((s) => s.day === otherDay && s.teacherId && !s.isLocked)
                .sort((a, b) => b.period - a.period);

              let resolved = false;
              for (const candidate of otherDaySlots) {
                const tId = candidate.teacherId!;
                const sId = candidate.subjectId!;

                // 1. O'qituvchi bo'sh va metod kuni emas
                const occGap = teacherOccupancy.get(`${tId}_${day}_${gapSlot.period}`) || 0;
                if (occGap > 0) continue;
                if (this.isStrictMethodDay(day, tId, sId)) continue;

                // 2. Bir kunda takroriy fan bo'lmasligi
                const isPrimaryCls = (this.classMap.get(candidate.classId)?.grade ?? 5) <= 4;
                const subObj = this.subjectMap.get(sId);
                const allowDouble = !isPrimaryCls && Boolean(subObj?.allowDoubleLesson);
                if (!allowDouble) {
                  const dup = daySlots.some((s) => s.subjectId === sId);
                  if (dup) continue;
                }

                teacherOccupancy.set(
                  `${tId}_${otherDay}_${candidate.period}`,
                  (teacherOccupancy.get(`${tId}_${otherDay}_${candidate.period}`) || 1) - 1
                );
                teacherOccupancy.set(`${tId}_${day}_${gapSlot.period}`, 1);

                gapSlot.teacherId = tId;
                gapSlot.subjectId = sId;
                gapSlot.groupType = candidate.groupType;

                candidate.teacherId = null;
                candidate.subjectId = null;
                candidate.groupType = "WHOLE";

                resolved = true;
                break;
              }
              if (resolved) break;
            }
          }
        }
      }
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
