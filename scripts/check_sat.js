const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSat() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 9-A on Saturday
  const l9A = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '9-A' }, dayOfWeek: 6 },
    include: { subject: true, teacher: true },
    orderBy: { periodNumber: 'asc' }
  });
  console.log('=== 9-A KUN 6 (SHANBA) ===');
  for (const l of l9A) console.log(`P${l.periodNumber}: ${l.subject.name} (${l.teacher?.fullName}) [${l.groupType}]`);

  // 8-D on Saturday
  const l8D = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '8-D' }, dayOfWeek: 6 },
    include: { subject: true, teacher: true },
    orderBy: { periodNumber: 'asc' }
  });
  console.log('\n=== 8-D KUN 6 (SHANBA) ===');
  for (const l of l8D) console.log(`P${l.periodNumber}: ${l.subject.name} (${l.teacher?.fullName}) [${l.groupType}]`);

  // Baxrom on Saturday
  const lBax = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacher: { fullName: { contains: 'Baxrom' } }, dayOfWeek: 6 },
    include: { class: true, subject: true },
    orderBy: { periodNumber: 'asc' }
  });
  console.log('\n=== BAXROM KUN 6 (SHANBA) ===');
  for (const l of lBax) console.log(`P${l.periodNumber}: ${l.class.name} ${l.subject.name} [${l.groupType}]`);

  // Sabohat on Saturday
  const lSabo = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacher: { fullName: { contains: 'Sabohat' } }, dayOfWeek: 6 },
    include: { class: true, subject: true },
    orderBy: { periodNumber: 'asc' }
  });
  console.log('\n=== SABOHAT KUN 6 (SHANBA) ===');
  for (const l of lSabo) console.log(`P${l.periodNumber}: ${l.class.name} ${l.subject.name} [${l.groupType}]`);
}

checkSat().catch(console.error).finally(() => prisma.$disconnect());
