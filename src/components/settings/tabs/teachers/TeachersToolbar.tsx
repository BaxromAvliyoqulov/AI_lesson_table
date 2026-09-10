import React from "react";
import { Subject } from "@/types";
import {
  HomeroomFilterType,
  HomeroomStageFilterType,
  WorkloadFilterType,
} from "./types";
import {
  Search,
  FileSpreadsheet,
  Loader2,
  Upload,
  Plus,
  GraduationCap,
} from "lucide-react";

interface TeachersToolbarProps {
  search: string;
  setSearch: (s: string) => void;
  subjectFilter: string;
  setSubjectFilter: (s: string) => void;
  subjects: Subject[];
  teachersCount: number;
  isExporting: boolean;
  onExportExcel: () => void;
  onOpenEMaktabImport?: () => void;
  onAddTeacher: () => void;
  homeroomFilter: HomeroomFilterType;
  setHomeroomFilter: (f: HomeroomFilterType) => void;
  homeroomStageFilter: HomeroomStageFilterType;
  setHomeroomStageFilter: (f: HomeroomStageFilterType) => void;
  workloadFilter: WorkloadFilterType;
  setWorkloadFilter: (f: WorkloadFilterType) => void;
  homeroomCount: number;
  nonHomeroomCount: number;
  optimalCount: number;
  underloadedCount: number;
  overloadedCount: number;
  primaryHrCount: number;
  middleHrCount: number;
  highHrCount: number;
}

export const TeachersToolbar: React.FC<TeachersToolbarProps> = ({
  search,
  setSearch,
  subjectFilter,
  setSubjectFilter,
  subjects,
  teachersCount,
  isExporting,
  onExportExcel,
  onOpenEMaktabImport,
  onAddTeacher,
  homeroomFilter,
  setHomeroomFilter,
  homeroomStageFilter,
  setHomeroomStageFilter,
  workloadFilter,
  setWorkloadFilter,
  homeroomCount,
  nonHomeroomCount,
  optimalCount,
  underloadedCount,
  overloadedCount,
  primaryHrCount,
  middleHrCount,
  highHrCount,
}) => {
  return (
    <div className="flex flex-col gap-3.5 p-4 rounded-3xl bg-card border border-border shadow-xs">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
        {/* Chap: Qidiruv va Fan filtri */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Ism, telefon yoki sinf bo'yicha qidiring..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer font-medium shrink-0"
          >
            <option value="ALL">Barcha fanlar ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* O'ng: Excel va Yangi o'qituvchi */}
        <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
          <button
            id="teachers-export-excel"
            onClick={onExportExcel}
            disabled={isExporting || teachersCount === 0}
            title="O'qituvchilar ro'yxatini Excel formatida yuklab olish"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                Yuklanmoqda...
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                Excel ({teachersCount})
              </>
            )}
          </button>

          {/* eMaktab Import Tugmasi */}
          {onOpenEMaktabImport && (
            <button
              type="button"
              onClick={onOpenEMaktabImport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer shrink-0"
              title="eMaktab (Kundalik) Excel faylidan o'qituvchilarni yuklash"
            >
              <Upload className="w-3.5 h-3.5 shrink-0" />
              <span>eMaktab Import</span>
            </button>
          )}

          <button
            onClick={onAddTeacher}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Yangi o&apos;qituvchi</span>
          </button>
        </div>
      </div>

      {/* ── FILTR TABLARI (Sinf Rahbarligi & Stavka Yuklamasi) ───────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60">
        {/* Sinf Rahbarligi Filtrlar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => {
              setHomeroomFilter("ALL");
              setHomeroomStageFilter("ALL_STAGES");
            }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              homeroomFilter === "ALL"
                ? "bg-foreground text-background shadow-xs font-bold"
                : "bg-muted/40 hover:bg-muted text-muted-foreground"
            }`}
          >
            <span>Barchasi</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10 font-bold">
              {teachersCount}
            </span>
          </button>

          <button
            onClick={() => setHomeroomFilter("HOMEROOM_ONLY")}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              homeroomFilter === "HOMEROOM_ONLY"
                ? "bg-indigo-600 text-white shadow-xs font-bold ring-2 ring-indigo-500/30"
                : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span>🎓 Sinf rahbarlari</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 font-bold">
              {homeroomCount}
            </span>
          </button>

          <button
            onClick={() => {
              setHomeroomFilter("NON_HOMEROOM");
              setHomeroomStageFilter("ALL_STAGES");
            }}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              homeroomFilter === "NON_HOMEROOM"
                ? "bg-slate-700 text-white shadow-xs font-bold"
                : "bg-muted/40 hover:bg-muted text-muted-foreground"
            }`}
          >
            <span>Rahbar bo&apos;lmaganlar</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10 font-bold">
              {nonHomeroomCount}
            </span>
          </button>
        </div>

        {/* Yuklama Statusi Filtrlar */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setWorkloadFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              workloadFilter === "ALL"
                ? "bg-muted text-foreground font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Yuklama: Hammasi
          </button>
          <button
            onClick={() => setWorkloadFilter("OPTIMAL")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              workloadFilter === "OPTIMAL"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30"
                : "text-muted-foreground hover:text-emerald-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>To&apos;liq ({optimalCount})</span>
          </button>
          <button
            onClick={() => setWorkloadFilter("UNDERLOADED")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              workloadFilter === "UNDERLOADED"
                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30"
                : "text-muted-foreground hover:text-amber-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Bo&apos;sh ({underloadedCount})</span>
          </button>
          <button
            onClick={() => setWorkloadFilter("OVERLOADED")}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
              workloadFilter === "OVERLOADED"
                ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/30"
                : "text-muted-foreground hover:text-rose-600"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Ortiqcha ({overloadedCount})</span>
          </button>
        </div>
      </div>

      {/* ── SINF RAHBARLARI BOSQICH SUB-FILTRLARI ───────────────────────── */}
      {homeroomFilter === "HOMEROOM_ONLY" && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 -mx-4 -mb-4 px-4 py-2.5 rounded-b-3xl animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Bosqich:</span>
            </span>

            <button
              type="button"
              onClick={() => setHomeroomStageFilter("ALL_STAGES")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                homeroomStageFilter === "ALL_STAGES"
                  ? "bg-indigo-600 text-white font-bold shadow-xs shadow-indigo-600/20"
                  : "bg-background/80 hover:bg-background text-muted-foreground border border-border/60"
              }`}
            >
              <span>Barcha rahbarlar</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 font-bold">
                {homeroomCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setHomeroomStageFilter("PRIMARY")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                homeroomStageFilter === "PRIMARY"
                  ? "bg-emerald-600 text-white font-bold shadow-xs shadow-emerald-600/20"
                  : "bg-background/80 hover:bg-background text-muted-foreground border border-border/60"
              }`}
            >
              <span>🌱 1. Boshlang&apos;ich sinflar (1-4)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 font-bold">
                {primaryHrCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setHomeroomStageFilter("MIDDLE")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                homeroomStageFilter === "MIDDLE"
                  ? "bg-blue-600 text-white font-bold shadow-xs shadow-blue-600/20"
                  : "bg-background/80 hover:bg-background text-muted-foreground border border-border/60"
              }`}
            >
              <span>📘 2. O&apos;rta sinflar (5-9)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 font-bold">
                {middleHrCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setHomeroomStageFilter("HIGH")}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                homeroomStageFilter === "HIGH"
                  ? "bg-purple-600 text-white font-bold shadow-xs shadow-purple-600/20"
                  : "bg-background/80 hover:bg-background text-muted-foreground border border-border/60"
              }`}
            >
              <span>🎓 3. Yuqori sinflar (10-11)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/20 font-bold">
                {highHrCount}
              </span>
            </button>
          </div>

          <div className="text-[11px] text-muted-foreground font-medium hidden sm:block">
            {homeroomStageFilter === "ALL_STAGES" && `Jami ${homeroomCount} ta sinf rahbari`}
            {homeroomStageFilter === "PRIMARY" && `1-4 boshlang'ich: ${primaryHrCount} nafar rahbar`}
            {homeroomStageFilter === "MIDDLE" && `5-9 o'rta maktab: ${middleHrCount} nafar rahbar`}
            {homeroomStageFilter === "HIGH" && `10-11 yuqori sinf: ${highHrCount} nafar rahbar`}
          </div>
        </div>
      )}
    </div>
  );
};
