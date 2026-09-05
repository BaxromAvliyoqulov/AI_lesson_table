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
import { CSPSolver } from "@/lib/solver/csp-solver";
import { resolveDbBranchId, resolveDbShiftId } from "@/lib/utils";

/**
 * 0. Maktab ID yoki slug bo'yicha bazadagi haqiqiy School yozuvini aniqlash (Auto-Resolver)
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

      // 2. Slug bo'yicha
      const bySlug = await prisma.school.findFirst({
        where: {
          OR: [
            { slug: schoolIdOrSlug },
            { id: schoolIdOrSlug },
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
        name: "Umumiy o'rta ta'lim maktabi",
        slug: schoolIdOrSlug || "maktab",
        region: "",
        directorFullName: "",
        academicVicePrincipalName: "",
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

    const schoolInfo: SchoolInfo = {
      id: school.id,
      slug: school.slug,
      name: school.name,
      region: school.region || "",
      academicYear: school.academicYear || "2025 - 2026",
      approvalDate: school.approvalDate || "",
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
      methodDayOfWeek: sub.methodDayOfWeek !== null ? sub.methodDayOfWeek : undefined,
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
      maxGapsPerDay: t.maxGapsPerDay || 1,
      methodDayOfWeek: t.methodDay !== null ? t.methodDay : undefined,
      homeroomClassId: t.homeroomClassId || undefined,
      teachingStages: (t.teachingStages as any) || "BOTH",
      availabilities: (t.availabilities || []).map((a) => ({
        teacherId: a.teacherId,
        dayOfWeek: a.dayOfWeek,
        period: a.period,
        isAvailable: a.isAvailable,
      })),
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
        studentCount: c.studentCount || 25,
        isClosed: c.isClosed || false,
        blockedDays: c.grade <= 4 ? [6] : [],
        homeroomTeacherId: homeroomTeacher ? homeroomTeacher.id : undefined,
        subjects: c.subjects.map((cs) => ({
          id: cs.id,
          classId: c.id,
          subjectId: cs.subjectId,
          teacherId: cs.teacherId,
          weeklyHours: cs.weeklyHours,
          groupType: (cs.groupType as any) || "WHOLE",
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
        groupType: (l.groupType as any) || "WHOLE",
        isLocked: l.isLocked,
      }));

      // BAZA TOZALASH: Agar avvalgi eski darslarda Juma kuni ingliz yoki chet tili bo'lsa, darhol tozalaymiz
      const hasMethodViolation = lessons.some(
        (l) =>
          (l.subjectId === "sub_ing" ||
            l.subjectId === "sub_rus" ||
            l.subjectId === "sub_nemis" ||
            l.subjectId === "sub_fransuz") &&
          l.dayOfWeek === 5
      );

      if (hasMethodViolation && classes.length > 0 && teachers.length > 0) {
        const solver = new CSPSolver({
          classes,
          teachers,
          subjects,
          rooms,
          branches,
          shifts,
        });
        const solved = solver.solve();
        if (solved.success && solved.lessons.length > 0) {
          lessons = solved.lessons;
          // Asinxron tarzda PostgreSQL bazasini yangilab qo'yamiz
          prisma.lesson.deleteMany({ where: { scheduleId: activeSchedule.id } }).then(() => {
            prisma.lesson.createMany({
              data: solved.lessons.map((l) => ({
                scheduleId: activeSchedule.id,
                schoolId: school.id,
                classId: l.classId,
                subjectId: l.subjectId,
                teacherId: l.teacherId,
                roomId: l.roomId || null,
                branchId: l.branchId,
                dayOfWeek: l.dayOfWeek,
                periodNumber: l.periodNumber,
                isLocked: l.isLocked || false,
              })),
              skipDuplicates: true,
            }).catch(() => {});
          }).catch(() => {});
        }
      }
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
 * 2. Maktab uchun boshlang'ich asosiy tuzilmani yaratish (Clean Init)
 */
export async function seedSchoolInitialData(schoolId: string) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    return await prisma.$transaction(async (tx) => {
      // 1. Asosiy filial
      const existingBranch = await tx.branch.findFirst({ where: { schoolId: actualSchoolId } });
      if (!existingBranch) {
        await tx.branch.create({
          data: {
            schoolId: actualSchoolId,
            name: "Asosiy bino",
            isMain: true,
          },
        });
      }

      // 2. 1-smena
      const existingShift = await tx.shift.findFirst({ where: { schoolId: actualSchoolId } });
      if (!existingShift) {
        await tx.shift.create({
          data: {
            schoolId: actualSchoolId,
            name: "1-smena",
            startTime: "08:00",
            endTime: "13:10",
            periodsCount: 6,
            order: 1,
          },
        });
      }

      return { success: true };
    });
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
                  colorTag: s.colorTag || existing.colorTag,
                  shortName: s.shortName !== undefined ? s.shortName : existing.shortName,
                  difficultyScore: s.difficultyScore || existing.difficultyScore,
                  methodDayOfWeek: s.methodDayOfWeek !== undefined ? s.methodDayOfWeek : existing.methodDayOfWeek,
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
        const allDbBranches = await tx.branch.findMany({ where: { schoolId: actualSchoolId } });

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
        const allDbShifts = await tx.shift.findMany({ where: { schoolId: actualSchoolId } });

        // 5. Xonalar
        const roomMap = new Map<string, string>();
        if (fullData.rooms && fullData.rooms.length > 0) {
          for (const r of fullData.rooms) {
            const bId = branchMap.get(r.branchId) || resolveDbBranchId(allDbBranches, r.branchId);
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
              const maxTeacher = await tx.teacher.findFirst({
                where: { schoolId: actualSchoolId },
                orderBy: { displayNumber: "desc" },
                select: { displayNumber: true },
              });
              const safeDisplayNumber = t.displayNumber || ((maxTeacher?.displayNumber || 0) + 1);

              existing = await tx.teacher.create({
                data: {
                  schoolId: actualSchoolId,
                  displayNumber: safeDisplayNumber,
                  fullName: t.fullName.trim(),
                  phone: t.phone || null,
                  weeklyHourCapacity: t.weeklyHourCapacity || 20,
                  maxConsecutiveHours: t.maxConsecutiveHours || 4,
                  maxGapsPerDay: t.maxGapsPerDay || 1,
                  methodDay: t.methodDayOfWeek !== undefined ? t.methodDayOfWeek : null,
                  teachingStages: (t.teachingStages as any) || "BOTH",
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
                  maxGapsPerDay: t.maxGapsPerDay || 1,
                  methodDay: t.methodDayOfWeek !== undefined ? t.methodDayOfWeek : null,
                  teachingStages: (t.teachingStages as any) || "BOTH",
                },
              });
            }
            teacherMap.set(t.id, existing.id);
            teacherMap.set(t.fullName.trim(), existing.id);

            // Bo'sh vaqtlar (Availabilities)
            if (t.availabilities && t.availabilities.length > 0) {
              await tx.teacherAvailability.deleteMany({ where: { teacherId: existing.id } });
              await tx.teacherAvailability.createMany({
                data: t.availabilities.map((a) => ({
                  schoolId: actualSchoolId,
                  teacherId: existing.id,
                  dayOfWeek: a.dayOfWeek,
                  period: a.period,
                  isAvailable: a.isAvailable !== undefined ? a.isAvailable : true,
                })),
                skipDuplicates: true,
              });
            }

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
            const bId = branchMap.get(c.branchId) || resolveDbBranchId(allDbBranches, c.branchId);
            const sId = shiftMap.get(c.shiftId) || resolveDbShiftId(allDbShifts, c.shiftId);
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
                  studentCount: c.studentCount || 25,
                  isClosed: c.isClosed || false,
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
                  studentCount: c.studentCount || 25,
                  isClosed: c.isClosed || false,
                },
              });
            }
            classMap.set(c.id, existing.id);
            classMap.set(c.name.trim(), existing.id);

            // Tarifikatsiya
            if (c.subjects !== undefined) {
              await tx.classSubject.deleteMany({
                where: { classId: existing.id },
              });

              for (const cs of c.subjects) {
                const mappedSubId = subjectMap.get(cs.subjectId) || cs.subjectId;
                const mappedTeacherId = teacherMap.get(cs.teacherId) || cs.teacherId;
                if (mappedSubId && mappedTeacherId && cs.weeklyHours > 0) {
                  // Sub va Teacher mavjudligini tekshirish
                  const dbSub = await tx.subject.findFirst({
                    where: { OR: [{ id: mappedSubId }, { schoolId: actualSchoolId, name: mappedSubId }] },
                  });
                  const dbTeacher = await tx.teacher.findFirst({
                    where: { OR: [{ id: mappedTeacherId }, { schoolId: actualSchoolId, fullName: mappedTeacherId }] },
                  });

                  if (dbSub && dbTeacher) {
                    await tx.classSubject.create({
                      data: {
                        schoolId: actualSchoolId,
                        classId: existing.id,
                        subjectId: dbSub.id,
                        teacherId: dbTeacher.id,
                        weeklyHours: cs.weeklyHours,
                        groupType: cs.groupType || "WHOLE",
                      },
                    });
                  }
                }
              }
            }
          }
        }

        // 7.5. Sinf Rahbarligi (Two-Way Homeroom Canonical Synchronization)
        // Avval maktabdagi barcha o'qituvchilarning homeroomClassId sini tozalaymiz (xavfsiz qayta biriktirish uchun)
        await tx.teacher.updateMany({
          where: { schoolId: actualSchoolId },
          data: { homeroomClassId: null },
        });

        const assignedDbTeachers = new Set<string>();
        const assignedDbClasses = new Set<string>();

        // 1-ustuvorlik: Sinflardan (fullData.classes)
        if (fullData.classes && fullData.classes.length > 0) {
          for (const c of fullData.classes) {
            const dbClassId = classMap.get(c.id) || classMap.get(c.name.trim());
            if (!dbClassId || assignedDbClasses.has(dbClassId)) continue;

            const tid = c.homeroomTeacherId;
            if (tid) {
              const dbTeacherId = teacherMap.get(tid);
              if (dbTeacherId && !assignedDbTeachers.has(dbTeacherId)) {
                await tx.teacher.update({
                  where: { id: dbTeacherId },
                  data: { homeroomClassId: dbClassId },
                });
                assignedDbTeachers.add(dbTeacherId);
                assignedDbClasses.add(dbClassId);
              }
            }
          }
        }

        // 2-ustuvorlik: O'qituvchilardan (fullData.teachers)
        if (fullData.teachers && fullData.teachers.length > 0) {
          for (const t of fullData.teachers) {
            const dbTeacherId = teacherMap.get(t.id) || teacherMap.get(t.fullName.trim());
            if (!dbTeacherId || assignedDbTeachers.has(dbTeacherId)) continue;

            if (t.homeroomClassId) {
              const dbClassId = classMap.get(t.homeroomClassId);
              if (dbClassId && !assignedDbClasses.has(dbClassId)) {
                await tx.teacher.update({
                  where: { id: dbTeacherId },
                  data: { homeroomClassId: dbClassId },
                });
                assignedDbTeachers.add(dbTeacherId);
                assignedDbClasses.add(dbClassId);
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
                groupType: l.groupType || "WHOLE",
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
