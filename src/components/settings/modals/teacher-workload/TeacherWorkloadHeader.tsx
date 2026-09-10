import React from "react";
import { Teacher } from "@/types";
import { X, Clock, Zap, Plus } from "lucide-react";

interface TeacherWorkloadHeaderProps {
  teacher: Teacher;
  isOverloaded: boolean;
  totalAssignedHours: number;
  capacity: number;
  remainingHours: number;
  totalHomeroomHours: number;
  isBatchOpen: boolean;
  setIsBatchOpen: (open: boolean) => void;
  onAddAssignment: () => void;
  onClose: () => void;
}

export const TeacherWorkloadHeader: React.FC<TeacherWorkloadHeaderProps> = ({
  teacher,
  isOverloaded,
  totalAssignedHours,
  capacity,
  remainingHours,
  totalHomeroomHours,
  isBatchOpen,
  setIsBatchOpen,
  onAddAssignment,
  onClose,
}) => {
  return (
    <>
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
            {teacher.displayNumber ? `№${teacher.displayNumber}` : teacher.fullName.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2 truncate">
              <span>{teacher.fullName} — Dars Soatlari Taqsimoti</span>
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              Ushbu o&apos;qituvchiga sinflarni 1-bosishda biriktirish yoki guruhlarga bo&apos;lib o&apos;tishni belgilash
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── LIVE CAPACITY STATUS BAR ────────────────────────────────────── */}
      <div className="px-6 py-3 bg-muted/40 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 text-xs">
          <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-muted-foreground font-medium">Haftalik stavka yuklamasi:</span>
          <span
            className={`font-black px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 ${
              isOverloaded
                ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                : totalAssignedHours === capacity
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
            }`}
          >
            <span>
              {totalAssignedHours} / {capacity} soat stavka
            </span>
            <span className="text-[10px] font-normal opacity-80">
              {remainingHours > 0
                ? `(${remainingHours} soat bo'sh)`
                : remainingHours === 0
                ? "(Optimal stavka • 100%)"
                : `(+${Math.abs(remainingHours)} soat ortiqcha)`}
            </span>
          </span>

          {totalHomeroomHours > 0 && (
            <span className="font-bold px-2.5 py-1 rounded-xl text-xs bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
              <span>👤 +{totalHomeroomHours} soat sinf rahbarligi</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsBatchOpen(!isBatchOpen)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isBatchOpen
                ? "bg-indigo-500/15 text-indigo-600 border border-indigo-500/30"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isBatchOpen ? "Tezkor panelni yopish" : "⚡ Tezkor sinf tanlash"}</span>
          </button>

          <button
            type="button"
            onClick={onAddAssignment}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Sinf biriktirish</span>
          </button>
        </div>
      </div>
    </>
  );
};
