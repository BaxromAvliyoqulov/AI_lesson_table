"use server";

import { prisma } from "@/lib/prisma";
import { Teacher } from "@/types";
import { resolveSchool } from "./school.actions";

/**
 * O'qituvchini yaratish yoki yangilash
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
                { dayOfWeek: 1, periodNumber: 1 },
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
 * O'qituvchini o'chirish (Cascade tozalash bilan)
 */
export async function deleteTeacherAction(schoolId: string, teacherId: string) {
  try {
    const school = await resolveSchool(schoolId);
    const actualSchoolId = school ? school.id : schoolId;

    await prisma.$transaction(async (tx) => {
      // 1. O'qituvchini topish (ID, fullName yoki displayNumber bo'yicha)
      const teacher = await tx.teacher.findFirst({
        where: {
          schoolId: actualSchoolId,
          OR: [
            { id: teacherId },
            { fullName: teacherId },
            ...(Number.isInteger(Number(teacherId)) ? [{ displayNumber: Number(teacherId) }] : []),
          ],
        },
      });

      if (!teacher) {
        // Agar to'g'ridan-to'g'ri ID bo'yicha bo'lsa
        await tx.teacher.deleteMany({
          where: { id: teacherId },
        });
        return;
      }

      // 2. Dars jadvalidan o'sha o'qituvchining darslarini o'chirish
      await tx.lesson.deleteMany({
        where: { teacherId: teacher.id },
      });

      // 3. Tarifikatsiyadan o'sha o'qituvchi soatlarini tozalash
      await tx.classSubject.deleteMany({
        where: { teacherId: teacher.id },
      });

      // 4. Boshqa jadvallardan tozalash
      await tx.teacherAvailability.deleteMany({
        where: { teacherId: teacher.id },
      });
      await tx.teacherSubject.deleteMany({
        where: { teacherId: teacher.id },
      });
      await tx.teacherBranch.deleteMany({
        where: { teacherId: teacher.id },
      });
      await tx.lessonReplacement.deleteMany({
        where: {
          OR: [{ originalTeacherId: teacher.id }, { replacementTeacherId: teacher.id }],
        },
      });

      // 5. O'qituvchini o'chirish
      await tx.teacher.delete({
        where: { id: teacher.id },
      });
    });

    return { success: true };
  } catch (error: any) {
    console.error("deleteTeacherAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * O'qituvchi bo'yicha dars yuklamasini saqlash (Teacher -> Classes Tariffication Sync)
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
 * Sinf rahbarini o'zgartirish va Sinf soatini sinxronlash (Two-Way Sync)
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
