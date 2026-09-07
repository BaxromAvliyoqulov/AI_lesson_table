const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';
  const cls1A = await prisma.class.findFirst({ where: { name: '1-A' } });
  const cs1A = await prisma.classSubject.findMany({ where: { classId: cls1A.id }, include: { subject: true } });
  console.log('1-A ClassSubjects:');
  cs1A.forEach(cs => console.log(`- ${cs.subject.name}: ${cs.weeklyHours} soat`));

  const lessons1A = await prisma.lesson.findMany({
    where: { scheduleId, classId: cls1A.id },
    include: { subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });
  console.log(`\n1-A Lessons (${lessons1A.length} ta):`);
  lessons1A.forEach(l => console.log(`Kun ${l.dayOfWeek}, Para ${l.periodNumber}: ${l.subject.name}`));

  await prisma.$disconnect();
}

main().catch(console.error);
