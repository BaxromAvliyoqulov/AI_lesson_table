import { Lesson, SchoolClass, Subject, Teacher, Room, Shift, Branch } from "@/types";

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
}: {
  draggedLesson: Lesson;
  targetClass: SchoolClass;
  targetDay: number;
  targetPeriod: number;
  allLessons: Lesson[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms?: Room[];
}): DropSlotValidation {
  const teacher = teachers.find((t) => t.id === draggedLesson.teacherId);
  const subject = subjects.find((s) => s.id === draggedLesson.subjectId);

  const conflicts: string[] = [];
  const warnings: string[] = [];

  // Boshqa darslar (o'zi bundan mustasno)
  const otherLessons = allLessons.filter((l) => l.id !== draggedLesson.id);

  // ─── 🔴 1. QIZIL: QAT'IY ZIDDIYATLAR (CONFLICTS) ───────────────────────────

  // 1.1. O'qituvchi kolliziyasi (Ayni shu paytda boshqa sinfda darsi bor)
  const teacherOtherLesson = otherLessons.find(
    (l) =>
      l.teacherId === draggedLesson.teacherId &&
      l.dayOfWeek === targetDay &&
      l.periodNumber === targetPeriod
  );

  if (teacherOtherLesson) {
    conflicts.push(
      `⚠️ ${teacher?.fullName || "O'qituvchi"} ayni shu paytda boshqa sinfda darsda!`
    );
  }

  // 1.2. O'qituvchi yoki Fanning Rasmiy Metod Kuni (Method Day)
  const isTeacherMethodDay =
    teacher?.methodDayOfWeek !== undefined &&
    teacher.methodDayOfWeek !== null &&
    teacher.methodDayOfWeek === targetDay;

  const isSubjectMethodDay =
    subject?.methodDayOfWeek !== undefined &&
    subject.methodDayOfWeek !== null &&
    subject.methodDayOfWeek === targetDay;

  if (isTeacherMethodDay || isSubjectMethodDay) {
    const dayName = WEEKDAY_NAMES[targetDay] || `${targetDay}-kun`;
    const targetEntity = isTeacherMethodDay
      ? `${teacher?.fullName || "O'qituvchi"}`
      : `${subject?.name || "Fan"}`;
    conflicts.push(
      `🛑 ${targetEntity} uchun ${dayName} rasmiy Metod kuni! Dars qo'yish qat'iyan taqiqlanadi!`
    );
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
  if (maxConsecutive > teacherMaxAllowed) {
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
