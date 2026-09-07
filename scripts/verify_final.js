const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';

  // 1. Baxrom
  const baxrom = await prisma.teacher.findUnique({
    where: { id: 't_39_3' }
  });
  const baxromLessons = await prisma.lesson.findMany({
    where: { scheduleId, teacherId: 't_39_3' },
    include: { class: { include: { shift: true } }, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });
  const baxromIngliz = baxromLessons.filter(l => l.subject.name.toLowerCase().includes('ingliz'));
  const baxromKS = baxromLessons.filter(l => !l.subject.name.toLowerCase().includes('ingliz'));

  console.log('=== BAXROM HOLATI ===');
  console.log(`O'qituvchi: ${baxrom.fullName}`);
  console.log(`Haftalik limit (capacity): ${baxrom.weeklyHourCapacity}`);
  console.log(`Jami darslar: ${baxromLessons.length} ta (Ingliz tili: ${baxromIngliz.length}, Kelajak soati: ${baxromKS.length})`);
  
  // Shift and sinflar
  const baxromClasses = [...new Set(baxromLessons.map(l => `${l.class.name} (${l.groupType})`))];
  console.log(`O'tiladigan sinflar:`, baxromClasses);

  // 2. Sabohat
  const sabohat = await prisma.teacher.findFirst({
    where: { fullName: { contains: 'Sabohat', mode: 'insensitive' } }
  });
  const sabohatLessons = sabohat ? await prisma.lesson.findMany({
    where: { scheduleId, teacherId: sabohat.id },
    include: { class: true, subject: true }
  }) : [];
  const sabohatIngliz = sabohatLessons.filter(l => l.subject.name.toLowerCase().includes('ingliz'));
  const sabohatKS = sabohatLessons.filter(l => !l.subject.name.toLowerCase().includes('ingliz'));
  console.log('\n=== SABOHAT HOLATI ===');
  console.log(`O'qituvchi: ${sabohat.fullName}`);
  console.log(`Haftalik limit: ${sabohat.weeklyHourCapacity}`);
  console.log(`Jami darslar: ${sabohatLessons.length} ta (Ingliz tili: ${sabohatIngliz.length}, Kelajak soati: ${sabohatKS.length})`);

  // 3. 9-A sinfida ingliz tili
  const nineA = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '9-A' }, subject: { name: { contains: 'Ingliz' } } },
    include: { teacher: true }
  });
  console.log('\n=== 9-A INGLIZ TILI DARSLARI ===');
  nineA.forEach(l => {
    console.log(`Kun: ${l.dayOfWeek}, Para: ${l.periodNumber}, O'qituvchi: ${l.teacher?.fullName}, Guruh: ${l.groupType}`);
  });

  // 4. 8-D sinfida ingliz tili
  const eightD = await prisma.lesson.findMany({
    where: { scheduleId, class: { name: '8-D' }, subject: { name: { contains: 'Ingliz' } } },
    include: { teacher: true }
  });
  console.log('\n=== 8-D INGLIZ TILI DARSLARI ===');
  eightD.forEach(l => {
    console.log(`Kun: ${l.dayOfWeek}, Para: ${l.periodNumber}, O'qituvchi: ${l.teacher?.fullName}, Guruh: ${l.groupType}`);
  });

  // 5. Baxrom to'qnashuv tekshiruvi (shift bo'yicha)
  const days = ['DUSHANBA', 'SESHANBA', 'CHORSHANBA', 'PAYSHANBA', 'JUMA', 'SHANBA'];
  let conflicts = 0;
  for (const day of days) {
    const dayLessons = baxromLessons.filter(l => l.dayOfWeek === day);
    const slots = {};
    for (const l of dayLessons) {
      const shift = l.class.shift || 1;
      const key = `Smena${shift}_Para${l.periodNumber}`;
      if (!slots[key]) slots[key] = [];
      slots[key].push(l);
    }
    for (const [slot, list] of Object.entries(slots)) {
      if (list.length > 1) {
        console.error(`❌ To'qnashuv: ${day} ${slot}:`, list.map(x => x.class.name));
        conflicts++;
      }
    }
  }
  if (conflicts === 0) {
    console.log('\n✅ BAXROMDA 0 TA TO\'QNASHUV! Hammasi ideal!');
  }

  const dayNames = {
    1: 'Dushanba',
    2: 'Seshanba',
    3: 'Chorshanba',
    4: 'Payshanba',
    5: 'Juma',
    6: 'Shanba'
  };

  console.log('\n====================================================');
  console.log('  AVLIYOQULOV BAXROMNING JADVALI (KUNLAR KESIMIDA)');
  console.log('====================================================');

  for (let day = 1; day <= 6; day++) {
    const dLessons = baxromLessons.filter(l => l.dayOfWeek === day);
    console.log(`\n📅 ${dayNames[day]} (${dLessons.length} ta dars):`);
    if (dLessons.length === 0) {
      console.log('   🟢 METOD KUNI (dars yo\'q)');
      continue;
    }
    dLessons.sort((a, b) => {
      const shiftA = a.class.shift || 1;
      const shiftB = b.class.shift || 1;
      if (shiftA !== shiftB) return shiftA - shiftB;
      return a.periodNumber - b.periodNumber;
    });

    for (const l of dLessons) {
      const shiftStr = l.class.shift ? l.class.shift.name : 'Noma\'lum smena';
      console.log(`   • ${l.periodNumber}-para [${shiftStr}]: ${l.class.name} - ${l.subject.name} (${l.groupType})`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
