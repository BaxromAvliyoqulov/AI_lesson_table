import React from "react";
import { SchoolClass, Teacher } from "@/types";
import { X, Layers, Calendar, UserCheck, AlertTriangle } from "lucide-react";

interface CurriculumModalHeaderProps {
  targetClass: SchoolClass;
  is5DayWeek: boolean;
  teacherMap: Map<string, Teacher>;
  viewMode: "LIST" | "WEEKLY_GRID";
  setViewMode: (mode: "LIST" | "WEEKLY_GRID") => void;
  subjectsCount: number;
  totalWeeklyHours: number;
  recommendedHours: number;
  academicHours: number;
  homeroomHours: number;
  unassignedTeachersCount: number;
  isOverloaded: boolean;
  loadPercent: number;
  maxSanPiNHours: number;
  onClose: () => void;
}

export const CurriculumModalHeader: React.FC<CurriculumModalHeaderProps> = ({
  targetClass,
  is5DayWeek,
  teacherMap,
  viewMode,
  setViewMode,
  subjectsCount,
  totalWeeklyHours,
  recommendedHours,
  academicHours,
  homeroomHours,
  unassignedTeachersCount,
  isOverloaded,
  loadPercent,
  maxSanPiNHours,
  onClose,
}) => {
  return (
    <>
      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-border/80 bg-muted/30 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-black text-base shrink-0 shadow-inner border border-primary/20">
            {targetClass.name}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-foreground text-sm sm:text-base tracking-tight truncate">
                {targetClass.name} sinfi — O'quv Rejasi va Fan Soatlari
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-primary/10 text-primary border border-primary/25 shrink-0">
                {targetClass.grade}-sinf ({is5DayWeek ? "5 kunlik" : "6 kunlik"})
              </span>
              {targetClass.homeroomTeacherId && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 shrink-0 flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Rahbar: {teacherMap.get(targetClass.homeroomTeacherId)?.fullName}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              Haftalik dars taqsimoti, fanlar hajmi va mutaxassis o'qituvchilar biriktirilishi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-3">
          {/* View Mode Switcher */}
          <div className="hidden md:flex items-center bg-muted/80 p-1 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "LIST"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Fanlar ro'yxati ({subjectsCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("WEEKLY_GRID")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === "WEEKLY_GRID"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Haftalik jadval simulyatsiyasi</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── REAL-TIME PROGRESS & SANPIN HEALTH BAR ───────────────────────── */}
      <div className="px-5 sm:px-7 py-3 bg-muted/20 border-b border-border/60 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-foreground text-sm">
                  {totalWeeklyHours} soat
                </span>
                <span className="text-muted-foreground">/ me'yor: ~{recommendedHours} soat</span>
                <span className="text-[11px] font-semibold text-muted-foreground">
                  ({academicHours} st fanlar + {homeroomHours} st Kelajak soati)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {unassignedTeachersCount > 0 && (
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{unassignedTeachersCount} ta fanga o'qituvchi tayinlanmagan</span>
                  </span>
                )}
                <span
                  className={`font-black text-xs px-2.5 py-0.5 rounded-full border ${
                    isOverloaded
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                      : loadPercent >= 80
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  }`}
                >
                  {isOverloaded
                    ? `⚠️ SanPiN me'yoridan ortiq (max ${maxSanPiNHours} st)`
                    : loadPercent >= 80
                    ? "🟢 Yuklama me'yorda"
                    : "🟡 Yuklama to'liq emas"}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex border border-border/40">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isOverloaded
                    ? "bg-linear-to-r from-amber-500 to-rose-500"
                    : loadPercent >= 80
                    ? "bg-linear-to-r from-emerald-500 to-teal-500"
                    : "bg-linear-to-r from-amber-400 to-amber-500"
                }`}
                style={{ width: `${Math.min(100, (totalWeeklyHours / recommendedHours) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
