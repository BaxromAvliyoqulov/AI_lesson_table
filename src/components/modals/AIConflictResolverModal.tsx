"use client";

import React, { useMemo } from "react";
import { Lesson, SchoolClass, Subject, Teacher } from "@/types";
import {
  generateConflictResolutionPlan,
  ConflictSolutionOption,
} from "@/lib/solver/conflict-solver-engine";
import {
  Sparkles,
  AlertTriangle,
  X,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Clock,
  UserCheck,
  RefreshCw,
  Trash2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { WEEKDAY_NAMES } from "@/lib/solver/schedule-conflict-detector";

interface AIConflictResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflictLesson: Lesson | null;
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  allLessons: Lesson[];
  onApplySolution: (updatedLessons: Lesson[], toastMsg: string) => void;
}

export const AIConflictResolverModal: React.FC<AIConflictResolverModalProps> = ({
  isOpen,
  onClose,
  conflictLesson,
  classes,
  teachers,
  subjects,
  allLessons,
  onApplySolution,
}) => {
  if (!isOpen || !conflictLesson) return null;

  const plan = useMemo(() => {
    return generateConflictResolutionPlan({
      targetLesson: conflictLesson,
      classes,
      teachers,
      subjects,
      allLessons,
    });
  }, [conflictLesson, classes, teachers, subjects, allLessons]);

  const { cls, subject, teacher, cause, solutions } = plan;
  const dayName = WEEKDAY_NAMES[conflictLesson.dayOfWeek] || `${conflictLesson.dayOfWeek}-kun`;

  // Yechimni amalda qo'llash
  const handleExecuteSolution = (solution: ConflictSolutionOption) => {
    let updated = [...allLessons];
    let msg = "";

    if (solution.type === "RELOCATE" && solution.actionData.targetDay && solution.actionData.targetPeriod) {
      updated = updated.map((l) =>
        l.id === conflictLesson.id
          ? {
              ...l,
              dayOfWeek: solution.actionData.targetDay!,
              periodNumber: solution.actionData.targetPeriod!,
            }
          : l
      );
      msg = `✅ Dars ${WEEKDAY_NAMES[solution.actionData.targetDay]}, ${solution.actionData.targetPeriod}-soatga muvaffaqiyatli ko'chirildi! Ziddiyat bartaraf etildi.`;
    } else if (solution.type === "SWAP" && solution.actionData.swapWithLessonId) {
      const partner = allLessons.find((l) => l.id === solution.actionData.swapWithLessonId);
      if (partner) {
        updated = updated.map((l) => {
          if (l.id === conflictLesson.id) {
            return { ...l, dayOfWeek: partner.dayOfWeek, periodNumber: partner.periodNumber };
          }
          if (l.id === partner.id) {
            return { ...l, dayOfWeek: conflictLesson.dayOfWeek, periodNumber: conflictLesson.periodNumber };
          }
          return l;
        });
        msg = `✅ Darslar o'rni muvaffaqiyatli almashtirildi! Yangi ziddiyatsiz tartib o'rnatildi.`;
      }
    } else if (solution.type === "SUBSTITUTE_TEACHER" && solution.actionData.newTeacherId) {
      const newT = teachers.find((t) => t.id === solution.actionData.newTeacherId);
      updated = updated.map((l) =>
        l.id === conflictLesson.id ? { ...l, teacherId: solution.actionData.newTeacherId! } : l
      );
      msg = `✅ Dars ${newT?.fullName || "yangi o'qituvchi"}ga muvaffaqiyatli topshirildi!`;
    } else if (solution.type === "REMOVE") {
      updated = updated.filter((l) => l.id !== conflictLesson.id);
      msg = `🗑️ Dars jadval katagidan bo'shatildi.`;
    }

    onApplySolution(updated, msg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-3xl border border-border/80 bg-card text-card-foreground p-6 shadow-2xl space-y-5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-border/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight flex items-center gap-1.5">
                  <span>AI Dars Ziddiyati Maslahatchisi</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 border border-rose-500/30">
                  Ziddiyat aniqlandi
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                <span className="font-bold text-foreground">{cls.name} sinfi</span> &bull; {dayName}, {conflictLesson.periodNumber}-soat &bull; <span className="font-bold text-foreground">{subject?.name || "Fan"}</span> ({teacher?.fullName || "O'qituvchi"})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* 🛑 ZIDDIYAT ASOSIY SABABI (ROOT CAUSE) */}
          <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-black text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>Ziddiyat Sababi: {cause.title}</span>
            </div>
            <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
              {cause.explanation}
            </p>
            {cause.collidingLessons.length > 0 && (
              <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/40 flex flex-wrap gap-2 text-[11px]">
                <span className="text-rose-700 dark:text-rose-300 font-bold">To'qnashgan sinflar:</span>
                {cause.collidingClasses.map((c) => (
                  <span
                    key={c.id}
                    className="px-2 py-0.5 rounded-md bg-white dark:bg-rose-900/40 font-black text-rose-800 dark:text-rose-100 border border-rose-300 dark:border-rose-800"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 💡 AI TAVSIYA ETADIGAN KAFOLATLI YECHIMLAR (ZERO-RIPPLE SOLUTIONS) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5 text-xs font-black text-foreground">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>AI Tavsiya Qilayotgan Kafolatlangan Yechimlar:</span>
              </div>
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Zero-Ripple: boshqa joyda ziddiyat keltirib chiqarmaydi
              </span>
            </div>

            <div className="space-y-2.5">
              {solutions.map((sol, index) => {
                const isEmerald = sol.badgeColor === "emerald";
                const isBlue = sol.badgeColor === "blue";
                const isIndigo = sol.badgeColor === "indigo";
                const isRose = sol.badgeColor === "rose";

                return (
                  <div
                    key={sol.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isEmerald
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400"
                        : isBlue
                        ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 hover:border-blue-400"
                        : isIndigo
                        ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/50 hover:border-indigo-400"
                        : "bg-muted/40 border-border/80 hover:border-border"
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-5 h-5 rounded-full bg-foreground/10 text-foreground font-black text-[10px] flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <h4 className="font-bold text-xs text-foreground truncate">
                          {sol.title}
                        </h4>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            isEmerald
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200"
                              : isBlue
                              ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200"
                              : isIndigo
                              ? "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/50 dark:text-indigo-200"
                              : "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/50 dark:text-rose-200"
                          }`}
                        >
                          {sol.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed pl-7">
                        {sol.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleExecuteSolution(sol)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0 ${
                        isEmerald
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : isBlue
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : isIndigo
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                          : "bg-muted hover:bg-rose-600 hover:text-white text-muted-foreground border border-border"
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{sol.type === "REMOVE" ? "O'chirish" : "Qo'llash"}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground shrink-0">
          <span className="flex items-center gap-1 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Har bir yechim CSP Dvigateli tomonidan oldindan tekshirilgan
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-muted font-bold text-xs transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
