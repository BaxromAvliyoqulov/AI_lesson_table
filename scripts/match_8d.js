const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  // Current Sabohat lessons without 9-A Group 2
  const saboL = await prisma.lesson.findMany({
    where: {
      schoolId,
      teacherId: 't_39_22',
      scheduleId: activeSchedId,
      NOT: {
        AND: [
          { class: { name: '9-A' } },
          { groupType: 'GROUP_2' }
        ]
      }
    },
    include: { class: true, subject: true }
  });
  console.log('Sabohat base lessons count (without 9-A Gr 2):', saboL.length);

  // 8-D lessons
  const l8D = await prisma.lesson.findMany({
    where: { schoolId, class: { name: '8-D' }, scheduleId: activeSchedId },
    include: { subject: true, teacher: true }
  });

  console.log('\n=== SABOHAT VA 8-D UCHUN BO\'SH VA QULAY SOATLAR ===');
  for (let d = 1; d <= 6; d++) {
    if (d === 5) continue; // Metod kuni
    console.log(`\nKun ${d}:`);
    for (let p = 1; p <= 6; p++) {
      const sBusy = saboL.find(l => l.dayOfWeek === d && l.periodNumber === p);
      const cBusy = l8D.find(l => l.dayOfWeek === d && l.periodNumber === p);
      const sText = sBusy ? `Sabohat: ${sBusy.class.name}(${sBusy.subject.name})` : 'Sabohat: BO\'SH';
      const cText = cBusy ? `8-D: ${cBusy.subject.name}(${cBusy.teacher?.shortName || cBusy.teacher?.fullName})` : '8-D: BO\'SH';
      const bothFree = !sBusy && !cBusy;
      console.log(`  Soat ${p} | ${sText.padEnd(35)} | ${cText.padEnd(35)} ${bothFree ? '===> IKKALASI BO\'SH! <===' : ''}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
