import React from "react";
import { FilterScope } from "./types";
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
} from "lucide-react";

interface Official39FiltersProps {
  filterScope: FilterScope;
  onFilterScopeChange: (scope: FilterScope) => void;
  conflictsCount: number;
  isFixingConflicts: boolean;
  onAutoFixConflicts: () => void;
  zoomLevel: number;
  onZoomChange?: (zoom: number) => void;
  onOpenRequisites: () => void;
  onExportExcel?: () => void;
  onPrint: () => void;
}

export const Official39Filters: React.FC<Official39FiltersProps> = ({
  filterScope,
  onFilterScopeChange,
  conflictsCount,
  isFixingConflicts,
  onAutoFixConflicts,
  zoomLevel,
  onZoomChange,
  onOpenRequisites,
  onExportExcel,
  onPrint,
}) => {
  return (
    <div className="no-print mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
      {/* Chap: Asosiy Maktab va Filial Aniq Tab Filtrlari */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Aniq Dars Jadvali Ko'rinishlari Tablari */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex-wrap">
          {/* 1. Asosiy Hammasi */}
          <button
            type="button"
            onClick={() => onFilterScopeChange("MAIN_ALL")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              filterScope === "MAIN_ALL"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="1. Asosiy binodagi barcha sinflar (1-11 A, B, V)"
          >
            <span>1. 🏢 Asosiy Hammasi</span>
          </button>

          {/* 2. Asosiy Boshlang'ich */}
          <button
            type="button"
            onClick={() => onFilterScopeChange("MAIN_PRIMARY")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              filterScope === "MAIN_PRIMARY"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="2. Asosiy bino boshlang'ich sinflari (1-4 A, B, V)"
          >
            <span>2. 👦 Asosiy Boshlang'ich</span>
          </button>

          {/* 3. Asosiy Kattalar */}
          <button
            type="button"
            onClick={() => onFilterScopeChange("MAIN_HIGH")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              filterScope === "MAIN_HIGH"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="3. Asosiy bino yuqori sinflari (5-11 A, B, V)"
          >
            <span>3. 🧑 Asosiy Kattalar</span>
          </button>

          {/* 4. Filial Hammasi */}
          <button
            type="button"
            onClick={() => onFilterScopeChange("BRANCH_ALL")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              filterScope === "BRANCH_ALL"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="4. Filialdagi barcha sinflar (1-D .. 7-D)"
          >
            <span>4. 🏠 Filial Hammasi</span>
          </button>

          {/* 5. Filial Boshlang'ich */}
          <button
            type="button"
            onClick={() => onFilterScopeChange("BRANCH_PRIMARY")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              filterScope === "BRANCH_PRIMARY"
                ? "bg-teal-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="5. Filial boshlang'ich sinflari (1-D .. 4-D)"
          >
            <span>5. 👦 Filial Boshlang'ich</span>
          </button>

          {/* 6. Filial Kattalar */}
          <button
            type="button"
            onClick={() => onFilterScopeChange("BRANCH_HIGH")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              filterScope === "BRANCH_HIGH"
                ? "bg-orange-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="6. Filial yuqori sinflari (5-D .. 7-D)"
          >
            <span>6. 🧑 Filial Kattalar</span>
          </button>

          {/* 7. Hammasi */}
          <button
            type="button"
            onClick={() => onFilterScopeChange("ALL")}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
              filterScope === "ALL"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
            title="7. Butun maktab: barcha bino va filiallardagi barcha sinflar"
          >
            <span>7. 🏛️ Hammasi</span>
          </button>
        </div>
      </div>

      {/* O'ng: AI Nazorat, Zoom, Rekvizitlar, Excel va Chop etish tugmalari */}
      <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
        {/* AI Patrul & Ziddiyatlarni tuzatish tugmasi */}
        <div suppressHydrationWarning className="inline-flex items-center">
          {conflictsCount > 0 ? (
            <button
              type="button"
              onClick={onAutoFixConflicts}
              disabled={isFixingConflicts}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer transition-all"
              title="Parallel darslarni AI algoritmi orqali 0 ziddiyatgacha avtomatik qayta taqsimlash"
            >
              {isFixingConflicts ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
              )}
              <span>
                {isFixingConflicts
                  ? "AI To'g'rilamoqda..."
                  : `⚡ AI Bilan To'g'rilash (${Math.round(conflictsCount / 2)} ta ziddiyat)`}
              </span>
            </button>
          ) : (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>0 Ziddiyat &bull; AI Nazoratida</span>
            </div>
          )}
        </div>

        {/* Zoom Boshqaruvi */}
        <div className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 p-1 shadow-sm" suppressHydrationWarning>
          <button
            type="button"
            onClick={() => onZoomChange && onZoomChange(Math.max(50, zoomLevel - 10))}
            disabled={zoomLevel <= 50}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
            title="Kichraytirish (-10%)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onZoomChange && onZoomChange(100)}
            className="px-2 text-xs font-bold tabular-nums text-slate-700 hover:text-blue-600 hover:underline cursor-pointer"
            title="100% ga qaytarish"
            suppressHydrationWarning
          >
            {zoomLevel}%
          </button>
          <button
            type="button"
            onClick={() => onZoomChange && onZoomChange(Math.min(150, zoomLevel + 10))}
            disabled={zoomLevel >= 150}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
            title="Kattalashtirish (+10%)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Rekvizitlar */}
        <button
          onClick={onOpenRequisites}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-sm cursor-pointer transition-colors"
          title="Direktor, Zauch va maktab ma'lumotlarini o'zgartirish"
        >
          <Settings className="w-4 h-4 text-amber-500" />
          <span>Rekvizitlar</span>
        </button>

        {onExportExcel && (
          <button
            onClick={onExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
            title="39-maktab rasmiy A3 albom andozasidagi Excel faylini yuklab olish"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Eksport (A3 Excel)</span>
          </button>
        )}

        <button
          onClick={onPrint}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Chop etish (Print / PDF)</span>
        </button>
      </div>
    </div>
  );
};
