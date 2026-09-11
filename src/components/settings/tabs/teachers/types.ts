import { Teacher, Subject, SchoolClass } from "@/types";

export interface TeachersTabProps {
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  schoolName?: string;
  onAddTeacher: () => void;
  onEditTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onSetTeacherHomeroomClass?: (teacherId: string, classId: string | null) => void;
  onOpenTeacherWorkload?: (teacher: Teacher) => void;
  onOpenEMaktabImport?: () => void;
}

export type HomeroomFilterType = "ALL" | "HOMEROOM_ONLY" | "NON_HOMEROOM";
export type HomeroomStageFilterType = "ALL_STAGES" | "PRIMARY" | "MIDDLE" | "HIGH";
export type WorkloadFilterType = "ALL" | "OPTIMAL" | "UNDERLOADED" | "OVERLOADED";

export interface TeacherWorkloadInfo {
  assignedHours: number;
  teachingHours: number;
  homeroomHours: number;
  classCount: number;
  isOverloaded: boolean;
  isOptimal: boolean;
  isUnderloaded: boolean;
  workloadPct: number;
}
