const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  const classNames = ['5-A', '5-B', '6-A', '8-A', '8-B', '8-D'];
  const classes = await prisma.class.findMany({
    where: { schoolId, name: { in: classNames } },
    include: { shift: true }
  });

  console.log('=== BAXROMNING 6 TA SINFI HAFTALIK JADVALI ===');
  for (const cls of classes) {
    const lessons = await prisma.lesson.findMany({
      where: { schoolId, scheduleId: activeSchedId, classId: cls.id },
      include: { subject: true, teacher: true },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
    });

    console.log(`\n----------------- ${cls.name} (${cls.shift?.name}) [${lessons.length} dars] -----------------`);
    for (let d = 1; d <= 6; d++) {
      const dl = lessons.filter(l => l.dayOfWeek === d);
      const str = dl.map(l => `P${l.periodNumber}: ${l.subject.name} (${l.teacher?.fullName?.split(' ')[0]}) [${l.groupType}]`).join(' | ');
      console.log(`Kun ${d}: ${str || 'Bo\'sh'}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
