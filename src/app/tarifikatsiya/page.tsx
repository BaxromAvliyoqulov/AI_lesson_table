"use client";

import React from "react";
import { useSchoolStore } from "@/lib/store/useSchoolStore";
import { TarifficationWorkspace } from "@/components/tariffication/TarifficationWorkspace";
import { CSPSolver } from "@/lib/solver/csp-solver";

export default function TarifficationPage() {
  const store = useSchoolStore();

  const currentSchool =
    store.schools.find((s) => s.id === store.currentSchoolId) || store.schools[0];
  const schoolClasses = store.classes.filter((c) => c.schoolId === store.currentSchoolId);
  const schoolTeachers = store.teachers.filter((t) => t.schoolId === store.currentSchoolId);
  const schoolSubjects = store.subjects.filter((s) => s.schoolId === store.currentSchoolId);
  const schoolBranches = store.branches.filter((b) => b.schoolId === store.currentSchoolId);
  const schoolRooms = store.rooms.filter((r) => r.schoolId === store.currentSchoolId);
  const schoolShifts = store.shifts.filter((s) => s.schoolId === store.currentSchoolId);

  const handleSaveClassSubjects = (updatedClasses: typeof schoolClasses) => {
    store.updateClasses(updatedClasses);
  };

  const handleGenerateAI = () => {
    if (schoolClasses.length === 0 || schoolTeachers.length === 0) return;

    store.setIsGenerating(true);
    try {
      const solver = new CSPSolver({
        classes: schoolClasses,
        teachers: schoolTeachers,
        subjects: schoolSubjects,
        rooms: schoolRooms,
        branches: schoolBranches,
        shifts: schoolShifts,
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
