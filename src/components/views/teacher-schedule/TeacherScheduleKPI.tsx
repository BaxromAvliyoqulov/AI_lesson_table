import React from "react";
import { SchoolClass } from "@/types";
import { Activity, Sun, Moon, Coffee, School, ShieldCheck, AlertCircle } from "lucide-react";

interface TeacherScheduleKPIProps {
  scheduledCount: number;
  capacity: number;
  subjectHours: number;
  homeroomHours: number;
  loadPercentage: number;
  isOverloaded: boolean;
  isOptimal: boolean;
  shift1Count: number;
  shift2Count: number;
  totalGapsCount: number;
  taughtClasses: SchoolClass[];
  methodDayViolations: number;
  activeMethodDayName: string | null;
  shiftFilter: "ALL" | "SHIFT_1" | "SHIFT_2";
  setShiftFilter: (f: "ALL" | "SHIFT_1" | "SHIFT_2") => void;
  onSelectClass?: (classId: string) => void;
}

export const TeacherScheduleKPI: React.FC<TeacherScheduleKPIProps> = ({
  scheduledCount,
  capacity,
  subjectHours,
  homeroomHours,
  loadPercentage,
  isOverloaded,
  isOptimal,
  shift1Count,
  shift2Count,
  totalGapsCount,
  taughtClasses,
  methodDayViolations,
  activeMethodDayName,
  shiftFilter,
  setShiftFilter,
  onSelectClass,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 print:hidden">
      {/* Card 1: JAMI HAFTALIK YUKLAMA */}
      <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            <span>Jami Yuklama</span>
          </span>
          <span
            className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
              isOverloaded
                ? "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                : isOptimal
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
            }`}
          >
            {isOverloaded ? `+${scheduledCount - capacity} st ortiq` : isOptimal ? "Normada" : "Kam"}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          {homeroomHours > 0 ? (
            <div className="flex items-baseline gap-1 flex-wrap">
              <span className="text-2xl font-black text-foreground">{subjectHours}</span>
              <span
                className="text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1 rounded border border-indigo-500/20"
                title={`${homeroomHours} soat Kelajak soati (Sinf rahbarligi)`}
              >
                +{homeroomHours}
              </span>
              <span className="text-xs font-semibold text-muted-foreground ml-1">
                / {capacity} st <span className="text-[10px] font-bold text-foreground">({scheduledCount} st)</span>
              </span>
            </div>
          ) : (
            <>
              <span className="text-2xl font-black text-foreground">{scheduledCount}</span>
              <span className="text-xs font-semibold text-muted-foreground">/ {capacity} soat</span>
            </>
          )}
        </div>
        {homeroomHours > 0 ? (
          <div className="mt-2 text-[9.5px] font-bold text-muted-foreground flex items-center gap-1 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <span>{subjectHours} st fan + {homeroomHours} st Kelajak soati</span>
          </div>
        ) : (
          <div className="mt-2 w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isOverloaded ? "bg-rose-500" : isOptimal ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, loadPercentage)}%` }}
            />
          </div>
        )}
      </div>

      {/* Card 2: ☀️ ABETGACHA (1-SMENA) */}
      <div
        onClick={() => setShiftFilter(shiftFilter === "SHIFT_1" ? "ALL" : "SHIFT_1")}
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
          shiftFilter === "SHIFT_1"
            ? "bg-amber-500/10 border-amber-500/50 shadow-xs ring-2 ring-amber-500/20"
            : "bg-card border-border/80 hover:border-amber-500/40 shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Abetgacha (1-sm)</span>
          </span>
          <span className="text-[9px] font-bold text-muted-foreground">08:00 - 13:00</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {shift1Count}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            soat ({scheduledCount > 0 ? Math.round((shift1Count / scheduledCount) * 100) : 0}%)
          </span>
        </div>
        <div className="mt-1 text-[10px] font-bold text-muted-foreground truncate">
          {shift1Count > 0 ? "Ertalabki guruhlar" : "Dars mavjud emas"}
        </div>
      </div>

      {/* Card 3: 🌤️ ABETDAN KEYIN (2-SMENA) */}
      <div
        onClick={() => setShiftFilter(shiftFilter === "SHIFT_2" ? "ALL" : "SHIFT_2")}
        className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
          shiftFilter === "SHIFT_2"
            ? "bg-indigo-500/10 border-indigo-500/50 shadow-xs ring-2 ring-indigo-500/20"
            : "bg-card border-border/80 hover:border-indigo-500/40 shadow-xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            <span>Abetdan keyin (2-sm)</span>
          </span>
          <span className="text-[9px] font-bold text-muted-foreground">13:00 - 18:00</span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {shift2Count}
          </span>
          <span className="text-xs font-semibold text-muted-foreground">
            soat ({scheduledCount > 0 ? Math.round((shift2Count / scheduledCount) * 100) : 0}%)
          </span>
        </div>
        <div className="mt-1 text-[10px] font-bold text-muted-foreground truncate">
          {shift2Count > 0 ? "Tushdan keyingi guruhlar" : "Dars mavjud emas"}
        </div>
      </div>

      {/* Card 4: DARCHALAR (OYNALAR) AUDITI */}
      <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-teal-500" />
            <span>Darchalar (Oyna)</span>
          </span>
          <span
            className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
              totalGapsCount === 0
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
            }`}
          >
            {totalGapsCount === 0 ? "Ideal jadval" : "Darcha bor"}
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-foreground">{totalGapsCount}</span>
          <span className="text-xs font-semibold text-muted-foreground">ta darcha</span>
        </div>
        <div className="mt-1 text-[10px] font-bold text-muted-foreground">
          {totalGapsCount === 0
            ? "🟢 Bo'shliqlar yo'q, kompakt"
            : `⚠️ Haftasiga ${totalGapsCount} ta oraliq bo'shliq`}
        </div>
      </div>

      {/* Card 5: O'QITILAYOTGAN SINFLAR */}
      <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] font-bold flex items-center gap-1.5">
            <School className="w-3.5 h-3.5 text-blue-500" />
            <span>O&apos;qitiladigan Sinflar</span>
          </span>
          <span className="text-[9px] font-extrabold text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
            {taughtClasses.length} ta sinf
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1 flex-wrap max-h-12 overflow-y-auto">
          {taughtClasses.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelectClass?.(c.id)}
              className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border/60 transition-colors cursor-pointer"
              title={`${c.name} dars jadvaliga o'tish`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="mt-1 text-[9.5px] font-bold text-muted-foreground truncate">
          {taughtClasses.length > 0 ? "Barcha biriktirilgan sinflar" : "Sinf biriktirilmagan"}
        </div>
      </div>

      {/* Card 6: METOD KUNI VA STATUS */}
      <div
        className={`p-3.5 rounded-2xl border shadow-xs flex flex-col justify-between ${
          methodDayViolations > 0
            ? "bg-rose-500/10 border-rose-500/40"
            : activeMethodDayName
            ? "bg-emerald-500/10 border-emerald-500/40"
            : "bg-card border-border/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rasmiy Metod Kuni</span>
          </span>
          <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
            MMTV
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 uppercase">
            {activeMethodDayName || "Belgilanmagan"}
          </span>
        </div>
        <div className="mt-1 text-[10px] font-bold">
          {methodDayViolations > 0 ? (
            <span className="text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>⚠️ {methodDayViolations} ta dars tushgan!</span>
            </span>
          ) : activeMethodDayName ? (
            <span className="text-emerald-700 dark:text-emerald-400">
              ✓ Darslardan to&apos;liq ozod
            </span>
          ) : (
            <span className="text-muted-foreground">Sozlamalarda kiritilmagan</span>
          )}
        </div>
      </div>
    </div>
  );
};
