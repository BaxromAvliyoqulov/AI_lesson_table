const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  
  // Check shifts
  const shifts = await prisma.shift.findMany({ where: { schoolId } });
  console.log('Shifts:', shifts);

  // Check how 2-A, 2-B and 4-A, 4-B lessons are recorded
  const l2B = await prisma.lesson.findFirst({
    where: { schoolId, class: { name: '2-B' }, dayOfWeek: 2 },
    include: { class: { include: { shift: true } } }
  });
  console.log('2-B lesson shift:', l2B?.class.name, l2B?.class.shift?.name, 'Period:', l2B?.periodNumber);

  const l4B = await prisma.lesson.findFirst({
    where: { schoolId, class: { name: '4-B' }, dayOfWeek: 2 },
    include: { class: { include: { shift: true } } }
  });
  console.log('4-B lesson shift:', l4B?.class.name, l4B?.class.shift?.name, 'Period:', l4B?.periodNumber);
}

main().catch(console.error).finally(() => prisma.$disconnect());
