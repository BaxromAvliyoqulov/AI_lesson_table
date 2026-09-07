const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function solve() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // Let's get all lessons in active schedule
  const allLessons = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId },
    include: { class: true, subject: true, teacher: true }
  });

  console.log(`Total lessons in active schedule: ${allLessons.length}`);

  // Let's inspect Sabohat's lessons:
  // Sabohat needs:
  // 1. 7-A Kelajak Soati (1h)
  // 2. 7-A Ingliz tili (4h)
  // 3. 7-B Ingliz tili (4h)
  // 4. 9-B Ingliz tili (3h)
  // 5. 9-D Ingliz tili (3h)
  // 6. 10-A Ingliz tili (2h)
  // 7. 10-B Ingliz tili (2h)
  // 8. 9-A Ingliz tili [GROUP_1] (3h) (GROUP_2 is Baxrom)
  // 9. 8-D Ingliz tili [GROUP_2] (3h) (GROUP_1 is Baxrom)
  // TOTAL: 1 + 4 + 4 + 3 + 3 + 2 + 2 + 3 + 3 = 25h! (24h Ingliz tili + 1h KS)

  // Baxrom 8-D current lessons:
  const baxrom8D = allLessons.filter(l => l.teacher?.fullName?.includes('BAXROM') && l.class?.name === '8-D');
  console.log('\nBaxrom 8-D current lessons:');
  for (const l of baxrom8D) {
    console.log(`D${l.dayOfWeek} P${l.periodNumber} [${l.groupType}]`);
  }

  // Baxrom 9-A current lessons:
  const baxrom9A = allLessons.filter(l => l.teacher?.fullName?.includes('BAXROM') && l.class?.name === '9-A');
  console.log('\nBaxrom 9-A current lessons:');
  for (const l of baxrom9A) {
    console.log(`D${l.dayOfWeek} P${l.periodNumber} [${l.groupType}]`);
  }

  // 9-A all English lessons:
  const all9AEng = allLessons.filter(l => l.class?.name === '9-A' && l.subject?.name?.includes('Ingliz'));
  console.log('\n9-A all English lessons:');
  for (const l of all9AEng) {
    console.log(`D${l.dayOfWeek} P${l.periodNumber} [${l.groupType}] - ${l.teacher?.fullName}`);
  }

  // 8-D all English lessons:
  const all8DEng = allLessons.filter(l => l.class?.name === '8-D' && l.subject?.name?.includes('Ingliz'));
  console.log('\n8-D all English lessons:');
  for (const l of all8DEng) {
    console.log(`D${l.dayOfWeek} P${l.periodNumber} [${l.groupType}] - ${l.teacher?.fullName}`);
  }
}

solve().catch(console.error).finally(() => prisma.$disconnect());
