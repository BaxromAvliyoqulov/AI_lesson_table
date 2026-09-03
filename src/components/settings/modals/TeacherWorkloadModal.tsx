"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Teacher, Subject, SchoolClass } from "@/types";
import {
  isSubjectSuitableForGrade,
  isKelajakOrSinfSoatiSubject,
  isSubjectEligibleForSplit,
} from "@/lib/curriculum-templates";
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
  Users2,
  UserCheck,
  Check,
  Zap,
} from "lucide-react";

export interface TeacherClassAssignment {
  classId: string;
  subjectId: string;
  weeklyHours: number;
  isSplit?: boolean;
  groupType?: "WHOLE" | "GROUP_1" | "GROUP_2";
  secondTeacherId?: string;
}

interface TeacherWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers?: Teacher[];
  onSave: (teacherId: string, assignments: TeacherClassAssignment[]) => void;
}

export const TeacherWorkloadModal: React.FC<TeacherWorkloadModalProps> = ({
  isOpen,
  onClose,
  teacher,
  classes,
  subjects,
  teachers = [],
  onSave,
}) => {
  const [assignments, setAssignments] = useState<TeacherClassAssignment[]>([]);
  const lastInitializedTeacherIdRef = useRef<string | null>(null);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);

  // Teacher's specialized subjects
  const teacherSubjects = useMemo(() => {
    if (!teacher) return [];
    return (teacher.subjectIds || [])
      .map((id) => subjectMap.get(id))
      .filter(Boolean) as Subject[];
  }, [teacher, subjectMap]);

  const defaultSubjectId = teacherSubjects[0]?.id || subjects[0]?.id || "";

  // Tezkor ommaviy sinf qo'shish paneli uchun state
  const [batchSubjectId, setBatchSubjectId] = useState<string>(defaultSubjectId);
  const [batchHours, setBatchHours] = useState<number>(4);
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(true);

  // Collect all existing assignments for this teacher across all classes ONLY on open or teacher change
  useEffect(() => {
    if (!isOpen || !teacher) {
      lastInitializedTeacherIdRef.current = null;
      setAssignments([]);
      return;
    }

    if (lastInitializedTeacherIdRef.current !== teacher.id) {
      lastInitializedTeacherIdRef.current = teacher.id;
      setBatchSubjectId(teacherSubjects[0]?.id || subjects[0]?.id || "");

      const currentList: TeacherClassAssignment[] = [];
      classes.forEach((cls) => {
        (cls.subjects || []).forEach((s) => {
          if (s.teacherId === teacher.id) {
            const isSplit = s.groupType === "GROUP_1" || s.groupType === "GROUP_2";
            let secondTeacherId: string | undefined = undefined;

            if (isSplit) {
              // Ushbu sinfdagi ayni shu fanning boshqa guruh o'qituvchisini topamiz
              const otherGroup = (cls.subjects || []).find(
                (other) =>
                  other.subjectId === s.subjectId &&
                  other.teacherId !== teacher.id &&
                  (other.groupType === "GROUP_1" || other.groupType === "GROUP_2")
              );
              if (otherGroup) {
                secondTeacherId = otherGroup.teacherId;
              }
            }

            currentList.push({
              classId: cls.id,
              subjectId: s.subjectId,
              weeklyHours: Number(s.weeklyHours) || 2,
              isSplit: isSplit,
              groupType: s.groupType || "WHOLE",
              secondTeacherId,
            });
          }
        });
      });

      setAssignments(currentList);
    }
  }, [isOpen, teacher?.id, teacher, classes, teacherSubjects, subjects]);

  // Total hours assigned vs Teacher's capacity (Kelajak/Sinf soati dars stavkasidan qat'iy chegiriladi!)
  const { totalAssignedHours, totalHomeroomHours, totalPhysicalHours } = useMemo(() => {
    let assigned = 0;
    let homeroom = 0;
    assignments.forEach((item) => {
      const sub = subjectMap.get(item.subjectId) || subjects.find((s) => s.id === item.subjectId);
      const hours = Number(item.weeklyHours) || 0;
      // Faqat o'qituvchi o'zi sinf rahbari bo'lgan sinfdagi (teacher.homeroomClassId === item.classId)
      // 1 soatlik Kelajak/Sinf soatigina dars stavkasidan chegiriladi!
      // Boshqa sinflardagi darslar (masalan 9A) stavkadan chegirilmaydi!
      const isHomeroomClassHour =
        isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name) &&
        teacher?.homeroomClassId === item.classId;

      if (isHomeroomClassHour) {
        homeroom += hours;
      } else {
        assigned += hours;
      }
    });
    return {
      totalAssignedHours: assigned,
      totalHomeroomHours: homeroom,
      totalPhysicalHours: assigned + homeroom,
    };
  }, [assignments, subjectMap, subjects]);

  const capacity = teacher?.weeklyHourCapacity || 20;
  const remainingHours = capacity - totalAssignedHours;
  const isOverloaded = totalAssignedHours > capacity;

  // Har bir o'qituvchining joriy dars soatlari xaritasi (2-guruh ustozi tanlashda yuklamani ko'rsatish uchun)
  const teacherWorkloadMap = useMemo(() => {
    const map = new Map<string, number>();
    classes.forEach((cls) => {
      (cls.subjects || []).forEach((cs) => {
        const sub = subjectMap.get(cs.subjectId) || subjects.find((s) => s.id === cs.subjectId);
        if (cs.teacherId && !isKelajakOrSinfSoatiSubject(cs.subjectId, sub?.name)) {
          map.set(cs.teacherId, (map.get(cs.teacherId) || 0) + (Number(cs.weeklyHours) || 0));
        }
      });
    });
    return map;
  }, [classes, subjectMap, subjects]);

  if (!isOpen || !teacher) return null;

  // Tezkor sinfni qo'shish / o'chirish (Toggle)
  const handleToggleClassAssignment = (classId: string) => {
    const targetSubjectId = batchSubjectId || defaultSubjectId;
    const existingIndex = assignments.findIndex(
      (a) => a.classId === classId && a.subjectId === targetSubjectId
    );

    if (existingIndex >= 0) {
      // Allaqachon biriktirilgan -> o'chirish
      setAssignments((prev) => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Biriktirish
      const cls = classMap.get(classId);
      const standardHours = batchHours || (cls && cls.grade >= 5 ? 3 : 4);

      setAssignments((prev) => [
        ...prev,
        {
          classId,
          subjectId: targetSubjectId,
          weeklyHours: standardHours,
          isSplit: false,
          groupType: "WHOLE",
        },
      ]);
    }
  };

  // Guruhlangan sinflarni ommaviy tanlash (masalan 5-sinflar yoki 8-sinflar)
  const handleBulkSelectGrade = (grade: number) => {
    const targetSubjectId = batchSubjectId || defaultSubjectId;
    const gradeClasses = classes.filter((c) => c.grade === grade);
    if (gradeClasses.length === 0) return;

    // Tekshiramiz: barchasi tanlanganmi?
    const allSelected = gradeClasses.every((c) =>
      assignments.some((a) => a.classId === c.id && a.subjectId === targetSubjectId)
    );

    if (allSelected) {
      // Hammasini o'chirish
      const gradeClassIds = new Set(gradeClasses.map((c) => c.id));
      setAssignments((prev) =>
        prev.filter((a) => !(gradeClassIds.has(a.classId) && a.subjectId === targetSubjectId))
      );
    } else {
      // Tanlanmaganlarini qo'shish
      const newItems: TeacherClassAssignment[] = [];
      gradeClasses.forEach((c) => {
        if (!assignments.some((a) => a.classId === c.id && a.subjectId === targetSubjectId)) {
          newItems.push({
            classId: c.id,
            subjectId: targetSubjectId,
            weeklyHours: batchHours || 3,
            isSplit: false,
            groupType: "WHOLE",
          });
        }
      });
      setAssignments((prev) => [...prev, ...newItems]);
    }
  };

  // Yakka qo'lda yangi qator qo'shish
  const handleAddAssignment = () => {
    const unassignedClass = classes.find(
      (c) => !assignments.some((a) => a.classId === c.id && a.subjectId === defaultSubjectId)
    );
    const classId = unassignedClass ? unassignedClass.id : classes[0]?.id || "";

    setAssignments((prev) => [
      ...prev,
      {
        classId,
        subjectId: defaultSubjectId,
        weeklyHours: batchHours || 4,
        isSplit: false,
        groupType: "WHOLE",
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

  // Guruhga bo'lish toggle
  const handleToggleSplit = (index: number) => {
    setAssignments((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const nextIsSplit = !item.isSplit;

        if (nextIsSplit) {
          // Shu fanni o'tadigan boshqa o'qituvchini topamiz (default taklif)
          const suitableTeacher = teachers.find(
            (t) => t.id !== teacher.id && (t.subjectIds || []).includes(item.subjectId)
          );
          return {
            ...item,
            isSplit: true,
            groupType: "GROUP_1",
            secondTeacherId: item.secondTeacherId || suitableTeacher?.id || "",
          };
        } else {
          return {
            ...item,
            isSplit: false,
            groupType: "WHOLE",
            secondTeacherId: undefined,
          };
        }
      })
    );
  };

  const handleSave = () => {
    const valid = assignments.filter(
      (a) => a.classId && a.subjectId && Number(a.weeklyHours) > 0
    );
    onSave(teacher.id, valid);
    onClose();
  };

  // Sinflarni guruhlar (1-4, 5-9, 10-11) bo'yicha ajratish
  const primaryClasses = useMemo(() => classes.filter((c) => c.grade <= 4), [classes]);
  const middleClasses = useMemo(() => classes.filter((c) => c.grade >= 5 && c.grade <= 9), [classes]);
  const highClasses = useMemo(() => classes.filter((c) => c.grade >= 10), [classes]);

  // Noyob sinf raqamlari (5, 6, 7, 8, 9 ...)
  const availableGrades = useMemo(() => {
    const set = new Set<number>();
    classes.forEach((c) => set.add(c.grade));
    return Array.from(set).sort((a, b) => a - b);
  }, [classes]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col min-w-0">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
              {teacher.displayNumber ? `№${teacher.displayNumber}` : teacher.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2 truncate">
                <span>{teacher.fullName} — Dars Soatlari Taqsimoti</span>
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                Ushbu o'qituvchiga sinflarni 1-bosishda biriktirish yoki guruhlarga bo'lib o'tishni belgilash
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
                {totalAssignedHours} / {capacity} soat stavka
              </span>
              <span className="text-[10px] font-normal opacity-80">
                {remainingHours > 0
                  ? `(${remainingHours} soat bo'sh)`
                  : remainingHours === 0
                  ? "(Optimal stavka • 100%)"
                  : `(+${Math.abs(remainingHours)} soat ortiqcha)`}
              </span>
            </span>

            {totalHomeroomHours > 0 && (
              <span className="font-bold px-2.5 py-1 rounded-xl text-xs bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <span>👤 +{totalHomeroomHours} soat sinf rahbarligi</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBatchOpen(!isBatchOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isBatchOpen
                  ? "bg-indigo-500/15 text-indigo-600 border border-indigo-500/30"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isBatchOpen ? "Tezkor panelni yopish" : "⚡ Tezkor sinf tanlash"}</span>
            </button>

            <button
              type="button"
              onClick={handleAddAssignment}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Sinf biriktirish</span>
            </button>
          </div>
        </div>

        {/* ── ⚡ TEZKOR SINF TANLASH PANELI (SINF QO'SHISH GA O'XSHASH OSON) ──── */}
        {isBatchOpen && (
          <div className="bg-indigo-500/5 dark:bg-indigo-950/20 border-b border-indigo-500/20 px-6 py-3.5 space-y-3 shrink-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Fan:
                  </span>
                  <select
                    value={batchSubjectId}
                    onChange={(e) => setBatchSubjectId(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-background cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    {teacherSubjects.length > 0 && (
                      <optgroup label="⭐ O'qituvchining ixtisoslashgan fanlari:">
                        {teacherSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Barcha fanlar:">
                      {subjects
                        .filter((s) => !teacherSubjects.some((ts) => ts.id === s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Standart soat:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBatchHours((prev) => Math.max(1, prev - 1))}
                      className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-xs hover:bg-muted cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-2 font-black text-xs">{batchHours} st</span>
                    <button
                      type="button"
                      onClick={() => setBatchHours((prev) => Math.min(12, prev + 1))}
                      className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-xs hover:bg-muted cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Tezkor sinf bosqichlari */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-semibold mr-1">Ommaviy:</span>
                {availableGrades.map((g) => {
                  const gClasses = classes.filter((c) => c.grade === g);
                  const isAll =
                    gClasses.length > 0 &&
                    gClasses.every((c) =>
                      assignments.some(
                        (a) => a.classId === c.id && a.subjectId === (batchSubjectId || defaultSubjectId)
                      )
                    );
                  return (
                    <button
                      key={`bulk_grade_${g}`}
                      type="button"
                      onClick={() => handleBulkSelectGrade(g)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        isAll
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-background border border-border text-foreground hover:bg-muted"
                      }`}
                      title={`${g}-sinflarning barchasini tanlash / bekor qilish`}
                    >
                      {g}-sinflar
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sinflar pill/kartochkalari (1-bosishda biriktirish) */}
            <div className="space-y-2">
              {/* 5-9 Sinflar */}
              {middleClasses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <span>🧑 5-9 Sinflar:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {middleClasses.map((c) => {
                      const isAssigned = assignments.some(
                        (a) => a.classId === c.id && a.subjectId === (batchSubjectId || defaultSubjectId)
                      );
                      const assignItem = assignments.find(
                        (a) => a.classId === c.id && a.subjectId === (batchSubjectId || defaultSubjectId)
                      );
                      return (
                        <button
                          key={`btn_cls_${c.id}`}
                          type="button"
                          onClick={() => handleToggleClassAssignment(c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                            isAssigned
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40"
                              : "bg-background border border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50/30"
                          }`}
                        >
                          {isAssigned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
                          <span>{c.name}</span>
                          {isAssigned && (
                            <span className="text-[10px] opacity-80 font-normal">({assignItem?.weeklyHours}s)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1-4 Sinflar */}
              {primaryClasses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <span>🧒 1-4 Sinflar:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {primaryClasses.map((c) => {
                      const isAssigned = assignments.some(
                        (a) => a.classId === c.id && a.subjectId === (batchSubjectId || defaultSubjectId)
                      );
                      const assignItem = assignments.find(
                        (a) => a.classId === c.id && a.subjectId === (batchSubjectId || defaultSubjectId)
                      );
                      return (
                        <button
                          key={`btn_cls_${c.id}`}
                          type="button"
                          onClick={() => handleToggleClassAssignment(c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                            isAssigned
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40"
                              : "bg-background border border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50/30"
                          }`}
                        >
                          {isAssigned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
                          <span>{c.name}</span>
                          {isAssigned && (
                            <span className="text-[10px] opacity-80 font-normal">({assignItem?.weeklyHours}s)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 10-11 Sinflar */}
              {highClasses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <span>🎓 10-11 Sinflar:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {highClasses.map((c) => {
                      const isAssigned = assignments.some(
                        (a) => a.classId === c.id && a.subjectId === (batchSubjectId || defaultSubjectId)
                      );
                      const assignItem = assignments.find(
                        (a) => a.classId === c.id && a.subjectId === (batchSubjectId || defaultSubjectId)
                      );
                      return (
                        <button
                          key={`btn_cls_${c.id}`}
                          type="button"
                          onClick={() => handleToggleClassAssignment(c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                            isAssigned
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40"
                              : "bg-background border border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50/30"
                          }`}
                        >
                          {isAssigned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
                          <span>{c.name}</span>
                          {isAssigned && (
                            <span className="text-[10px] opacity-80 font-normal">({assignItem?.weeklyHours}s)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ASSIGNMENTS LIST ────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 min-w-0">
          {assignments.length === 0 ? (
            <div className="py-14 text-center rounded-3xl border border-dashed border-border bg-muted/20">
              <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">
                Hozircha birorta sinf biriktirilmagan
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Yuqoridagi <strong>"⚡ Tezkor sinf tanlash"</strong> panelidan kerakli sinflarni bir bosishda belgilang yoki <strong>"Qatorda qo'shish"</strong> tugmasidan foydalaning.
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
            <div className="space-y-3">
              {/* Header labels */}
              <div className="hidden sm:flex items-center gap-3 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="w-[28%]">Biriktirilgan sinf</div>
                <div className="w-[32%]">Fan</div>
                <div className="w-32 text-center">Haftalik soat</div>
                <div className="flex-1 text-center">Guruhga bo'lish</div>
                <div className="w-8 shrink-0 text-center">O'chirish</div>
              </div>

              {assignments.map((item, index) => {
                const sub = subjectMap.get(item.subjectId);
                const cls = classMap.get(item.classId);
                const isKelajak = isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name);

                // Ayni shu fanni o'tadigan boshqa o'qituvchilar (2-guruh ustozi tanlash uchun)
                const candidateTeachers = teachers.filter((t) => t.id !== teacher.id);
                const specializedCandidateTeachers = candidateTeachers.filter((t) =>
                  (t.subjectIds || []).includes(item.subjectId)
                );
                const otherCandidateTeachers = candidateTeachers.filter(
                  (t) => !(t.subjectIds || []).includes(item.subjectId)
                );

                return (
                  <div
                    key={`${item.classId}_${item.subjectId}_${index}`}
                    className={`flex flex-col gap-2.5 p-3.5 rounded-2xl border transition-all min-w-0 ${
                      item.isSplit
                        ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300/80 dark:border-indigo-800/80 shadow-xs"
                        : "bg-card/80 border-border/80 hover:border-primary/40 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                      {/* 1. Sinf tanlash */}
                      <div className="w-full sm:w-[28%] min-w-0">
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
                      <div className="w-full sm:w-[32%] min-w-0">
                        {(() => {
                          const targetGrade = cls?.grade || 5;
                          const isPrimaryClass = targetGrade <= 4;
                          const suitableTeacherSubs = teacherSubjects.filter((s) =>
                            isSubjectSuitableForGrade(s, targetGrade)
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
                      <div className="flex items-center justify-between sm:justify-center gap-1 w-full sm:w-32 shrink-0 bg-muted/40 sm:bg-transparent p-1 sm:p-0 rounded-xl">
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
                            className="w-10 px-1 py-1 text-xs font-black text-center rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
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
                          <span className="text-[11px] text-muted-foreground font-bold px-0.5">st</span>
                        </div>
                      </div>

                      {/* 4. 👥 GURUHGA BO'LISH TOGGLE TUGMASI */}
                      <div className="w-full sm:flex-1 flex items-center justify-center sm:justify-start">
                        <button
                          type="button"
                          onClick={() => handleToggleSplit(index)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                            item.isSplit
                              ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-500/30"
                              : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/80"
                          }`}
                          title="Sinfni 2 ta guruhga bo'lib (masalan Ingliz tili, Rus tili, Informatika) 2 ta o'qituvchiga biriktirish"
                        >
                          <Users2 className="w-3.5 h-3.5" />
                          <span>{item.isSplit ? "Guruhga bo'lingan (1-2)" : "Guruhga bo'lish"}</span>
                        </button>
                      </div>

                      {/* 5. O'chirish tugmasi */}
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

                    {/* SINF SOATI BO'LSA — NISHON */}
                    {isKelajak && teacher.homeroomClassId === item.classId && (
                      <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/40 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-purple-200 dark:border-purple-800">
                        <span>👤 {cls?.name} sinf rahbarligi — 1 soatlik Kelajak soati dars stavkasiga qo&apos;shilmaydi</span>
                      </div>
                    )}

                    {/* AGAR BOSHQA SINFDA ADASHIB SINF SOATI TANLANGAN BO'LSA */}
                    {isKelajak && teacher.homeroomClassId !== item.classId && (
                      <div className="text-[11px] font-medium text-amber-800 dark:text-amber-200 bg-amber-500/10 px-3 py-1.5 rounded-xl flex flex-wrap items-center justify-between gap-2 border border-amber-500/30">
                        <span className="flex items-center gap-1.5">
                          ⚠️ Siz faqat {classMap.get(teacher.homeroomClassId || "")?.name || "o'z sinfingiz"} rahbari hisoblanasiz. {cls?.name} sinfida &quot;Sinf soati&quot; o&apos;rniga asosiy mutaxassislik fanni tanlang.
                        </span>
                        {teacherSubjects[0] && (
                          <button
                            type="button"
                            onClick={() => handleUpdateAssignment(index, "subjectId", teacherSubjects[0].id)}
                            className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[10.5px] hover:bg-amber-700 shrink-0 cursor-pointer shadow-xs"
                          >
                            ⚡ {teacherSubjects[0].name} ga almashtirish
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── 👥 GURUHNI 2-QISMINI O'TADIGAN O'QITUVCHINI BELGILASH ── */}
                    {item.isSplit && (
                      <div className="mt-1 p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold">
                          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                          <span>1-guruh:</span>
                          <span className="text-foreground font-extrabold">{teacher.fullName}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">({item.weeklyHours} soat)</span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="font-bold text-indigo-950 dark:text-indigo-200 shrink-0 flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                            2-guruh o'qituvchisi:
                          </span>
                          <select
                            value={item.secondTeacherId || ""}
                            onChange={(e) =>
                              handleUpdateAssignment(index, "secondTeacherId", e.target.value)
                            }
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-indigo-300 dark:border-indigo-700 bg-background text-foreground focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[200px]"
                          >
                            <option value="">-- O'qituvchini tanlang --</option>
                            {specializedCandidateTeachers.length > 0 && (
                              <optgroup label="⭐ Shu fan mutaxassislari:">
                                {specializedCandidateTeachers.map((t) => {
                                  const hours = teacherWorkloadMap.get(t.id) || 0;
                                  return (
                                    <option key={t.id} value={t.id}>
                                      {t.displayNumber ? `№${t.displayNumber} ` : ""}
                                      {t.fullName} ({hours}/{t.weeklyHourCapacity || 20}s)
                                    </option>
                                  );
                                })}
                              </optgroup>
                            )}
                            {otherCandidateTeachers.length > 0 && (
                              <optgroup label="Boshqa o'qituvchilar:">
                                {otherCandidateTeachers.map((t) => {
                                  const hours = teacherWorkloadMap.get(t.id) || 0;
                                  return (
                                    <option key={t.id} value={t.id}>
                                      {t.displayNumber ? `№${t.displayNumber} ` : ""}
                                      {t.fullName} ({hours}/{t.weeklyHourCapacity || 20}s)
                                    </option>
                                  );
                                })}
                              </optgroup>
                            )}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/80 bg-muted/20 shrink-0">
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
            <span className="font-bold text-foreground">
              {assignments.length} ta fan
            </span>
            <span>•</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400">
              {totalAssignedHours} soat dars stavkasi
            </span>
            {totalHomeroomHours > 0 && (
              <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-100/90 dark:bg-purple-950/50 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                +{totalHomeroomHours} soat sinf soati
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-semibold">
              (Jami darslar: {totalPhysicalHours} soat)
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
