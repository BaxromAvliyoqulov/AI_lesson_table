"use client";

import React from "react";
import Link from "next/link";
import { Branch } from "@/types";
import {
  GraduationCap,
  Users,
  Building2,
  Sparkles,
  Save,
  ArrowLeft,
  FileSpreadsheet,
} from "lucide-react";

export type ViewMode = "BY_CLASS" | "BY_TEACHER" | "MATRIX";

interface TarifficationHeaderProps {
  schoolName: string;
  totalSchoolHours: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedBranchId: string;
  onBranchChange: (branchId: string) => void;
  stageFilter: "ALL" | "PRIMARY" | "HIGH";
  onStageFilterChange: (stage: "ALL" | "PRIMARY" | "HIGH") => void;
  branches: Branch[];
  totalClassesCount: number;
  onSave: () => void;
  onSaveAndGenerate: () => void;
  onMassLoadStandard: () => void;
  isGenerating?: boolean;
}

export const TarifficationHeader: React.FC<TarifficationHeaderProps> = ({
  schoolName,
  totalSchoolHours,
  viewMode,
  onViewModeChange,
  selectedBranchId,
  onBranchChange,
  stageFilter,
  onStageFilterChange,
  branches,
  totalClassesCount,
  onSave,
  onSaveAndGenerate,
  onMassLoadStandard,
  isGenerating = false,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Dars Jadvaliga Qaytish</span>
          </Link>

          <div className="h-5 w-px bg-slate-700 hidden sm:block" />

          <div>
            <h1 className="text-sm sm:text-base font-black flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-600 text-white">
                <GraduationCap className="w-4 h-4" />
              </span>
              <span>O&apos;quv Rejasi &amp; Tarifikatsiya Konsoli</span>
            </h1>
            <p className="text-[11px] text-slate-400">
              {schoolName} • Jami: <strong className="text-white">{totalSchoolHours} soat</strong> dars yuklamasi
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4 text-emerald-400" />
            <span>Saqlash</span>
          </button>

          <button
            type="button"
            onClick={onSaveAndGenerate}
            disabled={isGenerating}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>{isGenerating ? "Generatsiya qilinmoqda..." : "Saqlash & AI Jadval Tuzish"}</span>
          </button>
        </div>
      </div>

      {/* Sub-Header: Mode Switcher & Global Filters */}
      <div className="bg-slate-950/80 border-t border-slate-800 px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* 3 xil View Mode Tablari */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onViewModeChange("BY_CLASS")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === "BY_CLASS"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>1. Sinf Bo&apos;yicha (Oson)</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("BY_TEACHER")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === "BY_TEACHER"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. O&apos;qituvchi Bo&apos;yicha</span>
            </button>

            <button
              type="button"
              onClick={() => onViewModeChange("MATRIX")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                viewMode === "MATRIX"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>3. Katta Matritsa (Excel)</span>
            </button>
          </div>

          {/* Bino va Bosqich filtrlari */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bino */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => onBranchChange(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option value="ALL">🏛️ Barcha Binolar ({totalClassesCount} ta sinf)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name.replace(/\s*\(?boshlang['`ʻ]?ich\)?/gi, "").trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* Bosqich */}
            <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => onStageFilterChange("ALL")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  stageFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Barchasi
              </button>
              <button
                type="button"
                onClick={() => onStageFilterChange("PRIMARY")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  stageFilter === "PRIMARY" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Boshlang&apos;ich (1-4)
              </button>
              <button
                type="button"
                onClick={() => onStageFilterChange("HIGH")}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  stageFilter === "HIGH" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                Yuqori (5-11)
              </button>
            </div>

            {/* 1-Click Mass Load */}
            <button
              type="button"
              onClick={onMassLoadStandard}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              title="SanPiN me'yoridagi davlat standart o'quv rejasini barcha tanlangan sinflarga yuklash"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Standart Rejani Barchaga Yuklash</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
