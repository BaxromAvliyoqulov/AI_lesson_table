const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulate() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const saboId = 't_39_22';
  const baxromId = 't_39_3';

  // Current lessons excluding Sabohat's
  const otherLessons = await prisma.lesson.findMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      teacherId: { not: saboId }
    },
    include: { class: true, subject: true, teacher: true }
  });

  console.log(`Other lessons count: ${otherLessons.length}`);

  // Sinflar ID lari
  const cls7A = await prisma.class.findFirst({ where: { schoolId, name: '7-A' } });
  const cls7B = await prisma.class.findFirst({ where: { schoolId, name: '7-B' } });
  const cls8D = await prisma.class.findFirst({ where: { schoolId, name: '8-D' } });
  const cls9A = await prisma.class.findFirst({ where: { schoolId, name: '9-A' } });
  const cls9B = await prisma.class.findFirst({ where: { schoolId, name: '9-B' } });
  const cls9D = await prisma.class.findFirst({ where: { schoolId, name: '9-D' } });
  const cls10A = await prisma.class.findFirst({ where: { schoolId, name: '10-A' } });
  const cls10B = await prisma.class.findFirst({ where: { schoolId, name: '10-B' } });

  const subjEng = await prisma.subject.findFirst({
    where: { schoolId, name: { contains: 'Ingliz', mode: 'insensitive' } }
  });
  const subjKS = await prisma.subject.findFirst({
    where: { schoolId, name: { contains: 'Kelajak', mode: 'insensitive' } }
  });

  const perfectLessons = [
    // --- DUSHANBA (5 soat) ---
    { day: 1, period: 1, class: cls7A, subject: subjKS, group: 'WHOLE' },
    { day: 1, period: 2, class: cls8D, subject: subjEng, group: 'GROUP_2' },
    { day: 1, period: 3, class: cls8D, subject: subjEng, group: 'GROUP_2' },
    { day: 1, period: 4, class: cls9B, subject: subjEng, group: 'WHOLE' },
    { day: 1, period: 6, class: cls10A, subject: subjEng, group: 'WHOLE' },

    // --- SESHANBA (5 soat) ---
    { day: 2, period: 1, class: cls7A, subject: subjEng, group: 'WHOLE' },
    { day: 2, period: 2, class: cls7B, subject: subjEng, group: 'WHOLE' },
    { day: 2, period: 3, class: cls9B, subject: subjEng, group: 'WHOLE' },
    { day: 2, period: 4, class: cls9D, subject: subjEng, group: 'WHOLE' },
    { day: 2, period: 5, class: cls10B, subject: subjEng, group: 'WHOLE' },

    // --- CHORSHANBA (5 soat) ---
    { day: 3, period: 1, class: cls7A, subject: subjEng, group: 'WHOLE' },
    { day: 3, period: 2, class: cls7B, subject: subjEng, group: 'WHOLE' },
    { day: 3, period: 3, class: cls9B, subject: subjEng, group: 'WHOLE' },
    { day: 3, period: 4, class: cls9A, subject: subjEng, group: 'GROUP_1' },
    { day: 3, period: 6, class: cls10A, subject: subjEng, group: 'WHOLE' },

    // --- PAYSHANBA (5 soat) ---
    { day: 4, period: 1, class: cls7B, subject: subjEng, group: 'WHOLE' },
    { day: 4, period: 2, class: cls7A, subject: subjEng, group: 'WHOLE' },
    { day: 4, period: 3, class: cls9D, subject: subjEng, group: 'WHOLE' },
    { day: 4, period: 4, class: cls9A, subject: subjEng, group: 'GROUP_1' },
    { day: 4, period: 5, class: cls10B, subject: subjEng, group: 'WHOLE' },

    // --- JUMA (0 soat) --- Metod kuni

    // --- SHANBA (5 soat) ---
    { day: 6, period: 1, class: cls7A, subject: subjEng, group: 'WHOLE' },
    { day: 6, period: 2, class: cls7B, subject: subjEng, group: 'WHOLE' },
    { day: 6, period: 3, class: cls9D, subject: subjEng, group: 'WHOLE' },
    { day: 6, period: 4, class: cls9A, subject: subjEng, group: 'GROUP_1' },
    { day: 6, period: 5, class: cls8D, subject: subjEng, group: 'GROUP_2' },
  ];

  console.log('\n=== ZIDDIYATLARNI TEKSHIRISH (COLLISION CHECK) ===');
  let conflictCount = 0;
  for (const pl of perfectLessons) {
    // Check if class already has a lesson at this day and period
    const classConflicts = otherLessons.filter(l => 
      l.dayOfWeek === pl.day && 
      l.periodNumber === pl.period && 
      l.classId === pl.class.id
    );

    if (classConflicts.length > 0) {
      // Is it a split group? E.g., GROUP_1 + GROUP_2 of the same subject?
      const isSplitPair = classConflicts.every(c => 
        c.subjectId === pl.subject.id && 
        ((c.groupType === 'GROUP_1' && pl.group === 'GROUP_2') || (c.groupType === 'GROUP_2' && pl.group === 'GROUP_1'))
      );

      if (!isSplitPair) {
        conflictCount++;
        console.log(`[ZIDDIYAT] Kun ${pl.day}, ${pl.period}-soat: ${pl.class.name} darsida Sabohat (${pl.subject.name} [${pl.group}]) bilan to'qnashuv:`);
        for (const c of classConflicts) {
          console.log(`    Mavjud: ${c.subject.name} (${c.teacher?.fullName}) [${c.groupType}]`);
        }
      }
    }
  }

  if (conflictCount === 0) {
    console.log('✅ HECH QANDAY ZIDDIYAT YO\'Q! Mukammal mos keladi!');
  } else {
    console.log(`⚠️ JAMI ${conflictCount} TA ZIDDIYAT TOPILDI!`);
  }
}

simulate().catch(console.error).finally(() => prisma.$disconnect());
