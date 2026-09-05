import React from "react";
import { FilterScope, ShiftFilterType } from "./types";
import {
  Building2,
  CheckCircle2,
  Sparkles,
  Loader2,
  ZoomIn,
  ZoomOut,
  Settings,
  FileSpreadsheet,
  Printer,
  Sun,
  Sunset,
} from "lucide-react";

interface Official39FiltersProps {
  filterScope: FilterScope;
  onFilterScopeChange: (scope: FilterScope) => void;
  shiftFilter?: ShiftFilterType;
  onShiftFilterChange?: (shift: ShiftFilterType) => void;
  conflictsCount: number;
  isFixingConflicts: boolean;
  onAutoFixConflicts: () => void;
  zoomLevel: number;
  onZoomChange?: (zoom: number) => void;
  onOpenRequisites: () => void;
  onExportExcel?: () => void;
  onPrint: () => void;
  lockedClassesCount?: number;
  onLockPrimaryClasses?: () => void;
  onLockAllClasses?: () => void;
}

export const Official39Filters: React.FC<Official39FiltersProps> = ({
  filterScope,
  onFilterScopeChange,
  shiftFilter = "ALL",
  onShiftFilterChange,
  conflictsCount,
  isFixingConflicts,
  onAutoFixConflicts,
  zoomLevel,
  onZoomChange,
  onOpenRequisites,
  onExportExcel,
  onPrint,
  lockedClassesCount = 0,
  onLockPrimaryClasses,
  onLockAllClasses,
}) => {
  const isBranch = filterScope.startsWith("BRANCH");
  const isAll = filterScope === "ALL";
  const isMain = filterScope.startsWith("MAIN");

  const [isExportDropdownOpen, setIsExportDropdownOpen] = React.useState(false);

  return (
    <div className="no-print mb-4 p-2.5 sm:p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
      {/* Chap: Bino va Bosqich Ixcham Segment Filtrlari */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* 1. Bino Tanlash (Segmented Bar) */}
        <div className="flex items-center gap-0.5 bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold shadow-inner">
          <button
            type="button"
            onClick={() => onFilterScopeChange("MAIN_ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
              isMain
                ? "bg-white text-indigo-700 shadow-sm font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
            title="Asosiy maktab binosi (barcha asosiy sinflar)"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>🏢 Asosiy Bino</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterScopeChange("BRANCH_ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
              isBranch
                ? "bg-white text-amber-700 shadow-sm font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
            title="Filial binosi (barcha filial sinflari)"
          >
            <span>🏫 Filial</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterScopeChange("ALL")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
              isAll
                ? "bg-white text-purple-700 shadow-sm font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
            }`}
            title="Butun maktab: asosiy bino va barcha filiallar"
          >
            <span>🏛️ Butun Maktab</span>
          </button>
        </div>

        {/* 2. Bosqich Tanlash (Faqat bino tanlanganda) */}
        {!isAll && (
          <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200 text-xs font-bold shadow-sm">
            <button
              type="button"
              onClick={() => onFilterScopeChange(isBranch ? "BRANCH_ALL" : "MAIN_ALL")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
                filterScope === "MAIN_ALL" || filterScope === "BRANCH_ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              Barcha Sinflar
            </button>
            <button
              type="button"
              onClick={() => onFilterScopeChange(isBranch ? "BRANCH_PRIMARY" : "MAIN_PRIMARY")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
                filterScope === "MAIN_PRIMARY" || filterScope === "BRANCH_PRIMARY"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              👦 Boshlang'ich (1-4)
            </button>
            <button
              type="button"
              onClick={() => onFilterScopeChange(isBranch ? "BRANCH_HIGH" : "MAIN_HIGH")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer text-[11px] ${
                filterScope === "MAIN_HIGH" || filterScope === "BRANCH_HIGH"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              🧑 Yuqori ({isBranch ? "5-7" : "5-11"})
            </button>
          </div>
        )}

        {/* 2.5. Smena Tanlash (Abetgacha / Abetdan keyin) */}
        {onShiftFilterChange && (
          <div className="flex items-center gap-0.5 bg-slate-200/80 p-0.5 rounded-xl text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => onShiftFilterChange("ALL")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                shiftFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
              title="Barcha smenalardagi sinflar"
            >
              <span>Barcha smenalar</span>
            </button>
            <button
              type="button"
              onClick={() => onShiftFilterChange("SHIFT_1")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                shiftFilter === "SHIFT_1"
                  ? "bg-white text-amber-700 shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
              title="1-smena: Ertalabki darslar (Abetgacha / 08:00 - 13:00)"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>☀️ Abetgacha</span>
            </button>
            <button
              type="button"
              onClick={() => onShiftFilterChange("SHIFT_2")}
              className={`px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px] ${
                shiftFilter === "SHIFT_2"
                  ? "bg-white text-indigo-700 shadow-sm font-extrabold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
              }`}
              title="2-smena: Tushdan keyingi darslar (Abetdan keyin / 13:00 - 18:00)"
            >
              <Sunset className="w-3.5 h-3.5 text-indigo-500" />
              <span>🌤️ Abetdan keyin</span>
            </button>
          </div>
        )}

        {/* 3. 🔒 Qulflash Boshqaruvi */}
        <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-slate-200 shadow-sm">
          <button
            type="button"
            onClick={onLockPrimaryClasses}
            className="px-2 py-1.5 rounded-lg text-[11px] font-extrabold text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1 cursor-pointer"
            title="1-4 Boshlang'ich sinflarni qulflash / ochish"
          >
            <span>🔒 1-4 Boshlang'ich</span>
          </button>
          <button
            type="button"
            onClick={onLockAllClasses}
            className={`px-2 py-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1 cursor-pointer ${
              lockedClassesCount > 0
                ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "text-slate-700 hover:bg-slate-100"
            }`}
            title="Barcha sinflarni qulflash yoki ochish"
          >
            <span>{lockedClassesCount > 0 ? `🔒 ${lockedClassesCount}` : "🔓 Ochiq"}</span>
          </button>
        </div>
      </div>

      {/* O'ng: AI Ziddiyat, Zoom, Rekvizitlar va Tezkor Eksport */}
      <div className="flex items-center gap-1.5 flex-wrap self-end md:self-auto">
        {/* AI Patrul & Ziddiyatlarni tuzatish tugmasi */}
        <div suppressHydrationWarning className="inline-flex items-center">
          {conflictsCount > 0 ? (
            <button
              type="button"
              onClick={onAutoFixConflicts}
              disabled={isFixingConflicts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer transition-all"
              title="Ziddiyatlarni AI algoritmi orqali avtomatik to'g'rilash"
            >
              {isFixingConflicts ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
              )}
              <span>
                {isFixingConflicts
                  ? "To'g'rilanmoqda..."
                  : `⚡ AI To'g'rilash (${Math.round(conflictsCount / 2)} ta ziddiyat)`}
              </span>
            </button>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>0 Ziddiyat &bull; Toza</span>
            </div>
          )}
        </div>

        {/* Zoom Boshqaruvi */}
        <div className="flex items-center gap-0.5 rounded-xl bg-white border border-slate-200 p-0.5 shadow-sm" suppressHydrationWarning>
          <button
            type="button"
            onClick={() => onZoomChange && onZoomChange(Math.max(50, zoomLevel - 10))}
            disabled={zoomLevel <= 50}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
            title="Kichraytirish (-10%)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onZoomChange && onZoomChange(100)}
            className="px-1.5 text-xs font-bold tabular-nums text-slate-700 hover:text-blue-600 cursor-pointer"
            title="100% ga qaytarish"
            suppressHydrationWarning
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            onClick={() => onZoomChange && onZoomChange(Math.min(150, zoomLevel + 10))}
            disabled={zoomLevel >= 150}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
            title="Kattalashtirish (+10%)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rekvizitlar (Direktor/Zauch sozlamalari) */}
        <button
          onClick={onOpenRequisites}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-sm cursor-pointer transition-colors"
          title="Direktor, Zauch va maktab rekvizitlarini tahrirlash"
        >
          <Settings className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Rekvizitlar</span>
        </button>

        {/* Tezkor Eksport & Chop Birlashtirilgan Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
            title="Excel eksport va chop etish"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Eksport / Chop</span>
          </button>

          {isExportDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsExportDropdownOpen(false)}
              />
              <div className="absolute right-0 top-10 z-50 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in fade-in slide-in-from-top-2 text-slate-800">
                {onExportExcel && (
                  <button
                    onClick={() => {
                      onExportExcel();
                      setIsExportDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 transition-colors text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Excel Yuklab Olish (A3)</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    onPrint();
                    setIsExportDropdownOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 transition-colors text-left"
                >
                  <Printer className="w-4 h-4 text-blue-600" />
                  <span>Chop Etish (Print / PDF)</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
