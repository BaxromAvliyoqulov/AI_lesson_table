"use client";

import React from "react";
import {
  Building2,
  Clock,
  Sun,
  Sunset,
  GraduationCap,
  Sparkles,
  ArrowRightLeft,
  Check,
  ArrowRight,
} from "lucide-react";
import { TeacherScheduleFieldsProps } from "./types";

export const TeacherScheduleFields: React.FC<TeacherScheduleFieldsProps> = ({
  branches,
  selectedBranches,
  toggleBranch,
  setSelectedBranches,
  shifts,
  selectedShifts,
  setSelectedShifts,
  teachingStages,
  setTeachingStages,
  isManualTeachingStagesOverride,
  setIsManualTeachingStagesOverride,
  classes,
  homeroomClassId,
  editingTeacher,
  onOpenWorkload,
  travelPolicy,
  setTravelPolicy,
  hasMultipleBranches,
}) => {
  const filteredScopeClasses = classes.filter((c) => {
    if (c.id === homeroomClassId) return true;
    if (teachingStages === "PRIMARY" && c.grade > 4) return false;
    if (teachingStages === "HIGH" && c.grade < 5) return false;
    if (selectedBranches.length > 0 && !selectedBranches.includes(c.branchId)) return false;
    return true;
  });

  return (
    <>
      {/* ── 1. BINOLAR TANLOVI (FILIALLAR) ─────────────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            Dars o&apos;tadigan binolari (Filiallar)
          </span>
          <span className="text-[11px] text-muted-foreground font-normal">
            {selectedBranches.length} ta bino tanlandi
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          {branches.map((b) => {
            const isSelected = selectedBranches.includes(b.id);
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleBranch(b.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-600/30"
                    : "bg-card border-border hover:border-slate-300 text-muted-foreground"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                    isSelected ? "bg-blue-600 text-white" : "border border-slate-300 bg-white dark:bg-slate-800"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
                <span>{b.name}</span>
              </button>
            );
          })}

          {branches.length > 1 && (
            <button
              type="button"
              onClick={() => setSelectedBranches(branches.map((b) => b.id))}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
            >
              🌐 Ikkala binoda ham
            </button>
          )}
        </div>
      </div>

      {/* ── 2. SMENALAR TANLOVI (1-smena, 2-smena) ───────────────────────── */}
      <div>
        <label className="block text-xs font-bold text-foreground mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Dars o&apos;tadigan smenalari
          </span>
          <span className="text-[11px] text-muted-foreground font-normal">
            {selectedShifts.length === (shifts.length || 2) ? "Barcha smenalarda" : "Tanlangan smenalarda"}
          </span>
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedShifts(shifts.length > 0 ? [shifts[0].id] : ["s39_1"])}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedShifts.length === 1 && selectedShifts[0] === (shifts[0]?.id || "s39_1")
                ? "bg-amber-50 dark:bg-amber-950/40 border-amber-600 text-amber-900 dark:text-amber-300 shadow-sm ring-1 ring-amber-600/30"
                : "bg-card border-border hover:border-slate-300 text-muted-foreground"
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" />
            <span>☀️ 1-Smena (Ertalabki)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedShifts(shifts.length > 1 ? [shifts[1].id] : ["s39_2"])}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedShifts.length === 1 && selectedShifts[0] === (shifts[1]?.id || "s39_2")
                ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 text-indigo-900 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-600/30"
                : "bg-card border-border hover:border-slate-300 text-muted-foreground"
            }`}
          >
            <Sunset className="w-4 h-4 text-indigo-500" />
            <span>🌤️ 2-Smena (Tushdan keyin)</span>
          </button>

          <button
            type="button"
            onClick={() =>
              setSelectedShifts(shifts.length > 0 ? shifts.map((s) => s.id) : ["s39_1", "s39_2"])
            }
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedShifts.length > 1 || (shifts.length === 0 && selectedShifts.length === 2)
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-600/30"
                : "bg-card border-border hover:border-slate-300 text-muted-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>🔄 Har ikkala smenada ham</span>
          </button>
        </div>
      </div>

      {/* ── 3. SINFLAR TOIFASI (BOSQICHLAR) ─────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
            <span>Dars beradigan sinflari (Toifasi)</span>
          </label>
          {!isManualTeachingStagesOverride && (
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              ⚡ Avtomatik aniqlangan
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              setTeachingStages("PRIMARY");
              setIsManualTeachingStagesOverride(true);
            }}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              teachingStages === "PRIMARY"
                ? "bg-teal-50 dark:bg-teal-950/40 border-teal-600 text-teal-900 dark:text-teal-300 shadow-sm ring-1 ring-teal-600/30"
                : "bg-card border-border hover:border-slate-300 text-muted-foreground"
            }`}
          >
            <span>🧒 Boshlang&apos;ich (1-4)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTeachingStages("HIGH");
              setIsManualTeachingStagesOverride(true);
            }}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              teachingStages === "HIGH"
                ? "bg-purple-50 dark:bg-purple-950/40 border-purple-600 text-purple-900 dark:text-purple-300 shadow-sm ring-1 ring-purple-600/30"
                : "bg-card border-border hover:border-slate-300 text-muted-foreground"
            }`}
          >
            <span>🧑‍🎓 Katta (5-11)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTeachingStages("BOTH");
              setIsManualTeachingStagesOverride(true);
            }}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              teachingStages === "BOTH"
                ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-900 dark:text-blue-300 shadow-sm ring-1 ring-blue-600/30"
                : "bg-card border-border hover:border-slate-300 text-muted-foreground"
            }`}
          >
            <span>🌟 Hammasi (1-11)</span>
          </button>
        </div>

        {/* Aqlli Sinflar Qamrovi (Smart Class Scope Preview) */}
        {classes.length > 0 && (
          <div className="mt-2.5 p-3 rounded-2xl bg-muted/40 border border-border/70 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Toifaga mos sinflar doirasi ({filteredScopeClasses.length} ta sinf)</span>
              </span>

              {editingTeacher && onOpenWorkload && (
                <button
                  type="button"
                  onClick={() => onOpenWorkload(editingTeacher)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Ushbu o'qituvchiga aniq sinflarni va dars soatlarini biriktirish"
                >
                  <span>🎯 Sinflarga soat biriktirish (Dars taqsimoti)</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              💡 Bu ro&apos;yxat — tanlangan toifa (
              <strong>
                {teachingStages === "PRIMARY"
                  ? "Boshlang'ich 1-4"
                  : teachingStages === "HIGH"
                  ? "Katta 5-11"
                  : "Hammasi 1-11"}
              </strong>
              ) va bino bo&apos;yicha ustoz dars o&apos;tishi mumkin bo&apos;lgan sinflar qamrovidir (umumiy ko&apos;rinish). Aniq qaysi sinfga necha soat dars o&apos;tishini belgilash uchun yuqoridagi{" "}
              <strong>&quot;Sinflarga soat biriktirish (Dars taqsimoti)&quot;</strong> tugmasidan yoki sinf ustiga bosishdan foydalaniladi.
            </p>

            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pt-1">
              {filteredScopeClasses.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    if (editingTeacher && onOpenWorkload) {
                      onOpenWorkload(editingTeacher);
                    }
                  }}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-card border border-border hover:border-primary/50 hover:bg-primary/10 text-foreground shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title={`${c.name} sinfiga dars soatlarini biriktirish uchun Dars taqsimotini ochish`}
                >
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 4. BINO VA SMENA LOGISTIKASI (Agar 2 ta binoda dars bersa) ───── */}
      {hasMultipleBranches && (
        <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-2 flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
            Filial va Asosiy Bino o&apos;rtasida harakatlanish qoidasi:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setTravelPolicy("BY_SHIFT")}
              className={`p-2.5 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                travelPolicy === "BY_SHIFT"
                  ? "bg-card border-amber-600 text-foreground font-bold shadow-sm ring-1 ring-amber-600/40"
                  : "bg-card/50 border-amber-200/80 dark:border-amber-800/50 text-muted-foreground hover:bg-card"
              }`}
            >
              <div className="font-extrabold flex items-center gap-1">
                <span>🏢➡️🏫 Smenalar bo&apos;yicha</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                1-smena Asosiyda, 2-smena Filialda
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTravelPolicy("BY_DAY")}
              className={`p-2.5 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                travelPolicy === "BY_DAY"
                  ? "bg-card border-amber-600 text-foreground font-bold shadow-sm ring-1 ring-amber-600/40"
                  : "bg-card/50 border-amber-200/80 dark:border-amber-800/50 text-muted-foreground hover:bg-card"
              }`}
            >
              <div className="font-extrabold flex items-center gap-1">
                <span>📅 Kunlar bo&apos;yicha</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                Kunlik bloklar (Dush/Chor Asosiy...)
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTravelPolicy("ALTERNATING_DAYS")}
              className={`p-2.5 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                travelPolicy === "ALTERNATING_DAYS"
                  ? "bg-card border-amber-600 text-foreground font-bold shadow-sm ring-1 ring-amber-600/40"
                  : "bg-card/50 border-amber-200/80 dark:border-amber-800/50 text-muted-foreground hover:bg-card"
              }`}
            >
              <div className="font-extrabold flex items-center gap-1">
                <span>🔄 1 kun Asosiy, 1 kun Filial</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                Kunma-kun navbatlashuv (1 kun/1 kun)
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTravelPolicy("FLEXIBLE_BUFFER")}
              className={`p-2.5 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                travelPolicy === "FLEXIBLE_BUFFER"
                  ? "bg-card border-amber-600 text-foreground font-bold shadow-sm ring-1 ring-amber-600/40"
                  : "bg-card/50 border-amber-200/80 dark:border-amber-800/50 text-muted-foreground hover:bg-card"
              }`}
            >
              <div className="font-extrabold flex items-center gap-1">
                <span>⏳ Yo&apos;l darchasi bilan</span>
              </div>
              <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                AI o&apos;rtada 1 soat oraliq qoldiradi
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
