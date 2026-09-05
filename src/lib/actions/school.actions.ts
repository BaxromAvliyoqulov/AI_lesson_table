"use server";

/**
 * Maktab Server Actionlari — Markaziy Gateway (Clean Forwarding Actions)
 * 
 * Barcha server actionlar alohida modullarda saqlanadi:
 * - school-core.actions.ts
 * - schedule.actions.ts
 * - teacher.actions.ts
 * - class.actions.ts
 * - subject.actions.ts
 */

import * as core from "./school-core.actions";
import * as schedule from "./schedule.actions";
import * as teacher from "./teacher.actions";
import * as classMod from "./class.actions";
import * as subject from "./subject.actions";
import { SchoolInfo, Teacher, SchoolClass, Subject, Lesson } from "@/types";

// ── 1. Core School & Full Sync Actions ─────────────────────────────────────────
export async function resolveSchool(schoolIdOrSlug?: string) {
  return core.resolveSchool(schoolIdOrSlug);
}

export async function getSchoolFullData(schoolId?: string) {
  return core.getSchoolFullData(schoolId);
}

export async function seedSchoolInitialData(schoolId: string) {
  return core.seedSchoolInitialData(schoolId);
}

export async function updateSchoolDetailsAction(
  schoolId: string,
  data: Partial<SchoolInfo>
) {
  return core.updateSchoolDetailsAction(schoolId, data);
}

export async function syncFullSchoolDataAction(
  schoolId: string,
  fullData: Parameters<typeof core.syncFullSchoolDataAction>[1]
) {
  return core.syncFullSchoolDataAction(schoolId, fullData);
}

// ── 2. Schedule Actions ───────────────────────────────────────────────────────
export async function saveTimetableLessons(
  schoolId: string,
  scheduleId: string,
  lessons: Lesson[]
) {
  return schedule.saveTimetableLessons(schoolId, scheduleId, lessons);
}

export async function updateLessonPositionAction(
  schoolId: string,
  lessonId: string,
  dayOfWeek: number,
  periodNumber: number,
  teacherId?: string,
  roomId?: string
) {
  return schedule.updateLessonPositionAction(
    schoolId,
    lessonId,
    dayOfWeek,
    periodNumber,
    teacherId,
    roomId
  );
}

export async function swapLessonsAction(
  schoolId: string,
  lessonA: { id: string; dayOfWeek: number; periodNumber: number },
  lessonB: { id: string; dayOfWeek: number; periodNumber: number }
) {
  return schedule.swapLessonsAction(schoolId, lessonA, lessonB);
}

// ── 3. Teacher Actions ────────────────────────────────────────────────────────
export async function upsertTeacherAction(schoolId: string, teacherData: Teacher) {
  return teacher.upsertTeacherAction(schoolId, teacherData);
}

export async function deleteTeacherAction(schoolId: string, teacherId: string) {
  return teacher.deleteTeacherAction(schoolId, teacherId);
}

export async function saveTeacherWorkloadAction(
  schoolId: string,
  teacherId: string,
  assignments: Array<{
    classId: string;
    subjectId: string;
    weeklyHours: number;
    isSplit?: boolean;
    groupType?: "WHOLE" | "GROUP_1" | "GROUP_2";
    secondTeacherId?: string;
  }>
) {
  return teacher.saveTeacherWorkloadAction(schoolId, teacherId, assignments);
}

export async function setHomeroomTeacherAction(
  schoolId: string,
  classId: string,
  teacherId?: string | null
) {
  return teacher.setHomeroomTeacherAction(schoolId, classId, teacherId);
}

// ── 4. Class Actions ──────────────────────────────────────────────────────────
export async function upsertClassAction(schoolId: string, cls: SchoolClass) {
  return classMod.upsertClassAction(schoolId, cls);
}

export async function deleteClassAction(schoolId: string, classId: string) {
  return classMod.deleteClassAction(schoolId, classId);
}

export async function saveClassTarifficationAction(
  schoolId: string,
  classId: string,
  subjects: Array<{ subjectId: string; teacherId: string; weeklyHours: number; groupType?: string }>
) {
  return classMod.saveClassTarifficationAction(schoolId, classId, subjects);
}

// ── 5. Subject Actions ────────────────────────────────────────────────────────
export async function upsertSubjectAction(schoolId: string, subjectData: Subject) {
  return subject.upsertSubjectAction(schoolId, subjectData);
}

export async function deleteSubjectAction(schoolId: string, subjectId: string) {
  return subject.deleteSubjectAction(schoolId, subjectId);
}
