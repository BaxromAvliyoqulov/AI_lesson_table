import {
  SolverInput,
  SolverResult,
  Lesson,
  SchoolClass,
  Subject,
  Teacher,
  Room,
} from "@/types";

interface SlotKey {
  dayOfWeek: number; // 1-6
  periodNumber: number; // 1-8
}

interface ClassRequirement {
  classId: string;
  subjectId: string;
  teacherId: string;
  weeklyHours: number;
  remainingHours: number;
  subject: Subject;
  classObj: SchoolClass;
  teacher: Teacher;
}

export class CSPSolver {
  private input: SolverInput;
  private daysCount: number;
  private maxPeriodsPerDay: number;
  private subjectMap: Map<string, Subject>;
  private teacherMap: Map<string, Teacher>;
  private classMap: Map<string, SchoolClass>;
  private roomMap: Map<string, Room>;

  constructor(input: SolverInput) {
    this.input = input;
    this.daysCount = input.daysCount || 6;
    this.maxPeriodsPerDay = input.maxPeriodsPerDay || 7;

    this.subjectMap = new Map(input.subjects.map((s) => [s.id, s]));
    this.teacherMap = new Map(input.teachers.map((t) => [t.id, t]));
    this.classMap = new Map(input.classes.map((c) => [c.id, c]));
    this.roomMap = new Map(input.rooms.map((r) => [r.id, r]));
  }

  public solve(): SolverResult {
    const lessons: Lesson[] = [];
    const requirements: ClassRequirement[] = [];

    // 1. Tarifikatsiya talablarini yig'ish
    let totalRequiredHours = 0;
    for (const cls of this.input.classes) {
      for (const cs of cls.subjects) {
        const subject = this.subjectMap.get(cs.subjectId);
        const teacher = this.teacherMap.get(cs.teacherId);
        if (subject && teacher && cs.weeklyHours > 0) {
          totalRequiredHours += cs.weeklyHours;
          requirements.push({
            classId: cls.id,
            subjectId: cs.subjectId,
            teacherId: cs.teacherId,
            weeklyHours: cs.weeklyHours,
            remainingHours: cs.weeklyHours,
            subject,
            classObj: cls,
            teacher,
          });
        }
      }
    }

    // 2. Most Constrained First (Eng ko'p cheklovga ega talablarni birinchi joylashtirish)
    requirements.sort((a, b) => {
      // Maxsus xona talab qiluvchilar birinchi
      const aSpecial = a.subject.requiresRoomType ? 1 : 0;
      const bSpecial = b.subject.requiresRoomType ? 1 : 0;
      if (aSpecial !== bSpecial) return bSpecial - aSpecial;

      // O'qituvchining yuklamasi ko'proq bo'lgani birinchi
      if (a.teacher.weeklyHourCapacity !== b.teacher.weeklyHourCapacity) {
        return b.teacher.weeklyHourCapacity - a.teacher.weeklyHourCapacity;
      }

      // Haftalik soati ko'proq bo'lgani birinchi
      return b.weeklyHours - a.weeklyHours;
    });

    // 3. Grid bandlik matritsalarini tayyorlash
    // teacherGrid[teacherId][day][period] -> boolean
    const teacherBusy = new Map<string, Set<string>>();
    // classGrid[classId][day][period] -> boolean
    const classBusy = new Map<string, Set<string>>();
    // roomBusy[roomId][day][period] -> boolean
    const roomBusy = new Map<string, Set<string>>();
    // classDaySubjects[classId][day] -> Set<subjectId>
    const classDaySubjects = new Map<string, Map<number, Set<string>>>();
    // classDaySubjectCount[classId][day][subjectId] -> number
    const classDaySubjectCount = new Map<string, Map<number, Map<string, number>>>();

    const getSlotKey = (day: number, period: number) => `${day}_${period}`;

    const isTeacherAvailable = (teacher: Teacher, day: number, period: number): boolean => {
      if (!teacher.availabilities || teacher.availabilities.length === 0) return true;
      const av = teacher.availabilities.find((a) => a.dayOfWeek === day && a.period === period);
      return av ? av.isAvailable : true;
    };

    const findAvailableRoom = (subject: Subject, branchId: string, day: number, period: number): Room | null => {
      if (!subject.requiresRoomType) return null;
      const matchingRooms = this.input.rooms.filter(
        (r) => r.branchId === branchId && r.roomType === subject.requiresRoomType
      );
      for (const room of matchingRooms) {
        const busySet = roomBusy.get(room.id);
        const key = getSlotKey(day, period);
        if (!busySet || !busySet.has(key)) {
          return room;
        }
      }
      return null;
    };

    // 4. Greedy Joylashtirish Dvigateli
    for (const req of requirements) {
      while (req.remainingHours > 0) {
        let bestSlot: { day: number; period: number; room: Room | null; score: number } | null = null;

        // Har bir kun va period bo'yicha baholash
        for (let day = 1; day <= this.daysCount; day++) {
          for (let period = 1; period <= this.maxPeriodsPerDay; period++) {
            const slotKey = getSlotKey(day, period);

            // HARD CONSTRAINTS:
            // 1. O'qituvchi bandmi?
            const tBusy = teacherBusy.get(req.teacherId);
            if (tBusy && tBusy.has(slotKey)) continue;

            // 2. Sinf bandmi?
            const cBusy = classBusy.get(req.classId);
            if (cBusy && cBusy.has(slotKey)) continue;

            // 3. O'qituvchi ish vaqti ruxsat etilganmi?
            if (!isTeacherAvailable(req.teacher, day, period)) continue;

            // 4. Maxsus xona kerak bo'lsa — bo'sh xona bormi?
            let matchedRoom: Room | null = null;
            if (req.subject.requiresRoomType) {
              matchedRoom = findAvailableRoom(req.subject, req.classObj.branchId, day, period);
              if (!matchedRoom) continue; // Bo'sh xona yo'q
            }

            // 5. Bir kunda bir xil fan takrorlanishi
            const dayMap = classDaySubjectCount.get(req.classId) || new Map<number, Map<string, number>>();
            const subCountMap = dayMap.get(day) || new Map<string, number>();
            const currentDayCount = subCountMap.get(req.subjectId) || 0;

            if (currentDayCount >= 1 && !req.subject.allowDoubleLesson) {
              // Double lessonga ruxsat yo'q bo'lsa — bir kunda 2 marta qo'yilmaydi
              continue;
            }
            if (currentDayCount >= 2) {
              // 2 tadan ortiq hech qachon mumkin emas
              continue;
            }

            // SOFT CONSTRAINTS (Scoring):
            let score = 100;

            // A. SanPiN qiyinlik balansi:
            // Og'ir fanlar (score >= 8) 2-3 darslarga va Seshanba/Chorshanba (day 2,3) ga yuqori ball
            if (req.subject.difficultyScore >= 8) {
              if (period === 2 || period === 3) score += 30;
              if (period >= 6) score -= 40;
              if (day === 2 || day === 3) score += 20;
              if (day === 1 || day === 6) score -= 15;
            } else if (req.subject.difficultyScore <= 3) {
              // Yengil fanlar (Jismoniy, San'at) oxirgi soatlarga mos
              if (period >= 4) score += 20;
            }

            // B. Kunlar bo'yicha bir tekis taqsimlanish
            if (currentDayCount === 0) {
              score += 25;
            }

            // C. Ketma-ket darslar (O'qituvchi oyna/gap bo'lmasligi)
            const prevKey = getSlotKey(day, period - 1);
            const nextKey = getSlotKey(day, period + 1);
            if (tBusy && (tBusy.has(prevKey) || tBusy.has(nextKey))) {
              score += 15; // Zichlik rag'batlantiriladi
            }

            if (!bestSlot || score > bestSlot.score) {
              bestSlot = { day, period, room: matchedRoom, score };
            }
          }
        }

        // Agar slot topilsa — joylashtiramiz
        if (bestSlot) {
          const slotKey = getSlotKey(bestSlot.day, bestSlot.period);

          // O'qituvchini band qilish
          if (!teacherBusy.has(req.teacherId)) teacherBusy.set(req.teacherId, new Set());
          teacherBusy.get(req.teacherId)!.add(slotKey);

          // Sinfni band qilish
          if (!classBusy.has(req.classId)) classBusy.set(req.classId, new Set());
          classBusy.get(req.classId)!.add(slotKey);

          // Xonani band qilish
          if (bestSlot.room) {
            if (!roomBusy.has(bestSlot.room.id)) roomBusy.set(bestSlot.room.id, new Set());
            roomBusy.get(bestSlot.room.id)!.add(slotKey);
          }

          // Fan hisoblagichini yangilash
          if (!classDaySubjectCount.has(req.classId)) classDaySubjectCount.set(req.classId, new Map());
          const cMap = classDaySubjectCount.get(req.classId)!;
          if (!cMap.has(bestSlot.day)) cMap.set(bestSlot.day, new Map());
          const sMap = cMap.get(bestSlot.day)!;
          sMap.set(req.subjectId, (sMap.get(req.subjectId) || 0) + 1);

          lessons.push({
            id: `lesson_${req.classId}_${req.subjectId}_${bestSlot.day}_${bestSlot.period}_${Date.now()}_${Math.random()}`,
            scheduleId: "draft-schedule",
            schoolId: req.classObj.schoolId,
            classId: req.classId,
            subjectId: req.subjectId,
            teacherId: req.teacherId,
            roomId: bestSlot.room ? bestSlot.room.id : null,
            branchId: req.classObj.branchId,
            dayOfWeek: bestSlot.day,
            periodNumber: bestSlot.period,
            isLocked: false,
          });

          req.remainingHours--;
        } else {
          // Bu soat uchun bo'sh joy topilmadi (Constraint conflict)
          break;
        }
      }
    }

    // 5. Joylashtirilmagan darslarni aniqlash
    const unassignedLessons = requirements
      .filter((r) => r.remainingHours > 0)
      .map((r) => ({
        classId: r.classId,
        subjectId: r.subjectId,
        teacherId: r.teacherId,
        remainingHours: r.remainingHours,
        reason: `O'qituvchi (${r.teacher.fullName}) yoki sinf soatlari kesishmasi tufayli bo'sh soat yetishmadi.`,
      }));

    return {
      success: unassignedLessons.length === 0,
      lessons,
      unassignedLessons,
      stats: {
        totalRequiredHours,
        placedHours: lessons.length,
        score: Math.round((lessons.length / (totalRequiredHours || 1)) * 100),
        conflictsCount: unassignedLessons.reduce((acc, u) => acc + u.remainingHours, 0),
      },
      explanation:
        unassignedLessons.length === 0
          ? "Barcha darslar to'liq va ziddiyatsiz joylashtirildi."
          : `${unassignedLessons.length} ta dars bo'yicha ziddiyat aniqlandi. O'qituvchilar yuklamasini yoki metod kunlarini tekshirish tavsiya etiladi.`,
    };
  }
}
