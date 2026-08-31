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
 * 1. Maktabning barcha ma'lumotlarini Neon PostgreSQL bazasidan to'liq olish
 */
export async function getSchoolFullData(schoolId: string) {
  try {
    let school = await prisma.school.findUnique({
      where: { id: schoolId },
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
      // Agar schoolId slug bo'yicha qidirilsa
      school = await prisma.school.findFirst({
        where: { OR: [{ id: schoolId }, { slug: schoolId }] },
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
    }

    if (!school) {
      return { success: false, error: "Maktab topilmadi" };
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
    return await prisma.$transaction(
      async (tx) => {
        // 1. Filiallar
        const branchMap = new Map<string, string>();
        const initialB = initialBranches.filter((b) => b.schoolId === "school_39");
        for (const b of initialB) {
          const branch = await tx.branch.create({
            data: {
              schoolId,
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
              schoolId,
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
              schoolId,
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
              schoolId,
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
              schoolId,
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
                schoolId,
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
                schoolId,
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
              schoolId,
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
                schoolId,
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
          schoolId,
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
          schoolId,
          displayNumber: idx + 1,
          subjectIds: t.subjectIds.map((sid) => subjectMap.get(sid) || sid),
          branchIds: t.branchIds.map((bid) => branchMap.get(bid) || bid),
        }));

        const solverSubjects = initialSub.map((s) => ({
          ...s,
          id: subjectMap.get(s.id) || s.id,
          schoolId,
        }));

        const solverRooms = initialR.map((r) => ({
          ...r,
          id: roomMap.get(r.id) || r.id,
          schoolId,
          branchId: branchMap.get(r.branchId) || r.branchId,
        }));

        const solverShifts = initialS.map((s) => ({
          ...s,
          id: shiftMap.get(s.id) || s.id,
          schoolId,
        }));

        const solverBranches = initialB.map((b) => ({
          ...b,
          id: branchMap.get(b.id) || b.id,
          schoolId,
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
            schoolId,
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
          schoolId,
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
export async function saveTimetableLessons(schoolId: string, scheduleId: string, lessons: Lesson[]) {
  try {
    await prisma.$transaction(async (tx) => {
      // Mavjud schedule darslarini tozalash yoki yangilash
      await tx.lesson.deleteMany({
        where: { scheduleId, schoolId },
      });

      for (const l of lessons) {
        await tx.lesson.create({
          data: {
            scheduleId,
            schoolId,
            classId: l.classId,
            subjectId: l.subjectId,
            teacherId: l.teacherId,
            roomId: l.roomId || null,
            branchId: l.branchId,
            dayOfWeek: l.dayOfWeek,
            periodNumber: l.periodNumber,
            isLocked: l.isLocked || false,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          schoolId,
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
    await prisma.$transaction(async (tx) => {
      let teacherRecord = await tx.teacher.findFirst({
        where: { OR: [{ id: teacher.id }, { schoolId, displayNumber: teacher.displayNumber || 999 }] },
      });

      if (!teacherRecord) {
        // Yangi o'qituvchi
        teacherRecord = await tx.teacher.create({
          data: {
            schoolId,
            displayNumber: teacher.displayNumber || (await tx.teacher.count({ where: { schoolId } })) + 1,
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

      // Fan bog'lamalari
      if (teacher.subjectIds && teacher.subjectIds.length > 0) {
        for (const subId of teacher.subjectIds) {
          await tx.teacherSubject.create({
            data: { schoolId, teacherId: teacherRecord.id, subjectId: subId },
          });
        }
      }

      // Filial bog'lamalari
      if (teacher.branchIds && teacher.branchIds.length > 0) {
        for (const bId of teacher.branchIds) {
          await tx.teacherBranch.create({
            data: { schoolId, teacherId: teacherRecord.id, branchId: bId },
          });
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
    await prisma.teacher.delete({
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
    await prisma.$transaction(async (tx) => {
      const existing = await tx.class.findFirst({
        where: { OR: [{ id: cls.id }, { schoolId, name: cls.name }] },
      });

      let classId = cls.id;
      if (!existing) {
        const created = await tx.class.create({
          data: {
            schoolId,
            branchId: cls.branchId,
            shiftId: cls.shiftId,
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
            branchId: cls.branchId,
            shiftId: cls.shiftId,
            name: cls.name.trim(),
            grade: cls.grade,
            isPrimary: cls.isPrimary || cls.grade <= 4,
          },
        });
        classId = existing.id;
      }

      // Sinf rahbari tayinlash
      if (cls.homeroomTeacherId) {
        await tx.teacher.update({
          where: { id: cls.homeroomTeacherId },
          data: { homeroomClassId: classId },
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
    await prisma.class.delete({
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
    const existing = await prisma.subject.findFirst({
      where: { OR: [{ id: subject.id }, { schoolId, name: subject.name }] },
    });

    if (!existing) {
      await prisma.subject.create({
        data: {
          schoolId,
          name: subject.name.trim(),
          shortName: subject.shortName || null,
          colorTag: subject.colorTag || "#3B82F6",
          difficultyScore: subject.difficultyScore || 5,
          allowDoubleLesson: subject.allowDoubleLesson || false,
          requiresRoomType: subject.requiresRoomType || null,
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
    await prisma.subject.delete({
      where: { id: subjectId },
    });
    return { success: true };
  } catch (error: any) {
    console.error("deleteSubjectAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 12. Tarifikatsiya dars soatlarini saqlash
 */
export async function saveClassTarifficationAction(
  schoolId: string,
  classId: string,
  subjects: Array<{ subjectId: string; teacherId: string; weeklyHours: number }>
) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.classSubject.deleteMany({
        where: { classId, schoolId },
      });

      for (const s of subjects) {
        await tx.classSubject.create({
          data: {
            schoolId,
            classId,
            subjectId: s.subjectId,
            teacherId: s.teacherId,
            weeklyHours: s.weeklyHours,
          },
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("saveClassTarifficationAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 13. Sinf rahbarini o'zgartirish va Sinf soatini sinxronlash (Two-Way Sync)
 */
export async function setHomeroomTeacherAction(
  schoolId: string,
  classId: string,
  teacherId: string
) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. O'qituvchi homeroom bog'lamasini yangilash
      await tx.teacher.updateMany({
        where: { schoolId, homeroomClassId: classId },
        data: { homeroomClassId: null },
      });

      await tx.teacher.update({
        where: { id: teacherId },
        data: { homeroomClassId: classId },
      });

      // 2. ClassSubject (Sinf soati) ni yangi o'qituvchiga o'tkazish
      const sinfSoatiSubject = await tx.subject.findFirst({
        where: { schoolId, name: { contains: "Sinf soati" } },
      });

      if (sinfSoatiSubject) {
        await tx.classSubject.updateMany({
          where: { classId, subjectId: sinfSoatiSubject.id },
          data: { teacherId },
        });

        // 3. Mavjud darslar jadvalidagi Sinf soatini yangilash
        await tx.lesson.updateMany({
          where: { classId, subjectId: sinfSoatiSubject.id },
          data: { teacherId },
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
    await prisma.school.update({
      where: { id: schoolId },
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
