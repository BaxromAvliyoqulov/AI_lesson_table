const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function simulate() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const iqbolId = 't_39_19';
  const muxriddinId = 't_cmthn422g0001uff8vhccbxmz_1788604150092';
  const tolayevaId = 't_39_52';

  // Classes
  const cls1A = await prisma.class.findFirst({ where: { schoolId, name: '1-A' } });
  const cls1B = await prisma.class.findFirst({ where: { schoolId, name: '1-B' } });
  const cls1D = await prisma.class.findFirst({ where: { schoolId, name: '1-D' } });
  const cls2A = await prisma.class.findFirst({ where: { schoolId, name: '2-A' } });
  const cls2B = await prisma.class.findFirst({ where: { schoolId, name: '2-B' } });
  const cls3A = await prisma.class.findFirst({ where: { schoolId, name: '3-A' } });
  const cls3B = await prisma.class.findFirst({ where: { schoolId, name: '3-B' } });
  const cls4A = await prisma.class.findFirst({ where: { schoolId, name: '4-A' } });
  const cls4B = await prisma.class.findFirst({ where: { schoolId, name: '4-B' } });

  const subjEng = await prisma.subject.findFirst({
    where: { schoolId, name: { contains: 'Ingliz', mode: 'insensitive' } }
  });

  // Check all existing non-English lessons in these classes
  const nonEngLessons = await prisma.lesson.findMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      class: { name: { in: ['1-A', '1-B', '1-D', '2-A', '2-B', '3-A', '3-B', '4-A', '4-B'] } },
      subject: { name: { not: { contains: 'Ingliz' } } }
    },
    include: { class: true, subject: true, teacher: true }
  });

  // Iqbol proposed 15 lessons:
  const proposedIqbol = [
    // --- DUSHANBA (1 soat) ---
    { day: 1, period: 5, class: cls1A, group: 'WHOLE', shift: 1, note: '1-A Ingliz tili' },

    // --- SESHANBA (6 soat) ---
    // 1-smena:
    { day: 2, period: 4, class: cls4B, group: 'WHOLE', shift: 1, note: '4-B Ingliz tili' },
    { day: 2, period: 5, class: cls4A, group: 'GROUP_1', shift: 1, note: '4-A Ingliz tili (1-gr)' },
    // 2-smena:
    { day: 2, period: 1, class: cls2B, group: 'WHOLE', shift: 2, note: '2-B Ingliz tili' },
    { day: 2, period: 2, class: cls3A, group: 'GROUP_1', shift: 2, note: '3-A Ingliz tili (1-gr)' },
    { day: 2, period: 3, class: cls2A, group: 'GROUP_1', shift: 2, note: '2-A Ingliz tili (1-gr)' },
    { day: 2, period: 4, class: cls3B, group: 'WHOLE', shift: 2, note: '3-B Ingliz tili' },

    // --- CHORSHANBA (1 soat) ---
    { day: 3, period: 5, class: cls1B, group: 'WHOLE', shift: 1, note: '1-B Ingliz tili' },

    // --- PAYSHANBA (7 soat) ---
    // 1-smena:
    { day: 4, period: 2, class: cls1D, group: 'GROUP_2', shift: 1, note: '1-D Ingliz tili (2-gr)' },
    { day: 4, period: 4, class: cls4B, group: 'WHOLE', shift: 1, note: '4-B Ingliz tili' },
    { day: 4, period: 5, class: cls4A, group: 'GROUP_1', shift: 1, note: '4-A Ingliz tili (1-gr)' },
    // 2-smena:
    { day: 4, period: 1, class: cls2B, group: 'WHOLE', shift: 2, note: '2-B Ingliz tili' },
    { day: 4, period: 2, class: cls3A, group: 'GROUP_1', shift: 2, note: '3-A Ingliz tili (1-gr)' },
    { day: 4, period: 3, class: cls2A, group: 'GROUP_1', shift: 2, note: '2-A Ingliz tili (1-gr)' },
    { day: 4, period: 4, class: cls3B, group: 'WHOLE', shift: 2, note: '3-B Ingliz tili' },
  ];

  console.log(`Proposed Iqbol lessons count: ${proposedIqbol.length}`);

  let conflicts = 0;
  // 1. Check each class for conflicts
  for (const pl of proposedIqbol) {
    const classConflicts = nonEngLessons.filter(l => 
      l.dayOfWeek === pl.day && 
      l.periodNumber === pl.period && 
      l.classId === pl.class.id
    );

    if (classConflicts.length > 0) {
      conflicts++;
      console.log(`[SINF TO'QNASHUVI] Kun ${pl.day} P${pl.period}: ${pl.class.name} darsida ${classConflicts.map(c => c.subject.name).join(', ')} bor!`);
    }
  }

  // 2. Check Iqbol herself for conflicts within same shift
  for (let i = 0; i < proposedIqbol.length; i++) {
    for (let j = i + 1; j < proposedIqbol.length; j++) {
      const a = proposedIqbol[i];
      const b = proposedIqbol[j];
      if (a.day === b.day && a.period === b.period && a.shift === b.shift) {
        conflicts++;
        console.log(`[IQBOL O'ZARO TO'QNASHUV] Kun ${a.day} P${a.period} (${a.shift}-smena): ${a.note} vs ${b.note}`);
      }
    }
  }

  if (conflicts === 0) {
    console.log('✅ HECH QANDAY TO\'QNASHUV YO\'Q! 100% MUKAMMAL MOS KELDI!');
  } else {
    console.log(`⚠️ JAMI ${conflicts} TA TO'QNASHUV TOPILDI!`);
  }
}

simulate().catch(console.error).finally(() => prisma.$disconnect());
