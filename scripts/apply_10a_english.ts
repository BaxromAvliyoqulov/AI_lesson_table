// @ts-nocheck
import { prisma } from "../src/lib/prisma";
import { detectScheduleConflicts } from "../src/lib/solver/schedule-conflict-detector";

async function apply10AEnglish() {
  const schoolId = "cmthn422g0001uff8vhccbxmz";
  console.log("🚀 10-A Ingliz tili darslarini Sabohatga qo'shish boshlandi...");

  // 1. Check existing ClassSubject
  const cs = await prisma.classSubject.findFirst({
    where: {
      schoolId,
      class: { name: "10-A" },
      teacherId: "t_39_22"
    }
  });
  console.log("ClassSubject topildi:", cs?.id);

  // 2. Move Beshimov Day 2 P6 -> P7 for 10-A
  const beshL = await prisma.lesson.findFirst({
    where: { schoolId, class: { name: "10-A" }, dayOfWeek: 2, periodNumber: 6 }
  });
  if (beshL) {
    console.log("Beshimov (10-A, Jismoniy tarbiya) Day 2 P6 dan P7 ga ko'chirildi:", beshL.id);
    await prisma.lesson.update({
      where: { id: beshL.id },
      data: { periodNumber: 7 }
    });
  }

  // 3. Add Sabohat Day 2 P6 for 10-A
  const lDay2 = await prisma.lesson.create({
    data: {
      schoolId,
      classId: "cmthnjt1f006juf04omy7nqbb", // 10-A
      subjectId: "cmthnkx2t00ctuf04y16630f9", // Ingliz tili
      teacherId: "t_39_22", // Sabohat
      dayOfWeek: 2,
      periodNumber: 6,
      groupType: "WHOLE"
    }
  });
  console.log("Sabohat Day 2 P6 Ingliz tili (10-A) qo'shildi:", lDay2.id);

  // 4. Move Qudratov Day 4 P6 -> P7 for 10-A
  const qudrL = await prisma.lesson.findFirst({
    where: { schoolId, class: { name: "10-A" }, dayOfWeek: 4, periodNumber: 6 }
  });
  if (qudrL) {
    console.log("Qudratov (10-A, ChaQ) Day 4 P6 dan P7 ga ko'chirildi:", qudrL.id);
    await prisma.lesson.update({
      where: { id: qudrL.id },
      data: { periodNumber: 7 }
    });
  }

  // 5. Add Sabohat Day 4 P6 for 10-A
  const lDay4 = await prisma.lesson.create({
    data: {
      schoolId,
      classId: "cmthnjt1f006juf04omy7nqbb", // 10-A
      subjectId: "cmthnkx2t00ctuf04y16630f9", // Ingliz tili
      teacherId: "t_39_22", // Sabohat
      dayOfWeek: 4,
      periodNumber: 6,
      groupType: "WHOLE"
    }
  });
  console.log("Sabohat Day 4 P6 Ingliz tili (10-A) qo'shildi:", lDay4.id);

  // 6. Conflict check
  const allLessons = await prisma.lesson.findMany({
    where: { schoolId },
    include: { teacher: true, subject: true, class: true }
  });
  const conflicts = detectScheduleConflicts(allLessons as any);
  console.log("✅ Maktab bo'yicha jami konfliktlar soni:", conflicts.length);

  // 7. Verify Sabohat lessons
  const saboLessons = await prisma.lesson.findMany({
    where: { schoolId, teacherId: "t_39_22" },
    include: { class: true, subject: true },
    orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }]
  });
  console.log(`\n🎉 Sabohat darslari soni: ${saboLessons.length} ta:`);
  for (const l of saboLessons) {
    console.log(`  Kun ${l.dayOfWeek} | ${l.periodNumber}-soat | ${l.class.name} | ${l.subject.name}`);
  }
}

apply10AEnglish()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
