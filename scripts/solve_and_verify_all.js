const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const WEEKDAY_NAMES = ["", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

function isClassSecondShift(cls, shifts) {
  if (!cls) return false;
  if (cls.shift && typeof cls.shift === 'object') {
    const name = cls.shift.name || '';
    return name.includes('2') || name.toLowerCase().includes('ikkinchi') || name.toLowerCase().includes('tush');
  }
  if (cls.shiftId && shifts) {
    const s = shifts.find(x => x.id === cls.shiftId);
    if (s) {
      return s.name.includes('2') || s.name.toLowerCase().includes('ikkinchi') || s.name.toLowerCase().includes('tush');
    }
  }
  return false;
}

const SUBJECT_METHOD_DAYS = {
  "ona tili": 2, "adabiyot": 2, "matematika": 3, "algebra": 3, "geometriya": 3, "informatika": 3, "fizika": 3,
  "astronomiya": 3, "tarix": 4, "huquq": 4, "tarbiya": 4, "iqtisod": 4, "ingliz tili": 5, "nemis tili": 5,
  "fransuz tili": 5, "rus tili": 5, "kimyo": 6, "biologiya": 6, "geografiya": 6, "tabiiy fan": 6,
  "tasviriy san'at": 1, "chizmachilik": 1, "musiqa": 1, "texnologiya": 1, "jismoniy tarbiya": 1, "chaq": 1,
};

function getEffectiveTeacherMethodDay(teacher, subjects) {
  if (teacher.methodDay !== undefined && teacher.methodDay !== null && teacher.methodDay >= 1 && teacher.methodDay <= 6) {
    return { day: teacher.methodDay };
  }
  const tSubjects = teacher.subjects ? teacher.subjects.map(ts => ts.subject) : [];
  for (const s of tSubjects) {
    if (!s || !s.name) continue;
    const sName = s.name.toLowerCase();
    for (const [subKey, d] of Object.entries(SUBJECT_METHOD_DAYS)) {
      if (sName.includes(subKey)) return { day: d };
    }
  }
  return { day: null };
}

function countConflicts(lessons, classes, subjects, teachers, shifts) {
  const classMap = new Map(classes.map(c => [c.id, c]));
  const subjectMap = new Map(subjects.map(s => [s.id, s]));
  const teacherMap = new Map(teachers.map(t => [t.id, t]));

  const conflicts = [];

  // 1. TEACHER COLLISION
  const teacherSlotMap = new Map();
  for (const l of lessons) {
    if (!l.teacherId) continue;
    const cls = classMap.get(l.classId);
    const shiftGroup = isClassSecondShift(cls, shifts) ? "shift2" : "shift1";
    const key = `${l.teacherId}_${l.dayOfWeek}_${l.periodNumber}_${shiftGroup}`;
    const existing = teacherSlotMap.get(key) || [];
    existing.push(l);
    teacherSlotMap.set(key, existing);
  }
  teacherSlotMap.forEach((matched, key) => {
    if (matched.length > 1) {
      const distinct = new Set(matched.map(l => l.classId));
      if (distinct.size > 1) {
        conflicts.push({
          type: 'TEACHER_COLLISION',
          desc: `${teacherMap.get(matched[0].teacherId)?.fullName} on Day ${matched[0].dayOfWeek} P${matched[0].periodNumber}: ${matched.map(l => classMap.get(l.classId)?.name).join(' & ')}`
        });
      }
    }
  });

  // 2. SAME DAY DUPLICATE
  const classDaySubjectMap = new Map();
  for (const l of lessons) {
    if (!l.classId || !l.subjectId || !l.dayOfWeek) continue;
    const key = `${l.classId}_${l.dayOfWeek}_${l.subjectId}`;
    const existing = classDaySubjectMap.get(key) || [];
    existing.push(l);
    classDaySubjectMap.set(key, existing);
  }
  classDaySubjectMap.forEach((matched) => {
    const uniquePeriods = Array.from(new Set(matched.map(m => m.periodNumber))).sort((a, b) => a - b);
    if (uniquePeriods.length > 1) {
      const first = matched[0];
      const cls = classMap.get(first.classId);
      const subject = subjectMap.get(first.subjectId);
      const isPrimary = (cls?.grade ?? 5) <= 4;
      const isTripleOrMore = uniquePeriods.length >= 3;
      const isConsecutivePair = uniquePeriods.length === 2 && (uniquePeriods[1] - uniquePeriods[0] === 1);
      const allowsDouble = !isPrimary && (subject?.allowDoubleLesson ?? false);
      if (isPrimary || isTripleOrMore || !allowsDouble || !isConsecutivePair) {
        conflicts.push({
          type: 'SAME_DAY_DUPLICATE',
          desc: `${cls?.name} ${subject?.name} Day ${first.dayOfWeek} P[${uniquePeriods.join(', ')}]`
        });
      }
    }
  });

  // 3. METHOD DAY
  for (const l of lessons) {
    const teacher = teacherMap.get(l.teacherId);
    const subject = subjectMap.get(l.subjectId);
    const cls = classMap.get(l.classId);
    const isPrimary = (cls?.grade !== undefined && cls.grade <= 4) || Boolean(cls?.isPrimary);
    if (isPrimary) continue;
    const isKelajakSoati = l.dayOfWeek === 1 && l.periodNumber === 1 && (
      subject?.name?.toLowerCase().includes("kelajak") ||
      subject?.name?.toLowerCase().includes("sinf soati")
    );
    if (isKelajakSoati) continue;
    const mDay = teacher ? getEffectiveTeacherMethodDay(teacher, subjects).day : null;
    if (mDay === l.dayOfWeek) {
      conflicts.push({
        type: 'METHOD_DAY',
        desc: `${teacher?.fullName} on method day ${l.dayOfWeek} in ${cls?.name} P${l.periodNumber}`
      });
    }
  }

  // 4. PRIMARY SATURDAY
  for (const l of lessons) {
    const cls = classMap.get(l.classId);
    if (l.dayOfWeek === 6 && (cls?.isPrimary || (cls?.grade !== undefined && cls.grade <= 4))) {
      conflicts.push({
        type: 'PRIMARY_SATURDAY',
        desc: `${cls?.name} primary Saturday lesson P${l.periodNumber}`
      });
    }
  }

  return conflicts;
}

async function main() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';
  const schoolId = 'cmthn422g0001uff8vhccbxmz';

  const [lessons, classes, subjects, teachers, shifts] = await Promise.all([
    prisma.lesson.findMany({ where: { scheduleId }, include: { class: true, subject: true, teacher: true } }),
    prisma.class.findMany({ where: { schoolId }, include: { shift: true } }),
    prisma.subject.findMany({ where: { schoolId } }),
    prisma.teacher.findMany({ where: { schoolId }, include: { subjects: { include: { subject: true } } } }),
    prisma.shift.findMany({ where: { schoolId } })
  ]);

  console.log(`Initial conflicts count: ${countConflicts(lessons, classes, subjects, teachers, shifts).length}`);

  let testLessons = JSON.parse(JSON.stringify(lessons));

  // --- STEP 1: SOLVE 12 PRIMARY MATH DUPLICATES ---
  const primary = ['1-A', '1-B', '1-D', '2-A', '2-B', '2-D', '3-A', '3-B', '3-D', '4-A', '4-B', '4-D'];
  for (const cName of primary) {
    const cls = classes.find(c => c.name === cName);
    const cLessons = testLessons.filter(l => l.classId === cls.id);
    const mathLessons = cLessons.filter(l => l.subject.name.toLowerCase().includes('matematika'));
    
    const dayCounts = {};
    mathLessons.forEach(l => { dayCounts[l.dayOfWeek] = (dayCounts[l.dayOfWeek] || 0) + 1; });
    const dupDay = Object.keys(dayCounts).find(d => dayCounts[d] > 1);
    if (!dupDay) continue;

    const dupLessons = mathLessons.filter(l => l.dayOfWeek === Number(dupDay)).sort((a,b)=>b.periodNumber - a.periodNumber);
    const lessonToMove = dupLessons[0];

    const wedLessons = cLessons.filter(l => l.dayOfWeek === 3);
    const maxWedP = Math.max(0, ...wedLessons.map(l => l.periodNumber));

    if (maxWedP < 5) {
      lessonToMove.dayOfWeek = 3;
      lessonToMove.periodNumber = maxWedP + 1;
    } else {
      const candidates = wedLessons.filter(l => !l.subject.name.toLowerCase().includes('matematika') && !l.subject.name.toLowerCase().includes('kelajak'));
      const targetWedLesson = candidates.find(l => l.periodNumber === 5) || candidates[candidates.length - 1];
      const origDay = lessonToMove.dayOfWeek;
      const origP = lessonToMove.periodNumber;
      lessonToMove.dayOfWeek = 3;
      lessonToMove.periodNumber = targetWedLesson.periodNumber;
      targetWedLesson.dayOfWeek = Number(origDay);
      targetWedLesson.periodNumber = origP;
    }
  }
  console.log(`After Step 1 (Primary math): ${countConflicts(testLessons, classes, subjects, teachers, shifts).length} conflicts remain.`);

  // --- STEP 2: SOLVE MIDDLE/HIGH MATH DUPLICATES ---
  // In 5-A, 5-B, 5-D, 6-A, 6-D, 7-A, 7-B: move duplicate to Day 4 (Payshanba)
  const mathMoves = [
    { class: '5-A', subject: 'Matematika', fromDay: 1, fromP: 5, toDay: 4, toP: 4 },
    { class: '5-B', subject: 'Matematika', fromDay: 2, fromP: 5, toDay: 4, toP: 5 },
    { class: '5-D', subject: 'Matematika', fromDay: 1, fromP: 6, toDay: 4, toP: 4 },
    { class: '6-A', subject: 'Matematika', fromDay: 2, fromP: 6, toDay: 4, toP: 5 },
    { class: '6-D', subject: 'Matematika', fromDay: 2, fromP: 5, toDay: 4, toP: 4 },
    { class: '7-A', subject: 'Algebra', fromDay: 5, fromP: 6, toDay: 4, toP: 4 },
    { class: '7-B', subject: 'Algebra', fromDay: 6, fromP: 5, toDay: 4, toP: 4 },
  ];

  for (const m of mathMoves) {
    const cls = classes.find(c => c.name === m.class);
    const l = testLessons.find(x => x.classId === cls.id && x.dayOfWeek === m.fromDay && x.periodNumber === m.fromP && x.subject.name.toLowerCase().includes(m.subject.toLowerCase()));
    if (l) {
      l.dayOfWeek = m.toDay;
      l.periodNumber = m.toP;
    }
  }
  console.log(`After Step 2 (Middle/High math): ${countConflicts(testLessons, classes, subjects, teachers, shifts).length} conflicts remain.`);

  // --- STEP 3: SOLVE COLLISION MAMAYUSUPOVA (11-B Astronomiya Day 1 P2 -> P6) ---
  const astro11b = testLessons.find(l => {
    const cls = classes.find(c => c.id === l.classId);
    return cls?.name === '11-B' && l.dayOfWeek === 1 && l.periodNumber === 2 && l.subject.name.toLowerCase().includes('astronomiya');
  });
  if (astro11b) {
    astro11b.periodNumber = 6;
  }
  console.log(`After Step 3 (11-B Astronomiya): ${countConflicts(testLessons, classes, subjects, teachers, shifts).length} conflicts remain.`);

  // --- STEP 4: SOLVE COLLISION BOBOYEV ABDUMALIK (10-B Geometriya vs 11-B Algebra on Day 6 P2) ---
  // In 10-B, move Geometriya on Day 6 from P2 to Day 4 P2 (or free slot)
  const geom10b = testLessons.find(l => {
    const cls = classes.find(c => c.id === l.classId);
    return cls?.name === '10-B' && l.dayOfWeek === 6 && l.periodNumber === 2 && l.subject.name.toLowerCase().includes('geometriya');
  });
  if (geom10b) {
    // Check 10-B on Day 4 (Payshanba)
    // Let's see what is free in 10-B on Day 4
    geom10b.dayOfWeek = 4;
    geom10b.periodNumber = 5;
  }
  console.log(`After Step 4 (10-B Geometriya): ${countConflicts(testLessons, classes, subjects, teachers, shifts).length} conflicts remain.`);

  // --- STEP 5: SOLVE COLLISION TOSHBOYEV OYBEK (8-A vs 9-A Informatika on Day 6 P6) ---
  // 9-A has P1 free on Day 6! Move 9-A Informatika from P6 to P1
  const info9a = testLessons.find(l => {
    const cls = classes.find(c => c.id === l.classId);
    return cls?.name === '9-A' && l.dayOfWeek === 6 && l.periodNumber === 6 && l.subject.name.toLowerCase().includes('informatika');
  });
  if (info9a) {
    info9a.periodNumber = 1;
  }
  console.log(`After Step 5 (9-A Informatika): ${countConflicts(testLessons, classes, subjects, teachers, shifts).length} conflicts remain.`);

  // --- STEP 6: SOLVE TOSHBOYEV QAHRAMON (1-B PE Day 1 P5 vs 8-A PE Day 1 P5) ---
  // In 1-B, move PE from Day 1 P5 to Day 4 P5 (or Day 3)
  const pe1b = testLessons.find(l => {
    const cls = classes.find(c => c.id === l.classId);
    return cls?.name === '1-B' && l.dayOfWeek === 1 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('jismoniy');
  });
  if (pe1b) {
    pe1b.dayOfWeek = 4;
    pe1b.periodNumber = 5;
  }
  console.log(`After Step 6 (1-B PE): ${countConflicts(testLessons, classes, subjects, teachers, shifts).length} conflicts remain.`);

  // --- STEP 7: SOLVE 5-B TARIX (Day 6 [3, 5]) ---
  // Move 5-B Tarix from Day 6 P5 to Day 1 P5
  const tarix5b = testLessons.find(l => {
    const cls = classes.find(c => c.id === l.classId);
    return cls?.name === '5-B' && l.dayOfWeek === 6 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('tarix');
  });
  if (tarix5b) {
    tarix5b.dayOfWeek = 1;
    tarix5b.periodNumber = 5;
  }
  console.log(`After Step 7 (5-B Tarix): ${countConflicts(testLessons, classes, subjects, teachers, shifts).length} conflicts remain.`);

  // --- STEP 8: SOLVE 5-A TEXNOLOGIYA (Day 2 [1, 5]) ---
  const texno5a = testLessons.find(l => {
    const cls = classes.find(c => c.id === l.classId);
    return cls?.name === '5-A' && l.dayOfWeek === 2 && l.periodNumber === 1 && l.subject.name.toLowerCase().includes('texnologiya');
  });
  if (texno5a) {
    texno5a.dayOfWeek = 4;
    texno5a.periodNumber = 5;
  }
  console.log(`After Step 8 (5-A Texnologiya): ${countConflicts(testLessons, classes, subjects, teachers, shifts).length} conflicts remain.`);

  // --- STEP 9: SOLVE 9-A and 10-A PE COLLISION & DUPLICATES ---
  // Assign 9-A & 10-A Group 2 to Safarov Otabek ('t_39_42')
  // In 9-A: PE at Day 2 P1 (Group 1 Toshboyev, Group 2 Safarov) and Day 5 P6 (Group 1 Toshboyev, Group 2 Safarov)
  // Delete the duplicate Day 1 P2 & Day 2 P2 in 9-A
  // In 10-A: PE at Day 1 P6 (Group 1 Toshboyev, Group 2 Safarov) and Day 2 P5 (Group 1 Toshboyev, Group 2 Safarov)
  // Delete the duplicate Day 1 P2 & Day 2 P2 in 10-A

  // Let's see remaining conflicts before PE cleanup
  const remainingConflicts = countConflicts(testLessons, classes, subjects, teachers, shifts);
  console.log(`\nRemaining conflicts list (${remainingConflicts.length} ta):`);
  remainingConflicts.forEach(c => console.log(`- [${c.type}] ${c.desc}`));

  await prisma.$disconnect();
}

main().catch(console.error);
