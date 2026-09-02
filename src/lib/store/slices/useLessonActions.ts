import { useCallback } from "react";
import { Lesson } from "@/types";
import { CSPSolver } from "@/lib/solver/csp-solver";
import {
  saveTimetableLessons,
  updateLessonPositionAction,
  swapLessonsAction,
} from "@/lib/actions/school.actions";
import { storeState, updateStore, addAuditLog } from "../store-core";

let backgroundSchedulerTimer: NodeJS.Timeout | null = null;

export function triggerBackgroundAutoScheduler() {
  if (typeof window === "undefined") return;
  if (backgroundSchedulerTimer) clearTimeout(backgroundSchedulerTimer);

  backgroundSchedulerTimer = setTimeout(() => {
    try {
      const currentSchoolId = storeState.currentSchoolId;
      const schoolClasses = storeState.classes.filter((c) => c.schoolId === currentSchoolId);
      const schoolTeachers = storeState.teachers.filter((t) => t.schoolId === currentSchoolId);
      const schoolSubjects = storeState.subjects.filter((s) => s.schoolId === currentSchoolId);
      const schoolRooms = storeState.rooms.filter((r) => r.schoolId === currentSchoolId);
      const schoolBranches = storeState.branches.filter((b) => b.schoolId === currentSchoolId);
      const schoolShifts = storeState.shifts.filter((s) => s.schoolId === currentSchoolId);

      if (schoolClasses.length === 0 || schoolTeachers.length === 0) return;

      const solver = new CSPSolver({
        classes: schoolClasses,
        teachers: schoolTeachers,
        subjects: schoolSubjects,
        rooms: schoolRooms,
        branches: schoolBranches,
        shifts: schoolShifts,
      });

      const result = solver.solve();
      if (result.success && result.stats.conflictsCount === 0 && result.lessons.length > 0) {
        updateStore((prev) => {
          const lockedMap = new Map(
            prev.lessons.filter((l) => l.isLocked).map((l) => [`${l.classId}_${l.dayOfWeek}_${l.periodNumber}`, l])
          );

          const mergedLessons = result.lessons.map((l) => {
            const locked = lockedMap.get(`${l.classId}_${l.dayOfWeek}_${l.periodNumber}`);
            return locked || l;
          });

          return {
            ...prev,
            lessons: [
              ...prev.lessons.filter((l) => l.schoolId !== currentSchoolId),
              ...mergedLessons,
            ],
          };
        }, false);
      }
    } catch {
      // Safe background handler
    }
  }, 500);
}

export function useLessonActions() {
  const setLessons = useCallback((newLessons: Lesson[]) => {
    updateStore((prev) => {
      const currentSchoolLessons = prev.lessons.filter((l) => l.schoolId === prev.currentSchoolId);
      return {
        ...prev,
        history: [...prev.history.slice(-15), currentSchoolLessons],
        lessons: [
          ...prev.lessons.filter((l) => l.schoolId !== prev.currentSchoolId),
          ...newLessons,
        ],
        syncStatus: "syncing",
      };
    });

    saveTimetableLessons(storeState.currentSchoolId, "active_schedule", newLessons).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  const moveLesson = useCallback(
    (
      lessonId: string,
      dayOfWeek: number,
      periodNumber: number,
      teacherId?: string,
      roomId?: string
    ) => {
      updateStore((prev) => {
        const updated = prev.lessons.map((l) =>
          l.id === lessonId
            ? {
                ...l,
                dayOfWeek,
                periodNumber,
                ...(teacherId ? { teacherId } : {}),
                ...(roomId !== undefined ? { roomId } : {}),
              }
            : l
        );
        return { ...prev, lessons: updated, syncStatus: "syncing" };
      });

      updateLessonPositionAction(
        storeState.currentSchoolId,
        lessonId,
        dayOfWeek,
        periodNumber,
        teacherId,
        roomId
      ).then((res) => {
        updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
      });
    },
    []
  );

  const swapLessons = useCallback(
    (
      lessonA: { id: string; dayOfWeek: number; periodNumber: number },
      lessonB: { id: string; dayOfWeek: number; periodNumber: number }
    ) => {
      updateStore((prev) => {
        const updated = prev.lessons.map((l) => {
          if (l.id === lessonA.id) {
            return { ...l, dayOfWeek: lessonA.dayOfWeek, periodNumber: lessonA.periodNumber };
          }
          if (l.id === lessonB.id) {
            return { ...l, dayOfWeek: lessonB.dayOfWeek, periodNumber: lessonB.periodNumber };
          }
          return l;
        });
        return { ...prev, lessons: updated, syncStatus: "syncing" };
      });

      swapLessonsAction(storeState.currentSchoolId, lessonA, lessonB).then((res) => {
        updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
      });
    },
    []
  );

  const toggleLessonLock = useCallback((lessonId: string) => {
    updateStore((prev) => ({
      ...prev,
      lessons: prev.lessons.map((l) => (l.id === lessonId ? { ...l, isLocked: !l.isLocked } : l)),
    }));
  }, []);

  const toggleLockClass = useCallback((classId: string) => {
    updateStore((prev) => {
      const isLocked = prev.lockedClassIds.includes(classId);
      const nextLockedIds = isLocked
        ? prev.lockedClassIds.filter((id) => id !== classId)
        : [...prev.lockedClassIds, classId];

      const nextLessons = prev.lessons.map((l) => {
        if (l.classId === classId) {
          return { ...l, isLocked: !isLocked };
        }
        return l;
      });

      return {
        ...prev,
        lockedClassIds: nextLockedIds,
        lessons: nextLessons,
      };
    });
    const cls = storeState.classes.find((c) => c.id === classId);
    addAuditLog("Sinf qulflanishi o'zgardi", `${cls?.name || classId} sinfi jadvali holati yangilandi`);
  }, []);

  const toggleLockTeacher = useCallback((teacherId: string) => {
    updateStore((prev) => {
      const isLocked = prev.lockedTeacherIds.includes(teacherId);
      const nextLockedIds = isLocked
        ? prev.lockedTeacherIds.filter((id) => id !== teacherId)
        : [...prev.lockedTeacherIds, teacherId];

      const nextLessons = prev.lessons.map((l) => {
        if (l.teacherId === teacherId) {
          return { ...l, isLocked: !isLocked };
        }
        return l;
      });

      return {
        ...prev,
        lockedTeacherIds: nextLockedIds,
        lessons: nextLessons,
      };
    });
    const tch = storeState.teachers.find((t) => t.id === teacherId);
    addAuditLog("O'qituvchi qulflanishi o'zgardi", `${tch?.fullName || teacherId} darslari holati yangilandi`);
  }, []);

  const lockPrimaryClasses = useCallback((forceLock?: boolean) => {
    updateStore((prev) => {
      const primaryClassIds = prev.classes.filter((c) => c.grade <= 4).map((c) => c.id);
      const shouldLock = forceLock !== undefined
        ? forceLock
        : !primaryClassIds.every((id) => prev.lockedClassIds.includes(id));

      const nextLockedIds = shouldLock
        ? Array.from(new Set([...prev.lockedClassIds, ...primaryClassIds]))
        : prev.lockedClassIds.filter((id) => !primaryClassIds.includes(id));

      const primarySet = new Set(primaryClassIds);
      const nextLessons = prev.lessons.map((l) => {
        if (primarySet.has(l.classId)) {
          return { ...l, isLocked: shouldLock };
        }
        return l;
      });

      return {
        ...prev,
        lockedClassIds: nextLockedIds,
        lessons: nextLessons,
      };
    });
    addAuditLog("Boshlang'ich sinflar qulfi", "1-4 boshlang'ich sinflar jadvali qulflanishi yangilandi");
  }, []);

  const lockAllClasses = useCallback((forceLock?: boolean) => {
    updateStore((prev) => {
      const allClassIds = prev.classes.map((c) => c.id);
      const shouldLock = forceLock !== undefined
        ? forceLock
        : prev.lockedClassIds.length !== allClassIds.length;

      const nextLockedIds = shouldLock ? allClassIds : [];
      const nextLessons = prev.lessons.map((l) => ({ ...l, isLocked: shouldLock }));

      return {
        ...prev,
        lockedClassIds: nextLockedIds,
        lessons: nextLessons,
      };
    });
    addAuditLog("Barcha sinflar qulfi", "Barcha sinflar dars jadvali qulflanishi yangilandi");
  }, []);

  const undo = useCallback(() => {
    if (storeState.history.length === 0) return;
    updateStore((prev) => {
      const previousLessons = prev.history[prev.history.length - 1];
      return {
        ...prev,
        history: prev.history.slice(0, -1),
        lessons: [
          ...prev.lessons.filter((l) => l.schoolId !== prev.currentSchoolId),
          ...previousLessons,
        ],
      };
    });
    addAuditLog("Amal bekor qilindi", "Oxirgi jadval o'zgarishi qaytarildi (Undo)");
  }, []);

  return {
    setLessons,
    moveLesson,
    swapLessons,
    toggleLessonLock,
    toggleLockClass,
    toggleLockTeacher,
    lockPrimaryClasses,
    lockAllClasses,
    undo,
  };
}
