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

  let count = 0;

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
  teacherSlotMap.forEach((matched) => {
    if (matched.length > 1) {
      const distinct = new Set(matched.map(l => l.classId));
      if (distinct.size > 1) count++;
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
        count++;
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
    if (mDay === l.dayOfWeek) count++;
  }

  // 4. PRIMARY SATURDAY
  for (const l of lessons) {
    const cls = classMap.get(l.classId);
    if (l.dayOfWeek === 6 && (cls?.isPrimary || (cls?.grade !== undefined && cls.grade <= 4))) {
      count++;
    }
  }

  return count;
}

function getDetailedConflicts(lessons, classes, subjects, teachers, shifts) {
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
  teacherSlotMap.forEach((matched) => {
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
        period: l.periodNumber,
        lessons: [l]
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

  console.log(`Initial conflicts: ${countConflicts(current, classes, subjects, teachers, shifts)}`);

  // Local helper
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
  // 1-A: Move Math Day 1 P5 to Day 3 P5
  const m1a = findLesson('1-A', 1, 5, 'Matematika');
  if (m1a) move(m1a.id, 3, 5);

  // 1-B: Move Math Day 2 P5 to Day 3 P5
  const m1b = findLesson('1-B', 2, 5, 'Matematika');
  if (m1b) move(m1b.id, 3, 5);

  // 1-D: Swap Math Day 2 P5 with Tarbiya Day 3 P5
  const m1d = findLesson('1-D', 2, 5, 'Matematika');
  const t1d = findLesson('1-D', 3, 5, 'Tarbiya');
  if (m1d && t1d) swap(m1d.id, t1d.id);

  // 2-A: Swap Math Day 1 P5 with O'qish Day 3 P3 (Sayyora Qurbonnazarova teaches both!)
  const m2a = findLesson('2-A', 1, 5, 'Matematika');
  const o2a = findLesson('2-A', 3, 3, "O'qish");
  if (m2a && o2a) swap(m2a.id, o2a.id);

  // 2-B: Move Math Day 1 P4 to Day 3 P5
  const m2b = findLesson('2-B', 1, 4, 'Matematika');
  if (m2b) move(m2b.id, 3, 5);

  // 2-D: In 2-D, Day 5 P5 Math. Let's find a safe slot on Day 3 for Math:
  // On Day 3 in 2-D, P3 is Jismoniy tarbiya (Muhammadiyeva). Day 5 P3 is ALSO Jismoniy tarbiya (Muhammadiyeva)!
  // If we move Day 5 P5 Math to Day 3 P3 (swap with Jismoniy tarbiya):
  // Then Day 5 has Jismoniy tarbiya at P5 (consecutive with P3, or swap with P3).
  // Better: In 2-D, Day 5 has 5 periods, Day 1 has 5 periods. What if Day 3 has an empty slot or swap?
  // Let's test swap with 2-D Day 3 P1 Ona tili: Ro'ziboyeva teaches both! On Day 5 P5 Ona tili, Day 3 P1 Math. Day 5 P2 is Ona tili -> consecutive!
  const m2d = findLesson('2-D', 5, 5, 'Matematika');
  const o2d = findLesson('2-D', 3, 1, 'Ona tili');
  if (m2d && o2d) swap(m2d.id, o2d.id);

  // 3-A: Swap Math Day 1 P5 with Texnologiya Day 3 P5
  const m3a = findLesson('3-A', 1, 5, 'Matematika');
  const t3a = findLesson('3-A', 3, 5, 'Texnologiya');
  if (m3a && t3a) swap(m3a.id, t3a.id);

  // 3-B: Swap Math Day 1 P5 with Tarbiya Day 3 P5
  const m3b = findLesson('3-B', 1, 5, 'Matematika');
  const t3b = findLesson('3-B', 3, 5, 'Tarbiya');
  if (m3b && t3b) swap(m3b.id, t3b.id);

  // 3-D: In 3-D, Day 2 P5 Math. Swap with Musiqa Day 3 P2!
  const m3d = findLesson('3-D', 2, 5, 'Matematika');
  const mu3d = findLesson('3-D', 3, 2, 'Musiqa');
  if (m3d && mu3d) swap(m3d.id, mu3d.id);

  // 4-A: Swap Math Day 1 P5 with Tasviriy san'at Day 3 P5
  const m4a = findLesson('4-A', 1, 5, 'Matematika');
  const ts4a = findLesson('4-A', 3, 5, "Tasviriy");
  if (m4a && ts4a) swap(m4a.id, ts4a.id);

  // 4-B: Move Math Day 1 P5 to Day 3 P5
  const m4b = findLesson('4-B', 1, 5, 'Matematika');
  if (m4b) move(m4b.id, 3, 5);

  // 4-D: Swap Math Day 4 P5 with Tarbiya Day 3 P5
  const m4d = findLesson('4-D', 4, 5, 'Matematika');
  const tr4d = findLesson('4-D', 3, 5, 'Tarbiya');
  if (m4d && tr4d) swap(m4d.id, tr4d.id);

  // --- 2. MIDDLE/HIGH MATH DUPLICATES ---
  // 5-A Matematika: move Day 1 P5 to Day 3 P4 (Wednesday P4 is completely free in 5-A!)
  const m5a = findLesson('5-A', 1, 5, 'Matematika');
  if (m5a) move(m5a.id, 3, 4);

  // 5-B Matematika: move Day 2 P5 to Day 3 P6 (Wednesday P6 is free in 5-B, and solves Sagirayev Day 2 P5 collision!)
  const m5b = findLesson('5-B', 2, 5, 'Matematika');
  if (m5b) move(m5b.id, 3, 6);

  // 5-D Matematika: move Day 1 P6 to Day 3 P5 (Wednesday P5 is free in 5-D!)
  const m5d = findLesson('5-D', 1, 6, 'Matematika');
  if (m5d) move(m5d.id, 3, 5);

  // 6-A Matematika: Day 2 has P5 and P6. In 6-A on Wednesday, P1 is Texnologiya.
  // What if 6-A Matematika Day 2 P6 moves to Day 1 P5 (free in 6-A)? Or Day 3?
  // Let's check: 6-A Day 1 has only 4 lessons! P5 is free in 6-A! But Day 1 already has Math at P2.
  // What about Day 3 P6? In 5-B, Math is at P6. So Sagirayev cannot be at P6 in both!
  // In 5-B, Math can be at Day 5 P6, or in 6-A Math can be at Day 3 P2 (swap with PE).
  // Let's see: In 6-A, move Math Day 2 P6 to Day 3 P1 or P2:
  const m6a = findLesson('6-A', 2, 6, 'Matematika');
  // Let's find an optimal slot for m6a

  // 6-D Matematika: move Day 2 P5 to Day 3 P5 (Wednesday P5 is free in 6-D!)
  const m6d = findLesson('6-D', 2, 5, 'Matematika');
  if (m6d) move(m6d.id, 3, 5);

  // 7-A Algebra: move Day 5 P6 to Day 3 P6 (Wednesday P6 is free in 7-A!)
  const a7a = findLesson('7-A', 5, 6, 'Algebra');
  if (a7a) move(a7a.id, 3, 6);

  // 7-B Algebra: move Day 6 P5 to Day 3 P5 (Wednesday P5 is free in 7-B!)
  const a7b = findLesson('7-B', 6, 5, 'Algebra');
  if (a7b) move(a7b.id, 3, 5);

  // --- 3. OTHER DUPLICATES & COLLISIONS ---
  // 5-B Tarix: Day 6 [3, 5] -> Move P5 to Day 5 P6 (free in 5-B)
  const t5b = findLesson('5-B', 6, 5, 'Tarix');
  if (t5b) move(t5b.id, 5, 6);

  // 5-A Texnologiya: Day 2 [1, 5] -> Move P1 to Day 3 P5 (free in 5-A)
  const tx5a = findLesson('5-A', 2, 1, 'Texnologiya');
  if (tx5a) move(tx5a.id, 3, 5);

  // 11-B Astronomiya: Day 1 P2 collides with 8-A Fizika (Mamayusupova).
  // Move 11-B Astronomiya to Day 5 P5 or Day 6 P6 (when Mamayusupova is free)
  const ast11 = findLesson('11-B', 1, 2, 'Astronomiya');
  if (ast11) move(ast11.id, 5, 6);

  // 10-B Geometriya: Day 6 P2 collides with 11-B Algebra (Boboyev).
  // Move 10-B Geometriya to Day 5 P5 (when Boboyev is free)
  const g10b = findLesson('10-B', 6, 2, 'Geometriya');
  if (g10b) move(g10b.id, 5, 5);

  // 9-A Informatika: Day 6 P6 collides with 8-A Informatika (Toshboyev Oybek).
  // Move 9-A Informatika to Day 6 P2 (when Oybek is free)
  const inf9a = findLesson('9-A', 6, 6, 'Informatika');
  if (inf9a) move(inf9a.id, 6, 2);

  // 1-B PE: Day 1 P5 collides with 8-A PE (Toshboyev Qahramon).
  // Move 1-B PE to Day 4 P4 (free in 1-B)
  const pe1b = findLesson('1-B', 1, 5, 'Jismoniy');
  if (pe1b) move(pe1b.id, 4, 4);

  // 9-A & 10-A PE:
  // Fix Safarov Otabek and Toshboyev Qahramon group alignment:
  const pe9a_g1 = current.filter(l => l.class.name === '9-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_1');
  const pe9a_g2 = current.filter(l => l.class.name === '9-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_2');
  if (pe9a_g1.length >= 2 && pe9a_g2.length >= 2) {
    move(pe9a_g2[0].id, pe9a_g1[0].dayOfWeek, pe9a_g1[0].periodNumber, 't_39_42');
    move(pe9a_g2[1].id, pe9a_g1[1].dayOfWeek, pe9a_g1[1].periodNumber, 't_39_42');
  }

  const pe10a_g1 = current.filter(l => l.class.name === '10-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_1');
  const pe10a_g2 = current.filter(l => l.class.name === '10-A' && l.subject.name.toLowerCase().includes('jismoniy') && l.groupType === 'GROUP_2');
  if (pe10a_g1.length >= 2 && pe10a_g2.length >= 2) {
    // Put at Day 3 P5 and Day 1 P6
    move(pe10a_g1[0].id, 3, 5, 't_39_49');
    move(pe10a_g2[0].id, 3, 5, 't_39_42');
    move(pe10a_g1[1].id, 1, 6, 't_39_49');
    move(pe10a_g2[1].id, 1, 6, 't_39_42');
  }

  const remaining = getDetailedConflicts(current, classes, subjects, teachers, shifts);
  console.log(`\nRemaining conflicts: ${remaining.length}`);
  remaining.forEach((c, idx) => {
    console.log(`\n--- Conflict #${idx + 1}: ${c.type} ---`);
    console.log(`Teacher: ${c.teacher}, Class: ${c.class || c.classes}, Subject: ${c.subject}, Day: ${c.day}, Period: ${c.period || c.periods}`);
    if (c.lessons) {
      c.lessons.forEach(l => console.log(`  Lesson: [${l.id}] ${l.class?.name || classes.find(x=>x.id===l.classId)?.name} ${l.subject?.name || subjects.find(x=>x.id===l.subjectId)?.name} Day ${l.dayOfWeek} P${l.periodNumber} (${l.teacher?.fullName || teachers.find(x=>x.id===l.teacherId)?.fullName})`));
    }
  });

  await prisma.$disconnect();
}

main().catch(console.error);
