const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  const classNames = ['1-A', '1-B', '1-D', '2-A', '2-B', '3-A', '3-B', '4-A', '4-B'];
  const classes = await prisma.class.findMany({
    where: { schoolId, name: { in: classNames } },
    include: { shift: true }
  });

  console.log('=== 9 TA SINFNING TO\'LIQ HAFTALIK JADVALI VA BO\'SH SOATLARI ===');
  for (const cls of classes) {
    const lessons = await prisma.lesson.findMany({
      where: { schoolId, scheduleId: activeSchedId, classId: cls.id },
      include: { subject: true, teacher: true },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
    });

    console.log(`\n================= ${cls.name} (${cls.shift?.name}) [${lessons.length} dars] =================`);
    for (let d = 1; d <= 6; d++) {
      const dl = lessons.filter(l => l.dayOfWeek === d);
      const str = dl.map(l => `P${l.periodNumber}: ${l.subject.name} (${l.teacher?.fullName?.split(' ')[0]}) [${l.groupType}]`).join(' | ');
      console.log(`Kun ${d}: ${str || 'Bo\'sh'}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
