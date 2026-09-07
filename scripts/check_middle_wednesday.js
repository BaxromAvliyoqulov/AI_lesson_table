const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';

  const middleClasses = ['5-A', '5-B', '5-D', '6-A', '6-D', '7-A', '7-B'];
  for (const c of middleClasses) {
    const lessons = await prisma.lesson.findMany({
      where: { scheduleId, class: { name: c }, dayOfWeek: 3 },
      include: { subject: true, teacher: true },
      orderBy: { periodNumber: 'asc' }
    });
    console.log(`${c} Chorshanba:`, lessons.map(l => `P${l.periodNumber}: ${l.subject.name} (${l.teacher.fullName})`).join(', '));
  }

  await prisma.$disconnect();
}

main().catch(console.error);
