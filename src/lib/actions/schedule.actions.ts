"use server";

import { prisma } from "@/lib/prisma";
import { Lesson } from "@/types";
import { resolveSchool } from "./school.actions";

/**
 * Darslar to'plamini (Jadvalni) to'liq saqlash
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
        groupType: l.groupType || "WHOLE",
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
 * Bitta darsning vaqtini yoki joyini ko'chirish
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
 * Ikkita dars o'rnini almashtirish (SWAP)
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
 * Maktabning barcha saqlangan dars jadvali versiyalarini olish
 */
export async function getSchoolScheduleVersions(schoolId: string) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };

    const schedules = await prisma.schedule.findMany({
      where: { schoolId: school.id },
      include: {
        _count: {
          select: { lessons: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return {
      success: true,
      data: schedules.map((s) => ({
        id: s.id,
        schoolId: s.schoolId,
        name: s.name,
        academicYear: s.academicYear,
        term: s.term,
        status: s.status as any,
        isActive: s.isActive,
        lessonsCount: s._count.lessons,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("getSchoolScheduleVersions xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Yangi nomlangan dars jadvali versiyasini saqlash (Snapshot olish)
 */
export async function createScheduleVersionAction(
  schoolId: string,
  name: string,
  lessons: Lesson[],
  academicYear = "2025 - 2026",
  term = 1,
  makeActive = false
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    const newSchedule = await prisma.$transaction(async (tx) => {
      if (makeActive) {
        await tx.schedule.updateMany({
          where: { schoolId: actualSchoolId },
          data: { isActive: false },
        });
      }

      const schedule = await tx.schedule.create({
        data: {
          schoolId: actualSchoolId,
          name: name.trim() || `Jadval versiyasi - ${new Date().toLocaleDateString("uz-UZ")}`,
          academicYear,
          term,
          status: makeActive ? "PUBLISHED" : "DRAFT",
          isActive: makeActive,
        },
      });

      const lessonData = lessons.map((l) => ({
        scheduleId: schedule.id,
        schoolId: actualSchoolId,
        classId: l.classId,
        subjectId: l.subjectId,
        teacherId: l.teacherId,
        roomId: l.roomId || null,
        branchId: l.branchId,
        dayOfWeek: l.dayOfWeek,
        periodNumber: l.periodNumber,
        groupType: l.groupType || "WHOLE",
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
          action: "schedule.version_created",
          payload: { scheduleId: schedule.id, name: schedule.name, count: lessons.length },
        },
      });

      return schedule;
    });

    return { success: true, data: newSchedule };
  } catch (error: any) {
    console.error("createScheduleVersionAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Saqlangan dars jadvali versiyasini faollashtirish (Qaytarish / Restore)
 */
export async function restoreScheduleVersionAction(schoolId: string, scheduleId: string) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    const result = await prisma.$transaction(async (tx) => {
      await tx.schedule.updateMany({
        where: { schoolId: actualSchoolId },
        data: { isActive: false },
      });

      const activeSchedule = await tx.schedule.update({
        where: { id: scheduleId },
        data: { isActive: true },
        include: {
          lessons: true,
        },
      });

      await tx.auditLog.create({
        data: {
          schoolId: actualSchoolId,
          userId: "system",
          action: "schedule.version_restored",
          payload: { scheduleId: activeSchedule.id, name: activeSchedule.name },
        },
      });

      return activeSchedule;
    });

    const lessons: Lesson[] = result.lessons.map((l) => ({
      id: l.id,
      scheduleId: result.id,
      schoolId: result.schoolId,
      classId: l.classId,
      subjectId: l.subjectId,
      teacherId: l.teacherId,
      roomId: l.roomId || undefined,
      branchId: l.branchId,
      dayOfWeek: l.dayOfWeek,
      periodNumber: l.periodNumber,
      isLocked: l.isLocked,
    }));

    return {
      success: true,
      data: {
        schedule: {
          id: result.id,
          schoolId: result.schoolId,
          name: result.name,
          academicYear: result.academicYear,
          term: result.term,
          status: result.status as any,
          isActive: true,
          createdAt: result.createdAt.toISOString(),
          updatedAt: result.updatedAt.toISOString(),
        },
        lessons,
      },
    };
  } catch (error: any) {
    console.error("restoreScheduleVersionAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Dars jadvali versiyasi nomini tahrirlash
 */
export async function renameScheduleVersionAction(schoolId: string, scheduleId: string, newName: string) {
  try {
    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: { name: newName.trim() },
    });
    return { success: true, data: updated };
  } catch (error: any) {
    console.error("renameScheduleVersionAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Dars jadvali versiyasini o'chirish
 */
export async function deleteScheduleVersionAction(schoolId: string, scheduleId: string) {
  try {
    const target = await prisma.schedule.findUnique({ where: { id: scheduleId } });
    if (!target) return { success: false, error: "Versiya topilmadi" };

    if (target.isActive) {
      // Agar faol versiya bo'lsa, avval boshqa faol versiya borligini tekshiramiz
      const other = await prisma.schedule.findFirst({
        where: { schoolId: target.schoolId, id: { not: scheduleId } },
      });
      if (other) {
        await prisma.schedule.update({
          where: { id: other.id },
          data: { isActive: true },
        });
      }
    }

    await prisma.schedule.delete({ where: { id: scheduleId } });
    return { success: true };
  } catch (error: any) {
    console.error("deleteScheduleVersionAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}
