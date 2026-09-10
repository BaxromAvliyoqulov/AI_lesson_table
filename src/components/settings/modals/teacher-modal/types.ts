import { Teacher, Subject, Branch, Shift, SchoolClass } from "@/types";

export interface WeekdayItem {
  id: number;
  name: string;
}

export const WEEKDAYS: WeekdayItem[] = [
  { id: 1, name: "Dushanba" },
  { id: 2, name: "Seshanba" },
  { id: 3, name: "Chorshanba" },
  { id: 4, name: "Payshanba" },
  { id: 5, name: "Juma" },
  { id: 6, name: "Shanba" },
];

export interface AutoDetectedMethodDayInfo {
  day: number;
  dayName: string;
  subjectName: string;
}

export interface TeacherBasicFieldsProps {
  fullName: string;
  setFullName: (name: string) => void;
  phone: string;
  setPhone: (phone: string) => void;
  homeroomClassId: string;
  setHomeroomClassId: (classId: string) => void;
  classes: SchoolClass[];
  allTeachers: Teacher[];
  editingTeacher: Teacher | null;
  weeklyCapacity: number;
  setWeeklyCapacity: (capacity: number) => void;
  maxConsecutive: number;
  setMaxConsecutive: React.Dispatch<React.SetStateAction<number>>;
  methodDay: number | "";
  setMethodDay: (day: number | "") => void;
  isManualMethodDayOverride: boolean;
  setIsManualMethodDayOverride: (manual: boolean) => void;
  autoDetectedMethodDay: AutoDetectedMethodDayInfo | null;
  onBranchNeeded?: (branchId: string) => void;
}

export interface TeacherScheduleFieldsProps {
  branches: Branch[];
  selectedBranches: string[];
  toggleBranch: (branchId: string) => void;
  setSelectedBranches: React.Dispatch<React.SetStateAction<string[]>>;
  shifts: Shift[];
  selectedShifts: string[];
  setSelectedShifts: React.Dispatch<React.SetStateAction<string[]>>;
  teachingStages: "PRIMARY" | "HIGH" | "BOTH";
  setTeachingStages: (stages: "PRIMARY" | "HIGH" | "BOTH") => void;
  isManualTeachingStagesOverride: boolean;
  setIsManualTeachingStagesOverride: (val: boolean) => void;
  classes: SchoolClass[];
  homeroomClassId: string;
  editingTeacher: Teacher | null;
  onOpenWorkload?: (teacher: Teacher) => void;
  travelPolicy: "BY_SHIFT" | "BY_DAY" | "ALTERNATING_DAYS" | "FLEXIBLE_BUFFER";
  setTravelPolicy: (policy: "BY_SHIFT" | "BY_DAY" | "ALTERNATING_DAYS" | "FLEXIBLE_BUFFER") => void;
  hasMultipleBranches: boolean;
}

export interface TeacherSubjectSelectorProps {
  subjects: Subject[];
  selectedSubjects: string[];
  toggleSubject: (subId: string) => void;
  setSelectedSubjects: React.Dispatch<React.SetStateAction<string[]>>;
  teachingStages: "PRIMARY" | "HIGH" | "BOTH";
}
