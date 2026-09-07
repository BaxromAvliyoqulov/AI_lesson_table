const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 1. Find teacher Iqbol
  const iqbol = await prisma.teacher.findFirst({
    where: { schoolId, fullName: { contains: 'Iqbol', mode: 'insensitive' } }
  });
  console.log('Teacher Iqbol:', iqbol);

  if (!iqbol) {
    console.log('Teacher Iqbol not found!');
    return;
  }

  // 2. ClassSubjects assigned to Iqbol
  const cs = await prisma.classSubject.findMany({
    where: { schoolId, teacherId: iqbol.id },
    include: { class: true, subject: true }
  });
  console.log(`\n=== IQBOL CLASS SUBJECTS (${cs.length} ta biriktirilgan) ===`);
  for (const c of cs) {
    console.log(`Sinf: ${c.class.name} | Fan: ${c.subject.name} | Guruh: ${c.groupType} | Soat: ${c.hoursPerWeek}`);
  }

  // 3. Current lessons in active schedule
  const lessons = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: iqbol.id },
    include: { class: true, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });

  console.log(`\n=== IQBOL HOZIRGI DARSLARI (${lessons.length} ta dars jadvalda) ===`);
  const days = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  for (let d = 1; d <= 6; d++) {
    const dl = lessons.filter(l => l.dayOfWeek === d);
    console.log(`\n${days[d]} (${dl.length} soat):`);
    if (dl.length === 0) console.log('  Dars yo\'q');
    for (const l of dl) {
      console.log(`  ${l.periodNumber}-soat: ${l.class.name} - ${l.subject.name} [${l.groupType}] (id: ${l.id})`);
    }
  }

  // 4. Check shifts of Iqbol's classes
  const classIds = [...new Set(lessons.map(l => l.classId))];
  const classes = await prisma.class.findMany({
    where: { id: { in: classIds } },
    include: { shift: true }
  });
  console.log('\n=== SINFLARNING SMENALARI ===');
  for (const c of classes) {
    console.log(`Sinf: ${c.name} | Smena: ${c.shift?.name} (${c.shift?.startTime} - ${c.shift?.endTime})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
