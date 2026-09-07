const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHours() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const classes = ['7-A', '7-B', '8-D', '9-A', '9-B', '9-D', '10-A', '10-B'];
  
  const cs = await prisma.classSubject.findMany({
    where: {
      schoolId,
      class: { name: { in: classes } },
      subject: { name: { in: ['Ingliz tili', 'Kelajak Soati'] } }
    },
    include: { class: true, subject: true, teacher: true }
  });

  console.log('=== CLASS SUBJECTS FOR THESE CLASSES ===');
  for (const c of cs) {
    console.log(`${c.class.name} | ${c.subject.name} | ${c.teacher?.fullName} | ${c.groupType} | weeklyHours: ${c.hoursPerWeek}`);
  }
}

checkHours().catch(console.error).finally(() => prisma.$disconnect());
