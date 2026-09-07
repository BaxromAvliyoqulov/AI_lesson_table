const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  const muxriddin = await prisma.teacher.findFirst({
    where: { schoolId, fullName: { contains: 'Muxriddin', mode: 'insensitive' } }
  });
  console.log('Muxriddin:', muxriddin?.fullName, muxriddin?.id);

  const lessons = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: muxriddin.id }
  });
  console.log('Muxriddin current lessons in active schedule:', lessons.length);

  // ClassSubjects for Muxriddin
  const cs = await prisma.classSubject.findMany({
    where: { schoolId, teacherId: muxriddin.id },
    include: { class: true }
  });
  console.log('Muxriddin ClassSubjects:');
  for (const c of cs) {
    console.log(`  ${c.class.name} [${c.groupType}]`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
