"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Teacher, Subject, SchoolClass, ClassSubject } from "@/types";
import { isSubjectSuitableForGrade } from "@/lib/curriculum-templates";
import {
  X,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  GraduationCap,
  Minus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
} from "lucide-react";

export interface TeacherClassAssignment {
  classId: string;
  subjectId: string;
  weeklyHours: number;
}

interface TeacherWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  classes: SchoolClass[];
  subjects: Subject[];
  onSave: (teacherId: string, assignments: TeacherClassAssignment[]) => void;
}

export const TeacherWorkloadModal: React.FC<TeacherWorkloadModalProps> = ({
  isOpen,
  onClose,
  teacher,
  classes,
  subjects,
  onSave,
}) => {
  const [assignments, setAssignments] = useState<TeacherClassAssignment[]>([]);
  const lastInitializedTeacherIdRef = useRef<string | null>(null);

  // Collect all existing assignments for this teacher across all classes ONLY on open or teacher change
  useEffect(() => {
    if (!isOpen || !teacher) {
      lastInitializedTeacherIdRef.current = null;
      setAssignments([]);
      return;
    }

    if (lastInitializedTeacherIdRef.current !== teacher.id) {
      lastInitializedTeacherIdRef.current = teacher.id;

      const currentList: TeacherClassAssignment[] = [];
      classes.forEach((cls) => {
        (cls.subjects || []).forEach((s) => {
          if (s.teacherId === teacher.id) {
            currentList.push({
              classId: cls.id,
              subjectId: s.subjectId,
              weeklyHours: Number(s.weeklyHours) || 2,
            });
          }
        });
      });

      setAssignments(currentList);
    }
  }, [isOpen, teacher?.id, teacher, classes]);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  // Total hours assigned vs Teacher's capacity
  const totalAssignedHours = useMemo(
    () => assignments.reduce((sum, item) => sum + (Number(item.weeklyHours) || 0), 0),
    [assignments]
  );

  const capacity = teacher?.weeklyHourCapacity || 20;
  const remainingHours = capacity - totalAssignedHours;
  const isOverloaded = totalAssignedHours > capacity;

  if (!isOpen || !teacher) return null;

  // Teacher's specialized subjects
  const teacherSubjects = (teacher.subjectIds || [])
    .map((id) => subjectMap.get(id))
    .filter(Boolean) as Subject[];

  const defaultSubjectId = teacherSubjects[0]?.id || subjects[0]?.id || "";

  // Add new class assignment
  const handleAddAssignment = () => {
    // Find first class not already assigned to this teacher with this subject
    const unassignedClass = classes.find(
      (c) => !assignments.some((a) => a.classId === c.id && a.subjectId === defaultSubjectId)
    );
    const classId = unassignedClass ? unassignedClass.id : classes[0]?.id || "";

    setAssignments((prev) => [
      ...prev,
      {
        classId,
        subjectId: defaultSubjectId,
        weeklyHours: 4,
      },
    ]);
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStepHours = (index: number, delta: number) => {
    setAssignments((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const current = Number(item.weeklyHours) || 0;
        const next = Math.max(1, Math.min(12, current + delta));
        return { ...item, weeklyHours: next };
      })
    );
  };

  const handleUpdateAssignment = (
    index: number,
    key: keyof TeacherClassAssignment,
    val: any
  ) => {
    setAssignments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [key]: val } : item))
    );
  };

  const handleSave = () => {
    const valid = assignments.filter(
      (a) => a.classId && a.subjectId && Number(a.weeklyHours) > 0
    );
    onSave(teacher.id, valid);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col min-w-0">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
              {teacher.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2 truncate">
                <span>{teacher.fullName} — Dars Soatlari Taqsimoti</span>
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                Ushbu o'qituvchi qaysi sinflarga necha soatdan dars berishini belgilash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── LIVE CAPACITY STATUS BAR ────────────────────────────────────── */}
        <div className="px-6 py-3 bg-muted/40 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-xs">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-muted-foreground font-medium">Haftalik stavka yuklamasi:</span>
            <span
              className={`font-black px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 ${
                isOverloaded
                  ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                  : totalAssignedHours === capacity
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
              }`}
            >
              <span>
                {totalAssignedHours} / {capacity} soat
              </span>
              <span className="text-[10px] font-normal opacity-80">
                {remainingHours > 0
                  ? `(${remainingHours} soat bo'sh)`
                  : remainingHours === 0
                  ? "(To'liq stavka)"
                  : `(+${Math.abs(remainingHours)} soat ortiqcha)`}
              </span>
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddAssignment}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Sinf biriktirish</span>
          </button>
        </div>

        {/* ── ASSIGNMENTS LIST ────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 min-w-0">
          {assignments.length === 0 ? (
            <div className="py-14 text-center rounded-3xl border border-dashed border-border bg-muted/20">
              <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">
                Hozircha birorta sinf biriktirilmagan
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Quyidagi <strong>"Sinf biriktirish"</strong> tugmasini bosib, o'qituvchi dars beradigan sinf, fan va haftalik soatlarni tezda belgilang.
              </p>
              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleAddAssignment}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dars soati biriktirish</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {/* Header labels */}
              <div className="hidden sm:flex items-center gap-3 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="w-[30%]">Biriktirilgan sinf</div>
                <div className="flex-1">Fan</div>
                <div className="w-36 text-center">Haftalik soat</div>
                <div className="w-8 shrink-0 text-center">O'chirish</div>
              </div>

              {assignments.map((item, index) => {
                const sub = subjectMap.get(item.subjectId);
                const cls = classMap.get(item.classId);

                return (
                  <div
                    key={`${item.classId}_${item.subjectId}_${index}`}
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 p-3 rounded-2xl border border-border/80 bg-card/80 hover:bg-card hover:border-primary/40 hover:shadow-sm transition-all min-w-0"
                  >
                    {/* 1. Sinf tanlash */}
                    <div className="w-full sm:w-[30%] min-w-0">
                      <select
                        value={item.classId}
                        onChange={(e) =>
                          handleUpdateAssignment(index, "classId", e.target.value)
                        }
                        className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer truncate"
                      >
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} sinfi ({c.grade}-sinf)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Fan tanlash */}
                    <div className="w-full sm:flex-1 min-w-0">
                      {(() => {
                        const targetGrade = cls?.grade || 5;
                        const isPrimaryClass = targetGrade <= 4;
                        const suitableTeacherSubs = teacherSubjects.filter((s) =>
                          isSubjectSuitableForGrade(s, targetGrade)
                        );
                        const otherTeacherSubs = teacherSubjects.filter(
                          (s) => !isSubjectSuitableForGrade(s, targetGrade)
                        );
                        const suitableAllSubs = subjects.filter((s) =>
                          isSubjectSuitableForGrade(s, targetGrade)
                        );
                        const otherAllSubs = subjects.filter(
                          (s) => !isSubjectSuitableForGrade(s, targetGrade)
                        );

                        return (
                          <select
                            value={item.subjectId}
                            onChange={(e) =>
                              handleUpdateAssignment(index, "subjectId", e.target.value)
                            }
                            className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer truncate"
                          >
                            {suitableTeacherSubs.length > 0 && (
                              <optgroup
                                label={
                                  isPrimaryClass
                                    ? "🧒 O'qituvchining boshlang'ich fanlari:"
                                    : "🧑‍🎓 O'qituvchining asosiy fanlari:"
                                }
                              >
                                {suitableTeacherSubs.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    ⭐ {s.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}

                            {isPrimaryClass ? (
                              <optgroup label="🧒 Boshlang'ichga mos boshqa fanlar (1-4):">
                                {suitableAllSubs
                                  .filter(
                                    (s) => !suitableTeacherSubs.some((ts) => ts.id === s.id)
                                  )
                                  .map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name}
                                    </option>
                                  ))}
                              </optgroup>
                            ) : (
                              <optgroup label="🧑‍🎓 Yuqori sinfga mos boshqa fanlar (5-11):">
                                {suitableAllSubs
                                  .filter(
                                    (s) => !suitableTeacherSubs.some((ts) => ts.id === s.id)
                                  )
                                  .map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name}
                                    </option>
                                  ))}
                              </optgroup>
                            )}

                            {otherAllSubs.length > 0 && (
                              <optgroup label="📚 Barcha qolgan fanlar:">
                                {otherAllSubs.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name}
                                  </option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        );
                      })()}
                    </div>

                    {/* 3. Haftalik soat STEPPER (+ / -) */}
                    <div className="flex items-center justify-between sm:justify-center gap-1.5 w-full sm:w-36 shrink-0 bg-muted/40 sm:bg-transparent p-1 sm:p-0 rounded-xl">
                      <span className="sm:hidden text-xs text-muted-foreground font-semibold pl-2">
                        Haftalik soat:
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStepHours(index, -1)}
                          disabled={item.weeklyHours <= 1}
                          className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                          title="1 soat kamaytirish"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <input
                          type="number"
                          min={1}
                          max={12}
                          value={item.weeklyHours}
                          onChange={(e) =>
                            handleUpdateAssignment(
                              index,
                              "weeklyHours",
                              Number(e.target.value)
                            )
                          }
                          className="w-11 px-1 py-1.5 text-xs font-black text-center rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                        />

                        <button
                          type="button"
                          onClick={() => handleStepHours(index, 1)}
                          disabled={item.weeklyHours >= 12}
                          className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
                          title="1 soat oshirish"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[11px] text-muted-foreground font-bold px-1">st</span>
                      </div>
                    </div>

                    {/* 4. O'chirish tugmasi */}
                    <div className="self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleRemoveAssignment(index)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/80 bg-muted/20 shrink-0">
          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
            <span className="font-bold text-foreground">
              {assignments.length} ta sinf/fan
            </span>
            <span>•</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400">
              Jami {totalAssignedHours} soat
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Yuklamani Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
