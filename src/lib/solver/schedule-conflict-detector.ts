import { Lesson, SchoolClass, Subject, Teacher } from "@/types";
import { getOfficialMethodDayForSubject, getEffectiveTeacherMethodDay } from "@/lib/constants/method-days";
import { isClassSecondShift } from "@/lib/utils";

export const WEEKDAY_NAMES = [
  "",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];

export interface ScheduleConflictItem {
  id: string;
  type: "TEACHER_COLLISION" | "SAME_DAY_DUPLICATE" | "METHOD_DAY" | "PRIMARY_SATURDAY";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  title: string;
  description: string;
  className: string;
  classId: string;
  subjectName: string;
  subjectId: string;
  teacherName: string;
  teacherId: string;
  teacherNumber?: number;
  dayOfWeek: number;
  dayName: string;
  periodNumber: number;
  affectedLessonIds: string[];
  recommendation: string;
}

export interface ConflictDetectionResult {
  conflicts: ScheduleConflictItem[];
  conflictLessonIds: Set<string>;
  totalConflictsCount: number;
  criticalCollisionsCount: number;
  duplicateSubjectCount: number;
  methodDayCount: number;
  primarySaturdayCount: number;
}

/**
 * Yagona Haqiqat Manbai (Single Source of Truth) — Dars Jadvali Ziddiyatlarini Aniqlash Dvigateli
 * Barcha komponentlar (Official39TableView, MasterGrid, ScheduleConflictAuditModal, CSP Solver)
 * aynan shu funksiya orqali ziddiyatlarni bir xil hisoblaydi.
 */
export function detectScheduleConflicts({
  lessons = [],
  classes = [],
  subjects = [],
  teachers = [],
}: {
  lessons: Lesson[];
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
}): ConflictDetectionResult {
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  const conflicts: ScheduleConflictItem[] = [];
  const conflictLessonIds = new Set<string>();

  // ─── 1. O'QITUVCHILAR TO'QNASHUVI (TEACHER COLLISIONS) ─────────────────────────
  // Bir o'qituvchi bir vaqtning o'zida bir nechta sinfda dars o'tishi (Smena bo'yicha ajratilgan)
  const teacherSlotMap = new Map<string, Lesson[]>();
  for (const l of lessons) {
    if (!l.teacherId) continue;
    const cls = classMap.get(l.classId);
    const shiftGroup = isClassSecondShift(cls) ? "shift2" : "shift1";
    const key = `${l.teacherId}_${l.dayOfWeek}_${l.periodNumber}_${shiftGroup}`;
    const existing = teacherSlotMap.get(key) || [];
    existing.push(l);
    teacherSlotMap.set(key, existing);
  }

  teacherSlotMap.forEach((matchedLessons, key) => {
    // Agar darslar bir xil sinfda bo'lsa yoki bitta dars bo'lsa kolliziya emas
    if (matchedLessons.length > 1) {
      // Bir nechta sinfga tegishlimi tekshiramiz
      const distinctClasses = new Set(matchedLessons.map((l) => l.classId));
      if (distinctClasses.size > 1) {
        matchedLessons.forEach((l) => conflictLessonIds.add(l.id));

        const first = matchedLessons[0];
        const teacher = teacherMap.get(first.teacherId);
        const is2 = isClassSecondShift(classMap.get(first.classId));
        const shiftLabel = is2 ? "2-smena (Abetdan keyin)" : "1-smena (Abetgacha)";
        const classNames = matchedLessons
          .map((l) => classMap.get(l.classId)?.name || "Sinf")
          .join(" va ");
        const subNames = Array.from(
          new Set(matchedLessons.map((l) => subjectMap.get(l.subjectId)?.name || "Fan"))
        ).join(", ");

        conflicts.push({
          id: `collision_${key}`,
          type: "TEACHER_COLLISION",
          severity: "CRITICAL",
          title: `O'qituvchi Kolliziyasi (${matchedLessons.length} ta sinfda bir vaqtda)`,
          description: `${teacher?.fullName || "O'qituvchi"} bir vaqtning o'zida (${WEEKDAY_NAMES[first.dayOfWeek]}, ${shiftLabel} ${first.periodNumber}-dars) ${classNames} sinflariga (${subNames}) dars o'tishi kerak bo'lib qolgan.`,
          className: classNames,
          classId: first.classId,
          subjectName: subNames,
          subjectId: first.subjectId,
          teacherName: teacher?.fullName || "O'qituvchi",
          teacherId: first.teacherId,
          teacherNumber: teacher?.displayNumber,
          dayOfWeek: first.dayOfWeek,
          dayName: WEEKDAY_NAMES[first.dayOfWeek] || `${first.dayOfWeek}-kun`,
          periodNumber: first.periodNumber,
          affectedLessonIds: matchedLessons.map((l) => l.id),
          recommendation: `Darslardan birini o'qituvchi bo'sh bo'lgan boshqa soatga ko'chiring yoki AI bilan to'g'rilang.`,
        });
      }
    }
  });

  // ─── 2. BIR KUNDA BIR XIL FAN TAKRORI (SAME DAY DUPLICATE) ───────────────────
  // Qoida 1: Kuniga 3 yoki undan ortiq soat bo'lsa -> Qat'iy ziddiyat!
  // Qoida 2: Kuniga 2 soat bo'lib, lekin allowDoubleLesson: false bo'lsa -> Qat'iy ziddiyat!
  // Qoida 3: Kuniga 2 soat bo'lib, lekin ketma-ket bo'lmasa (orasi uzilgan bo'lsa) -> Qat'iy ziddiyat!
  const classDaySubjectMap = new Map<string, Lesson[]>();
  for (const l of lessons) {
    if (!l.classId || !l.subjectId || !l.dayOfWeek) continue;
    const key = `${l.classId}_${l.dayOfWeek}_${l.subjectId}`;
    const existing = classDaySubjectMap.get(key) || [];
    existing.push(l);
    classDaySubjectMap.set(key, existing);
  }

  classDaySubjectMap.forEach((matchedLessons, key) => {
    if (matchedLessons.length > 1) {
      matchedLessons.sort((a, b) => a.periodNumber - b.periodNumber);
      const first = matchedLessons[0];
      const cls = classMap.get(first.classId);
      const subject = subjectMap.get(first.subjectId);
      const teacher = teacherMap.get(first.teacherId);
      const periods = matchedLessons.map((m) => `${m.periodNumber}-dars`).join(", ");

      const isTripleOrMore = matchedLessons.length >= 3;
      const isConsecutivePair =
        matchedLessons.length === 2 &&
        matchedLessons[1].periodNumber - matchedLessons[0].periodNumber === 1;
      const allowsDouble = subject?.allowDoubleLesson ?? false;

      // Agar 3+ soat bo'lsa YOKI juft dars taqiqlangan fanda 2 soat bo'lsa YOKI juft dars orasi uzilgan bo'lsa
      const isViolation = isTripleOrMore || !allowsDouble || !isConsecutivePair;

      if (isViolation) {
        matchedLessons.forEach((l) => conflictLessonIds.add(l.id));

        let reasonText = "";
        if (isTripleOrMore) {
          reasonText = `kuniga ${matchedLessons.length} soat (${periods}) ketma-ket qo'yilgan. Maktab me'yori bo'yicha bu fanga kuniga ko'pi bilan 1-2 soat ruxsat beriladi.`;
        } else if (!allowsDouble) {
          reasonText = `kuniga 2 marta (${periods}) qo'yilgan. Bu fanga juft dars o'tish taqiqlangan.`;
        } else {
          reasonText = `kuniga 2 soat (${periods}) orasi uzilgan holda qo'yilgan. Juft darslar faqat ketma-ket bo'lishi shart!`;
        }

        conflicts.push({
          id: `duplicate_${key}`,
          type: "SAME_DAY_DUPLICATE",
          severity: isTripleOrMore ? "CRITICAL" : "HIGH",
          title: `Bir Kunda Fan Qoidabuzarligi (${subject?.name || "Fan"})`,
          description: `${cls?.name || "Sinf"}da ${WEEKDAY_NAMES[first.dayOfWeek]} kuni ${subject?.name || "Fan"} darsi ${reasonText}`,
          className: cls?.name || "Sinf",
          classId: first.classId,
          subjectName: subject?.name || "Fan",
          subjectId: first.subjectId,
          teacherName: teacher?.fullName || "O'qituvchi",
          teacherId: first.teacherId,
          teacherNumber: teacher?.displayNumber,
          dayOfWeek: first.dayOfWeek,
          dayName: WEEKDAY_NAMES[first.dayOfWeek] || `${first.dayOfWeek}-kun`,
          periodNumber: first.periodNumber,
          affectedLessonIds: matchedLessons.map((l) => l.id),
          recommendation: `Ortiqcha darslarni haftaning boshqa kunlariga teng taqsimlang yoki ketma-ket qiling.`,
        });
      }
    }
  });

  // ─── 3. METOD KUNI BUZILISHI (METHOD DAY VIOLATIONS) ──────────────────────────
  for (const l of lessons) {
    const teacher = teacherMap.get(l.teacherId);
    const subject = subjectMap.get(l.subjectId);
    const cls = classMap.get(l.classId);

    const teacherMethodInfo = teacher
      ? getEffectiveTeacherMethodDay(teacher, subjects)
      : { day: null, dayName: null, source: "NONE" };

    const isTeacherMethodDay = teacherMethodInfo.day === l.dayOfWeek;

    const subjectMethodDay =
      subject?.methodDayOfWeek !== undefined && subject?.methodDayOfWeek !== null
        ? subject.methodDayOfWeek
        : getOfficialMethodDayForSubject(subject?.name || l.subjectId);

    const isSubjectMethodDay = subjectMethodDay === l.dayOfWeek;

    if (isTeacherMethodDay || isSubjectMethodDay) {
      conflictLessonIds.add(l.id);

      const targetEntity = isTeacherMethodDay
        ? `${teacher?.fullName || "O'qituvchi"}ning metod kuni`
        : `${subject?.name || "Fan"}ning rasmiy metod kuni`;

      conflicts.push({
        id: `method_${l.id}`,
        type: "METHOD_DAY",
        severity: "CRITICAL",
        title: `Metod Kunida Dars Qo'yilgan`,
        description: `${cls?.name || "Sinf"}da ${WEEKDAY_NAMES[l.dayOfWeek]} kuni ${l.periodNumber}-darsga ${subject?.name || "Fan"} qo'yilgan. Bu kun ${targetEntity} hisoblanadi.`,
        className: cls?.name || "Sinf",
        classId: l.classId,
        subjectName: subject?.name || "Fan",
        subjectId: l.subjectId,
        teacherName: teacher?.fullName || "O'qituvchi",
        teacherId: l.teacherId,
        teacherNumber: teacher?.displayNumber,
        dayOfWeek: l.dayOfWeek,
        dayName: WEEKDAY_NAMES[l.dayOfWeek] || `${l.dayOfWeek}-kun`,
        periodNumber: l.periodNumber,
        affectedLessonIds: [l.id],
        recommendation: `Ushbu darsni haftaning boshqa bo'sh kuniga o'tkazing.`,
      });
    }
  }

  // ─── 4. BOSHLANG'ICH SINFDA SHANBA KUNI DARSI ─────────────────────────────────
  for (const l of lessons) {
    const cls = classMap.get(l.classId);
    if (l.dayOfWeek === 6 && (cls?.isPrimary || (cls?.grade !== undefined && cls.grade <= 4))) {
      conflictLessonIds.add(l.id);

      const subject = subjectMap.get(l.subjectId);
      const teacher = teacherMap.get(l.teacherId);

      conflicts.push({
        id: `primary_sat_${l.id}`,
        type: "PRIMARY_SATURDAY",
        severity: "MEDIUM",
        title: `Boshlang'ich Sinfda Shanba Darsi`,
        description: `${cls?.name} boshlang'ich sinf bo'lib, Shanba kuni dam olish kuni hisoblanadi. Unda ${l.periodNumber}-darsga ${subject?.name || "Fan"} qo'yilgan.`,
        className: cls?.name || "Sinf",
        classId: l.classId,
        subjectName: subject?.name || "Fan",
        subjectId: l.subjectId,
        teacherName: teacher?.fullName || "O'qituvchi",
        teacherId: l.teacherId,
        teacherNumber: teacher?.displayNumber,
        dayOfWeek: 6,
        dayName: "Shanba",
        periodNumber: l.periodNumber,
        affectedLessonIds: [l.id],
        recommendation: `Darsni Dushanba-Juma oralig'idagi soatlarga ko'chiring.`,
      });
    }
  }

  return {
    conflicts,
    conflictLessonIds,
    totalConflictsCount: conflicts.length,
    criticalCollisionsCount: conflicts.filter((c) => c.type === "TEACHER_COLLISION").length,
    duplicateSubjectCount: conflicts.filter((c) => c.type === "SAME_DAY_DUPLICATE").length,
    methodDayCount: conflicts.filter((c) => c.type === "METHOD_DAY").length,
    primarySaturdayCount: conflicts.filter((c) => c.type === "PRIMARY_SATURDAY").length,
  };
}
