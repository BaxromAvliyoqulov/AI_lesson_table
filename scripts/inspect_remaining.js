const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 1. Mamayusupova Dilfuza: 8-A Fizika vs 11-B Astronomiya on Day 1 P2
  const d1p2_11b = await prisma.lesson.findFirst({
    where: { scheduleId, class: { name: '11-B' }, dayOfWeek: 1, periodNumber: 2 },
    include: { subject: true, teacher: true }
  });
  console.log('11-B Day 1 P2:', d1p2_11b?.subject?.name, 'Teacher:', d1p2_11b?.teacher?.fullName);
  // Check 11-B lessons on Day 1
  const l11b = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '11-B' }, dayOfWeek: 1 },
    include: { subject: true }
  });
  console.log('11-B Day 1 periods:', l11b.map(l => `${l.periodNumber}:${l.subject.name}`).join(', '));

  // 2. Boboyev Abdumalik: 10-B Geometriya vs 11-B Algebra on Day 6 P2
  const l10b_sat = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '10-B' }, dayOfWeek: 6 },
    include: { subject: true }
  });
  console.log('\n10-B Day 6 periods:', l10b_sat.map(l => `${l.periodNumber}:${l.subject.name}`).join(', '));
  const l11b_sat = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '11-B' }, dayOfWeek: 6 },
    include: { subject: true }
  });
  console.log('11-B Day 6 periods:', l11b_sat.map(l => `${l.periodNumber}:${l.subject.name}`).join(', '));

  // 3. Toshboyev Oybek: 8-A vs 9-A Informatika on Day 6 P6
  const l8a_sat = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '8-A' }, dayOfWeek: 6 },
    include: { subject: true }
  });
  console.log('\n8-A Day 6 periods:', l8a_sat.map(l => `${l.periodNumber}:${l.subject.name}`).join(', '));
  const l9a_sat = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '9-A' }, dayOfWeek: 6 },
    include: { subject: true }
  });
  console.log('9-A Day 6 periods:', l9a_sat.map(l => `${l.periodNumber}:${l.subject.name}`).join(', '));

  // 4. Toshboyev Qahramon: 1-B Jismoniy tarbiya on Day 1 P5 vs 8-A Jismoniy tarbiya Day 1 P5
  const l1b_mon = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '1-B' }, dayOfWeek: 1 },
    include: { subject: true }
  });
  console.log('\n1-B Day 1 periods:', l1b_mon.map(l => `${l.periodNumber}:${l.subject.name}`).join(', '));
  const l1b_all = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '1-B' }, subject: { name: { contains: 'Jismoniy' } } },
    include: { subject: true }
  });
  console.log('1-B Jismoniy tarbiya total:', l1b_all.map(l => `Day ${l.dayOfWeek} P${l.periodNumber}`));

  // 5. 9-A and 10-A Jismoniy tarbiya
  const jt9a = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '9-A' }, subject: { name: { contains: 'Jismoniy' } } },
    include: { teacher: true }
  });
  console.log('\n9-A Jismoniy tarbiya:', jt9a.map(l => `Day ${l.dayOfWeek} P${l.periodNumber} (${l.groupType})`));
  const jt10a = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '10-A' }, subject: { name: { contains: 'Jismoniy' } } },
    include: { teacher: true }
  });
  console.log('10-A Jismoniy tarbiya:', jt10a.map(l => `Day ${l.dayOfWeek} P${l.periodNumber} (${l.groupType})`));

  await prisma.$disconnect();
}

main().catch(console.error);
