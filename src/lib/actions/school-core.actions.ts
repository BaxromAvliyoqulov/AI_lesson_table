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
      return { success: false, error: "Maktab topilmadi" };
    }

    // Agar bazada o'qituvchilar yoki sinflar umuman bo'lmasa, boshlang'ich ma'lumotlarni seed qilish
    if (school.teachers.length === 0 || school.classes.length === 0) {
      await seedSchoolInitialData(school.id);
      return await getSchoolFullData(school.id);
    }

    const schoolInfo: SchoolInfo = {
      id: school.id,
      slug: school.slug,
      name: school.name,
      region: school.region || "Muzrabot tumani",
      academicYear: school.academicYear || "2025 - 2026",
      approvalDate: school.approvalDate || "2026-yil 28-mart",
      directorName: school.directorFullName || "",
      vicePrincipalName: school.academicVicePrincipalName || "",
      psychologistName: school.psychologistName || "",
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

    const subjects: Subject[] = school.subjects.map((sub) => ({
      id: sub.id,
      schoolId: sub.schoolId,
      name: sub.name,
      shortName: sub.shortName || undefined,
      colorTag: sub.colorTag,
      difficultyScore: sub.difficultyScore,
      allowDoubleLesson: sub.allowDoubleLesson,
      requiresRoomType: (sub.requiresRoomType as any) || undefined,
      isActive: sub.isActive,
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
      subjectIds: t.subjects.map((s) => s.subjectId),
      branchIds: t.branches.map((b) => b.branchId),
      weeklyHourCapacity: t.weeklyHourCapacity,
      maxConsecutiveHours: t.maxConsecutiveHours,
      methodDayOfWeek: t.methodDay !== null ? t.methodDay : undefined,
      homeroomClassId: t.homeroomClassId || undefined,
    }));

    const classes: SchoolClass[] = school.classes.map((c) => {
      const homeroomTeacher = school.teachers.find((t) => t.homeroomClassId === c.id);
      return {
        id: c.id,
        schoolId: c.schoolId,
        branchId: c.branchId,
        shiftId: c.shiftId,
        name: c.name,
        grade: c.grade,
        isPrimary: c.isPrimary,
        homeroomTeacherId: homeroomTeacher ? homeroomTeacher.id : undefined,
        subjects: c.subjects.map((cs) => ({
          id: cs.id,
          classId: c.id,
          subjectId: cs.subjectId,
          teacherId: cs.teacherId,
          weeklyHours: cs.weeklyHours,
        })),
      };
    });

    const activeSchedule = school.schedules[0];
    let lessons: Lesson[] = [];

    if (activeSchedule && activeSchedule.lessons.length > 0) {
      lessons = activeSchedule.lessons.map((l) => ({
        id: l.id,
        scheduleId: activeSchedule.id,
        schoolId: school.id,
        classId: l.classId,
        subjectId: l.subjectId,
        teacherId: l.teacherId,
        roomId: l.roomId || undefined,
        branchId: l.branchId,
        dayOfWeek: l.dayOfWeek,
        periodNumber: l.periodNumber,
        isLocked: l.isLocked,
      }));
    }

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
        bellPeriods: (school.shifts[0]?.bellPeriods as unknown as BellPeriod[]) || [],
        activeScheduleId: activeSchedule?.id,
      },
    };
  } catch (error: any) {
    console.error("getSchoolFullData xatosi:", error);
    return { success: false, error: error?.message };
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

        // 7. Darslar (Schedule & Lessons)
        const activeSchedule = await tx.schedule.create({
          data: {
            schoolId: actualSchoolId,
            name: "2025-2026 o'quv yili 1-chorak dars jadvali",
            academicYear: "2025 - 2026",
            term: 1,
            status: "PUBLISHED",
            isActive: true,
          },
        });

        // CSP Solver orqali boshlang'ich dars jadvalini hisoblash
        const transformedClasses: SchoolClass[] = initialC.map((c) => ({
          id: classMap.get(c.id) || c.id,
          schoolId: actualSchoolId,
          branchId: branchMap.get(c.branchId) || c.branchId,
          shiftId: shiftMap.get(c.shiftId) || c.shiftId,
          name: c.name,
          grade: c.grade,
          isPrimary: c.isPrimary,
          homeroomTeacherId: c.homeroomTeacherId ? teacherMap.get(c.homeroomTeacherId) : undefined,
          subjects: c.subjects.map((cs) => ({
            id: cs.id,
            classId: classMap.get(c.id) || c.id,
            subjectId: subjectMap.get(cs.subjectId) || cs.subjectId,
            teacherId: teacherMap.get(cs.teacherId) || cs.teacherId,
            weeklyHours: cs.weeklyHours,
          })),
        }));

        const transformedTeachers: Teacher[] = initialT.map((t) => ({
          id: teacherMap.get(t.id) || t.id,
          schoolId: actualSchoolId,
          displayNumber: t.displayNumber,
          fullName: t.fullName,
          phone: t.phone,
          subjectIds: t.subjectIds.map((s) => subjectMap.get(s) || s),
          branchIds: t.branchIds.map((b) => branchMap.get(b) || b),
          weeklyHourCapacity: t.weeklyHourCapacity,
          maxConsecutiveHours: t.maxConsecutiveHours,
          methodDayOfWeek: t.methodDayOfWeek,
        }));

        const solver = new CSPSolver({
          classes: transformedClasses,
          teachers: transformedTeachers,
          subjects: Array.from(subjectMap.entries()).map(([origId, dbId]) => {
            const orig = initialSub.find((s) => s.id === origId)!;
            return {
              id: dbId,
              schoolId: actualSchoolId,
              name: orig?.name || "Fan",
              colorTag: orig?.colorTag || "#3B82F6",
              difficultyScore: orig?.difficultyScore || 5,
              allowDoubleLesson: orig?.allowDoubleLesson || false,
            };
          }),
          rooms: Array.from(roomMap.entries()).map(([origId, dbId]) => {
            const orig = initialR.find((r) => r.id === origId)!;
            return {
              id: dbId,
              schoolId: actualSchoolId,
              branchId: branchMap.get(orig?.branchId) || "",
              name: orig?.name || "Xona",
              roomType: orig?.roomType || "GENERAL",
              capacity: orig?.capacity || 35,
            };
          }),
          shifts: initialS.map((s) => ({
            id: shiftMap.get(s.id) || s.id,
            schoolId: actualSchoolId,
            name: s.name,
            startTime: s.startTime,
            endTime: s.endTime,
            periodsCount: s.periodsCount,
          })),
          branches: initialB.map((b) => ({
            id: branchMap.get(b.id) || b.id,
            schoolId: actualSchoolId,
            name: b.name,
            isMain: b.isMain,
          })),
          daysCount: 6,
          maxPeriodsPerDay: 6,
        });

        const solveResult = solver.solve();
        if (solveResult.lessons && solveResult.lessons.length > 0) {
          const lessonRows = solveResult.lessons.map((l) => ({
            scheduleId: activeSchedule.id,
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
            skipDuplicates: true,
          });
        }

        return { success: true };
      },
      { timeout: 60000, maxWait: 20000 }
    );
  } catch (error: any) {
    console.error("seedSchoolInitialData xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 3. Maktab rekvizitlarini yangilash (Direktor, Zauch, Ruhshunos)
 */
export async function updateSchoolDetailsAction(
  schoolId: string,
  data: Partial<SchoolInfo>
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };

    const updatePayload: any = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.region !== undefined) updatePayload.region = data.region.trim();
    if (data.directorName !== undefined) updatePayload.directorFullName = data.directorName;
    if (data.vicePrincipalName !== undefined) updatePayload.academicVicePrincipalName = data.vicePrincipalName;
    if (data.psychologistName !== undefined) updatePayload.psychologistName = data.psychologistName;
    if (data.academicYear !== undefined) updatePayload.academicYear = data.academicYear;
    if (data.approvalDate !== undefined) updatePayload.approvalDate = data.approvalDate;

    await prisma.school.update({
      where: { id: school.id },
      data: updatePayload,
    });

    return { success: true };
  } catch (error: any) {
    console.error("updateSchoolDetailsAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * 4. To'liq maktab holatini bulutga (Neon PostgreSQL) sinxronlash (Full Push)
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
