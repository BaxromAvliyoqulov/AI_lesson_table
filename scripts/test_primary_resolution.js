const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrimaryResolution() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';
  const schoolId = 'cmthn422g0001uff8vhccbxmz';

  const [lessons, classes, subjects, teachers, shifts] = await Promise.all([
    prisma.lesson.findMany({ where: { scheduleId }, include: { class: true, subject: true, teacher: true } }),
    prisma.class.findMany({ where: { schoolId }, include: { shift: true } }),
    prisma.subject.findMany({ where: { schoolId } }),
    prisma.teacher.findMany({ where: { schoolId }, include: { subjects: { include: { subject: true } } } }),
    prisma.shift.findMany({ where: { schoolId } })
  ]);

  let testLessons = JSON.parse(JSON.stringify(lessons));

  const primary = ['1-A', '1-B', '1-D', '2-A', '2-B', '2-D', '3-A', '3-B', '3-D', '4-A', '4-B', '4-D'];

  console.log('--- Testing primary swaps ---');

  for (const cName of primary) {
    const cls = classes.find(c => c.name === cName);
    const cLessons = testLessons.filter(l => l.classId === cls.id);
    const mathLessons = cLessons.filter(l => l.subject.name.toLowerCase().includes('matematika'));
    
    // Find the day with 2 math lessons
    const dayCounts = {};
    mathLessons.forEach(l => {
      dayCounts[l.dayOfWeek] = (dayCounts[l.dayOfWeek] || 0) + 1;
    });
    const dupDay = Object.keys(dayCounts).find(d => dayCounts[d] > 1);
    if (!dupDay) continue;

    // Pick the duplicate lesson (the second one)
    const dupLessons = mathLessons.filter(l => l.dayOfWeek === Number(dupDay)).sort((a,b)=>b.periodNumber - a.periodNumber);
    const lessonToMove = dupLessons[0]; // e.g. P5

    // Wednesday is day 3
    const wedLessons = cLessons.filter(l => l.dayOfWeek === 3);
    const maxWedP = Math.max(0, ...wedLessons.map(l => l.periodNumber));

    if (maxWedP < 5) {
      // Slot 5 is free on Wednesday!
      lessonToMove.dayOfWeek = 3;
      lessonToMove.periodNumber = maxWedP + 1;
      console.log(`✅ ${cName}: Moved Math from Day ${dupDay} P${dupLessons[0].periodNumber} to Day 3 P${lessonToMove.periodNumber} (Free slot)`);
    } else {
      // Find a non-math single-hour subject on Wednesday that can swap with dupDay P5
      // Check which subject on Wednesday is safe to swap
      const candidates = wedLessons.filter(l => !l.subject.name.toLowerCase().includes('matematika') && !l.subject.name.toLowerCase().includes('kelajak'));
      // Prefer P5
      const targetWedLesson = candidates.find(l => l.periodNumber === 5) || candidates[candidates.length - 1];
      
      const origDay = lessonToMove.dayOfWeek;
      const origP = lessonToMove.periodNumber;

      lessonToMove.dayOfWeek = 3;
      lessonToMove.periodNumber = targetWedLesson.periodNumber;

      targetWedLesson.dayOfWeek = Number(origDay);
      targetWedLesson.periodNumber = origP;

      console.log(`✅ ${cName}: Swapped Math (Day ${origDay} P${origP}) with ${targetWedLesson.subject.name} (Day 3 P${lessonToMove.periodNumber})`);
    }
  }

  let primaryDups = 0;
  for (const cName of primary) {
    const cls = classes.find(c => c.name === cName);
    for (let d = 1; d <= 6; d++) {
      const ml = testLessons.filter(l => l.classId === cls.id && l.dayOfWeek === d && l.subject.name.toLowerCase().includes('matematika'));
      if (ml.length > 1) primaryDups++;
    }
  }
  console.log('\n✅ Primary Math Duplicates after fix:', primaryDups);

  await prisma.$disconnect();
}

testPrimaryResolution().catch(console.error);
