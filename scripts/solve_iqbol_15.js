const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // Check 1-A all lessons
  const l1A = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '1-A' } },
    include: { subject: true, teacher: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });
  console.log('=== 1-A HOZIRGI JADVALI ===');
  for (let d = 1; d <= 5; d++) {
    const dl = l1A.filter(l => l.dayOfWeek === d);
    console.log(`Kun ${d}: ${dl.map(l => `P${l.periodNumber}: ${l.subject.name} (${l.teacher?.fullName?.split(' ')[0]})`).join(' | ')}`);
  }

  // Check 1-B all lessons
  const l1B = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '1-B' } },
    include: { subject: true, teacher: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });
  console.log('\n=== 1-B HOZIRGI JADVALI ===');
  for (let d = 1; d <= 5; d++) {
    const dl = l1B.filter(l => l.dayOfWeek === d);
    console.log(`Kun ${d}: ${dl.map(l => `P${l.periodNumber}: ${l.subject.name} (${l.teacher?.fullName?.split(' ')[0]})`).join(' | ')}`);
  }

  // Check 1-D all lessons
  const l1D = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '1-D' } },
    include: { subject: true, teacher: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });
  console.log('\n=== 1-D HOZIRGI JADVALI ===');
  for (let d = 1; d <= 5; d++) {
    const dl = l1D.filter(l => l.dayOfWeek === d);
    console.log(`Kun ${d}: ${dl.map(l => `P${l.periodNumber}: ${l.subject.name} (${l.teacher?.fullName?.split(' ')[0]})`).join(' | ')}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
