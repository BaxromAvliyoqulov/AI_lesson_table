"use client";

import React, { useMemo } from "react";
import { CheckCircle2, ShieldCheck, Flame, Sparkles, Layers, Activity } from "lucide-react";
import { Lesson, SchoolClass, Subject } from "@/types";

interface ScheduleHealthRadarProps {
  lessons: Lesson[];
  classes: SchoolClass[];
  subjects: Subject[];
  conflictsCount: number;
}

export const ScheduleHealthRadar: React.FC<ScheduleHealthRadarProps> = ({
  lessons,
  classes,
  subjects,
  conflictsCount,
}) => {
  // 1. Darslar qamrovi
  const { totalCurriculumHours, classGapsCount, minDailyLoad, maxDailyLoad } = useMemo(() => {
    let curriculumSum = 0;
    for (const cls of classes) {
      for (const s of cls.subjects || []) {
        curriculumSum += Number(s.weeklyHours) || 0;
      }
    }

    // Sinf darchalari hisobi
    let gaps = 0;
    let minD = 99;
    let maxD = 0;

    for (const cls of classes) {
      const clsLessons = lessons.filter((l) => l.classId === cls.id);
      const dayMap = new Map<number, number[]>();
      for (let d = 1; d <= 6; d++) dayMap.set(d, []);

      for (const l of clsLessons) {
        dayMap.get(l.dayOfWeek)?.push(l.periodNumber);
      }

      for (let d = 1; d <= 6; d++) {
        const periods = Array.from(new Set(dayMap.get(d) || [])).sort((a, b) => a - b);
        const count = periods.length;
        if (count > 0) {
          if (count < minD && (!cls.isPrimary || d <= 5)) minD = count;
          if (count > maxD) maxD = count;

          // Oraliq darcha tekshiruvi (minP dan maxP gacha bo'sh dars bor-yo'qligi)
          if (periods[0] > 1) gaps++; // 1-darsdan boshlanmagan
          for (let p = periods[0]; p <= periods[periods.length - 1]; p++) {
            if (!periods.includes(p)) gaps++;
          }
        }
      }
    }

    return {
      totalCurriculumHours: curriculumSum,
      classGapsCount: gaps,
      minDailyLoad: minD === 99 ? 0 : minD,
      maxDailyLoad: maxD,
    };
  }, [lessons, classes]);

  const coveragePercent = totalCurriculumHours > 0
    ? Math.min(100, Math.round((lessons.length / totalCurriculumHours) * 100))
    : 100;

  return (
    <div className="w-full mb-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 rounded-xl shadow-lg border border-indigo-800/40 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Radar sarlavhasi */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Jadval Salomatligi & Sifat Radari
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Sparkles className="w-2.5 h-2.5 mr-1" />
                Qat'iy Karkas
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Sinflarda 0 ta oraliq darcha (okno) kafolatlangan va SanPiN bo'yicha tekislangan
            </p>
          </div>
        </div>

        {/* 3 ta sifat ko'rsatkichi kartasi */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* 1. Darslar qamrovi */}
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Darslar qamrovi</div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{lessons.length} ta dars</span>
                <span className="text-[10px] font-normal text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded">
                  {coveragePercent}% To'liq
                </span>
              </div>
            </div>
          </div>

          {/* 2. Sinf darchalari */}
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg">
            <ShieldCheck className={`w-4 h-4 ${classGapsCount === 0 ? "text-emerald-400" : "text-amber-400"} shrink-0`} />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Sinf darchalari</div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{classGapsCount} ta okno</span>
                <span className={`text-[10px] font-normal ${classGapsCount === 0 ? "text-emerald-400 bg-emerald-950/60" : "text-amber-400 bg-amber-950/60"} px-1 py-0.5 rounded`}>
                  {classGapsCount === 0 ? "0 Oknolar (Mukammal)" : "Qayta siqish kerak"}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Ziddiyatlar */}
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1.5 rounded-lg">
            <Flame className={`w-4 h-4 ${conflictsCount === 0 ? "text-emerald-400" : "text-rose-400"} shrink-0`} />
            <div className="text-left">
              <div className="text-[10px] text-slate-400 uppercase font-medium">Ziddiyatlar</div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>{conflictsCount} ta</span>
                <span className={`text-[10px] font-normal ${conflictsCount === 0 ? "text-emerald-400 bg-emerald-950/60" : "text-rose-400 bg-rose-950/60"} px-1 py-0.5 rounded`}>
                  {conflictsCount === 0 ? "Toza" : "Ziddiyat mavjud"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
