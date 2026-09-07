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

function evaluateSchedule(lessons, classes, subjects, teachers, shifts) {
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
          teacher: teacherMap.get(matched[0].teacherId)?.fullName,
          teacherId: matched[0].teacherId,
          day: matched[0].dayOfWeek,
          period: matched[0].periodNumber,
          classes: matched.map(l => classMap.get(l.classId)?.name).join(' & '),
          lessons: matched
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
          class: cls?.name,
          classId: first.classId,
          subject: subject?.name,
          subjectId: first.subjectId,
          day: first.dayOfWeek,
          periods: uniquePeriods,
          lessons: matched
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
        teacher: teacher?.fullName,
        class: cls?.name,
        classId: l.classId,
        subject: subject?.name,
        day: l.dayOfWeek,
        period: l.periodNumber,
        lessons: [l]
      });
    }
  }

  // 4. PRIMARY SATURDAY
  for (const l of lessons) {
    const cls = classMap.get(l.classId);
    if (l.dayOfWeek === 6 && (cls?.isPrimary || (cls?.grade !== undefined && cls.grade <= 4))) {
      conflicts.push({
        type: 'PRIMARY_SATURDAY',
        class: cls?.name,
        classId: l.classId,
        period: l.periodNumber,
        lessons: [l]
      });
    }
  }

  return conflicts;
}

async function runZeroConflictSolver() {
  const scheduleId = 'cmthnjupw00g6uf04uuqrp5w1';
  const schoolId = 'cmthn422g0001uff8vhccbxmz';

  const [lessons, classes, subjects, teachers, shifts] = await Promise.all([
    prisma.lesson.findMany({ where: { scheduleId }, include: { class: true, subject: true, teacher: true } }),
    prisma.class.findMany({ where: { schoolId }, include: { shift: true } }),
    prisma.subject.findMany({ where: { schoolId } }),
    prisma.teacher.findMany({ where: { schoolId }, include: { subjects: { include: { subject: true } } } }),
    prisma.shift.findMany({ where: { schoolId } })
  ]);

  let currentLessons = JSON.parse(JSON.stringify(lessons));
  const initialConflicts = evaluateSchedule(currentLessons, classes, subjects, teachers, shifts);
  console.log(`Starting with ${initialConflicts.length} conflicts.`);

  // We will track operations to apply to DB:
  // { type: 'UPDATE', id, dayOfWeek, periodNumber, teacherId? } or { type: 'DELETE', id }
  const operations = [];

  // Helper to update lesson in memory
  function moveLessonInMemory(id, toDay, toPeriod, newTeacherId = null) {
    const l = currentLessons.find(x => x.id === id);
    if (!l) return;
    l.dayOfWeek = toDay;
    l.periodNumber = toPeriod;
    if (newTeacherId) l.teacherId = newTeacherId;
    operations.push({ type: 'UPDATE', id, dayOfWeek: toDay, periodNumber: toPeriod, teacherId: newTeacherId || l.teacherId });
  }

  // Helper to swap two lessons
  function swapLessonsInMemory(l1Id, l2Id) {
    const l1 = currentLessons.find(x => x.id === l1Id);
    const l2 = currentLessons.find(x => x.id === l2Id);
    if (!l1 || !l2) return;
    const d1 = l1.dayOfWeek, p1 = l1.periodNumber;
    const d2 = l2.dayOfWeek, p2 = l2.periodNumber;
    l1.dayOfWeek = d2;
    l1.periodNumber = p2;
    l2.dayOfWeek = d1;
    l2.periodNumber = p1;
    operations.push({ type: 'UPDATE', id: l1.id, dayOfWeek: d2, periodNumber: p2, teacherId: l1.teacherId });
    operations.push({ type: 'UPDATE', id: l2.id, dayOfWeek: d1, periodNumber: p1, teacherId: l2.teacherId });
  }

  // 1. PRIMARY CLASSES (12 classes)
  const primary = ['1-A', '1-B', '1-D', '2-A', '2-B', '2-D', '3-A', '3-B', '3-D', '4-A', '4-B', '4-D'];
  for (const cName of primary) {
    const cls = classes.find(c => c.name === cName);
    const cLessons = currentLessons.filter(l => l.classId === cls.id);
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
      moveLessonInMemory(lessonToMove.id, 3, maxWedP + 1);
    } else {
      const candidates = wedLessons.filter(l => !l.subject.name.toLowerCase().includes('matematika') && !l.subject.name.toLowerCase().includes('kelajak'));
      const targetWedLesson = candidates.find(l => l.periodNumber === 5) || candidates[candidates.length - 1];
      swapLessonsInMemory(lessonToMove.id, targetWedLesson.id);
    }
  }

  let step1Conflicts = evaluateSchedule(currentLessons, classes, subjects, teachers, shifts);
  console.log(`After Step 1 (Primary math): ${step1Conflicts.length} conflicts remain.`);

  // 2. 9-A & 10-A PE COLLISION & DUPLICATES
  // Assign Safarov Otabek ('t_39_42') to GROUP_2 for 9-A and 10-A
  // Let's inspect 9-A PE:
  const pe9a_g1 = currentLessons.filter(l => l.class.name === '9-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_1');
  const pe9a_g2 = currentLessons.filter(l => l.class.name === '9-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_2');
  // Align 9-A Group 2 to Safarov Otabek and same time as Group 1!
  // E.g. Group 1 is at Day 2 P1 and Day 5 P6
  if (pe9a_g1.length >= 2 && pe9a_g2.length >= 2) {
    // Make g2[0] match g1[0]
    moveLessonInMemory(pe9a_g2[0].id, pe9a_g1[0].dayOfWeek, pe9a_g1[0].periodNumber, 't_39_42');
    // Make g2[1] match g1[1]
    moveLessonInMemory(pe9a_g2[1].id, pe9a_g1[1].dayOfWeek, pe9a_g1[1].periodNumber, 't_39_42');
  }

  // Same for 10-A PE:
  // In 10-A: Group 1 has Day 1 P2 and Day 2 P2. Group 2 has Day 1 P6 and Day 2 P5.
  // Instead of Day 1 P2 (collides with 9-A!), put 10-A PE at Day 3 P5 or Day 4 P5, and Day 1 P6!
  const pe10a_g1 = currentLessons.filter(l => l.class.name === '10-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_1');
  const pe10a_g2 = currentLessons.filter(l => l.class.name === '10-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_2');
  if (pe10a_g1.length >= 2 && pe10a_g2.length >= 2) {
    // Move Day 1 P2 lesson to Day 3 P5 (or Day 4 P5) for Group 1 and Group 2 (Safarov)
    moveLessonInMemory(pe10a_g1[0].id, 3, 5, 't_39_49'); // Toshboyev Qahramon
    moveLessonInMemory(pe10a_g2[0].id, 3, 5, 't_39_42'); // Safarov Otabek
    // Day 2 lesson: put at Day 1 P6 (both groups)
    moveLessonInMemory(pe10a_g1[1].id, 1, 6, 't_39_49');
    moveLessonInMemory(pe10a_g2[1].id, 1, 6, 't_39_42');
  }

  // 3. 11-B Astronomiya: Day 1 P2 collides with 8-A Fizika!
  // In 11-B on Day 1, P6 was free. Move to Day 1 P6.
  const astro = currentLessons.find(l => l.class.name === '11-B' && l.dayOfWeek === 1 && l.periodNumber === 2 && l.subject.name.toLowerCase().includes('astronomiya'));
  if (astro) {
    moveLessonInMemory(astro.id, 1, 6);
  }

  // 4. 8-A vs 9-A Informatika on Day 6 P6:
  // In 9-A, move Informatika to Day 6 P1 (which is free in 9-A)
  const info9a = currentLessons.find(l => l.class.name === '9-A' && l.dayOfWeek === 6 && l.periodNumber === 6 && l.subject.name.toLowerCase().includes('informatika'));
  if (info9a) {
    moveLessonInMemory(info9a.id, 6, 1);
  }

  // 5. 1-B PE Day 1 P5 collides with 8-A PE Day 1 P5:
  // In 1-B on Day 4, P4 or P5 is free. Move to Day 4 P5.
  const pe1b = currentLessons.find(l => l.class.name === '1-B' && l.dayOfWeek === 1 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('jismoniy'));
  if (pe1b) {
    moveLessonInMemory(pe1b.id, 4, 5);
  }

  // 6. 10-B Geometriya Day 6 P2 collides with 11-B Algebra Day 6 P2 (Boboyev):
  // Move 10-B Geometriya to Day 5 P6 or Day 3 P6
  const geom10b = currentLessons.find(l => l.class.name === '10-B' && l.dayOfWeek === 6 && l.periodNumber === 2 && l.subject.name.toLowerCase().includes('geometriya'));
  if (geom10b) {
    moveLessonInMemory(geom10b.id, 5, 6);
  }

  // 7. 5-B Tarix: Day 6 has [3, 5] -> move P5 to Day 3 P6 (or Day 5)
  const tarix5b = currentLessons.find(l => l.class.name === '5-B' && l.dayOfWeek === 6 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('tarix'));
  if (tarix5b) {
    moveLessonInMemory(tarix5b.id, 3, 6);
  }

  // 8. 5-A Texnologiya: Day 2 has [1, 5] -> move P1 to Day 3 P4 (or Day 5)
  const texno5a = currentLessons.find(l => l.class.name === '5-A' && l.dayOfWeek === 2 && l.periodNumber === 1 && l.subject.name.toLowerCase().includes('texnologiya'));
  if (texno5a) {
    moveLessonInMemory(texno5a.id, 3, 4);
  }

  let step2Conflicts = evaluateSchedule(currentLessons, classes, subjects, teachers, shifts);
  console.log(`After Step 2-8: ${step2Conflicts.length} conflicts remain:`);
  step2Conflicts.forEach(c => console.log(`- [${c.type}] in ${c.class || c.teacher || ''}: ${c.subject || c.classes || ''} (Day ${c.day} P${c.period || c.periods})`));

  await prisma.$disconnect();
}

runZeroConflictSolver().catch(console.error);
