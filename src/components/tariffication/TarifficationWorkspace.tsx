"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  SchoolClass,
  Subject,
  Teacher,
  Branch,
  ClassSubject,
} from "@/types";
import {
  STANDARD_PRIMARY_CURRICULUM,
  STANDARD_HIGH_CURRICULUM,
} from "@/lib/curriculum-templates";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { TarifficationHeader, ViewMode } from "./TarifficationHeader";
import { TarifficationByClassView } from "./TarifficationByClassView";
import { TarifficationByTeacherView } from "./TarifficationByTeacherView";
import { TarifficationMatrixView } from "./TarifficationMatrixView";

interface TarifficationWorkspaceProps {
  initialClasses: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  branches: Branch[];
  schoolName: string;
  onSaveClassSubjects: (updatedClasses: SchoolClass[]) => Promise<void> | void;
  onGenerateAI?: () => void;
  isGenerating?: boolean;
}

export const TarifficationWorkspace: React.FC<TarifficationWorkspaceProps> = ({
  initialClasses,
  subjects,
  teachers,
  branches,
  schoolName,
  onSaveClassSubjects,
  onGenerateAI,
  isGenerating = false,
}) => {
  const router = useRouter();
  const [classesData, setClassesData] = useState<SchoolClass[]>(initialClasses);
  const [viewMode, setViewMode] = useState<ViewMode>("BY_CLASS");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [stageFilter, setStageFilter] = useState<"ALL" | "PRIMARY" | "HIGH">("ALL");

  const [activeClassId, setActiveClassId] = useState<string>(initialClasses[0]?.id || "");
  const [activeTeacherId, setActiveTeacherId] = useState<string>(teachers[0]?.id || "");

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    setClassesData(initialClasses);
  }, [initialClasses]);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);

  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.fullName.localeCompare(b.fullName, "uz"));
  }, [teachers]);

  const teacherAssignedHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const cls of classesData) {
      if (cls.isClosed) continue;
      for (const cs of cls.subjects) {
        if (cs.teacherId) {
          map.set(cs.teacherId, (map.get(cs.teacherId) || 0) + cs.weeklyHours);
        }
      }
    }
    return map;
  }, [classesData]);

  const filteredClasses = useMemo(() => {
    return classesData.filter((c) => {
      if (selectedBranchId !== "ALL" && c.branchId !== selectedBranchId) return false;
      if (stageFilter === "PRIMARY" && !c.isPrimary && c.grade > 4) return false;
      if (stageFilter === "HIGH" && (c.isPrimary || c.grade <= 4)) return false;
      return true;
    });
  }, [classesData, selectedBranchId, stageFilter]);

  const activeClass = useMemo(() => {
    const found = classesData.find((c) => c.id === activeClassId);
    return found || filteredClasses[0] || classesData[0];
  }, [classesData, activeClassId, filteredClasses]);

  const activeTeacher = useMemo(() => {
    const found = teachers.find((t) => t.id === activeTeacherId);
    return found || sortedTeachers[0] || teachers[0];
  }, [teachers, activeTeacherId, sortedTeachers]);

  const totalSchoolHours = useMemo(() => {
    let total = 0;
    classesData.forEach((c) => {
      if (!c.isClosed) {
        (c.subjects || []).forEach((cs) => (total += cs.weeklyHours));
      }
    });
    return total;
  }, [classesData]);

  const handleUpdateSubject = (
    classId: string,
    subjectId: string,
    teacherId: string,
    weeklyHours: number
  ) => {
    setClassesData((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const exists = (cls.subjects || []).some((cs) => cs.subjectId === subjectId);
        let updated: ClassSubject[];

        if (weeklyHours <= 0) {
          updated = (cls.subjects || []).filter((cs) => cs.subjectId !== subjectId);
        } else if (exists) {
          updated = (cls.subjects || []).map((cs) =>
            cs.subjectId === subjectId ? { ...cs, teacherId, weeklyHours } : cs
          );
        } else {
          updated = [
            ...(cls.subjects || []),
            { classId: cls.id, subjectId, teacherId, weeklyHours, groupType: "WHOLE" },
          ];
        }
        return { ...cls, subjects: updated };
      })
    );
  };

  const handleLoadStandardForClass = (targetClass: SchoolClass) => {
    const isPrim = targetClass.isPrimary || targetClass.grade <= 4;
    const template = isPrim ? STANDARD_PRIMARY_CURRICULUM : STANDARD_HIGH_CURRICULUM;
    const teacherLookup = new Map((targetClass.subjects || []).map((s) => [s.subjectId, s.teacherId]));

    const newSubjects: ClassSubject[] = template
      .map((item) => {
        const subObj = subjects.find(
          (s) =>
            s.name.toLowerCase() === item.subjectName.toLowerCase() ||
            (s.shortName && s.shortName.toLowerCase() === item.subjectName.toLowerCase())
        );
        if (!subObj) return null;

        let teacherId = teacherLookup.get(subObj.id) || "";
        if (!teacherId) {
          const eligible = teachers.filter((t) => (t.subjectIds || []).includes(subObj.id));
          if (eligible.length > 0) {
            eligible.sort((a, b) => (teacherAssignedHours.get(a.id) || 0) - (teacherAssignedHours.get(b.id) || 0));
            teacherId = eligible[0].id;
          }
        }

        return {
          classId: targetClass.id,
          subjectId: subObj.id,
          teacherId: teacherId || "",
          weeklyHours: item.weeklyHours,
          groupType: "WHOLE" as const,
        };
      })
      .filter(Boolean) as ClassSubject[];

    setClassesData((prev) =>
      prev.map((cls) => (cls.id === targetClass.id ? { ...cls, subjects: newSubjects } : cls))
    );

    showToast(`✅ ${targetClass.name} sinfiga davlat standarti bo'yicha ${newSubjects.length} ta fan yuklandi!`);
  };

  const handleLoadStandardForAllClasses = () => {
    if (!window.confirm("Barcha tanlangan sinflarga davlat o'quv rejasini yuklashni tasdiqlaysizmi?")) return;

    setClassesData((prev) =>
      prev.map((cls) => {
        if (selectedBranchId !== "ALL" && cls.branchId !== selectedBranchId) return cls;
        if (stageFilter === "PRIMARY" && !cls.isPrimary && cls.grade > 4) return cls;
        if (stageFilter === "HIGH" && (cls.isPrimary || cls.grade <= 4)) return cls;

        const isPrim = cls.isPrimary || cls.grade <= 4;
        const template = isPrim ? STANDARD_PRIMARY_CURRICULUM : STANDARD_HIGH_CURRICULUM;
        const teacherLookup = new Map((cls.subjects || []).map((s) => [s.subjectId, s.teacherId]));

        const newSubjects: ClassSubject[] = template
          .map((item) => {
            const subObj = subjects.find(
              (s) =>
                s.name.toLowerCase() === item.subjectName.toLowerCase() ||
                (s.shortName && s.shortName.toLowerCase() === item.subjectName.toLowerCase())
            );
            if (!subObj) return null;

            let teacherId = teacherLookup.get(subObj.id) || "";
            if (!teacherId) {
              const eligible = teachers.filter((t) => (t.subjectIds || []).includes(subObj.id));
              if (eligible.length > 0) {
                eligible.sort((a, b) => (teacherAssignedHours.get(a.id) || 0) - (teacherAssignedHours.get(b.id) || 0));
                teacherId = eligible[0].id;
              }
            }

            return {
              classId: cls.id,
              subjectId: subObj.id,
              teacherId: teacherId || "",
              weeklyHours: item.weeklyHours,
              groupType: "WHOLE" as const,
            };
          })
          .filter(Boolean) as ClassSubject[];

        return { ...cls, subjects: newSubjects };
      })
    );

    showToast("✅ Barcha sinflarga davlat o'quv rejasi muvaffaqiyatli tatbiq etildi!");
  };

  const handleSave = async () => {
    await onSaveClassSubjects(classesData);
    showToast("✅ Barcha o'quv rejalari va tarifikatsiya o'zgarishlari muvaffaqiyatli saqlandi!");
  };

  const handleSaveAndGenerate = async () => {
    await onSaveClassSubjects(classesData);
    if (onGenerateAI) {
      onGenerateAI();
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-top-2 ${
          toast.type === "success" ? "bg-emerald-600 text-white shadow-emerald-600/30" : "bg-rose-600 text-white shadow-rose-600/30"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      <TarifficationHeader
        schoolName={schoolName}
        totalSchoolHours={totalSchoolHours}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedBranchId={selectedBranchId}
        onBranchChange={setSelectedBranchId}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        branches={branches}
        totalClassesCount={classesData.length}
        onSave={handleSave}
        onSaveAndGenerate={handleSaveAndGenerate}
        onMassLoadStandard={handleLoadStandardForAllClasses}
        isGenerating={isGenerating}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {viewMode === "BY_CLASS" && (
          <TarifficationByClassView
            classes={filteredClasses}
            activeClass={activeClass}
            onSelectClass={setActiveClassId}
            subjects={subjects}
            sortedTeachers={sortedTeachers}
            teacherAssignedHours={teacherAssignedHours}
            branchMap={branchMap}
            onUpdateSubject={handleUpdateSubject}
            onLoadStandardForClass={handleLoadStandardForClass}
          />
        )}

        {viewMode === "BY_TEACHER" && (
          <TarifficationByTeacherView
            classesData={classesData}
            teachers={teachers}
            sortedTeachers={sortedTeachers}
            activeTeacher={activeTeacher}
            onSelectTeacher={setActiveTeacherId}
            subjects={subjects}
            subjectMap={subjectMap}
            teacherAssignedHours={teacherAssignedHours}
            onUpdateSubject={handleUpdateSubject}
          />
        )}

        {viewMode === "MATRIX" && (
          <TarifficationMatrixView
            filteredClasses={filteredClasses}
            subjects={subjects}
            sortedTeachers={sortedTeachers}
            onUpdateSubject={handleUpdateSubject}
          />
        )}
      </main>
    </div>
  );
};
