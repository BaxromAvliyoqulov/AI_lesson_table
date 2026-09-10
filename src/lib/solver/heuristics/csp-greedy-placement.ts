import { SchoolClass, ClassSubject, Subject, Teacher, Shift } from "@/types";
import { Slot, ReqLesson } from "../core/types";
import {
  checkTeacherSlotAvailable,
  checkSubjectCanHaveDoubleLesson,
  resolveShiftGroup,
  getTeacherOccKey,
} from "../core/csp-constraints";

export function prepareAndSortLessonRequests(
  classes: SchoolClass[],
  effectiveClassSubjects: Map<string, ClassSubject[]>,
  classSlots: Map<string, Slot[]>,
  subjectMap: Map<string, Subject>
): ReqLesson[] {
  const remaining: ReqLesson[] = [];

  for (const cls of classes) {
    if (cls.isClosed) continue;

    const subjects = effectiveClassSubjects.get(cls.id) || [];
    const slots = classSlots.get(cls.id) || [];

    const group1Subjects = subjects.filter((cs) => cs.groupType === "GROUP_1");
    const group2Subjects = subjects.filter((cs) => cs.groupType === "GROUP_2");
    const wholeSubjects = subjects.filter((cs) => !cs.groupType || cs.groupType === "WHOLE");

    // 1. Guruhlarga bo'linadigan fanlarni atomik (parallel) juftlik sifatida tayyorlash
    for (const g1 of group1Subjects) {
      const g2 = group2Subjects.find((s) => s.subjectId === g1.subjectId);
      const sub = subjectMap.get(g1.subjectId);
      let hours = g1.weeklyHours;

      const alreadyLockedHours = slots.filter(
        (s) => s.isLocked && s.subjectId === g1.subjectId && s.groupType === "GROUP_1"
      ).length;
      hours = Math.max(0, hours - alreadyLockedHours);

      for (let h = 0; h < hours; h++) {
        remaining.push({
          id: `req_${cls.id}_${g1.subjectId}_split_${h}`,
          classId: cls.id,
          branchId: cls.branchId,
          subjectId: g1.subjectId,
          teacherId: g1.teacherId,
          coTeacherId: g2 ? g2.teacherId : undefined,
          groupType: "SPLIT",
          difficulty: sub?.difficultyScore || 5,
          weeklyHours: g1.weeklyHours,
          grade: cls.grade ?? 5,
        });
      }
    }

    // Yetim qolgan GROUP_2 fanlar (agar g1 topilmasa, WHOLE sifatida dars beriladi)
    for (const g2 of group2Subjects) {
      const hasG1 = group1Subjects.some((s) => s.subjectId === g2.subjectId);
      if (hasG1) continue;
      const sub = subjectMap.get(g2.subjectId);
      let hours = g2.weeklyHours;
      const alreadyLockedHours = slots.filter(
        (s) => s.isLocked && s.subjectId === g2.subjectId
      ).length;
      hours = Math.max(0, hours - alreadyLockedHours);

      for (let h = 0; h < hours; h++) {
        remaining.push({
          id: `req_${cls.id}_${g2.subjectId}_whole_${h}`,
          classId: cls.id,
          branchId: cls.branchId,
          subjectId: g2.subjectId,
          teacherId: g2.teacherId,
          groupType: "WHOLE",
          difficulty: sub?.difficultyScore || 5,
          weeklyHours: g2.weeklyHours,
          grade: cls.grade ?? 5,
        });
      }
    }

    // 2. Butun sinf fanlarini tayyorlash
    for (const ws of wholeSubjects) {
      if (!ws.teacherId || !ws.weeklyHours) continue;
      const sub = subjectMap.get(ws.subjectId);
      let hours = ws.weeklyHours;

      const alreadyLockedHours = slots.filter(
        (s) => s.isLocked && s.subjectId === ws.subjectId && s.teacherId === ws.teacherId
      ).length;
      hours = Math.max(0, hours - alreadyLockedHours);

      const isSinfSoati =
        ws.subjectId === "sub_sinf_soati" ||
        ws.subjectId === "sub_kelajak" ||
        sub?.name.toLowerCase().includes("sinf soati") ||
        sub?.name.toLowerCase().includes("kelajak");

      if (isSinfSoati && slots.some((s) => s.isLocked && s.day === 1 && s.period === 1)) {
        hours--;
      }

      for (let h = 0; h < Math.max(0, hours); h++) {
        remaining.push({
          id: `req_${cls.id}_${ws.subjectId}_whole_${h}`,
          classId: cls.id,
          branchId: cls.branchId,
          subjectId: ws.subjectId,
          teacherId: ws.teacherId,
          groupType: "WHOLE",
          difficulty: sub?.difficultyScore || 5,
          weeklyHours: ws.weeklyHours,
          grade: cls.grade ?? 5,
        });
      }
    }
  }

  const teacherHourCount = new Map<string, number>();
  const teacherClassCount = new Map<string, Set<string>>();
  remaining.forEach((r) => {
    teacherHourCount.set(r.teacherId, (teacherHourCount.get(r.teacherId) || 0) + 1);
    if (r.coTeacherId) {
      teacherHourCount.set(r.coTeacherId, (teacherHourCount.get(r.coTeacherId) || 0) + 1);
    }
    if (!teacherClassCount.has(r.teacherId)) teacherClassCount.set(r.teacherId, new Set());
    teacherClassCount.get(r.teacherId)!.add(r.classId);
  });

  remaining.sort((a, b) => {
    // 0. Parallel SPLIT darslar ikkita o'qituvchini talab qilgani uchun eng qattiq cheklovli
    if (a.groupType === "SPLIT" && b.groupType !== "SPLIT") return -1;
    if (b.groupType === "SPLIT" && a.groupType !== "SPLIT") return 1;

    // 1. Boshlang'ich sinflarda haftalik soati kunlar soniga teng bo'lgan fanlar
    const isPrimaryA = a.grade <= 4;
    const isPrimaryB = b.grade <= 4;
    const bottleneckA = isPrimaryA && a.weeklyHours >= 4 ? a.weeklyHours * 20 : 0;
    const bottleneckB = isPrimaryB && b.weeklyHours >= 4 ? b.weeklyHours * 20 : 0;
    if (bottleneckB !== bottleneckA) return bottleneckB - bottleneckA;

    // 2. O'qituvchi qancha ko'p sinfga kirsa, u eng qattiq cheklovli (bottleneck)
    const classesA = teacherClassCount.get(a.teacherId)?.size || 0;
    const classesB = teacherClassCount.get(b.teacherId)?.size || 0;
    if (classesB !== classesA) return classesB - classesA;

    // 3. O'qituvchining umumiy soatlari soni
    const hA = teacherHourCount.get(a.teacherId) || 0;
    const hB = teacherHourCount.get(b.teacherId) || 0;
    if (hB !== hA) return hB - hA;

    // 4. Fanning haftalik soati
    if (b.weeklyHours !== a.weeklyHours) return b.weeklyHours - a.weeklyHours;

    // 5. Fanning murakkablik darajasi (SanPiN)
    return b.difficulty - a.difficulty;
  });

  return remaining;
}

export function executeGreedyPlacement(
  remaining: ReqLesson[],
  classSlots: Map<string, Slot[]>,
  classMap: Map<string, SchoolClass>,
  teacherMap: Map<string, Teacher>,
  subjectMap: Map<string, Subject>,
  daysCount: number,
  teacherOccupancy: Map<string, number>,
  teacherDailyHours: Map<string, number>,
  shifts?: Shift[],
  attempt = 0
): ReqLesson[] {
  const unassignedReqs: ReqLesson[] = [];

  // Har bir sinfning jami dars talabini hisoblash (kunlik yuklamani teng taqsimlash uchun)
  const classTotalReqHours = new Map<string, number>();
  remaining.forEach((r) => {
    classTotalReqHours.set(r.classId, (classTotalReqHours.get(r.classId) || 0) + 1);
  });

  // Sinflarning kunlik yuklamasini kuzatish
  const classDailyHours = new Map<string, number>();
  for (const [cId, cSlots] of classSlots.entries()) {
    for (const s of cSlots) {
      if (s.teacherId !== null && s.groupType !== "GROUP_2") {
        const k = `${cId}_${s.day}`;
        classDailyHours.set(k, (classDailyHours.get(k) || 0) + 1);
      }
    }
  }

  while (remaining.length > 0) {
    const req = remaining.shift()!;
    const slots = classSlots.get(req.classId) || [];
    const clsObj = classMap.get(req.classId);
    const isPrimary = (clsObj?.grade !== undefined && clsObj.grade <= 4) || Boolean(clsObj?.isPrimary);
    const availableDays = isPrimary ? 5 : 6;

    const lockedCount = slots.filter((s) => s.isLocked && s.groupType !== "GROUP_2").length;
    const totalClassHours = (classTotalReqHours.get(req.classId) || 0) + lockedCount;

    // Matematik qat'iy kunlik me'yor (Strict Daily Invariant):
    // Masalan: 31 soat => baseDaily = 5, extraDaysAllowed = 1 (faqat 1 kunda 6 soat, qolgan 5 kunda 5 soat!)
    // 30 soat => baseDaily = 5, extraDaysAllowed = 0 (barcha 6 kunda 5 soat!)
    const baseDaily = Math.floor(totalClassHours / availableDays);
    const extraDaysAllowed = totalClassHours % availableDays;

    let daysWithExtra = 0;
    for (let d = 1; d <= availableDays; d++) {
      const cnt = classDailyHours.get(`${req.classId}_${d}`) || 0;
      if (cnt > baseDaily) daysWithExtra++;
    }

    const allowDouble = checkSubjectCanHaveDoubleLesson(
      req.classId,
      req.subjectId,
      req.weeklyHours,
      classMap,
      subjectMap,
      daysCount
    );

    const filterSlots = (relaxed: boolean) =>
      slots.filter((s) => {
        if (s.groupType === "GROUP_2") return false;
        if (s.isLocked || s.teacherId !== null) return false;
        if (s.day === 1 && s.period === 1) return false;
        if (isPrimary && s.day === 6) return false;
        if (isPrimary && s.period >= 6) return false;

        if (req.groupType === "SPLIT") {
          const g2Slot = slots.find(
            (other) => other.day === s.day && other.period === s.period && other.groupType === "GROUP_2"
          );
          if (!g2Slot || g2Slot.teacherId !== null || g2Slot.isLocked) return false;

          if (req.coTeacherId) {
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
                classMap,
                relaxed
              )
            ) {
              return false;
            }
            const occKeyCo = getTeacherOccKey(req.coTeacherId, s.day, s.period, req.classId, classMap, shifts);
            if ((teacherOccupancy.get(occKeyCo) || 0) > 0) return false;
          }
        }

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
            classMap,
            relaxed
          )
        ) {
          return false;
        }
        const occKey = getTeacherOccKey(req.teacherId, s.day, s.period, req.classId, classMap, shifts);
        if ((teacherOccupancy.get(occKey) || 0) > 0) return false;

        const sameSubjectSlotsInDay = slots.filter(
          (other) => other.day === s.day && other.subjectId === req.subjectId && other.groupType !== "GROUP_2"
        );

        if (!allowDouble && sameSubjectSlotsInDay.length >= 1) return false;
        if (sameSubjectSlotsInDay.length >= 2) return false;
        if (allowDouble && sameSubjectSlotsInDay.length === 1) {
          const existingPeriod = sameSubjectSlotsInDay[0].period;
          if (Math.abs(existingPeriod - s.period) !== 1) return false;
        }

        return true;
      });

    const candidateSlots = filterSlots(false);
    if (candidateSlots.length === 0) {
      unassignedReqs.push(req);
      continue;
    }

    let bestSlot = candidateSlots[0];
    let bestScore = Infinity;

    for (const slot of candidateSlots) {
      let score = 0;

      // 1. SINF KUNLIK YUKLAMASINI QAT'IY BALANSLASH (Zero Starvation, Min >= 4-5)
      const classDayKey = `${req.classId}_${slot.day}`;
      const currentClassDaily = classDailyHours.get(classDayKey) || 0;
      const minDailyThreshold = isPrimary ? 4 : 4;
      const maxDailyThreshold = isPrimary ? 5 : 6;

      if (currentClassDaily >= maxDailyThreshold) {
        // Kunlik mutlaq limitdan (5 yoki 6) oshish taqiqlanadi
        score += 150000000;
      } else if (currentClassDaily < minDailyThreshold) {
        // Darsi 1, 2, 3 ta bo'lgan kunlarga eng yuqori to'ldirish rag'bati (Min >= 4-5 soat)
        score -= (minDailyThreshold - currentClassDaily) * 15000000;
      } else if (currentClassDaily < baseDaily) {
        // baseDaily (masalan 5) ga yetkazish
        score -= (baseDaily - currentClassDaily) * 3000000;
      } else if (currentClassDaily === baseDaily) {
        if (daysWithExtra >= extraDaysAllowed) {
          score += 2500000; // Qo'shimcha kunlar ishlatilgan bo'lsa cheklash, lekin dars tushishi mumkin
        } else {
          score += 100000;
        }
      } else {
        score += 5000000;
      }

      // 2. DARSLARNING KETMA-KETLIGI (ORALIQ DARCHALARSIZ / STRICT CONTIGUOUS)
      const assignedPeriodsOnDay = slots
        .filter((s) => s.day === slot.day && s.teacherId !== null && s.groupType !== "GROUP_2")
        .map((s) => s.period)
        .sort((a, b) => a - b);

      if (assignedPeriodsOnDay.length > 0) {
        const minP = assignedPeriodsOnDay[0];
        const maxP = assignedPeriodsOnDay[assignedPeriodsOnDay.length - 1];

        if (slot.period > minP && slot.period < maxP) {
          score -= 800000; // Mavjud bo'shliqni (oknoni) yopishga eng yuqori rag'bat!
        } else if (slot.period === maxP + 1) {
          score -= 600000; // Keyingi ketma-ket slotga kuchli rag'bat!
        } else if (slot.period > maxP + 1) {
          const gap = slot.period - maxP - 1;
          score += gap * 95000000; // Oraliq darcha ochishga o'ta og'ir jarima
        } else if (slot.period === minP - 1) {
          score -= 400000; // Oldingi ketma-ket slotga rag'bat
        } else if (slot.period < minP - 1) {
          const gap = minP - 1 - slot.period;
          score += gap * 95000000;
        }
      } else {
        // Kunning 1-darsi: albatta 1-soatdan boshlanishi shart!
        if (slot.period === 1) {
          score -= 500000;
        } else if (slot.day === 1 && slot.period === 2) {
          score -= 450000; // Dushanba 1-soat Kelajak soati bo'lsa, 2-soat tabiiy boshlanish
        } else {
          score += (slot.period - 1) * 50000000; // Kunda 1-dars bo'la turib 2, 3, 4-soatdan boshlashga og'ir jarima
        }
      }

      // 3. O'QITUVCHINING KUNLIK YUKLAMASI (Foydalanuvchi qoidasi: yuklama ko'p bo'lsa 5 dan oshishi mumkin)
      const tDayKey = `${req.teacherId}_${slot.day}`;
      const tDaily = teacherDailyHours.get(tDayKey) || 0;
      const tObj = teacherMap.get(req.teacherId);
      const tCap = tObj?.weeklyHourCapacity || 20;
      const minNeededDaily = Math.ceil(tCap / 5);
      const maxTeacherDaily = Math.max(tObj?.maxConsecutiveHours || 5, minNeededDaily);
      if (tDaily >= maxTeacherDaily) {
        score += (tDaily - maxTeacherDaily + 1) * 20000000;
      } else {
        score += tDaily * 1000;
      }

      // 4. O'QITUVCHI ORALIG'IDAGI DARCHALARNI KAMAYTIRISH
      const adj1 = teacherOccupancy.get(getTeacherOccKey(req.teacherId, slot.day, slot.period - 1, req.classId, classMap, shifts)) || 0;
      const adj2 = teacherOccupancy.get(getTeacherOccKey(req.teacherId, slot.day, slot.period + 1, req.classId, classMap, shifts)) || 0;
      if (adj1 > 0 || adj2 > 0) score -= 40;

      // 5. FILIAL SAYOHAT SIYOSATI (Travel Policy)
      if (tObj && tObj.branchIds && tObj.branchIds.length > 1) {
        if (tObj.travelPolicy === "ALTERNATING_DAYS") {
          const isMainBranch = req.branchId === tObj.branchIds[0];
          const isOddDay = slot.day % 2 === 1;
          if (isMainBranch && !isOddDay) score += 20000000;
          else if (!isMainBranch && isOddDay) score += 20000000;
        } else if (tObj.travelPolicy === "BY_DAY") {
          const isMainBranch = req.branchId === tObj.branchIds[0];
          const isFirstHalfOfWeek = slot.day <= 3;
          if (isMainBranch && !isFirstHalfOfWeek) score += 20000000;
          else if (!isMainBranch && isFirstHalfOfWeek) score += 20000000;
        }
      }

      if (attempt > 0) {
        score += Math.random() * (attempt * 10);
      }

      if (score < bestScore) {
        bestScore = score;
        bestSlot = slot;
      }
    }

    // Asosiy slotni joylashtirish
    bestSlot.teacherId = req.teacherId;
    bestSlot.subjectId = req.subjectId;
    bestSlot.groupType = req.groupType === "SPLIT" ? "GROUP_1" : req.groupType;

    const occKey = getTeacherOccKey(req.teacherId, bestSlot.day, bestSlot.period, req.classId, classMap, shifts);
    teacherOccupancy.set(occKey, (teacherOccupancy.get(occKey) || 0) + 1);

    const classDayKey = `${req.classId}_${bestSlot.day}`;
    classDailyHours.set(classDayKey, (classDailyHours.get(classDayKey) || 0) + 1);

    const tDayKey = `${req.teacherId}_${bestSlot.day}`;
    teacherDailyHours.set(tDayKey, (teacherDailyHours.get(tDayKey) || 0) + 1);

    // Parallel GROUP_2 slotni joylashtirish (SPLIT darslar uchun)
    if (req.groupType === "SPLIT" && req.coTeacherId) {
      const g2Slot = slots.find(
        (s) => s.day === bestSlot.day && s.period === bestSlot.period && s.groupType === "GROUP_2"
      );
      if (g2Slot) {
        g2Slot.teacherId = req.coTeacherId;
        g2Slot.subjectId = req.subjectId;
        g2Slot.groupType = "GROUP_2";

        const occKeyCo = getTeacherOccKey(req.coTeacherId, g2Slot.day, g2Slot.period, req.classId, classMap, shifts);
        teacherOccupancy.set(occKeyCo, (teacherOccupancy.get(occKeyCo) || 0) + 1);

        const tCoDayKey = `${req.coTeacherId}_${g2Slot.day}`;
        teacherDailyHours.set(tCoDayKey, (teacherDailyHours.get(tCoDayKey) || 0) + 1);
      }
    }
  }

  return unassignedReqs;
}
