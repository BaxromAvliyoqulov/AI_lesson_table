"use client";

import React from "react";
import { useSchoolStore } from "@/lib/store/useSchoolStore";
import { TarifficationWorkspace } from "@/components/tariffication/TarifficationWorkspace";
import { CSPSolver } from "@/lib/solver/csp-solver";

import { saveAllClassesTarifficationAction } from "@/lib/actions/class.actions";

export const dynamic = "force-dynamic";

export default function TarifficationPage() {
  const store = useSchoolStore();

  const currentSchool =
    store.schools.find((s) => s.id === store.currentSchoolId) || store.schools[0];
  const schoolClasses = store.classes.filter((c) => c.schoolId === store.currentSchoolId).length > 0
    ? store.classes.filter((c) => c.schoolId === store.currentSchoolId)
    : store.classes;
  const schoolTeachers = store.teachers.filter((t) => t.schoolId === store.currentSchoolId).length > 0
    ? store.teachers.filter((t) => t.schoolId === store.currentSchoolId)
    : store.teachers;
  const schoolSubjects = store.subjects.filter((s) => s.schoolId === store.currentSchoolId).length > 0
    ? store.subjects.filter((s) => s.schoolId === store.currentSchoolId)
    : store.subjects;
  const schoolBranches = store.branches.filter((b) => b.schoolId === store.currentSchoolId).length > 0
    ? store.branches.filter((b) => b.schoolId === store.currentSchoolId)
    : store.branches;
  const schoolRooms = store.rooms.filter((r) => r.schoolId === store.currentSchoolId).length > 0
    ? store.rooms.filter((r) => r.schoolId === store.currentSchoolId)
    : store.rooms;
  const schoolShifts = store.shifts.filter((s) => s.schoolId === store.currentSchoolId).length > 0
    ? store.shifts.filter((s) => s.schoolId === store.currentSchoolId)
    : store.shifts;

  const handleSaveClassSubjects = async (updatedClasses: typeof schoolClasses) => {
    store.updateClasses(updatedClasses);
    try {
      await saveAllClassesTarifficationAction(
        store.currentSchoolId || currentSchool?.id || "",
        updatedClasses as any
      );
    } catch (err) {
      console.error("Tarifikatsiyani bazaga saqlashda xatolik:", err);
    }
  };

  const handleGenerateAI = () => {
    if (schoolClasses.length === 0 || schoolTeachers.length === 0) return;

    store.setIsGenerating(true);
    try {
      const schoolLessons = store.lessons.filter((l) => l.schoolId === store.currentSchoolId).length > 0
        ? store.lessons.filter((l) => l.schoolId === store.currentSchoolId)
        : store.lessons;

      const solver = new CSPSolver({
        classes: schoolClasses,
        teachers: schoolTeachers,
        subjects: schoolSubjects,
        rooms: schoolRooms,
        branches: schoolBranches,
        shifts: schoolShifts,
        existingLessons: schoolLessons,
        lockedClassIds: store.lockedClassIds,
        lockedTeacherIds: store.lockedTeacherIds,
      });
      const result = solver.solve();
      store.setLessons(result.lessons);
    } catch (err) {
      console.error("Generatsiya xatosi:", err);
    } finally {
      store.setIsGenerating(false);
    }
  };

  return (
    <TarifficationWorkspace
      initialClasses={schoolClasses}
      subjects={schoolSubjects}
      teachers={schoolTeachers}
      branches={schoolBranches}
      schoolName={currentSchool?.name || "39-Umumiy o'rta ta'lim maktabi"}
      onSaveClassSubjects={handleSaveClassSubjects}
      onGenerateAI={handleGenerateAI}
      isGenerating={store.isGenerating}
    />
  );
}
