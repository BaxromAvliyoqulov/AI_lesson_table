import { BellPeriod, SchoolClass, Teacher, Subject, Room, Lesson } from "@/types";
import { SchoolStoreState } from "./types";

export const STORAGE_KEY = "dars_jadval_ai_store_clean_v1";

// Standart toza boshlang'ich holat (Hech qanday Mock / Soxta ma'lumotlarsiz)
export function createInitialState(): SchoolStoreState {
  const defaultSchoolId = "cmthn422g0001uff8vhccbxmz";

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
    schools: [
      {
        id: defaultSchoolId,
        slug: "maktab-39",
        name: "39-umumiy o'rta ta'lim maktabi",
        region: "Muzrabot tumani",
        academicYear: "2025 - 2026",
        approvalDate: "",
        directorName: "M. Ramazonov",
        vicePrincipalName: "N. Narziqulov",
        psychologistName: "",
      },
    ],
    branches: [
      {
        id: "branch_main",
        schoolId: defaultSchoolId,
        name: "Asosiy bino",
        isMain: true,
      },
    ],
    shifts: [
      {
        id: "shift_1",
        schoolId: defaultSchoolId,
        name: "1-smena",
        startTime: "08:00",
        endTime: "13:10",
        periodsCount: 6,
      },
    ],
    subjects: [],
    teachers: [],
    rooms: [],
    classes: [],
    lessons: [],
    bellPeriods: defaultBells,
    substitutions: [],
    auditLogs: [],
    history: [],
    zoomLevel: 100,
    selectedBranch: "ALL",
    viewMode: "OFFICIAL_39",
    selectedClassId: "",
    isGenerating: false,
    syncStatus: "synced",
    lockedClassIds: [],
    lockedTeacherIds: [],
  };
}

export const serverInitialState: SchoolStoreState = createInitialState();
export let storeState: SchoolStoreState = { ...serverInitialState };
export const listeners = new Set<() => void>();
export let hasHydrated = false;

export function setHasHydrated(val: boolean) {
  hasHydrated = val;
}

export function getLocalStorageState(): SchoolStoreState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: SchoolStoreState = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

export function saveLocalStorageState(state: SchoolStoreState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage quota fallback
  }
}

// Multi-tab BroadcastChannel
export const syncChannel =
  typeof window !== "undefined" && "BroadcastChannel" in window
    ? new BroadcastChannel("dars_jadval_live_cloud_sync")
    : null;

export function notifyLiveSync() {
  try {
    syncChannel?.postMessage({ type: "LIVE_STORE_MUTATION", timestamp: Date.now() });
  } catch {
    // Ignore channel post errors
  }
}

export function updateStore(updater: (prev: SchoolStoreState) => SchoolStoreState, broadcast = true) {
  storeState = updater(storeState);
  saveLocalStorageState(storeState);
  listeners.forEach((listener) => listener());
  if (broadcast) {
    notifyLiveSync();
  }
}

export function addAuditLog(action: string, details: string) {
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
}
