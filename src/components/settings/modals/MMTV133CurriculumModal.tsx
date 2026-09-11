"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Sparkles,
  Download,
  Search,
  CheckCircle2,
  Users,
  GraduationCap,
  ShieldCheck,
  Languages,
  BookOpen,
  HelpCircle,
  FileSpreadsheet,
} from "lucide-react";
import { SchoolClass, Subject, Teacher } from "@/types";
import {
  MMTV133Row,
  MMTV_133_UZBEK_MEDIUM,
  MMTV_133_RUSSIAN_MEDIUM,
} from "@/lib/curriculum-templates";
import { exportMMTV133ToExcel } from "@/lib/excel/mmtv-excel-export";

interface MMTV133CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  onApplyStandard: (targetLanguage?: "ALL" | "UZBEK" | "RUSSIAN") => Promise<void> | void;
  isApplying?: boolean;
}

export const MMTV133CurriculumModal: React.FC<MMTV133CurriculumModalProps> = ({
  isOpen,
  onClose,
  classes,
  subjects,
  teachers,
  onApplyStandard,
  isApplying = false,
}) => {
  const [activeLanguage, setActiveLanguage] = useState<"UZBEK" | "RUSSIAN">("UZBEK");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDirection, setSelectedDirection] = useState<string>("ALL");
  const [targetScope, setTargetScope] = useState<"ALL" | "UZBEK" | "RUSSIAN">("ALL");
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const rawRows: MMTV133Row[] = useMemo(() => {
    return activeLanguage === "UZBEK" ? MMTV_133_UZBEK_MEDIUM : MMTV_133_RUSSIAN_MEDIUM;
  }, [activeLanguage]);

  const directions = useMemo(() => {
    const set = new Set<string>();
    rawRows.forEach((r) => set.add(r.direction));
    return Array.from(set);
  }, [rawRows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return rawRows.filter((r) => {
      if (selectedDirection !== "ALL" && r.direction !== selectedDirection) return false;
      if (q) {
        return (
          r.subjectName.toLowerCase().includes(q) ||
          r.direction.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [rawRows, searchQuery, selectedDirection]);

  // Jami rasmiy soatlar har bir sinf bo'yicha
  const gradeTotals = useMemo(() => {
    const totals: number[] = [];
    for (let g = 0; g < 11; g++) {
      const sum = rawRows.reduce((acc, row) => acc + (row.hoursByGrade[g] || 0), 0);
      totals.push(sum);
    }
    return totals;
  }, [rawRows]);

  const handleDownloadExcel = async () => {
    try {
      setIsExportingExcel(true);
      await exportMMTV133ToExcel(activeLanguage);
    } catch (e) {
      console.error("Excel eksport xatosi:", e);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleApply = async () => {
    await onApplyStandard(targetScope);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[1400px] max-h-[95vh] flex flex-col rounded-3xl bg-card border border-border shadow-2xl overflow-hidden">
        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/90">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black shadow-inner shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-foreground">
                  MMTV 133-sonli Rasmiy Tayanch O&apos;quv Rejasi
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 uppercase tracking-wide">
                  2026-2027 O&apos;quv Yili Standarti
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                O&apos;zbekiston Respublikasi umumta&apos;lim maktablari uchun tasdiqlangan rasmiy dars soatlari matritsasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Top Controls: Language Switch, Search & Direction Pills */}
        <div className="flex flex-col gap-3 px-6 py-3 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Language Switch */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-background border border-border shadow-xs">
              <button
                type="button"
                onClick={() => setActiveLanguage("UZBEK")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeLanguage === "UZBEK"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span>🇺🇿 1-Ilova: O&apos;zbek tili ta&apos;limi</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                  {MMTV_133_UZBEK_MEDIUM.length} fan
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveLanguage("RUSSIAN")}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  activeLanguage === "RUSSIAN"
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                }`}
              >
                <span>🇷🇺 2-Ilova: Rus tili ta&apos;limi</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[10px]">
                  {MMTV_133_RUSSIAN_MEDIUM.length} fan
                </span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Fan nomi yoki yo'nalish..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Direction Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-muted-foreground mr-1">Yo&apos;nalish:</span>
            <button
              onClick={() => setSelectedDirection("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedDirection === "ALL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-background border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              Barchasi ({rawRows.length})
            </button>
            {directions.map((dir) => (
              <button
                key={dir}
                onClick={() => setSelectedDirection(dir)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedDirection === dir
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {dir} ({rawRows.filter((r) => r.direction === dir).length})
              </button>
            ))}
          </div>
        </div>

        {/* 3. Interactive Excel Matrix Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="border border-border rounded-2xl overflow-hidden shadow-xs bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-muted/80 text-foreground border-b border-border sticky top-0 z-20 backdrop-blur-sm">
                    <th className="py-3 px-3 font-extrabold text-center w-12 border-r border-border/70">
                      №
                    </th>
                    <th className="py-3 px-4 font-extrabold min-w-[200px] border-r border-border/70 sticky left-0 bg-muted/95 z-30 shadow-xs">
                      Fan nomi
                    </th>
                    <th className="py-3 px-3 font-bold text-muted-foreground min-w-[130px] border-r border-border/70">
                      Yo&apos;nalishi
                    </th>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((grade) => (
                      <th
                        key={grade}
                        className="py-3 px-2 font-black text-center min-w-[62px] border-r border-border/70 bg-primary/5 text-primary"
                      >
                        {grade}-sinf
                      </th>
                    ))}
                    <th className="py-3 px-3 font-extrabold text-center min-w-[150px]">
                      Guruhlash (25+)
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border/60">
                  {filteredRows.map((row, idx) => {
                    return (
                      <tr
                        key={row.subjectName}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="py-2.5 px-3 text-center text-muted-foreground font-mono text-[11px] border-r border-border/60">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 font-bold text-foreground border-r border-border/60 sticky left-0 bg-card group-hover:bg-muted/30 z-10">
                          <div className="flex items-center gap-1.5">
                            <span>{row.subjectName}</span>
                            {row.subjectName.includes("Kelajak") && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 font-extrabold">
                                Dush 1-soat
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-muted-foreground border-r border-border/60">
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 font-medium">
                            {row.direction}
                          </span>
                        </td>

                        {row.hoursByGrade.map((hours, gIdx) => {
                          const grade = gIdx + 1;
                          return (
                            <td
                              key={grade}
                              className="py-2.5 px-2 text-center border-r border-border/60"
                            >
                              {hours > 0 ? (
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-extrabold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                                  {hours}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/30 font-bold">—</span>
                              )}
                            </td>
                          );
                        })}

                        <td className="py-2.5 px-3 text-center">
                          {row.canSplit ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                              <Users className="w-3 h-3" />
                              <span>
                                {row.splitMinGrade}-{row.splitMaxGrade || 11}-sinf
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/60">
                              Bo&apos;linmaydi
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Sticky Table Footer: Total Official Hours */}
                <tfoot>
                  <tr className="bg-amber-500/10 text-foreground border-t-2 border-amber-500/40 sticky bottom-0 z-20 font-black">
                    <td className="py-3 px-3 text-center border-r border-border/70">
                      Σ
                    </td>
                    <td className="py-3 px-4 border-r border-border/70 sticky left-0 bg-amber-500/10 z-10 text-amber-950 dark:text-amber-200">
                      JAMI HAFTALIK SOAT (Me&apos;yor)
                    </td>
                    <td className="py-3 px-3 text-xs text-muted-foreground border-r border-border/70">
                      Davlat Limiti
                    </td>
                    {gradeTotals.map((tot, gIdx) => (
                      <td
                        key={gIdx}
                        className="py-3 px-2 text-center border-r border-border/70 text-amber-950 dark:text-amber-200"
                      >
                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-xs font-black bg-amber-500/25 border border-amber-500/40">
                          {tot}s
                        </span>
                      </td>
                    ))}
                    <td className="py-3 px-3 text-center text-xs text-amber-950 dark:text-amber-200 font-bold">
                      100% Qonuniy
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* 4. Guarantee Panel & Application Controls */}
        <div className="px-6 py-4 border-t border-border bg-card/95 flex flex-col gap-3">
          {/* Ironclad Rule 9 Guarantee Card */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-extrabold text-emerald-950 dark:text-emerald-200">
                  Oltin Qoida 9 Himoyasi (Darslar daxlsizligi & Faqat qo&apos;lda guruhlash):
                </h5>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 leading-relaxed">
                  Mavjud darslar o&apos;chib ketmaydi. Siz biriktirgan ustozlar va qo&apos;lda ajratgan guruhlar (1-2 gr) to&apos;liq saqlanadi. Shablon faqat yetishmayotgan fanlarni yaxlit (WHOLE) qilib to&apos;ldiradi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Barcha {classes.length} ta sinf 100% himoyalangan</span>
            </div>
          </div>

          {/* Bottom Action Buttons */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            {/* Target Scope Switch */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-muted-foreground">Tatbiq etish:</span>
              <div className="inline-flex rounded-xl p-0.5 bg-muted/60 border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setTargetScope("ALL")}
                  className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                    targetScope === "ALL"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ⚡ Barcha {classes.length} ta sinfga
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScope("UZBEK")}
                  className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                    targetScope === "UZBEK"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🇺🇿 O&apos;zbek sinflariga
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScope("RUSSIAN")}
                  className={`px-3 py-1.5 rounded-lg font-extrabold transition-all cursor-pointer ${
                    targetScope === "RUSSIAN"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  🇷🇺 Rus sinflariga
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 self-end sm:self-auto">
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={isExportingExcel}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold border border-border bg-background hover:bg-muted text-foreground transition-all cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>{isExportingExcel ? "Tayyorlanmoqda..." : "Excel yuklab olish"}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
              >
                Bekor qilish
              </button>

              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl text-xs font-extrabold bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-amber-950 hover:text-white shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 animate-pulse" />
                <span>
                  {isApplying ? "Yuklanmoqda..." : "⚡ 1-Bosishda Sinflarga Yuklash"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
