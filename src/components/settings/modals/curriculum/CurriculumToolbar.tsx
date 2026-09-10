import React from "react";
import { SchoolClass } from "@/types";
import { Plus, Sparkles, GraduationCap, Copy, Trash2 } from "lucide-react";

interface CurriculumToolbarProps {
  targetClass: SchoolClass;
  hasSubjects: boolean;
  copyableClasses: SchoolClass[];
  selectedCopyClassId: string;
  setSelectedCopyClassId: (id: string) => void;
  onOpenCatalog: () => void;
  onAddNewSubjectRow: () => void;
  onLoadStandardTemplate: () => void;
  onAutoAssignSpecialists: () => void;
  onApplyPrimaryHomeroomRule: () => void;
  onCopyFromOtherClass: () => void;
  onClearAll: () => void;
}

export const CurriculumToolbar: React.FC<CurriculumToolbarProps> = ({
  targetClass,
  hasSubjects,
  copyableClasses,
  selectedCopyClassId,
  setSelectedCopyClassId,
  onOpenCatalog,
  onAddNewSubjectRow,
  onLoadStandardTemplate,
  onAutoAssignSpecialists,
  onApplyPrimaryHomeroomRule,
  onCopyFromOtherClass,
  onClearAll,
}) => {
  return (
    <div className="px-5 sm:px-7 py-3 bg-muted/40 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Primary Button: Open Visual Subject Catalog Modal */}
        <button
          type="button"
          onClick={onOpenCatalog}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Fan Qo'shish (Fanlar Katalogi)</span>
        </button>

        {/* Quick Add Row Button */}
        <button
          type="button"
          onClick={onAddNewSubjectRow}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-card border border-border hover:border-primary/40 hover:bg-muted text-foreground transition-all shadow-xs cursor-pointer"
          title="Ro'yxat oxiriga bitta yangi fan qatori qo'shish"
        >
          <Plus className="w-3.5 h-3.5 text-primary" />
          <span>+ Qator qo'shish</span>
        </button>

        {/* 1-Click Davlat Standarti Shablonini Yuklash */}
        <button
          type="button"
          onClick={onLoadStandardTemplate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 transition-all shadow-xs cursor-pointer"
          title={`${targetClass.grade}-sinf uchun Davlat ta'lim standarti bo'yicha namunaviy dars soatlarini 1-bosishda avtomatik yuklash`}
        >
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
          <span>⚡ Standart Rejani Yuklash</span>
        </button>

        {/* ⚡ Bo'sh fanlarga mutaxassislarni avtomatik tayinlash */}
        <button
          type="button"
          onClick={onAutoAssignSpecialists}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/25 transition-all shadow-xs cursor-pointer"
          title="Barcha fanlarga o'z mutaxassis o'qituvchilarini to'g'rilash va avtomatik biriktirish"
        >
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>⚡ Mutaxassislarni to'g'rilash va tayinlash</span>
        </button>

        {/* Boshlang'ich sinf qoidasi (1-4-sinflar): Ona tili, O'qish, Matematika -> Sinf rahbariga */}
        {targetClass.grade <= 4 && (
          <button
            type="button"
            onClick={onApplyPrimaryHomeroomRule}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/35 hover:bg-indigo-500/25 transition-all shadow-xs cursor-pointer"
            title="Boshlang'ich sinf qoidasi: Ona tili, O'qish va Matematika (1-sinfda Alifbe) hamda Kelajak soatini sinf rahbariga biriktirish"
          >
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>🎯 Boshlang'ich qoida (Ona tili, O'qish, Matematika)</span>
          </button>
        )}

        {/* Boshqa sinfdan nusxa olish */}
        {copyableClasses.length > 0 && (
          <div className="flex items-center gap-1">
            <select
              value={selectedCopyClassId}
              onChange={(e) => setSelectedCopyClassId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-background cursor-pointer max-w-[150px] truncate font-medium"
            >
              <option value="">Sinfdan nusxa...</option>
              {copyableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.subjects?.length || 0} fan)
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onCopyFromOtherClass}
              disabled={!selectedCopyClassId}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
              title="Tanlangan sinf fanlarini ko'chirish"
            >
              <Copy className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ko'chirish</span>
            </button>
          </div>
        )}
      </div>

      {hasSubjects && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Tozalash</span>
        </button>
      )}
    </div>
  );
};
