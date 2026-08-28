export type Role = "SUPER_ADMIN" | "SCHOOL_ADMIN";

export type RoomType = "GENERAL" | "GYM" | "LAB" | "COMP_LAB" | "OUTDOOR_PITCH";

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
  allowDoubleLesson: boolean; // 2 soat ketma-ket darsga ruxsat
  requiresRoomType?: RoomType | null;
}

export interface TeacherAvailability {
  id?: string;
  teacherId: string;
  dayOfWeek: number; // 1-6 (Dushanba-Shanba)
  period: number; // 1-8
  isAvailable: boolean;
}

export interface Teacher {
  id: string;
  schoolId: string;
  fullName: string;
  phone?: string | null;
  weeklyHourCapacity: number;
  maxConsecutiveHours: number;
  homeroomClassId?: string | null;
  subjectIds: string[];
  branchIds: string[];
  availabilities?: TeacherAvailability[];
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
}

export interface SchoolClass {
  id: string;
  schoolId: string;
  branchId: string;
  shiftId: string;
  name: string;
  grade: number;
  isPrimary: boolean;
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
  dayOfWeek: number; // 1-6 (1: Du, 2: Se, 3: Ch, 4: Pa, 5: Ju, 6: Sh)
  periodNumber: number; // 1-8
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
  daysCount?: number; // default 6
  maxPeriodsPerDay?: number; // default 7
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
  };
  explanation?: string;
}
