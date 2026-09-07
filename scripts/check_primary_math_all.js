const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';
  const primaryClasses = ['1-A', '1-B', '1-D', '2-A', '2-B', '2-D', '3-A', '3-B', '3-D', '4-A', '4-B', '4-D'];

  for (const cName of primaryClasses) {
    const lessons = await prisma.lesson.findMany({
      where: { scheduleId, class: { name: cName } },
      include: { subject: true, teacher: true },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
    });

    const mathLessons = lessons.filter(l => l.subject.name.toLowerCase().includes('matematika'));
    const mathByDay = {};
    for (let d = 1; d <= 6; d++) {
      const ml = mathLessons.filter(l => l.dayOfWeek === d);
      mathByDay[d] = ml.map(l => l.periodNumber);
    }
    console.log(`\n=== Sinf: ${cName} (Matematika jami: ${mathLessons.length} soat) ===`);
    console.log(`Kunlar bo'yicha paralar:`, JSON.stringify(mathByDay));

    // Check teacher
    const mathTeacher = mathLessons[0]?.teacher?.fullName;
    console.log(`O'qituvchi: ${mathTeacher}`);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
