import { SchoolClass, Subject, Teacher, Shift } from "@/types";
import { Slot, ReqLesson } from "../core/types";
import {
  checkTeacherSlotAvailable,
  checkSubjectCanHaveDoubleLesson,
  resolveShiftGroup,
  getTeacherOccKey,
} from "../core/csp-constraints";

export function executeKempeBumpingAndFallback(
  unassignedReqs: ReqLesson[],
  classSlots: Map<string, Slot[]>,
  classMap: Map<string, SchoolClass>,
  teacherMap: Map<string, Teacher>,
  subjectMap: Map<string, Subject>,
  daysCount: number,
  teacherOccupancy: Map<string, number>,
  shifts?: Shift[]
): void {
  for (let pass = 0; pass < 8 && unassignedReqs.length > 0; pass++) {
    const stillUnassigned: ReqLesson[] = [];

    while (unassignedReqs.length > 0) {
      const req = unassignedReqs.shift()!;
      const clsSlots = classSlots.get(req.classId) || [];
      const clsObj = classMap.get(req.classId);
      const isPrimary = (clsObj?.grade !== undefined && clsObj.grade <= 4) || Boolean(clsObj?.isPrimary);
      const allowDouble = checkSubjectCanHaveDoubleLesson(
        req.classId,
        req.subjectId,
        req.weeklyHours,
        classMap,
        subjectMap,
        daysCount
      );

      let placed = false;

      // 1. To'g'ridan-to'g'ri bo'sh slot qidirish (100% kolliziyasiz)
      const candidateSlots = clsSlots.filter((s) => {
        if (s.groupType === "GROUP_2") return false;
        if (s.isLocked || s.teacherId !== null) return false;
        if (s.day === 1 && s.period === 1) return false;
        if (isPrimary && s.day === 6) return false;
        if (isPrimary && s.period >= 6) return false;

        const occReq =
          teacherOccupancy.get(
            getTeacherOccKey(req.teacherId, s.day, s.period, req.classId, classMap, shifts)
          ) || 0;
        if (occReq > 0) return false;
        if (
          !checkTeacherSlotAvailable(
            s.day,
            s.period,
            req.teacherId,
            req.subjectId,
            resolveShiftGroup(req.classId, classMap, shifts),
            req.classId,
            teacherMap,
            subjectMap,
            classMap
          )
        ) {
          return false;
        }

        if (req.groupType === "SPLIT" && req.coTeacherId) {
          const g2 = clsSlots.find(
            (other) => other.day === s.day && other.period === s.period && other.groupType === "GROUP_2"
          );
          if (!g2 || g2.teacherId !== null || g2.isLocked) return false;
          const occCo =
            teacherOccupancy.get(
              getTeacherOccKey(req.coTeacherId, s.day, s.period, req.classId, classMap, shifts)
            ) || 0;
          if (occCo > 0) return false;
          if (
            !checkTeacherSlotAvailable(
              s.day,
              s.period,
              req.coTeacherId,
              req.subjectId,
              resolveShiftGroup(req.classId, classMap, shifts),
              req.classId,
              teacherMap,
              subjectMap,
              classMap
            )
          ) {
            return false;
          }
        }

        const sameSub = clsSlots.filter(
          (other) =>
            other.day === s.day &&
            other.subjectId === req.subjectId &&
            other.groupType !== "GROUP_2"
        );
        if (!allowDouble && sameSub.length > 0) return false;
        if (allowDouble) {
          if (sameSub.length >= 2) return false;
          if (sameSub.length === 1 && Math.abs(sameSub[0].period - s.period) !== 1) return false;
        }
        return true;
      });

      if (candidateSlots.length > 0) {
        const slot = candidateSlots[0];
        slot.teacherId = req.teacherId;
        slot.subjectId = req.subjectId;
        slot.groupType = req.groupType === "SPLIT" ? "GROUP_1" : req.groupType || "WHOLE";
        const occKey = getTeacherOccKey(req.teacherId, slot.day, slot.period, req.classId, classMap, shifts);
        teacherOccupancy.set(occKey, (teacherOccupancy.get(occKey) || 0) + 1);

        if (req.groupType === "SPLIT" && req.coTeacherId) {
          const g2 = clsSlots.find(
            (other) => other.day === slot.day && other.period === slot.period && other.groupType === "GROUP_2"
          );
          if (g2) {
            g2.teacherId = req.coTeacherId;
            g2.subjectId = req.subjectId;
            g2.groupType = "GROUP_2";
            const occKeyCo = getTeacherOccKey(req.coTeacherId, g2.day, g2.period, req.classId, classMap, shifts);
            teacherOccupancy.set(occKeyCo, (teacherOccupancy.get(occKeyCo) || 0) + 1);
          }
        }
        placed = true;
      } else {
        // 2. Kempe-Chain Bumping: Bo'sh slotga ko'chira oladigan dars bilan o'rin almashtirish
        for (const targetSlot of clsSlots) {
          if (targetSlot.groupType !== "WHOLE" || targetSlot.isLocked || !targetSlot.teacherId) continue;
          if (targetSlot.day === 1 && targetSlot.period === 1) continue;
          if (isPrimary && targetSlot.day === 6) continue;
          if (isPrimary && targetSlot.period >= 6) continue;

          // req bu targetSlot ga sig'adimi?
          const occReq =
            teacherOccupancy.get(
              getTeacherOccKey(req.teacherId, targetSlot.day, targetSlot.period, req.classId, classMap, shifts)
            ) || 0;
          if (occReq > 0) continue;
          if (
            !checkTeacherSlotAvailable(
              targetSlot.day,
              targetSlot.period,
              req.teacherId,
              req.subjectId,
              resolveShiftGroup(req.classId, classMap, shifts),
              req.classId,
              teacherMap,
              subjectMap,
              classMap
            )
          ) {
            continue;
          }

          const sameSubReq = clsSlots.filter(
            (other) =>
              other !== targetSlot &&
              other.day === targetSlot.day &&
              other.subjectId === req.subjectId &&
              other.groupType !== "GROUP_2"
          );
          if (!allowDouble && sameSubReq.length > 0) continue;
          if (allowDouble) {
            if (sameSubReq.length >= 2) continue;
            if (sameSubReq.length === 1 && Math.abs(sameSubReq[0].period - targetSlot.period) !== 1) continue;
          }

          const victimTeacherId = targetSlot.teacherId;
          const victimSubjectId = targetSlot.subjectId!;
          const victimGroupType = targetSlot.groupType;
          const victimAllowDouble = checkSubjectCanHaveDoubleLesson(
            req.classId,
            victimSubjectId,
            undefined,
            classMap,
            subjectMap,
            daysCount
          );

          // Jabrlanuvchi uchun muqobil bo'sh slotlarni saralash (faqat darcha hosil qilmaydigan)
          const candidateAltSlots = clsSlots.filter((alt) => {
            if (alt.groupType !== "WHOLE" || alt.isLocked || alt.teacherId !== null) return false;
            if (alt.day === 1 && alt.period === 1) return false;
            if (isPrimary && alt.day === 6) return false;
            if (isPrimary && alt.period >= 6) return false;

            const occAlt =
              teacherOccupancy.get(
                getTeacherOccKey(victimTeacherId, alt.day, alt.period, req.classId, classMap, shifts)
              ) || 0;
            if (occAlt > 0) return false;
            if (
              !checkTeacherSlotAvailable(
                alt.day,
                alt.period,
                victimTeacherId,
                victimSubjectId,
                resolveShiftGroup(req.classId, classMap, shifts),
                req.classId,
                teacherMap,
                subjectMap,
                classMap
              )
            ) {
              return false;
            }

            const sameSubVictim = clsSlots.filter(
              (other) =>
                other !== alt &&
                other !== targetSlot &&
                other.day === alt.day &&
                other.subjectId === victimSubjectId &&
                other.groupType !== "GROUP_2"
            );
            if (!victimAllowDouble && sameSubVictim.length > 0) return false;
            if (victimAllowDouble) {
              if (sameSubVictim.length >= 2) return false;
              if (sameSubVictim.length === 1 && Math.abs(sameSubVictim[0].period - alt.period) !== 1) return false;
            }
            return true;
          });

          // altSlot albatta darcha (okno) hosil qilmasligi (uzluksiz ketma-ket) shart
          let altSlot: Slot | null = null;
          let bestAltGap = Infinity;

          for (const alt of candidateAltSlots) {
            const periodsOnAlt = clsSlots
              .filter((s) => s.day === alt.day && s !== targetSlot && s.teacherId !== null && s.groupType !== "GROUP_2")
              .map((s) => s.period)
              .sort((a, b) => a - b);

            let gap = 0;
            if (periodsOnAlt.length === 0) {
              gap = alt.period === 1 ? 0 : alt.period - 1;
            } else {
              const maxP = periodsOnAlt[periodsOnAlt.length - 1];
              const minP = periodsOnAlt[0];
              if (alt.period === maxP + 1 || alt.period === minP - 1) {
                gap = 0;
              } else if (alt.period > maxP + 1) {
                gap = alt.period - maxP - 1;
              } else if (alt.period < minP - 1) {
                gap = minP - 1 - alt.period;
              }
            }

            if (gap < bestAltGap) {
              bestAltGap = gap;
              altSlot = alt;
            }
          }

          if (altSlot && bestAltGap === 0) {
            const oldOccVictim = getTeacherOccKey(victimTeacherId, targetSlot.day, targetSlot.period, req.classId, classMap, shifts);
            teacherOccupancy.set(oldOccVictim, Math.max(0, (teacherOccupancy.get(oldOccVictim) || 1) - 1));

            altSlot.teacherId = victimTeacherId;
            altSlot.subjectId = victimSubjectId;
            altSlot.groupType = victimGroupType;
            const newOccVictim = getTeacherOccKey(victimTeacherId, altSlot.day, altSlot.period, req.classId, classMap, shifts);
            teacherOccupancy.set(newOccVictim, (teacherOccupancy.get(newOccVictim) || 0) + 1);

            targetSlot.teacherId = req.teacherId;
            targetSlot.subjectId = req.subjectId;
            targetSlot.groupType = req.groupType === "SPLIT" ? "GROUP_1" : req.groupType || "WHOLE";
            const occReqPlaced = getTeacherOccKey(req.teacherId, targetSlot.day, targetSlot.period, req.classId, classMap, shifts);
            teacherOccupancy.set(occReqPlaced, (teacherOccupancy.get(occReqPlaced) || 0) + 1);

            placed = true;
            break;
          }
        }
      }

      if (!placed) {
        stillUnassigned.push(req);
      }
    }
    unassignedReqs.push(...stillUnassigned);
  }

  // 3. ZERO-LOSS RESCUE PASS (Foydalanuvchi qoidasi: 100% darslar jadvalga kiritilishi shart)
  if (unassignedReqs.length > 0) {
    const unrescued: ReqLesson[] = [];
    while (unassignedReqs.length > 0) {
      const req = unassignedReqs.shift()!;
      const clsSlots = classSlots.get(req.classId) || [];
      const clsObj = classMap.get(req.classId);
      const isPrimary = (clsObj?.grade !== undefined && clsObj.grade <= 4) || Boolean(clsObj?.isPrimary);

      // Bo'sh slot qidirish (Relaxed method day va mutlaq nol kolliziya)
      let rescueSlot: Slot | undefined = clsSlots.find((s) => {
        if (s.groupType === "GROUP_2" || s.isLocked || s.teacherId !== null) return false;
        if (s.day === 1 && s.period === 1) return false;
        if (isPrimary && s.day === 6) return false;
        if (isPrimary && s.period >= 6) return false;

        const occReq = teacherOccupancy.get(getTeacherOccKey(req.teacherId, s.day, s.period, req.classId, classMap, shifts)) || 0;
        if (occReq > 0) return false;
        return checkTeacherSlotAvailable(s.day, s.period, req.teacherId, req.subjectId, resolveShiftGroup(req.classId, classMap, shifts), req.classId, teacherMap, subjectMap, classMap, true);
      });

      if (!rescueSlot) {
        // Metod kuni to'siq bo'lsa ham, o'qituvchi boshqa sinfda band bo'lmagan bo'sh slotga joylashtirish
        rescueSlot = clsSlots.find((s) => {
          if (s.groupType === "GROUP_2" || s.isLocked || s.teacherId !== null) return false;
          if (s.day === 1 && s.period === 1) return false;
          if (isPrimary && s.day === 6) return false;
          if (isPrimary && s.period >= 6) return false;

          const occReq = teacherOccupancy.get(getTeacherOccKey(req.teacherId, s.day, s.period, req.classId, classMap, shifts)) || 0;
          return occReq === 0;
        });
      }

      if (rescueSlot) {
        rescueSlot.teacherId = req.teacherId;
        rescueSlot.subjectId = req.subjectId;
        rescueSlot.groupType = req.groupType === "SPLIT" ? "GROUP_1" : req.groupType || "WHOLE";
        const occKey = getTeacherOccKey(req.teacherId, rescueSlot.day, rescueSlot.period, req.classId, classMap, shifts);
        teacherOccupancy.set(occKey, (teacherOccupancy.get(occKey) || 0) + 1);

        if (req.groupType === "SPLIT" && req.coTeacherId) {
          const g2 = clsSlots.find(
            (other) => other.day === rescueSlot.day && other.period === rescueSlot.period && other.groupType === "GROUP_2"
          );
          if (g2 && g2.teacherId === null && !g2.isLocked) {
            g2.teacherId = req.coTeacherId;
            g2.subjectId = req.subjectId;
            g2.groupType = "GROUP_2";
            const occCo = getTeacherOccKey(req.coTeacherId, g2.day, g2.period, req.classId, classMap, shifts);
            teacherOccupancy.set(occCo, (teacherOccupancy.get(occCo) || 0) + 1);
          }
        }
      } else {
        unrescued.push(req);
      }
    }
    unassignedReqs.push(...unrescued);
  }
}

export function executeMinConflictsLocalSearch(
  allSlots: Slot[],
  classSlots: Map<string, Slot[]>,
  classMap: Map<string, SchoolClass>,
  teacherMap: Map<string, Teacher>,
  subjectMap: Map<string, Subject>,
  daysCount: number,
  teacherOccupancy: Map<string, number>,
  shifts?: Shift[],
  maxIterations = 200
): number {
  const countClashesForTeacher = (teacherId: string, day: number, period: number, classId: string): number => {
    const k = getTeacherOccKey(teacherId, day, period, classId, classMap, shifts);
    return Math.max(0, (teacherOccupancy.get(k) || 0) - 1);
  };

  let globalClashes = 0;
  for (const count of teacherOccupancy.values()) {
    if (count > 1) globalClashes += count - 1;
  }

  for (let iter = 0; iter < maxIterations && globalClashes > 0; iter++) {
    let improved = false;

    const clashingSlots = allSlots.filter(
      (s) => s.teacherId && !s.isLocked && countClashesForTeacher(s.teacherId, s.day, s.period, s.classId) > 0
    );

    for (const slotA of clashingSlots) {
      if (globalClashes === 0) break;
      const clsSlots = classSlots.get(slotA.classId) || [];
      const candidateSlots = clsSlots.filter((s) => !s.isLocked && s !== slotA);

      let bestTarget: Slot | null = null;
      let bestDelta = 0;

      for (const slotB of candidateSlots) {
        const tA = slotA.teacherId!;
        const sA = slotA.subjectId!;
        const tB = slotB.teacherId;
        const sB = slotB.subjectId;

        const swapShiftGrp = resolveShiftGroup(slotA.classId, classMap, shifts);
        if (!checkTeacherSlotAvailable(slotB.day, slotB.period, tA, sA, swapShiftGrp, slotA.classId, teacherMap, subjectMap, classMap)) continue;
        if (tB && sB && !checkTeacherSlotAvailable(slotA.day, slotA.period, tB, sB, swapShiftGrp, slotA.classId, teacherMap, subjectMap, classMap)) continue;

        const clsA = classMap.get(slotA.classId);
        const isPrimaryClsA = Boolean(clsA?.isPrimary) || ((clsA?.grade ?? 5) <= 4);
        if (isPrimaryClsA && slotB.period >= 6) continue;

        const allowDoubleA = checkSubjectCanHaveDoubleLesson(slotA.classId, sA, undefined, classMap, subjectMap, daysCount);
        const sameSubAInDayB = clsSlots.filter(
          (s) => s !== slotA && s !== slotB && s.day === slotB.day && s.subjectId === sA
        );
        if (!allowDoubleA && sameSubAInDayB.length > 0) continue;
        if (allowDoubleA) {
          if (sameSubAInDayB.length >= 2) continue;
          if (sameSubAInDayB.length === 1 && Math.abs(sameSubAInDayB[0].period - slotB.period) !== 1) continue;
        }

        if (tB && sB) {
          const clsB = classMap.get(slotB.classId);
          const isPrimaryClsB = Boolean(clsB?.isPrimary) || ((clsB?.grade ?? 5) <= 4);
          if (isPrimaryClsB && slotA.period >= 6) continue;

          const allowDoubleB = checkSubjectCanHaveDoubleLesson(slotB.classId, sB, undefined, classMap, subjectMap, daysCount);
          const sameSubBInDayA = clsSlots.filter(
            (s) => s !== slotA && s !== slotB && s.day === slotA.day && s.subjectId === sB
          );
          if (!allowDoubleB && sameSubBInDayA.length > 0) continue;
          if (allowDoubleB) {
            if (sameSubBInDayA.length >= 2) continue;
            if (sameSubBInDayA.length === 1 && Math.abs(sameSubBInDayA[0].period - slotA.period) !== 1) continue;
          }
        }

        const clashesA_now = countClashesForTeacher(tA, slotA.day, slotA.period, slotA.classId);
        const clashesB_now = tB ? countClashesForTeacher(tB, slotB.day, slotB.period, slotB.classId) : 0;

        const occA_target = teacherOccupancy.get(getTeacherOccKey(tA, slotB.day, slotB.period, slotA.classId, classMap, shifts)) || 0;
        const occB_target = tB ? (teacherOccupancy.get(getTeacherOccKey(tB, slotA.day, slotA.period, slotA.classId, classMap, shifts)) || 0) : 0;

        const delta = clashesA_now + clashesB_now - (occA_target + occB_target);

        if (delta > bestDelta) {
          bestDelta = delta;
          bestTarget = slotB;
        }
      }

      if (bestTarget && bestDelta > 0) {
        const tA = slotA.teacherId!;
        const sA = slotA.subjectId!;
        const gA = slotA.groupType;

        const tB = bestTarget.teacherId;
        const sB = bestTarget.subjectId;
        const gB = bestTarget.groupType;

        const keyA_old = getTeacherOccKey(tA, slotA.day, slotA.period, slotA.classId, classMap, shifts);
        teacherOccupancy.set(keyA_old, (teacherOccupancy.get(keyA_old) || 1) - 1);

        if (tB) {
          const keyB_old = getTeacherOccKey(tB, bestTarget.day, bestTarget.period, bestTarget.classId, classMap, shifts);
          teacherOccupancy.set(keyB_old, (teacherOccupancy.get(keyB_old) || 1) - 1);
        }

        slotA.teacherId = tB;
        slotA.subjectId = sB;
        slotA.groupType = gB;

        bestTarget.teacherId = tA;
        bestTarget.subjectId = sA;
        bestTarget.groupType = gA;

        const keyA_new = getTeacherOccKey(tA, bestTarget.day, bestTarget.period, bestTarget.classId, classMap, shifts);
        teacherOccupancy.set(keyA_new, (teacherOccupancy.get(keyA_new) || 0) + 1);

        if (tB) {
          const keyB_new = getTeacherOccKey(tB, slotA.day, slotA.period, slotA.classId, classMap, shifts);
          teacherOccupancy.set(keyB_new, (teacherOccupancy.get(keyB_new) || 0) + 1);
        }

        if (bestDelta > 0) {
          globalClashes -= bestDelta;
          improved = true;
        }
        if (globalClashes === 0) break;
      }
    }

    if (!improved && iter > 100) break;
  }

  return globalClashes;
}
