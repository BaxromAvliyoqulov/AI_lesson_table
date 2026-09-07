const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 1. Check 10-B on Day 3 (Wednesday)
  const l10b_wed = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '10-B' }, dayOfWeek: 3 },
    include: { subject: true }
  });
  console.log('10-B Day 3:', l10b_wed.map(l => `P${l.periodNumber}:${l.subject.name}`));

  // 2. Check Toshboyev Oybek free periods across week:
  const toLessons = await prisma.lesson.findMany({
    where: { scheduleId, teacher: { fullName: { contains: 'TOSHBOYEV OYBEK' } } },
    include: { class: true }
  });
  console.log('\nToshboyev Oybek counts by day:');
  for (let d = 1; d <= 6; d++) {
    const dl = toLessons.filter(l => l.dayOfWeek === d);
    console.log(`Day ${d}: (${dl.length} lessons):`, dl.map(l => `P${l.periodNumber}:${l.class.name}`).join(', '));
  }

  // Check 9-A free slots
  const l9a = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '9-A' } },
    include: { subject: true }
  });
  console.log('\n9-A counts by day:');
  for (let d = 1; d <= 6; d++) {
    const dl = l9a.filter(l => l.dayOfWeek === d);
    console.log(`Day ${d}: (${dl.length} lessons):`, dl.map(l => `P${l.periodNumber}:${l.subject.name}`).join(', '));
  }

  // 3. Mamayusupova Dilfuza 11-B Astronomiya:
  // Check 11-B on Day 6 vs Mamayusupova
  const l11b_sat = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '11-B' }, dayOfWeek: 6 },
    include: { subject: true }
  });
  console.log('\n11-B Day 6:', l11b_sat.map(l => `P${l.periodNumber}:${l.subject.name}`));

  await prisma.$disconnect();
}

main().catch(console.error);
