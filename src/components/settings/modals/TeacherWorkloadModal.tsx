"use client";

import React from "react";
import { Teacher, Subject, SchoolClass } from "@/types";
import { TeacherClassAssignment, TeacherWorkloadModalProps } from "./teacher-workload/types";
import { useTeacherWorkloadLogic } from "./teacher-workload/useTeacherWorkloadLogic";
import { TeacherWorkloadHeader } from "./teacher-workload/TeacherWorkloadHeader";
import { TeacherWorkloadBatchPicker } from "./teacher-workload/TeacherWorkloadBatchPicker";
import { TeacherWorkloadAssignmentCard } from "./teacher-workload/TeacherWorkloadAssignmentCard";
import { TeacherWorkloadFooter } from "./teacher-workload/TeacherWorkloadFooter";
import { GraduationCap, Plus } from "lucide-react";

export type { TeacherClassAssignment };

export const TeacherWorkloadModal: React.FC<TeacherWorkloadModalProps> = ({
  isOpen,
  onClose,
  teacher,
  classes,
  subjects,
  teachers = [],
  onSave,
}) => {
  const {
    schoolClasses,
    subjectMap,
    classMap,
    schoolTeachers,
    resolveCanonicalClass,
    teacherSubjects,
    defaultSubjectId,
    batchSubjectId,
    setBatchSubjectId,
    batchHours,
    setBatchHours,
    isBatchOpen,
    setIsBatchOpen,
    branchFilter,
    setBranchFilter,
    parallelFilter,
    setParallelFilter,
    stageFilter,
    setStageFilter,
    uniqueAssignments,
    totalAssignedHours,
    totalHomeroomHours,
    totalPhysicalHours,
    capacity,
    remainingHours,
    isOverloaded,
    teacherWorkloadMap,
    handleToggleClassAssignment,
    handleBulkSelectGrade,
    handleAddAssignment,
    handleRemoveAssignment,
    handleStepHours,
    handleUpdateAssignment,
    handleToggleSplit,
    handleSave,
    primaryClasses,
    middleClasses,
    highClasses,
    availableGrades,
    availableParallels,
    availableBranches,
    isClassMatchingFilters,
  } = useTeacherWorkloadLogic({
    isOpen,
    onClose,
    teacher,
    classes,
    subjects,
    teachers,
    onSave,
  });

  if (!isOpen || !teacher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col min-w-0">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <TeacherWorkloadHeader
          teacher={teacher}
          isOverloaded={isOverloaded}
          totalAssignedHours={totalAssignedHours}
          capacity={capacity}
          remainingHours={remainingHours}
          totalHomeroomHours={totalHomeroomHours}
          isBatchOpen={isBatchOpen}
          setIsBatchOpen={setIsBatchOpen}
          onAddAssignment={handleAddAssignment}
          onClose={onClose}
        />

        {/* ── ⚡ TEZKOR SINF TANLASH PANELI ─────────────────────────────────── */}
        {isBatchOpen && (
          <TeacherWorkloadBatchPicker
            batchSubjectId={batchSubjectId}
            setBatchSubjectId={setBatchSubjectId}
            batchHours={batchHours}
            setBatchHours={setBatchHours}
            teacherSubjects={teacherSubjects}
            subjects={subjects}
            schoolClasses={schoolClasses}
            uniqueAssignments={uniqueAssignments}
            availableBranches={availableBranches}
            branchFilter={branchFilter}
            setBranchFilter={setBranchFilter}
            stageFilter={stageFilter}
            setStageFilter={setStageFilter}
            availableParallels={availableParallels}
            parallelFilter={parallelFilter}
            setParallelFilter={setParallelFilter}
            availableGrades={availableGrades}
            primaryClasses={primaryClasses}
            middleClasses={middleClasses}
            highClasses={highClasses}
            isClassMatchingFilters={isClassMatchingFilters}
            resolveCanonicalClass={resolveCanonicalClass}
            handleToggleClassAssignment={handleToggleClassAssignment}
            handleBulkSelectGrade={handleBulkSelectGrade}
            defaultSubjectId={defaultSubjectId}
          />
        )}

        {/* ── ASSIGNMENTS LIST ────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 min-w-0">
          {uniqueAssignments.length === 0 ? (
            <div className="py-14 text-center rounded-3xl border border-dashed border-border bg-muted/20">
              <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">
                Hozircha birorta sinf biriktirilmagan
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Yuqoridagi <strong>&quot;⚡ Tezkor sinf tanlash&quot;</strong> panelidan kerakli sinflarni bir bosishda belgilang yoki <strong>&quot;Qatorda qo&apos;shish&quot;</strong> tugmasidan foydalaning.
              </p>
              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleAddAssignment}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dars soati biriktirish</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="hidden sm:flex items-center gap-3 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="w-[28%]">Biriktirilgan sinf</div>
                <div className="w-[30%]">Fan</div>
                <div className="w-28 text-center">Haftalik soat</div>
                <div className="w-52 text-center">Guruhga bo&apos;lish</div>
                <div className="w-8 shrink-0 text-center">O&apos;chirish</div>
              </div>

              {uniqueAssignments.map(({ item, index }) => (
                <TeacherWorkloadAssignmentCard
                  key={`${item.classId}_${item.subjectId}`}
                  item={item}
                  index={index}
                  teacher={teacher}
                  schoolClasses={schoolClasses}
                  teacherSubjects={teacherSubjects}
                  subjects={subjects}
                  subjectMap={subjectMap}
                  classMap={classMap}
                  schoolTeachers={schoolTeachers}
                  teacherWorkloadMap={teacherWorkloadMap}
                  resolveCanonicalClass={resolveCanonicalClass}
                  handleUpdateAssignment={handleUpdateAssignment}
                  handleStepHours={handleStepHours}
                  handleToggleSplit={handleToggleSplit}
                  handleRemoveAssignment={handleRemoveAssignment}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <TeacherWorkloadFooter
          totalAssignmentsCount={uniqueAssignments.length}
          totalAssignedHours={totalAssignedHours}
          totalHomeroomHours={totalHomeroomHours}
          totalPhysicalHours={totalPhysicalHours}
          onClose={onClose}
          onSave={handleSave}
        />
      </div>
    </div>
  );
};
