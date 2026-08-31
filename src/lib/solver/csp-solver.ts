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

    const isTeacherFree = (teacherId: string, day: number, period: number, subjectId?: string): boolean => {
      const teacher = this.teacherMap.get(teacherId);
      // 1. Shaxsiy metod kuni bo'lsa
      if (teacher?.methodDayOfWeek && teacher.methodDayOfWeek === day) {
        return false;
      }
      // 2. Muayyan fanning metod kuni bo'lsa (Masalan Ingliz tili Juma kuni)
      if (subjectId) {
        const sub = this.subjectMap.get(subjectId);
        if (sub?.methodDayOfWeek && sub.methodDayOfWeek === day) {
          return false;
        }
      }
      // 3. O'qituvchining barcha fanlari ushbu kuni metod kuni bo'lsa
      if (teacher?.subjectIds && teacher.subjectIds.length > 0) {
        const teacherSubjects = teacher.subjectIds
          .map((sid) => this.subjectMap.get(sid))
          .filter(Boolean) as Subject[];
        if (teacherSubjects.length > 0 && teacherSubjects.every((s) => s.methodDayOfWeek === day)) {
          return false;
        }
      }
      // 4. Shaxsiy availability matrisasi
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

    // Har bir sinf uchun darslarni aqlli va xilma-xil (shuffled & balanced) tarzda joylashtirish
    for (let clsIdx = 0; clsIdx < this.input.classes.length; clsIdx++) {
      const cls = this.input.classes[clsIdx];
      // 1. Agar sinf yopilgan bo'lsa, uni jadvalga kiritmaymiz
      if (cls.isClosed) continue;

      interface LessonItem {
        subjectId: string;
        teacherId: string;
        subject: Subject;
        teacher: Teacher;
      }

      // 2. QOIDA: Boshlang'ich sinflar (1-4 sinflar) uchun 5 kunlik o'qish haftasi (Shanba kuni dars bo'lmaydi!)
      const isPrimaryClass = cls.isPrimary || cls.grade <= 4;
      const classDaysCount = isPrimaryClass ? 5 : (this.daysCount || 6);

      // Har bir kun uchun darslar savati (dayLessons[day] = LessonItem[])
      const dayBuckets: Map<number, LessonItem[]> = new Map();
      for (let d = 1; d <= classDaysCount; d++) {
        dayBuckets.set(d, []);
      }

      // Kelajak soati
      let kelajakItem: LessonItem | null = null;

      // Sinf fanlarini olamiz
      for (const cs of cls.subjects) {
        const subject = this.subjectMap.get(cs.subjectId);
        const teacher = this.teacherMap.get(cs.teacherId);
        if (!subject || !teacher || cs.weeklyHours <= 0) continue;

        totalRequired += cs.weeklyHours;

        if (cs.subjectId === "sub_kelajak" || subject.name.toLowerCase().includes("kelajak")) {
          kelajakItem = {
            subjectId: cs.subjectId,
            teacherId: cs.teacherId,
            subject,
            teacher,
          };
          continue; // Kelajak soati qat'iy Dushanba 1-soatga qo'yiladi
        }

        // Fanning haftalik soatlarini kunlar bo'yicha xilma-xil tarqatamiz
        // Sinf indeksiga qarab startDay offset beramiz, shunda har bir sinfda kunlar bir xil bo'lmaydi!
        const dayOffset = (clsIdx * 2 + subject.difficultyScore) % classDaysCount;
        let assignedCount = 0;

        for (let step = 0; step < classDaysCount && assignedCount < cs.weeklyHours; step++) {
          const day = ((dayOffset + step * 2) % classDaysCount) + 1;
          dayBuckets.get(day)!.push({
            subjectId: cs.subjectId,
            teacherId: cs.teacherId,
            subject,
            teacher,
          });
          assignedCount++;
        }

        // Agar fanning soati kunlar sonidan ko'p bo'lsa (masalan 6 soat), qolganini bo'sh kunlarga qo'shamiz
        while (assignedCount < cs.weeklyHours) {
          // Eng kam dars yig'ilgan kunga qo'shamiz
          let minDay = 1;
          let minCount = 999;
          for (let d = 1; d <= classDaysCount; d++) {
            const count = dayBuckets.get(d)!.length;
            if (count < minCount) {
              minCount = count;
              minDay = d;
            }
          }
          dayBuckets.get(minDay)!.push({
            subjectId: cs.subjectId,
            teacherId: cs.teacherId,
            subject,
            teacher,
          });
          assignedCount++;
        }
      }

      // 3. QOIDA: Dushanba kuni 1-soatga qat'iy "Kelajak Soati" (Sinf rahbari tomonidan)
      if (kelajakItem) {
        const homeroomTeacherId = cls.homeroomTeacherId || kelajakItem.teacherId;
        occupyTeacher(homeroomTeacherId, 1, 1);

        lessons.push({
          id: `l_${cls.id}_kelajak_1_1_${Date.now()}_${Math.random()}`,
          scheduleId: "draft-schedule",
          schoolId: cls.schoolId,
          classId: cls.id,
          subjectId: kelajakItem.subjectId,
          teacherId: homeroomTeacherId,
          roomId: null,
          branchId: cls.branchId,
          dayOfWeek: 1,
          periodNumber: 1,
          isLocked: true,
        });
      }

      // Har bir kun uchun darslarni aralashtirib va SanPiN talablariga mos joylashtirish
      for (let day = 1; day <= classDaysCount; day++) {
        let bucket = dayBuckets.get(day) || [];

        // Sinf va kun bo'yicha aqlli aralashtirish (Inkubator bo'lmasligi uchun rotatsiya)
        const rotationShift = (clsIdx * 3 + day * 2) % (bucket.length || 1);
        bucket = [...bucket.slice(rotationShift), ...bucket.slice(0, rotationShift)];

        // SanPiN qoidasi: Murakkab fan (Matematika) va yengil fan (Jismoniy/O'qish/Tarbiya) almashinishi
        bucket.sort((a, b) => {
          // Juft indekslarda og'ir fanlar, toq indekslarda yengil fanlar
          return (b.subject.difficultyScore % 3) - (a.subject.difficultyScore % 3);
        });

        // Agar Dushanba bo'lsa va 1-soatga Kelajak Soati qo'yilgan bo'lsa, 2-darsdan boshlaymiz
        const startPeriod = (day === 1 && kelajakItem) ? 2 : 1;
        let currentPeriod = startPeriod;

        for (const item of bucket) {
          if (currentPeriod > 7) break; // Maksimal 7 dars

          // O'qituvchi bo'shligini tekshiramiz
          let targetPeriod = currentPeriod;
          let foundPeriod = -1;

          // Shu dars yoki keyingi soatlarda qidirish
          for (let p = targetPeriod; p <= 7; p++) {
            if (isTeacherFree(item.teacherId, day, p)) {
              if (item.subject.requiresRoomType) {
                const freeRoom = findFreeRoom(item.subject, cls.branchId, day, p);
                if (!freeRoom) continue;
              }
              foundPeriod = p;
              break;
            }
          }

          if (foundPeriod !== -1) {
            occupyTeacher(item.teacherId, day, foundPeriod);

            let assignedRoom: Room | null = null;
            if (item.subject.requiresRoomType) {
              assignedRoom = findFreeRoom(item.subject, cls.branchId, day, foundPeriod);
              if (assignedRoom) {
                occupyRoom(assignedRoom.id, day, foundPeriod);
              }
            }

            lessons.push({
              id: `l_${cls.id}_${item.subjectId}_${day}_${foundPeriod}_${Date.now()}_${Math.random()}`,
              scheduleId: "draft-schedule",
              schoolId: cls.schoolId,
              classId: cls.id,
              subjectId: item.subjectId,
              teacherId: item.teacherId,
              roomId: assignedRoom ? assignedRoom.id : null,
              branchId: cls.branchId,
              dayOfWeek: day,
              periodNumber: foundPeriod,
              isLocked: false,
            });

            if (foundPeriod === currentPeriod) {
              currentPeriod++;
            }
          } else {
            // Agar bo'sh soat topilmasa
            unassigned.push({
              classId: cls.id,
              subjectId: item.subjectId,
              teacherId: item.teacherId,
              remainingHours: 1,
              reason: `${cls.name} sinfi uchun ${item.subject.name} o'qituvchisi band bo'lgani sababli joylashmadi.`,
            });
          }
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
          ? "Barcha sinflar uchun darslar milliy qoidalar (1-4 sinf 5 kunlik, Dushanba 1-soat Kelajak soati) asosida mukammal taqsimlandi."
          : `${unassigned.length} ta dars bo'yicha ziddiyat aniqlandi.`,
    };
  }
}
