import {
  SchoolClass,
  Subject,
  Teacher,
  Room,
  Lesson,
  Branch,
  Shift,
  SchoolInfo,
} from "@/types";

export type FilterScope =
  | "MAIN_HIGH"
  | "MAIN_PRIMARY"
  | "MAIN_ALL"
  | "BRANCH_HIGH"
  | "BRANCH_PRIMARY"
  | "BRANCH_ALL"
  | "ALL";

export interface Official39TableViewProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  branches?: Branch[];
  shifts?: Shift[];
  onLessonsChange?: (lessons: Lesson[]) => void;
  onExportExcel?: () => void;
  onOpenZamena?: (lesson: Lesson) => void;
  onUpdateSchoolInfo?: (updates: Partial<SchoolInfo>) => void;
  onSetHomeroomTeacher?: (classId: string, teacherId: string) => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  schoolName?: string;
  region?: string;
  directorName?: string;
  vicePrincipalName?: string;
  psychologistName?: string;
  academicYear?: string;
  approvalDate?: string;
}

export const DAYS = [
  { id: 1, name: "DUSHANBA" },
  { id: 2, name: "SESHANBA" },
  { id: 3, name: "CHORSHANBA" },
  { id: 4, name: "PAYSHANBA" },
  { id: 5, name: "JUMA" },
  { id: 6, name: "SHANBA" },
];

export type ShiftFilterType = "ALL" | "SHIFT_1" | "SHIFT_2";

export const PERIOD_TIMES = [
  { period: 1, time: "8.00-8.45" },
  { period: 2, time: "8.50-9.35" },
  { period: 3, time: "9.40-10.25" },
  { period: 4, time: "10.35-11.20" },
  { period: 5, time: "11.25-12.10" },
  { period: 6, time: "12.15-13.00" },
];

export const SHIFT_1_PERIOD_TIMES = [
  { period: 1, time: "8.00-8.45" },
  { period: 2, time: "8.50-9.35" },
  { period: 3, time: "9.40-10.25" },
  { period: 4, time: "10.35-11.20" },
  { period: 5, time: "11.25-12.10" },
  { period: 6, time: "12.15-13.00" },
];

export const SHIFT_2_PERIOD_TIMES = [
  { period: 1, time: "13.00-13.45" },
  { period: 2, time: "13.50-14.35" },
  { period: 3, time: "14.45-15.30" },
  { period: 4, time: "15.35-16.20" },
  { period: 5, time: "16.25-17.10" },
  { period: 6, time: "17.15-18.00" },
];
