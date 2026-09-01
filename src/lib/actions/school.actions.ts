"use server";

import { prisma } from "@/lib/prisma";
import {
  SchoolInfo,
  Branch,
  Shift,
  Subject,
  Teacher,
  Room,
  SchoolClass,
  ClassSubject,
  Lesson,
  BellPeriod,
} from "@/types";
import {
  initialBranches,
  initialShifts,
  initialSubjects,
  initialRooms,
  initialTeachers,
  initialClasses,
} from "@/lib/mock-data";
import { CSPSolver } from "@/lib/solver/csp-solver";

/**
 * 0. Maktab ID yoki slug bo'yicha bazadagi haqiqiy School yozuvini aniqlash (Auto-Resolver)
 * Har qanday alias (school_39, demo-maktab, maktab-39, cuid) ni haqiqiy bazadagi maktabga bog'laydi.
 */
export async function resolveSchool(schoolIdOrSlug?: string) {
  try {
    if (!schoolIdOrSlug) {
      const firstSchool = await prisma.school.findFirst();
      if (firstSchool) return firstSchool;
    } else {
      // 1. To'g'ridan-to'g'ri ID bo'yicha
      const byId = await prisma.school.findUnique({
        where: { id: schoolIdOrSlug },
      });
      if (byId) return byId;

      // 2. Slug yoki mashhur aliaslar bo'yicha
      const bySlug = await prisma.school.findFirst({
        where: {
          OR: [
            { slug: schoolIdOrSlug },
            { slug: "demo-maktab" },
            { slug: "school_39" },
            { slug: "maktab-39" },
            { name: { contains: "39" } },
          ],
        },
      });
      if (bySlug) return bySlug;
    }

    // 3. Agar topilmasa, mavjud birinchi maktabni olish
    const existing = await prisma.school.findFirst();
    if (existing) return existing;

    // 4. Agar bazada umuman maktab bo'lmasa, yaratish
    const created = await prisma.school.create({
      data: {
        name: "39-umumiy o'rta ta'lim maktabi",
        slug: schoolIdOrSlug || "demo-maktab",
        region: "Muzrabot tumani",
        directorFullName: "M. Ramazonov",
        academicVicePrincipalName: "N. Narziqulov",
        subscriptionPlan: "pro",
        subscriptionStatus: "active",
      },
    });
    return created;
  } catch (error) {
    console.error("resolveSchool xatosi:", error);
    return null;
  }
}

/**
 * 1. Maktabning barcha ma'lumotlarini Neon PostgreSQL bazasidan to'liq olish
 */
export async function getSchoolFullData(schoolId?: string) {
  try {
    const schoolRecord = await resolveSchool(schoolId);
    if (!schoolRecord) {
      return { success: false, error: "Maktab topilmadi" };
    }

    let school = await prisma.school.findUnique({
      where: { id: schoolRecord.id },
      include: {
        branches: true,
        shifts: true,
        subjects: true,
        rooms: true,
        teachers: {
          include: {
            subjects: true,
            branches: true,
            availabilities: true,
          },
          orderBy: { displayNumber: "asc" },
        },
        classes: {
          include: {
            subjects: true,
          },
          orderBy: [{ grade: "asc" }, { name: "asc" }],
        },
        schedules: {
          where: { isActive: true },
          include: {
            lessons: true,
          },
          take: 1,
        },
      },
    });

    if (!school) {
      return { success: false, error: "Maktab ma'lumotlarini yuklab bo'lmadi" };
    }

    // Agar bazada o'qituvchilar yoki sinflar hali bo'lmasa, boshlang'ich 39-maktab ma'lumotlarini joylash
    if (school.teachers.length === 0 || school.classes.length === 0) {
      await seedSchoolInitialData(school.id);
      return getSchoolFullData(school.id);
    }

    // Transformatsiya
    const schoolInfo: SchoolInfo = {
      id: school.id,
      name: school.name,
      slug: school.slug,
      region: school.region || "Muzrabot tumani",
      directorName: school.directorFullName || "M. Ramazonov",
      vicePrincipalName: school.academicVicePrincipalName || "N. Narziqulov",
      psychologistName: school.psychologistName || "F.I.Sh",
      academicYear: "2025 - 2026",
      approvalDate: "2026-yil 28-mart",
      branchesCount: school.branches.length,
      classesCount: school.classes.length,
      teachersCount: school.teachers.length,
    };

    const branches: Branch[] = school.branches.map((b) => ({
      id: b.id,
      schoolId: b.schoolId,
      name: b.name,
      address: b.address || undefined,
      isMain: b.isMain,
    }));

    const shifts: Shift[] = school.shifts.map((s) => ({
      id: s.id,
      schoolId: s.schoolId,
      name: s.name,
      startTime: s.startTime,
      endTime: s.endTime,
      periodsCount: s.periodsCount,
    }));

    const subjects: Subject[] = school.subjects.map((s) => ({
      id: s.id,
      schoolId: s.schoolId,
      name: s.name,
      shortName: s.shortName,
      colorTag: s.colorTag,
      difficultyScore: s.difficultyScore,
      allowDoubleLesson: s.allowDoubleLesson,
      requiresRoomType: s.requiresRoomType as any,
      isActive: s.isActive !== undefined ? s.isActive : true,
    }));

    const rooms: Room[] = school.rooms.map((r) => ({
      id: r.id,
      schoolId: r.schoolId,
      branchId: r.branchId,
      name: r.name,
      roomType: r.roomType as any,
      capacity: r.capacity,
    }));

    const teachers: Teacher[] = school.teachers.map((t) => ({
      id: t.id,
      schoolId: t.schoolId,
      displayNumber: t.displayNumber,
      fullName: t.fullName,
      phone: t.phone || undefined,
      weeklyHourCapacity: t.weeklyHourCapacity,
      maxConsecutiveHours: t.maxConsecutiveHours,
      methodDayOfWeek: t.methodDay !== null ? t.methodDay : undefined,
      homeroomClassId: t.homeroomClassId || undefined,
      subjectIds: t.subjects.map((ts) => ts.subjectId),
      branchIds: t.branches.map((tb) => tb.branchId),
    }));

    const classes: SchoolClass[] = school.classes.map((c) => ({
      id: c.id,
      schoolId: c.schoolId,
      branchId: c.branchId,
      shiftId: c.shiftId,
      name: c.name,
      grade: c.grade,
      isPrimary: c.isPrimary,
      isClosed: false,
      homeroomTeacherId: teachers.find((t) => t.homeroomClassId === c.id)?.id || undefined,
      subjects: c.subjects.map((cs) => ({
        classId: cs.classId,
        subjectId: cs.subjectId,
        teacherId: cs.teacherId,
        weeklyHours: cs.weeklyHours,
      })),
    }));

    const activeSchedule = school.schedules[0];
    const lessons: Lesson[] = (activeSchedule?.lessons || []).map((l) => ({
      id: l.id,
      scheduleId: l.scheduleId,
      schoolId: l.schoolId,
      classId: l.classId,
      subjectId: l.subjectId,
      teacherId: l.teacherId,
      roomId: l.roomId || undefined,
      branchId: l.branchId,
      dayOfWeek: l.dayOfWeek,
      periodNumber: l.periodNumber,
      isLocked: l.isLocked,
    }));

    const defaultBells: BellPeriod[] = [
      { periodNumber: 1, startTime: "08:00", endTime: "08:45", breakDurationMinutes: 5 },
      { periodNumber: 2, startTime: "08:50", endTime: "09:35", breakDurationMinutes: 10 },
      { periodNumber: 3, startTime: "09:45", endTime: "10:30", breakDurationMinutes: 15 },
      { periodNumber: 4, startTime: "10:45", endTime: "11:30", breakDurationMinutes: 5 },
      { periodNumber: 5, startTime: "11:35", endTime: "12:20", breakDurationMinutes: 5 },
      { periodNumber: 6, startTime: "12:25", endTime: "13:10", breakDurationMinutes: 5 },
      { periodNumber: 7, startTime: "13:15", endTime: "14:00", breakDurationMinutes: 5 },
    ];

    return {
      success: true,
      data: {
        schoolInfo,
        branches,
        shifts,
        subjects,
        rooms,
        teachers,
        classes,
        lessons,
        bellPeriods: defaultBells,
      },
    };
  } catch (error: any) {
    console.error("getSchoolFullData xatosi:", error);
    return { success: false, error: error?.message || "Baza ma'lumotlarini yuklashda xato" };
  }
}

/**
 * 2. Maktab uchun boshlang'ich ma'lumotlarni PostgreSQL bazasiga kiritish (Seed)
 */
export async function seedSchoolInitialData(schoolId: string) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    return await prisma.$transaction(
      async (tx) => {
        // 1. Filiallar
        const branchMap = new Map<string, string>();
        const initialB = initialBranches.filter((b) => b.schoolId === "school_39");
        for (const b of initialB) {
          const branch = await tx.branch.create({
            data: {
              schoolId: actualSchoolId,
              name: b.name,
              address: b.address || null,
              isMain: b.isMain,
            },
          });
          branchMap.set(b.id, branch.id);
        }

        // 2. Smenalar
        const shiftMap = new Map<string, string>();
        const initialS = initialShifts.filter((s) => s.schoolId === "school_39");
        for (let i = 0; i < initialS.length; i++) {
          const s = initialS[i];
          const shift = await tx.shift.create({
            data: {
              schoolId: actualSchoolId,
              name: s.name,
              startTime: s.startTime,
              endTime: s.endTime,
              periodsCount: s.periodsCount,
              order: i + 1,
            },
          });
          shiftMap.set(s.id, shift.id);
        }

        // 3. Fanlar
        const subjectMap = new Map<string, string>();
        const initialSub = initialSubjects.filter((s) => s.schoolId === "school_39");
        for (const sub of initialSub) {
          const createdSub = await tx.subject.create({
            data: {
              schoolId: actualSchoolId,
              name: sub.name,
              shortName: sub.shortName || null,
              colorTag: sub.colorTag,
              difficultyScore: sub.difficultyScore,
              allowDoubleLesson: sub.allowDoubleLesson,
              requiresRoomType: sub.requiresRoomType || null,
            },
          });
          subjectMap.set(sub.id, createdSub.id);
        }

        // 4. Xonalar
        const roomMap = new Map<string, string>();
        const initialR = initialRooms.filter((r) => r.schoolId === "school_39");
        for (const r of initialR) {
          const bId = branchMap.get(r.branchId) || Array.from(branchMap.values())[0];
          const createdRoom = await tx.room.create({
            data: {
              schoolId: actualSchoolId,
              branchId: bId,
              name: r.name,
              roomType: r.roomType,
              capacity: r.capacity,
            },
          });
          roomMap.set(r.id, createdRoom.id);
        }

        // 5. O'qituvchilar
        const teacherMap = new Map<string, string>();
        const initialT = initialTeachers.filter((t) => t.schoolId === "school_39");
        const teacherSubjectRows: Array<{ schoolId: string; teacherId: string; subjectId: string }> = [];
        const teacherBranchRows: Array<{ schoolId: string; teacherId: string; branchId: string }> = [];

        for (let i = 0; i < initialT.length; i++) {
          const t = initialT[i];
          const createdTeacher = await tx.teacher.create({
            data: {
              schoolId: actualSchoolId,
              displayNumber: i + 1,
              fullName: t.fullName,
              phone: t.phone || null,
              weeklyHourCapacity: t.weeklyHourCapacity,
              maxConsecutiveHours: t.maxConsecutiveHours,
              methodDay: t.methodDayOfWeek !== undefined ? t.methodDayOfWeek : null,
            },
          });
          teacherMap.set(t.id, createdTeacher.id);

          // Fan bog'lamalari
          for (const sId of t.subjectIds) {
            const mappedSubId = subjectMap.get(sId);
            if (mappedSubId) {
              teacherSubjectRows.push({
                schoolId: actualSchoolId,
                teacherId: createdTeacher.id,
                subjectId: mappedSubId,
              });
            }
          }

          // Filial bog'lamalari
          for (const bId of t.branchIds) {
            const mappedBranchId = branchMap.get(bId);
            if (mappedBranchId) {
              teacherBranchRows.push({
                schoolId: actualSchoolId,
                teacherId: createdTeacher.id,
                branchId: mappedBranchId,
              });
            }
          }
        }

        if (teacherSubjectRows.length > 0) {
          await tx.teacherSubject.createMany({ data: teacherSubjectRows, skipDuplicates: true });
        }
        if (teacherBranchRows.length > 0) {
          await tx.teacherBranch.createMany({ data: teacherBranchRows, skipDuplicates: true });
        }

        // 6. Sinflar va Tarifikatsiya
        const classMap = new Map<string, string>();
        const initialC = initialClasses.filter((c) => c.schoolId === "school_39");
        const classSubjectRows: Array<{
          schoolId: string;
          classId: string;
          subjectId: string;
          teacherId: string;
          weeklyHours: number;
        }> = [];

        for (const c of initialC) {
          const bId = branchMap.get(c.branchId) || Array.from(branchMap.values())[0];
          const sId = shiftMap.get(c.shiftId) || Array.from(shiftMap.values())[0];

          const createdClass = await tx.class.create({
            data: {
              schoolId: actualSchoolId,
              branchId: bId,
              shiftId: sId,
              name: c.name,
              grade: c.grade,
              isPrimary: c.isPrimary,
            },
          });
          classMap.set(c.id, createdClass.id);

          // Sinf rahbari bog'lash
          if (c.homeroomTeacherId) {
            const mappedTeacherId = teacherMap.get(c.homeroomTeacherId);
            if (mappedTeacherId) {
              await tx.teacher.update({
                where: { id: mappedTeacherId },
                data: { homeroomClassId: createdClass.id },
              });
            }
          }

          // Fanlar va dars soatlari (ClassSubjects)
          for (const cs of c.subjects) {
            const mappedSubId = subjectMap.get(cs.subjectId);
            const mappedTeacherId = teacherMap.get(cs.teacherId);
            if (mappedSubId && mappedTeacherId) {
              classSubjectRows.push({
                schoolId: actualSchoolId,
                classId: createdClass.id,
                subjectId: mappedSubId,
                teacherId: mappedTeacherId,
                weeklyHours: cs.weeklyHours,
              });
            }
          }
        }

        if (classSubjectRows.length > 0) {
          await tx.classSubject.createMany({ data: classSubjectRows, skipDuplicates: true });
        }

        // 7. CSP Algoritm orqali dars jadvalini generatsiya qilib DB ga joylash
        const solverClasses = initialC.map((c) => ({
          ...c,
          id: classMap.get(c.id) || c.id,
          schoolId: actualSchoolId,
          branchId: branchMap.get(c.branchId) || c.branchId,
          shiftId: shiftMap.get(c.shiftId) || c.shiftId,
          subjects: c.subjects.map((cs) => ({
            ...cs,
            classId: classMap.get(cs.classId) || cs.classId,
            subjectId: subjectMap.get(cs.subjectId) || cs.subjectId,
            teacherId: teacherMap.get(cs.teacherId) || cs.teacherId,
          })),
        }));

        const solverTeachers = initialT.map((t, idx) => ({
          ...t,
          id: teacherMap.get(t.id) || t.id,
          schoolId: actualSchoolId,
          displayNumber: idx + 1,
          subjectIds: t.subjectIds.map((sid) => subjectMap.get(sid) || sid),
          branchIds: t.branchIds.map((bid) => branchMap.get(bid) || bid),
        }));

        const solverSubjects = initialSub.map((s) => ({
          ...s,
          id: subjectMap.get(s.id) || s.id,
          schoolId: actualSchoolId,
        }));

        const solverRooms = initialR.map((r) => ({
          ...r,
          id: roomMap.get(r.id) || r.id,
          schoolId: actualSchoolId,
          branchId: branchMap.get(r.branchId) || r.branchId,
        }));

        const solverShifts = initialS.map((s) => ({
          ...s,
          id: shiftMap.get(s.id) || s.id,
          schoolId: actualSchoolId,
        }));

        const solverBranches = initialB.map((b) => ({
          ...b,
          id: branchMap.get(b.id) || b.id,
          schoolId: actualSchoolId,
        }));

        const solver = new CSPSolver({
          classes: solverClasses,
          teachers: solverTeachers,
          subjects: solverSubjects,
          rooms: solverRooms,
          shifts: solverShifts,
          branches: solverBranches,
        });

        const solverResult = solver.solve();

        // Schedule yaratish
        const schedule = await tx.schedule.create({
          data: {
            schoolId: actualSchoolId,
            name: "2025-2026 o'quv yili 1-chorak dars jadvali",
            academicYear: "2025 - 2026",
            term: 1,
            status: "PUBLISHED",
            isActive: true,
          },
        });

        // Darslarni bitta batch (createMany) bilan kiritish
        const lessonRows = solverResult.lessons.map((l) => ({
          scheduleId: schedule.id,
          schoolId: actualSchoolId,
          classId: l.classId,
          subjectId: l.subjectId,
          teacherId: l.teacherId,
          roomId: l.roomId || null,
          branchId: l.branchId,
          dayOfWeek: l.dayOfWeek,
          periodNumber: l.periodNumber,
          isLocked: l.isLocked || false,
        }));

        await tx.lesson.createMany({
          data: lessonRows,
        });

        return { success: true, count: lessonRows.length };
      },
      { timeout: 60000, maxWait: 20000 }
    );
  } catch (error: any) {
    console.error("seedSchoolInitialData xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 3. Darslar to'plamini (Jadvalni) to'liq saqlash
 */
export async function saveTimetableLessons(
  schoolId: string,
  scheduleId: string,
  lessons: Lesson[]
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    await prisma.$transaction(async (tx) => {
      // 1. Faol Schedule topish yoki yangisini yaratish
      let activeSchedule = await tx.schedule.findFirst({
        where: { schoolId: actualSchoolId, isActive: true },
      });

      if (!activeSchedule) {
        activeSchedule = await tx.schedule.create({
          data: {
            schoolId: actualSchoolId,
            name: "2025-2026 o'quv yili 1-chorak dars jadvali",
            academicYear: "2025 - 2026",
            term: 1,
            status: "PUBLISHED",
            isActive: true,
          },
        });
      }

      const targetScheduleId = activeSchedule.id;

      // 2. Mavjud jadval darslarini tozalash
      await tx.lesson.deleteMany({
        where: { schoolId: actualSchoolId },
      });

      // 3. Yangi darslarni yaratish
      const lessonData = lessons.map((l) => ({
        scheduleId: targetScheduleId,
        schoolId: actualSchoolId,
        classId: l.classId,
        subjectId: l.subjectId,
        teacherId: l.teacherId,
        roomId: l.roomId || null,
        branchId: l.branchId,
        dayOfWeek: l.dayOfWeek,
        periodNumber: l.periodNumber,
        isLocked: l.isLocked || false,
      }));

      if (lessonData.length > 0) {
        await tx.lesson.createMany({
          data: lessonData,
          skipDuplicates: true,
        });
      }

      await tx.auditLog.create({
        data: {
          schoolId: actualSchoolId,
          userId: "system",
          action: "schedule.saved",
          payload: { lessonCount: lessons.length, timestamp: new Date().toISOString() },
        },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("saveTimetableLessons xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 4. Bitta darsning vaqtini yoki joyini ko'chirish
 */
export async function updateLessonPositionAction(
  schoolId: string,
  lessonId: string,
  dayOfWeek: number,
  periodNumber: number,
  teacherId?: string,
  roomId?: string
) {
  try {
    const existing = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!existing) {
      // Agar ID bazada topilmasa (lokal dars bo'lsa), xatoliksiz true qaytaramiz
      return { success: true };
    }

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        dayOfWeek,
        periodNumber,
        ...(teacherId ? { teacherId } : {}),
        ...(roomId !== undefined ? { roomId: roomId || null } : {}),
      },
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error("updateLessonPositionAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 5. Ikkita dars o'rnini almashtirish (SWAP)
 */
export async function swapLessonsAction(
  schoolId: string,
  lessonA: { id: string; dayOfWeek: number; periodNumber: number },
  lessonB: { id: string; dayOfWeek: number; periodNumber: number }
) {
  try {
    const [existA, existB] = await Promise.all([
      prisma.lesson.findUnique({ where: { id: lessonA.id } }),
      prisma.lesson.findUnique({ where: { id: lessonB.id } }),
    ]);

    if (existA && existB) {
      await prisma.$transaction([
        prisma.lesson.update({
          where: { id: lessonA.id },
          data: { dayOfWeek: lessonA.dayOfWeek, periodNumber: lessonA.periodNumber },
        }),
        prisma.lesson.update({
          where: { id: lessonB.id },
          data: { dayOfWeek: lessonB.dayOfWeek, periodNumber: lessonB.periodNumber },
        }),
      ]);
    }
    return { success: true };
  } catch (error: any) {
    console.error("swapLessonsAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 6. O'qituvchini yaratish yoki yangilash
 */
export async function upsertTeacherAction(schoolId: string, teacher: Teacher) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    await prisma.$transaction(async (tx) => {
      // Agar o'qituvchiga sinf biriktirilayotgan bo'lsa, avval bu sinf boshqa o'qituvchida bo'lsa tozalash (@unique xatoligini oldini olish)
      if (teacher.homeroomClassId) {
        await tx.teacher.updateMany({
          where: {
            schoolId: actualSchoolId,
            homeroomClassId: teacher.homeroomClassId,
            NOT: { id: teacher.id },
          },
          data: { homeroomClassId: null },
        });
      }

      let teacherRecord = await tx.teacher.findFirst({
        where: {
          OR: [
            { id: teacher.id },
            { schoolId: actualSchoolId, fullName: teacher.fullName.trim() },
            { schoolId: actualSchoolId, displayNumber: teacher.displayNumber || 999 },
          ],
        },
      });

      if (!teacherRecord) {
        // Yangi o'qituvchi
        teacherRecord = await tx.teacher.create({
          data: {
            schoolId: actualSchoolId,
            displayNumber:
              teacher.displayNumber || (await tx.teacher.count({ where: { schoolId: actualSchoolId } })) + 1,
            fullName: teacher.fullName.trim(),
            phone: teacher.phone || null,
            weeklyHourCapacity: teacher.weeklyHourCapacity || 20,
            maxConsecutiveHours: teacher.maxConsecutiveHours || 4,
            methodDay: teacher.methodDayOfWeek !== undefined ? teacher.methodDayOfWeek : null,
            homeroomClassId: teacher.homeroomClassId || null,
          },
        });
      } else {
        // Yangilash
        teacherRecord = await tx.teacher.update({
          where: { id: teacherRecord.id },
          data: {
            fullName: teacher.fullName.trim(),
            phone: teacher.phone || null,
            weeklyHourCapacity: teacher.weeklyHourCapacity,
            maxConsecutiveHours: teacher.maxConsecutiveHours,
            methodDay: teacher.methodDayOfWeek !== undefined ? teacher.methodDayOfWeek : null,
            homeroomClassId: teacher.homeroomClassId || null,
          },
        });

        // Eskilarini tozalab yangilarini bog'lash
        await tx.teacherSubject.deleteMany({ where: { teacherId: teacherRecord.id } });
        await tx.teacherBranch.deleteMany({ where: { teacherId: teacherRecord.id } });
      }

      // Agar sinf biriktirilgan bo'lsa, ClassSubject dagi Sinf soatini shu o'qituvchiga ulash
      if (teacher.homeroomClassId) {
        const sinfSoatiSubject = await tx.subject.findFirst({
          where: {
            schoolId: actualSchoolId,
            OR: [{ id: "sub_sinf_soati" }, { name: { contains: "Sinf soati" } }],
          },
        });
        if (sinfSoatiSubject) {
          await tx.classSubject.updateMany({
            where: {
              schoolId: actualSchoolId,
              classId: teacher.homeroomClassId,
              subjectId: sinfSoatiSubject.id,
            },
            data: { teacherId: teacherRecord.id },
          });
          await tx.lesson.updateMany({
            where: {
              schoolId: actualSchoolId,
              classId: teacher.homeroomClassId,
              OR: [
                { subjectId: sinfSoatiSubject.id },
                { dayOfWeek: 5, periodNumber: 1 },
              ],
            },
            data: { teacherId: teacherRecord.id },
          });
        }
      }

      // Fan bog'lamalari
      if (teacher.subjectIds && teacher.subjectIds.length > 0) {
        for (const subId of teacher.subjectIds) {
          const sub = await tx.subject.findFirst({
            where: { OR: [{ id: subId }, { schoolId: actualSchoolId, name: subId }] },
          });
          if (sub) {
            await tx.teacherSubject.create({
              data: { schoolId: actualSchoolId, teacherId: teacherRecord.id, subjectId: sub.id },
            });
          }
        }
      }

      // Filial bog'lamalari
      if (teacher.branchIds && teacher.branchIds.length > 0) {
        for (const bId of teacher.branchIds) {
          const branch = await tx.branch.findFirst({
            where: { OR: [{ id: bId }, { schoolId: actualSchoolId, name: bId }] },
          });
          if (branch) {
            await tx.teacherBranch.create({
              data: { schoolId: actualSchoolId, teacherId: teacherRecord.id, branchId: branch.id },
            });
          }
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("upsertTeacherAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 7. O'qituvchini o'chirish
 */
export async function deleteTeacherAction(schoolId: string, teacherId: string) {
  try {
    await prisma.teacher.deleteMany({
      where: { id: teacherId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("deleteTeacherAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 8. Sinfni yaratish yoki yangilash
 */
export async function upsertClassAction(schoolId: string, cls: SchoolClass) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    await prisma.$transaction(async (tx) => {
      // Filial va smena mavjudligini tekshirish
      let branch = await tx.branch.findFirst({
        where: { OR: [{ id: cls.branchId }, { schoolId: actualSchoolId }] },
      });
      if (!branch) {
        branch = await tx.branch.create({
          data: { schoolId: actualSchoolId, name: "Asosiy bino", isMain: true },
        });
      }

      let shift = await tx.shift.findFirst({
        where: { OR: [{ id: cls.shiftId }, { schoolId: actualSchoolId }] },
      });
      if (!shift) {
        shift = await tx.shift.create({
          data: {
            schoolId: actualSchoolId,
            name: "1-smena",
            startTime: "08:00",
            endTime: "13:10",
            periodsCount: 6,
          },
        });
      }

      const existing = await tx.class.findFirst({
        where: { OR: [{ id: cls.id }, { schoolId: actualSchoolId, name: cls.name.trim() }] },
      });

      let classId = cls.id;
      if (!existing) {
        const created = await tx.class.create({
          data: {
            schoolId: actualSchoolId,
            branchId: branch.id,
            shiftId: shift.id,
            name: cls.name.trim(),
            grade: cls.grade,
            isPrimary: cls.isPrimary || cls.grade <= 4,
          },
        });
        classId = created.id;
      } else {
        await tx.class.update({
          where: { id: existing.id },
          data: {
            branchId: branch.id,
            shiftId: shift.id,
            name: cls.name.trim(),
            grade: cls.grade,
            isPrimary: cls.isPrimary || cls.grade <= 4,
          },
        });
        classId = existing.id;
      }

      // Sinf rahbari tayinlash / bekor qilish
      if (cls.homeroomTeacherId) {
        // Avval bu sinfga biriktirilgan boshqa o'qituvchilarni tozalash
        await tx.teacher.updateMany({
          where: { schoolId: actualSchoolId, homeroomClassId: classId },
          data: { homeroomClassId: null },
        });

        const teacher = await tx.teacher.findFirst({
          where: { OR: [{ id: cls.homeroomTeacherId }, { schoolId: actualSchoolId }] },
        });
        if (teacher) {
          await tx.teacher.update({
            where: { id: teacher.id },
            data: { homeroomClassId: classId },
          });

          // Sinf soati fani bo'lsa uni ham yangi sinf rahbariga ulash
          const sinfSoati = await tx.subject.findFirst({
            where: { schoolId: actualSchoolId, OR: [{ id: "sub_sinf_soati" }, { name: { contains: "Sinf soati" } }] },
          });
          if (sinfSoati) {
            await tx.classSubject.updateMany({
              where: { classId, subjectId: sinfSoati.id },
              data: { teacherId: teacher.id },
            });
            await tx.lesson.updateMany({
              where: {
                schoolId: actualSchoolId,
                classId,
                OR: [{ subjectId: sinfSoati.id }, { dayOfWeek: 1, periodNumber: 1 }],
              },
              data: { teacherId: teacher.id },
            });
          }
        }
      } else {
        // Agar homeroomTeacherId bo'sh bo'lsa, bu sinfga biriktirilgan o'qituvchini tozalash
        await tx.teacher.updateMany({
          where: { schoolId: actualSchoolId, homeroomClassId: classId },
          data: { homeroomClassId: null },
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("upsertClassAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 9. Sinfni o'chirish
 */
export async function deleteClassAction(schoolId: string, classId: string) {
  try {
    await prisma.class.deleteMany({
      where: { id: classId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("deleteClassAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 10. Fanni yaratish yoki yangilash
 */
export async function upsertSubjectAction(schoolId: string, subject: Subject) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    const existing = await prisma.subject.findFirst({
      where: { OR: [{ id: subject.id }, { schoolId: actualSchoolId, name: subject.name.trim() }] },
    });

    if (!existing) {
      await prisma.subject.create({
        data: {
          schoolId: actualSchoolId,
          name: subject.name.trim(),
          shortName: subject.shortName || null,
          colorTag: subject.colorTag || "#3B82F6",
          difficultyScore: subject.difficultyScore || 5,
          allowDoubleLesson: subject.allowDoubleLesson || false,
          requiresRoomType: subject.requiresRoomType || null,
          isActive: subject.isActive !== undefined ? subject.isActive : true,
        },
      });
    } else {
      await prisma.subject.update({
        where: { id: existing.id },
        data: {
          name: subject.name.trim(),
          shortName: subject.shortName || null,
          colorTag: subject.colorTag,
          difficultyScore: subject.difficultyScore,
          allowDoubleLesson: subject.allowDoubleLesson,
          requiresRoomType: subject.requiresRoomType || null,
          isActive: subject.isActive !== undefined ? subject.isActive : true,
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("upsertSubjectAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 11. Fanni o'chirish
 */
export async function deleteSubjectAction(schoolId: string, subjectId: string) {
  try {
    await prisma.subject.deleteMany({
      where: { id: subjectId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("deleteSubjectAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 12. Sinf tarifikatsiyasini saqlash (ClassSubject larni yangilash)
 */
export async function saveClassTarifficationAction(
  schoolId: string,
  classId: string,
  subjects: Array<{ subjectId: string; teacherId: string; weeklyHours: number }>
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    await prisma.$transaction(async (tx) => {
      const cls = await tx.class.findFirst({
        where: { OR: [{ id: classId }, { schoolId: actualSchoolId, name: classId }] },
      });
      if (!cls) return;

      await tx.classSubject.deleteMany({
        where: { classId: cls.id, schoolId: actualSchoolId },
      });

      for (const s of subjects) {
        const sub = await tx.subject.findFirst({
          where: { OR: [{ id: s.subjectId }, { schoolId: actualSchoolId, name: s.subjectId }] },
        });
        const teacher = await tx.teacher.findFirst({
          where: { OR: [{ id: s.teacherId }, { schoolId: actualSchoolId, fullName: s.teacherId }] },
        });

        if (sub && teacher) {
          await tx.classSubject.create({
            data: {
              schoolId: actualSchoolId,
              classId: cls.id,
              subjectId: sub.id,
              teacherId: teacher.id,
              weeklyHours: s.weeklyHours,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("saveClassTarifficationAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 12.1. O'qituvchi bo'yicha dars yuklamasini saqlash (Teacher -> Classes Tariffication Sync)
 */
export async function saveTeacherWorkloadAction(
  schoolId: string,
  teacherId: string,
  assignments: Array<{ classId: string; subjectId: string; weeklyHours: number }>
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    await prisma.$transaction(async (tx) => {
      const teacher = await tx.teacher.findFirst({
        where: { OR: [{ id: teacherId }, { schoolId: actualSchoolId, fullName: teacherId }] },
      });
      if (!teacher) return;

      // Ushbu o'qituvchining avvalgi barcha biriktirilgan ClassSubject larini tozalash
      await tx.classSubject.deleteMany({
        where: { teacherId: teacher.id, schoolId: actualSchoolId },
      });

      // Yangi biriktirilgan dars soatlarini yozish
      for (const a of assignments) {
        const cls = await tx.class.findFirst({
          where: { OR: [{ id: a.classId }, { schoolId: actualSchoolId, name: a.classId }] },
        });
        const sub = await tx.subject.findFirst({
          where: { OR: [{ id: a.subjectId }, { schoolId: actualSchoolId, name: a.subjectId }] },
        });

        if (cls && sub) {
          // Sinfda ushbu fan bo'yicha boshqa yozuv bo'lsa tozalash (duplicate oldini olish)
          await tx.classSubject.deleteMany({
            where: { classId: cls.id, subjectId: sub.id, schoolId: actualSchoolId },
          });

          await tx.classSubject.create({
            data: {
              schoolId: actualSchoolId,
              classId: cls.id,
              subjectId: sub.id,
              teacherId: teacher.id,
              weeklyHours: a.weeklyHours,
            },
          });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("saveTeacherWorkloadAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 13. Sinf rahbarini o'zgartirish va Sinf soatini sinxronlash (Two-Way Sync)
 */
export async function setHomeroomTeacherAction(
  schoolId: string,
  classId: string,
  teacherId?: string | null
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    await prisma.$transaction(async (tx) => {
      // 1. Sinfni aniqlash
      const cls = await tx.class.findFirst({
        where: { OR: [{ id: classId }, { schoolId: actualSchoolId, name: classId }] },
      });
      if (!cls) return;

      // 2. Avvalgi rahbar(lar)ni tozalash
      await tx.teacher.updateMany({
        where: { schoolId: actualSchoolId, homeroomClassId: cls.id },
        data: { homeroomClassId: null },
      });

      if (!teacherId) {
        return;
      }

      const teacher = await tx.teacher.findFirst({
        where: { OR: [{ id: teacherId }, { schoolId: actualSchoolId, fullName: teacherId }] },
      });

      if (!teacher) return;

      // 3. O'qituvchi homeroom bog'lamasini yangilash
      await tx.teacher.update({
        where: { id: teacher.id },
        data: { homeroomClassId: cls.id },
      });

      // 4. ClassSubject (Sinf soati) ni yangi o'qituvchiga o'tkazish
      const sinfSoatiSubject = await tx.subject.findFirst({
        where: {
          schoolId: actualSchoolId,
          OR: [{ id: "sub_sinf_soati" }, { name: { contains: "Sinf soati" } }],
        },
      });

      if (sinfSoatiSubject) {
        await tx.classSubject.updateMany({
          where: { classId: cls.id, subjectId: sinfSoatiSubject.id },
          data: { teacherId: teacher.id },
        });

        // 5. Mavjud darslar jadvalidagi Sinf soatini yangilash
        await tx.lesson.updateMany({
          where: {
            schoolId: actualSchoolId,
            classId: cls.id,
            OR: [
              { subjectId: sinfSoatiSubject.id },
              { dayOfWeek: 1, periodNumber: 1 },
            ],
          },
          data: { teacherId: teacher.id },
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("setHomeroomTeacherAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 14. Maktab rekvizitlarini yangilash (Direktor, Zauch, Ruhshunos)
 */
export async function updateSchoolDetailsAction(
  schoolId: string,
  data: Partial<SchoolInfo>
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };

    await prisma.school.update({
      where: { id: school.id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.region ? { region: data.region.trim() } : {}),
        ...(data.directorName !== undefined ? { directorFullName: data.directorName } : {}),
        ...(data.vicePrincipalName !== undefined
          ? { academicVicePrincipalName: data.vicePrincipalName }
          : {}),
        ...(data.psychologistName !== undefined ? { psychologistName: data.psychologistName } : {}),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("updateSchoolDetailsAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 15. To'liq maktab holatini bulutga (Neon PostgreSQL) sinxronlash (Full Push)
 * Bu funksiya brauzerdagi (masalan, Zauch kiritgan) barcha ma'lumotlarni markaziy bazaga to'liq saqlaydi.
 */
export async function syncFullSchoolDataAction(
  schoolId: string,
  fullData: {
    schoolInfo?: Partial<SchoolInfo>;
    branches?: Branch[];
    shifts?: Shift[];
    subjects?: Subject[];
    rooms?: Room[];
    teachers?: Teacher[];
    classes?: SchoolClass[];
    lessons?: Lesson[];
  }
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    await prisma.$transaction(
      async (tx) => {
        // 1. Maktab rekvizitlari
        if (fullData.schoolInfo) {
          await tx.school.update({
            where: { id: actualSchoolId },
            data: {
              ...(fullData.schoolInfo.name ? { name: fullData.schoolInfo.name.trim() } : {}),
              ...(fullData.schoolInfo.region ? { region: fullData.schoolInfo.region.trim() } : {}),
              ...(fullData.schoolInfo.directorName ? { directorFullName: fullData.schoolInfo.directorName } : {}),
              ...(fullData.schoolInfo.vicePrincipalName ? { academicVicePrincipalName: fullData.schoolInfo.vicePrincipalName } : {}),
              ...(fullData.schoolInfo.psychologistName ? { psychologistName: fullData.schoolInfo.psychologistName } : {}),
            },
          });
        }

        // 2. Fanlar
        const subjectMap = new Map<string, string>();
        if (fullData.subjects && fullData.subjects.length > 0) {
          for (const s of fullData.subjects) {
            let existing = await tx.subject.findFirst({
              where: { OR: [{ id: s.id }, { schoolId: actualSchoolId, name: s.name.trim() }] },
            });
            if (!existing) {
              existing = await tx.subject.create({
                data: {
                  schoolId: actualSchoolId,
                  name: s.name.trim(),
                  shortName: s.shortName || null,
                  colorTag: s.colorTag || "#3B82F6",
                  difficultyScore: s.difficultyScore || 5,
                  allowDoubleLesson: s.allowDoubleLesson || false,
                  requiresRoomType: s.requiresRoomType || null,
                  isActive: s.isActive !== undefined ? s.isActive : true,
                },
              });
            } else {
              await tx.subject.update({
                where: { id: existing.id },
                data: {
                  isActive: s.isActive !== undefined ? s.isActive : existing.isActive,
                },
              });
            }
            subjectMap.set(s.id, existing.id);
            subjectMap.set(s.name.trim(), existing.id);
          }
        }

        // 3. Filiallar
        const branchMap = new Map<string, string>();
        if (fullData.branches && fullData.branches.length > 0) {
          for (const b of fullData.branches) {
            let existing = await tx.branch.findFirst({
              where: { OR: [{ id: b.id }, { schoolId: actualSchoolId, name: b.name.trim() }] },
            });
            if (!existing) {
              existing = await tx.branch.create({
                data: {
                  schoolId: actualSchoolId,
                  name: b.name.trim(),
                  address: b.address || null,
                  isMain: b.isMain || false,
                },
              });
            }
            branchMap.set(b.id, existing.id);
          }
        }

        // 4. Smenalar
        const shiftMap = new Map<string, string>();
        if (fullData.shifts && fullData.shifts.length > 0) {
          for (let i = 0; i < fullData.shifts.length; i++) {
            const sh = fullData.shifts[i];
            let existing = await tx.shift.findFirst({
              where: { OR: [{ id: sh.id }, { schoolId: actualSchoolId, name: sh.name.trim() }] },
            });
            if (!existing) {
              existing = await tx.shift.create({
                data: {
                  schoolId: actualSchoolId,
                  name: sh.name.trim(),
                  startTime: sh.startTime || "08:00",
                  endTime: sh.endTime || "13:10",
                  periodsCount: sh.periodsCount || 6,
                  order: i + 1,
                },
              });
            }
            shiftMap.set(sh.id, existing.id);
          }
        }

        // 5. Xonalar
        const roomMap = new Map<string, string>();
        if (fullData.rooms && fullData.rooms.length > 0) {
          for (const r of fullData.rooms) {
            const bId = branchMap.get(r.branchId) || Array.from(branchMap.values())[0];
            let existing = await tx.room.findFirst({
              where: { OR: [{ id: r.id }, { schoolId: actualSchoolId, name: r.name.trim() }] },
            });
            if (!existing && bId) {
              existing = await tx.room.create({
                data: {
                  schoolId: actualSchoolId,
                  branchId: bId,
                  name: r.name.trim(),
                  roomType: r.roomType || "GENERAL",
                  capacity: r.capacity || 35,
                },
              });
            }
            if (existing) {
              roomMap.set(r.id, existing.id);
            }
          }
        }

        // 6. O'qituvchilar
        const teacherMap = new Map<string, string>();
        if (fullData.teachers && fullData.teachers.length > 0) {
          for (let i = 0; i < fullData.teachers.length; i++) {
            const t = fullData.teachers[i];
            let existing = await tx.teacher.findFirst({
              where: { OR: [{ id: t.id }, { schoolId: actualSchoolId, fullName: t.fullName.trim() }] },
            });

            if (!existing) {
              existing = await tx.teacher.create({
                data: {
                  schoolId: actualSchoolId,
                  displayNumber: t.displayNumber || i + 1,
                  fullName: t.fullName.trim(),
                  phone: t.phone || null,
                  weeklyHourCapacity: t.weeklyHourCapacity || 20,
                  maxConsecutiveHours: t.maxConsecutiveHours || 4,
                  methodDay: t.methodDayOfWeek !== undefined ? t.methodDayOfWeek : null,
                },
              });
            } else {
              existing = await tx.teacher.update({
                where: { id: existing.id },
                data: {
                  fullName: t.fullName.trim(),
                  phone: t.phone || null,
                  weeklyHourCapacity: t.weeklyHourCapacity || 20,
                  maxConsecutiveHours: t.maxConsecutiveHours || 4,
                  methodDay: t.methodDayOfWeek !== undefined ? t.methodDayOfWeek : null,
                },
              });
            }
            teacherMap.set(t.id, existing.id);
            teacherMap.set(t.fullName.trim(), existing.id);

            // Fan bog'lamalari
            if (t.subjectIds && t.subjectIds.length > 0) {
              for (const sId of t.subjectIds) {
                const mappedSubId = subjectMap.get(sId);
                if (mappedSubId) {
                  await tx.teacherSubject.upsert({
                    where: { teacherId_subjectId: { teacherId: existing.id, subjectId: mappedSubId } },
                    create: { schoolId: actualSchoolId, teacherId: existing.id, subjectId: mappedSubId },
                    update: {},
                  });
                }
              }
            }
          }
        }

        // 7. Sinflar va Tarifikatsiya
        const classMap = new Map<string, string>();
        if (fullData.classes && fullData.classes.length > 0) {
          for (const c of fullData.classes) {
            const bId = branchMap.get(c.branchId) || Array.from(branchMap.values())[0];
            const sId = shiftMap.get(c.shiftId) || Array.from(shiftMap.values())[0];
            if (!bId || !sId) continue;

            let existing = await tx.class.findFirst({
              where: { OR: [{ id: c.id }, { schoolId: actualSchoolId, name: c.name.trim() }] },
            });

            if (!existing) {
              existing = await tx.class.create({
                data: {
                  schoolId: actualSchoolId,
                  branchId: bId,
                  shiftId: sId,
                  name: c.name.trim(),
                  grade: c.grade,
                  isPrimary: c.isPrimary || c.grade <= 4,
                },
              });
            } else {
              existing = await tx.class.update({
                where: { id: existing.id },
                data: {
                  branchId: bId,
                  shiftId: sId,
                  grade: c.grade,
                  isPrimary: c.isPrimary || c.grade <= 4,
                },
              });
            }
            classMap.set(c.id, existing.id);
            classMap.set(c.name.trim(), existing.id);

            // Tarifikatsiya
            if (c.subjects && c.subjects.length > 0) {
              for (const cs of c.subjects) {
                const mappedSubId = subjectMap.get(cs.subjectId);
                const mappedTeacherId = teacherMap.get(cs.teacherId);
                if (mappedSubId && mappedTeacherId) {
                  await tx.classSubject.upsert({
                    where: {
                      classId_subjectId_teacherId: {
                        classId: existing.id,
                        subjectId: mappedSubId,
                        teacherId: mappedTeacherId,
                      },
                    },
                    create: {
                      schoolId: actualSchoolId,
                      classId: existing.id,
                      subjectId: mappedSubId,
                      teacherId: mappedTeacherId,
                      weeklyHours: cs.weeklyHours,
                    },
                    update: {
                      weeklyHours: cs.weeklyHours,
                    },
                  });
                }
              }
            }
          }
        }

        // 8. Darslar (Schedule & Lessons)
        if (fullData.lessons && fullData.lessons.length > 0) {
          let activeSchedule = await tx.schedule.findFirst({
            where: { schoolId: actualSchoolId, isActive: true },
          });
          if (!activeSchedule) {
            activeSchedule = await tx.schedule.create({
              data: {
                schoolId: actualSchoolId,
                name: "2025-2026 o'quv yili 1-chorak dars jadvali",
                academicYear: "2025 - 2026",
                term: 1,
                status: "PUBLISHED",
                isActive: true,
              },
            });
          }

          const defaultBranchId = Array.from(branchMap.values())[0];
          const lessonRows = [];

          for (const l of fullData.lessons) {
            const mappedClassId = classMap.get(l.classId);
            const mappedSubjectId = subjectMap.get(l.subjectId);
            const mappedTeacherId = teacherMap.get(l.teacherId);
            const mappedBranchId = branchMap.get(l.branchId) || defaultBranchId;
            const mappedRoomId = l.roomId ? roomMap.get(l.roomId) || null : null;

            if (mappedClassId && mappedSubjectId && mappedTeacherId && mappedBranchId) {
              lessonRows.push({
                scheduleId: activeSchedule.id,
                schoolId: actualSchoolId,
                classId: mappedClassId,
                subjectId: mappedSubjectId,
                teacherId: mappedTeacherId,
                roomId: mappedRoomId,
                branchId: mappedBranchId,
                dayOfWeek: l.dayOfWeek,
                periodNumber: l.periodNumber,
                isLocked: l.isLocked || false,
              });
            }
          }

          if (lessonRows.length > 0) {
            await tx.lesson.deleteMany({ where: { schoolId: actualSchoolId } });
            await tx.lesson.createMany({ data: lessonRows, skipDuplicates: true });
          }
        }

        // Audit Log
        await tx.auditLog.create({
          data: {
            schoolId: actualSchoolId,
            userId: "system",
            action: "school.cloud_synced",
            payload: { timestamp: new Date().toISOString() },
          },
        });
      },
      { timeout: 60000, maxWait: 20000 }
    );

    return { success: true, schoolId: actualSchoolId };
  } catch (error: any) {
    console.error("syncFullSchoolDataAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}
