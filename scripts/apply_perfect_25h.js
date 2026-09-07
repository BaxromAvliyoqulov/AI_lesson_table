const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyPerfect25h() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const branchId = 'cmthnj8xm0001uf04vv5qqrq0';
  const saboId = 't_39_22';
  const baxromId = 't_39_3';

  console.log('=== 1. 9-A 2-GURUHNI BAXROMGA BIRIKTIRISH ===');
  // 9-A English Group 2 lessons must belong to Baxrom
  const res9A = await prisma.lesson.updateMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      class: { name: '9-A' },
      subject: { name: { contains: 'Ingliz' } },
      groupType: 'GROUP_2'
    },
    data: {
      teacherId: baxromId
    }
  });
  console.log(`9-A Group 2 updated to Baxrom: ${res9A.count} lessons`);

  // Also update 9-A Group 2 ClassSubject
  await prisma.classSubject.updateMany({
    where: {
      schoolId,
      class: { name: '9-A' },
      subject: { name: { contains: 'Ingliz' } },
      groupType: 'GROUP_2'
    },
    data: {
      teacherId: baxromId
    }
  });

  // Also ensure 8-D English Group 1 is marked GROUP_1 for Baxrom
  await prisma.lesson.updateMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      class: { name: '8-D' },
      subject: { name: { contains: 'Ingliz' } },
      teacherId: baxromId,
      groupType: 'WHOLE'
    },
    data: {
      groupType: 'GROUP_1'
    }
  });

  console.log('\n=== 2. SABOHATNING DARSLARINI 24+1=25 SOAT QILIB O\'RNATISH ===');

  // Sinflar ID lari
  const cls7A = await prisma.class.findFirst({ where: { schoolId, name: '7-A' } });
  const cls7B = await prisma.class.findFirst({ where: { schoolId, name: '7-B' } });
  const cls8D = await prisma.class.findFirst({ where: { schoolId, name: '8-D' } });
  const cls9A = await prisma.class.findFirst({ where: { schoolId, name: '9-A' } });
  const cls9B = await prisma.class.findFirst({ where: { schoolId, name: '9-B' } });
  const cls9D = await prisma.class.findFirst({ where: { schoolId, name: '9-D' } });
  const cls10A = await prisma.class.findFirst({ where: { schoolId, name: '10-A' } });
  const cls10B = await prisma.class.findFirst({ where: { schoolId, name: '10-B' } });

  // Fanlar ID lari
  const subjEng = await prisma.subject.findFirst({
    where: { schoolId, name: { contains: 'Ingliz', mode: 'insensitive' } }
  });
  const subjKS = await prisma.subject.findFirst({
    where: { schoolId, name: { contains: 'Kelajak', mode: 'insensitive' } }
  });

  // Sabohatning hozirgi barcha darslarini o'chirib, mukammal 25 soatni toza qilib yozamiz
  const deletedOld = await prisma.lesson.deleteMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      teacherId: saboId
    }
  });
  console.log(`Eski Sabohat darslari tozalandi: ${deletedOld.count}`);

  // Mukammal 25 soat darslar ro'yxati (24 soat Ingliz tili + 1 soat Kelajak soati):
  // Har kuni 5 soatdan (Juma Metod kuni = 0):
  const perfectLessons = [
    // --- DUSHANBA (5 soat) ---
    { day: 1, period: 1, classId: cls7A.id, subjectId: subjKS.id, group: 'WHOLE' },   // 7-A Kelajak soati
    { day: 1, period: 3, classId: cls8D.id, subjectId: subjEng.id, group: 'GROUP_2' }, // 8-D Ingliz tili
    { day: 1, period: 4, classId: cls9B.id, subjectId: subjEng.id, group: 'WHOLE' },   // 9-B Ingliz tili
    { day: 1, period: 5, classId: cls8D.id, subjectId: subjEng.id, group: 'GROUP_2' }, // 8-D Ingliz tili
    { day: 1, period: 6, classId: cls10A.id, subjectId: subjEng.id, group: 'WHOLE' },  // 10-A Ingliz tili

    // --- SESHANBA (5 soat) ---
    { day: 2, period: 1, classId: cls7A.id, subjectId: subjEng.id, group: 'WHOLE' },   // 7-A Ingliz tili
    { day: 2, period: 2, classId: cls7B.id, subjectId: subjEng.id, group: 'WHOLE' },   // 7-B Ingliz tili
    { day: 2, period: 3, classId: cls9B.id, subjectId: subjEng.id, group: 'WHOLE' },   // 9-B Ingliz tili
    { day: 2, period: 4, classId: cls9D.id, subjectId: subjEng.id, group: 'WHOLE' },   // 9-D Ingliz tili
    { day: 2, period: 5, classId: cls10B.id, subjectId: subjEng.id, group: 'WHOLE' },  // 10-B Ingliz tili

    // --- CHORSHANBA (5 soat) ---
    { day: 3, period: 1, classId: cls7A.id, subjectId: subjEng.id, group: 'WHOLE' },   // 7-A Ingliz tili
    { day: 3, period: 2, classId: cls7B.id, subjectId: subjEng.id, group: 'WHOLE' },   // 7-B Ingliz tili
    { day: 3, period: 3, classId: cls9B.id, subjectId: subjEng.id, group: 'WHOLE' },   // 9-B Ingliz tili
    { day: 3, period: 4, classId: cls9A.id, subjectId: subjEng.id, group: 'GROUP_1' }, // 9-A Ingliz tili (1-gr)
    { day: 3, period: 6, classId: cls10A.id, subjectId: subjEng.id, group: 'WHOLE' },  // 10-A Ingliz tili

    // --- PAYSHANBA (5 soat) ---
    { day: 4, period: 1, classId: cls7B.id, subjectId: subjEng.id, group: 'WHOLE' },   // 7-B Ingliz tili
    { day: 4, period: 2, classId: cls7A.id, subjectId: subjEng.id, group: 'WHOLE' },   // 7-A Ingliz tili
    { day: 4, period: 3, classId: cls9D.id, subjectId: subjEng.id, group: 'WHOLE' },   // 9-D Ingliz tili
    { day: 4, period: 4, classId: cls9A.id, subjectId: subjEng.id, group: 'GROUP_1' }, // 9-A Ingliz tili (1-gr)
    { day: 4, period: 5, classId: cls10B.id, subjectId: subjEng.id, group: 'WHOLE' },  // 10-B Ingliz tili

    // --- JUMA (0 soat) --- Metod kuni

    // --- SHANBA (5 soat) ---
    { day: 6, period: 1, classId: cls7A.id, subjectId: subjEng.id, group: 'WHOLE' },   // 7-A Ingliz tili
    { day: 6, period: 2, classId: cls7B.id, subjectId: subjEng.id, group: 'WHOLE' },   // 7-B Ingliz tili
    { day: 6, period: 3, classId: cls9D.id, subjectId: subjEng.id, group: 'WHOLE' },   // 9-D Ingliz tili
    { day: 6, period: 4, classId: cls9A.id, subjectId: subjEng.id, group: 'GROUP_1' }, // 9-A Ingliz tili (1-gr)
    { day: 6, period: 5, classId: cls8D.id, subjectId: subjEng.id, group: 'GROUP_2' }, // 8-D Ingliz tili (2-gr)
  ];

  console.log(`Yaratilayotgan darslar soni: ${perfectLessons.length} ta`);

  for (const pl of perfectLessons) {
    await prisma.lesson.create({
      data: {
        schoolId,
        scheduleId: activeSchedId,
        branchId: branchId,
        classId: pl.classId,
        subjectId: pl.subjectId,
        teacherId: saboId,
        dayOfWeek: pl.day,
        periodNumber: pl.period,
        groupType: pl.group
      }
    });
  }

  // Make sure Sabohat's method day is set to Friday (5)
  await prisma.teacher.update({
    where: { id: saboId },
    data: { methodDay: 5 }
  });

  console.log('\n=== TEKSHIRUV: SABOHATNING JADVALI ===');
  const saboFinal = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: saboId },
    include: { class: true, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });

  const days = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  for (let d = 1; d <= 6; d++) {
    const dl = saboFinal.filter(l => l.dayOfWeek === d);
    console.log(`\n${days[d]} (${dl.length} soat):`);
    if (dl.length === 0) console.log('  🟢 Metod kuni (dars yo\'q)');
    for (const l of dl) {
      console.log(`  ${l.periodNumber}-soat: ${l.class.name} - ${l.subject.name} [${l.groupType}]`);
    }
  }

  console.log(`\nJAMI DARSLAR: ${saboFinal.length} soat! (24 soat Ingliz tili + 1 soat Kelajak soati)`);
}

applyPerfect25h().catch(console.error).finally(() => prisma.$disconnect());
