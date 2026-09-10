import { SchoolClass, Branch, Shift, Teacher, Subject } from "@/types";

export interface ClassesTabProps {
  classes: SchoolClass[];
  branches: Branch[];
  shifts: Shift[];
  teachers: Teacher[];
  subjects: Subject[];
  onAddClass: () => void;
  onEditClass: (cls: SchoolClass) => void;
  onDeleteClass: (classId: string) => void;
  onOpenCurriculum: (cls: SchoolClass) => void;
  onSetHomeroomTeacher?: (classId: string, teacherId: string | null) => void;
  onOpenEMaktabImport?: () => void;
  onBulkAddClasses?: (newClasses: SchoolClass[]) => void;
}

export type ClassFilterType =
  | "ALL"
  | "PRIMARY"
  | "MIDDLE"
  | "HIGH"
  | "NO_HOMEROOM"
  | "LOCKED"
  | "INCOMPLETE_CURRICULUM";

export const AVAILABLE_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
export const AVAILABLE_LETTERS = ["A", "B", "D", "E", "F", "G", "H", "I", "J", "K"];
