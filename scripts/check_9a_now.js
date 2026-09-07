const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  const l9A = await prisma.lesson.findMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      class: { name: '9-A' },
      subject: { name: { contains: 'Ingliz' } }
    },
    include: { teacher: true }
  });

  console.log(`9-A English lessons count: ${l9A.length}`);
  for (const l of l9A) {
    console.log(`ID: ${l.id} | D${l.dayOfWeek} P${l.periodNumber} | ${l.teacher?.fullName} (${l.teacherId}) | Gr: ${l.groupType}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
