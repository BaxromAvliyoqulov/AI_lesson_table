import { useCallback, useEffect } from "react";
import { getSchoolFullData, syncFullSchoolDataAction } from "@/lib/actions/school.actions";
import { sortClassesByName } from "@/lib/utils";
import { isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";
import { SchoolClass, Teacher, Subject, Lesson } from "@/types";
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

  // 1. Sinflarni tekshirish va sinf rahbari bo'lgan sinflarga 1 soatlik Sinf soatini kafolatlash
  const normalizedClasses = classes.map((c) => {
    const teacherByClass = teachers.find((t) => t.homeroomClassId === c.id);
    const hrTeacherId = c.homeroomTeacherId || teacherByClass?.id;

    if (!hrTeacherId) return c;

    const existingSubjects = c.subjects || [];
    const hasSinfSoati = existingSubjects.some((s) =>
      isKelajakOrSinfSoatiSubject(s.subjectId)
    );

    let updatedSubjects = existingSubjects;
    if (!hasSinfSoati) {
      updatedSubjects = [
        ...existingSubjects,
        {
          classId: c.id,
          subjectId: finalSubId,
          hoursPerWeek: 1,
          weeklyHours: 1,
          teacherId: hrTeacherId,
          canSplit: false,
          isMandatory: true,
          groupType: "WHOLE",
        } as any,
      ];
    } else {
      updatedSubjects = existingSubjects.map((s) =>
        isKelajakOrSinfSoatiSubject(s.subjectId)
          ? { ...s, teacherId: hrTeacherId }
          : s
      );
    }

    return {
      ...c,
      homeroomTeacherId: hrTeacherId,
      subjects: updatedSubjects,
    };
  });

  // 2. O'qituvchilarni tekshirish: sinf rahbarlariga Sinf soati fanini qo'shish
  const normalizedTeachers = teachers.map((t) => {
    const hrClass = normalizedClasses.find(
      (c) => c.homeroomTeacherId === t.id || t.homeroomClassId === c.id
    );
    if (hrClass) {
      const currentSubIds = t.subjectIds || [];
      const newSubIds = currentSubIds.includes(finalSubId)
        ? currentSubIds
        : [...currentSubIds, finalSubId];
      return {
        ...t,
        homeroomClassId: hrClass.id,
        subjectIds: newSubIds,
      };
    }
    return t;
  });

  // 3. Dars jadvalida Dushanba 1-soat darsini kafolatlash
  const normalizedLessons = [...lessons];
  normalizedClasses.forEach((c) => {
    if (c.homeroomTeacherId) {
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
      } else if (
        isKelajakOrSinfSoatiSubject(mondayFirstLesson.subjectId) &&
        mondayFirstLesson.teacherId !== c.homeroomTeacherId
      ) {
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
