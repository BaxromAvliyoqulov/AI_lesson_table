const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function analyze() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  const classNames = ['7-A', '7-B', '8-D', '9-A', '9-B', '9-D', '10-A', '10-B'];
  const classes = await prisma.class.findMany({
    where: { schoolId, name: { in: classNames } }
  });

  console.log('=== HAR BIR SINFNING JADVALI (Haftalik) ===');
  for (const cls of classes) {
    const lessons = await prisma.lesson.findMany({
      where: { schoolId, scheduleId: activeSchedId, classId: cls.id },
      include: { subject: true, teacher: true },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
    });
    console.log(`\n------------------ ${cls.name} (${lessons.length} dars) ------------------`);
    for (let d = 1; d <= 6; d++) {
      const dl = lessons.filter(l => l.dayOfWeek === d);
      const str = dl.map(l => `P${l.periodNumber}: ${l.subject.name} (${l.teacher?.fullName?.split(' ')[0] || 'NoTr'}) [${l.groupType}]`).join(' | ');
      console.log(`Kun ${d}: ${str || 'Bo\'sh'}`);
    }
  }
}

analyze().catch(console.error).finally(() => prisma.$disconnect());
