const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // Let's get all lessons of 1-A, 1-B, 1-D, 2-A, 2-B, 3-A, 3-B, 4-A, 4-B
  // excluding English lessons so we see what non-English lessons exist in these classes
  const nonEngLessons = await prisma.lesson.findMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      class: { name: { in: ['1-A', '1-B', '1-D', '2-A', '2-B', '3-A', '3-B', '4-A', '4-B'] } },
      subject: { name: { not: { contains: 'Ingliz' } } }
    },
    include: { class: true, subject: true, teacher: true }
  });

  console.log('=== HAR BIR SINFNING BO\'SH SOATLARI ===');
  const classNames = ['1-A', '1-B', '1-D', '4-A', '4-B', '2-A', '2-B', '3-A', '3-B'];
  for (const cName of classNames) {
    console.log(`\nSinf: ${cName}`);
    for (let d = 1; d <= 6; d++) {
      const dLessons = nonEngLessons.filter(l => l.class.name === cName && l.dayOfWeek === d);
      const taken = dLessons.map(l => l.periodNumber);
      const free = [1, 2, 3, 4, 5, 6].filter(p => !taken.includes(p));
      console.log(`  Kun ${d}: band=[${taken.join(',')}] bo'sh=[${free.join(',')}]`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
