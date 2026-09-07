const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  const l1 = await prisma.lesson.findMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      class: { name: { in: ['1-A', '1-B', '1-D'] } },
      subject: { name: { contains: 'Ingliz' } }
    },
    include: { class: true, teacher: true }
  });

  console.log('=== 1-A, 1-B, 1-D INGLIZ TILI DARSLARI ===');
  for (const l of l1) {
    console.log(`D${l.dayOfWeek} P${l.periodNumber} | ${l.class.name} [${l.groupType}] | ${l.teacher?.fullName}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
