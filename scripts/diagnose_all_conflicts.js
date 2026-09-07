const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Inline detectScheduleConflicts logic from src/lib/solver/schedule-conflict-detector.ts
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

// Method days
const SUBJECT_METHOD_DAYS = {
  "ona tili": 2, // Seshanba
  "adabiyot": 2,
  "matematika": 3, // Chorshanba
  "algebra": 3,
  "geometriya": 3,
  "informatika": 3,
  "fizika": 3,
  "astronomiya": 3,
  "tarix": 4, // Payshanba
  "huquq": 4,
  "tarbiya": 4,
  "iqtisod": 4,
  "ingliz tili": 5, // Juma
  "nemis tili": 5,
  "fransuz tili": 5,
  "rus tili": 5,
  "kimyo": 6, // Shanba
  "biologiya": 6,
  "geografiya": 6,
  "tabiiy fan": 6,
  "tasviriy san'at": 1, // Dushanba
  "chizmachilik": 1,
  "musiqa": 1,
  "texnologiya": 1,
  "jismoniy tarbiya": 1,
  "chaq": 1,
};

function getEffectiveTeacherMethodDay(teacher, subjects) {
  if (teacher.methodDay !== undefined && teacher.methodDay !== null && teacher.methodDay >= 1 && teacher.methodDay <= 6) {
    return { day: teacher.methodDay, dayName: WEEKDAY_NAMES[teacher.methodDay], source: "TEACHER_SETTING" };
  }
  // Try from subject
  const tSubjects = teacher.subjects ? teacher.subjects.map(ts => ts.subject) : [];
  for (const s of tSubjects) {
    if (!s || !s.name) continue;
    const sName = s.name.toLowerCase();
    for (const [subKey, d] of Object.entries(SUBJECT_METHOD_DAYS)) {
      if (sName.includes(subKey)) {
        return { day: d, dayName: WEEKDAY_NAMES[d], source: "SUBJECT" };
      }
    }
  }
  return { day: null, dayName: null, source: "NONE" };
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

  console.log(`Jami darslar: ${lessons.length}, Sinflar: ${classes.length}, Fanlar: ${subjects.length}, O'qituvchilar: ${teachers.length}`);

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

  teacherSlotMap.forEach((matchedLessons, key) => {
    if (matchedLessons.length > 1) {
      const distinctClasses = new Set(matchedLessons.map(l => l.classId));
      if (distinctClasses.size > 1) {
        const first = matchedLessons[0];
        const teacher = teacherMap.get(first.teacherId);
        const classNames = matchedLessons.map(l => classMap.get(l.classId)?.name).join(' & ');
        conflicts.push({
          type: 'TEACHER_COLLISION',
          teacher: teacher?.fullName,
          teacherId: first.teacherId,
          day: WEEKDAY_NAMES[first.dayOfWeek],
          dayOfWeek: first.dayOfWeek,
          period: first.periodNumber,
          classes: classNames,
          lessonCount: matchedLessons.length,
          lessonIds: matchedLessons.map(l => l.id),
          lessons: matchedLessons.map(l => ({
            id: l.id,
            class: classMap.get(l.classId)?.name,
            subject: subjectMap.get(l.subjectId)?.name,
            group: l.groupType
          }))
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

  classDaySubjectMap.forEach((matchedLessons, key) => {
    const uniquePeriods = Array.from(new Set(matchedLessons.map(m => m.periodNumber))).sort((a, b) => a - b);
    if (uniquePeriods.length > 1) {
      const first = matchedLessons[0];
      const cls = classMap.get(first.classId);
      const subject = subjectMap.get(first.subjectId);
      const isPrimary = (cls?.grade ?? 5) <= 4;
      const isTripleOrMore = uniquePeriods.length >= 3;
      const isConsecutivePair = uniquePeriods.length === 2 && (uniquePeriods[1] - uniquePeriods[0] === 1);
      const allowsDouble = !isPrimary && (subject?.allowDoubleLesson ?? false);

      const isViolation = isPrimary || isTripleOrMore || !allowsDouble || !isConsecutivePair;
      if (isViolation) {
        conflicts.push({
          type: 'SAME_DAY_DUPLICATE',
          class: cls?.name,
          subject: subject?.name,
          day: WEEKDAY_NAMES[first.dayOfWeek],
          dayOfWeek: first.dayOfWeek,
          periods: uniquePeriods,
          reason: isPrimary ? 'Boshlang\'ichda 1 kunda 2+ soat' : isTripleOrMore ? '3+ soat' : !allowsDouble ? 'Juft dars taqiqlangan' : 'Juft dars orasi uzilgan',
          lessonIds: matchedLessons.map(l => l.id)
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

    const teacherMethodInfo = teacher ? getEffectiveTeacherMethodDay(teacher, subjects) : { day: null };
    if (teacherMethodInfo.day === l.dayOfWeek) {
      conflicts.push({
        type: 'METHOD_DAY',
        teacher: teacher?.fullName,
        class: cls?.name,
        subject: subject?.name,
        day: WEEKDAY_NAMES[l.dayOfWeek],
        dayOfWeek: l.dayOfWeek,
        period: l.periodNumber,
        lessonId: l.id
      });
    }
  }

  // 4. PRIMARY SATURDAY
  for (const l of lessons) {
    const cls = classMap.get(l.classId);
    if (l.dayOfWeek === 6 && (cls?.isPrimary || (cls?.grade !== undefined && cls.grade <= 4))) {
      const subject = subjectMap.get(l.subjectId);
      conflicts.push({
        type: 'PRIMARY_SATURDAY',
        class: cls?.name,
        subject: subject?.name,
        period: l.periodNumber,
        lessonId: l.id
      });
    }
  }

  console.log(`\n====================================================`);
  console.log(`JAMI TOPILGAN ZIDDIYATLAR (KONFLIKTLAR): ${conflicts.length} TA`);
  console.log(`====================================================`);

  const byType = {};
  for (const c of conflicts) {
    byType[c.type] = (byType[c.type] || 0) + 1;
  }
  console.log('Turlar bo\'yicha:', byType);

  console.log('\n--- 1. TEACHER COLLISIONS (O\'qituvchi to\'qnashuvlari) ---');
  conflicts.filter(c => c.type === 'TEACHER_COLLISION').forEach(c => {
    console.log(`❌ ${c.teacher} | ${c.day} ${c.period}-para | Sinflar: ${c.classes}`);
    c.lessons.forEach(l => console.log(`   - ${l.class} ${l.subject} (${l.group}) [id: ${l.id}]`));
  });

  console.log('\n--- 2. SAME DAY DUPLICATE (Bir kunda bir xil fan) ---');
  conflicts.filter(c => c.type === 'SAME_DAY_DUPLICATE').forEach(c => {
    console.log(`⚠️ ${c.class} | ${c.subject} | ${c.day} | Paralar: ${c.periods.join(', ')} | Sabab: ${c.reason}`);
  });

  console.log('\n--- 3. METHOD DAY (Metod kuni buzilishi) ---');
  conflicts.filter(c => c.type === 'METHOD_DAY').forEach(c => {
    console.log(`⚠️ ${c.teacher} | ${c.class} - ${c.subject} | ${c.day} ${c.period}-para`);
  });

  console.log('\n--- 4. PRIMARY SATURDAY (Boshlang\'ich Shanba darsi) ---');
  conflicts.filter(c => c.type === 'PRIMARY_SATURDAY').forEach(c => {
    console.log(`⚠️ ${c.class} | ${c.subject} | Shanba ${c.period}-para`);
  });

  await prisma.$disconnect();
}

main().catch(console.error);
