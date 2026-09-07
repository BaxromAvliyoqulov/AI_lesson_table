const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check8D() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  const l8D = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '8-D' } },
    include: { subject: true, teacher: true }
  });

  console.log('=== 8-D HAFTALIK DASTURI VA BO\'SH SOATLARI ===');
  for (let d = 1; d <= 6; d++) {
    const dayL = l8D.filter(l => l.dayOfWeek === d);
    const periods = [1, 2, 3, 4, 5, 6, 7];
    const taken = {};
    for (const l of dayL) {
      if (!taken[l.periodNumber]) taken[l.periodNumber] = [];
      taken[l.periodNumber].push(`${l.subject.name} (${l.teacher?.fullName?.split(' ')[0]}) [${l.groupType}]`);
    }
    console.log(`\nKun ${d}:`);
    for (const p of periods) {
      if (taken[p]) {
        console.log(`  P${p}: ${taken[p].join(' + ')}`);
      } else {
        console.log(`  P${p}: [BO'SH]`);
      }
    }
  }
}

check8D().catch(console.error).finally(() => prisma.$disconnect());
