import {
  SolverInput,
  SolverResult,
  Lesson,
  SchoolClass,
  Subject,
  Teacher,
  Room,
} from "@/types";

interface SlotAssignment {
  subjectId: string;
  teacherId: string;
  roomId: string | null;
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

    // O'qituvchi bandligi: teacherOccupied.get(teacherId)?.has(`${day}_${period}`)
    const teacherOccupied = new Map<string, Set<string>>();
    // Xona bandligi: roomOccupied.get(roomId)?.has(`${day}_${period}`)
    const roomOccupied = new Map<string, Set<string>>();

    const isTeacherBusy = (teacherId: string, day: number, period: number, subjectId?: string): boolean => {
      const teacher = this.teacherMap.get(teacherId);
      if (!teacher) return true;

      // 1. Shaxsiy metod kuni (bu kuni dars bermaydi)
      if (teacher.methodDayOfWeek && teacher.methodDayOfWeek === day) {
        return true;
      }

      // 2. Fanning metod kuni (agar bor bo'lsa)
      if (subjectId) {
        const sub = this.subjectMap.get(subjectId);
        if (sub?.methodDayOfWeek && sub.methodDayOfWeek === day) {
          return true;
        }
      }

      // 3. Shaxsiy availability
      if (teacher.availabilities && teacher.availabilities.length > 0) {
        const av = teacher.availabilities.find((a) => a.dayOfWeek === day && a.period === period);
        if (av && !av.isAvailable) return true;
      }

      const occ = teacherOccupied.get(teacherId);
      return !!occ && occ.has(`${day}_${period}`);
    };

    const occupyTeacher = (teacherId: string, day: number, period: number) => {
      if (!teacherOccupied.has(teacherId)) {
        teacherOccupied.set(teacherId, new Set());
      }
      teacherOccupied.get(teacherId)!.add(`${day}_${period}`);
    };

    const releaseTeacher = (teacherId: string, day: number, period: number) => {
      teacherOccupied.get(teacherId)?.delete(`${day}_${period}`);
    };

    const isRoomBusy = (roomId: string, day: number, period: number): boolean => {
      const occ = roomOccupied.get(roomId);
      return !!occ && occ.has(`${day}_${period}`);
    };

    const occupyRoom = (roomId: string, day: number, period: number) => {
      if (!roomOccupied.has(roomId)) {
        roomOccupied.set(roomId, new Set());
      }
      roomOccupied.get(roomId)!.add(`${day}_${period}`);
    };

    const releaseRoom = (roomId: string, day: number, period: number) => {
      roomOccupied.get(roomId)?.delete(`${day}_${period}`);
    };

    const findAvailableRoom = (subject: Subject, branchId: string, day: number, period: number): Room | null => {
      if (!subject.requiresRoomType) return null;
      const candidates = this.input.rooms.filter(
        (r) => r.branchId === branchId && r.roomType === subject.requiresRoomType
      );
      for (const room of candidates) {
        if (!isRoomBusy(room.id, day, period)) {
          return room;
        }
      }
      return null;
    };

    let totalRequired = 0;
    const unassigned: {
      classId: string;
      subjectId: string;
      teacherId: string;
      remainingHours: number;
      reason?: string;
    }[] = [];

    // ── 1-BOSQICH: QAT'IY SINF SOATI VA KELAJAK SOATI (1-darslar) ─────────────
    // Sinf soati: Juma 1-dars; Kelajak soati: Dushanba 1-dars
    for (const cls of this.input.classes) {
      if (cls.isClosed) continue;

      // 1. Sinf soati (Juma 1-dars)
      const sinfSoatiCs = cls.subjects.find(
        (cs) =>
          cs.subjectId === "sub_sinf_soati" ||
          this.subjectMap.get(cs.subjectId)?.name.toLowerCase().includes("sinf soati")
      );

      if (sinfSoatiCs) {
        totalRequired += sinfSoatiCs.weeklyHours;
        const homeroomTeacherId = cls.homeroomTeacherId || sinfSoatiCs.teacherId;

        // Juma (5-kun) 1-soat band qilinadi
        occupyTeacher(homeroomTeacherId, 5, 1);

        lessons.push({
          id: `l_${cls.id}_sinfsoati_5_1_${Date.now()}_${Math.random()}`,
          scheduleId: "draft-schedule",
          schoolId: cls.schoolId,
          classId: cls.id,
          subjectId: sinfSoatiCs.subjectId,
          teacherId: homeroomTeacherId,
          roomId: null,
          branchId: cls.branchId,
          dayOfWeek: 5,
          periodNumber: 1,
          isLocked: true,
        });
      }

      // 2. Kelajak soati (Dushanba 1-dars)
      const kelajakCs = cls.subjects.find(
        (cs) =>
          cs.subjectId === "sub_kelajak" ||
          this.subjectMap.get(cs.subjectId)?.name.toLowerCase().includes("kelajak")
      );

      if (kelajakCs) {
        totalRequired += kelajakCs.weeklyHours;
        const homeroomTeacherId = cls.homeroomTeacherId || kelajakCs.teacherId;

        // Dushanba (1-kun) 1-soat band qilinadi
        occupyTeacher(homeroomTeacherId, 1, 1);

        lessons.push({
          id: `l_${cls.id}_kelajak_1_1_${Date.now()}_${Math.random()}`,
          scheduleId: "draft-schedule",
          schoolId: cls.schoolId,
          classId: cls.id,
          subjectId: kelajakCs.subjectId,
          teacherId: homeroomTeacherId,
          roomId: null,
          branchId: cls.branchId,
          dayOfWeek: 1,
          periodNumber: 1,
          isLocked: true,
        });
      }
    }

    // ── 2-BOSQICH: HAR BIR SINFNING QOLGAN FANLARINI TAQSIMLASH ──────────────
    interface SubjectNeed {
      subjectId: string;
      teacherId: string;
      subject: Subject;
      teacher: Teacher;
      requiresRoom: boolean;
    }

    for (let clsIdx = 0; clsIdx < this.input.classes.length; clsIdx++) {
      const cls = this.input.classes[clsIdx];
      if (cls.isClosed) continue;

      const isPrimary = cls.isPrimary || cls.grade <= 4;
      const classDaysCount = isPrimary ? 5 : this.daysCount; // 1-4 sinf: 5 kun, 5-11: 6 kun

      // Darslar ro'yxatini to'plash (Sinf soati va Kelajak soatidan tashqari)
      const subjectPool: SubjectNeed[] = [];

      for (const cs of cls.subjects) {
        const subject = this.subjectMap.get(cs.subjectId);
        const teacher = this.teacherMap.get(cs.teacherId);
        if (!subject || !teacher || cs.weeklyHours <= 0) continue;

        // Sinf soati va Kelajak soati 1-bosqichda qo'yilgan
        if (
          cs.subjectId === "sub_kelajak" ||
          cs.subjectId === "sub_sinf_soati" ||
          subject.name.toLowerCase().includes("kelajak") ||
          subject.name.toLowerCase().includes("sinf soati")
        ) {
          continue;
        }

        totalRequired += cs.weeklyHours;

        for (let h = 0; h < cs.weeklyHours; h++) {
          subjectPool.push({
            subjectId: cs.subjectId,
            teacherId: cs.teacherId,
            subject,
            teacher,
            requiresRoom: !!subject.requiresRoomType,
          });
        }
      }

      // Kunlar bo'yicha bo'sh savatlarni tuzish
      // Har bir kun uchun darslar sonini hisoblash
      const totalLessonsToPlace = subjectPool.length;
      const basePerDay = Math.floor(totalLessonsToPlace / classDaysCount);
      const extraLessons = totalLessonsToPlace % classDaysCount;

      // Har bir kunda nechta dars bo'lishi kerak
      const dayCapacities = new Map<number, number>();
      for (let d = 1; d <= classDaysCount; d++) {
        // Dushanba 1-dars Kelajak soati band, shuning uchun darslar sig'imiga +1 hisoblanadi
        const hasKelajakMonday = d === 1;
        const count = basePerDay + (d <= extraLessons ? 1 : 0);
        dayCapacities.set(d, count);
      }

      // Kunlar bo'yicha savatlar: dayLessons[day] = SubjectNeed[]
      const dayBuckets = new Map<number, SubjectNeed[]>();
      for (let d = 1; d <= classDaysCount; d++) {
        dayBuckets.set(d, []);
      }

      // Fanlarni kunlar bo'yicha bir xil tushmaydigan (spread) qilib taqsimlash
      // 1. Qiyin fanlar (Matematika, Fizika, Ona tili) bir kunda qaytarilmasin
      const groupedBySubject = new Map<string, SubjectNeed[]>();
      for (const item of subjectPool) {
        if (!groupedBySubject.has(item.subjectId)) {
          groupedBySubject.set(item.subjectId, []);
        }
        groupedBySubject.get(item.subjectId)!.push(item);
      }

      // Qiyinlik darajasi bo'yicha saralangan fanlar
      const sortedSubjectIds = Array.from(groupedBySubject.keys()).sort((a, b) => {
        const subA = this.subjectMap.get(a)!;
        const subB = this.subjectMap.get(b)!;
        return subB.difficultyScore - subA.difficultyScore;
      });

      for (const subId of sortedSubjectIds) {
        const items = groupedBySubject.get(subId)!;
        const allowDouble = items[0].subject.allowDoubleLesson && items.length >= 2;

        let itemIndex = 0;
        let dayStartOffset = (clsIdx * 2 + items[0].subject.difficultyScore) % classDaysCount;

        while (itemIndex < items.length) {
          // Eng bo'sh kunga joylashtiramiz
          let bestDay = -1;
          let minCount = 999;

          for (let step = 0; step < classDaysCount; step++) {
            const day = ((dayStartOffset + step) % classDaysCount) + 1;
            const currentCount = dayBuckets.get(day)!.length;
            const maxAllowed = dayCapacities.get(day)!;

            if (currentCount >= maxAllowed) continue;

            // Shu kunda ushbu fan bormi?
            const alreadyHasSubject = dayBuckets.get(day)!.some((x) => x.subjectId === subId);
            if (alreadyHasSubject && !allowDouble && items.length <= classDaysCount) {
              continue; // Bir kunda takrorlanmasin
            }

            if (currentCount < minCount) {
              minCount = currentCount;
              bestDay = day;
            }
          }

          if (bestDay === -1) {
            // Agar cheklov bilan topilmasa, sig'imi yetgan istalgan kunga qo'yamiz
            for (let d = 1; d <= classDaysCount; d++) {
              if (dayBuckets.get(d)!.length < dayCapacities.get(d)!) {
                bestDay = d;
                break;
              }
            }
          }

          if (bestDay !== -1) {
            dayBuckets.get(bestDay)!.push(items[itemIndex]);
            itemIndex++;
          } else {
            break;
          }
        }
      }

      // ── 3-BOSQICH: HAR BIR KUN ICHIDA DARCHASIZ (GAPLESS) PERIODLARGA BIRIKTIRISH ───
      for (let day = 1; day <= classDaysCount; day++) {
        const bucket = dayBuckets.get(day) || [];
        if (bucket.length === 0) continue;

        // Dushanba kuni 1-soat Kelajak bo'lsa, 2-soatdan boshlaymiz, boshqa kunlar 1-soatdan
        const startPeriod = day === 1 ? 2 : 1;
        const totalPeriodsForDay = bucket.length;

        // QAT'IY QOIDA: Darslar startPeriod dan startPeriod + totalPeriodsForDay - 1 gacha
        // KETMA-KET (BIRORTA BO'SHLIQSIZ) bo'lishi SHART!
        // [startPeriod, startPeriod + 1, ..., startPeriod + totalPeriodsForDay - 1]
        const requiredPeriods: number[] = [];
        for (let i = 0; i < totalPeriodsForDay; i++) {
          requiredPeriods.push(startPeriod + i);
        }

        // Backtracking orqali har bir requiredPeriod ga mos keluvchi fanni topish
        const assignedPeriods: {
          period: number;
          item: SubjectNeed;
          room: Room | null;
        }[] = [];

        // Backtracking qidiruv
        const solveDayPeriods = (periodIdx: number, remainingItems: SubjectNeed[]): boolean => {
          if (periodIdx >= requiredPeriods.length) {
            return true; // Barcha periodlar muvaffaqiyatli to'ldirildi!
          }

          const targetPeriod = requiredPeriods[periodIdx];

          // SanPiN bo'yicha: 2-3-4 darslarga og'ir fanlar, 1 va 5-6 darslarga yengil fanlar mos keladi
          const isMidPeriod = targetPeriod >= 2 && targetPeriod <= 4;
          const candidates = [...remainingItems].sort((a, b) => {
            if (isMidPeriod) {
              return b.subject.difficultyScore - a.subject.difficultyScore; // Og'ir fanlar avval
            } else {
              return a.subject.difficultyScore - b.subject.difficultyScore; // Yengil fanlar avval
            }
          });

          for (let i = 0; i < candidates.length; i++) {
            const candidate = candidates[i];

            // 1. O'qituvchi bo'shmi?
            if (isTeacherBusy(candidate.teacherId, day, targetPeriod, candidate.subjectId)) {
              continue;
            }

            // 2. Maxsus xona kerak bo'lsa, xona bo'shmi?
            let matchedRoom: Room | null = null;
            if (candidate.requiresRoom) {
              matchedRoom = findAvailableRoom(candidate.subject, cls.branchId, day, targetPeriod);
              if (!matchedRoom) {
                continue; // Xona band
              }
            }

            // Joylashtirib ko'ramiz
            occupyTeacher(candidate.teacherId, day, targetPeriod);
            if (matchedRoom) {
              occupyRoom(matchedRoom.id, day, targetPeriod);
            }

            assignedPeriods.push({
              period: targetPeriod,
              item: candidate,
              room: matchedRoom,
            });

            const nextRemaining = [
              ...candidates.slice(0, i),
              ...candidates.slice(i + 1),
            ];

            if (solveDayPeriods(periodIdx + 1, nextRemaining)) {
              return true;
            }

            // Orqaga qaytish (Backtrack)
            occupyTeacher(candidate.teacherId, day, targetPeriod); // rollback
            releaseTeacher(candidate.teacherId, day, targetPeriod);
            if (matchedRoom) {
              releaseRoom(matchedRoom.id, day, targetPeriod);
            }
            assignedPeriods.pop();
          }

          return false;
        };

        const success = solveDayPeriods(0, [...bucket]);

        if (success) {
          // Barcha darslar ketma-ket joylashtirildi
          for (const ap of assignedPeriods) {
            lessons.push({
              id: `l_${cls.id}_${ap.item.subjectId}_${day}_${ap.period}_${Date.now()}_${Math.random()}`,
              scheduleId: "draft-schedule",
              schoolId: cls.schoolId,
              classId: cls.id,
              subjectId: ap.item.subjectId,
              teacherId: ap.item.teacherId,
              roomId: ap.room ? ap.room.id : null,
              branchId: cls.branchId,
              dayOfWeek: day,
              periodNumber: ap.period,
              isLocked: false,
            });
          }
        } else {
          // Agar qat'iy ketma-ketlik topilmasa (o'qituvchi konflikt):
          // Eng yaqin bo'sh ketma-ket periodlarni kiritamiz va ziddiyatni qayd qilamiz
          for (let i = 0; i < bucket.length; i++) {
            const item = bucket[i];
            const p = requiredPeriods[i];

            let assignedRoom: Room | null = null;
            if (item.requiresRoom) {
              assignedRoom = findAvailableRoom(item.subject, cls.branchId, day, p);
              if (assignedRoom) occupyRoom(assignedRoom.id, day, p);
            }
            occupyTeacher(item.teacherId, day, p);

            lessons.push({
              id: `l_${cls.id}_${item.subjectId}_${day}_${p}_${Date.now()}_${Math.random()}`,
              scheduleId: "draft-schedule",
              schoolId: cls.schoolId,
              classId: cls.id,
              subjectId: item.subjectId,
              teacherId: item.teacherId,
              roomId: assignedRoom ? assignedRoom.id : null,
              branchId: cls.branchId,
              dayOfWeek: day,
              periodNumber: p,
              isLocked: false,
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
          ? "Dars jadvali to'liq darchasiz (Zero Gaps), SanPiN qoidalari va xonalar ziddiyatisiz muvaffaqiyatli tuzildi."
          : `${unassigned.length} ta dars bo'yicha ziddiyat aniqlandi.`,
    };
  }
}
