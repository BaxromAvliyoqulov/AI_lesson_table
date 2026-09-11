"use client";

import React, { useState, useMemo, useCallback } from "react";
import { SchoolClass, Branch, Shift, Teacher, Subject } from "@/types";
import { sortClassesByName, isClassSecondShift } from "@/lib/utils";
import { useSchoolStore } from "@/lib/store/useSchoolStore";
import { MMTV133CurriculumModal } from "@/components/settings/modals/MMTV133CurriculumModal";
import { GraduationCap } from "lucide-react";
import { ClassFilterType } from "./classes/types";
import { ClassesHeaderAndStats } from "./classes/ClassesHeaderAndStats";
import { BulkClassGenerator } from "./classes/BulkClassGenerator";
import { ClassCard } from "./classes/ClassCard";
import { QuickHomeroomModal } from "./classes/QuickHomeroomModal";

export interface ClassesTabProps {
  classes: SchoolClass[];
  branches: Branch[];
  shifts: Shift[];
  teachers: Teacher[];
  subjects: Subject[];
  onAddClass: () => void;
  onEditClass: (cls: SchoolClass) => void;
  onDeleteClass: (classId: string) => void;
  onOpenCurriculum: (cls: SchoolClass) => void;
  onSetHomeroomTeacher?: (classId: string, teacherId: string | null) => void;
  onOpenEMaktabImport?: () => void;
  onBulkAddClasses?: (newClasses: SchoolClass[]) => void;
}

export const ClassesTab: React.FC<ClassesTabProps> = ({
  classes,
  branches,
  shifts,
  teachers,
  subjects,
  onAddClass,
  onEditClass,
  onDeleteClass,
  onOpenCurriculum,
  onSetHomeroomTeacher,
  onOpenEMaktabImport,
  onBulkAddClasses,
}) => {
  const {
    lockedClassIds = [],
    toggleLockClass,
    updateClass,
    applyStandardCurriculumToAllClasses,
  } = useSchoolStore();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ClassFilterType>("ALL");
  const [shiftFilter, setShiftFilter] = useState<"ALL" | "SHIFT_1" | "SHIFT_2">("ALL");
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  // Standart o'quv rejasini tatbiq qilish holati
  const [isApplyStandardModalOpen, setIsApplyStandardModalOpen] = useState(false);
  const [isApplyingStandard, setIsApplyingStandard] = useState(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const showStatusToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 4000);
  };

  const handleApplyStandardCurriculum = async (targetScope?: "ALL" | "UZBEK" | "RUSSIAN") => {
    setIsApplyingStandard(true);
    try {
      const scope = targetScope || "ALL";
      applyStandardCurriculumToAllClasses(scope);
      const scopeLabel =
        scope === "UZBEK"
          ? "O'zbek sinflariga"
          : scope === "RUSSIAN"
          ? "Rus sinflariga"
          : "Barcha sinflarga";
      showStatusToast(`🎉 ${scopeLabel} 2026-2027 Davlat Standart O'quv Rejasi (MMTV 133-buyruq) xatosiz tatbiq etildi!`);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : "Noma'lum xatolik";
      showStatusToast("Xatolik yuz berdi: " + errMsg);
    } finally {
      setIsApplyingStandard(false);
      setIsApplyStandardModalOpen(false);
    }
  };

  // Quick homeroom assignment modal
  const [quickClass, setQuickClass] = useState<SchoolClass | null>(null);
  const [quickTeacherId, setQuickTeacherId] = useState<string>("");

  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);
  const shiftMap = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);

  // Sinf rahbarini topish
  const getClassHomeroomTeacher = useCallback(
    (cls: SchoolClass): Teacher | null => {
      if (cls.homeroomTeacherId) {
        if (teacherMap.has(cls.homeroomTeacherId)) {
          return teacherMap.get(cls.homeroomTeacherId)!;
        }
        const rawTarget = cls.homeroomTeacherId.trim().toLowerCase();
        const byName = teachers.find(
          (t) =>
            t.fullName.toLowerCase() === rawTarget ||
            (t.displayNumber && `t_${t.displayNumber}` === cls.homeroomTeacherId) ||
            t.id.toLowerCase() === rawTarget
        );
        if (byName) return byName;
      }

      const rawClassId = cls.id.toLowerCase();
      const rawClassName = cls.name.toLowerCase();
      const normClassName = rawClassName.replace(/[^a-z0-9]/g, "");

      const byTeacher = teachers.find((t) => {
        if (!t.homeroomClassId) return false;
        const tHId = t.homeroomClassId.toLowerCase();
        return (
          tHId === rawClassId ||
          tHId === rawClassName ||
          tHId.replace(/[^a-z0-9]/g, "") === normClassName
        );
      });
      if (byTeacher) return byTeacher;

      const sinfSoatiSub = cls.subjects?.find(
        (s) =>
          s.subjectId === "sub_sinf_soati" ||
          s.subjectId?.toLowerCase().includes("sinf_soati")
      );
      if (sinfSoatiSub && sinfSoatiSub.teacherId) {
        return (
          teacherMap.get(sinfSoatiSub.teacherId) ||
          teachers.find((t) => t.id === sinfSoatiSub.teacherId) ||
          null
        );
      }

      return null;
    },
    [teachers, teacherMap]
  );

  const primaryCount = useMemo(() => classes.filter((c) => c.grade <= 4).length, [classes]);
  const middleCount = useMemo(() => classes.filter((c) => c.grade >= 5 && c.grade <= 9).length, [classes]);
  const highCount = useMemo(() => classes.filter((c) => c.grade >= 10).length, [classes]);
  const totalStudents = useMemo(() => classes.reduce((sum, c) => sum + (c.studentCount || 25), 0), [classes]);
  const lockedCount = useMemo(() => classes.filter((c) => lockedClassIds.includes(c.id)).length, [classes, lockedClassIds]);

  const isClassShift2 = useCallback((c: SchoolClass) => isClassSecondShift(c, shifts), [shifts]);
  const isClassShift1 = useCallback((c: SchoolClass) => !isClassShift2(c), [isClassShift2]);

  const shift1Count = useMemo(() => classes.filter(isClassShift1).length, [classes, isClassShift1]);
  const shift2Count = useMemo(() => classes.filter(isClassShift2).length, [classes, isClassShift2]);

  const handleToggleClassShift = useCallback(
    (cls: SchoolClass, e: React.MouseEvent) => {
      e.stopPropagation();
      const is2 = isClassShift2(cls);
      const s1 = shifts.find((s) => !s.id.toLowerCase().includes("2") && !s.name.toLowerCase().includes("2")) || shifts[0];
      const s2 = shifts.find((s) => s.id.toLowerCase().includes("2") || s.name.toLowerCase().includes("2") || s.name.toLowerCase().includes("tush")) || shifts[1] || shifts[0];
      const targetShiftId = is2 ? (s1?.id || "s39_1") : (s2?.id || "s39_2");

      updateClass({
        ...cls,
        shiftId: targetShiftId,
      });
    },
    [isClassShift2, shifts, updateClass]
  );

  const noHomeroomCount = useMemo(
    () => classes.filter((c) => !getClassHomeroomTeacher(c)).length,
    [classes, getClassHomeroomTeacher]
  );
  const withHomeroomCount = useMemo(() => classes.length - noHomeroomCount, [classes.length, noHomeroomCount]);

  const gradeCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (let g = 1; g <= 11; g++) map.set(g, 0);
    classes.forEach((c) => {
      const g = c.grade || 1;
      map.set(g, (map.get(g) || 0) + 1);
    });
    return map;
  }, [classes]);

  const isClassIncompleteCurriculum = useCallback((cls: SchoolClass) => {
    const subjects = cls.subjects || [];
    if (subjects.length === 0) return true;

    const uniqueSubjectMap = new Map<string, { hasT1: boolean; hasT2: boolean; isSplit: boolean }>();
    subjects.forEach((s) => {
      if (!uniqueSubjectMap.has(s.subjectId)) {
        uniqueSubjectMap.set(s.subjectId, { hasT1: false, hasT2: false, isSplit: false });
      }
      const entry = uniqueSubjectMap.get(s.subjectId)!;
      if (s.groupType === "GROUP_2") {
        entry.isSplit = true;
        entry.hasT2 = !!s.teacherId;
      } else if (s.groupType === "GROUP_1") {
        entry.isSplit = true;
        entry.hasT1 = !!s.teacherId;
      } else {
        entry.hasT1 = !!s.teacherId;
      }
    });

    for (const entry of uniqueSubjectMap.values()) {
      if (entry.isSplit) {
        if (!entry.hasT1 || !entry.hasT2) return true;
      } else {
        if (!entry.hasT1) return true;
      }
    }

    return false;
  }, []);

  const incompleteCurriculumCount = useMemo(
    () => classes.filter(isClassIncompleteCurriculum).length,
    [classes, isClassIncompleteCurriculum]
  );

  const filteredClasses = useMemo(() => {
    let list = classes;

    if (shiftFilter === "SHIFT_1") {
      list = list.filter(isClassShift1);
    } else if (shiftFilter === "SHIFT_2") {
      list = list.filter(isClassShift2);
    }

    if (selectedGrade !== null) {
      list = list.filter((c) => c.grade === selectedGrade);
    } else if (filterType === "PRIMARY") {
      list = list.filter((c) => c.grade <= 4);
    } else if (filterType === "MIDDLE") {
      list = list.filter((c) => c.grade >= 5 && c.grade <= 9);
    } else if (filterType === "HIGH") {
      list = list.filter((c) => c.grade >= 10);
    } else if (filterType === "NO_HOMEROOM") {
      list = list.filter((c) => !getClassHomeroomTeacher(c));
    } else if (filterType === "LOCKED") {
      list = list.filter((c) => lockedClassIds.includes(c.id));
    } else if (filterType === "INCOMPLETE_CURRICULUM") {
      list = list.filter(isClassIncompleteCurriculum);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        if (c.name.toLowerCase().includes(q)) return true;
        const homeroom = getClassHomeroomTeacher(c);
        if (homeroom && homeroom.fullName.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    return sortClassesByName(list);
  }, [
    classes,
    shiftFilter,
    isClassShift1,
    isClassShift2,
    selectedGrade,
    filterType,
    search,
    getClassHomeroomTeacher,
    lockedClassIds,
    isClassIncompleteCurriculum,
  ]);

  const handleSaveQuickHomeroom = () => {
    if (!quickClass || !onSetHomeroomTeacher) return;
    onSetHomeroomTeacher(quickClass.id, quickTeacherId || null);
    setQuickClass(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header, Stats, Search va Filtrlar */}
      <ClassesHeaderAndStats
        search={search}
        setSearch={setSearch}
        onAddClass={onAddClass}
        totalClassesCount={classes.length}
        totalStudents={totalStudents}
        primaryCount={primaryCount}
        middleCount={middleCount}
        highCount={highCount}
        withHomeroomCount={withHomeroomCount}
        noHomeroomCount={noHomeroomCount}
        lockedCount={lockedCount}
        incompleteCurriculumCount={incompleteCurriculumCount}
        filteredClassesCount={filteredClasses.length}
        filterType={filterType}
        setFilterType={setFilterType}
        selectedGrade={selectedGrade}
        setSelectedGrade={setSelectedGrade}
        shiftFilter={shiftFilter}
        setShiftFilter={setShiftFilter}
        shift1Count={shift1Count}
        shift2Count={shift2Count}
        gradeCounts={gradeCounts}
        onOpenEMaktabImport={onOpenEMaktabImport}
        onOpenApplyStandardModal={() => setIsApplyStandardModalOpen(true)}
      />

      {/* 2. Ommaviy va yakka sinf yaratish generatori */}
      <BulkClassGenerator
        branches={branches}
        shifts={shifts}
        existingClasses={classes}
        onBulkAddClasses={onBulkAddClasses}
      />

      {/* 3. Sinflar Gridi */}
      {filteredClasses.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Sinf topilmadi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Yuqoridagi kombinatorik paneldan bir necha soniyada sinflarni yarating
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
          {filteredClasses.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              branch={branchMap.get(cls.branchId)}
              homeroom={getClassHomeroomTeacher(cls)}
              isLocked={lockedClassIds.includes(cls.id)}
              isShift2={isClassShift2(cls)}
              onToggleLock={toggleLockClass}
              onEdit={onEditClass}
              onDelete={onDeleteClass}
              onToggleShift={handleToggleClassShift}
              onOpenCurriculum={onOpenCurriculum}
              onOpenQuickHomeroom={(c) => {
                const hr = getClassHomeroomTeacher(c);
                setQuickClass(c);
                setQuickTeacherId(hr ? hr.id : "");
              }}
            />
          ))}
        </div>
      )}

      {/* Quick Homeroom Modal */}
      <QuickHomeroomModal
        quickClass={quickClass}
        teachers={teachers}
        quickTeacherId={quickTeacherId}
        setQuickTeacherId={setQuickTeacherId}
        onClose={() => setQuickClass(null)}
        onSave={handleSaveQuickHomeroom}
      />

      {/* MMTV 133-buyruq Standart O'quv Rejasi Modali (Excel Matrix, Daxlsiz Merging & 1-Click Apply) */}
      <MMTV133CurriculumModal
        isOpen={isApplyStandardModalOpen}
        onClose={() => setIsApplyStandardModalOpen(false)}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        onApplyStandard={handleApplyStandardCurriculum}
        isApplying={isApplyingStandard}
      />

      {/* Status Toast */}
      {statusToast && (
        <div className="fixed bottom-6 right-6 z-1000 px-4 py-3 rounded-2xl shadow-xl bg-slate-900 text-white text-xs font-bold transition-all animate-in slide-in-from-bottom-2">
          {statusToast}
        </div>
      )}
    </div>
  );
};
