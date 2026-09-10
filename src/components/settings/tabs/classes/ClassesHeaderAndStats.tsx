import React from "react";
import { ClassFilterType, AVAILABLE_GRADES } from "./types";
import {
  FileSpreadsheet,
  Upload,
  Sparkles,
  Search,
  Plus,
  GraduationCap,
  Users,
  Layers,
  UserCheck,
  Lock,
  AlertTriangle,
  BarChart3,
  Sun,
  Sunset,
} from "lucide-react";

interface ClassesHeaderAndStatsProps {
  search: string;
  setSearch: (s: string) => void;
  onAddClass: () => void;
  totalClassesCount: number;
  totalStudents: number;
  primaryCount: number;
  middleCount: number;
  highCount: number;
  withHomeroomCount: number;
  noHomeroomCount: number;
  lockedCount: number;
  incompleteCurriculumCount: number;
  filteredClassesCount: number;
  filterType: ClassFilterType;
  setFilterType: React.Dispatch<React.SetStateAction<ClassFilterType>>;
  selectedGrade: number | null;
  setSelectedGrade: (g: number | null) => void;
  shiftFilter: "ALL" | "SHIFT_1" | "SHIFT_2";
  setShiftFilter: (s: "ALL" | "SHIFT_1" | "SHIFT_2") => void;
  shift1Count: number;
  shift2Count: number;
  gradeCounts: Map<number, number>;
  onOpenEMaktabImport?: () => void;
  onOpenApplyStandardModal: () => void;
}

export const ClassesHeaderAndStats: React.FC<ClassesHeaderAndStatsProps> = ({
  search,
  setSearch,
  onAddClass,
  totalClassesCount,
  totalStudents,
  primaryCount,
  middleCount,
  highCount,
  withHomeroomCount,
  noHomeroomCount,
  lockedCount,
  incompleteCurriculumCount,
  filteredClassesCount,
  filterType,
  setFilterType,
  selectedGrade,
  setSelectedGrade,
  shiftFilter,
  setShiftFilter,
  shift1Count,
  shift2Count,
  gradeCounts,
  onOpenEMaktabImport,
  onOpenApplyStandardModal,
}) => {
  return (
    <>
      {/* 1. Yuqori Excel Import Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Excel & eMaktab Import</h4>
            <p className="text-xs text-muted-foreground">
              Shablonni yuklab oling, to&apos;ldiring va yuklang. Import&apos;dan oldin ma&apos;lumot ko&apos;rsatiladi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onOpenEMaktabImport && (
            <button
              type="button"
              onClick={onOpenEMaktabImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>eMaktab Excel yuklash</span>
            </button>
          )}
        </div>
      </div>

      {/* 1.1. Davlat Standart O'quv Rejasini Ommaviy Tatbiq Qilish Bar (MMTV 2026-2027) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-linear-to-r from-amber-500/10 via-primary/5 to-transparent border border-amber-500/30 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-extrabold text-foreground">
                2026-2027 Davlat Standart O&apos;quv Rejasini barcha sinflarga tatbiq qilish
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase">
                MMTV Rasmiy Standarti
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              1-11 barcha sinflarga rasmiy fanlar va haftalik dars soatlari bir bosishda avtomatik to&apos;ldiriladi. Avval belgilangan ustozlaringiz saqlanadi.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenApplyStandardModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-extrabold bg-amber-500 hover:bg-amber-600 text-amber-950 hover:text-white shadow-lg shadow-amber-500/25 transition-all cursor-pointer shrink-0 whitespace-nowrap active:scale-98"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>⚡ Barcha sinflarga tatbiq qilish</span>
        </button>
      </div>

      {/* 4. Toolbar, Status Bar va Kengaytirilgan Filtrlar */}
      <div className="flex flex-col gap-3.5 p-4 rounded-3xl bg-card border border-border shadow-xs">
        {/* Yuqori qidiruv va sinf qo'shish */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:w-80 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Sinf yoki sinf rahbari bo'yicha qidiring..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={onAddClass}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Sinf modali</span>
            </button>
          </div>
        </div>

        {/* 🌟 STATUS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">Jami sinflar</div>
              <div className="text-xs font-extrabold text-foreground">{totalClassesCount} ta sinf</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">O&apos;quvchilar</div>
              <div className="text-xs font-extrabold text-foreground">~{totalStudents} nafar</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">1-4 / 5-9 / 10-11</div>
              <div className="text-xs font-extrabold text-foreground">{primaryCount} / {middleCount} / {highCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              noHomeroomCount === 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
            }`}>
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">Sinf rahbarlari</div>
              <div className="text-xs font-extrabold text-foreground">{withHomeroomCount}/{totalClassesCount} ta</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">Qulflangan</div>
              <div className="text-xs font-extrabold text-foreground">{lockedCount} ta sinf</div>
            </div>
          </div>

          {incompleteCurriculumCount > 0 && (
            <div
              onClick={() => {
                setFilterType((prev) => (prev === "INCOMPLETE_CURRICULUM" ? "ALL" : "INCOMPLETE_CURRICULUM"));
                setSelectedGrade(null);
              }}
              className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all shadow-xs ${
                filterType === "INCOMPLETE_CURRICULUM"
                  ? "bg-amber-600 text-white border-amber-700 ring-2 ring-amber-400/50"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
              }`}
              title="Ustoz tayinlanmagan sinflarni ko'rish"
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                filterType === "INCOMPLETE_CURRICULUM" ? "bg-white/20 text-white" : "bg-amber-500 text-white"
              }`}>
                <AlertTriangle className="w-4 h-4 animate-bounce" />
              </div>
              <div className="min-w-0">
                <div className={`text-[10px] font-bold uppercase tracking-tight ${
                  filterType === "INCOMPLETE_CURRICULUM" ? "text-white/90" : "text-amber-700 dark:text-amber-400"
                }`}>
                  Ustozsiz fanlar
                </div>
                <div className="text-xs font-black">{incompleteCurriculumCount} ta sinfda!</div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">Ko&apos;rsatilmoqda</div>
              <div className="text-xs font-extrabold text-foreground">{filteredClassesCount} ta sinf</div>
            </div>
          </div>
        </div>

        {/* Filter pills: Bosqichlar va Smena filtrlari */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-2 border-t border-border/60">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => { setFilterType("ALL"); setSelectedGrade(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === "ALL" && selectedGrade === null
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              Barchasi ({totalClassesCount})
            </button>

            <button
              type="button"
              onClick={() => { setFilterType("PRIMARY"); setSelectedGrade(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === "PRIMARY" && selectedGrade === null
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              1-4 sinf ({primaryCount})
            </button>

            <button
              type="button"
              onClick={() => { setFilterType("MIDDLE"); setSelectedGrade(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === "MIDDLE" && selectedGrade === null
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              5-9 sinf ({middleCount})
            </button>

            <button
              type="button"
              onClick={() => { setFilterType("HIGH"); setSelectedGrade(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === "HIGH" && selectedGrade === null
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              10-11 sinf ({highCount})
            </button>

            {lockedCount > 0 && (
              <button
                type="button"
                onClick={() => { setFilterType("LOCKED"); setSelectedGrade(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterType === "LOCKED"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                }`}
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>🔒 Qulflanganlar ({lockedCount})</span>
              </button>
            )}

            {noHomeroomCount > 0 && (
              <button
                type="button"
                onClick={() => { setFilterType("NO_HOMEROOM"); setSelectedGrade(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterType === "NO_HOMEROOM"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>⚠️ Rahbari yo&apos;qlar ({noHomeroomCount})</span>
              </button>
            )}

            {incompleteCurriculumCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFilterType(filterType === "INCOMPLETE_CURRICULUM" ? "ALL" : "INCOMPLETE_CURRICULUM");
                  setSelectedGrade(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer whitespace-nowrap shrink-0 border shadow-xs ${
                  filterType === "INCOMPLETE_CURRICULUM"
                    ? "bg-amber-600 text-white border-amber-700 shadow-sm ring-2 ring-amber-400/40"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/80"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
                <span>⚠️ Ustoz tayinlanmagan ({incompleteCurriculumCount})</span>
              </button>
            )}
          </div>

          {/* O'ng: Smena Filtrlari */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border/70 shrink-0 self-start lg:self-auto shadow-xs">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase px-2 shrink-0">
              Smena:
            </span>
            <button
              type="button"
              onClick={() => setShiftFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                shiftFilter === "ALL"
                  ? "bg-background text-foreground shadow-xs font-extrabold border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              Barchasi ({totalClassesCount})
            </button>
            <button
              type="button"
              onClick={() => setShiftFilter("SHIFT_1")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                shiftFilter === "SHIFT_1"
                  ? "bg-amber-500 text-white shadow-xs font-extrabold"
                  : "text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              }`}
            >
              <Sun className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              <span>☀️ Abetgacha ({shift1Count})</span>
            </button>
            <button
              type="button"
              onClick={() => setShiftFilter("SHIFT_2")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                shiftFilter === "SHIFT_2"
                  ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                  : "text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              }`}
            >
              <Sunset className="w-3.5 h-3.5 shrink-0 text-indigo-200" />
              <span>🌤️ Abetdan keyin ({shift2Count})</span>
            </button>
          </div>
        </div>

        {/* 🔢 Aniq sinf parallellari mikro-filtri */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider shrink-0 mr-1">
            Sinflar:
          </span>
          {AVAILABLE_GRADES.map((g) => {
            const count = gradeCounts.get(g) || 0;
            if (count === 0) return null;
            const isSelected = selectedGrade === g;

            return (
              <button
                key={`grade_btn_${g}`}
                type="button"
                onClick={() => setSelectedGrade(isSelected ? null : g)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs scale-105"
                    : "bg-muted/40 hover:bg-muted text-foreground/80"
                }`}
                title={`${g}-sinflarni ko'rish (${count} ta)`}
              >
                <span>{g}-sinf</span>
                <span className="ml-1 opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
