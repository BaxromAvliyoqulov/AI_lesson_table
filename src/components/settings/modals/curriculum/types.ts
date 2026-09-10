import { SchoolClass, Subject, Teacher, ClassSubject } from "@/types";

export interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classId: string, subjects: ClassSubject[]) => void;
  targetClass: SchoolClass | null;
  allSubjects: Subject[];
  allTeachers: Teacher[];
  allClasses?: SchoolClass[];
}

export type SubjectCategory =
  | "ALL"
  | "RECOMMENDED"
  | "EXACT_SCIENCE"
  | "LANGUAGES"
  | "NATURAL"
  | "ARTS_SPORTS"
  | "SOCIAL";

export interface SanPiNMetrics {
  totalWeeklyHours: number;
  recommendedHours: number;
  maxSanPiNHours: number;
  isOverloaded: boolean;
  coveragePercent: number;
  deficitHours: number;
}
