import { Lesson, SchoolClass, Subject, Teacher } from "@/types";
import { detectScheduleConflicts, WEEKDAY_NAMES } from "./schedule-conflict-detector";
import { getOfficialMethodDayForSubject, getEffectiveTeacherMethodDay } from "@/lib/constants/method-days";

export interface ConflictCauseAnalysis {
  type: "TEACHER_COLLISION" | "METHOD_DAY" | "SAME_DAY_DUPLICATE" | "PRIMARY_SATURDAY" | "UNKNOWN";
  title: string;
  explanation: string;
  collidingLessons: Lesson[];
  collidingTeacher?: Teacher;
  collidingSubject?: Subject;
  collidingClasses: SchoolClass[];
}

export interface ConflictSolutionOption {
  id: string;
  type: "RELOCATE" | "SWAP" | "SUBSTITUTE_TEACHER" | "REMOVE";
  badge: string;
  badgeColor: string; // e.g. "emerald", "blue", "indigo", "rose"
  title: string;
  description: string;
  impactScore: number; // 0 = eng yaxshi (0 yangi ziddiyat)
  actionData: {
    targetDay?: number;
    targetPeriod?: number;
    swapWithLessonId?: string;
    newTeacherId?: string;
  };
}

export interface ConflictResolutionPlan {
  lessonId: string;
  lesson: Lesson;
  cls: SchoolClass;
  subject?: Subject;
  teacher?: Teacher;
  cause: ConflictCauseAnalysis;
  solutions: ConflictSolutionOption[];
}

/**
 * Ziddiyatli dars uchun sabablarni va 100% xavfsiz (Zero-Ripple) yechimlarni hisoblovchi dvigatel
 */
export function generateConflictResolutionPlan({
  targetLesson,
  classes,
  teachers,
  subjects,
  allLessons,
}: {
  targetLesson: Lesson;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  allLessons: Lesson[];
}): ConflictResolutionPlan {
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const currentClass = classMap.get(targetLesson.classId) || {
    id: targetLesson.classId,
    name: "Sinf",
    grade: 5,
    schoolId: targetLesson.schoolId,
    branchId: targetLesson.branchId,
  } as SchoolClass;

  const currentSubject = subjectMap.get(targetLesson.subjectId);
  const currentTeacher = teacherMap.get(targetLesson.teacherId);

  // 1. ZIDDIYAT SABABINI ANIQLASH (ROOT CAUSE ANALYSIS)
  const cause = analyzeConflictCause({
    targetLesson,
    classes,
    teachers,
    subjects,
    allLessons,
  });

  // 2. BO'SH VA XAVFSIZ VAQTLARNI QIDIRISH (SAFE RELOCATION)
  const relocationOptions = findSafeRelocationSlots({
    targetLesson,
    currentClass,
    currentSubject,
    currentTeacher,
    classes,
    teachers,
    subjects,
    allLessons,
  });

  // 3. XAVFSIZ ALMASHTIRISHNI QIDIRISH (SAFE SWAP)
  const swapOptions = findSafeSwaps({
    targetLesson,
    currentClass,
    currentSubject,
    currentTeacher,
    classes,
    teachers,
    subjects,
    allLessons,
  });

  // 4. BO'SH BO'LGAN BOSHQA O'QITUVCHINI QIDIRISH (SUBSTITUTE TEACHER)
  const substituteOptions = findAlternativeTeachers({
    targetLesson,
    currentClass,
    currentSubject,
    currentTeacher,
    classes,
    teachers,
    subjects,
    allLessons,
  });

  // 5. BO'SHATISH / O'CHIRISH (FALLBACK OPTION)
  const removeOption: ConflictSolutionOption = {
    id: `remove_${targetLesson.id}`,
    type: "REMOVE",
    badge: "Jadvaldan olish",
    badgeColor: "rose",
    title: "Darsni jadval katagidan bo'shatish",
    description: `Ushbu darsni ayni vaqtdagi jadval katagidan o'chirib, o'qituvchi va sinfning taqsimot fondida saqlab turish.`,
    impactScore: 0,
    actionData: {},
  };

  const allSolutions: ConflictSolutionOption[] = [
    ...relocationOptions,
    ...swapOptions,
    ...substituteOptions,
    removeOption,
  ];

  return {
    lessonId: targetLesson.id,
    lesson: targetLesson,
    cls: currentClass,
    subject: currentSubject,
    teacher: currentTeacher,
    cause,
    solutions: allSolutions,
  };
}

/**
 * Ziddiyat sababini chuqur tahlil qilish
 */
function analyzeConflictCause({
  targetLesson,
  classes,
  teachers,
  subjects,
  allLessons,
}: {
  targetLesson: Lesson;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  allLessons: Lesson[];
}): ConflictCauseAnalysis {
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  const currentClass = classMap.get(targetLesson.classId);
  const currentTeacher = teacherMap.get(targetLesson.teacherId);
  const currentSubject = subjectMap.get(targetLesson.subjectId);
  const dayName = WEEKDAY_NAMES[targetLesson.dayOfWeek] || `${targetLesson.dayOfWeek}-kun`;

  // Tekshiruv A: O'qituvchi boshqa sinfda ham shu soatda darsdami?
  const sameTimeLessons = allLessons.filter(
    (l) =>
      l.id !== targetLesson.id &&
      l.teacherId === targetLesson.teacherId &&
      l.dayOfWeek === targetLesson.dayOfWeek &&
      l.periodNumber === targetLesson.periodNumber
  );

  if (sameTimeLessons.length > 0) {
    const collidingClasses = sameTimeLessons
      .map((l) => classMap.get(l.classId))
      .filter(Boolean) as SchoolClass[];
    const collidingClassNames = collidingClasses.map((c) => c.name).join(", ");

    return {
      type: "TEACHER_COLLISION",
      title: "O'qituvchi Vaqti To'qnashuvi",
      explanation: `${currentTeacher?.fullName || "O'qituvchi"} ayni shu paytda (${dayName}, ${targetLesson.periodNumber}-soat) ${collidingClassNames} sinfida ham darsga qo'yilgan. O'qituvchi bir vaqtda ikkita sinfda dars o'ta olmaydi!`,
      collidingLessons: sameTimeLessons,
      collidingTeacher: currentTeacher,
      collidingSubject: currentSubject,
      collidingClasses,
    };
  }

  // Tekshiruv B: Bitta sinfda bir kunda bir xil fan takrorlanishi
  const sameDaySameSubject = allLessons.filter(
    (l) =>
      l.id !== targetLesson.id &&
      l.classId === targetLesson.classId &&
      l.dayOfWeek === targetLesson.dayOfWeek &&
      l.subjectId === targetLesson.subjectId
  );

  if (sameDaySameSubject.length > 0) {
    return {
      type: "SAME_DAY_DUPLICATE",
      title: "Bir Kunda Takroriy Fan",
      explanation: `${currentClass?.name || "Ushbu sinf"}da ${dayName} kunida "${currentSubject?.name || "Fan"}" fani 2 marta qo'yilgan. Qoidaga ko'ra, bitta sinfda bir kunda bir xil fan qaytarilishi mumkin emas.`,
      collidingLessons: sameDaySameSubject,
      collidingTeacher: currentTeacher,
      collidingSubject: currentSubject,
      collidingClasses: currentClass ? [currentClass] : [],
    };
  }

  // Tekshiruv C: Metod kuni
  const teacherMethodDay = currentTeacher ? getEffectiveTeacherMethodDay(currentTeacher)?.day ?? null : null;
  const subMethodDay = currentSubject
    ? currentSubject.methodDayOfWeek ?? getOfficialMethodDayForSubject(currentSubject.name)
    : null;

  if (teacherMethodDay === targetLesson.dayOfWeek || subMethodDay === targetLesson.dayOfWeek) {
    const reason =
      teacherMethodDay === targetLesson.dayOfWeek
        ? `${currentTeacher?.fullName} uchun ${dayName} kuni rasmiy Metod kuni!`
        : `"${currentSubject?.name}" fani uchun ${dayName} kuni rasmiy Metod kuni hisoblanadi!`;

    return {
      type: "METHOD_DAY",
      title: "Rasmiy Metod Kuni Cheklovi",
      explanation: `${reason} Metod kunida o'qituvchiga dars qo'yish pedagogik mezonlarga zid.`,
      collidingLessons: [],
      collidingTeacher: currentTeacher,
      collidingSubject: currentSubject,
      collidingClasses: currentClass ? [currentClass] : [],
    };
  }

  // Tekshiruv D: Boshlang'ich Shanba
  if (targetLesson.dayOfWeek === 6 && (currentClass?.isPrimary || (currentClass?.grade && currentClass.grade <= 4))) {
    return {
      type: "PRIMARY_SATURDAY",
      title: "Boshlang'ich Sinflarda 5 Kunlik Haftalik",
      explanation: `Boshlang'ich (1-4) sinflar O'zbekiston standartida 5 kunlik o'qish haftasiga ega. Shanba kuni boshlang'ich sinfga dars qo'yish mumkin emas.`,
      collidingLessons: [],
      collidingTeacher: currentTeacher,
      collidingSubject: currentSubject,
      collidingClasses: currentClass ? [currentClass] : [],
    };
  }

  return {
    type: "UNKNOWN",
    title: "Dars Ziddiyati",
    explanation: "Ushbu darsda SanPiN yoki o'qituvchi bandligi bo'yicha ziddiyat aniqlangan.",
    collidingLessons: [],
    collidingTeacher: currentTeacher,
    collidingSubject: currentSubject,
    collidingClasses: currentClass ? [currentClass] : [],
  };
}

/**
 * Zero-Ripple tekshiruvi: O'zgarish kiritilgach butun jadvaldagi ziddiyatlar sonini hisoblash
 */
function simulateAndCheckConflicts({
  simulatedLessons,
  classes,
  subjects,
  teachers,
}: {
  simulatedLessons: Lesson[];
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
}): number {
  const result = detectScheduleConflicts({
    lessons: simulatedLessons,
    classes,
    subjects,
    teachers,
  });
  return result.totalConflictsCount;
}

/**
 * 2. Bo'sh va xavfsiz vaqtlarni topish (Safe Relocation)
 */
function findSafeRelocationSlots({
  targetLesson,
  currentClass,
  currentSubject,
  currentTeacher,
  classes,
  teachers,
  subjects,
  allLessons,
}: {
  targetLesson: Lesson;
  currentClass: SchoolClass;
  currentSubject?: Subject;
  currentTeacher?: Teacher;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  allLessons: Lesson[];
}): ConflictSolutionOption[] {
  const options: ConflictSolutionOption[] = [];
  const maxDay = currentClass.grade <= 4 ? 5 : 6;
  const maxPeriod = currentClass.grade <= 4 ? 5 : 6;

  // Dushanba 1-soat har doim Sinf soati uchun ajratilgan (agar bu dars sinf soati bo'lmasa, D1 P1 ga ko'chirmaymiz)
  const isSinfSoati = targetLesson.subjectId === "sub_sinf_soati" || targetLesson.subjectId === "sub_kelajak";

  for (let day = 1; day <= maxDay; day++) {
    // Agar o'qituvchining metod kuni bo'lsa o'tkazib yuboramiz
    if (currentTeacher) {
      const mDay = getEffectiveTeacherMethodDay(currentTeacher)?.day;
      if (mDay === day) continue;
    }
    // Agar fanning metod kuni bo'lsa o'tkazib yuboramiz
    if (currentSubject) {
      const subMDay = currentSubject.methodDayOfWeek ?? getOfficialMethodDayForSubject(currentSubject.name);
      if (subMDay === day) continue;
    }

    for (let period = 1; period <= maxPeriod; period++) {
      // Dushanba 1-soat faqat sinf soati uchun
      if (day === 1 && period === 1 && !isSinfSoati) continue;
      // Ayni hozirgi vaqt bo'lsa o'tkazamiz
      if (day === targetLesson.dayOfWeek && period === targetLesson.periodNumber) continue;

      // Sinf bu vaqtda bo'shmi?
      const classHasLesson = allLessons.some(
        (l) => l.classId === currentClass.id && l.dayOfWeek === day && l.periodNumber === period
      );
      if (classHasLesson) continue;

      // O'qituvchi bu vaqtda bo'shmi?
      if (currentTeacher) {
        const teacherHasLesson = allLessons.some(
          (l) => l.teacherId === currentTeacher.id && l.dayOfWeek === day && l.periodNumber === period
        );
        if (teacherHasLesson) continue;
      }

      // Sinfda shu kuni bu fan allaqachon bormi?
      const classHasSubjectThatDay = allLessons.some(
        (l) =>
          l.id !== targetLesson.id &&
          l.classId === currentClass.id &&
          l.dayOfWeek === day &&
          l.subjectId === targetLesson.subjectId
      );
      if (classHasSubjectThatDay) continue;

      // Zero-Ripple Simulyatsiyasi
      const simulatedLessons = allLessons.map((l) =>
        l.id === targetLesson.id
          ? { ...l, dayOfWeek: day, periodNumber: period }
          : l
      );

      const conflictsCount = simulateAndCheckConflicts({
        simulatedLessons,
        classes,
        subjects,
        teachers,
      });

      const dayName = WEEKDAY_NAMES[day];
      options.push({
        id: `relocate_${day}_${period}`,
        type: "RELOCATE",
        badge: conflictsCount === 0 ? "🟢 100% Xavfsiz" : "🟡 Kichik ogohlantirish",
        badgeColor: conflictsCount === 0 ? "emerald" : "amber",
        title: `${dayName}, ${period}-soatga ko'chirish`,
        description: `${currentClass.name} sinfi va ${currentTeacher?.fullName || "O'qituvchi"} ayni shu paytda butunlay bo'sh. Ko'chirilsa ziddiyat to'liq barham topadi.`,
        impactScore: conflictsCount,
        actionData: {
          targetDay: day,
          targetPeriod: period,
        },
      });

      if (options.length >= 3) break;
    }
    if (options.length >= 3) break;
  }

  return options.sort((a, b) => a.impactScore - b.impactScore);
}

/**
 * 3. Sinf ichidagi boshqa darslar bilan xavfsiz almashtirish (Safe Swap)
 */
function findSafeSwaps({
  targetLesson,
  currentClass,
  currentSubject,
  currentTeacher,
  classes,
  teachers,
  subjects,
  allLessons,
}: {
  targetLesson: Lesson;
  currentClass: SchoolClass;
  currentSubject?: Subject;
  currentTeacher?: Teacher;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  allLessons: Lesson[];
}): ConflictSolutionOption[] {
  const options: ConflictSolutionOption[] = [];

  // Sinfning o'zining boshqa qulflanmagan darslarini ko'ramiz
  const classLessons = allLessons.filter(
    (l) =>
      l.classId === currentClass.id &&
      l.id !== targetLesson.id &&
      !l.isLocked &&
      !(l.dayOfWeek === 1 && l.periodNumber === 1) // Kelajak soati bilan almashtirmaymiz
  );

  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  for (const partnerLesson of classLessons) {
    const partnerTeacher = teacherMap.get(partnerLesson.teacherId);
    const partnerSubject = subjectMap.get(partnerLesson.subjectId);

    // 1. targetTeacher partnerLesson vaqtida bo'shmi?
    if (currentTeacher) {
      const busy = allLessons.some(
        (l) =>
          l.id !== targetLesson.id &&
          l.id !== partnerLesson.id &&
          l.teacherId === currentTeacher.id &&
          l.dayOfWeek === partnerLesson.dayOfWeek &&
          l.periodNumber === partnerLesson.periodNumber
      );
      if (busy) continue;
    }

    // 2. partnerTeacher targetLesson vaqtida bo'shmi?
    if (partnerTeacher) {
      const busy = allLessons.some(
        (l) =>
          l.id !== targetLesson.id &&
          l.id !== partnerLesson.id &&
          l.teacherId === partnerTeacher.id &&
          l.dayOfWeek === targetLesson.dayOfWeek &&
          l.periodNumber === targetLesson.periodNumber
      );
      if (busy) continue;
    }

    // Zero-Ripple Simulyatsiyasi: ikkalasining o'rnini almashtirish
    const simulatedLessons = allLessons.map((l) => {
      if (l.id === targetLesson.id) {
        return { ...l, dayOfWeek: partnerLesson.dayOfWeek, periodNumber: partnerLesson.periodNumber };
      }
      if (l.id === partnerLesson.id) {
        return { ...l, dayOfWeek: targetLesson.dayOfWeek, periodNumber: targetLesson.periodNumber };
      }
      return l;
    });

    const conflictsCount = simulateAndCheckConflicts({
      simulatedLessons,
      classes,
      subjects,
      teachers,
    });

    if (conflictsCount <= 1) {
      const pDayName = WEEKDAY_NAMES[partnerLesson.dayOfWeek];
      options.push({
        id: `swap_${partnerLesson.id}`,
        type: "SWAP",
        badge: conflictsCount === 0 ? "🟢 Xavfsiz almashuv" : "🟡 Mumkin bo'lgan almashuv",
        badgeColor: conflictsCount === 0 ? "blue" : "amber",
        title: `"${partnerSubject?.name || "Fan"}" darsi bilan o'rin almashtirish`,
        description: `${pDayName}, ${partnerLesson.periodNumber}-soatdagi ${partnerTeacher?.fullName || "ustoz"} darsi bilan joy almashiladi. Har ikkala ustoz vaqtiga to'liq mos keladi.`,
        impactScore: conflictsCount,
        actionData: {
          swapWithLessonId: partnerLesson.id,
        },
      });

      if (options.length >= 2) break;
    }
  }

  return options;
}

/**
 * 4. Bo'sh bo'lgan boshqa muqobil o'qituvchini topish (Substitute / Reassign)
 */
function findAlternativeTeachers({
  targetLesson,
  currentClass,
  currentSubject,
  currentTeacher,
  classes,
  teachers,
  subjects,
  allLessons,
}: {
  targetLesson: Lesson;
  currentClass: SchoolClass;
  currentSubject?: Subject;
  currentTeacher?: Teacher;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  allLessons: Lesson[];
}): ConflictSolutionOption[] {
  const options: ConflictSolutionOption[] = [];
  if (!currentSubject) return options;

  // Ayni fanni o'ta oladigan boshqa o'qituvchilar
  const capableTeachers = teachers.filter(
    (t) =>
      t.id !== targetLesson.teacherId &&
      (t.subjectIds || []).includes(targetLesson.subjectId)
  );

  for (const altTeacher of capableTeachers) {
    // Bu ustoz ayni paytda bo'shmi?
    const isBusy = allLessons.some(
      (l) =>
        l.teacherId === altTeacher.id &&
        l.dayOfWeek === targetLesson.dayOfWeek &&
        l.periodNumber === targetLesson.periodNumber
    );
    if (isBusy) continue;

    // Metod kuni emasmi?
    const mDay = getEffectiveTeacherMethodDay(altTeacher)?.day;
    if (mDay === targetLesson.dayOfWeek) continue;

    // Zero-Ripple Simulyatsiyasi
    const simulatedLessons = allLessons.map((l) =>
      l.id === targetLesson.id ? { ...l, teacherId: altTeacher.id } : l
    );

    const conflictsCount = simulateAndCheckConflicts({
      simulatedLessons,
      classes,
      subjects,
      teachers,
    });

    options.push({
      id: `alt_teacher_${altTeacher.id}`,
      type: "SUBSTITUTE_TEACHER",
      badge: conflictsCount === 0 ? "🟢 Bo'sh mutaxassis" : "🟡 Zaxira ustoz",
      badgeColor: conflictsCount === 0 ? "indigo" : "amber",
      title: `Darsni ${altTeacher.fullName}ga topshirish`,
      description: `Ushbu ustoz ayni vaqtda mutlaqo bo'sh va "${currentSubject.name}" fani mutaxassisi hisoblanadi. Dars unga biriktirilsa, jadval vaqti o'zgarmasdan ziddiyat bartaraf bo'ladi.`,
      impactScore: conflictsCount,
      actionData: {
        newTeacherId: altTeacher.id,
      },
    });

    if (options.length >= 2) break;
  }

  return options;
}
