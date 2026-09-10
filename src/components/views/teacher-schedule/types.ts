import { SchoolClass, Subject, Teacher, Room, Lesson, Shift, Branch } from "@/types";

export interface TeacherScheduleViewProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  shifts?: Shift[];
  branches?: Branch[];
  onOpenZamena?: (lesson: Lesson) => void;
  onSelectClass?: (classId: string) => void;
}

export const DAYS = [
  { id: 1, name: "Dushanba", shortName: "Dush" },
  { id: 2, name: "Seshanba", shortName: "Sesh" },
  { id: 3, name: "Chorshanba", shortName: "Chor" },
  { id: 4, name: "Payshanba", shortName: "Pay" },
  { id: 5, name: "Juma", shortName: "Jum" },
  { id: 6, name: "Shanba", shortName: "Shan" },
];

export const DEFAULT_SHIFT_1_PERIODS = [
  { period: 1, time: "08:00 - 08:45", start: "08:00", end: "08:45" },
  { period: 2, time: "08:50 - 09:35", start: "08:50", end: "09:35" },
  { period: 3, time: "09:40 - 10:25", start: "09:40", end: "10:25" },
  { period: 4, time: "10:35 - 11:20", start: "10:35", end: "11:20" },
  { period: 5, time: "11:25 - 12:10", start: "11:25", end: "12:10" },
  { period: 6, time: "12:15 - 13:00", start: "12:15", end: "13:00" },
];

export const DEFAULT_SHIFT_2_PERIODS = [
  { period: 1, time: "13:00 - 13:45", start: "13:00", end: "13:45" },
  { period: 2, time: "13:50 - 14:35", start: "13:50", end: "14:35" },
  { period: 3, time: "14:40 - 15:25", start: "14:40", end: "15:25" },
  { period: 4, time: "15:35 - 16:20", start: "15:35", end: "16:20" },
  { period: 5, time: "16:25 - 17:10", start: "16:25", end: "17:10" },
  { period: 6, time: "17:15 - 18:00", start: "17:15", end: "18:00" },
];
