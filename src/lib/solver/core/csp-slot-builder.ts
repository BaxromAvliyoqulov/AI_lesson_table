import { SchoolClass, ClassSubject, Subject, Teacher, Lesson, Shift } from "@/types";
import { Slot } from "./types";
import { getTeacherOccKey } from "./csp-constraints";

export interface SlotBuilderResult {
  classSlots: Map<string, Slot[]>;
  allSlots: Slot[];
  teacherOccupancy: Map<string, number>;
  teacherDailyHours: Map<string, number>;
}

export function buildClassSlots(
  classes: SchoolClass[],
  effectiveClassSubjects: Map<string, ClassSubject[]>,
  daysCount: number,
  classMap: Map<string, SchoolClass>,
  teachers: Teacher[],
  subjectMap: Map<string, Subject>,
  allSubjects: Subject[],
  existingLessons?: Lesson[],
  lockedClassIds?: string[],
  lockedTeacherIds?: string[],
  shifts?: Shift[]
): SlotBuilderResult {
  const classSlots = new Map<string, Slot[]>();
  const allSlots: Slot[] = [];

  // 1. Slotlarni qurish
  for (const cls of classes) {
    if (cls.isClosed) continue;
    const isPrimary = Boolean(cls.isPrimary) || (cls.grade !== undefined && Number(cls.grade) <= 4);
    const blockedDaysSet = new Set(cls.blockedDays || (isPrimary ? [6] : []));
    const blockedPeriodsSet = new Set((cls.blockedPeriods || []).map((bp) => `${bp.dayOfWeek}_${bp.periodNumber}`));

    const maxP = isPrimary ? 5 : 6;
    const slots: Slot[] = [];
    const hasGroup2 = (effectiveClassSubjects.get(cls.id) || []).some((cs) => cs.groupType === "GROUP_2");

    for (let day = 1; day <= daysCount; day++) {
      if (blockedDaysSet.has(day)) continue;

      for (let p = 1; p <= maxP; p++) {
        if (blockedPeriodsSet.has(`${day}_${p}`)) continue;

        const slot: Slot = {
          classId: cls.id,
          branchId: cls.branchId,
          day,
          period: p,
          teacherId: null,
          subjectId: null,
          groupType: "WHOLE",
          roomId: null,
          isLocked: false,
        };
        slots.push(slot);
        allSlots.push(slot);

        if (hasGroup2) {
          const parallelSlot: Slot = {
            classId: cls.id,
            branchId: cls.branchId,
            day,
            period: p,
            teacherId: null,
            subjectId: null,
            groupType: "GROUP_2",
            roomId: null,
            isLocked: false,
          };
          slots.push(parallelSlot);
          allSlots.push(parallelSlot);
        }
      }
    }
    classSlots.set(cls.id, slots);
  }

  const teacherOccupancy = new Map<string, number>();
  const teacherDailyHours = new Map<string, number>();
  const lockedClassSet = new Set(lockedClassIds || []);
  const lockedTeacherSet = new Set(lockedTeacherIds || []);

  // 2. Mavjud qulflangan darslarni joylashtirish
  if (existingLessons && existingLessons.length > 0) {
    for (const el of existingLessons) {
      const isClassLocked = lockedClassSet.has(el.classId);
      const isTeacherLocked = lockedTeacherSet.has(el.teacherId);
      const isExplicitlyLocked = el.isLocked === true;

      if (isClassLocked || isTeacherLocked || isExplicitlyLocked) {
        const slots = classSlots.get(el.classId) || [];
        const slot = slots.find(
          (s) =>
            s.day === el.dayOfWeek &&
            s.period === el.periodNumber &&
            (el.groupType === "GROUP_2" ? s.groupType === "GROUP_2" : s.groupType !== "GROUP_2")
        );
        if (slot && !slot.isLocked) {
          slot.subjectId = el.subjectId;
          slot.teacherId = el.teacherId;
          slot.roomId = el.roomId || null;
          slot.groupType = el.groupType || "WHOLE";
          slot.isLocked = true;

          const k = getTeacherOccKey(el.teacherId, el.dayOfWeek, el.periodNumber, el.classId, classMap, shifts);
          teacherOccupancy.set(k, (teacherOccupancy.get(k) || 0) + 1);

          const dk = `${el.teacherId}_${el.dayOfWeek}`;
          teacherDailyHours.set(dk, (teacherDailyHours.get(dk) || 0) + 1);
        }
      }
    }
  }

  // 3. Kelajak soati / Sinf soati -> Dushanba 1-dars
  for (const cls of classes) {
    if (cls.isClosed) continue;
    const slots = classSlots.get(cls.id) || [];
    const subjects = effectiveClassSubjects.get(cls.id) || [];

    const ss = subjects.find(
      (s) =>
        s.subjectId === "sub_sinf_soati" ||
        s.subjectId === "sub_kelajak" ||
        subjectMap.get(s.subjectId)?.name.toLowerCase().includes("kelajak") ||
        subjectMap.get(s.subjectId)?.name.toLowerCase().includes("sinf soati")
    );

    let homeroomId = cls.homeroomTeacherId || (ss ? ss.teacherId : null);
    if (!homeroomId) {
      const rawClassId = cls.id.toLowerCase();
      const rawClassName = cls.name.toLowerCase();
      const normClassName = rawClassName.replace(/[^a-z0-9]/g, "");
      const byTeacher = teachers.find((t) => {
        if (!t.homeroomClassId) return false;
        const tHId = t.homeroomClassId.toLowerCase();
        return tHId === rawClassId || tHId === rawClassName || tHId.replace(/[^a-z0-9]/g, "") === normClassName;
      });
      if (byTeacher) homeroomId = byTeacher.id;
    }
    const d1p1Slots = slots.filter((s) => s.day === 1 && s.period === 1);

    for (const slot of d1p1Slots) {
      if (slot.groupType === "GROUP_2") {
        slot.isLocked = true;
        slot.teacherId = null;
        slot.subjectId = null;
      } else if (homeroomId && !slot.isLocked) {
        const kelajakSub = allSubjects.find(
          (sub) => sub.name.toLowerCase().includes("kelajak") || sub.name.toLowerCase().includes("sinf soati")
        );
        slot.subjectId = ss ? ss.subjectId : (kelajakSub?.id || "sub_kelajak");
        slot.teacherId = homeroomId;
        slot.isLocked = true;
        slot.groupType = "WHOLE";

        const k = getTeacherOccKey(homeroomId, 1, 1, cls.id, classMap, shifts);
        teacherOccupancy.set(k, (teacherOccupancy.get(k) || 0) + 1);

        const dk = `${homeroomId}_1`;
        teacherDailyHours.set(dk, (teacherDailyHours.get(dk) || 0) + 1);
      }
    }
  }

  return {
    classSlots,
    allSlots,
    teacherOccupancy,
    teacherDailyHours,
  };
}
