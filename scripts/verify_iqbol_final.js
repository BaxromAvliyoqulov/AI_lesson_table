const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const iqbolId = 't_39_19';

  // Check Iqbol lessons
  const lessons = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: iqbolId },
    include: { class: { include: { shift: true } }, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });

  console.log(`Iqbol barcha darslari soni: ${lessons.length} ta (Kutilgan: 15 ta)`);

  // Check each day and shift
  for (let d = 1; d <= 6; d++) {
    const dayL = lessons.filter(l => l.dayOfWeek === d);
    if (dayL.length === 0) continue;
    console.log(`\nKun ${d} (${dayL.length} ta dars):`);
    for (const l of dayL) {
      console.log(`  P${l.periodNumber} [${l.class.shift?.name?.split(' ')[0]}]: ${l.class.name} [${l.groupType}]`);
    }
  }

  // Check Muxriddin
  const muxL = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacher: { fullName: { contains: 'Muxriddin', mode: 'insensitive' } } },
    include: { class: true }
  });
  console.log(`\nMuxriddin darslari soni: ${muxL.length} ta`);

  // Check if any class has 2 different teachers at the same time (excluding split groups)
  const classNames = ['1-A', '1-B', '1-D', '2-A', '2-B', '3-A', '3-B', '4-A', '4-B'];
  for (const cn of classNames) {
    const cLessons = await prisma.lesson.findMany({
      where: { schoolId, scheduleId: activeSchedId, class: { name: cn } },
      include: { subject: true, teacher: true }
    });
    for (let d = 1; d <= 6; d++) {
      for (let p = 1; p <= 6; p++) {
        const slot = cLessons.filter(l => l.dayOfWeek === d && l.periodNumber === p);
        if (slot.length > 1) {
          const isSplitGroup = slot.length === 2 && slot[0].subjectId === slot[1].subjectId && 
            ((slot[0].groupType === 'GROUP_1' && slot[1].groupType === 'GROUP_2') || (slot[0].groupType === 'GROUP_2' && slot[1].groupType === 'GROUP_1'));
          if (!isSplitGroup) {
            console.log(`⚠️ SINF TO'QNASHUVI: ${cn} Kun ${d} P${p} da: ${slot.map(s => s.subject.name + ' (' + s.teacher?.fullName?.split(' ')[0] + ') [' + s.groupType + ']').join(' + ')}`);
          }
        }
      }
    }
  }
  console.log('✅ Barcha sinflar va darslar tekshirildi!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
