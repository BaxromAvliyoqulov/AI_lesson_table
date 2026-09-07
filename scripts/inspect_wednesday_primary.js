const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';
  const primary = ['1-A', '1-B', '1-D', '2-A', '2-B', '2-D', '3-A', '3-B', '3-D', '4-A', '4-B', '4-D'];
  for (const c of primary) {
    const lessons = await prisma.lesson.findMany({
      where: { scheduleId, class: { name: c } },
      include: { subject: true },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
    });
    const d3 = lessons.filter(l => l.dayOfWeek === 3).map(l => `${l.periodNumber}:${l.subject.name}`);
    const dupDay = lessons.filter(l => l.subject.name.toLowerCase().includes('matematika'));
    const mathDays = dupDay.map(l => `D${l.dayOfWeek}P${l.periodNumber}`);
    console.log(`${c} -> Math: [${mathDays.join(', ')}] | Chorshanba: [${d3.join(', ')}]`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
