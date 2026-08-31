"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import {
  SchoolInfo,
  Branch,
  Shift,
  Subject,
  Teacher,
  Room,
  SchoolClass,
  ClassSubject,
  Lesson,
  BellPeriod,
  SubstitutionRecord,
  TeacherAvailability,
} from "@/types";
import {
  initialSchools,
  initialBranches,
  initialShifts,
  initialSubjects,
  initialTeachers,
  initialRooms,
  initialClasses,
} from "@/lib/mock-data";
import { CSPSolver } from "@/lib/solver/csp-solver";
import {
  getSchoolFullData,
  saveTimetableLessons,
  updateLessonPositionAction,
  swapLessonsAction,
  upsertTeacherAction,
  deleteTeacherAction,
  upsertClassAction,
  deleteClassAction,
  upsertSubjectAction,
  deleteSubjectAction,
  saveClassTarifficationAction,
  setHomeroomTeacherAction,
  updateSchoolDetailsAction,
} from "@/lib/actions/school.actions";

export type SyncStatus = "synced" | "syncing" | "error" | "offline";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

interface SchoolStoreState {
  currentSchoolId: string;
  schools: SchoolInfo[];
  branches: Branch[];
  shifts: Shift[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  classes: SchoolClass[];
  lessons: Lesson[];
  bellPeriods: BellPeriod[];
  substitutions: SubstitutionRecord[];
  auditLogs: AuditEntry[];
  history: Lesson[][];
  zoomLevel: number;
  selectedBranch: string;
  viewMode: "OFFICIAL_39" | "MASTER" | "CLASS" | "TEACHER";
  selectedClassId: string;
  isGenerating: boolean;
  syncStatus: SyncStatus;
}

const STORAGE_KEY = "dars_jadval_ai_store_v8";

// Initial state generator
function createInitialState(): SchoolStoreState {
  const defaultSchoolId = "school_39";
  const defaultClasses = initialClasses.filter((c) => c.schoolId === defaultSchoolId);
  const defaultTeachers = initialTeachers.filter((t) => t.schoolId === defaultSchoolId);
  const defaultSubjects = initialSubjects.filter((s) => s.schoolId === defaultSchoolId);
  const defaultRooms = initialRooms.filter((r) => r.schoolId === defaultSchoolId);
  const defaultShifts = initialShifts.filter((s) => s.schoolId === defaultSchoolId);
  const defaultBranches = initialBranches.filter((b) => b.schoolId === defaultSchoolId);

  // Generate initial timetable
  const solver = new CSPSolver({
    classes: defaultClasses,
    teachers: defaultTeachers,
    subjects: defaultSubjects,
    rooms: defaultRooms,
    shifts: defaultShifts,
    branches: defaultBranches,
  });
  const generatedLessons = solver.solve().lessons;

  const defaultBells: BellPeriod[] = [
    { periodNumber: 1, startTime: "08:00", endTime: "08:45", breakDurationMinutes: 5 },
    { periodNumber: 2, startTime: "08:50", endTime: "09:35", breakDurationMinutes: 10 },
    { periodNumber: 3, startTime: "09:45", endTime: "10:30", breakDurationMinutes: 15 },
    { periodNumber: 4, startTime: "10:45", endTime: "11:30", breakDurationMinutes: 5 },
    { periodNumber: 5, startTime: "11:35", endTime: "12:20", breakDurationMinutes: 5 },
    { periodNumber: 6, startTime: "12:25", endTime: "13:10", breakDurationMinutes: 5 },
    { periodNumber: 7, startTime: "13:15", endTime: "14:00", breakDurationMinutes: 5 },
  ];

  return {
    currentSchoolId: defaultSchoolId,
    schools: initialSchools,
    branches: initialBranches,
    shifts: initialShifts,
    subjects: initialSubjects,
    teachers: initialTeachers,
    rooms: initialRooms,
    classes: initialClasses,
    lessons: generatedLessons,
    bellPeriods: defaultBells,
    substitutions: [],
    auditLogs: [
      {
        id: "log_1",
        timestamp: "08:00",
        action: "Tizim ishga tushirildi",
        details: "Boshlang'ich dars jadvali va maktab konfiguratsiyasi yuklandi",
      },
    ],
    history: [],
    zoomLevel: 100,
    selectedBranch: "ALL",
    viewMode: "OFFICIAL_39",
    selectedClassId: "c_school_39_1a",
    isGenerating: false,
    syncStatus: "synced",
  };
}

const serverInitialState: SchoolStoreState = createInitialState();
let storeState: SchoolStoreState = { ...serverInitialState };
const listeners = new Set<() => void>();
let hasHydrated = false;

function getLocalStorageState(): SchoolStoreState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveLocalStorageState(state: SchoolStoreState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota or private mode fallback
  }
}

function updateStore(updater: (prev: SchoolStoreState) => SchoolStoreState) {
  storeState = updater(storeState);
  saveLocalStorageState(storeState);
  listeners.forEach((listener) => listener());
}

export function useSchoolStore() {
  const fetchServerData = useCallback(async (schoolIdToFetch?: string) => {
    const targetId = schoolIdToFetch || storeState.currentSchoolId;
    updateStore((prev) => ({ ...prev, syncStatus: "syncing" }));
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
        updateStore((prev) => ({
          ...prev,
          schools: prev.schools.some((s) => s.id === schoolInfo.id)
            ? prev.schools.map((s) => (s.id === schoolInfo.id ? schoolInfo : s))
            : [schoolInfo, ...prev.schools],
          branches: branches.length > 0 ? branches : prev.branches,
          shifts: shifts.length > 0 ? shifts : prev.shifts,
          subjects: subjects.length > 0 ? subjects : prev.subjects,
          rooms: rooms.length > 0 ? rooms : prev.rooms,
          teachers: teachers.length > 0 ? teachers : prev.teachers,
          classes: classes.length > 0 ? classes : prev.classes,
          lessons: lessons.length > 0 ? lessons : prev.lessons,
          bellPeriods: bellPeriods.length > 0 ? bellPeriods : prev.bellPeriods,
          syncStatus: "synced",
        }));
      } else {
        updateStore((prev) => ({ ...prev, syncStatus: "synced" }));
      }
    } catch (err) {
      console.error("fetchServerData xatosi:", err);
      updateStore((prev) => ({ ...prev, syncStatus: "offline" }));
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      hasHydrated = true;
      const saved = getLocalStorageState();
      if (saved) {
        updateStore((prev) => ({ ...prev, ...saved, isGenerating: false }));
      }
      fetchServerData();
    }
  }, [fetchServerData]);

  const state = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => storeState,
    () => serverInitialState
  );

  const addAudit = useCallback((action: string, details: string) => {
    updateStore((prev) => ({
      ...prev,
      auditLogs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
          action,
          details,
        },
        ...prev.auditLogs.slice(0, 49),
      ],
    }));
  }, []);

  // School actions
  const setCurrentSchoolId = useCallback((id: string) => {
    updateStore((prev) => ({ ...prev, currentSchoolId: id }));
    fetchServerData(id);
  }, [fetchServerData]);

  const addSchool = useCallback((name: string) => {
    const newId = `school_${Date.now()}`;
    const newSchool: SchoolInfo = {
      id: newId,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      branchesCount: 1,
      classesCount: 0,
      teachersCount: 0,
    };
    updateStore((prev) => ({
      ...prev,
      schools: [...prev.schools, newSchool],
      currentSchoolId: newId,
      branches: [
        ...prev.branches,
        { id: `branch_${Date.now()}`, schoolId: newId, name: "Asosiy bino", isMain: true },
      ],
      shifts: [
        ...prev.shifts,
        { id: `shift_${Date.now()}`, schoolId: newId, name: "1-smena", startTime: "08:00", endTime: "13:10", periodsCount: 6 },
      ],
    }));
  }, []);

  const updateSchoolInfo = useCallback((schoolId: string, updates: Partial<SchoolInfo>) => {
    updateStore((prev) => ({
      ...prev,
      schools: prev.schools.map((s) => (s.id === schoolId ? { ...s, ...updates } : s)),
      syncStatus: "syncing",
    }));
    addAudit("Maktab rekvizitlari yangilandi", `${updates.name || "Maktab"} ma'lumotlari yangilandi`);

    updateSchoolDetailsAction(schoolId, updates).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  // Class actions
  const addClass = useCallback((cls: SchoolClass) => {
    updateStore((prev) => ({
      ...prev,
      classes: [...prev.classes, cls],
      syncStatus: "syncing",
    }));
    addAudit("Sinf qo'shildi", `${cls.name} sinfi yaratildi`);

    upsertClassAction(cls.schoolId || storeState.currentSchoolId, cls).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  const updateClass = useCallback((cls: SchoolClass) => {
    updateStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === cls.id ? cls : c)),
      syncStatus: "syncing",
    }));
    addAudit("Sinf tahrirlandi", `${cls.name} ma'lumotlari yangilandi`);

    upsertClassAction(cls.schoolId || storeState.currentSchoolId, cls).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  const deleteClass = useCallback((classId: string) => {
    const target = storeState.classes.find((c) => c.id === classId);
    updateStore((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== classId),
      lessons: prev.lessons.filter((l) => l.classId !== classId),
      syncStatus: "syncing",
    }));
    if (target) {
      addAudit("Sinf o'chirildi", `${target.name} sinfi o'chirildi`);
    }

    deleteClassAction(storeState.currentSchoolId, classId).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  const setHomeroomTeacher = useCallback((classId: string, teacherId: string) => {
    updateStore((prev) => {
      const updatedClasses = prev.classes.map((c) => {
        if (c.id === classId) {
          const updatedSubjects = c.subjects.map((s) => {
            if (s.subjectId === "sub_sinf_soati") {
              return { ...s, teacherId };
            }
            return s;
          });
          return { ...c, homeroomTeacherId: teacherId, subjects: updatedSubjects };
        }
        return c;
      });

      const updatedTeachers = prev.teachers.map((t) => {
        if (t.id === teacherId) {
          return { ...t, homeroomClassId: classId };
        }
        if (t.homeroomClassId === classId) {
          return { ...t, homeroomClassId: undefined };
        }
        return t;
      });

      const updatedLessons = prev.lessons.map((l) => {
        if (l.classId === classId && (l.subjectId === "sub_sinf_soati" || (l.dayOfWeek === 5 && l.periodNumber === 1))) {
          return { ...l, teacherId };
        }
        return l;
      });

      return {
        ...prev,
        classes: updatedClasses,
        teachers: updatedTeachers,
        lessons: updatedLessons,
        syncStatus: "syncing",
      };
    });

    addAudit(
      "Sinf rahbari o'zgartirildi",
      `Sinfga yangi rahbar tayinlandi va Juma kungi Sinf soati sinxronlashtirildi`
    );

    setHomeroomTeacherAction(storeState.currentSchoolId, classId, teacherId).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  const saveCurriculum = useCallback((classId: string, subjects: ClassSubject[]) => {
    updateStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === classId ? { ...c, subjects } : c)),
      syncStatus: "syncing",
    }));
    addAudit("Fanlar taqsimoti saqlandi", `Sinf ID: ${classId} bo'yicha ${subjects.length} ta fan yuklamasi yangilandi`);

    saveClassTarifficationAction(
      storeState.currentSchoolId,
      classId,
      subjects.map((s) => ({ subjectId: s.subjectId, teacherId: s.teacherId, weeklyHours: s.weeklyHours }))
    ).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  const updateClasses = useCallback((updatedClasses: SchoolClass[]) => {
    updateStore((prev) => ({
      ...prev,
      classes: updatedClasses,
    }));
    addAudit("Tarifikatsiya yangilandi", "Barcha sinflar bo'yicha o'quv yuklamasi va o'qituvchilar taqsimoti saqlandi");
  }, [addAudit]);

  // Teacher actions
  const addTeacher = useCallback((teacher: Teacher) => {
    updateStore((prev) => ({
      ...prev,
      teachers: [...prev.teachers, teacher],
      syncStatus: "syncing",
    }));
    addAudit("O'qituvchi qo'shildi", `${teacher.fullName} ro'yxatga kiritildi`);

    upsertTeacherAction(teacher.schoolId || storeState.currentSchoolId, teacher).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  const updateTeacher = useCallback((teacher: Teacher) => {
    updateStore((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === teacher.id ? teacher : t)),
      syncStatus: "syncing",
    }));
    addAudit("O'qituvchi yangilandi", `${teacher.fullName} ma'lumotlari tahrirlandi`);

    upsertTeacherAction(teacher.schoolId || storeState.currentSchoolId, teacher).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  const deleteTeacher = useCallback((teacherId: string) => {
    const target = storeState.teachers.find((t) => t.id === teacherId);
    updateStore((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== teacherId),
      lessons: prev.lessons.filter((l) => l.teacherId !== teacherId),
      syncStatus: "syncing",
    }));
    if (target) {
      addAudit("O'qituvchi o'chirildi", `${target.fullName} tizimdan o'chirildi`);
    }

    deleteTeacherAction(storeState.currentSchoolId, teacherId).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  const updateTeacherAvailability = useCallback((teacherId: string, availabilities: TeacherAvailability[]) => {
    updateStore((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === teacherId ? { ...t, availabilities } : t)),
    }));
    addAudit("O'qituvchi bo'sh vaqti yangilandi", `O'qituvchi ID: ${teacherId} matrisasi saqlandi`);
  }, [addAudit]);

  // Subject actions
  const addSubject = useCallback((subject: Subject) => {
    updateStore((prev) => ({
      ...prev,
      subjects: [...prev.subjects, subject],
      syncStatus: "syncing",
    }));
    addAudit("Fan qo'shildi", `${subject.name} fani qo'shildi`);

    upsertSubjectAction(subject.schoolId || storeState.currentSchoolId, subject).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  const updateSubject = useCallback((subject: Subject) => {
    updateStore((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === subject.id ? subject : s)),
      syncStatus: "syncing",
    }));
    addAudit("Fan tahrirlandi", `${subject.name} fani yangilandi`);

    upsertSubjectAction(subject.schoolId || storeState.currentSchoolId, subject).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  const deleteSubject = useCallback((subjectId: string) => {
    const target = storeState.subjects.find((s) => s.id === subjectId);
    updateStore((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== subjectId),
      lessons: prev.lessons.filter((l) => l.subjectId !== subjectId),
      syncStatus: "syncing",
    }));
    if (target) {
      addAudit("Fan o'chirildi", `${target.name} fani o'chirildi`);
    }

    deleteSubjectAction(storeState.currentSchoolId, subjectId).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, [addAudit]);

  // Room actions
  const addRoom = useCallback((room: Room) => {
    updateStore((prev) => ({
      ...prev,
      rooms: [...prev.rooms, room],
    }));
    addAudit("Xona qo'shildi", `${room.name} xonasi qo'shildi`);
  }, [addAudit]);

  const updateRoom = useCallback((room: Room) => {
    updateStore((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === room.id ? room : r)),
    }));
    addAudit("Xona yangilandi", `${room.name} xonasi tahrirlandi`);
  }, [addAudit]);

  const deleteRoom = useCallback((roomId: string) => {
    const target = storeState.rooms.find((r) => r.id === roomId);
    updateStore((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== roomId),
    }));
    if (target) {
      addAudit("Xona o'chirildi", `${target.name} xonasi o'chirildi`);
    }
  }, [addAudit]);

  // Bell actions
  const updateBellPeriods = useCallback((bellPeriods: BellPeriod[]) => {
    updateStore((prev) => ({ ...prev, bellPeriods }));
    addAudit("Qo'ng'iroqlar yangilandi", "Dars va tanaffus vaqtlari o'zgartirildi");
  }, [addAudit]);

  // Lesson & Grid actions
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
    addAudit("Amal bekor qilindi", "Oxirgi jadval o'zgarishi qaytarildi (Undo)");
  }, [addAudit]);

  // UI state actions
  const setZoomLevel = useCallback((zoomLevel: number) => {
    updateStore((prev) => ({ ...prev, zoomLevel }));
  }, []);

  const setSelectedBranch = useCallback((selectedBranch: string) => {
    updateStore((prev) => ({ ...prev, selectedBranch }));
  }, []);

  const setViewMode = useCallback((viewMode: "OFFICIAL_39" | "MASTER" | "CLASS" | "TEACHER") => {
    updateStore((prev) => ({ ...prev, viewMode }));
  }, []);

  const setSelectedClassId = useCallback((selectedClassId: string) => {
    updateStore((prev) => ({ ...prev, selectedClassId }));
  }, []);

  const setIsGenerating = useCallback((isGenerating: boolean) => {
    updateStore((prev) => ({ ...prev, isGenerating }));
  }, []);

  const addSubstitution = useCallback((sub: SubstitutionRecord) => {
    updateStore((prev) => ({
      ...prev,
      substitutions: [sub, ...prev.substitutions],
    }));
    addAudit("O'rinbosar tayinlandi", `Zamena: ${sub.reason} sababli biriktirildi`);
  }, [addAudit]);

  return {
    ...state,
    fetchServerData,
    setCurrentSchoolId,
    addSchool,
    updateSchoolInfo,
    addClass,
    updateClass,
    updateClasses,
    deleteClass,
    setHomeroomTeacher,
    saveCurriculum,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    updateTeacherAvailability,
    addSubject,
    updateSubject,
    deleteSubject,
    addRoom,
    updateRoom,
    deleteRoom,
    updateBellPeriods,
    setLessons,
    moveLesson,
    swapLessons,
    toggleLessonLock,
    undo,
    setZoomLevel,
    setSelectedBranch,
    setViewMode,
    setSelectedClassId,
    setIsGenerating,
    addSubstitution,
    addAudit,
  };
}
