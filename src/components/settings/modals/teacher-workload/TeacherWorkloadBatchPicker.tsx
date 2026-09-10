import React from "react";
import { SchoolClass, Subject, Teacher } from "@/types";
import { normalizeClassName } from "@/lib/utils";
import { TeacherClassAssignment } from "./types";
import { BookOpen, Clock, Building2, GraduationCap, Zap, Check, Plus } from "lucide-react";

interface TeacherWorkloadBatchPickerProps {
  batchSubjectId: string;
  setBatchSubjectId: (id: string) => void;
  batchHours: number;
  setBatchHours: React.Dispatch<React.SetStateAction<number>>;
  teacherSubjects: Subject[];
  subjects: Subject[];
  schoolClasses: SchoolClass[];
  uniqueAssignments: { item: TeacherClassAssignment; index: number }[];
  availableBranches: { id: string; name: string }[];
  branchFilter: string;
  setBranchFilter: (f: string) => void;
  stageFilter: "ALL" | "PRIMARY" | "HIGH";
  setStageFilter: (f: "ALL" | "PRIMARY" | "HIGH") => void;
  availableParallels: string[];
  parallelFilter: string;
  setParallelFilter: (f: string) => void;
  availableGrades: number[];
  primaryClasses: SchoolClass[];
  middleClasses: SchoolClass[];
  highClasses: SchoolClass[];
  isClassMatchingFilters: (c: SchoolClass) => boolean;
  resolveCanonicalClass: (idOrName: string) => SchoolClass | undefined;
  handleToggleClassAssignment: (classId: string) => void;
  handleBulkSelectGrade: (grade: number) => void;
  defaultSubjectId: string;
}

export const TeacherWorkloadBatchPicker: React.FC<TeacherWorkloadBatchPickerProps> = ({
  batchSubjectId,
  setBatchSubjectId,
  batchHours,
  setBatchHours,
  teacherSubjects,
  subjects,
  schoolClasses,
  uniqueAssignments,
  availableBranches,
  branchFilter,
  setBranchFilter,
  stageFilter,
  setStageFilter,
  availableParallels,
  parallelFilter,
  setParallelFilter,
  availableGrades,
  primaryClasses,
  middleClasses,
  highClasses,
  isClassMatchingFilters,
  resolveCanonicalClass,
  handleToggleClassAssignment,
  handleBulkSelectGrade,
  defaultSubjectId,
}) => {
  const filteredPrimaryClasses = stageFilter === "HIGH" ? [] : primaryClasses.filter(isClassMatchingFilters);
  const filteredMiddleClasses = stageFilter === "PRIMARY" ? [] : middleClasses.filter(isClassMatchingFilters);
  const filteredHighClasses = stageFilter === "PRIMARY" ? [] : highClasses.filter(isClassMatchingFilters);
  const allFilteredClasses = [...filteredPrimaryClasses, ...filteredMiddleClasses, ...filteredHighClasses];

  return (
    <div className="bg-indigo-500/5 dark:bg-indigo-950/20 border-b border-indigo-500/20 px-6 py-3 space-y-2.5 shrink-0 max-h-[32vh] overflow-y-auto custom-scrollbar">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Fan:
            </span>
            <select
              value={batchSubjectId}
              onChange={(e) => setBatchSubjectId(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-background cursor-pointer focus:ring-2 focus:ring-indigo-500"
            >
              {teacherSubjects.length > 0 && (
                <optgroup label="⭐ O'qituvchining ixtisoslashgan fanlari:">
                  {teacherSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Barcha fanlar:">
                {subjects
                  .filter((s) => !teacherSubjects.some((ts) => ts.id === s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Standart soat:
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setBatchHours((prev) => Math.max(1, prev - 1))}
                className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-xs hover:bg-muted cursor-pointer"
              >
                -
              </button>
              <span className="px-2 font-black text-xs">{batchHours} st</span>
              <button
                type="button"
                onClick={() => setBatchHours((prev) => Math.min(12, prev + 1))}
                className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-xs hover:bg-muted cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Aqlli Filtrlash paneli: Bino, Bosqich va Harflar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1 border-t border-indigo-500/10">
          {availableBranches.length > 1 && (
            <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground font-bold px-1.5 flex items-center gap-0.5">
                <Building2 className="w-2.5 h-2.5" /> Bino:
              </span>
              <button
                type="button"
                onClick={() => setBranchFilter("ALL")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  branchFilter === "ALL"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Barchasi
              </button>
              {availableBranches.map((b) => (
                <button
                  key={`b_filter_${b.id}`}
                  type="button"
                  onClick={() => setBranchFilter(b.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    branchFilter === b.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border">
            <span className="text-[10px] text-muted-foreground font-bold px-1.5 flex items-center gap-0.5">
              <GraduationCap className="w-2.5 h-2.5" /> Toifa:
            </span>
            <button
              type="button"
              onClick={() => setStageFilter("ALL")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                stageFilter === "ALL"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Barchasi
            </button>
            <button
              type="button"
              onClick={() => setStageFilter("PRIMARY")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                stageFilter === "PRIMARY"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              🧒 1-4
            </button>
            <button
              type="button"
              onClick={() => setStageFilter("HIGH")}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                stageFilter === "HIGH"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              🧑‍🎓 5-11
            </button>
          </div>

          {availableParallels.length > 1 && (
            <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border">
              <span className="text-[10px] text-muted-foreground font-bold px-1.5">
                Harf:
              </span>
              <button
                type="button"
                onClick={() => setParallelFilter("ALL")}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  parallelFilter === "ALL"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                Barchasi
              </button>
              {availableParallels.map((letter) => (
                <button
                  key={`p_filter_${letter}`}
                  type="button"
                  onClick={() => setParallelFilter(letter)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    parallelFilter === letter
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tezkor sinf bosqichlari */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground font-semibold mr-1">Sinflar bo&apos;yicha:</span>
          {availableGrades
            .filter((g) => {
              if (stageFilter === "PRIMARY" && g > 4) return false;
              if (stageFilter === "HIGH" && g < 5) return false;
              return true;
            })
            .map((g) => {
              const gClasses = schoolClasses.filter((c) => c.grade === g && isClassMatchingFilters(c));
              if (gClasses.length === 0) return null;
              const isAll =
                gClasses.length > 0 &&
                gClasses.every((c) => {
                  const normName = normalizeClassName(c.name).toUpperCase();
                  return uniqueAssignments.some(
                    ({ item: a }) =>
                      (a.classId === c.id ||
                        resolveCanonicalClass(a.classId)?.id === c.id ||
                        (resolveCanonicalClass(a.classId) &&
                          normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                      a.subjectId === (batchSubjectId || defaultSubjectId)
                  );
                });
              return (
                <button
                  key={`bulk_grade_${g}`}
                  type="button"
                  onClick={() => handleBulkSelectGrade(g)}
                  className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                    isAll
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-background border border-border text-foreground hover:bg-muted"
                  }`}
                  title={`${g}-sinflarning barchasini tanlash / bekor qilish`}
                >
                  {g}-sinflar
                </button>
              );
            })}
        </div>
      </div>

      {/* Sinflar pill/kartochkalari */}
      <div className="space-y-2">
        {filteredMiddleClasses.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
              <span>🧑 5-9 Sinflar:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredMiddleClasses.map((c) => {
                const normName = normalizeClassName(c.name).toUpperCase();
                const isAssigned = uniqueAssignments.some(
                  ({ item: a }) =>
                    (a.classId === c.id ||
                      resolveCanonicalClass(a.classId)?.id === c.id ||
                      (resolveCanonicalClass(a.classId) &&
                        normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                    a.subjectId === (batchSubjectId || defaultSubjectId)
                );
                const assignItem = uniqueAssignments.find(
                  ({ item: a }) =>
                    (a.classId === c.id ||
                      resolveCanonicalClass(a.classId)?.id === c.id ||
                      (resolveCanonicalClass(a.classId) &&
                        normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                    a.subjectId === (batchSubjectId || defaultSubjectId)
                )?.item;
                return (
                  <button
                    key={`btn_cls_${c.id}`}
                    type="button"
                    onClick={() => handleToggleClassAssignment(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                      isAssigned
                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40"
                        : "bg-background border border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50/30"
                    }`}
                  >
                    {isAssigned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
                    <span>{c.name}</span>
                    {isAssigned && (
                      <span className="text-[10px] opacity-80 font-normal">({assignItem?.weeklyHours}s)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filteredPrimaryClasses.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
              <span>🧒 1-4 Sinflar:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredPrimaryClasses.map((c) => {
                const normName = normalizeClassName(c.name).toUpperCase();
                const isAssigned = uniqueAssignments.some(
                  ({ item: a }) =>
                    (a.classId === c.id ||
                      resolveCanonicalClass(a.classId)?.id === c.id ||
                      (resolveCanonicalClass(a.classId) &&
                        normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                    a.subjectId === (batchSubjectId || defaultSubjectId)
                );
                const assignItem = uniqueAssignments.find(
                  ({ item: a }) =>
                    (a.classId === c.id ||
                      resolveCanonicalClass(a.classId)?.id === c.id ||
                      (resolveCanonicalClass(a.classId) &&
                        normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                    a.subjectId === (batchSubjectId || defaultSubjectId)
                )?.item;
                return (
                  <button
                    key={`btn_cls_${c.id}`}
                    type="button"
                    onClick={() => handleToggleClassAssignment(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                      isAssigned
                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40"
                        : "bg-background border border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50/30"
                    }`}
                  >
                    {isAssigned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
                    <span>{c.name}</span>
                    {isAssigned && (
                      <span className="text-[10px] opacity-80 font-normal">({assignItem?.weeklyHours}s)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {filteredHighClasses.length > 0 && (
          <div>
            <div className="text-[11px] font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
              <span>🎓 10-11 Sinflar:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filteredHighClasses.map((c) => {
                const normName = normalizeClassName(c.name).toUpperCase();
                const isAssigned = uniqueAssignments.some(
                  ({ item: a }) =>
                    (a.classId === c.id ||
                      resolveCanonicalClass(a.classId)?.id === c.id ||
                      (resolveCanonicalClass(a.classId) &&
                        normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                    a.subjectId === (batchSubjectId || defaultSubjectId)
                );
                const assignItem = uniqueAssignments.find(
                  ({ item: a }) =>
                    (a.classId === c.id ||
                      resolveCanonicalClass(a.classId)?.id === c.id ||
                      (resolveCanonicalClass(a.classId) &&
                        normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                    a.subjectId === (batchSubjectId || defaultSubjectId)
                )?.item;
                return (
                  <button
                    key={`btn_cls_${c.id}`}
                    type="button"
                    onClick={() => handleToggleClassAssignment(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                      isAssigned
                        ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40"
                        : "bg-background border border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50/30"
                    }`}
                  >
                    {isAssigned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
                    <span>{c.name}</span>
                    {isAssigned && (
                      <span className="text-[10px] opacity-80 font-normal">({assignItem?.weeklyHours}s)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {allFilteredClasses.length === 0 && (
          <div className="p-4 rounded-xl bg-background/60 border border-dashed border-border text-center text-xs text-muted-foreground">
            Tanlangan parametrlar (bino/toifa/harf) bo&apos;yicha birorta ham sinf topilmadi. Filtrni o&apos;zgartirib ko&apos;ring.
          </div>
        )}
      </div>
    </div>
  );
};
