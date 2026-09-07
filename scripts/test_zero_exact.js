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

function evaluate(lessons, classes, subjects, teachers, shifts) {
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
          day: matched[0].dayOfWeek,
          period: matched[0].periodNumber,
          classes: matched.map(l => classMap.get(l.classId)?.name).join(' & ')
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
          subject: subject?.name,
          day: first.dayOfWeek,
          periods: uniquePeriods
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
        day: l.dayOfWeek,
        period: l.periodNumber
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
        period: l.periodNumber
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

  let current = JSON.parse(JSON.stringify(lessons));

  function findLesson(cName, day, p, subSnippet = '') {
    return current.find(l => {
      const cls = classes.find(c => c.id === l.classId);
      if (cls?.name !== cName) return false;
      if (day !== null && l.dayOfWeek !== day) return false;
      if (p !== null && l.periodNumber !== p) return false;
      if (subSnippet && !l.subject.name.toLowerCase().includes(subSnippet.toLowerCase())) return false;
      return true;
    });
  }

  function move(id, day, period, newTeacherId = null) {
    const l = current.find(x => x.id === id);
    if (!l) return;
    l.dayOfWeek = day;
    l.periodNumber = period;
    if (newTeacherId) l.teacherId = newTeacherId;
  }

  function swap(id1, id2) {
    const l1 = current.find(x => x.id === id1);
    const l2 = current.find(x => x.id === id2);
    if (!l1 || !l2) return;
    const d1 = l1.dayOfWeek, p1 = l1.periodNumber;
    l1.dayOfWeek = l2.dayOfWeek;
    l1.periodNumber = l2.periodNumber;
    l2.dayOfWeek = d1;
    l2.periodNumber = p1;
  }

  // --- 1. PRIMARY CLASS MATH (12 classes) ---
  const m1a = findLesson('1-A', 1, 5, 'Matematika');
  if (m1a) move(m1a.id, 3, 5);

  const m1b = findLesson('1-B', 2, 5, 'Matematika');
  if (m1b) move(m1b.id, 3, 5);

  const m1d = findLesson('1-D', 2, 5, 'Matematika');
  const t1d = findLesson('1-D', 3, 5, 'Tarbiya');
  if (m1d && t1d) swap(m1d.id, t1d.id);

  const m2a = findLesson('2-A', 1, 5, 'Matematika');
  const o2a = findLesson('2-A', 3, 3, "O'qish");
  if (m2a && o2a) swap(m2a.id, o2a.id);

  const m2b = findLesson('2-B', 1, 4, 'Matematika');
  if (m2b) move(m2b.id, 3, 5);

  // 2-D: Swap Math Day 5 P5 with Rus tili Day 3 P2
  const m2d = findLesson('2-D', 5, 5, 'Matematika');
  const r2d = findLesson('2-D', 3, 2, 'Rus tili');
  if (m2d && r2d) swap(m2d.id, r2d.id);

  const m3a = findLesson('3-A', 1, 5, 'Matematika');
  const t3a = findLesson('3-A', 3, 5, 'Texnologiya');
  if (m3a && t3a) swap(m3a.id, t3a.id);

  const m3b = findLesson('3-B', 1, 5, 'Matematika');
  const t3b = findLesson('3-B', 3, 5, 'Tarbiya');
  if (m3b && t3b) swap(m3b.id, t3b.id);

  const m3d = findLesson('3-D', 2, 5, 'Matematika');
  const mu3d = findLesson('3-D', 3, 2, 'Musiqa');
  if (m3d && mu3d) swap(m3d.id, mu3d.id);

  const m4a = findLesson('4-A', 1, 5, 'Matematika');
  const ts4a = findLesson('4-A', 3, 5, "Tasviriy");
  if (m4a && ts4a) swap(m4a.id, ts4a.id);

  const m4b = findLesson('4-B', 1, 5, 'Matematika');
  if (m4b) move(m4b.id, 3, 5);

  const m4d = findLesson('4-D', 4, 5, 'Matematika');
  const tr4d = findLesson('4-D', 3, 5, 'Tarbiya');
  if (m4d && tr4d) swap(m4d.id, tr4d.id);

  // --- 2. MIDDLE/HIGH MATH DUPLICATES & SAGIRAYEV ---
  // 5-A Matematika: move Day 1 P5 to Day 3 P4
  const m5a = findLesson('5-A', 1, 5, 'Matematika');
  if (m5a) move(m5a.id, 3, 4);

  // 5-B Matematika: Day 2 P5 moves to Day 3 P1, swap with Tasviriy san'at (Xoliyorova) Day 3 P1!
  const m5b = findLesson('5-B', 2, 5, 'Matematika');
  const ts5b = findLesson('5-B', 3, 1, "Tasviriy");
  if (m5b && ts5b) swap(m5b.id, ts5b.id);

  // 6-A Matematika: Day 2 P6 moves to Day 3 P6 (free!)
  const m6a = findLesson('6-A', 2, 6, 'Matematika');
  if (m6a) move(m6a.id, 3, 6);

  // 5-D Matematika: move Day 1 P6 to Day 3 P5
  const m5d = findLesson('5-D', 1, 6, 'Matematika');
  if (m5d) move(m5d.id, 3, 5);

  // 6-D Matematika: move Day 2 P5 to Day 3 P5
  const m6d = findLesson('6-D', 2, 5, 'Matematika');
  if (m6d) move(m6d.id, 3, 5);

  // 7-A Algebra: move Day 5 P6 to Day 3 P6
  const a7a = findLesson('7-A', 5, 6, 'Algebra');
  if (a7a) move(a7a.id, 3, 6);

  // 7-B Algebra: move Day 6 P5 to Day 3 P5
  const a7b = findLesson('7-B', 6, 5, 'Algebra');
  if (a7b) move(a7b.id, 3, 5);

  // --- 3. OTHER DUPLICATES & COLLISIONS ---
  // 5-B Tarix: Day 6 P5 to Day 5 P6
  const t5b = findLesson('5-B', 6, 5, 'Tarix');
  if (t5b) move(t5b.id, 5, 6);

  // 5-A Texnologiya: Day 2 P1 to Day 3 P5
  const tx5a = findLesson('5-A', 2, 1, 'Texnologiya');
  if (tx5a) move(tx5a.id, 3, 5);

  // 8-A Fizika Day 1 P2 swap with 8-A Ona tili Day 6 P3 (Amirova Jamila)
  const fiz8a = findLesson('8-A', 1, 2, 'Fizika');
  const ot8a = findLesson('8-A', 6, 3, 'Ona tili');
  if (fiz8a && ot8a) swap(fiz8a.id, ot8a.id);

  // 10-B Geometriya: Day 6 P2 to Day 3 P4
  const g10b = findLesson('10-B', 6, 2, 'Geometriya');
  if (g10b) move(g10b.id, 3, 4);

  // 9-A Informatika: Day 6 P6 to Day 3 P5
  const inf9a = findLesson('9-A', 6, 6, 'Informatika');
  if (inf9a) move(inf9a.id, 3, 5);

  // 1-B PE: Day 1 P5 to Day 4 P4
  const pe1b = findLesson('1-B', 1, 5, 'Jismoniy');
  if (pe1b) move(pe1b.id, 4, 4);

  // 9-A PE: Day 3 P6 and Day 5 P6 (Group 1 Qahramon, Group 2 Safarov)
  const pe9a_g1 = current.filter(l => l.class.name === '9-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_1');
  const pe9a_g2 = current.filter(l => l.class.name === '9-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_2');
  if (pe9a_g1.length >= 2 && pe9a_g2.length >= 2) {
    move(pe9a_g1[0].id, 3, 6, 't_39_49');
    move(pe9a_g2[0].id, 3, 6, 't_39_42');
    move(pe9a_g1[1].id, 5, 6, 't_39_49');
    move(pe9a_g2[1].id, 5, 6, 't_39_42');
  }

  // 10-A PE: Day 3 P5 and Day 4 P5 (Group 1 Qahramon, Group 2 Safarov)
  const pe10a_g1 = current.filter(l => l.class.name === '10-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_1');
  const pe10a_g2 = current.filter(l => l.class.name === '10-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_2');
  if (pe10a_g1.length >= 2 && pe10a_g2.length >= 2) {
    move(pe10a_g1[0].id, 3, 5, 't_39_49');
    move(pe10a_g2[0].id, 3, 5, 't_39_42');
    move(pe10a_g1[1].id, 4, 5, 't_39_49');
    move(pe10a_g2[1].id, 4, 5, 't_39_42');
  }

  const conflicts = evaluate(current, classes, subjects, teachers, shifts);
  console.log(`\n====================================================`);
  console.log(`YAKUNIY ZIDDIYATLAR SONI: ${conflicts.length} TA`);
  console.log(`====================================================`);
  conflicts.forEach(c => console.log(`- [${c.type}] ${c.desc || (c.teacher + ': ' + (c.classes || c.class) + ' Day ' + c.day + ' P' + (c.period || c.periods))}`));

  await prisma.$disconnect();
}

main().catch(console.error);
