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
    const lessons: Lesson[] = [];

    // teacherOccupied[teacherId][day][period]
    const teacherOccupied = new Map<string, Map<number, Set<number>>>();
    // roomOccupied[roomId][day][period]
    const roomOccupied = new Map<string, Map<number, Set<number>>>();

    const isTeacherFree = (teacherId: string, day: number, period: number): boolean => {
      const teacher = this.teacherMap.get(teacherId);
      if (teacher?.availabilities && teacher.availabilities.length > 0) {
        const av = teacher.availabilities.find((a) => a.dayOfWeek === day && a.period === period);
        if (av && !av.isAvailable) return false;
      }
      const dayMap = teacherOccupied.get(teacherId);
      if (!dayMap) return true;
      const periodSet = dayMap.get(day);
      return !periodSet || !periodSet.has(period);
    };

    const occupyTeacher = (teacherId: string, day: number, period: number) => {
      if (!teacherOccupied.has(teacherId)) teacherOccupied.set(teacherId, new Map());
      const dayMap = teacherOccupied.get(teacherId)!;
      if (!dayMap.has(day)) dayMap.set(day, new Set());
      dayMap.get(day)!.add(period);
    };

    const findFreeRoom = (subject: Subject, branchId: string, day: number, period: number): Room | null => {
      if (!subject.requiresRoomType) return null;
      const matchingRooms = this.input.rooms.filter(
        (r) => r.branchId === branchId && r.roomType === subject.requiresRoomType
      );
      for (const room of matchingRooms) {
        const dayMap = roomOccupied.get(room.id);
        if (!dayMap || !dayMap.get(day) || !dayMap.get(day)!.has(period)) {
          return room;
        }
      }
      return null;
    };

    const occupyRoom = (roomId: string, day: number, period: number) => {
      if (!roomOccupied.has(roomId)) roomOccupied.set(roomId, new Map());
      const dayMap = roomOccupied.get(roomId)!;
      if (!dayMap.has(day)) dayMap.set(day, new Set());
      dayMap.get(day)!.add(period);
    };

    let totalRequired = 0;
    const unassigned: {
      classId: string;
      subjectId: string;
      teacherId: string;
      remainingHours: number;
      reason?: string;
    }[] = [];

    // Har bir sinf uchun darslarni yig'ish
    for (const cls of this.input.classes) {
      interface LessonItem {
        subjectId: string;
        teacherId: string;
        subject: Subject;
        teacher: Teacher;
      }

      const pool: LessonItem[] = [];
      for (const cs of cls.subjects) {
        const subject = this.subjectMap.get(cs.subjectId);
        const teacher = this.teacherMap.get(cs.teacherId);
        if (subject && teacher && cs.weeklyHours > 0) {
          totalRequired += cs.weeklyHours;
          for (let h = 0; h < cs.weeklyHours; h++) {
            pool.push({
              subjectId: cs.subjectId,
              teacherId: cs.teacherId,
              subject,
              teacher,
            });
          }
        }
      }

      const totalClassHours = pool.length;
      if (totalClassHours === 0) continue;

      const baseDailyHours = Math.floor(totalClassHours / this.daysCount);
      const extraHours = totalClassHours % this.daysCount;
      const dailyTargets: number[] = [];
      for (let d = 0; d < this.daysCount; d++) {
        dailyTargets.push(baseDailyHours + (d < extraHours ? 1 : 0));
      }

      // Har bir kun uchun darslarni qat'iy 1-darsdan boshlab to'ldirish
      for (let day = 1; day <= this.daysCount; day++) {
        const maxPeriodsForDay = dailyTargets[day - 1] || 4;
        const daySubjectCounts = new Map<string, number>();

        for (let period = 1; period <= maxPeriodsForDay; period++) {
          let candidateIndex = -1;

          // 1-urinish: SanPiN va xona chekloviga to'liq mos darsni qidirish
          for (let i = 0; i < pool.length; i++) {
            const item = pool[i];
            if (!isTeacherFree(item.teacherId, day, period)) continue;

            if (item.subject.requiresRoomType) {
              const freeRoom = findFreeRoom(item.subject, cls.branchId, day, period);
              if (!freeRoom) continue;
            }

            const countToday = daySubjectCounts.get(item.subjectId) || 0;
            if (countToday >= 1 && !item.subject.allowDoubleLesson) continue;
            if (countToday >= 2) continue;

            candidateIndex = i;
            break;
          }

          // 2-urinish: Agar yuqoridagi mos kelmasa, har qanday bo'sh o'qituvchini shu soatga qo'yish (1-dars bo'sh qolmasligi shart!)
          if (candidateIndex === -1) {
            for (let i = 0; i < pool.length; i++) {
              const item = pool[i];
              if (!isTeacherFree(item.teacherId, day, period)) continue;

              if (item.subject.requiresRoomType) {
                const freeRoom = findFreeRoom(item.subject, cls.branchId, day, period);
                if (!freeRoom) continue;
              }

              const countToday = daySubjectCounts.get(item.subjectId) || 0;
              if (countToday >= 2) continue;

              candidateIndex = i;
              break;
            }
          }

          // Agar hali ham topilmasa, hatto 1 kunda takrorlangan bo'lsa ham darsni qo'yish (bo'sh qolishdan ko'ra)
          if (candidateIndex === -1) {
            for (let i = 0; i < pool.length; i++) {
              const item = pool[i];
              if (isTeacherFree(item.teacherId, day, period)) {
                if (item.subject.requiresRoomType) {
                  const freeRoom = findFreeRoom(item.subject, cls.branchId, day, period);
                  if (!freeRoom) continue;
                }
                candidateIndex = i;
                break;
              }
            }
          }

          if (candidateIndex !== -1) {
            const chosen = pool.splice(candidateIndex, 1)[0];

            occupyTeacher(chosen.teacherId, day, period);

            let assignedRoom: Room | null = null;
            if (chosen.subject.requiresRoomType) {
              assignedRoom = findFreeRoom(chosen.subject, cls.branchId, day, period);
              if (assignedRoom) {
                occupyRoom(assignedRoom.id, day, period);
              }
            }

            daySubjectCounts.set(chosen.subjectId, (daySubjectCounts.get(chosen.subjectId) || 0) + 1);

            lessons.push({
              id: `l_${cls.id}_${chosen.subjectId}_${day}_${period}_${Date.now()}_${Math.random()}`,
              scheduleId: "draft-schedule",
              schoolId: cls.schoolId,
              classId: cls.id,
              subjectId: chosen.subjectId,
              teacherId: chosen.teacherId,
              roomId: assignedRoom ? assignedRoom.id : null,
              branchId: cls.branchId,
              dayOfWeek: day,
              periodNumber: period,
              isLocked: false,
            });
          }
        }
      }

      if (pool.length > 0) {
        for (const item of pool) {
          unassigned.push({
            classId: cls.id,
            subjectId: item.subjectId,
            teacherId: item.teacherId,
            remainingHours: 1,
            reason: `${cls.name} sinfi uchun ${item.subject.name} soati joy yetishmagani sababli qoldi.`,
          });
        }
      }
    }

    return {
      success: unassigned.length === 0,
      lessons,
      unassignedLessons: unassigned,
      stats: {
        totalRequiredHours: totalRequired,
        placedHours: lessons.length,
        score: Math.round((lessons.length / (totalRequired || 1)) * 100),
        conflictsCount: unassigned.length,
      },
      explanation:
        unassigned.length === 0
          ? "Barcha sinflar uchun darslar 1-darsdan boshlab, oraliq bo'shliqlarsiz mukammal taqsimlandi."
          : `${unassigned.length} ta dars bo'yicha ziddiyat aniqlandi.`,
    };
  }
}
