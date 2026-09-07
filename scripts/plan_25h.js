const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 1. 8-D all lessons in active schedule
  const l8D = await prisma.lesson.findMany({
    where: { schoolId, class: { name: '8-D' }, scheduleId: activeSchedId },
    include: { subject: true, teacher: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });

  console.log(`=== 8-D BARCHA DARSLARI (${l8D.length}) ===`);
  for (let d = 1; d <= 6; d++) {
    const dayL = l8D.filter(l => l.dayOfWeek === d);
    console.log(`Kun ${d}: ${dayL.map(l => `P${l.periodNumber}: ${l.subject.name} (${l.teacher?.fullName}) [${l.groupType}]`).join(' | ')}`);
  }

  // 2. Sabohat all lessons
  const saboL = await prisma.lesson.findMany({
    where: { schoolId, teacherId: 't_39_22', scheduleId: activeSchedId },
    include: { class: true, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });

  console.log(`\n=== SABOHATNING HOZIRGI JADVALI (${saboL.length} ta dars) ===`);
  const days = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  for (let d = 1; d <= 6; d++) {
    const dl = saboL.filter(l => l.dayOfWeek === d);
    console.log(`${days[d]} (${dl.length}): ${dl.map(l => `P${l.periodNumber}: ${l.class.name}`).join(', ')}`);
  }

  // 3. Let's see: Dushanba kuni 8-D nima qiladi?
  const d1_8D = l8D.filter(l => l.dayOfWeek === 1);
  console.log('\n8-D Dushanba kuni:', d1_8D.map(l => `P${l.periodNumber}: ${l.subject.name}`).join(', '));
}

main().catch(console.error).finally(() => prisma.$disconnect());
