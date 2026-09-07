const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyMaster() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const saboId = 't_39_22';
  const baxromId = 't_39_3';

  // Classes
  const cls7A = await prisma.class.findFirst({ where: { schoolId, name: '7-A' } });
  const cls7B = await prisma.class.findFirst({ where: { schoolId, name: '7-B' } });
  const cls8D = await prisma.class.findFirst({ where: { schoolId, name: '8-D' } });
  const cls9A = await prisma.class.findFirst({ where: { schoolId, name: '9-A' } });
  const cls9B = await prisma.class.findFirst({ where: { schoolId, name: '9-B' } });
  const cls9D = await prisma.class.findFirst({ where: { schoolId, name: '9-D' } });
  const cls10A = await prisma.class.findFirst({ where: { schoolId, name: '10-A' } });
  const cls10B = await prisma.class.findFirst({ where: { schoolId, name: '10-B' } });

  // Subjects
  const subjEng = await prisma.subject.findFirst({
    where: { schoolId, name: { contains: 'Ingliz', mode: 'insensitive' } }
  });
  const subjKS = await prisma.subject.findFirst({
    where: { schoolId, name: { contains: 'Kelajak', mode: 'insensitive' } }
  });

  // All other lessons in school (excluding Sabohat's and the 9-A/8-D English that will be updated)
  const allOther = await prisma.lesson.findMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      teacherId: { notIn: [saboId] },
      NOT: [
        { class: { name: '9-A' }, subject: { name: { contains: 'Ingliz' } } }
      ]
    },
    include: { class: true, subject: true, teacher: true }
  });

  // Sabohat Master 25 Lessons:
  const saboLessons = [
    // --- DUSHANBA (5 soat) ---
    { day: 1, period: 1, class: cls7A, subject: subjKS, group: 'WHOLE', note: '7-A Kelajak soati' },
    { day: 1, period: 3, class: cls8D, subject: subjEng, group: 'GROUP_2', note: '8-D Ingliz tili' },
    { day: 1, period: 4, class: cls9B, subject: subjEng, group: 'WHOLE', note: '9-B Ingliz tili' },
    { day: 1, period: 5, class: cls8D, subject: subjEng, group: 'GROUP_2', note: '8-D Ingliz tili' },
    { day: 1, period: 6, class: cls10A, subject: subjEng, group: 'WHOLE', note: '10-A Ingliz tili' },

    // --- SESHANBA (5 soat) ---
    { day: 2, period: 1, class: cls7A, subject: subjEng, group: 'WHOLE', note: '7-A Ingliz tili' },
    { day: 2, period: 2, class: cls7B, subject: subjEng, group: 'WHOLE', note: '7-B Ingliz tili' },
    { day: 2, period: 3, class: cls9B, subject: subjEng, group: 'WHOLE', note: '9-B Ingliz tili' },
    { day: 2, period: 4, class: cls9D, subject: subjEng, group: 'WHOLE', note: '9-D Ingliz tili' },
    { day: 2, period: 5, class: cls10B, subject: subjEng, group: 'WHOLE', note: '10-B Ingliz tili' },

    // --- CHORSHANBA (5 soat) ---
    { day: 3, period: 1, class: cls7A, subject: subjEng, group: 'WHOLE', note: '7-A Ingliz tili' },
    { day: 3, period: 2, class: cls7B, subject: subjEng, group: 'WHOLE', note: '7-B Ingliz tili' },
    { day: 3, period: 3, class: cls9B, subject: subjEng, group: 'WHOLE', note: '9-B Ingliz tili' },
    { day: 3, period: 4, class: cls9A, subject: subjEng, group: 'GROUP_1', note: '9-A Ingliz tili (1-gr)' },
    { day: 3, period: 6, class: cls10A, subject: subjEng, group: 'WHOLE', note: '10-A Ingliz tili' },

    // --- PAYSHANBA (5 soat) ---
    { day: 4, period: 1, class: cls7B, subject: subjEng, group: 'WHOLE', note: '7-B Ingliz tili' },
    { day: 4, period: 2, class: cls7A, subject: subjEng, group: 'WHOLE', note: '7-A Ingliz tili' },
    { day: 4, period: 3, class: cls9D, subject: subjEng, group: 'WHOLE', note: '9-D Ingliz tili' },
    { day: 4, period: 4, class: cls9A, subject: subjEng, group: 'GROUP_1', note: '9-A Ingliz tili (1-gr)' },
    { day: 4, period: 5, class: cls10B, subject: subjEng, group: 'WHOLE', note: '10-B Ingliz tili' },

    // --- JUMA (0 soat) --- Metod kuni

    // --- SHANBA (5 soat) ---
    { day: 6, period: 1, class: cls7A, subject: subjEng, group: 'WHOLE', note: '7-A Ingliz tili' },
    { day: 6, period: 2, class: cls7B, subject: subjEng, group: 'WHOLE', note: '7-B Ingliz tili' },
    { day: 6, period: 3, class: cls9D, subject: subjEng, group: 'WHOLE', note: '9-D Ingliz tili' },
    { day: 6, period: 4, class: cls8D, subject: subjEng, group: 'GROUP_2', note: '8-D Ingliz tili (2-gr)' },
    { day: 6, period: 6, class: cls9A, subject: subjEng, group: 'GROUP_1', note: '9-A Ingliz tili (1-gr)' },
  ];

  console.log(`Sabohat lessons to check: ${saboLessons.length}`);

  let conflicts = 0;
  for (const sl of saboLessons) {
    const classConflicts = allOther.filter(l => 
      l.dayOfWeek === sl.day && 
      l.periodNumber === sl.period && 
      l.classId === sl.class.id
    );

    for (const cc of classConflicts) {
      // If it's a split group of the same subject (e.g. 8-D English Group 1 Baxrom and Group 2 Sabohat at D6 P4)
      if (cc.subjectId === sl.subject.id && cc.groupType === 'GROUP_1' && sl.group === 'GROUP_2') {
        console.log(`[OK - GURUHLI DARS] Kun ${sl.day} P${sl.period}: ${sl.class.name} Ingliz tili - 1-gr: ${cc.teacher?.fullName}, 2-gr: Sabohat`);
      } else {
        conflicts++;
        console.log(`[ZIDDIYAT] Kun ${sl.day} P${sl.period}: ${sl.class.name} - Sabohat (${sl.note}) vs ${cc.subject.name} (${cc.teacher?.fullName}) [${cc.groupType}]`);
      }
    }
  }

  // Also check if Sabohat has any overlapping lessons in her own schedule
  for (let i = 0; i < saboLessons.length; i++) {
    for (let j = i + 1; j < saboLessons.length; j++) {
      if (saboLessons[i].day === saboLessons[j].day && saboLessons[i].period === saboLessons[j].period) {
        conflicts++;
        console.log(`[O'ZARO TO'QNASHUV] Sabohatda Kun ${saboLessons[i].day} P${saboLessons[i].period} da 2 ta dars bor!`);
      }
    }
  }

  // Check Baxrom for 9-A Group 2 at: D3 P4, D4 P4, D6 P6
  const baxromSlots = [
    { day: 3, period: 4, note: '9-A English Group 2' },
    { day: 4, period: 4, note: '9-A English Group 2' },
    { day: 6, period: 6, note: '9-A English Group 2' }
  ];
  for (const bs of baxromSlots) {
    const bConflict = allOther.filter(l => l.teacherId === baxromId && l.dayOfWeek === bs.day && l.periodNumber === bs.period);
    if (bConflict.length > 0) {
      console.log(`[BAXROM BAND] Kun ${bs.day} P${bs.period}: Baxrom ${bConflict.map(l => l.class.name + ' ' + l.subject.name).join(', ')} bilan band!`);
    } else {
      console.log(`[BAXROM BO'SH] Kun ${bs.day} P${bs.period}: Baxrom 100% bo'sh, 9-A 2-guruhga biriktiriladi!`);
    }
  }

  console.log(`\nJAMI ZIDDIYATLAR: ${conflicts} ta!`);
}

verifyMaster().catch(console.error).finally(() => prisma.$disconnect());
