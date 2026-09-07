const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showAll() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const saboId = 't_39_22';

  const saboL = await prisma.lesson.findMany({
    where: { schoolId, teacherId: saboId, scheduleId: activeSchedId },
    include: { class: true, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });

  console.log(`=== SABOHAT DARSLARI RO'YXATI (${saboL.length} ta) ===`);
  for (let i = 0; i < saboL.length; i++) {
    const l = saboL[i];
    console.log(`${i + 1}. Kun ${l.dayOfWeek} | ${l.periodNumber}-soat | ${l.class.name} | ${l.subject.name} | [${l.groupType}] (id: ${l.id})`);
  }
}

showAll().catch(console.error).finally(() => prisma.$disconnect());
