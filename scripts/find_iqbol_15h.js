const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const iqbolId = 't_39_19';

  // 1. All classSubjects for Iqbol
  const csIqbol = await prisma.classSubject.findMany({
    where: { schoolId, teacherId: iqbolId },
    include: { class: true, subject: true }
  });
  console.log('=== ALL CLASSSUBJECTS FOR IQBOL ===');
  for (const c of csIqbol) {
    console.log(`${c.class.name} | ${c.subject.name} | ${c.groupType} | hoursPerWeek: ${c.hoursPerWeek}`);
  }

  // 2. Are there any other classSubjects with Iqbol in other schools or unassigned?
  const allCSWithIqbol = await prisma.classSubject.findMany({
    where: { teacherId: iqbolId },
    include: { class: true, subject: true }
  });
  console.log('\nAll CS count with Iqbol:', allCSWithIqbol.length);

  // 3. What about primary classes (1-A, 1-B, etc.) English or Kelajak Soati?
  const primaryClasses = await prisma.class.findMany({
    where: { schoolId, grade: { in: [1, 2, 3, 4] } },
    include: {
      subjects: {
        where: { subject: { name: { in: ['Ingliz tili', 'Kelajak Soati'] } } },
        include: { subject: true, teacher: true }
      }
    },
    orderBy: [{ grade: 'asc' }, { name: 'asc' }]
  });

  console.log('\n=== PRIMARY CLASSES (1-4) INGLIZ TILI & KELAJAK SOATI ===');
  for (const cls of primaryClasses) {
    console.log(`\nSinf: ${cls.name}`);
    for (const s of cls.subjects) {
      console.log(`  Fan: ${s.subject.name} | Guruh: ${s.groupType} | O'qituvchi: ${s.teacher?.fullName} (${s.teacherId}) | Soat: ${s.hoursPerWeek}`);
    }
  }

  // 4. Also check if there's any mention of Iqbol in previous conversation transcripts or scripts!
  const teacher = await prisma.teacher.findUnique({ where: { id: iqbolId } });
  console.log('\nTeacher profile:', teacher);
}

main().catch(console.error).finally(() => prisma.$disconnect());
