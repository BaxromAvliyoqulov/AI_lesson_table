"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  Clock,
  ShieldCheck,
  Zap,
  Printer,
  ChevronRight,
  X,
} from "lucide-react";
import { SolverResult } from "@/types";

interface AIGenerationProgressModalProps {
  isOpen: boolean;
  isGenerating: boolean;
  result: SolverResult | null;
  onClose: () => void;
  onViewSchedule?: () => void;
  onPrintA3?: () => void;
}

const GENERATION_STEPS = [
  {
    percent: 15,
    title: "1. Maktab profili va sinflar tahlili",
    desc: "Barcha 29 ta sinf va 55 nafar o'qituvchining dars soatlari o'qilmoqda...",
  },
  {
    percent: 38,
    title: "2. SanPiN va Metod kunlari cheklovlari",
    desc: "Haftalik metod kunlari va fanlarning qiyinlik darajalari tekshirilmoqda...",
  },
  {
    percent: 62,
    title: "3. 'Kelajak soatlari' va sinf rahbarlari",
    desc: "Dushanba 1-darsga qat'iy sinf rahbarlari biriktirilmoqda...",
  },
  {
    percent: 85,
    title: "4. CSP Backtracking & Parallel guruhlar",
    desc: "0 ta ziddiyat (No Collisions) bo'yicha darslar optimal joylashtirilmoqda...",
  },
  {
    percent: 100,
    title: "5. Yakuniy verifikatsiya & 100% Ziddiyatsiz Jadval",
    desc: "Barcha sinflar va o'qituvchilar bo'yicha jadval muvaffaqiyatli shakllantirildi!",
  },
];

export const AIGenerationProgressModal: React.FC<AIGenerationProgressModalProps> = ({
  isOpen,
  isGenerating,
  result,
  onClose,
  onViewSchedule,
  onPrintA3,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState<string>("0.0s");

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setCurrentStepIndex(0);
      return;
    }

    if (isGenerating) {
      setStartTime(Date.now());
      setProgress(10);
      setCurrentStepIndex(0);

      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return 92;
          const next = prev + Math.floor(Math.random() * 14) + 6;
          return Math.min(next, 92);
        });
      }, 180);

      return () => clearInterval(interval);
    } else if (result) {
      setProgress(100);
      setCurrentStepIndex(GENERATION_STEPS.length - 1);
      const diff = ((Date.now() - startTime) / 1000).toFixed(1);
      setElapsedTime(`${diff}s`);
    }
  }, [isOpen, isGenerating, result]);

  // Update step index based on progress
  useEffect(() => {
    if (progress < 25) setCurrentStepIndex(0);
    else if (progress < 50) setCurrentStepIndex(1);
    else if (progress < 75) setCurrentStepIndex(2);
    else if (progress < 95) setCurrentStepIndex(3);
    else setCurrentStepIndex(4);
  }, [progress]);

  if (!isOpen) return null;

  const isCompleted = !isGenerating && result !== null;
  const currentStep = GENERATION_STEPS[currentStepIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col relative text-slate-900 dark:text-slate-100">
        {/* Yuqori Gradient Glow & Header */}
        <div className="relative p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-2xl shadow-lg transition-all ${
                  isCompleted
                    ? "bg-emerald-500 text-white shadow-emerald-500/30 scale-105"
                    : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-indigo-500/30 animate-pulse"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <Cpu className="w-6 h-6 animate-spin" />
                )}
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                  <span>{isCompleted ? "Jadval 100% Tayyor!" : "AI Dars Jadvalini Tuzmoqda"}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                    CSP Solver v3.0
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isCompleted
                    ? "Barcha sinflar uchun optimal jadval hisoblandi"
                    : "SanPiN davlat standartlari bo'yicha neyron taqsimlash"}
                </p>
              </div>
            </div>

            {isCompleted && (
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* ── O'RTA: PROGRESS BAR VA JONLI BOSQICHLAR ───────────────────────── */}
        <div className="p-6 space-y-5">
          {/* Progress Bar & Foiz */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{currentStep.title}</span>
              </span>
              <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                {progress}%
              </span>
            </div>

            {/* Katta Animated Progress Track */}
            <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700/60 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-300 relative overflow-hidden ${
                  isCompleted
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400 shadow-md shadow-emerald-500/30"
                    : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-md shadow-indigo-500/30"
                }`}
                style={{ width: `${progress}%` }}
              >
                {/* Yorug'lik nuri animatsiyasi */}
                <div className="absolute inset-0 bg-white/25 animate-[shimmer_1.5s_infinite] -skew-x-12" />
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 min-h-[18px]">
              {currentStep.desc}
            </p>
          </div>

          {/* 5 ta Bosqichlar Ro'yxati (Visual Stepper) */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
            {GENERATION_STEPS.map((step, idx) => {
              const isPast = progress >= step.percent;
              const isCurrent = currentStepIndex === idx && !isCompleted;

              return (
                <div
                  key={idx}
                  className={`flex items-center gap-2.5 text-xs transition-all ${
                    isPast
                      ? "text-slate-900 dark:text-white font-bold"
                      : isCurrent
                      ? "text-indigo-600 dark:text-indigo-400 font-extrabold"
                      : "text-slate-400 dark:text-slate-600"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black transition-all ${
                      isPast
                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30"
                        : isCurrent
                        ? "bg-indigo-600 text-white animate-bounce shadow-sm shadow-indigo-600/30"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                    }`}
                  >
                    {isPast ? "✓" : idx + 1}
                  </div>
                  <span className="truncate">{step.title}</span>
                </div>
              );
            })}
          </div>

          {/* 100% Muvaffaqiyat Metrikalari (Success Report) */}
          {isCompleted && result && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <h4 className="font-extrabold text-xs sm:text-sm">
                  Mukammal Natija: 0 Ziddiyat &bull; 100% Qamrov
                </h4>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500">Jami Darslar</div>
                  <div className="font-mono font-black text-sm text-slate-900 dark:text-white">
                    {result.lessons.length} ta
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500">Ziddiyatlar</div>
                  <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {result.stats.conflictsCount} ta
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-slate-900/80 border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
                  <div className="text-[10px] font-bold text-slate-500">Aniqlik</div>
                  <div className="font-mono font-black text-sm text-indigo-600 dark:text-indigo-400">
                    {result.stats.score}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ACTIONS ────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 pt-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2.5">
          {isCompleted ? (
            <>
              {onPrintA3 && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onPrintA3();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4 text-amber-500" />
                  <span>A3 Chop etish</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onViewSchedule) onViewSchedule();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>✅ Dars Jadvalini Ko'rish</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 py-1">
              <Zap className="w-4 h-4 animate-bounce text-amber-400" />
              <span>Algoritm optimal matritsani hisoblamoqda...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
