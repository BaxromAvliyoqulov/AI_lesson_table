const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const classNames = ['2-A', '2-B', '3-A', '3-B', '4-A', '4-B'];

  console.log('=== CLASS SUBJECTS FOR 2-A, 2-B, 3-A, 3-B, 4-A, 4-B (INGLIZ TILI) ===');
  const cs = await prisma.classSubject.findMany({
    where: {
      schoolId,
      class: { name: { in: classNames } },
      subject: { name: { contains: 'Ingliz' } }
    },
    include: { class: true, teacher: true }
  });
  for (const c of cs) {
    console.log(`Sinf: ${c.class.name} | Guruh: ${c.groupType} | O'qituvchi: ${c.teacher?.fullName} (${c.teacherId}) | Soat: ${c.hoursPerWeek}`);
  }

  console.log('\n=== CURRENT LESSONS IN ACTIVE SCHEDULE FOR THESE CLASSES (INGLIZ TILI) ===');
  const lessons = await prisma.lesson.findMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      class: { name: { in: classNames } },
      subject: { name: { contains: 'Ingliz' } }
    },
    include: { class: true, teacher: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });
  for (const l of lessons) {
    console.log(`Kun ${l.dayOfWeek} P${l.periodNumber} | Sinf: ${l.class.name} | Gr: ${l.groupType} | O'qituvchi: ${l.teacher?.fullName}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
