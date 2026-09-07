const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const classes = await prisma.class.findMany({
    where: { schoolId, grade: { in: [1, 2, 3, 4] } },
    include: { shift: true },
    orderBy: [{ grade: 'asc' }, { name: 'asc' }]
  });

  console.log('=== BOSHLANG\'ICH SINFLAR SMENALARI ===');
  for (const c of classes) {
    console.log(`${c.name}: ${c.shift?.name} (${c.shift?.startTime} - ${c.shift?.endTime})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
