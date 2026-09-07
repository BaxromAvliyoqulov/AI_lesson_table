const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';
  const schoolId = 'cmthn422g0001uff8vhccbxmz';

  const [lessons, classes, subjects, teachers] = await Promise.all([
    prisma.lesson.findMany({ where: { scheduleId }, include: { class: true, subject: true, teacher: true } }),
    prisma.class.findMany({ where: { schoolId } }),
    prisma.subject.findMany({ where: { schoolId } }),
    prisma.teacher.findMany({ where: { schoolId } })
  ]);

  const classDaySubjectMap = new Map();
  for (const l of lessons) {
    if (!l.classId || !l.subjectId || !l.dayOfWeek) continue;
    const key = `${l.class.name}_${l.dayOfWeek}_${l.subject.name}`;
    const existing = classDaySubjectMap.get(key) || [];
    existing.push(l);
    classDaySubjectMap.set(key, existing);
  }

  console.log('=== DUPLICATE SUBJECTS DETAILS ===');
  for (const [key, list] of classDaySubjectMap.entries()) {
    const periods = list.map(l => l.periodNumber).sort((a,b)=>a-b);
    if (periods.length > 1) {
      const cls = list[0].class;
      const sub = list[0].subject;
      const isPrimary = (cls.grade || 5) <= 4;
      const allowsDouble = !isPrimary && sub.allowDoubleLesson;
      const isConsecutive = periods.length === 2 && periods[1] - periods[0] === 1;

      if (isPrimary || !allowsDouble || !isConsecutive) {
        console.log(`\nSinf: ${cls.name}, Fan: ${sub.name}, Kun: ${list[0].dayOfWeek}, Paralar: [${periods.join(', ')}]`);
        console.log(`  O'qituvchi: ${list[0].teacher?.fullName}`);
        console.log(`  allowDoubleLesson: ${sub.allowDoubleLesson}, isPrimary: ${isPrimary}`);
        
        // Show whole week of this class to see which day doesn't have this subject
        const classLessons = lessons.filter(l => l.classId === cls.id);
        const dayCounts = {};
        for (let d = 1; d <= 6; d++) {
          const dl = classLessons.filter(l => l.dayOfWeek === d);
          const subInDay = dl.filter(l => l.subjectId === sub.id);
          dayCounts[d] = { total: dl.length, hasSub: subInDay.length, maxP: Math.max(0, ...dl.map(x => x.periodNumber)) };
        }
        console.log('  Haftalik kunlar:', JSON.stringify(dayCounts));
      }
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
