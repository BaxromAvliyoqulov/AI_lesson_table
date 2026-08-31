"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth/auth.config";
import type { SetupData } from "@/app/setup/page";

export async function completeSetup(data: SetupData) {
  const session = await auth();
  if (!session?.user?.schoolId) throw new Error("Autentifikatsiya talab qilinadi");

  const schoolId = session.user.schoolId;

  await prisma.$transaction(async (tx) => {
    // 1. Maktab profil yangilash
    await tx.school.update({
      where: { id: schoolId },
      data: {
        name: data.school.name.trim(),
        region: data.school.region.trim() || null,
        directorFullName: data.school.directorFullName.trim() || null,
        academicVicePrincipalName: data.school.academicVicePrincipalName.trim() || null,
        psychologistName: data.school.psychologistName.trim() || null,
      },
    });

    // 2. Faol Term yaratish
    await tx.term.upsert({
      where: { schoolId_academicYear_name: { schoolId, academicYear: data.school.academicYear, name: data.school.term } },
      create: { schoolId, name: data.school.term, academicYear: data.school.academicYear, isActive: true },
      update: { isActive: true },
    });

    // 3. Filiallar
    const branchMap = new Map<string, string>();
    for (const b of data.branches) {
      const branch = await tx.branch.create({
        data: { schoolId, name: b.name, address: b.address || null, isMain: b.isMain },
      });
      branchMap.set(b.name, branch.id);
    }

    // 4. Smenalar
    const shiftMap = new Map<string, string>();
    for (let order = 0; order < data.shifts.length; order++) {
      const s = data.shifts[order];
      const shift = await tx.shift.create({
        data: { schoolId, name: s.name, startTime: s.startTime, endTime: s.endTime, periodsCount: s.periodsCount, order, bellPeriods: s.bellPeriods as any },
      });
      shiftMap.set(s.name, shift.id);
    }

    // 5. Fanlar
    const subjectMap = new Map<string, string>();
    for (let i = 0; i < data.subjects.length; i++) {
      const s = data.subjects[i];
      const subject = await tx.subject.create({
        data: { schoolId, name: s.name, colorTag: s.colorTag, difficultyScore: s.difficultyScore, allowDoubleLesson: s.allowDoubleLesson, requiresRoomType: s.requiresRoomType },
      });
      subjectMap.set(s.name, subject.id);
    }

    // 6. O'qituvchilar
    const teacherMap = new Map<string, string>();
    for (let i = 0; i < data.teachers.length; i++) {
      const t = data.teachers[i];
      const teacher = await tx.teacher.create({
        data: {
          schoolId,
          displayNumber: i + 1,
          fullName: t.fullName.trim(),
          phone: t.phone?.trim() || null,
          methodDay: t.methodDay,
          weeklyHourCapacity: t.weeklyHourCapacity,
        },
      });
      teacherMap.set(t.fullName, teacher.id);

      // Fan bog'lamalari
      for (const sName of t.subjectNames) {
        const subjectId = subjectMap.get(sName);
        if (subjectId) {
          await tx.teacherSubject.create({ data: { schoolId, teacherId: teacher.id, subjectId } });
        }
      }

      // Filial bog'lamalari
      for (const bName of t.branchNames) {
        const branchId = branchMap.get(bName);
        if (branchId) {
          await tx.teacherBranch.create({ data: { schoolId, teacherId: teacher.id, branchId } });
        }
      }

      teacherMap.set(t.fullName, teacher.id);
    }

    // 7. Sinflar va ClassSubject'lar
    for (const c of data.classes) {
      const branchId = branchMap.get(c.branchName);
      const shiftId = shiftMap.get(c.shiftName);
      if (!branchId || !shiftId) continue;

      const cls = await tx.class.create({
        data: { schoolId, branchId, shiftId, name: c.name, grade: c.grade, isPrimary: c.grade <= 4 },
      });

      for (const cs of c.subjects) {
        const subjectId = subjectMap.get(cs.subjectName);
        const teacherId = teacherMap.get(cs.teacherFullName);
        if (!subjectId || !teacherId) continue;

        await tx.classSubject.create({
          data: { schoolId, classId: cls.id, subjectId, teacherId, weeklyHours: cs.weeklyHours },
        });
      }
    }

    // 8. Setup tugallandi deb belgilash
    await tx.user.update({
      where: { id: session.user.id },
      data: { setupDone: true },
    });
  });
}
