const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applyIqbol15h() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const branchId = 'cmthnj8xm0001uf04vv5qqrq0';

  const iqbolId = 't_39_19';
  const muxriddinId = 't_cmthn422g0001uff8vhccbxmz_1788604150092';
  const tolayevaId = 't_39_52';

  console.log('=== 1. O\'QITUVCHI IQBOL PROFILINI YANGILASH (15 SOAT) ===');
  await prisma.teacher.update({
    where: { id: iqbolId },
    data: {
      weeklyHourCapacity: 15,
      methodDay: 5 // Juma metod kuni
    }
  });
  console.log('Iqbol weeklyHourCapacity = 15 qilib belgilandi.');

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

  console.log('\n=== 2. CLASSSUBJECT LARNI ANIQLASHTIRISH (TARIFIKATSIYA) ===');
  // 1-A: Iqbol (WHOLE)
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls1A.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls1A.id,
      subjectId: subjEng.id,
      teacherId: iqbolId,
      groupType: 'WHOLE',
      weeklyHours: 1
    }
  });

  // 1-B: Iqbol (WHOLE)
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls1B.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls1B.id,
      subjectId: subjEng.id,
      teacherId: iqbolId,
      groupType: 'WHOLE',
      weeklyHours: 1
    }
  });

  // 1-D: Group 1 To'layeva, Group 2 Iqbol
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls1D.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls1D.id,
      subjectId: subjEng.id,
      teacherId: tolayevaId,
      groupType: 'GROUP_1',
      weeklyHours: 1
    }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls1D.id,
      subjectId: subjEng.id,
      teacherId: iqbolId,
      groupType: 'GROUP_2',
      weeklyHours: 1
    }
  });

  // 2-A: Group 1 Iqbol, Group 2 Muxriddin
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls2A.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls2A.id,
      subjectId: subjEng.id,
      teacherId: iqbolId,
      groupType: 'GROUP_1',
      weeklyHours: 2
    }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls2A.id,
      subjectId: subjEng.id,
      teacherId: muxriddinId,
      groupType: 'GROUP_2',
      weeklyHours: 2
    }
  });

  // 2-B: Iqbol (WHOLE)
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls2B.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls2B.id,
      subjectId: subjEng.id,
      teacherId: iqbolId,
      groupType: 'WHOLE',
      weeklyHours: 2
    }
  });

  // 3-A: Group 1 Iqbol, Group 2 Muxriddin
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls3A.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls3A.id,
      subjectId: subjEng.id,
      teacherId: iqbolId,
      groupType: 'GROUP_1',
      weeklyHours: 2
    }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls3A.id,
      subjectId: subjEng.id,
      teacherId: muxriddinId,
      groupType: 'GROUP_2',
      weeklyHours: 2
    }
  });

  // 3-B: Iqbol (WHOLE)
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls3B.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls3B.id,
      subjectId: subjEng.id,
      teacherId: iqbolId,
      groupType: 'WHOLE',
      weeklyHours: 2
    }
  });

  // 4-A: Group 1 Iqbol, Group 2 Muxriddin
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls4A.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls4A.id,
      subjectId: subjEng.id,
      teacherId: iqbolId,
      groupType: 'GROUP_1',
      weeklyHours: 2
    }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls4A.id,
      subjectId: subjEng.id,
      teacherId: muxriddinId,
      groupType: 'GROUP_2',
      weeklyHours: 2
    }
  });

  // 4-B: Iqbol (WHOLE)
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls4B.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls4B.id,
      subjectId: subjEng.id,
      teacherId: iqbolId,
      groupType: 'WHOLE',
      weeklyHours: 2
    }
  });

  console.log('Barcha 9 ta sinf uchun ClassSubject (Tarifikatsiya) yangilandi!');

  console.log('\n=== 3. 2-A SINFIDAGI MATEMATIKA DUBLLIGINI TO\'G\'RILASH ===');
  // 2-A sinfida Seshanba 3-soatdagi 2-matematikani Dushanba 5-soatga ko'chiramiz
  const mat2A = await prisma.lesson.findFirst({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      classId: cls2A.id,
      dayOfWeek: 2,
      periodNumber: 3,
      subject: { name: { contains: 'Matematika' } }
    }
  });
  if (mat2A) {
    await prisma.lesson.update({
      where: { id: mat2A.id },
      data: { dayOfWeek: 1, periodNumber: 5 }
    });
    console.log('2-A Matematika: D2 P3 -> D1 P5 ga muvaffaqiyatli ko\'chirildi!');
  }

  console.log('\n=== 4. IQBOLNING ESKI DARSLARINI TOZALASH VA YANGI 15 SOATNI YOZISH ===');
  // Eski darslarni tozalash
  const delLessons = await prisma.lesson.deleteMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      OR: [
        { teacherId: iqbolId },
        {
          classId: { in: [cls1A.id, cls1B.id, cls1D.id, cls2A.id, cls2B.id, cls3A.id, cls3B.id, cls4A.id, cls4B.id] },
          subjectId: subjEng.id
        }
      ]
    }
  });
  console.log(`Eski Ingliz tili darslari tozalandi: ${delLessons.count} ta`);

  // Yangi 15 soat Iqbol darslari va 6 soat Muxriddin (2-guruh) hamda 1 soat To'layeva (1-guruh)
  const newLessons = [
    // --- DUSHANBA (1 soat) ---
    { day: 1, period: 5, classId: cls1A.id, teacherId: iqbolId, group: 'WHOLE' },

    // --- SESHANBA (6 soat Iqbol) ---
    // 1-smena:
    { day: 2, period: 4, classId: cls4B.id, teacherId: iqbolId, group: 'WHOLE' },
    { day: 2, period: 5, classId: cls4A.id, teacherId: iqbolId, group: 'GROUP_1' },
    { day: 2, period: 5, classId: cls4A.id, teacherId: muxriddinId, group: 'GROUP_2' },
    // 2-smena (Abetdan keyin):
    { day: 2, period: 1, classId: cls2B.id, teacherId: iqbolId, group: 'WHOLE' },
    { day: 2, period: 2, classId: cls3A.id, teacherId: iqbolId, group: 'GROUP_1' },
    { day: 2, period: 2, classId: cls3A.id, teacherId: muxriddinId, group: 'GROUP_2' },
    { day: 2, period: 3, classId: cls2A.id, teacherId: iqbolId, group: 'GROUP_1' },
    { day: 2, period: 3, classId: cls2A.id, teacherId: muxriddinId, group: 'GROUP_2' },
    { day: 2, period: 4, classId: cls3B.id, teacherId: iqbolId, group: 'WHOLE' },

    // --- CHORSHANBA (1 soat) ---
    { day: 3, period: 5, classId: cls1B.id, teacherId: iqbolId, group: 'WHOLE' },

    // --- PAYSHANBA (7 soat Iqbol) ---
    // 1-smena:
    { day: 4, period: 2, classId: cls1D.id, teacherId: tolayevaId, group: 'GROUP_1' },
    { day: 4, period: 2, classId: cls1D.id, teacherId: iqbolId, group: 'GROUP_2' },
    { day: 4, period: 4, classId: cls4B.id, teacherId: iqbolId, group: 'WHOLE' },
    { day: 4, period: 5, classId: cls4A.id, teacherId: iqbolId, group: 'GROUP_1' },
    { day: 4, period: 5, classId: cls4A.id, teacherId: muxriddinId, group: 'GROUP_2' },
    // 2-smena (Abetdan keyin):
    { day: 4, period: 1, classId: cls2B.id, teacherId: iqbolId, group: 'WHOLE' },
    { day: 4, period: 2, classId: cls3A.id, teacherId: iqbolId, group: 'GROUP_1' },
    { day: 4, period: 2, classId: cls3A.id, teacherId: muxriddinId, group: 'GROUP_2' },
    { day: 4, period: 3, classId: cls2A.id, teacherId: iqbolId, group: 'GROUP_1' },
    { day: 4, period: 3, classId: cls2A.id, teacherId: muxriddinId, group: 'GROUP_2' },
    { day: 4, period: 4, classId: cls3B.id, teacherId: iqbolId, group: 'WHOLE' },
  ];

  console.log(`Yaratilayotgan darslar soni: ${newLessons.length} ta`);

  for (const l of newLessons) {
    await prisma.lesson.create({
      data: {
        schoolId,
        scheduleId: activeSchedId,
        branchId,
        classId: l.classId,
        subjectId: subjEng.id,
        teacherId: l.teacherId,
        dayOfWeek: l.day,
        periodNumber: l.period,
        groupType: l.group
      }
    });
  }

  console.log('\n=== TEKSHIRUV: IQBOLNING JADVALI ===');
  const iqbolFinal = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: iqbolId },
    include: { class: { include: { shift: true } }, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });

  const days = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  for (let d = 1; d <= 6; d++) {
    const dl = iqbolFinal.filter(l => l.dayOfWeek === d);
    console.log(`\n${days[d]} (${dl.length} soat):`);
    if (dl.length === 0) console.log('  🟢 Metod kuni / Dam olish kuni');
    for (const l of dl) {
      console.log(`  ${l.periodNumber}-soat (${l.class.shift?.name?.split(' ')[0]}): ${l.class.name} - ${l.subject.name} [${l.groupType}]`);
    }
  }

  console.log(`\nJAMI IQBOL DARSLARI: ${iqbolFinal.length} soat!`);

  console.log('\n=== MUXRIDDIN DARSLARI TEKSHIRUVI ===');
  const muxFinal = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: muxriddinId },
    include: { class: true, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });
  console.log(`Muxriddin darslari soni: ${muxFinal.length} ta`);
  for (const m of muxFinal) {
    console.log(`Kun ${m.dayOfWeek} P${m.periodNumber}: ${m.class.name} [${m.groupType}]`);
  }
}

applyIqbol15h().catch(console.error).finally(() => prisma.$disconnect());
