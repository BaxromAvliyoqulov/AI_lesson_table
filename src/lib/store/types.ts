import {
  SchoolInfo,
  Branch,
  Shift,
  Subject,
  Teacher,
  Room,
  SchoolClass,
  Lesson,
  BellPeriod,
  SubstitutionRecord,
} from "@/types";

export type SyncStatus = "synced" | "syncing" | "error" | "offline";

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface SchoolStoreState {
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
