const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';

  const saboL = await prisma.lesson.findMany({
    where: { schoolId, teacherId: 't_39_22', scheduleId: activeSchedId }
  });

  const cls8D = await prisma.class.findFirst({ where: { schoolId, name: '8-D' } });
  const l8D = await prisma.lesson.findMany({
    where: { schoolId, classId: cls8D.id, scheduleId: activeSchedId }
  });

  console.log('=== SABOHAT VA 8-D NING BIRGALIKDA BO\'SH SOATLARI ===');
  for (let d = 1; d <= 6; d++) {
    if (d === 5) continue; // Metod kuni
    console.log(`\nKun ${d}:`);
    for (let p = 1; p <= 6; p++) {
      const sBusy = saboL.some(l => l.dayOfWeek === d && l.periodNumber === p);
      const cBusy = l8D.some(l => l.dayOfWeek === d && l.periodNumber === p);
      if (!sBusy && !cBusy) {
        console.log(`  Soat ${p}: Sabohat ham BO'SH, 8-D ham BO'SH! ===> MOS TUSHADI!`);
      }
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
