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
        timestamp: new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" }),
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
  };
}

let storeState: SchoolStoreState = createInitialState();
const listeners = new Set<() => void>();

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

// Client-side initialization from localStorage
if (typeof window !== "undefined") {
  const saved = getLocalStorageState();
  if (saved) {
    storeState = { ...storeState, ...saved, isGenerating: false };
  }
}

function updateStore(updater: (prev: SchoolStoreState) => SchoolStoreState) {
  storeState = updater(storeState);
  saveLocalStorageState(storeState);
  listeners.forEach((listener) => listener());
}

export function useSchoolStore() {
  const state = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => storeState,
    () => storeState
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
  }, []);

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
    }));
    addAudit("Maktab rekvizitlari yangilandi", `${updates.name || "Maktab"} ma'lumotlari yangilandi`);
  }, [addAudit]);

  // Class actions
  const addClass = useCallback((cls: SchoolClass) => {
    updateStore((prev) => ({
      ...prev,
      classes: [...prev.classes, cls],
    }));
    addAudit("Sinf qo'shildi", `${cls.name} sinfi yaratildi`);
  }, [addAudit]);

  const updateClass = useCallback((cls: SchoolClass) => {
    updateStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === cls.id ? cls : c)),
    }));
    addAudit("Sinf tahrirlandi", `${cls.name} ma'lumotlari yangilandi`);
  }, [addAudit]);

  const deleteClass = useCallback((classId: string) => {
    const target = storeState.classes.find((c) => c.id === classId);
    updateStore((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== classId),
      lessons: prev.lessons.filter((l) => l.classId !== classId),
    }));
    if (target) {
      addAudit("Sinf o'chirildi", `${target.name} sinfi o'chirildi`);
    }
  }, [addAudit]);

  const setHomeroomTeacher = useCallback((classId: string, teacherId: string) => {
    updateStore((prev) => {
      // 1. Update class homeroomTeacherId and subjects array
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

      // 2. Update teachers homeroomClassId
      const updatedTeachers = prev.teachers.map((t) => {
        if (t.id === teacherId) {
          return { ...t, homeroomClassId: classId };
        }
        if (t.homeroomClassId === classId) {
          return { ...t, homeroomClassId: undefined };
        }
        return t;
      });

      // 3. Update existing Friday 1st period lesson (sub_sinf_soati) if any
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
      };
    });

    addAudit(
      "Sinf rahbari o'zgartirildi",
      `Sinfga yangi rahbar tayinlandi va Juma kungi Sinf soati sinxronlashtirildi`
    );
  }, [addAudit]);

  const saveCurriculum = useCallback((classId: string, subjects: ClassSubject[]) => {
    updateStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === classId ? { ...c, subjects } : c)),
    }));
    addAudit("Fanlar taqsimoti saqlandi", `Sinf ID: ${classId} bo'yicha ${subjects.length} ta fan yuklamasi yangilandi`);
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
    }));
    addAudit("O'qituvchi qo'shildi", `${teacher.fullName} ro'yxatga kiritildi`);
  }, [addAudit]);

  const updateTeacher = useCallback((teacher: Teacher) => {
    updateStore((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === teacher.id ? teacher : t)),
    }));
    addAudit("O'qituvchi yangilandi", `${teacher.fullName} ma'lumotlari tahrirlandi`);
  }, [addAudit]);

  const deleteTeacher = useCallback((teacherId: string) => {
    const target = storeState.teachers.find((t) => t.id === teacherId);
    updateStore((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== teacherId),
      lessons: prev.lessons.filter((l) => l.teacherId !== teacherId),
    }));
    if (target) {
      addAudit("O'qituvchi o'chirildi", `${target.fullName} tizimdan o'chirildi`);
    }
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
    }));
    addAudit("Fan qo'shildi", `${subject.name} fani qo'shildi`);
  }, [addAudit]);

  const updateSubject = useCallback((subject: Subject) => {
    updateStore((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === subject.id ? subject : s)),
    }));
    addAudit("Fan tahrirlandi", `${subject.name} fani yangilandi`);
  }, [addAudit]);

  const deleteSubject = useCallback((subjectId: string) => {
    const target = storeState.subjects.find((s) => s.id === subjectId);
    updateStore((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== subjectId),
      lessons: prev.lessons.filter((l) => l.subjectId !== subjectId),
    }));
    if (target) {
      addAudit("Fan o'chirildi", `${target.name} fani o'chirildi`);
    }
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
      };
    });
  }, []);

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
