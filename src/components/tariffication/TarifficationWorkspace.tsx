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
  generateStandardCurriculumForClass,
  isKelajakOrSinfSoatiSubject,
  isHomeroomPrimarySubject,
} from "@/lib/curriculum-templates";
import { TarifficationHeader, ViewMode } from "./TarifficationHeader";
import { TarifficationByClassView } from "./TarifficationByClassView";
import { TarifficationByTeacherView } from "./TarifficationByTeacherView";
import { TarifficationMatrixView } from "./TarifficationMatrixView";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";

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
  const [viewMode, setViewModeState] = useState<ViewMode>("BY_CLASS");
  const [selectedBranchId, setSelectedBranchIdState] = useState<string>("ALL");
  const [stageFilter, setStageFilterState] = useState<"ALL" | "PRIMARY" | "HIGH">("ALL");

  const [activeClassId, setActiveClassId] = useState<string>(initialClasses[0]?.id || "");
  const [activeTeacherId, setActiveTeacherId] = useState<string>(teachers[0]?.id || "");

  // F5 va sahifa yangilanishida rejim va filtrlarni saqlash
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlMode = urlParams.get("mode")?.toUpperCase();
      if (urlMode && ["BY_CLASS", "BY_TEACHER", "MATRIX"].includes(urlMode)) {
        setViewModeState(urlMode as ViewMode);
      } else {
        const savedMode = localStorage.getItem("tariffication_view_mode") as ViewMode;
        if (savedMode && ["BY_CLASS", "BY_TEACHER", "MATRIX"].includes(savedMode)) {
          setViewModeState(savedMode);
        }
      }

      const savedBranch = localStorage.getItem("tariffication_branch");
      if (savedBranch) setSelectedBranchIdState(savedBranch);

      const savedStage = localStorage.getItem("tariffication_stage") as any;
      if (savedStage && ["ALL", "PRIMARY", "HIGH"].includes(savedStage)) {
        setStageFilterState(savedStage);
      }
    }
  }, []);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("tariffication_view_mode", mode);
      const url = new URL(window.location.href);
      url.searchParams.set("mode", mode.toLowerCase());
      window.history.replaceState({}, "", url.toString());
    }
  };

  const setSelectedBranchId = (branchId: string) => {
    setSelectedBranchIdState(branchId);
    if (typeof window !== "undefined") {
      localStorage.setItem("tariffication_branch", branchId);
    }
  };

  const setStageFilter = (stage: "ALL" | "PRIMARY" | "HIGH") => {
    setStageFilterState(stage);
    if (typeof window !== "undefined") {
      localStorage.setItem("tariffication_stage", stage);
    }
  };

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText: string;
    variant: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Ha, tasdiqlayman",
    variant: "warning",
    onConfirm: () => {},
  });

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
      for (const cs of cls.subjects || []) {
        if (cs.teacherId) {
          const sub = subjectMap.get(cs.subjectId);
          // O'zbekiston standartida Kelajak soati (Sinf soati) o'qituvchining dars stavkasiga qo'shilmaydi
          if (!isKelajakOrSinfSoatiSubject(cs.subjectId, sub?.name)) {
            map.set(cs.teacherId, (map.get(cs.teacherId) || 0) + cs.weeklyHours);
          }
        }
      }
    }
    return map;
  }, [classesData, subjectMap]);

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

        let homeroomId = cls.homeroomTeacherId;
        // Agar Kelajak soati faniga o'qituvchi biriktirilsa, avtomatik sinf rahbari sifatida ham belgilanadi
        if (
          (subjectId === "sub_sinf_soati" ||
            subjectId === "sub_kelajak" ||
            subjectId.toLowerCase().includes("sinf_soati") ||
            subjectId.toLowerCase().includes("kelajak")) &&
          teacherId
        ) {
          homeroomId = teacherId;
        }

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
        return { ...cls, homeroomTeacherId: homeroomId, subjects: updated };
      })
    );
  };

  const handleSetHomeroomTeacher = async (classId: string, teacherId: string) => {
    const targetTeacher = teacherId ? teachers.find((t) => t.id === teacherId) : null;
    const updated = classesData.map((cls) => {
      if (cls.id !== classId) return cls;
      let hasClassHour = false;
      const isPrimary = cls.grade <= 4;
      let updatedSubjects = (cls.subjects || []).map((cs) => {
        const sub = subjectMap.get(cs.subjectId);
        if (isKelajakOrSinfSoatiSubject(cs.subjectId, sub?.name)) {
          hasClassHour = true;
          return { ...cs, teacherId: teacherId || "" };
        }
        // Agar boshlang'ich sinf bo'lsa va sinf rahbari o'zgarsa, Ona tili, O'qish, Matematika ham sinxronlashadi
        if (isPrimary && sub && isHomeroomPrimarySubject(sub, cls.grade)) {
          return teacherId ? { ...cs, teacherId } : cs;
        }
        return cs;
      });

      // Agar sinfda hali Kelajak soati bo'lmasa va sinf rahbari tanlangan bo'lsa, uni avtomatik qo'shamiz
      if (!hasClassHour && teacherId) {
        const sinfSoatiSub = subjects.find((s) => isKelajakOrSinfSoatiSubject(s.id, s.name));
        const finalSubId = sinfSoatiSub?.id || "sub_sinf_soati";
        updatedSubjects.push({
          classId: cls.id,
          subjectId: finalSubId,
          teacherId,
          weeklyHours: 1,
          groupType: "WHOLE",
        });
      }

      return { ...cls, homeroomTeacherId: teacherId || undefined, subjects: updatedSubjects };
    });
    setClassesData(updated);
    await onSaveClassSubjects(updated);
    showToast(
      teacherId
        ? `👤 ${targetTeacher?.fullName || "Ustoz"} sinf rahbari etib belgilandi va Kelajak soati avtomatik biriktirildi!`
        : "👤 Sinf rahbari olib tashlandi"
    );
  };

  const handleRemoveSubject = async (classId: string, subjectId: string) => {
    const updated = classesData.map((cls) => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        subjects: (cls.subjects || []).filter((cs) => cs.subjectId !== subjectId),
      };
    });
    setClassesData(updated);
    await onSaveClassSubjects(updated);
    showToast("🗑️ Fan sinf o'quv rejasidan olib tashlandi va saqlandi!");
  };

  const handleClearClassSubjects = (classId: string) => {
    const cls = classesData.find((c) => c.id === classId);
    setConfirmModalConfig({
      isOpen: true,
      title: "O'quv rejasini tozalash",
      description: `"${cls?.name || "Sinf"}"ning barcha fanlari va o'quv rejasini tozalashni tasdiqlaysizmi?`,
      confirmText: "Ha, tozalansin",
      variant: "danger",
      onConfirm: async () => {
        const updated = classesData.map((c) => (c.id === classId ? { ...c, subjects: [] } : c));
        setClassesData(updated);
        await onSaveClassSubjects(updated);
        showToast("🗑️ Sinf o'quv rejasi tozalandi!");
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleTransferLesson = async (
    fromTeacherId: string,
    toTeacherId: string,
    classId: string,
    subjectId: string
  ) => {
    const updated = classesData.map((cls) => {
      if (cls.id !== classId) return cls;
      return {
        ...cls,
        subjects: (cls.subjects || []).map((cs) =>
          cs.subjectId === subjectId && cs.teacherId === fromTeacherId
            ? { ...cs, teacherId: toTeacherId }
            : cs
        ),
      };
    });
    setClassesData(updated);
    await onSaveClassSubjects(updated);
    showToast("🔄 Dars boshqa o'qituvchiga muvaffaqiyatli o'tkazildi va saqlandi!");
  };

  const handleLoadStandardForClass = async (targetClass: SchoolClass) => {
    const tracker = new Map<string, number>();
    classesData.forEach((c) => {
      if (c.id !== targetClass.id) {
        (c.subjects || []).forEach((cs) => {
          if (cs.teacherId) {
            tracker.set(cs.teacherId, (tracker.get(cs.teacherId) || 0) + cs.weeklyHours);
          }
        });
      }
    });

    const newSubjects = generateStandardCurriculumForClass(
      targetClass.grade,
      targetClass.id,
      targetClass.homeroomTeacherId,
      subjects,
      sortedTeachers,
      tracker
    );

    const updated = classesData.map((cls) =>
      cls.id === targetClass.id ? { ...cls, subjects: newSubjects } : cls
    );

    setClassesData(updated);
    await onSaveClassSubjects(updated);
    showToast(`✅ ${targetClass.name} sinfiga standart reja yuklandi va bazaga saqlandi!`);
  };

  const handleLoadStandardForAllClasses = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: "Davlat o'quv rejasini yuklash",
      description: "Barcha tanlangan sinflarga davlat tayanch o'quv rejasini (316 soatlik standart) yuklashni tasdiqlaysizmi?",
      confirmText: "Ha, yuklansin",
      variant: "warning",
      onConfirm: async () => {
        const tracker = new Map<string, number>();
        sortedTeachers.forEach((t) => tracker.set(t.id, 0));

        const updated = classesData.map((cls) => {
          if (selectedBranchId !== "ALL" && cls.branchId !== selectedBranchId) return cls;
          if (stageFilter === "PRIMARY" && !cls.isPrimary && cls.grade > 4) return cls;
          if (stageFilter === "HIGH" && (cls.isPrimary || cls.grade <= 4)) return cls;

          const newSubjects = generateStandardCurriculumForClass(
            cls.grade,
            cls.id,
            cls.homeroomTeacherId,
            subjects,
            sortedTeachers,
            tracker
          );
          return { ...cls, subjects: newSubjects };
        });

        setClassesData(updated);
        await onSaveClassSubjects(updated);
        showToast("✅ Barcha sinflarga davlat tayanch o'quv rejasi yuklandi!");
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
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
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/30"
              : "bg-rose-600 text-white shadow-rose-600/30"
          }`}
        >
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

      <main className="flex-1 w-full max-w-[1920px] mx-auto px-3 sm:px-6 py-4 flex flex-col">
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
            onRemoveSubject={handleRemoveSubject}
            onClearClassSubjects={handleClearClassSubjects}
            onLoadStandardForClass={handleLoadStandardForClass}
            onSetHomeroomTeacher={handleSetHomeroomTeacher}
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
            onTransferLesson={handleTransferLesson}
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

      {/* ── TASDIQLASH MODALI (Zamonaviy UI Confirm) ── */}
      <ConfirmActionModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        description={confirmModalConfig.description}
        confirmText={confirmModalConfig.confirmText}
        cancelText="Bekor qilish"
        variant={confirmModalConfig.variant}
      />
    </div>
  );
};
