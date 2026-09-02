"use server";

import { prisma } from "@/lib/prisma";
import { Subject } from "@/types";
import { resolveSchool } from "./school.actions";

/**
 * Fanni yaratish yoki yangilash
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
          methodDayOfWeek: subject.methodDayOfWeek !== undefined ? subject.methodDayOfWeek : null,
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
          methodDayOfWeek: subject.methodDayOfWeek !== undefined ? subject.methodDayOfWeek : null,
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
 * Fanni o'chirish
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
