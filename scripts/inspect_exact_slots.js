const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 1. Mamayusupova Dilfuza: all her lessons
  const mdLessons = await prisma.lesson.findMany({
    where: { scheduleId, teacher: { fullName: { contains: 'MAMAYUSUPOVA' } } },
    include: { class: true, subject: true }
  });
  console.log('Mamayusupova lessons:');
  mdLessons.forEach(l => console.log(`Day ${l.dayOfWeek} P${l.periodNumber}: ${l.class.name} ${l.subject.name}`));

  // 2. 11-B class: all its lessons
  const l11b = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '11-B' } },
    include: { subject: true }
  });
  console.log('\n11-B lessons count by day:');
  for (let d = 1; d <= 6; d++) {
    const dl = l11b.filter(l => l.dayOfWeek === d);
    console.log(`Day ${d}:`, dl.map(l => `P${l.periodNumber}:${l.subject.name}`).join(', '));
  }

  // 3. Toshboyev Oybek: Shanba (Day 6) lessons
  const toLessons = await prisma.lesson.findMany({
    where: { scheduleId, teacher: { fullName: { contains: 'TOSHBOYEV OYBEK' } }, dayOfWeek: 6 },
    include: { class: true }
  });
  console.log('\nToshboyev Oybek Day 6:', toLessons.map(l => `P${l.periodNumber}: ${l.class.name}`));

  // 4. Boboyev Abdumalik: Day 5 (Juma) and Day 4/3 lessons
  const baLessons = await prisma.lesson.findMany({
    where: { scheduleId, teacher: { fullName: { contains: 'BOBOYEV ABDUMALIK' } } },
    include: { class: true, subject: true }
  });
  console.log('\nBoboyev Abdumalik all lessons:');
  baLessons.forEach(l => console.log(`Day ${l.dayOfWeek} P${l.periodNumber}: ${l.class.name} ${l.subject.name}`));

  // 5. Ortiqov Muzafar on Day 5:
  const omLessons = await prisma.lesson.findMany({
    where: { scheduleId, teacher: { fullName: { contains: 'ORTIQOV' } }, dayOfWeek: 5 },
    include: { class: true }
  });
  console.log('\nOrtiqov Muzafar Day 5:', omLessons.map(l => `P${l.periodNumber}: ${l.class.name}`));

  // 6. Sagirayev Rustam on Day 3 (Wednesday):
  const srLessons = await prisma.lesson.findMany({
    where: { scheduleId, teacher: { fullName: { contains: 'SAGIRAYEV' } }, dayOfWeek: 3 },
    include: { class: true }
  });
  console.log('\nSagirayev Rustam Day 3:', srLessons.map(l => `P${l.periodNumber}: ${l.class.name}`));

  // 7. PE teachers Safarov Otabek and Toshboyev Qahramon on Day 3, 4, 5
  const soLessons = await prisma.lesson.findMany({
    where: { scheduleId, teacher: { fullName: { contains: 'SAFAROV OTABEK' } } },
    include: { class: true }
  });
  console.log('\nSafarov Otabek:');
  soLessons.forEach(l => console.log(`Day ${l.dayOfWeek} P${l.periodNumber}: ${l.class.name}`));

  await prisma.$disconnect();
}

main().catch(console.error);
