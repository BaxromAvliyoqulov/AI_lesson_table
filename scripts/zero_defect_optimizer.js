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

  let currentLessons = JSON.parse(JSON.stringify(lessons));

  function move(id, day, period, teacherId = null) {
    const l = currentLessons.find(x => x.id === id);
    if (l) {
      l.dayOfWeek = day;
      l.periodNumber = period;
      if (teacherId) l.teacherId = teacherId;
    }
  }

  function swap(id1, id2) {
    const l1 = currentLessons.find(x => x.id === id1);
    const l2 = currentLessons.find(x => x.id === id2);
    if (l1 && l2) {
      const d1 = l1.dayOfWeek, p1 = l1.periodNumber;
      l1.dayOfWeek = l2.dayOfWeek;
      l1.periodNumber = l2.periodNumber;
      l2.dayOfWeek = d1;
      l2.periodNumber = p1;
    }
  }

  // 1. PRIMARY FIX (carefully picking non-colliding subjects to swap)
  // 1-A: Move Math from Day 1 P5 to Day 3 P5 (free)
  const l1a_m = currentLessons.find(l => l.class.name === '1-A' && l.dayOfWeek === 1 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  if (l1a_m) move(l1a_m.id, 3, 5);

  // 1-B: Move Math from Day 2 P5 to Day 3 P5 (free)
  const l1b_m = currentLessons.find(l => l.class.name === '1-B' && l.dayOfWeek === 2 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  if (l1b_m) move(l1b_m.id, 3, 5);

  // 1-D: Swap Math Day 2 P5 with Tarbiya Day 3 P5
  const l1d_m = currentLessons.find(l => l.class.name === '1-D' && l.dayOfWeek === 2 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  const l1d_t = currentLessons.find(l => l.class.name === '1-D' && l.dayOfWeek === 3 && l.periodNumber === 5);
  if (l1d_m && l1d_t) swap(l1d_m.id, l1d_t.id);

  // 2-A: Swap Math Day 1 P5 with Tabiiy fan Day 3 P4 (instead of Rus tili!)
  const l2a_m = currentLessons.find(l => l.class.name === '2-A' && l.dayOfWeek === 1 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  const l2a_tf = currentLessons.find(l => l.class.name === '2-A' && l.dayOfWeek === 3 && l.periodNumber === 4);
  if (l2a_m && l2a_tf) swap(l2a_m.id, l2a_tf.id);

  // 2-B: Move Math from Day 1 P4 to Day 3 P5 (free)
  const l2b_m = currentLessons.find(l => l.class.name === '2-B' && l.dayOfWeek === 1 && l.periodNumber === 4 && l.subject.name.toLowerCase().includes('matematika'));
  if (l2b_m) move(l2b_m.id, 3, 5);

  // 2-D: Swap Math Day 5 P5 with Tasviriy san'at Day 3 P4 (instead of O'qish!)
  const l2d_m = currentLessons.find(l => l.class.name === '2-D' && l.dayOfWeek === 5 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  const l2d_ts = currentLessons.find(l => l.class.name === '2-D' && l.dayOfWeek === 3 && l.periodNumber === 4);
  if (l2d_m && l2d_ts) swap(l2d_m.id, l2d_ts.id);

  // 3-A: Swap Math Day 1 P5 with Texnologiya Day 3 P5
  const l3a_m = currentLessons.find(l => l.class.name === '3-A' && l.dayOfWeek === 1 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  const l3a_tx = currentLessons.find(l => l.class.name === '3-A' && l.dayOfWeek === 3 && l.periodNumber === 5);
  if (l3a_m && l3a_tx) swap(l3a_m.id, l3a_tx.id);

  // 3-B: Swap Math Day 1 P5 with Tarbiya Day 3 P5
  const l3b_m = currentLessons.find(l => l.class.name === '3-B' && l.dayOfWeek === 1 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  const l3b_tr = currentLessons.find(l => l.class.name === '3-B' && l.dayOfWeek === 3 && l.periodNumber === 5);
  if (l3b_m && l3b_tr) swap(l3b_m.id, l3b_tr.id);

  // 3-D: Swap Math Day 2 P5 with Musiqa Day 3 P2 (instead of O'qish!)
  const l3d_m = currentLessons.find(l => l.class.name === '3-D' && l.dayOfWeek === 2 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  const l3d_mu = currentLessons.find(l => l.class.name === '3-D' && l.dayOfWeek === 3 && l.periodNumber === 2);
  if (l3d_m && l3d_mu) swap(l3d_m.id, l3d_mu.id);

  // 4-A: Swap Math Day 1 P5 with Tasviriy san'at Day 3 P5
  const l4a_m = currentLessons.find(l => l.class.name === '4-A' && l.dayOfWeek === 1 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  const l4a_ts = currentLessons.find(l => l.class.name === '4-A' && l.dayOfWeek === 3 && l.periodNumber === 5);
  if (l4a_m && l4a_ts) swap(l4a_m.id, l4a_ts.id);

  // 4-B: Move Math Day 1 P5 to Day 3 P5 (free)
  const l4b_m = currentLessons.find(l => l.class.name === '4-B' && l.dayOfWeek === 1 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  if (l4b_m) move(l4b_m.id, 3, 5);

  // 4-D: Swap Math Day 4 P5 with Tarbiya Day 3 P5
  const l4d_m = currentLessons.find(l => l.class.name === '4-D' && l.dayOfWeek === 4 && l.periodNumber === 5 && l.subject.name.toLowerCase().includes('matematika'));
  const l4d_tr = currentLessons.find(l => l.class.name === '4-D' && l.dayOfWeek === 3 && l.periodNumber === 5);
  if (l4d_m && l4d_tr) swap(l4d_m.id, l4d_tr.id);

  const rem = evaluate(currentLessons, classes, subjects, teachers, shifts);
  console.log('After Clean Primary Fixes:', rem.length);
  rem.forEach(c => console.log(`- [${c.type}] ${c.desc}`));

  await prisma.$disconnect();
}

main().catch(console.error);
