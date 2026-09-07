const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 1. Check what happens if we put 8-D Group 2 for Sabohat
  // ClassSubject of 8-D
  const cs8D = await prisma.classSubject.findMany({
    where: { schoolId, class: { name: '8-D' }, subject: { name: { contains: 'Ingliz' } } }
  });
  console.log('8-D ClassSubjects:');
  for (const c of cs8D) console.log(`  ${c.id} | ${c.teacherId} | ${c.weeklyHours}h | ${c.groupType}`);

  // 2. Check Baxrom 8-D lessons
  const bax8DLessons = await prisma.lesson.findMany({
    where: { schoolId, teacherId: 't_39_3', class: { name: '8-D' }, scheduleId: activeSchedId }
  });
  console.log('\nBaxrom 8-D lessons:');
  for (const l of bax8DLessons) {
    console.log(`  ID: ${l.id} | D${l.dayOfWeek} P${l.periodNumber} | Gr: ${l.groupType}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
