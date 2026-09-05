import { useCallback, useEffect } from "react";
import { getSchoolFullData, syncFullSchoolDataAction } from "@/lib/actions/school.actions";
import { sortClassesByName, normalizeClassName } from "@/lib/utils";
import { isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";
import { SchoolClass, Teacher, Subject, Lesson, ClassSubject } from "@/types";
import {
  storeState,
  updateStore,
  saveLocalStorageState,
  getLocalStorageState,
  hasHydrated,
  setHasHydrated,
  syncChannel,
  addAuditLog,
} from "./store-core";

export function normalizeHomeroomSinfSoati({
  classes,
  teachers,
  subjects,
  lessons,
}: {
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  lessons: Lesson[];
}) {
  const sinfSoatiSub =
    subjects.find((s) => isKelajakOrSinfSoatiSubject(s.id, s.name)) ||
    subjects.find((s) => s.id === "sub_sinf_soati");
  const finalSubId = sinfSoatiSub?.id || "sub_sinf_soati";

  // 1. Qat'iy 1-ga-1 xarita (One-to-One Canonical Homeroom Map):
  // 1 sinf = faqat 1 nafar o'qituvchi.
  // 1 o'qituvchi = faqat 1 ta sinf.
  const classToTeacherMap = new Map<string, string>();
  const assignedTeachers = new Set<string>();

  // 1-bosqich: Sinflar o'zida ko'rsatilgan homeroomTeacherId (eng ustun va aktual)
  for (const c of classes) {
    if (c.homeroomTeacherId && !assignedTeachers.has(c.homeroomTeacherId)) {
      const teacherExists = teachers.some((t) => t.id === c.homeroomTeacherId);
      if (teacherExists) {
        classToTeacherMap.set(c.id, c.homeroomTeacherId);
        assignedTeachers.add(c.homeroomTeacherId);
      }
    }
  }

  // 2-bosqich: O'qituvchilarda homeroomClassId ko'rsatilgan bo'lsa (faqat hali band bo'lmaganlar)
  for (const t of teachers) {
    if (
      t.homeroomClassId &&
      !assignedTeachers.has(t.id) &&
      !classToTeacherMap.has(t.homeroomClassId)
    ) {
      const classExists = classes.some((c) => c.id === t.homeroomClassId);
      if (classExists) {
        classToTeacherMap.set(t.homeroomClassId, t.id);
        assignedTeachers.add(t.id);
      }
    }
  }

  // 3-bosqich: O'z-o'zini tiklash (Self-Healing Guardian):
  // Agar sinfda hali ham rahbar topilmagan bo'lsa, dars jadvalidagi Dushanba 1-soat darsidan yoki Kelajak soatidan tiklash
  for (const c of classes) {
    if (!classToTeacherMap.has(c.id)) {
      // a) Dars jadvalida Dushanba 1-soat (Kelajak soati) darsi
      const mondayLesson = lessons.find(
        (l) => l.classId === c.id && l.dayOfWeek === 1 && l.periodNumber === 1 && l.teacherId
      );
      if (mondayLesson && !assignedTeachers.has(mondayLesson.teacherId)) {
        const teacherExists = teachers.some((t) => t.id === mondayLesson.teacherId);
        if (teacherExists) {
          classToTeacherMap.set(c.id, mondayLesson.teacherId);
          assignedTeachers.add(mondayLesson.teacherId);
          continue;
        }
      }

      // b) Sinf o'quv rejasidagi Kelajak soati
      const kelajakSubject = (c.subjects || []).find((s) => {
        const sub = subjects.find((subItem) => subItem.id === s.subjectId);
        return isKelajakOrSinfSoatiSubject(s.subjectId, sub?.name) && s.teacherId;
      });
      if (kelajakSubject && kelajakSubject.teacherId && !assignedTeachers.has(kelajakSubject.teacherId)) {
        const teacherExists = teachers.some((t) => t.id === kelajakSubject.teacherId);
        if (teacherExists) {
          classToTeacherMap.set(c.id, kelajakSubject.teacherId);
          assignedTeachers.add(kelajakSubject.teacherId);
        }
      }
    }
  }

  // Reverse map: teacherId -> classId
  const teacherToClassMap = new Map<string, string>();
  for (const [clsId, tId] of classToTeacherMap.entries()) {
    teacherToClassMap.set(tId, clsId);
  }

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const isSinfSoatiCheck = (sId: string) => {
    const sub = subjectMap.get(sId);
    return isKelajakOrSinfSoatiSubject(sId, sub?.name);
  };

  // 2. Sinflarni tekshirish: har bir sinfda FAQAT VA FAQAT 1 DONA Sinf soati (1 soat) bo'lishini kafolatlash
  // va barcha fanlar dublikatlarini (ayni bir xil subjectId) butunlay tozalash
  const normalizedClasses = classes.map((c) => {
    const hrTeacherId = classToTeacherMap.get(c.id);
    const existingSubjects = c.subjects || [];

    if (!hrTeacherId) {
      const cleanSubjects = existingSubjects.filter(
        (s) => !isSinfSoatiCheck(s.subjectId)
      );
      // Fanlar dublikatini tozalash (Deduplication) - Guruhlarni (GROUP_1, GROUP_2) saqlagan holda
      const dedupedClean: ClassSubject[] = [];
      const seenIds = new Set<string>();
      for (const s of cleanSubjects) {
        const subKey = `${s.subjectId}_${s.groupType || "WHOLE"}`;
        if (!seenIds.has(subKey)) {
          seenIds.add(subKey);
          dedupedClean.push(s);
        }
      }
      return {
        ...c,
        name: normalizeClassName(c.name),
        homeroomTeacherId: undefined,
        subjects: dedupedClean,
      };
    }

    // Barcha eski va dublikat Sinf soatlarini butunlay tozalaymiz
    const otherSubjects = existingSubjects.filter(
      (s) => !isSinfSoatiCheck(s.subjectId)
    );

    // Boshqa fanlar dublikatini ham tozalash (GROUP_1 va GROUP_2 ni saqlaymiz)
    const dedupedOther: ClassSubject[] = [];
    const seenOtherIds = new Set<string>();
    for (const s of otherSubjects) {
      const subKey = `${s.subjectId}_${s.groupType || "WHOLE"}`;
      if (!seenOtherIds.has(subKey)) {
        seenOtherIds.add(subKey);
        dedupedOther.push(s);
      }
    }

    // QAT'IY 1 DONA (1 soatlik) SINF SOATI
    const singleHomeroomHour: ClassSubject = {
      classId: c.id,
      subjectId: finalSubId,
      hoursPerWeek: 1,
      weeklyHours: 1,
      teacherId: hrTeacherId,
      canSplit: false,
      isMandatory: true,
      groupType: "WHOLE",
    } as any;

    return {
      ...c,
      name: normalizeClassName(c.name),
      homeroomTeacherId: hrTeacherId,
      subjects: [...dedupedOther, singleHomeroomHour],
    };
  });

  // 3. O'qituvchilarni tekshirish: sinf rahbarlariga Sinf soati fanini qo'shish va toifani (Boshlang'ich/Katta/Hammasi) avtomatik aniqlash
  const normalizedTeachers = teachers.map((t) => {
    const assignedClassId = teacherToClassMap.get(t.id);
    const hrClass = assignedClassId
      ? normalizedClasses.find((c) => c.id === assignedClassId)
      : undefined;

    let teachingStages = t.teachingStages;
    if (!teachingStages || teachingStages === "BOTH") {
      if (hrClass) {
        if ((hrClass.grade && hrClass.grade <= 4) || hrClass.isPrimary) {
          teachingStages = "PRIMARY";
        } else if (hrClass.grade && hrClass.grade >= 5) {
          teachingStages = "HIGH";
        }
      } else if (t.subjectIds && t.subjectIds.length > 0) {
        const teacherSubs = t.subjectIds
          .map((sid) => subjects.find((s) => s.id === sid))
          .filter(Boolean) as Subject[];
        const highKeywords = [
          "algebra", "geometriya", "fizika", "kimyo", "biologiya",
          "geografiya", "tarix", "huquq", "astronomiya", "adabiyot", "chqbt"
        ];
        const primaryKeywords = ["o'qish", "o'qish savodxonligi", "alifbe"];
        const hasHigh = teacherSubs.some((s) =>
          highKeywords.some((k) => (s.name || "").toLowerCase().includes(k))
        );
        const hasPrimary = teacherSubs.some((s) =>
          primaryKeywords.some((k) => (s.name || "").toLowerCase().includes(k))
        );
        const hasOnaTili = teacherSubs.some((s) =>
          (s.name || "").toLowerCase().includes("ona tili")
        );
        const hasMat = teacherSubs.some((s) =>
          (s.name || "").toLowerCase().includes("matematika")
        );

        if (hasPrimary && !hasHigh) {
          teachingStages = "PRIMARY";
        } else if (hasHigh && !hasPrimary) {
          teachingStages = "HIGH";
        } else if (hasOnaTili && hasMat && !hasHigh) {
          teachingStages = "PRIMARY";
        }
      }
    }

    if (hrClass) {
      const currentSubIds = t.subjectIds || [];
      const newSubIds = currentSubIds.includes(finalSubId)
        ? currentSubIds
        : [...currentSubIds, finalSubId];
      return {
        ...t,
        homeroomClassId: hrClass.id,
        subjectIds: newSubIds,
        teachingStages: teachingStages || "BOTH",
      };
    }

    // Sinf rahbari bo'lmagan o'qituvchilarda homeroomClassId qat'iy undefined bo'ladi (arvoh ziddiyatlar yo'qoladi)
    return {
      ...t,
      homeroomClassId: undefined,
      teachingStages: teachingStages || "BOTH",
    };
  });

  // 3. Dars jadvalida har bir sinfda faqat Dushanba 1-soatda 1 dona Sinf soati bo'ladi
  let normalizedLessons = [...lessons];
  normalizedClasses.forEach((c) => {
    if (c.homeroomTeacherId) {
      // Dushanba 1-soatdan tashqari barcha ortiqcha Sinf soatlarini olib tashlash
      normalizedLessons = normalizedLessons.filter(
        (l) =>
          !(
            l.classId === c.id &&
            isSinfSoatiCheck(l.subjectId) &&
            !(l.dayOfWeek === 1 && l.periodNumber === 1)
          )
      );

      const mondayFirstLesson = normalizedLessons.find(
        (l) => l.classId === c.id && l.dayOfWeek === 1 && l.periodNumber === 1
      );
      if (!mondayFirstLesson) {
        normalizedLessons.push({
          id: `lesson_monday_1_${c.id}_${Date.now()}`,
          scheduleId: "official_39_schedule",
          schoolId: c.schoolId,
          branchId: c.branchId || "",
          classId: c.id,
          subjectId: finalSubId,
          teacherId: c.homeroomTeacherId,
          dayOfWeek: 1,
          periodNumber: 1,
          isLocked: true,
        });
      } else {
        mondayFirstLesson.subjectId = finalSubId;
        mondayFirstLesson.teacherId = c.homeroomTeacherId;
        mondayFirstLesson.isLocked = true;
      }
    }
  });

  return {
    classes: normalizedClasses,
    teachers: normalizedTeachers,
    lessons: normalizedLessons,
  };
}

export function useStoreSync() {
  const fetchServerData = useCallback(async (schoolIdToFetch?: string, silent = false) => {
    const targetId = schoolIdToFetch || storeState.currentSchoolId;
    if (!silent) {
      updateStore((prev) => ({ ...prev, syncStatus: "syncing" }), false);
    }
    try {
      const res = await getSchoolFullData(targetId);
      if (res.success && res.data) {
        const {
          schoolInfo,
          branches,
          shifts,
          subjects,
          rooms,
          teachers,
          classes,
          lessons,
          bellPeriods,
        } = res.data;

        const normalized = normalizeHomeroomSinfSoati({
          classes: sortClassesByName(classes),
          teachers,
          subjects,
          lessons,
        });

        updateStore(
          (prev) => {
            const newState = {
              ...prev,
              currentSchoolId: schoolInfo.id,
              schools: [
                schoolInfo,
                ...prev.schools.filter((s) => s.id !== schoolInfo.id && s.id !== "school_39"),
              ],
              branches,
              shifts,
              subjects,
              rooms,
              teachers: normalized.teachers,
              classes: normalized.classes,
              lessons: normalized.lessons,
              bellPeriods: bellPeriods.length > 0 ? bellPeriods : prev.bellPeriods,
              syncStatus: "synced" as const,
            };
            saveLocalStorageState(newState);
            return newState;
          },
          false
        );
      } else {
        if (!silent) {
          updateStore((prev) => ({ ...prev, syncStatus: "synced" }), false);
        }
      }
    } catch (err) {
      console.error("fetchServerData xatosi:", err);
      if (!silent) {
        updateStore((prev) => ({ ...prev, syncStatus: "offline" }), false);
      }
    }
  }, []);

  const setCurrentSchoolId = useCallback(
    (id: string) => {
      updateStore((prev) => ({ ...prev, currentSchoolId: id }));
      fetchServerData(id);
    },
    [fetchServerData]
  );

  const syncToCloud = useCallback(async () => {
    updateStore((prev) => ({ ...prev, syncStatus: "syncing" }));
    try {
      const cur = storeState;
      const currentSchool = cur.schools.find((s) => s.id === cur.currentSchoolId) || cur.schools[0];
      const res = await syncFullSchoolDataAction(cur.currentSchoolId, {
        schoolInfo: currentSchool,
        branches: cur.branches.filter((b) => b.schoolId === cur.currentSchoolId),
        shifts: cur.shifts.filter((s) => s.schoolId === cur.currentSchoolId),
        subjects: cur.subjects.filter((s) => s.schoolId === cur.currentSchoolId),
        rooms: cur.rooms.filter((r) => r.schoolId === cur.currentSchoolId),
        teachers: cur.teachers.filter((t) => t.schoolId === cur.currentSchoolId),
        classes: cur.classes.filter((c) => c.schoolId === cur.currentSchoolId),
        lessons: cur.lessons.filter((l) => l.schoolId === cur.currentSchoolId),
      });

      if (res.success && res.schoolId) {
        updateStore((prev) => ({
          ...prev,
          currentSchoolId: res.schoolId,
          syncStatus: "synced",
        }));
        addAuditLog("Bulutga sinxronlandi", "Barcha ma'lumotlar Neon PostgreSQL bulutiga to'liq saqlandi");
        return { success: true };
      } else {
        updateStore((prev) => ({ ...prev, syncStatus: "error" }));
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      console.error("syncToCloud xatosi:", err);
      updateStore((prev) => ({ ...prev, syncStatus: "error" }));
      return { success: false, error: err?.message };
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      setHasHydrated(true);
      const saved = getLocalStorageState();
      if (saved) {
        const normalized = normalizeHomeroomSinfSoati({
          classes: saved.classes || [],
          teachers: saved.teachers || [],
          subjects: saved.subjects || [],
          lessons: saved.lessons || [],
        });
        updateStore(
          (prev) => ({
            ...prev,
            ...saved,
            classes: normalized.classes,
            teachers: normalized.teachers,
            lessons: normalized.lessons,
            isGenerating: false,
          }),
          false
        );
      }
      fetchServerData();
    }

    const handleWindowFocus = () => {
      fetchServerData(undefined, true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchServerData(undefined, true);
      }
    };

    const handleBroadcastMessage = (e: MessageEvent) => {
      if (e.data?.type === "LIVE_STORE_MUTATION") {
        fetchServerData(undefined, true);
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener("message", handleBroadcastMessage);
    }

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const heartbeatInterval = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !storeState.isGenerating &&
        storeState.syncStatus !== "syncing"
      ) {
        fetchServerData(undefined, true);
      }
    }, 30000);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (syncChannel) {
        syncChannel.removeEventListener("message", handleBroadcastMessage);
      }
      clearInterval(heartbeatInterval);
    };
  }, [fetchServerData]);

  return {
    fetchServerData,
    setCurrentSchoolId,
    syncToCloud,
  };
}
