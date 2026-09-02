"use server";

import { prisma } from "@/lib/prisma";
import { SchoolClass } from "@/types";
import { resolveSchool } from "./school.actions";

/**
 * Sinfni yaratish yoki yangilash
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
 * Sinfni o'chirish
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
 * Sinf tarifikatsiyasini saqlash (ClassSubject larni yangilash)
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
