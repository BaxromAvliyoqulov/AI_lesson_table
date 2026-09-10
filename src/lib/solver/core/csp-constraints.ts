import { SchoolClass, Subject, Teacher, Shift } from "@/types";
import {
  getOfficialMethodDayForSubject,
  getEffectiveTeacherMethodDay,
} from "@/lib/constants/method-days";
import { isClassSecondShift } from "@/lib/utils";

export function checkStrictMethodDay(
  day: number,
  teacherId: string | null | undefined,
  subjectId: string | null | undefined,
  classId: string | null | undefined,
  teacherMap: Map<string, Teacher>,
  subjectMap: Map<string, Subject>,
  classMap: Map<string, SchoolClass>,
  relaxed?: boolean
): boolean {
  // 1. O'qituvchining shaxsiy belgilangan metod kuni bo'lsa:
  if (teacherId) {
    const t = teacherMap.get(teacherId);
    if (t) {
      const tMethod = t.methodDayOfWeek ?? t.methodDay;
      if (tMethod !== undefined && tMethod !== null && tMethod >= 1 && tMethod <= 6) {
        if (tMethod === day) return true;
      }

      // Agar relaxed bo'lmasa, fandan avto aniqlangan metod kunini tekshiramiz
      if (!relaxed) {
        const cls = classId ? classMap.get(classId) : null;
        const isPrimaryClass = cls ? Boolean(cls.isPrimary || (cls.grade !== undefined && cls.grade <= 4)) : false;
        if (!isPrimaryClass && !t.homeroomClassId) {
          const eff = getEffectiveTeacherMethodDay(t, Array.from(subjectMap.values()));
          if (eff.day === day) return true;
        }
      }
    }
  }

  // 2. Fanning rasmiy kafedra metod kuni (Yuqori sinflar 5-11 uchun qat'iy standart):
  // Foydalanuvchi qoidasi: Dars soatlari ko'p bo'lsa yoki dars yetishmovchiligi bo'lsa, relaxed holatda ruxsat beriladi
  if (!relaxed && subjectId) {
    const cls = classId ? classMap.get(classId) : null;
    const isPrimaryClass = cls ? Boolean(cls.isPrimary || (cls.grade !== undefined && cls.grade <= 4)) : false;

    // Boshlang'ich sinflarda (1-4) Matematika va Ona tili har kuni 1 soatdan o'tilishi shart (SanPiN 0341-17).
    if (!isPrimaryClass) {
      const s = subjectMap.get(subjectId);
      if (s) {
        if (s.methodDayOfWeek !== undefined && s.methodDayOfWeek !== null && s.methodDayOfWeek >= 1 && s.methodDayOfWeek <= 6) {
          if (s.methodDayOfWeek === day) return true;
        }
        const subMethod = getOfficialMethodDayForSubject(s.name || s.id);
        if (subMethod === day) return true;
      }
    }
  }

  return false;
}

export function checkSubjectCanHaveDoubleLesson(
  classId: string,
  subjectId: string,
  weeklyHours: number | undefined,
  classMap: Map<string, SchoolClass>,
  subjectMap: Map<string, Subject>,
  daysCount: number
): boolean {
  const subObj = subjectMap.get(subjectId);
  if (subObj?.allowDoubleLesson) return true;

  const cls = classMap.get(classId);
  const isPrimary = (cls?.grade !== undefined && cls.grade <= 4) || Boolean(cls?.isPrimary);
  const blockedDays = cls?.blockedDays || (isPrimary ? [6] : []);
  const availableDays = Math.max(1, (daysCount || 6) - blockedDays.length);

  const hours =
    weeklyHours ??
    (cls?.subjects?.find((s) => s.subjectId === subjectId)?.weeklyHours || 0);

  if (hours > availableDays) {
    return true;
  }

  return false;
}

export function checkTeacherSlotAvailable(
  day: number,
  period: number,
  teacherId: string | null | undefined,
  subjectId: string | null | undefined,
  shiftGroup: "shift1" | "shift2" | string | undefined,
  classId: string | null | undefined,
  teacherMap: Map<string, Teacher>,
  subjectMap: Map<string, Subject>,
  classMap: Map<string, SchoolClass>,
  relaxed?: boolean
): boolean {
  if (!teacherId) return true;
  const t = teacherMap.get(teacherId);
  if (!t) return true;

  // Dushanba 1-soat Kelajak soati: sinf rahbarining tarbiyaviy soati bo'lib, metod kuni hisoblanmaydi
  if (day === 1 && period === 1) {
    return true;
  }

  // 1. Metod kuni tekshiruvi:
  if (checkStrictMethodDay(day, teacherId, subjectId, classId, teacherMap, subjectMap, classMap, relaxed)) {
    return false;
  }

  // 2. Shaxsiy bandlik matrisasi (Qo'lda yopilgan / Band soatlar):
  if (t.availabilities && t.availabilities.length > 0) {
    // 2.1. Agar o'qituvchi uchun ushbu kun butunlay yopilgan bo'lsa
    const dayAvails = t.availabilities.filter((a) => a.dayOfWeek === day);
    if (dayAvails.length > 0 && dayAvails.every((a) => a.isAvailable === false)) {
      return false;
    }

    // 2.2. Smena bo'yicha aniq soat tekshiruvi:
    if (shiftGroup === "shift2") {
      const av2 = t.availabilities.find(
        (a) => a.dayOfWeek === day && a.period === 10 + period
      );
      if (av2) {
        if (av2.isAvailable === false) return false;
      } else {
        const hasShift2Avails = t.availabilities.some((a) => a.period >= 10);
        if (!hasShift2Avails) {
          const avGeneral = t.availabilities.find(
            (a) => a.dayOfWeek === day && a.period === period
          );
          if (avGeneral && avGeneral.isAvailable === false) return false;
        }
      }
    } else {
      const av1 = t.availabilities.find(
        (a) => a.dayOfWeek === day && a.period === period
      );
      if (av1 && av1.isAvailable === false) {
        return false;
      }
    }
  }

  return true;
}

export function resolveShiftGroup(classId: string, classMap: Map<string, SchoolClass>, shifts?: Shift[]): string {
  const cls = classMap.get(classId);
  return isClassSecondShift(cls, shifts) ? "shift2" : "shift1";
}

export function getTeacherOccKey(
  teacherId: string,
  day: number,
  period: number,
  classId: string,
  classMap: Map<string, SchoolClass>,
  shifts?: Shift[]
): string {
  return `${teacherId}_${day}_${period}_${resolveShiftGroup(classId, classMap, shifts)}`;
}
