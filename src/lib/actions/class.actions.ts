"use server";

import { prisma } from "@/lib/prisma";
import { SchoolClass } from "@/types";
import { resolveSchool } from "./school.actions";
import { resolveDbBranchId, resolveDbShiftId, normalizeClassName } from "@/lib/utils";

/**
 * Sinfni yaratish yoki yangilash
 */
export async function upsertClassAction(schoolId: string, cls: SchoolClass) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;
    const normalizedName = normalizeClassName(cls.name);

    await prisma.$transaction(async (tx) => {
      // Filial va smena mavjudligini aniq tekshirish
      const allBranches = await tx.branch.findMany({ where: { schoolId: actualSchoolId } });
      const branchId = resolveDbBranchId(allBranches, cls.branchId);

      const allShifts = await tx.shift.findMany({ where: { schoolId: actualSchoolId } });
      const shiftId = resolveDbShiftId(allShifts, cls.shiftId);

      const existing = await tx.class.findFirst({
        where: {
          schoolId: actualSchoolId,
          OR: [{ id: cls.id }, { name: normalizedName }, { name: cls.name.trim() }],
        },
      });

      let classId = cls.id;
      if (!existing) {
        const created = await tx.class.create({
          data: {
            schoolId: actualSchoolId,
            branchId: branchId,
            shiftId: shiftId,
            name: normalizedName,
            grade: cls.grade,
            isPrimary: cls.isPrimary || cls.grade <= 4,
            studentCount: cls.studentCount || 25,
            isClosed: cls.isClosed || false,
          },
        });
        classId = created.id;
      } else {
        await tx.class.update({
          where: { id: existing.id },
          data: {
            branchId: branchId,
            shiftId: shiftId,
            name: normalizedName,
            grade: cls.grade,
            isPrimary: cls.isPrimary || cls.grade <= 4,
            studentCount: cls.studentCount || 25,
            isClosed: cls.isClosed || false,
          },
        });
        classId = existing.id;
      }

      // Sinf rahbari tayinlash / bekor qilish
      if (cls.homeroomTeacherId && cls.homeroomTeacherId.trim() !== "") {
        // Avval bu sinfga biriktirilgan boshqa o'qituvchilarni tozalash
        await tx.teacher.updateMany({
          where: { schoolId: actualSchoolId, homeroomClassId: classId },
          data: { homeroomClassId: null },
        });

        const teacher = await tx.teacher.findFirst({
          where: {
            schoolId: actualSchoolId,
            OR: [
              { id: cls.homeroomTeacherId },
              { fullName: cls.homeroomTeacherId },
            ],
          },
        });
        if (teacher) {
          // O'qituvchining boshqa sinfi bo'lsa tozalash
          await tx.teacher.update({
            where: { id: teacher.id },
            data: { homeroomClassId: null },
          });

          await tx.teacher.update({
            where: { id: teacher.id },
            data: { homeroomClassId: classId },
          });

          // Kelajak soati fani bo'lsa uni ham yangi sinf rahbariga ulash yoki mavjud bo'lmasa yaratish
          let sinfSoati = await tx.subject.findFirst({
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
          if (!sinfSoati) {
            sinfSoati = await tx.subject.create({
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

          if (sinfSoati) {
            const existingCS = await tx.classSubject.findFirst({
              where: { classId, subjectId: sinfSoati.id },
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
                  classId,
                  subjectId: sinfSoati.id,
                  teacherId: teacher.id,
                  weeklyHours: 1,
                },
              });
            }

            await tx.lesson.updateMany({
              where: {
                schoolId: actualSchoolId,
                classId,
                OR: [{ subjectId: sinfSoati.id }, { dayOfWeek: 1, periodNumber: 1 }],
              },
              data: { teacherId: teacher.id, subjectId: sinfSoati.id },
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
  subjects: Array<{ subjectId: string; teacherId: string; weeklyHours: number; groupType?: string }>
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    await prisma.$transaction(
      async (tx) => {
        const cls = await tx.class.findFirst({
          where: { OR: [{ id: classId }, { schoolId: actualSchoolId, name: classId }] },
        });
        if (!cls) return;

        // 1. Bir martalik so'rov bilan barcha fanlar va o'qituvchilarni olish (Neon DB da timeout bo'lmasligi uchun)
        const dbSubjects = await tx.subject.findMany({ where: { schoolId: actualSchoolId } });
        const dbTeachers = await tx.teacher.findMany({ where: { schoolId: actualSchoolId } });

        const subMap = new Map<string, string>();
        dbSubjects.forEach((s) => {
          subMap.set(s.id, s.id);
          subMap.set(s.name.trim(), s.id);
          subMap.set(s.name.trim().toLowerCase(), s.id);
        });

        const teacherMap = new Map<string, string>();
        dbTeachers.forEach((t) => {
          teacherMap.set(t.id, t.id);
          teacherMap.set(t.fullName.trim(), t.id);
          teacherMap.set(t.fullName.trim().toLowerCase(), t.id);
        });

        const hrTeacher = dbTeachers.find((t) => t.homeroomClassId === cls.id);
        const fallbackTeacherId = hrTeacher?.id || dbTeachers[0]?.id || "";

        // 2. Mavjud sinf fanlarini tozalash
        await tx.classSubject.deleteMany({
          where: { classId: cls.id, schoolId: actualSchoolId },
        });

        // 3. Yangi fanlar qatorlarini xotirada bir zumda shakllantirish
        const rowsToCreate: any[] = [];
        const seenKeys = new Set<string>();

        for (const s of subjects) {
          if (!s || !s.subjectId || (Number(s.weeklyHours) || 0) <= 0) continue;

          const mappedSubId =
            subMap.get(s.subjectId) ||
            subMap.get(s.subjectId.trim()) ||
            subMap.get(s.subjectId.trim().toLowerCase());

          if (!mappedSubId) continue;

          let mappedTeacherId =
            (s.teacherId && teacherMap.get(s.teacherId)) ||
            (s.teacherId && teacherMap.get(s.teacherId.trim())) ||
            (s.teacherId && teacherMap.get(s.teacherId.trim().toLowerCase())) ||
            s.teacherId;

          if (!mappedTeacherId || !teacherMap.has(mappedTeacherId)) {
            mappedTeacherId = fallbackTeacherId;
          }

          const gType = s.groupType || "WHOLE";
          const uniqueKey = `${cls.id}_${mappedSubId}_${mappedTeacherId}_${gType}`;
          if (seenKeys.has(uniqueKey)) continue;
          seenKeys.add(uniqueKey);

          rowsToCreate.push({
            schoolId: actualSchoolId,
            classId: cls.id,
            subjectId: mappedSubId,
            teacherId: mappedTeacherId,
            weeklyHours: Number(s.weeklyHours) || 1,
            groupType: gType,
          });
        }

        // 4. Bitta chaqiriqda barcha fanlarni bazaga yozish (0ms kechikish)
        if (rowsToCreate.length > 0) {
          await tx.classSubject.createMany({
            data: rowsToCreate,
          });
        }
      },
      { maxWait: 15000, timeout: 30000 }
    );

    return { success: true };
  } catch (error: any) {
    console.error("saveClassTarifficationAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

/**
 * Barcha sinflar tarifikatsiyasini ommaviy saqlash (Neon PostgreSQL DB ga doimiy yozish)
 */
export async function saveAllClassesTarifficationAction(
  schoolId: string,
  classesData: Array<{
    id: string;
    homeroomTeacherId?: string | null;
    subjects: Array<{ subjectId: string; teacherId: string; weeklyHours: number; groupType?: string }>;
  }>
) {
  try {
    const school = await resolveSchool(schoolId);
    if (!school) return { success: false, error: "Maktab topilmadi" };
    const actualSchoolId = school.id;

    await prisma.$transaction(async (tx) => {
      // 1. DB dagi fanlar va ustozlar xaritasini olish
      const dbSubjects = await tx.subject.findMany({ where: { schoolId: actualSchoolId } });
      const dbTeachers = await tx.teacher.findMany({ where: { schoolId: actualSchoolId } });

      const subMap = new Map<string, string>();
      dbSubjects.forEach((s) => {
        subMap.set(s.id, s.id);
        subMap.set(s.name.trim(), s.id);
        subMap.set(s.name.trim().toLowerCase(), s.id);
      });

      const teacherMap = new Map<string, string>();
      dbTeachers.forEach((t) => {
        teacherMap.set(t.id, t.id);
        teacherMap.set(t.fullName.trim(), t.id);
        teacherMap.set(t.fullName.trim().toLowerCase(), t.id);
      });

      for (const clsData of classesData) {
        const cls = await tx.class.findFirst({
          where: { OR: [{ id: clsData.id }, { schoolId: actualSchoolId, name: clsData.id }] },
        });
        if (!cls) continue;

        // Sinf rahbari yangilanishi
        if (clsData.homeroomTeacherId) {
          const tId = teacherMap.get(clsData.homeroomTeacherId) || teacherMap.get(clsData.homeroomTeacherId.toLowerCase());
          if (tId) {
            await tx.teacher.updateMany({
              where: { schoolId: actualSchoolId, homeroomClassId: cls.id },
              data: { homeroomClassId: null },
            });
            await tx.teacher.update({
              where: { id: tId },
              data: { homeroomClassId: cls.id },
            });
          }
        }

        // Sinf o'quv rejasini tozalab, qaytadan yozish
        await tx.classSubject.deleteMany({
          where: { classId: cls.id, schoolId: actualSchoolId },
        });

        const hrTeacher = dbTeachers.find((t) => t.homeroomClassId === cls.id);
        const fallbackTeacherId =
          (clsData.homeroomTeacherId && teacherMap.get(clsData.homeroomTeacherId)) ||
          hrTeacher?.id ||
          dbTeachers[0]?.id;

        const rowsToCreate: any[] = [];
        for (const s of clsData.subjects || []) {
          const mappedSubId =
            subMap.get(s.subjectId) ||
            subMap.get(s.subjectId?.toLowerCase()) ||
            s.subjectId;
          let mappedTeacherId =
            (s.teacherId && teacherMap.get(s.teacherId)) ||
            (s.teacherId && teacherMap.get(s.teacherId?.toLowerCase())) ||
            s.teacherId;

          if (!mappedTeacherId && fallbackTeacherId) {
            mappedTeacherId = fallbackTeacherId;
          }

          if (mappedSubId && mappedTeacherId && (s.weeklyHours || 0) > 0) {
            rowsToCreate.push({
              schoolId: actualSchoolId,
              classId: cls.id,
              subjectId: mappedSubId,
              teacherId: mappedTeacherId,
              weeklyHours: s.weeklyHours,
              groupType: s.groupType || "WHOLE",
            });
          }
        }

        if (rowsToCreate.length > 0) {
          await tx.classSubject.createMany({
            data: rowsToCreate,
          });
        }
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("saveAllClassesTarifficationAction xatosi:", error);
    return { success: false, error: error?.message };
  }
}

