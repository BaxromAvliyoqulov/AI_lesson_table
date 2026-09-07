const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPlacement() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const saboId = 't_39_22';
  const baxromId = 't_39_3';

  // 1. Sabohat current lessons
  const saboL = await prisma.lesson.findMany({
    where: { schoolId, teacherId: saboId, scheduleId: activeSchedId },
    include: { class: true, subject: true }
  });
  console.log(`Current Sabohat lessons: ${saboL.length}`);

  // 2. Baxrom current 8-D lessons
  const baxrom8D = await prisma.lesson.findMany({
    where: { schoolId, teacherId: baxromId, class: { name: '8-D' }, scheduleId: activeSchedId }
  });
  console.log('Baxrom 8-D lessons:', baxrom8D.map(l => `D${l.dayOfWeek}P${l.periodNumber} (${l.groupType})`));

  // 3. Check 8-D class lessons
  const all8D = await prisma.lesson.findMany({
    where: { schoolId, class: { name: '8-D' }, scheduleId: activeSchedId },
    include: { subject: true, teacher: true }
  });
  console.log('8-D all lessons count:', all8D.length);

  // 4. If 8-D Group 2 is placed at the exact same slots as Baxrom's Group 1:
  // D2 P5, D4 P5, D6 P4
  // Let's see what Sabohat has at D2 P5, D4 P5, D6 P4:
  console.log('Sabohat at D2 P5:', saboL.find(l => l.dayOfWeek === 2 && l.periodNumber === 5)?.class.name);
  console.log('Sabohat at D4 P5:', saboL.find(l => l.dayOfWeek === 4 && l.periodNumber === 5)?.class.name);
  console.log('Sabohat at D6 P4:', saboL.find(l => l.dayOfWeek === 6 && l.periodNumber === 4)?.class.name);
}

testPlacement().catch(console.error).finally(() => prisma.$disconnect());
