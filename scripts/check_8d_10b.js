const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // Check 8-D English lessons currently in active schedule
  const l8D_eng = await prisma.lesson.findMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      class: { name: '8-D' },
      subject: { name: { contains: 'Ingliz' } }
    },
    include: { teacher: true }
  });
  console.log('Current 8-D English lessons:');
  for (const l of l8D_eng) {
    console.log(`D${l.dayOfWeek} P${l.periodNumber} | ${l.teacher.fullName} (${l.teacherId}) | Gr: ${l.groupType}`);
  }

  // Check 10-B lessons
  const l10B = await prisma.lesson.findMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      class: { name: '10-B' }
    },
    include: { subject: true, teacher: true }
  });
  console.log('\n10-B all lessons count:', l10B.length);
  for (let d = 1; d <= 6; d++) {
    const dl = l10B.filter(l => l.dayOfWeek === d);
    console.log(`Day ${d}: ${dl.map(l => `P${l.periodNumber}: ${l.subject.name}(${l.teacher?.shortName || l.teacher?.fullName})`).join(', ')}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
