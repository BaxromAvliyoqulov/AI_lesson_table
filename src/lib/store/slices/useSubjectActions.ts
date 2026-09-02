import { useCallback } from "react";
import { Subject } from "@/types";
import { upsertSubjectAction, deleteSubjectAction } from "@/lib/actions/school.actions";
import { storeState, updateStore, addAuditLog } from "../store-core";

export function useSubjectActions() {
  const addSubject = useCallback((subject: Subject) => {
    updateStore((prev) => ({
      ...prev,
      subjects: [...prev.subjects, subject],
      syncStatus: "syncing",
    }));
    addAuditLog("Fan qo'shildi", `${subject.name} fani qo'shildi`);

    upsertSubjectAction(subject.schoolId || storeState.currentSchoolId, subject).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  const updateSubject = useCallback((subject: Subject) => {
    updateStore((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === subject.id ? subject : s)),
      syncStatus: "syncing",
    }));
    addAuditLog("Fan tahrirlandi", `${subject.name} fani yangilandi`);

    upsertSubjectAction(subject.schoolId || storeState.currentSchoolId, subject).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  const deleteSubject = useCallback((subjectId: string) => {
    const target = storeState.subjects.find((s) => s.id === subjectId);
    updateStore((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s.id !== subjectId),
      lessons: prev.lessons.filter((l) => l.subjectId !== subjectId),
      syncStatus: "syncing",
    }));
    if (target) {
      addAuditLog("Fan o'chirildi", `${target.name} fani o'chirildi`);
    }

    deleteSubjectAction(storeState.currentSchoolId, subjectId).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  const toggleSubjectStatus = useCallback((subjectId: string, forcedState?: boolean) => {
    const target = storeState.subjects.find((s) => s.id === subjectId);
    if (!target) return;
    const newActive = forcedState !== undefined ? forcedState : !(target.isActive !== false);
    const updatedSubject: Subject = { ...target, isActive: newActive };

    updateStore((prev) => ({
      ...prev,
      subjects: prev.subjects.map((s) => (s.id === subjectId ? updatedSubject : s)),
      syncStatus: "syncing",
    }));

    addAuditLog(
      newActive ? "Fan faollashtirildi" : "Fan nofaol qilindi",
      `${target.name} fani ${newActive ? "faol" : "nofaol"} holatga o'tkazildi`
    );

    upsertSubjectAction(target.schoolId || storeState.currentSchoolId, updatedSubject).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  return {
    addSubject,
    updateSubject,
    deleteSubject,
    toggleSubjectStatus,
  };
}
