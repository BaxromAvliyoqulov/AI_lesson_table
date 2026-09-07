const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 1. Where are 1-A and 1-B completely FREE across the entire week?
  const all1A = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '1-A' } },
    include: { subject: true }
  });

  const all1B = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, class: { name: '1-B' } },
    include: { subject: true }
  });

  console.log('=== 1-A BO\'SH VAQTLARI (Hozirgi Ingliz tilisini hisobga olmaganda) ===');
  for (let d = 1; d <= 6; d++) {
    const dayL = all1A.filter(l => l.dayOfWeek === d && !l.subject.name.includes('Ingliz'));
    const taken = dayL.map(l => l.periodNumber);
    const free = [1, 2, 3, 4, 5].filter(p => !taken.includes(p));
    console.log(`Kun ${d}: band=[${taken.join(',')}] bo'sh=[${free.join(',')}]`);
  }

  console.log('\n=== 1-B BO\'SH VAQTLARI (Hozirgi Ingliz tilisini hisobga olmaganda) ===');
  for (let d = 1; d <= 6; d++) {
    const dayL = all1B.filter(l => l.dayOfWeek === d && !l.subject.name.includes('Ingliz'));
    const taken = dayL.map(l => l.periodNumber);
    const free = [1, 2, 3, 4, 5].filter(p => !taken.includes(p));
    console.log(`Kun ${d}: band=[${taken.join(',')}] bo'sh=[${free.join(',')}]`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
