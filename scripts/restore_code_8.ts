import { prisma } from "../src/lib/prisma";
import fs from "fs";
import path from "path";

/**
 * CODE 8 RESTORATION PROTOCOL
 * Ushbu skript foydalanuvchi 'Code 8' deganida 39-maktabning barcha ma'lumotlarini
 * olingan zaxiradan 100% asl holatiga qaytaradi.
 */
export async function restoreCode8() {
  console.log("🚨 [CODE 8] QAYTARISH PROTOKOLI ISHGA TUSHDI...");
  const backupPath = path.join(process.cwd(), "backups", "code_8_school_39_backup.json");
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup fayli topilmadi: ${backupPath}`);
  }

  const raw = fs.readFileSync(backupPath, "utf-8");
  const data = JSON.parse(raw);
  const targetSchoolId = data.school.id;

  console.log(`Tiklanayotgan maktab: ${data.school.name} (ID: ${targetSchoolId})`);

  await prisma.$transaction(
    async (tx) => {
      // 1. Darslar va jadvallarni tozalash
      await tx.lesson.deleteMany({ where: { schoolId: targetSchoolId } });
      await tx.schedule.deleteMany({ where: { schoolId: targetSchoolId } });

      // 2. ClassSubjects tozalash
      await tx.classSubject.deleteMany({ where: { schoolId: targetSchoolId } });

      // 3. Availabilities tozalash
      await tx.teacherAvailability.deleteMany({ where: { schoolId: targetSchoolId } });

      // 4. Classes tozalash
      await tx.class.deleteMany({ where: { schoolId: targetSchoolId } });

      // 5. Teachers tozalash
      await tx.teacherSubject.deleteMany({ where: { schoolId: targetSchoolId } });
      await tx.teacherBranch.deleteMany({ where: { schoolId: targetSchoolId } });
      await tx.teacher.deleteMany({ where: { schoolId: targetSchoolId } });

      // 6. Subjects tozalash
      await tx.subject.deleteMany({ where: { schoolId: targetSchoolId } });

      // 7. Rooms, Shifts, Branches tozalash
      await tx.room.deleteMany({ where: { schoolId: targetSchoolId } });
      await tx.shift.deleteMany({ where: { schoolId: targetSchoolId } });
      await tx.branch.deleteMany({ where: { schoolId: targetSchoolId } });

      // --- QAYTA TIKLASH ---
      // Branches
      if (data.branches?.length > 0) {
        await tx.branch.createMany({ data: data.branches });
      }
      // Shifts
      if (data.shifts?.length > 0) {
        await tx.shift.createMany({ data: data.shifts });
      }
      // Rooms
      if (data.rooms?.length > 0) {
        await tx.room.createMany({ data: data.rooms });
      }
      // Subjects
      if (data.subjects?.length > 0) {
        await tx.subject.createMany({ data: data.subjects });
      }

      // Teachers
      for (const t of data.teachers || []) {
        const { subjects, branches, availabilities, ...tData } = t;
        await tx.teacher.create({ data: tData });
        if (subjects?.length > 0) {
          await tx.teacherSubject.createMany({
            data: subjects.map((s: any) => ({ schoolId: targetSchoolId, teacherId: t.id, subjectId: s.subjectId })),
          });
        }
        if (branches?.length > 0) {
          await tx.teacherBranch.createMany({
            data: branches.map((b: any) => ({ schoolId: targetSchoolId, teacherId: t.id, branchId: b.branchId })),
          });
        }
      }

      // Availabilities
      if (data.availabilities?.length > 0) {
        await tx.teacherAvailability.createMany({ data: data.availabilities });
      }

      // Classes
      if (data.classes?.length > 0) {
        await tx.class.createMany({ data: data.classes });
      }

      // ClassSubjects
      if (data.classSubjects?.length > 0) {
        await tx.classSubject.createMany({ data: data.classSubjects });
      }

      // Schedules
      if (data.schedules?.length > 0) {
        await tx.schedule.createMany({ data: data.schedules });
      }

      // Lessons
      if (data.lessons?.length > 0) {
        await tx.lesson.createMany({ data: data.lessons });
      }
    },
    { timeout: 60000 }
  );

  console.log("✅ [CODE 8] 39-MAKTABNING BARCHA MA'LUMOTLARI 100% DASTLABKI HOLATIGA QAYTARILDI!");
}

if (require.main === module) {
  restoreCode8().catch(console.error);
}
