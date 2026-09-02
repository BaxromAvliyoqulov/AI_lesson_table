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
