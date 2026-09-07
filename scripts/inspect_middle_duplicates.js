const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';
  const middleHighItems = [
    { class: '5-A', subject: 'Matematika' },
    { class: '5-A', subject: 'Texnologiya' },
    { class: '5-B', subject: 'Matematika' },
    { class: '5-B', subject: 'Tarix' },
    { class: '5-D', subject: 'Matematika' },
    { class: '6-A', subject: 'Matematika' },
    { class: '6-D', subject: 'Matematika' },
    { class: '7-A', subject: 'Algebra' },
    { class: '7-B', subject: 'Algebra' },
    { class: '9-A', subject: 'Jismoniy tarbiya' },
    { class: '10-A', subject: 'Jismoniy tarbiya' }
  ];

  for (const item of middleHighItems) {
    const lessons = await prisma.lesson.findMany({
      where: {
        scheduleId,
        class: { name: item.class },
        subject: { name: { contains: item.subject, mode: 'insensitive' } }
      },
      include: { class: true, subject: true, teacher: true },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
    });

    console.log(`\n=== ${item.class} ${item.subject} (Jami ${lessons.length} soat) ===`);
    const byDay = {};
    lessons.forEach(l => {
      if (!byDay[l.dayOfWeek]) byDay[l.dayOfWeek] = [];
      byDay[l.dayOfWeek].push(l.periodNumber);
    });
    for (let d = 1; d <= 6; d++) {
      console.log(`Day ${d}: [${(byDay[d] || []).join(', ')}]`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
