export interface Slot {
  classId: string;
  branchId: string;
  day: number;
  period: number;
  teacherId: string | null;
  subjectId: string | null;
  groupType?: "WHOLE" | "GROUP_1" | "GROUP_2";
  roomId: string | null;
  isLocked: boolean;
}

export interface ReqLesson {
  id?: string;
  classId: string;
  branchId: string;
  subjectId: string;
  teacherId: string;
  coTeacherId?: string;
  groupType: "WHOLE" | "GROUP_1" | "GROUP_2" | "SPLIT";
  difficulty: number;
  weeklyHours: number;
  grade: number;
}

export interface ClassDaySubInfo {
  classId: string;
  subjectId: string;
  dayOfWeek: number;
  periods: number[];
}
