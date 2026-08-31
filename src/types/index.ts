export type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN";
export type RoomType = "GENERAL" | "GYM" | "LAB" | "COMP_LAB" | "OUTDOOR_PITCH";

export interface SchoolInfo {
  id: string;
  name: string;
  slug: string;
  region?: string;
  directorName?: string;
  vicePrincipalName?: string;
  psychologistName?: string;
  academicYear?: string;
  approvalDate?: string;
  branchesCount?: number;
  classesCount?: number;
  teachersCount?: number;
}

export interface Branch {
  id: string;
  schoolId: string;
  name: string;
  address?: string | null;
  isMain: boolean;
}

export interface Shift {
  id: string;
  schoolId: string;
  name: string;
  startTime: string;
  endTime: string;
  periodsCount: number;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  shortName?: string | null;
  colorTag: string;
  difficultyScore: number; // 1-13 SanPiN
  allowDoubleLesson: boolean;
  requiresRoomType?: RoomType | null;
  methodDayOfWeek?: number | null; // Fan metod kuni (1=Dushanba, 2=Seshanba ... 6=Shanba)
}

export interface TeacherAvailability {
  id?: string;
  teacherId: string;
  dayOfWeek: number;
  period: number;
  isAvailable: boolean;
  isPreferred?: boolean;
}

export interface Teacher {
  id: string;
  schoolId: string;
  fullName: string;
  phone?: string | null;
  weeklyHourCapacity: number;
  maxConsecutiveHours: number;
  maxGapsPerDay?: number; // Maksimal darchalar (okno) soni
  methodDayOfWeek?: number | null; // Metod kuni (1=Dushanba ... 6=Shanba)
  homeroomClassId?: string | null;
  subjectIds: string[];
  branchIds: string[];
  availabilities?: TeacherAvailability[];
}

export interface BellPeriod {
  periodNumber: number;
  startTime: string; // "08:00"
  endTime: string;   // "08:45"
  breakDurationMinutes: number; // 5 or 10 min
}

export interface SubstitutionRecord {
  id: string;
  schoolId: string;
  scheduleId: string;
  date: string;
  dayOfWeek: number;
  periodNumber: number;
  classId: string;
  subjectId: string;
  originalTeacherId: string;
  substituteTeacherId: string;
  reason: string; // "Kasal", "Xizmat safari", "Malaka oshirish"
  isApproved: boolean;
  createdAt: string;
}

export interface Room {
  id: string;
  schoolId: string;
  branchId: string;
  name: string;
  roomType: RoomType;
  capacity: number;
}

export interface ClassSubject {
  id?: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  weeklyHours: number;
  groupType?: "WHOLE" | "GROUP_1" | "GROUP_2"; // Guruhlarga bo'lingan darslar (Ingliz, Rus, Informatika)
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  branchId: string;
  shiftId: string;
  name: string;
  grade: number;
  isPrimary: boolean;
  isClosed?: boolean;
  homeroomTeacherId?: string | null;
  subjects: ClassSubject[];
}

export interface Schedule {
  id: string;
  schoolId: string;
  name: string;
  academicYear: string;
  term: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  scheduleId: string;
  schoolId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  roomId?: string | null;
  branchId: string;
  dayOfWeek: number;
  periodNumber: number;
  groupType?: "WHOLE" | "GROUP_1" | "GROUP_2";
  isLocked?: boolean;
}

export interface DragValidationResult {
  status: "safe" | "warning" | "danger";
  message: string;
  conflicts: string[];
}

export interface SolverInput {
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  shifts: Shift[];
  branches: Branch[];
  daysCount?: number;
  maxPeriodsPerDay?: number;
}

export interface SolverResult {
  success: boolean;
  lessons: Lesson[];
  unassignedLessons: {
    classId: string;
    subjectId: string;
    teacherId: string;
    remainingHours: number;
    reason?: string;
  }[];
  stats: {
    totalRequiredHours: number;
    placedHours: number;
    score: number;
    conflictsCount: number;
    gapsCount?: number;
  };
  explanation?: string;
}
