const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findSlots10A() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const saboId = 't_39_22';

  const l10A = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '10-A' } },
    include: { subject: true, teacher: true }
  });

  const saboL = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: saboId },
    include: { class: true, subject: true }
  });

  console.log('=== 10-A VA SABOHAT BO\'SH VAQTLARI ===');
  for (let d = 1; d <= 6; d++) {
    const aDay = l10A.filter(l => l.dayOfWeek === d);
    const sDay = saboL.filter(l => l.dayOfWeek === d && !(l.class.name === '9-A' && l.groupType === 'GROUP_2'));
    
    console.log(`\nKun ${d}:`);
    for (let p = 1; p <= 7; p++) {
      const aLessons = aDay.filter(l => l.periodNumber === p);
      const sLesson = sDay.find(l => l.periodNumber === p);
      const aStatus = aLessons.length > 0 ? aLessons.map(l => l.subject.name).join('+') : 'BO\'SH';
      const sStatus = sLesson ? `${sLesson.class.name} (${sLesson.subject.name})` : 'BO\'SH';
      
      const bothFree = (aLessons.length === 0 && !sLesson) ? ' <--- IKKISI HAM BO\'SH!' : '';
      console.log(`  P${p}: 10-A=[${aStatus}] | Sabohat=[${sStatus}]${bothFree}`);
    }
  }
}

findSlots10A().catch(console.error).finally(() => prisma.$disconnect());
