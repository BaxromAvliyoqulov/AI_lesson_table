"use client";

import React from "react";
import { SchoolClass, Subject, Teacher, ClassSubject } from "@/types";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import { useCurriculumLogic } from "./curriculum/useCurriculumLogic";
import { CurriculumModalHeader } from "./curriculum/CurriculumModalHeader";
import { CurriculumToolbar } from "./curriculum/CurriculumToolbar";
import { CurriculumSubjectRow } from "./curriculum/CurriculumSubjectRow";
import { CurriculumWeeklyGrid } from "./curriculum/CurriculumWeeklyGrid";
import { CurriculumCatalogDrawer } from "./curriculum/CurriculumCatalogDrawer";
import { CurriculumModalFooter } from "./curriculum/CurriculumModalFooter";
import { BookOpen, Sparkles, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";

export interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classId: string, subjects: ClassSubject[]) => void;
  targetClass: SchoolClass | null;
  allSubjects: Subject[];
  allTeachers: Teacher[];
  allClasses?: SchoolClass[];
}

export const CurriculumModal: React.FC<CurriculumModalProps> = ({
  isOpen,
  onClose,
  onSave,
  targetClass,
  allSubjects,
  allTeachers,
  allClasses = [],
}) => {
  const {
    subjectsList,
    selectedCopyClassId,
    setSelectedCopyClassId,
    viewMode,
    setViewMode,
    curriculumFilter,
    setCurriculumFilter,
    isCatalogOpen,
    setIsCatalogOpen,
    catalogSearch,
    setCatalogSearch,
    catalogCategory,
    setCatalogCategory,
    selectedCatalogSubjectIds,
    isClearConfirmOpen,
    setIsClearConfirmOpen,
    toastMessage,
    subjectMap,
    teacherMap,
    availableTeachers,
    groupedSubjectsList,
    visibleGroupedList,
    academicHours,
    homeroomHours,
    totalWeeklyHours,
    unassignedTeachersCount,
    assignedTeachersCount,
    fulfillmentPercent,
    recommendedHours,
    maxSanPiNHours,
    loadPercent,
    isOverloaded,
    filteredCatalogSubjects,
    copyableClasses,
    daysCount,
    dayNames,
    weeklyDistribution,
    handleLoadStandardTemplate,
    handleApplyPrimaryHomeroomRule,
    handleCopyFromOtherClass,
    handleToggleSplitGroup,
    handleUpdateGroupTeacher,
    handleStepSubjectHours,
    handleSetSubjectPresetHours,
    handleRemoveSubjectBySubjectId,
    handleUpdateSubjectId,
    handleToggleCatalogSubject,
    handleStepCatalogHours,
    handleAddSelectedFromCatalog,
    handleAddNewSubjectRow,
    handleAutoAssignSpecialists,
    handleSave,
    handleConfirmClear,
  } = useCurriculumLogic({
    isOpen,
    onClose,
    onSave,
    targetClass,
    allSubjects,
    allTeachers,
    allClasses,
  });

  if (!isOpen || !targetClass) return null;
  const is5DayWeek = (targetClass.grade <= 4) || Boolean(targetClass.isPrimary);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col min-w-0">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <CurriculumModalHeader
          targetClass={targetClass}
          is5DayWeek={is5DayWeek}
          teacherMap={teacherMap}
          viewMode={viewMode}
          setViewMode={setViewMode}
          subjectsCount={subjectsList.length}
          totalWeeklyHours={totalWeeklyHours}
          recommendedHours={recommendedHours}
          academicHours={academicHours}
          homeroomHours={homeroomHours}
          unassignedTeachersCount={unassignedTeachersCount}
          isOverloaded={isOverloaded}
          loadPercent={loadPercent}
          maxSanPiNHours={maxSanPiNHours}
          onClose={onClose}
        />

        {/* ── TOOLBAR ─────────────────────────────────────────────────────── */}
        <CurriculumToolbar
          targetClass={targetClass}
          hasSubjects={subjectsList.length > 0}
          copyableClasses={copyableClasses}
          selectedCopyClassId={selectedCopyClassId}
          setSelectedCopyClassId={setSelectedCopyClassId}
          onOpenCatalog={() => setIsCatalogOpen(true)}
          onAddNewSubjectRow={handleAddNewSubjectRow}
          onLoadStandardTemplate={handleLoadStandardTemplate}
          onAutoAssignSpecialists={handleAutoAssignSpecialists}
          onApplyPrimaryHomeroomRule={handleApplyPrimaryHomeroomRule}
          onCopyFromOtherClass={handleCopyFromOtherClass}
          onClearAll={() => setIsClearConfirmOpen(true)}
        />

        {/* ── MAIN CONTENT AREA ───────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 min-w-0">
          {subjectsList.length === 0 ? (
            <div className="py-16 text-center rounded-3xl border border-dashed border-border/80 bg-muted/20">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 shadow-inner">
                <BookOpen className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                Ushbu sinfga hali fanlar kiritilmagan
              </h4>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
                Bittalab kiritib o'tirmasdan <strong>"⚡ Standart Rejani Yuklash"</strong> tugmasini
                bosing yoki <strong>"+ Fan Qo'shish"</strong> tugmasi orqali fanlar katalogidan tanlang.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleLoadStandardTemplate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{targetClass.grade}-sinf Standart O'quv Rejasini Yuklash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Fanlar Katalogidan Tanlash</span>
                </button>
              </div>
            </div>
          ) : viewMode === "LIST" ? (
            <div className="space-y-2.5">
              {/* Filter pills: Barcha fanlar / Ustoz tayinlanmagan / Tayinlangan */}
              <div className="flex items-center justify-between gap-2 pb-1 border-b border-border/60 flex-wrap">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setCurriculumFilter("ALL")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      curriculumFilter === "ALL"
                        ? "bg-foreground text-background shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-muted-foreground"
                    }`}
                  >
                    Barcha fanlar ({groupedSubjectsList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurriculumFilter("UNASSIGNED")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      curriculumFilter === "UNASSIGNED"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100"
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>⚠️ Ustoz tayinlanmagan ({unassignedTeachersCount})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurriculumFilter("ASSIGNED")}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      curriculumFilter === "ASSIGNED"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>🟢 Ustoz tayinlangan ({assignedTeachersCount})</span>
                  </button>
                </div>

                <div className="text-xs font-bold text-muted-foreground shrink-0 hidden sm:block">
                  Ustoz bilan ta'minlanganlik:{" "}
                  <span className={unassignedTeachersCount === 0 ? "text-emerald-600 font-extrabold" : "text-amber-600 font-extrabold"}>
                    {fulfillmentPercent}%
                  </span>
                </div>
              </div>

              <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-1.5 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-4">Fan nomi va turi</div>
                <div className="col-span-5">Dars beruvchi o'qituvchi(lar)</div>
                <div className="col-span-2 text-center">Haftalik soat</div>
                <div className="col-span-1 text-center">O'chirish</div>
              </div>

              {visibleGroupedList.length === 0 ? (
                <div className="py-8 text-center text-xs text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border">
                  {curriculumFilter === "UNASSIGNED"
                    ? "🎉 Barcha fanlarga o'qituvchi tayinlangan!"
                    : "Fan topilmadi"}
                </div>
              ) : (
                visibleGroupedList.map((group) => (
                  <CurriculumSubjectRow
                    key={group.subjectId}
                    group={group}
                    targetClass={targetClass}
                    allSubjects={allSubjects}
                    subjectMap={subjectMap}
                    availableTeachers={availableTeachers}
                    allClasses={allClasses}
                    onUpdateSubjectId={handleUpdateSubjectId}
                    onToggleSplitGroup={handleToggleSplitGroup}
                    onUpdateGroupTeacher={handleUpdateGroupTeacher}
                    onStepHours={handleStepSubjectHours}
                    onSetPresetHours={handleSetSubjectPresetHours}
                    onRemove={handleRemoveSubjectBySubjectId}
                  />
                ))
              )}
            </div>
          ) : (
            <CurriculumWeeklyGrid
              daysCount={daysCount}
              dayNames={dayNames}
              totalWeeklyHours={totalWeeklyHours}
              weeklyDistribution={weeklyDistribution}
            />
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <CurriculumModalFooter
          subjectsCount={subjectsList.length}
          academicHours={academicHours}
          homeroomHours={homeroomHours}
          totalWeeklyHours={totalWeeklyHours}
          onClose={onClose}
          onSave={handleSave}
        />
      </div>

      {/* ── INTERACTIVE SUBJECT CATALOG DRAWER ─────────────────────────── */}
      <CurriculumCatalogDrawer
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        targetClass={targetClass}
        catalogSearch={catalogSearch}
        setCatalogSearch={setCatalogSearch}
        catalogCategory={catalogCategory}
        setCatalogCategory={setCatalogCategory}
        filteredCatalogSubjects={filteredCatalogSubjects}
        subjectsList={subjectsList}
        selectedCatalogSubjectIds={selectedCatalogSubjectIds}
        onToggleCatalogSubject={handleToggleCatalogSubject}
        onStepCatalogHours={handleStepCatalogHours}
        onAddSelectedFromCatalog={handleAddSelectedFromCatalog}
        allTeachers={allTeachers}
      />

      {/* ── CONFIRM CLEAR MODAL ────────────────────────────────────────── */}
      <ConfirmActionModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={handleConfirmClear}
        title="O'quv rejasini tozalash"
        description="Haqiqatan ham ushbu sinfning barcha fanlar yuklamasini tozalamoqchimisiz?"
        confirmText="Ha, tozalansin"
        cancelText="Bekor qilish"
        variant="danger"
      />

      {/* ── TOAST NOTIFICATION ─────────────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1000] px-4 py-3 rounded-2xl shadow-xl bg-slate-900 text-white text-xs font-bold transition-all animate-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
