const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixBaxrom() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const activeSchedId = 'cmthnjupw00g6uf04uuqrp5w1';
  const baxromId = 't_39_3';

  console.log('=== 1. 5-A VA 8-A NI BUTUN SINF (WHOLE) QILISH VA 2-GURUHLARINI O\'CHIRISH ===');

  const cls5A = await prisma.class.findFirst({ where: { schoolId, name: '5-A' } });
  const cls8A = await prisma.class.findFirst({ where: { schoolId, name: '8-A' } });
  const cls9A = await prisma.class.findFirst({ where: { schoolId, name: '9-A' } });

  const subjEng = await prisma.subject.findFirst({
    where: { schoolId, name: { contains: 'Ingliz', mode: 'insensitive' } }
  });

  // 1a. 5-A ClassSubject
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls5A.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls5A.id,
      subjectId: subjEng.id,
      teacherId: baxromId,
      groupType: 'WHOLE',
      weeklyHours: 4
    }
  });
  console.log('5-A ClassSubject: WHOLE (4 soat) qilindi.');

  // 1b. 8-A ClassSubject
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls8A.id, subjectId: subjEng.id }
  });
  await prisma.classSubject.create({
    data: {
      schoolId,
      classId: cls8A.id,
      subjectId: subjEng.id,
      teacherId: baxromId,
      groupType: 'WHOLE',
      weeklyHours: 3
    }
  });
  console.log('8-A ClassSubject: WHOLE (3 soat) qilindi.');

  // 1c. 9-A ClassSubject from Baxrom
  await prisma.classSubject.deleteMany({
    where: { schoolId, classId: cls9A.id, subjectId: subjEng.id, teacherId: baxromId }
  });
  console.log('9-A ClassSubject: Baxromdan olib tashlandi (Sabohat o\'tadi).');

  console.log('\n=== 2. JADVALDAN (LESSON) DUBLIKATLAR VA 9-A NI O\'CHIRISH ===');
  // Delete all GROUP_2 of 5-A for Baxrom
  const del5A = await prisma.lesson.deleteMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      classId: cls5A.id,
      subjectId: subjEng.id,
      groupType: 'GROUP_2'
    }
  });
  console.log(`5-A GROUP_2 o'chirildi: ${del5A.count} ta`);

  // Update remaining 5-A English lessons to WHOLE
  await prisma.lesson.updateMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      classId: cls5A.id,
      subjectId: subjEng.id
    },
    data: { groupType: 'WHOLE' }
  });

  // Delete all GROUP_2 of 8-A for Baxrom
  const del8A = await prisma.lesson.deleteMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      classId: cls8A.id,
      subjectId: subjEng.id,
      groupType: 'GROUP_2'
    }
  });
  console.log(`8-A GROUP_2 o'chirildi: ${del8A.count} ta`);

  // Update remaining 8-A English lessons to WHOLE
  await prisma.lesson.updateMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      classId: cls8A.id,
      subjectId: subjEng.id
    },
    data: { groupType: 'WHOLE' }
  });

  // Delete 9-A lessons assigned to Baxrom
  const del9A = await prisma.lesson.deleteMany({
    where: {
      schoolId,
      scheduleId: activeSchedId,
      classId: cls9A.id,
      teacherId: baxromId
    }
  });
  console.log(`9-A Baxrom nomidagi darslar o'chirildi: ${del9A.count} ta`);

  console.log('\n=== 3. BAXROMNING HAFTALIK YUKLAMASINI (CAPACITY) 21 SOAT QILISH ===');
  await prisma.teacher.update({
    where: { id: baxromId },
    data: { weeklyHourCapacity: 21 }
  });

  console.log('\n=== 4. TEKSHIRUV: BAXROMNING YAKUNIY JADVALI ===');
  const finalLessons = await prisma.lesson.findMany({
    where: { schoolId, scheduleId: activeSchedId, teacherId: baxromId },
    include: { class: { include: { shift: true } }, subject: true },
    orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }]
  });

  console.log(`Jami darslar soni: ${finalLessons.length} ta (21 soat fan + 1 soat Kelajak soati)`);

  const days = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  for (let d = 1; d <= 6; d++) {
    const dl = finalLessons.filter(l => l.dayOfWeek === d);
    console.log(`\n${days[d]} (${dl.length} ta dars):`);
    if (dl.length === 0) console.log('  🟢 Metod kuni');
    for (const l of dl) {
      console.log(`  P${l.periodNumber} [${l.class.shift?.name?.split(' ')[0]}]: ${l.class.name} ${l.subject.name} [${l.groupType}]`);
    }
  }

  // Check if any duplicates or overlaps remain
  console.log('\n=== TO\'QNASHUVLARNI TEKSHIRISH ===');
  let conflict = 0;
  for (let i = 0; i < finalLessons.length; i++) {
    for (let j = i + 1; j < finalLessons.length; j++) {
      const a = finalLessons[i];
      const b = finalLessons[j];
      const aShift = a.class.shift?.name?.split(' ')[0];
      const bShift = b.class.shift?.name?.split(' ')[0];
      if (a.dayOfWeek === b.dayOfWeek && a.periodNumber === b.periodNumber && aShift === bShift) {
        conflict++;
        console.log(`⚠️ TO'QNASHUV: Kun ${a.dayOfWeek} P${a.periodNumber} [${aShift}]: ${a.class.name} vs ${b.class.name}`);
      }
    }
  }
  if (conflict === 0) {
    console.log('✅ HECH QANDAY TO\'QNASHUV YO\'Q! Jadval 100% toza!');
  }
}

fixBaxrom().catch(console.error).finally(() => prisma.$disconnect());
