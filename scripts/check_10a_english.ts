// @ts-nocheck
import { prisma } from "../src/lib/prisma";

async function main() {
  const schoolId = "cmthn422g0001uff8vhccbxmz";

  // 1. Find 10-A
  const cls10A = await prisma.class.findFirst({
    where: { schoolId, name: "10-A" }
  });

  console.log("=== 10-A CLASS ===", cls10A?.id, cls10A?.name);
  if (cls10A) {
    const csList = await prisma.classSubject.findMany({
      where: { classId: cls10A.id, schoolId },
      include: { subject: true, teacher: true }
    });
    const engCS = csList.filter(cs => cs.subject.name.toLowerCase().includes("ingliz"));
    console.log("10-A English ClassSubjects:");
    engCS.forEach(cs => {
      console.log(`  CS: ${cs.id} | ${cs.weeklyHours} soat | ${cs.teacher.fullName} | ${cs.groupType}`);
    });

    const lessons = await prisma.lesson.findMany({
      where: { classId: cls10A.id, schoolId },
      include: { subject: true, teacher: true },
      orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }]
    });
    const engLessons = lessons.filter(l => l.subject.name.toLowerCase().includes("ingliz"));
    console.log(`\n10-A English Lessons (${engLessons.length} ta):`);
    engLessons.forEach(l => {
      console.log(`  Kun: ${l.dayOfWeek} | Soat: ${l.periodNumber} | ${l.teacher?.fullName} | ${l.groupType}`);
    });
  }

  // 2. Find Sabohat
  const sabo = await prisma.teacher.findFirst({
    where: { schoolId, fullName: { contains: "Sabohat", mode: "insensitive" } }
  });
  console.log("\n=== SABOHAT ===", sabo?.id, sabo?.fullName);
  if (sabo) {
    const saboCS = await prisma.classSubject.findMany({
      where: { teacherId: sabo.id, schoolId },
      include: { class: true, subject: true }
    });
    console.log("Sabohat ClassSubjects:");
    saboCS.forEach(cs => {
      console.log(`  Sinf: ${cs.class.name} | Fan: ${cs.subject.name} | Soat: ${cs.weeklyHours} | Guruh: ${cs.groupType}`);
    });

    const saboLessons = await prisma.lesson.findMany({
      where: { teacherId: sabo.id, schoolId },
      include: { class: true, subject: true },
      orderBy: [{ dayOfWeek: "asc" }, { periodNumber: "asc" }]
    });
    console.log(`\nSabohat Lessons (${saboLessons.length} ta):`);
    saboLessons.forEach(l => {
      console.log(`  Kun: ${l.dayOfWeek} | Soat: ${l.periodNumber} | Sinf: ${l.class.name} | ${l.subject.name} | ${l.groupType}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
