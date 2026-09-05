import { Lesson, SchoolClass, Subject, Teacher, Room, Shift, Branch } from "@/types";
import { getOfficialMethodDayForSubject, getEffectiveTeacherMethodDay } from "@/lib/constants/method-days";
import { isClassSecondShift } from "@/lib/utils";

export interface DropSlotValidation {
  status: "safe" | "warning" | "conflict";
  colorClass: string;
  badge: string;
  reason?: string;
  conflicts: string[];
}

const WEEKDAY_NAMES = [
  "",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];

/**
 * Drag & Drop paytida har bir katakchaning ziddiyat va yuklama holatini real-vaqtda tekshiruvchi funksiya
 */
export function validateDropSlot({
  draggedLesson,
  targetClass,
  targetDay,
  targetPeriod,
  allLessons,
  teachers,
  subjects,
  rooms = [],
  classes = [],
  shifts = [],
}: {
  draggedLesson: Lesson;
  targetClass: SchoolClass;
  targetDay: number;
  targetPeriod: number;
  allLessons: Lesson[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms?: Room[];
  classes?: SchoolClass[];
  shifts?: Shift[];
}): DropSlotValidation {
  const teacher = teachers.find((t) => t.id === draggedLesson.teacherId);
  const subject = subjects.find((s) => s.id === draggedLesson.subjectId);

  const conflicts: string[] = [];
  const warnings: string[] = [];

  // Boshqa darslar (o'zi bundan mustasno)
  const otherLessons = allLessons.filter((l) => l.id !== draggedLesson.id);

  // ─── 🔴 1. QIZIL: QAT'IY ZIDDIYATLAR (CONFLICTS) ───────────────────────────

  // 1.1. O'qituvchi kolliziyasi (Ayni shu paytda va ayni shu SMENADA boshqa sinfda darsi bor)
  const targetIsShift2 = isClassSecondShift(targetClass, shifts);
  const teacherOtherLesson = otherLessons.find((l) => {
    if (
      l.teacherId !== draggedLesson.teacherId ||
      l.dayOfWeek !== targetDay ||
      l.periodNumber !== targetPeriod
    ) {
      return false;
    }
    // Agar boshqa sinf ma'lum bo'lsa va u boshqa smenada bo'lsa (biri ertalab, biri tushdan keyin) -> to'qnashuv EMAS!
    const otherCls = classes.find((c) => c.id === l.classId);
    if (otherCls) {
      const otherIsShift2 = isClassSecondShift(otherCls, shifts);
      if (targetIsShift2 !== otherIsShift2) return false;
    }
    return true;
  });

  if (teacherOtherLesson) {
    conflicts.push(
      `⚠️ ${teacher?.fullName || "O'qituvchi"} ayni shu paytda boshqa sinfda darsda!`
    );
  }

  // 1.2. O'qituvchi yoki Fanning Rasmiy Metod Kuni (Method Day)
  const teacherMethodInfo = teacher
    ? getEffectiveTeacherMethodDay(teacher, subjects)
    : { day: null, dayName: null, source: "NONE" };

  const isTeacherMethodDay = teacherMethodInfo.day === targetDay;

  const subjectMethodDay =
    subject?.methodDayOfWeek !== undefined && subject.methodDayOfWeek !== null
      ? subject.methodDayOfWeek
      : getOfficialMethodDayForSubject(subject?.name || draggedLesson.subjectId);

  const isSubjectMethodDay = subjectMethodDay === targetDay;

  if (isTeacherMethodDay || isSubjectMethodDay) {
    const dayName = WEEKDAY_NAMES[targetDay] || `${targetDay}-kun`;
    const targetEntity = isTeacherMethodDay
      ? `${teacher?.fullName || "O'qituvchi"} (${teacherMethodInfo.source === "SUBJECT_OFFICIAL" ? `${teacherMethodInfo.subjectName} fani` : "shaxsiy"} metod kuni)`
      : `${subject?.name || "Fan"}`;
    conflicts.push(
      `🛑 ${targetEntity} uchun ${dayName} rasmiy Metod kuni! Dars qo'yish qat'iyan taqiqlanadi!`
    );
  }

  // 1.2.B. O'qituvchining Shaxsiy Bandlik Matrisasi (Teacher Availability - Shift Aware)
  if (teacher?.availabilities && teacher.availabilities.length > 0) {
    const targetPeriodKey = targetIsShift2 ? 10 + targetPeriod : targetPeriod;
    const av = teacher.availabilities.find(
      (a) => a.dayOfWeek === targetDay && a.period === targetPeriodKey
    );
    if (av && av.isAvailable === false) {
      const shiftName = targetIsShift2 ? "2-smena (Abetdan keyin)" : "1-smena (Ertalabki)";
      conflicts.push(
        `🛑 ${teacher.fullName} ushbu vaqtda (${shiftName}, ${targetPeriod}-soat) shaxsiy jadval bo'yicha band qilingan!`
      );
    }
  }

  // 1.3. Xona / Laboratoriya kolliziyasi
  if (draggedLesson.roomId) {
    const roomOccupied = otherLessons.find(
      (l) =>
        l.roomId === draggedLesson.roomId &&
        l.dayOfWeek === targetDay &&
        l.periodNumber === targetPeriod
    );
    if (roomOccupied) {
      const room = rooms.find((r) => r.id === draggedLesson.roomId);
      conflicts.push(`🚪 ${room?.name || "Xona"} ayni shu vaqtda boshqa dars bilan band!`);
    }
  }

  // 1.4. Boshlang'ich sinflar uchun Shanba kuni dars taqiqlanishi
  if (targetClass.isPrimary && targetDay === 6) {
    conflicts.push(`🧒 Boshlang'ich sinflar (${targetClass.name}) uchun Shanba dam olish kuni!`);
  }

  // 1.4.B. Sinfning Dam Kunlari yoki Band Soatlari
  if (targetClass.blockedDays && targetClass.blockedDays.includes(targetDay)) {
    const dayName = WEEKDAY_NAMES[targetDay] || `${targetDay}-kun`;
    conflicts.push(`🛑 ${targetClass.name} sinfi uchun ${dayName} dam kuni deb belgilangan!`);
  }
  if (
    targetClass.blockedPeriods &&
    targetClass.blockedPeriods.some((bp) => bp.dayOfWeek === targetDay && bp.periodNumber === targetPeriod)
  ) {
    conflicts.push(`🛑 ${targetClass.name} sinfida ushbu soat (${targetPeriod}-soat) band qilingan!`);
  }

  // 1.5. Bir kunda bitta sinfda bir xil fan takrorlanishi (QAT'IY QOIDA: 1 KUNDA 1 XIL DARS 2 MARTA BO'LMAYDI)
  const classSameDaySubject = otherLessons.find(
    (l) =>
      l.classId === targetClass.id &&
      l.subjectId === draggedLesson.subjectId &&
      l.dayOfWeek === targetDay
  );

  if (classSameDaySubject) {
    const dayName = WEEKDAY_NAMES[targetDay] || `${targetDay}-kun`;
    conflicts.push(
      `🛑 ${targetClass.name} sinfida ${dayName} kuni "${subject?.name || "ushbu fan"}" darsi allaqachon mavjud! Bir kunda bir xil fanni 2 marta qo'yish qat'iyan taqiqlanadi!`
    );
  }

  if (conflicts.length > 0) {
    return {
      status: "conflict",
      colorClass: "bg-rose-100/90 border-rose-500 ring-2 ring-rose-500 text-rose-950",
      badge: "🔴 Ziddiyat",
      reason: conflicts[0],
      conflicts,
    };
  }

  // ─── 🟡 2. SARIQ: OGOHLANTIRISHLAR (WARNINGS / SOFT CONSTRAINTS) ────────────

  // 2.1. O'qituvchining ketma-ket darslari limiti (> 4 soat ketma-ket)
  const teacherDayLessons = otherLessons.filter(
    (l) => l.teacherId === draggedLesson.teacherId && l.dayOfWeek === targetDay
  );

  const periodsThatDay = [...teacherDayLessons.map((l) => l.periodNumber), targetPeriod].sort(
    (a, b) => a - b
  );

  let consecutiveCount = 1;
  let maxConsecutive = 1;
  for (let i = 1; i < periodsThatDay.length; i++) {
    if (periodsThatDay[i] === periodsThatDay[i - 1] + 1) {
      consecutiveCount++;
      if (consecutiveCount > maxConsecutive) maxConsecutive = consecutiveCount;
    } else {
      consecutiveCount = 1;
    }
  }

  const teacherMaxAllowed = teacher?.maxConsecutiveHours || 4;
  const totalDayLessons = teacherDayLessons.length + 1;
  if (totalDayLessons > teacherMaxAllowed) {
    warnings.push(
      `⚡ ${teacher?.fullName || "O'qituvchi"} uchun kunlik dars limiti (${teacherMaxAllowed} soat) dan oshdi (Jami: ${totalDayLessons} soat)!`
    );
  } else if (maxConsecutive > teacherMaxAllowed) {
    warnings.push(
      `⚡ ${teacher?.fullName || "O'qituvchi"} uchun ketma-ket ${maxConsecutive} soat dars yuklamasi!`
    );
  }

  // 2.2. SanPiN: Yuqori murakkablikdagi fan kun oxiriga (6-7 soat) tushishi
  if (subject && subject.difficultyScore >= 11 && targetPeriod >= 6) {
    warnings.push(
      `📊 SanPiN me'yori: ${subject.name} og'ir fan bo'lib, kun oxiriga qo'yish tavsiya etilmaydi.`
    );
  }

  if (warnings.length > 0) {
    return {
      status: "warning",
      colorClass: "bg-amber-100/90 border-amber-500 ring-2 ring-amber-400 text-amber-950",
      badge: "🟡 Ogohlantirish",
      reason: warnings[0],
      conflicts: warnings,
    };
  }

  // ─── 🟢 3. YASHIL: TOZA VA XAVFSIZ JOY (SAFE / IDEAL) ─────────────────────
  return {
    status: "safe",
    colorClass: "bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-400 text-emerald-950",
    badge: "🟢 Xavfsiz",
    reason: "Darsni joylashtirish uchun xavfsiz va maqbul joy",
    conflicts: [],
  };
}
