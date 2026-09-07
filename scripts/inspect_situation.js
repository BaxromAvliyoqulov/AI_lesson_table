const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 1. Sabohat
  const sabo = await prisma.teacher.findFirst({
    where: { schoolId, fullName: { contains: 'Sabohat', mode: 'insensitive' } }
  });
  console.log('Sabohat:', sabo.fullName, sabo.id);

  // 2. Baxrom
  const baxrom = await prisma.teacher.findFirst({
    where: { schoolId, fullName: { contains: 'Baxrom', mode: 'insensitive' } }
  });
  console.log('Baxrom:', baxrom.fullName, baxrom.id);

  // 3. Sabohat ClassSubjects
  const saboCS = await prisma.classSubject.findMany({
    where: { schoolId, teacherId: sabo.id },
    include: { class: true, subject: true }
  });
  console.log('\n=== SABOHAT CLASS SUBJECTS ===');
  for (const cs of saboCS) {
    console.log(`Class: ${cs.class.name} | Subject: ${cs.subject.name} | Group: ${cs.groupType}`);
  }

  // 4. Sabohat Current Lessons
  const saboLessons = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: sabo.id },
    include: { class: true, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });
  console.log(`\n=== SABOHAT CURRENT LESSONS IN DB (${saboLessons.length} ta) ===`);
  const days = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  for (let d = 1; d <= 6; d++) {
    const dl = saboLessons.filter(l => l.dayOfWeek === d);
    console.log(`${days[d]} (${dl.length}):`);
    for (const l of dl) {
      console.log(`  ${l.periodNumber}-soat: ${l.class.name} - ${l.subject.name} [${l.groupType}] (id: ${l.id})`);
    }
  }

  // 5. Baxrom Current Lessons
  const baxromLessons = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: baxrom.id },
    include: { class: true, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });
  console.log(`\n=== BAXROM CURRENT LESSONS IN DB (${baxromLessons.length} ta) ===`);
  for (let d = 1; d <= 6; d++) {
    const dl = baxromLessons.filter(l => l.dayOfWeek === d);
    console.log(`${days[d]} (${dl.length}):`);
    for (const l of dl) {
      console.log(`  ${l.periodNumber}-soat: ${l.class.name} - ${l.subject.name} [${l.groupType}]`);
    }
  }

  // 6. 9-A English
  const l9A = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '9-A' }, subject: { name: { contains: 'Ingliz' } } },
    include: { teacher: true }
  });
  console.log('\n=== 9-A INGLIZ TILI DARSLARI ===');
  for (const l of l9A) {
    console.log(`D${l.dayOfWeek} P${l.periodNumber} | ${l.teacher?.fullName} | [${l.groupType}]`);
  }

  // 7. 8-D English
  const l8D = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '8-D' }, subject: { name: { contains: 'Ingliz' } } },
    include: { teacher: true }
  });
  console.log('\n=== 8-D INGLIZ TILI DARSLARI ===');
  for (const l of l8D) {
    console.log(`D${l.dayOfWeek} P${l.periodNumber} | ${l.teacher?.fullName} | [${l.groupType}]`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
