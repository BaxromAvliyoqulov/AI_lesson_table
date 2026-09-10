"use client";

import React from "react";
import { formatUzPhone } from "@/lib/utils";
import { ClassSelectCombobox } from "../../shared/ClassSelectCombobox";
import {
  GraduationCap,
  Clock,
  Calendar,
  Sparkles,
  RotateCcw,
  AlertCircle,
} from "lucide-react";
import { TeacherBasicFieldsProps, WEEKDAYS } from "./types";

export const TeacherBasicFields: React.FC<TeacherBasicFieldsProps> = ({
  fullName,
  setFullName,
  phone,
  setPhone,
  homeroomClassId,
  setHomeroomClassId,
  classes,
  allTeachers,
  editingTeacher,
  weeklyCapacity,
  setWeeklyCapacity,
  maxConsecutive,
  setMaxConsecutive,
  methodDay,
  setMethodDay,
  isManualMethodDayOverride,
  setIsManualMethodDayOverride,
  autoDetectedMethodDay,
  onBranchNeeded,
}) => {
  return (
    <>
      {/* F.I.Sh va Telefon */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            F.I.SH (To&apos;liq ism) *
          </label>
          <input
            type="text"
            required
            placeholder="Masalan: Karimova Dilnoza"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Telefon raqami
          </label>
          <input
            type="text"
            placeholder="+998 (90) 123-45-67"
            value={phone}
            onChange={(e) => setPhone(formatUzPhone(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
          />
        </div>
      </div>

      {/* ── SINF RAHBARLIGI (Biriktirilgan sinf) ────────────────────────── */}
      <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/50">
        <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Sinf rahbari (Biriktirilgan sinf)
          </span>
          {homeroomClassId && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
              Sinf rahbari
            </span>
          )}
        </label>
        <ClassSelectCombobox
          value={homeroomClassId}
          onChange={(newClassId) => {
            setHomeroomClassId(newClassId);
            if (newClassId && onBranchNeeded) {
              const targetCls = classes.find((c) => c.id === newClassId);
              if (targetCls?.branchId) {
                onBranchNeeded(targetCls.branchId);
              }
            }
          }}
          classes={classes}
          teachers={allTeachers.length > 0 ? allTeachers : editingTeacher ? [editingTeacher] : []}
          placeholder="Sinf rahbari bo'lgan sinfni tanlang..."
        />
        <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300/80 mt-1.5 leading-relaxed">
          💡 Sinf rahbarligi biriktirilsa, ushbu sinfga Dushanba 1-soatdagi <strong>Kelajak soati</strong> fani va rasmiy jadval imzolari avtomatik biriktiriladi.
        </p>
      </div>

      {/* Stavka, Ketma-ket dars va Metod kuni */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            Haftalik stavka (soat)
          </label>
          <input
            type="number"
            min={1}
            max={40}
            value={weeklyCapacity}
            onChange={(e) => setWeeklyCapacity(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              className="text-xs font-semibold text-muted-foreground flex items-center gap-1"
              title="Bir kunda o'qituvchiga qo'yiladigan maksimal dars soati"
            >
              <Clock className="w-3.5 h-3.5 text-indigo-600" />
              Kuniga maks dars
            </label>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMaxConsecutive((prev) => Math.max(2, prev - 1))}
              className="w-8 h-9 rounded-xl border border-border bg-muted/40 hover:bg-muted flex items-center justify-center font-bold text-xs cursor-pointer select-none transition-colors"
              title="1 soat kamaytirish"
            >
              -
            </button>
            <input
              type="number"
              min={2}
              max={8}
              value={maxConsecutive}
              onChange={(e) => setMaxConsecutive(Math.max(2, Math.min(8, Number(e.target.value))))}
              className="w-full px-2 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-black text-center"
            />
            <button
              type="button"
              onClick={() => setMaxConsecutive((prev) => Math.min(8, prev + 1))}
              className="w-8 h-9 rounded-xl border border-border bg-muted/40 hover:bg-muted flex items-center justify-center font-bold text-xs cursor-pointer select-none transition-colors"
              title="1 soat oshirish"
            >
              +
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground block mt-1">
            1 kunda ko&apos;pi bilan (soat)
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Metod kuni
            </label>
            {autoDetectedMethodDay && !isManualMethodDayOverride && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> Fandan avto
              </span>
            )}
            {isManualMethodDayOverride && autoDetectedMethodDay && (
              <button
                type="button"
                onClick={() => {
                  setIsManualMethodDayOverride(false);
                  setMethodDay(autoDetectedMethodDay.day);
                }}
                title="Fanning rasmiy metod kuniga qaytarish"
                className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer font-medium"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Fandan avto
              </button>
            )}
          </div>
          <select
            value={methodDay}
            onChange={(e) => {
              setIsManualMethodDayOverride(true);
              setMethodDay(e.target.value === "" ? "" : Number(e.target.value));
            }}
            className={`w-full px-3 py-2 rounded-xl border text-sm cursor-pointer transition-all ${
              !isManualMethodDayOverride && autoDetectedMethodDay
                ? "border-emerald-500/60 bg-emerald-50/20 text-foreground font-semibold ring-1 ring-emerald-500/20"
                : "border-border bg-background text-foreground"
            }`}
          >
            <option value="">Metod kuni yo&apos;q</option>
            {WEEKDAYS.map((w) => {
              const isMatchOfficial = autoDetectedMethodDay?.day === w.id;
              return (
                <option key={w.id} value={w.id}>
                  {w.name} {isMatchOfficial ? `⚡ (${autoDetectedMethodDay?.subjectName} fani)` : ""}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Mantiqiy ogohlantirish (Kunlik dars soati stavkaga nisbatan yetarli bo'lishi kerak) */}
      {weeklyCapacity > 0 && maxConsecutive * 5 < weeklyCapacity && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            💡 Haftalik <strong>{weeklyCapacity} soat</strong> stavka sig&apos;ishi uchun kuniga kamida{" "}
            <strong>{Math.ceil(weeklyCapacity / 5)} soat</strong> dars belgilanishi tavsiya etiladi (5 kunlik o&apos;quv haftasida).
          </span>
        </div>
      )}
    </>
  );
};
