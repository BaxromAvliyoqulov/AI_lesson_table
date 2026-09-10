import { SchoolClass, Teacher, Subject, Shift } from "@/types";
import { Slot } from "../core/types";
import {
  checkTeacherSlotAvailable,
  checkSubjectCanHaveDoubleLesson,
  resolveShiftGroup,
  getTeacherOccKey,
} from "../core/csp-constraints";

/**
 * Kun ichidagi oraliq darchalarni (oknolarni) siqish:
 * Keyingi darslarni bo'sh slotga oldinga siljitish (Direct Ripple Shift).
 */
export function executeIntraDayCompaction(
  classes: SchoolClass[],
  classSlots: Map<string, Slot[]>,
  classMap: Map<string, SchoolClass>,
  teacherMap: Map<string, Teacher>,
  subjectMap: Map<string, Subject>,
  teacherOccupancy: Map<string, number>,
  shifts?: Shift[],
  daysCount = 6
): void {
  for (const cls of classes) {
    if (cls.isClosed) continue;
    const cSlots = classSlots.get(cls.id) || [];

    for (let day = 1; day <= daysCount; day++) {
      const daySlots = cSlots
        .filter((s) => s.day === day && s.groupType !== "GROUP_2")
        .sort((a, b) => a.period - b.period);

      for (let pass = 0; pass < 12; pass++) {
        let moved = false;

        for (let i = 0; i < daySlots.length; i++) {
          const slot = daySlots[i];
          if (!slot.teacherId && !slot.isLocked) {
            const laterSlotsWithLessons = daySlots.slice(i + 1).filter((s) => s.teacherId && !s.isLocked);
            if (laterSlotsWithLessons.length === 0) continue;

            let foundTargetSlot: Slot | null = null;
            let foundCompanionSlot: Slot | null = null;
            for (const later of laterSlotsWithLessons) {
              const tId = later.teacherId!;
              const sId = later.subjectId!;

              const occ = teacherOccupancy.get(getTeacherOccKey(tId, day, slot.period, cls.id, classMap, shifts)) || 0;
              const isAvail = checkTeacherSlotAvailable(
                day,
                slot.period,
                tId,
                sId,
                resolveShiftGroup(cls.id, classMap, shifts),
                cls.id,
                teacherMap,
                subjectMap,
                classMap,
                true // relaxed method day (o'qituvchi allaqachon shu kuni maktabda dars o'tmoqda)
              );

              if (occ === 0 && isAvail) {
                if (later.groupType === "GROUP_1") {
                  const companion = cSlots.find(
                    (cs) => cs.day === day && cs.period === later.period && cs.groupType === "GROUP_2" && cs.teacherId
                  );
                  if (companion) {
                    const occ2 =
                      teacherOccupancy.get(
                        getTeacherOccKey(companion.teacherId!, day, slot.period, cls.id, classMap, shifts)
                      ) || 0;
                    if (occ2 > 0) continue;
                    foundCompanionSlot = companion;
                  }
                }
                foundTargetSlot = later;
                break;
              }
            }

            if (foundTargetSlot) {
              const tId = foundTargetSlot.teacherId!;
              const sId = foundTargetSlot.subjectId!;
              const gType = foundTargetSlot.groupType;

              teacherOccupancy.set(
                getTeacherOccKey(tId, day, foundTargetSlot.period, cls.id, classMap, shifts),
                (teacherOccupancy.get(getTeacherOccKey(tId, day, foundTargetSlot.period, cls.id, classMap, shifts)) || 1) - 1
              );
              teacherOccupancy.set(
                getTeacherOccKey(tId, day, slot.period, cls.id, classMap, shifts),
                (teacherOccupancy.get(getTeacherOccKey(tId, day, slot.period, cls.id, classMap, shifts)) || 0) + 1
              );

              slot.teacherId = tId;
              slot.subjectId = sId;
              slot.groupType = gType;

              foundTargetSlot.teacherId = null;
              foundTargetSlot.subjectId = null;
              foundTargetSlot.groupType = "WHOLE";

              if (foundCompanionSlot) {
                const targetG2Slot = cSlots.find(
                  (cs) => cs.day === day && cs.period === slot.period && cs.groupType === "GROUP_2"
                );
                if (targetG2Slot) {
                  const tId2 = foundCompanionSlot.teacherId!;
                  teacherOccupancy.set(
                    getTeacherOccKey(tId2, day, foundCompanionSlot.period, cls.id, classMap, shifts),
                    (teacherOccupancy.get(getTeacherOccKey(tId2, day, foundCompanionSlot.period, cls.id, classMap, shifts)) || 1) - 1
                  );
                  teacherOccupancy.set(
                    getTeacherOccKey(tId2, day, slot.period, cls.id, classMap, shifts),
                    (teacherOccupancy.get(getTeacherOccKey(tId2, day, slot.period, cls.id, classMap, shifts)) || 0) + 1
                  );
                  targetG2Slot.teacherId = tId2;
                  targetG2Slot.subjectId = foundCompanionSlot.subjectId;
                  targetG2Slot.groupType = "GROUP_2";

                  foundCompanionSlot.teacherId = null;
                  foundCompanionSlot.subjectId = null;
                }
              }

              moved = true;
              break;
            } else {
              // Direct move imkoni bo'lmadi (chunki keyingi ustoz slot.period da band).
              // 2-Step Intra-Day Permutatsiyasi: oldingi darslardan biri bo'sh slot.period ga ko'chib,
              // keyingi dars o'sha oldingi dars o'rniga o'ta oladimi?
              const earlierSlots = daySlots
                .slice(0, i)
                .filter((s) => s.teacherId && !s.isLocked && s.groupType === "WHOLE");

              for (const earlier of earlierSlots) {
                const etId = earlier.teacherId!;
                const esId = earlier.subjectId!;

                const occE = teacherOccupancy.get(getTeacherOccKey(etId, day, slot.period, cls.id, classMap, shifts)) || 0;
                if (occE > 0) continue;
                if (!checkTeacherSlotAvailable(day, slot.period, etId, esId, resolveShiftGroup(cls.id, classMap, shifts), cls.id, teacherMap, subjectMap, classMap, true)) continue;

                for (const later of laterSlotsWithLessons) {
                  if (later.groupType !== "WHOLE") continue;
                  const ltId = later.teacherId!;
                  const lsId = later.subjectId!;

                  const occL = teacherOccupancy.get(getTeacherOccKey(ltId, day, earlier.period, cls.id, classMap, shifts)) || 0;
                  if (occL > 0) continue;
                  if (!checkTeacherSlotAvailable(day, earlier.period, ltId, lsId, resolveShiftGroup(cls.id, classMap, shifts), cls.id, teacherMap, subjectMap, classMap, true)) continue;

                  // 1. earlier -> slot
                  teacherOccupancy.set(getTeacherOccKey(etId, day, earlier.period, cls.id, classMap, shifts), (teacherOccupancy.get(getTeacherOccKey(etId, day, earlier.period, cls.id, classMap, shifts)) || 1) - 1);
                  teacherOccupancy.set(getTeacherOccKey(etId, day, slot.period, cls.id, classMap, shifts), (teacherOccupancy.get(getTeacherOccKey(etId, day, slot.period, cls.id, classMap, shifts)) || 0) + 1);
                  slot.teacherId = etId;
                  slot.subjectId = esId;
                  slot.groupType = "WHOLE";

                  // 2. later -> earlier
                  teacherOccupancy.set(getTeacherOccKey(ltId, day, later.period, cls.id, classMap, shifts), (teacherOccupancy.get(getTeacherOccKey(ltId, day, later.period, cls.id, classMap, shifts)) || 1) - 1);
                  teacherOccupancy.set(getTeacherOccKey(ltId, day, earlier.period, cls.id, classMap, shifts), (teacherOccupancy.get(getTeacherOccKey(ltId, day, earlier.period, cls.id, classMap, shifts)) || 0) + 1);
                  earlier.teacherId = ltId;
                  earlier.subjectId = lsId;
                  earlier.groupType = "WHOLE";

                  // 3. later bo'shatiladi
                  later.teacherId = null;
                  later.subjectId = null;
                  later.groupType = "WHOLE";

                  moved = true;
                  break;
                }
                if (moved) break;
              }
              if (moved) break;
            }
          }
        }

        if (!moved) break;
      }
    }
  }
}

/**
 * Kunlararo darchalarni bartaraf qilish:
 * Hech qachon bir xil fanni o'sha kunga ko'chirmaydi (Zero Duplicate Guarantee).
 */
export function executeCrossDayGapElimination(
  classes: SchoolClass[],
  classSlots: Map<string, Slot[]>,
  classMap: Map<string, SchoolClass>,
  teacherMap: Map<string, Teacher>,
  subjectMap: Map<string, Subject>,
  daysCount: number,
  teacherOccupancy: Map<string, number>,
  shifts?: Shift[]
): void {
  for (const cls of classes) {
    if (cls.isClosed) continue;
    const cSlots = classSlots.get(cls.id) || [];
    const clsObj = classMap.get(cls.id);
    const isPrimaryCls = Boolean(clsObj?.isPrimary) || ((clsObj?.grade ?? 5) <= 4);
    const activeTotalHours = cSlots.filter((s) => s.teacherId && s.groupType !== "GROUP_2").length;
    const availableDays = isPrimaryCls ? 5 : daysCount;
    const baseDaily = Math.floor(activeTotalHours / availableDays); // Masalan: 30..35 soatda = 5
    const maxAllowedPeriod = isPrimaryCls ? 5 : 6;

    for (let pass = 0; pass < 5; pass++) {
      let anyResolved = false;

      for (let day = 1; day <= daysCount; day++) {
        const daySlots = cSlots
          .filter((s) => s.day === day && s.groupType !== "GROUP_2")
          .sort((a, b) => a.period - b.period);

        for (let i = 0; i < daySlots.length; i++) {
          const gapSlot = daySlots[i];
          if (!gapSlot.teacherId && !gapSlot.isLocked) {
            if (gapSlot.period > maxAllowedPeriod) continue;

            const laterLessons = daySlots.slice(i + 1).filter((s) => s.teacherId && !s.isLocked);
            if (laterLessons.length === 0) continue;

            // 1. Strategiya: Boshqa kunning eng oxirgi darsini ushbu bo'sh joyga ko'chirish
            for (let otherDay = 1; otherDay <= daysCount; otherDay++) {
              if (otherDay === day) continue;
              if (isPrimaryCls && otherDay === 6) continue;

              const otherDaySlots = cSlots
                .filter((s) => s.day === otherDay && s.teacherId && !s.isLocked && s.groupType !== "GROUP_2")
                .sort((a, b) => b.period - a.period);

              // otherDay faqat baseDaily dan ortiq darsga ega bo'lsagina 1 ta dars bera oladi (Zero Starvation)
              if (otherDaySlots.length <= baseDaily) continue;
              if (daySlots.filter((s) => s.teacherId && s.groupType !== "GROUP_2").length >= baseDaily + 1) continue;

              const candidate = otherDaySlots[0];
              const tId = candidate.teacherId!;
              const sId = candidate.subjectId!;

              const occGap =
                teacherOccupancy.get(getTeacherOccKey(tId, day, gapSlot.period, gapSlot.classId, classMap, shifts)) || 0;
              if (occGap > 0) continue;
              if (
                !checkTeacherSlotAvailable(
                  day,
                  gapSlot.period,
                  tId,
                  sId,
                  resolveShiftGroup(gapSlot.classId, classMap, shifts),
                  gapSlot.classId,
                  teacherMap,
                  subjectMap,
                  classMap
                )
              ) {
                continue;
              }

              // Dublikat taqiqlanadi: shu kunda bu fan bo'lmasligi shart!
              const existingSameSub = daySlots.filter((s) => s.subjectId === sId);
              if (existingSameSub.length > 0) continue;

              teacherOccupancy.set(
                getTeacherOccKey(tId, otherDay, candidate.period, candidate.classId, classMap, shifts),
                (teacherOccupancy.get(getTeacherOccKey(tId, otherDay, candidate.period, candidate.classId, classMap, shifts)) || 1) - 1
              );
              teacherOccupancy.set(getTeacherOccKey(tId, day, gapSlot.period, gapSlot.classId, classMap, shifts), 1);

              gapSlot.teacherId = tId;
              gapSlot.subjectId = sId;
              gapSlot.groupType = candidate.groupType;

              candidate.teacherId = null;
              candidate.subjectId = null;
              candidate.groupType = "WHOLE";

              anyResolved = true;
              break;
            }

            if (anyResolved) break;

            // 2. Strategiya: 3-Way Gap-Closing Swap
            // laterLessons dagi barcha darslarni ko'rib chiqamiz (faqat bittasini emas)
            for (let candIdx = laterLessons.length - 1; candIdx >= 0; candIdx--) {
              const trailing = laterLessons[candIdx];
              if (!trailing || trailing.isLocked || trailing.groupType !== "WHOLE") continue;
              const ttId = trailing.teacherId!;
              const tsId = trailing.subjectId!;

              for (let otherDay = 1; otherDay <= daysCount; otherDay++) {
                if (otherDay === day) continue;
                if (isPrimaryCls && otherDay === 6) continue;

                const otherDaySlots = cSlots
                  .filter((s) => s.day === otherDay && s.teacherId !== null && !s.isLocked && s.groupType === "WHOLE")
                  .sort((a, b) => b.period - a.period);

                for (const otherSlot of otherDaySlots) {
                  const otId = otherSlot.teacherId!;
                  const osId = otherSlot.subjectId!;

                  const occ1 =
                    teacherOccupancy.get(getTeacherOccKey(otId, day, gapSlot.period, cls.id, classMap, shifts)) || 0;
                  if (occ1 > 0) continue;
                  if (!checkTeacherSlotAvailable(day, gapSlot.period, otId, osId, resolveShiftGroup(cls.id, classMap, shifts), cls.id, teacherMap, subjectMap, classMap)) continue;

                  const sameSubOnDay = daySlots.filter((s) => s.subjectId === osId && s !== gapSlot);
                  if (sameSubOnDay.length > 0) continue;

                  const occ2 = teacherOccupancy.get(getTeacherOccKey(ttId, otherDay, otherSlot.period, cls.id, classMap, shifts)) || 0;
                  if (occ2 > 0) continue;
                  if (!checkTeacherSlotAvailable(otherDay, otherSlot.period, ttId, tsId, resolveShiftGroup(cls.id, classMap, shifts), cls.id, teacherMap, subjectMap, classMap)) continue;

                  const sameSubOther = cSlots.filter((s) => s.day === otherDay && s !== otherSlot && s.subjectId === tsId);
                  if (sameSubOther.length > 0) continue;

                  teacherOccupancy.set(getTeacherOccKey(otId, otherDay, otherSlot.period, cls.id, classMap, shifts), Math.max(0, (teacherOccupancy.get(getTeacherOccKey(otId, otherDay, otherSlot.period, cls.id, classMap, shifts)) || 1) - 1));
                  teacherOccupancy.set(getTeacherOccKey(otId, day, gapSlot.period, cls.id, classMap, shifts), (teacherOccupancy.get(getTeacherOccKey(otId, day, gapSlot.period, cls.id, classMap, shifts)) || 0) + 1);
                  teacherOccupancy.set(getTeacherOccKey(ttId, day, trailing.period, cls.id, classMap, shifts), Math.max(0, (teacherOccupancy.get(getTeacherOccKey(ttId, day, trailing.period, cls.id, classMap, shifts)) || 1) - 1));
                  teacherOccupancy.set(getTeacherOccKey(ttId, otherDay, otherSlot.period, cls.id, classMap, shifts), (teacherOccupancy.get(getTeacherOccKey(ttId, otherDay, otherSlot.period, cls.id, classMap, shifts)) || 0) + 1);

                  gapSlot.teacherId = otId;
                  gapSlot.subjectId = osId;
                  gapSlot.groupType = "WHOLE";

                  otherSlot.teacherId = ttId;
                  otherSlot.subjectId = tsId;
                  otherSlot.groupType = "WHOLE";

                  trailing.teacherId = null;
                  trailing.subjectId = null;
                  trailing.groupType = "WHOLE";

                  anyResolved = true;
                  break;
                }
                if (anyResolved) break;
              }
              if (anyResolved) break;
            }

            if (anyResolved) break;

            // 3. Strategiya: Darchadan keyingi yakkalangan darsni boshqa kunga siljitish
            const trailing = laterLessons[laterLessons.length - 1];
            if (trailing && !trailing.isLocked) {
              const currentDayCount = daySlots.filter((s) => s.teacherId && s.groupType !== "GROUP_2").length;
              if (currentDayCount <= baseDaily) continue;

              const trTId = trailing.teacherId!;
              const trSId = trailing.subjectId!;

              for (let otherDay = 1; otherDay <= daysCount; otherDay++) {
                if (otherDay === day) continue;
                if (isPrimaryCls && otherDay === 6) continue;
                const otherDayActive = cSlots
                  .filter((s) => s.day === otherDay && s.teacherId && s.groupType !== "GROUP_2")
                  .sort((a, b) => b.period - a.period);

                if (otherDayActive.length === 0 || otherDayActive.length >= baseDaily + 1) continue;

                const targetP = otherDayActive[0].period + 1;
                if (targetP > maxAllowedPeriod) continue;

                const targetSlot = cSlots.find((s) => s.day === otherDay && s.period === targetP && s.groupType !== "GROUP_2");
                if (!targetSlot || targetSlot.teacherId || targetSlot.isLocked) continue;

                const occTarget = teacherOccupancy.get(getTeacherOccKey(trTId, otherDay, targetP, cls.id, classMap, shifts)) || 0;
                if (occTarget > 0) continue;
                if (!checkTeacherSlotAvailable(otherDay, targetP, trTId, trSId, resolveShiftGroup(cls.id, classMap, shifts), cls.id, teacherMap, subjectMap, classMap)) continue;

                if (otherDayActive.some((s) => s.subjectId === trSId)) continue;

                teacherOccupancy.set(getTeacherOccKey(trTId, day, trailing.period, cls.id, classMap, shifts), Math.max(0, (teacherOccupancy.get(getTeacherOccKey(trTId, day, trailing.period, cls.id, classMap, shifts)) || 1) - 1));
                teacherOccupancy.set(getTeacherOccKey(trTId, otherDay, targetP, cls.id, classMap, shifts), (teacherOccupancy.get(getTeacherOccKey(trTId, otherDay, targetP, cls.id, classMap, shifts)) || 0) + 1);

                targetSlot.teacherId = trTId;
                targetSlot.subjectId = trSId;
                targetSlot.groupType = trailing.groupType;

                trailing.teacherId = null;
                trailing.subjectId = null;
                trailing.groupType = "WHOLE";

                anyResolved = true;
                break;
              }
            }
          }
        }
      }
      if (!anyResolved) break;
    }

    // 4. BALANCED MINIMUM HOURS PASS (Yuqori sinflarda darsi <4 bo'lgan kunlarni to'ldirish)
    if (!isPrimaryCls) {
      for (let starvedDay = 1; starvedDay <= daysCount; starvedDay++) {
        const starvedSlots = cSlots.filter((s) => s.day === starvedDay && s.teacherId && s.groupType !== "GROUP_2");
        if (starvedSlots.length === 0 || starvedSlots.length >= 4) continue;

        for (let donorDay = 1; donorDay <= daysCount; donorDay++) {
          if (donorDay === starvedDay) continue;
          const donorSlots = cSlots.filter((s) => s.day === donorDay && s.teacherId && s.groupType !== "GROUP_2").sort((a, b) => b.period - a.period);
          if (donorSlots.length <= baseDaily) continue;

          const donorLesson = donorSlots[0];
          if (!donorLesson || donorLesson.isLocked) continue;

          const targetP = Math.max(...starvedSlots.map((s) => s.period)) + 1;
          if (targetP > maxAllowedPeriod) continue;
          const targetSlot = cSlots.find((s) => s.day === starvedDay && s.period === targetP && s.groupType !== "GROUP_2");
          if (!targetSlot || targetSlot.teacherId || targetSlot.isLocked) continue;

          const tId = donorLesson.teacherId!;
          const sId = donorLesson.subjectId!;
          const occ = teacherOccupancy.get(getTeacherOccKey(tId, starvedDay, targetP, cls.id, classMap, shifts)) || 0;
          if (occ > 0) continue;
          if (!checkTeacherSlotAvailable(starvedDay, targetP, tId, sId, resolveShiftGroup(cls.id, classMap, shifts), cls.id, teacherMap, subjectMap, classMap)) continue;

          if (starvedSlots.some((s) => s.subjectId === sId)) continue;

          teacherOccupancy.set(getTeacherOccKey(tId, donorDay, donorLesson.period, cls.id, classMap, shifts), Math.max(0, (teacherOccupancy.get(getTeacherOccKey(tId, donorDay, donorLesson.period, cls.id, classMap, shifts)) || 1) - 1));
          teacherOccupancy.set(getTeacherOccKey(tId, starvedDay, targetP, cls.id, classMap, shifts), (teacherOccupancy.get(getTeacherOccKey(tId, starvedDay, targetP, cls.id, classMap, shifts)) || 0) + 1);

          targetSlot.teacherId = tId;
          targetSlot.subjectId = sId;
          targetSlot.groupType = donorLesson.groupType;

          donorLesson.teacherId = null;
          donorLesson.subjectId = null;
          donorLesson.groupType = "WHOLE";
          break;
        }
      }
    }
  }
}
