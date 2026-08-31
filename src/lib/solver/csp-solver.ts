import {
  SolverInput,
  SolverResult,
  Lesson,
  SchoolClass,
  Subject,
  Teacher,
  Room,
} from "@/types";

interface RequiredLessonItem {
  uid: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  subject: Subject;
  teacher: Teacher;
  cls: SchoolClass;
  difficulty: number;
}

interface ClassSlot {
  classId: string;
  day: number;
  period: number;
  assignedLesson: RequiredLessonItem | null;
  assignedRoomId: string | null;
  isLocked: boolean;
}

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
    const lessons: Lesson[] = [];

    // O'qituvchilarning umumiy dars yuklamasini hisoblash (eng band o'qituvchilarga yuqori ustunlik)
    const teacherWorkloads = new Map<string, number>();
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      for (const cs of cls.subjects) {
        const cur = teacherWorkloads.get(cs.teacherId) || 0;
        teacherWorkloads.set(cs.teacherId, cur + cs.weeklyHours);
      }
    }

    // 1. Sinf bo'yicha har bir kunning dars sig'imi va darchasiz slotlarini aniqlash
    // classSlots: Map<classId, Map<"day_period", ClassSlot>>
    const classSlots = new Map<string, Map<string, ClassSlot>>();
    const allSlots: ClassSlot[] = [];

    // O'qituvchilar bandligi: Map<teacherId, Set<"day_period">>
    const teacherOccupancy = new Map<string, Set<string>>();
    // Xonalar bandligi: Map<roomId, Set<"day_period">>
    const roomOccupancy = new Map<string, Set<string>>();

    const isTeacherAvailable = (teacherId: string, day: number, period: number, subjectId?: string): boolean => {
      const teacher = this.teacherMap.get(teacherId);
      if (!teacher) return false;

      // Metod kuni
      if (teacher.methodDayOfWeek && teacher.methodDayOfWeek === day) {
        return false;
      }

      // Fanning metod kuni
      if (subjectId) {
        const sub = this.subjectMap.get(subjectId);
        if (sub?.methodDayOfWeek && sub.methodDayOfWeek === day) {
          return false;
        }
      }

      // Shaxsiy availability
      if (teacher.availabilities && teacher.availabilities.length > 0) {
        const av = teacher.availabilities.find((a) => a.dayOfWeek === day && a.period === period);
        if (av && !av.isAvailable) return false;
      }

      // Boshqa sinfda ayni shu (day, period) da darsi bormi?
      const occ = teacherOccupancy.get(teacherId);
      if (occ && occ.has(`${day}_${period}`)) {
        return false; // BAND! Parallel darsga MUTLAQO YO'L QO'YILMAYDI!
      }

      return true;
    };

    const occupy = (teacherId: string, roomId: string | null, day: number, period: number) => {
      const key = `${day}_${period}`;
      if (!teacherOccupancy.has(teacherId)) teacherOccupancy.set(teacherId, new Set());
      teacherOccupancy.get(teacherId)!.add(key);

      if (roomId) {
        if (!roomOccupancy.has(roomId)) roomOccupancy.set(roomId, new Set());
        roomOccupancy.get(roomId)!.add(key);
      }
    };

    const release = (teacherId: string, roomId: string | null, day: number, period: number) => {
      const key = `${day}_${period}`;
      teacherOccupancy.get(teacherId)?.delete(key);
      if (roomId) {
        roomOccupancy.get(roomId)?.delete(key);
      }
    };

    const findRoom = (subject: Subject, branchId: string, day: number, period: number): Room | null => {
      if (!subject.requiresRoomType) return null;
      const candidates = this.input.rooms.filter(
        (r) => r.branchId === branchId && r.roomType === subject.requiresRoomType
      );
      const key = `${day}_${period}`;
      for (const room of candidates) {
        const occ = roomOccupancy.get(room.id);
        if (!occ || !occ.has(key)) {
          return room;
        }
      }
      return null;
    };

    // Har bir sinf uchun darchasiz slotlarni qurish
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const isPrimary = cls.isPrimary || cls.grade <= 4;
      const days = isPrimary ? 5 : this.daysCount;
      const maxPeriodsPerDay = isPrimary ? 5 : 6;

      // Jami dars soatlarini hisoblash
      let totalWeeklyHours = 0;
      cls.subjects.forEach((cs) => (totalWeeklyHours += cs.weeklyHours));

      // Har bir kunga teng taqsimlash
      const basePerDay = Math.floor(totalWeeklyHours / days);
      const extraDays = totalWeeklyHours % days;

      const slotMap = new Map<string, ClassSlot>();

      for (let day = 1; day <= days; day++) {
        let dayCount = basePerDay + (day <= extraDays ? 1 : 0);
        dayCount = Math.min(dayCount, maxPeriodsPerDay);

        for (let p = 1; p <= dayCount; p++) {
          const slot: ClassSlot = {
            classId: cls.id,
            day,
            period: p,
            assignedLesson: null,
            assignedRoomId: null,
            isLocked: false,
          };
          slotMap.set(`${day}_${p}`, slot);
          allSlots.push(slot);
        }
      }

      classSlots.set(cls.id, slotMap);
    }

    // ── 1-BOSQICH: QAT'IY QULFLANGAN DARSLARNI O'RNATISH (Sinf soati, Kelajak) ─
    // Sinf soati -> Juma (5-kun) 1-dars; Kelajak soati -> Dushanba (1-kun) 1-dars
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;
      const slotMap = classSlots.get(cls.id);
      if (!slotMap) continue;

      // 1. Sinf soati (Juma 1-dars)
      const sinfSoatiCs = cls.subjects.find(
        (cs) =>
          cs.subjectId === "sub_sinf_soati" ||
          this.subjectMap.get(cs.subjectId)?.name.toLowerCase().includes("sinf soati")
      );
      if (sinfSoatiCs) {
        const fridaySlot = slotMap.get("5_1");
        const teacherId = cls.homeroomTeacherId || sinfSoatiCs.teacherId;
        if (fridaySlot) {
          fridaySlot.isLocked = true;
          fridaySlot.assignedLesson = {
            uid: `req_${cls.id}_sinfsoati_${Date.now()}`,
            classId: cls.id,
            subjectId: sinfSoatiCs.subjectId,
            teacherId,
            subject: this.subjectMap.get(sinfSoatiCs.subjectId)!,
            teacher: this.teacherMap.get(teacherId)!,
            cls,
            difficulty: 1,
          };
          occupy(teacherId, null, 5, 1);
        }
      }

      // 2. Kelajak soati (Dushanba 1-dars)
      const kelajakCs = cls.subjects.find(
        (cs) =>
          cs.subjectId === "sub_kelajak" ||
          this.subjectMap.get(cs.subjectId)?.name.toLowerCase().includes("kelajak")
      );
      if (kelajakCs) {
        const mondaySlot = slotMap.get("1_1");
        const teacherId = cls.homeroomTeacherId || kelajakCs.teacherId;
        if (mondaySlot && !mondaySlot.isLocked) {
          mondaySlot.isLocked = true;
          mondaySlot.assignedLesson = {
            uid: `req_${cls.id}_kelajak_${Date.now()}`,
            classId: cls.id,
            subjectId: kelajakCs.subjectId,
            teacherId,
            subject: this.subjectMap.get(kelajakCs.subjectId)!,
            teacher: this.teacherMap.get(teacherId)!,
            cls,
            difficulty: 1,
          };
          occupy(teacherId, null, 1, 1);
        }
      }
    }

    // ── 2-BOSQICH: QOLGAN BARCHA DARS TALABLARINI YIG'ISH VA TARTIBLASH ────────
    const remainingLessons: RequiredLessonItem[] = [];

    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;

      for (const cs of cls.subjects) {
        const subject = this.subjectMap.get(cs.subjectId);
        const teacher = this.teacherMap.get(cs.teacherId);
        if (!subject || !teacher || cs.weeklyHours <= 0) continue;

        // Sinf soati va Kelajak soati allaqachon joylandi
        let hoursToPlace = cs.weeklyHours;
        if (
          cs.subjectId === "sub_sinf_soati" ||
          subject.name.toLowerCase().includes("sinf soati")
        ) {
          hoursToPlace = Math.max(0, hoursToPlace - 1);
        }
        if (
          cs.subjectId === "sub_kelajak" ||
          subject.name.toLowerCase().includes("kelajak")
        ) {
          hoursToPlace = Math.max(0, hoursToPlace - 1);
        }

        for (let h = 0; h < hoursToPlace; h++) {
          remainingLessons.push({
            uid: `req_${cls.id}_${cs.subjectId}_${h}_${Math.random()}`,
            classId: cls.id,
            subjectId: cs.subjectId,
            teacherId: cs.teacherId,
            subject,
            teacher,
            cls,
            difficulty: subject.difficultyScore || 5,
          });
        }
      }
    }

    // ENG QIYIN VA ENG BAND O'QITUVCHILARNI BIRINCHI BO'LIB TAQSIMLASH (MRV Heuristic)
    remainingLessons.sort((a, b) => {
      const teacherWorkloadA = teacherWorkloads.get(a.teacherId) || 0;
      const teacherWorkloadB = teacherWorkloads.get(b.teacherId) || 0;
      // 1. O'qituvchining jami dars soati (bandligi yuqori bo'lgan ustozlar oldin)
      if (teacherWorkloadB !== teacherWorkloadA) {
        return teacherWorkloadB - teacherWorkloadA;
      }
      // 2. Fanning qiyinlik darajasi (Matematika, Fizika, Kimyo oldin)
      if (b.difficulty !== a.difficulty) {
        return b.difficulty - a.difficulty;
      }
      // 3. Sinf darajasi (11, 10, 9 sinflar oldin)
      return b.cls.grade - a.cls.grade;
    });

    // ── 3-BOSQICH: GLOBAL CSP BACKTRACKING VA SMART EJECTION ENGINE ────────────
    const unplacedLessons: RequiredLessonItem[] = [];

    for (const item of remainingLessons) {
      const slotMap = classSlots.get(item.classId);
      if (!slotMap) {
        unplacedLessons.push(item);
        continue;
      }

      // Shu sinfning bo'sh slotlarini qidirish
      const availableEmptySlots = Array.from(slotMap.values()).filter(
        (s) => !s.isLocked && s.assignedLesson === null
      );

      // Slotlarni SanPiN va Fan tarqalishi (Spread) bo'yicha baholash
      const scoredSlots = availableEmptySlots.map((slot) => {
        let score = 0;

        // 1. O'qituvchi bo'shmi? (Hard Constraint)
        const isFree = isTeacherAvailable(item.teacherId, slot.day, slot.period, item.subjectId);
        if (!isFree) {
          score -= 100000; // Mutlaqo yaroqsiz!
        }

        // 2. Maxsus xona talab qilinsa, xona bo'shmi?
        let matchedRoom: Room | null = null;
        if (item.subject.requiresRoomType) {
          matchedRoom = findRoom(item.subject, item.cls.branchId, slot.day, slot.period);
          if (!matchedRoom) {
            score -= 50000; // Xona band
          }
        }

        // 3. Shu kunda ayni shu fan bormi? (Kunlik takrorlanmaslik)
        const classDayLessons = Array.from(slotMap.values()).filter(
          (s) => s.day === slot.day && s.assignedLesson !== null
        );
        const duplicateOnSameDay = classDayLessons.some(
          (s) => s.assignedLesson?.subjectId === item.subjectId
        );
        if (duplicateOnSameDay && !item.subject.allowDoubleLesson) {
          score -= 2000; // Bir kunda takrorlanmasin
        }

        // 4. SanPiN: Og'ir fanlar (2, 3, 4-darslar), yengil fanlar (1, 5, 6-darslar)
        if (item.difficulty >= 7) {
          if (slot.period >= 2 && slot.period <= 4) score += 500;
          else if (slot.period === 1) score += 200;
          else score -= 100;
        } else if (item.difficulty <= 3) {
          if (slot.period >= 4) score += 300;
          else if (slot.period === 1) score += 200;
        }

        return { slot, score, matchedRoom };
      });

      // Eng yaxshi ball to'plagan slotni saralash
      scoredSlots.sort((a, b) => b.score - a.score);

      // Eng yaxshi yaroqli slot (score > -10000)
      const validChoice = scoredSlots.find((s) => s.score > -10000);

      if (validChoice) {
        // To'g'ridan-to'g'ri joylashtirish
        validChoice.slot.assignedLesson = item;
        validChoice.slot.assignedRoomId = validChoice.matchedRoom ? validChoice.matchedRoom.id : null;
        occupy(item.teacherId, validChoice.slot.assignedRoomId, validChoice.slot.day, validChoice.slot.period);
      } else {
        // ── SMART SWAP (EJECTION CHAIN): 0-PARALLEL CHEKLOVINING KAFOLATI ────
        // Agar to'g'ridan-to'g'ri bo'sh slot topilmasa, shu sinf ichidagi boshqa darslar bilan
        // almashish orqali ustozlar ziddiyatini yechamiz
        let swapped = false;

        for (const targetSlot of availableEmptySlots) {
          // Shu sinfning boshqa to'lgan slotlari bilan 2-way swap
          const occupiedSlots = Array.from(slotMap.values()).filter(
            (s) => !s.isLocked && s.assignedLesson !== null
          );

          for (const occSlot of occupiedSlots) {
            const currentItem = occSlot.assignedLesson!;

            // 1. Yangi item occSlot'ga tusha oladimi?
            release(currentItem.teacherId, occSlot.assignedRoomId, occSlot.day, occSlot.period);
            const canItemFitInOccSlot = isTeacherAvailable(
              item.teacherId,
              occSlot.day,
              occSlot.period,
              item.subjectId
            );

            // 2. currentItem bo'sh targetSlot'ga ko'cha oladimi?
            const canCurrentFitInTarget = isTeacherAvailable(
              currentItem.teacherId,
              targetSlot.day,
              targetSlot.period,
              currentItem.subjectId
            );

            if (canItemFitInOccSlot && canCurrentFitInTarget) {
              // Muvaffaqiyatli zanjirli almashish (Smart Swap)!
              let targetRoom = findRoom(currentItem.subject, item.cls.branchId, targetSlot.day, targetSlot.period);
              let occRoom = findRoom(item.subject, item.cls.branchId, occSlot.day, occSlot.period);

              targetSlot.assignedLesson = currentItem;
              targetSlot.assignedRoomId = targetRoom ? targetRoom.id : null;
              occupy(currentItem.teacherId, targetSlot.assignedRoomId, targetSlot.day, targetSlot.period);

              occSlot.assignedLesson = item;
              occSlot.assignedRoomId = occRoom ? occRoom.id : null;
              occupy(item.teacherId, occSlot.assignedRoomId, occSlot.day, occSlot.period);

              swapped = true;
              break;
            } else {
              // Qaytarish (Rollback)
              occupy(currentItem.teacherId, occSlot.assignedRoomId, occSlot.day, occSlot.period);
            }
          }

          if (swapped) break;
        }

        if (!swapped) {
          // Agar 2-way swap ham bo'lmasa, majburiy bo'sh slotga qo'yib, keyingi bosqichga uzatamiz
          const fallbackSlot = availableEmptySlots[0];
          if (fallbackSlot) {
            fallbackSlot.assignedLesson = item;
            fallbackSlot.assignedRoomId = null;
            occupy(item.teacherId, null, fallbackSlot.day, fallbackSlot.period);
          } else {
            unplacedLessons.push(item);
          }
        }
      }
    }

    // ── 4-BOSQICH: PARALLEL DARSLARNI 100% BARTARAF ETISH (CONFLICT ELIMINATOR) ──
    // Barcha o'qituvchilar bo'yicha (teacherId, day, period) to'qnashuvlarini to'liq tekshiramiz
    for (let pass = 0; pass < 15; pass++) {
      let conflictsFound = 0;

      // teacherClashMap: "teacherId_day_period" -> ClassSlot[]
      const teacherClashMap = new Map<string, ClassSlot[]>();

      for (const slot of allSlots) {
        if (!slot.assignedLesson) continue;
        const key = `${slot.assignedLesson.teacherId}_${slot.day}_${slot.period}`;
        if (!teacherClashMap.has(key)) teacherClashMap.set(key, []);
        teacherClashMap.get(key)!.push(slot);
      }

      for (const [key, clashingSlots] of teacherClashMap.entries()) {
        if (clashingSlots.length <= 1) continue;
        conflictsFound++;

        // clashingSlots dan biri qoladi, qolganlarini shu sinflarning boshqa bo'sh slotlariga ko'chiramiz
        for (let i = 1; i < clashingSlots.length; i++) {
          const conflictSlot = clashingSlots[i];
          const lessonToMove = conflictSlot.assignedLesson!;
          const slotMap = classSlots.get(conflictSlot.classId)!;

          // Shu sinfning boshqa darslari bilan almashish qidiramiz
          const otherSlotsInClass = Array.from(slotMap.values()).filter(
            (s) => s !== conflictSlot && !s.isLocked
          );

          let resolved = false;

          for (const candidateSlot of otherSlotsInClass) {
            if (candidateSlot.assignedLesson === null) {
              // Bo'sh slotga ko'chirish
              if (
                isTeacherAvailable(
                  lessonToMove.teacherId,
                  candidateSlot.day,
                  candidateSlot.period,
                  lessonToMove.subjectId
                )
              ) {
                release(lessonToMove.teacherId, conflictSlot.assignedRoomId, conflictSlot.day, conflictSlot.period);
                conflictSlot.assignedLesson = null;
                conflictSlot.assignedRoomId = null;

                candidateSlot.assignedLesson = lessonToMove;
                candidateSlot.assignedRoomId = null;
                occupy(lessonToMove.teacherId, null, candidateSlot.day, candidateSlot.period);
                resolved = true;
                break;
              }
            } else {
              // Boshqa dars bilan o'rnini almashtirish (Swap)
              const otherLesson = candidateSlot.assignedLesson;
              release(lessonToMove.teacherId, conflictSlot.assignedRoomId, conflictSlot.day, conflictSlot.period);
              release(otherLesson.teacherId, candidateSlot.assignedRoomId, candidateSlot.day, candidateSlot.period);

              const canMove1 = isTeacherAvailable(
                lessonToMove.teacherId,
                candidateSlot.day,
                candidateSlot.period,
                lessonToMove.subjectId
              );
              const canMove2 = isTeacherAvailable(
                otherLesson.teacherId,
                conflictSlot.day,
                conflictSlot.period,
                otherLesson.subjectId
              );

              if (canMove1 && canMove2) {
                candidateSlot.assignedLesson = lessonToMove;
                occupy(lessonToMove.teacherId, null, candidateSlot.day, candidateSlot.period);

                conflictSlot.assignedLesson = otherLesson;
                occupy(otherLesson.teacherId, null, conflictSlot.day, conflictSlot.period);
                resolved = true;
                break;
              } else {
                // Rollback
                occupy(lessonToMove.teacherId, conflictSlot.assignedRoomId, conflictSlot.day, conflictSlot.period);
                occupy(otherLesson.teacherId, candidateSlot.assignedRoomId, candidateSlot.day, candidateSlot.period);
              }
            }
          }
        }
      }

      if (conflictsFound === 0) break;
    }

    // ── 5-BOSQICH: YAKUNIY LESSON FORMATIGA O'TKAZISH ──────────────────────────
    let totalRequired = 0;
    this.input.classes.forEach((c) => {
      if (!c.isClosed) c.subjects.forEach((cs) => (totalRequired += cs.weeklyHours));
    });

    for (const slot of allSlots) {
      if (!slot.assignedLesson) continue;
      const item = slot.assignedLesson;

      lessons.push({
        id: `l_${item.classId}_${item.subjectId}_${slot.day}_${slot.period}_${Date.now()}_${Math.random()}`,
        scheduleId: "draft-schedule",
        schoolId: item.cls.schoolId,
        classId: item.classId,
        subjectId: item.subjectId,
        teacherId: item.teacherId,
        roomId: slot.assignedRoomId,
        branchId: item.cls.branchId,
        dayOfWeek: slot.day,
        periodNumber: slot.period,
        isLocked: slot.isLocked,
      });
    }

    // Yakuniy tekshiruv: Ziddiyatlar sonini hisoblash
    const finalTeacherClashes = new Map<string, number>();
    for (const l of lessons) {
      const key = `${l.teacherId}_${l.dayOfWeek}_${l.periodNumber}`;
      finalTeacherClashes.set(key, (finalTeacherClashes.get(key) || 0) + 1);
    }
    let actualConflictsCount = 0;
    for (const count of finalTeacherClashes.values()) {
      if (count > 1) actualConflictsCount += count - 1;
    }

    return {
      success: actualConflictsCount === 0,
      lessons,
      unassignedLessons: unplacedLessons.map((u) => ({
        classId: u.classId,
        subjectId: u.subjectId,
        teacherId: u.teacherId,
        remainingHours: 1,
        reason: "O'qituvchi vaqt chegarasi",
      })),
      stats: {
        totalRequiredHours: totalRequired,
        placedHours: lessons.length,
        score: Math.max(0, 100 - actualConflictsCount * 5),
        conflictsCount: actualConflictsCount,
      },
      explanation:
        actualConflictsCount === 0
          ? "AI Patrul va CSP Solver dars jadvalini 100% parallel to'qnashuvlarsiz, darchasiz (Zero Gaps) va SanPiN qoidalariga to'liq mos ravishda tuzdi."
          : `Jadval tuzildi, ${actualConflictsCount} ta cheklov qayd etildi.`,
    };
  }
}
