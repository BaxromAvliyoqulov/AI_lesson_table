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

    let savedTeacherRecord: any = null;

    await prisma.$transaction(
      async (tx) => {
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
            ...(teacher.displayNumber ? [{ schoolId: actualSchoolId, displayNumber: teacher.displayNumber }] : []),
          ],
        },
      });

      if (!teacherRecord) {
        // Yangi o'qituvchi: bazadagi eng katta displayNumber'ni topib +1 qo'shamiz (unique constraint xatosini oldini olish)
        let targetDisplayNumber = teacher.displayNumber;
        if (!targetDisplayNumber || targetDisplayNumber <= 0) {
          const maxTeacher = await tx.teacher.findFirst({
            where: { schoolId: actualSchoolId },
            orderBy: { displayNumber: "desc" },
            select: { displayNumber: true },
          });
          targetDisplayNumber = (maxTeacher?.displayNumber || 0) + 1;
        }

        teacherRecord = await tx.teacher.create({
          data: {
            id: teacher.id || undefined,
            schoolId: actualSchoolId,
            displayNumber: targetDisplayNumber,
            fullName: teacher.fullName.trim(),
            phone: teacher.phone || null,
            weeklyHourCapacity: teacher.weeklyHourCapacity || 20,
            maxConsecutiveHours: teacher.maxConsecutiveHours || 4,
            methodDay: teacher.methodDayOfWeek !== undefined ? teacher.methodDayOfWeek : null,
            homeroomClassId: teacher.homeroomClassId || null,
            teachingStages: teacher.teachingStages || "BOTH",
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
            teachingStages: teacher.teachingStages || "BOTH",
          },
        });

        // Eskilarini tozalab yangilarini bog'lash
        await tx.teacherSubject.deleteMany({ where: { teacherId: teacherRecord.id } });
        await tx.teacherBranch.deleteMany({ where: { teacherId: teacherRecord.id } });
      }

      // Agar sinf biriktirilgan bo'lsa, ClassSubject dagi Kelajak soatini shu o'qituvchiga ulash yoki yaratish
      if (teacher.homeroomClassId) {
        let sinfSoatiSubject = await tx.subject.findFirst({
          where: {
            schoolId: actualSchoolId,
            OR: [
              { id: "sub_sinf_soati" },
              { id: "sub_kelajak" },
              { name: { contains: "Kelajak" } },
              { name: { contains: "Sinf soati" } },
            ],
          },
        });
        if (!sinfSoatiSubject) {
          sinfSoatiSubject = await tx.subject.create({
            data: {
              id: `sub_kelajak_${actualSchoolId}`,
              schoolId: actualSchoolId,
              name: "Kelajak soati",
              shortName: "Kelajak s.",
              colorTag: "#8B5CF6",
              difficultyScore: 1,
              allowDoubleLesson: false,
              methodDayOfWeek: 1,
            },
          });
        }

        if (sinfSoatiSubject) {
          const existingCS = await tx.classSubject.findFirst({
            where: {
              classId: teacher.homeroomClassId,
              subjectId: sinfSoatiSubject.id,
            },
          });
          if (existingCS) {
            await tx.classSubject.update({
              where: { id: existingCS.id },
              data: { teacherId: teacherRecord.id },
            });
          } else {
            await tx.classSubject.create({
              data: {
                schoolId: actualSchoolId,
                classId: teacher.homeroomClassId,
                subjectId: sinfSoatiSubject.id,
                teacherId: teacherRecord.id,
                weeklyHours: 1,
              },
            });
          }

          await tx.lesson.updateMany({
            where: {
              schoolId: actualSchoolId,
              classId: teacher.homeroomClassId,
              OR: [
                { subjectId: sinfSoatiSubject.id },
                { dayOfWeek: 1, periodNumber: 1 },
              ],
            },
            data: { teacherId: teacherRecord.id, subjectId: sinfSoatiSubject.id },
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

      savedTeacherRecord = teacherRecord;
    },
    { timeout: 25000, maxWait: 10000 }
  );

    return {
      success: true,
      teacher: savedTeacherRecord
        ? {
            ...teacher,
            id: savedTeacherRecord.id,
            displayNumber: savedTeacherRecord.displayNumber,
            schoolId: savedTeacherRecord.schoolId,
            teachingStages: (savedTeacherRecord.teachingStages as any) || teacher.teachingStages || "BOTH",
          }
        : undefined,
    };
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

    await prisma.$transaction(
      async (tx) => {
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
    },
    { timeout: 25000, maxWait: 10000 }
  );

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
  assignments: Array<{
    classId: string;
    subjectId: string;
    weeklyHours: number;
    isSplit?: boolean;
    groupType?: "WHOLE" | "GROUP_1" | "GROUP_2";
    secondTeacherId?: string;
  }>
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    await prisma.$transaction(
      async (tx) => {
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
            if (a.isSplit && a.secondTeacherId) {
              const secondTeacher = await tx.teacher.findFirst({
                where: {
                  OR: [
                    { id: a.secondTeacherId },
                    { schoolId: actualSchoolId, fullName: a.secondTeacherId },
                  ],
                },
              });

              // 1-o'qituvchi uchun
              await tx.classSubject.deleteMany({
                where: {
                  classId: cls.id,
                  subjectId: sub.id,
                  teacherId: teacher.id,
                  schoolId: actualSchoolId,
                },
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

              // 2-o'qituvchi uchun ham yozish
              if (secondTeacher) {
                await tx.classSubject.deleteMany({
                  where: {
                    classId: cls.id,
                    subjectId: sub.id,
                    teacherId: secondTeacher.id,
                    schoolId: actualSchoolId,
                  },
                });
                await tx.classSubject.create({
                  data: {
                    schoolId: actualSchoolId,
                    classId: cls.id,
                    subjectId: sub.id,
                    teacherId: secondTeacher.id,
                    weeklyHours: a.weeklyHours,
                  },
                });
              }
            } else {
              await tx.classSubject.deleteMany({
                where: {
                  classId: cls.id,
                  subjectId: sub.id,
                  teacherId: teacher.id,
                  schoolId: actualSchoolId,
                },
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
        }
      },
      { timeout: 25000, maxWait: 10000 }
    );

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
        where: {
          schoolId: actualSchoolId,
          OR: [{ id: teacherId }, { fullName: teacherId }],
        },
      });

      if (!teacher) return;

      // 3. O'qituvchi homeroom bog'lamasini yangilash (avvalgi sinfi bo'lsa tozalab, keyin yangisini qo'yish)
      await tx.teacher.update({
        where: { id: teacher.id },
        data: { homeroomClassId: null },
      });

      await tx.teacher.update({
        where: { id: teacher.id },
        data: { homeroomClassId: cls.id },
      });

      // 4. ClassSubject (Kelajak soati) ni yangi o'qituvchiga o'tkazish yoki yaratish
      let sinfSoatiSubject = await tx.subject.findFirst({
        where: {
          schoolId: actualSchoolId,
          OR: [
            { id: "sub_sinf_soati" },
            { id: "sub_kelajak" },
            { name: { contains: "Kelajak" } },
            { name: { contains: "Sinf soati" } },
          ],
        },
      });

      if (!sinfSoatiSubject) {
        sinfSoatiSubject = await tx.subject.create({
          data: {
            id: `sub_kelajak_${actualSchoolId}`,
            schoolId: actualSchoolId,
            name: "Kelajak soati",
            shortName: "Kelajak s.",
            colorTag: "#8B5CF6",
            difficultyScore: 1,
            allowDoubleLesson: false,
            methodDayOfWeek: 1,
          },
        });
      }

      if (sinfSoatiSubject) {
        const existingCS = await tx.classSubject.findFirst({
          where: { classId: cls.id, subjectId: sinfSoatiSubject.id },
        });
        if (existingCS) {
          await tx.classSubject.update({
            where: { id: existingCS.id },
            data: { teacherId: teacher.id },
          });
        } else {
          await tx.classSubject.create({
            data: {
              schoolId: actualSchoolId,
              classId: cls.id,
              subjectId: sinfSoatiSubject.id,
              teacherId: teacher.id,
              weeklyHours: 1,
            },
          });
        }

        // 5. Mavjud darslar jadvalidagi Kelajak soatini yangilash
        await tx.lesson.updateMany({
          where: {
            schoolId: actualSchoolId,
            classId: cls.id,
            OR: [
              { subjectId: sinfSoatiSubject.id },
              { dayOfWeek: 1, periodNumber: 1 },
            ],
          },
          data: { teacherId: teacher.id, subjectId: sinfSoatiSubject.id },
        });
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("setHomeroomTeacherAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}
