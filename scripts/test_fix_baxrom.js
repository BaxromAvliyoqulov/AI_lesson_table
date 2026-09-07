const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulate() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const baxromId = 't_39_3';

  // 1. Current lessons for Baxrom
  const current = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: baxromId },
    include: { class: { include: { shift: true } }, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });

  console.log(`Current lessons count for Baxrom: ${current.length}`);

  // What lessons will be kept?
  // - 5-A: ONLY 1 lesson per period (WHOLE, not GROUP_2) + Kelajak soati
  // - 8-A: ONLY 1 lesson per period (WHOLE, not GROUP_2)
  // - 9-A: NONE for Baxrom (Sabohat teaches it)
  // - 5-B: WHOLE
  // - 6-A: WHOLE
  // - 8-B: WHOLE
  // - 8-D: GROUP_1

  const filtered = current.filter(l => {
    // Drop 9-A from Baxrom
    if (l.class.name === '9-A') return false;
    // Drop GROUP_2 of 5-A
    if (l.class.name === '5-A' && l.groupType === 'GROUP_2') return false;
    // Drop GROUP_2 of 8-A
    if (l.class.name === '8-A' && l.groupType === 'GROUP_2') return false;
    return true;
  });

  console.log(`\nFiltered clean lessons count for Baxrom: ${filtered.length}`);

  const days = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  for (let d = 1; d <= 6; d++) {
    const dl = filtered.filter(l => l.dayOfWeek === d);
    console.log(`\n${days[d]} (${dl.length} ta dars):`);
    for (const l of dl) {
      console.log(`  P${l.periodNumber} [${l.class.shift?.name?.split(' ')[0]}]: ${l.class.name} ${l.subject.name}`);
    }
  }
}

simulate().catch(console.error).finally(() => prisma.$disconnect());
