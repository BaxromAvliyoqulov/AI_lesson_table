import { Teacher, Subject, SchoolClass } from "@/types";

export interface TeacherClassAssignment {
  classId: string;
  subjectId: string;
  weeklyHours: number;
  isSplit?: boolean;
  groupType?: "WHOLE" | "GROUP_1" | "GROUP_2";
  secondTeacherId?: string;
}

export interface TeacherWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers?: Teacher[];
  onSave: (teacherId: string, assignments: TeacherClassAssignment[]) => void;
}
