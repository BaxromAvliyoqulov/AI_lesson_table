"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { SchoolClass, Subject, Teacher, ClassSubject } from "@/types";
import {
  generateStandardCurriculumForClass,
  isSubjectSuitableForGrade,
  isHomeroomPrimarySubject,
  UZBEKISTAN_STANDARD_CURRICULUM,
} from "@/lib/curriculum-templates";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  GraduationCap,
  Sparkles,
  Copy,
  Minus,
  CheckCircle2,
  Clock,
  UserCheck,
  AlertTriangle,
  Layers,
  Search,
  Check,
  Calendar,
  BarChart3,
  ListFilter,
  Sparkle,
  ArrowRight,
  Info,
} from "lucide-react";

interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classId: string, subjects: ClassSubject[]) => void;
  targetClass: SchoolClass | null;
  allSubjects: Subject[];
  allTeachers: Teacher[];
  allClasses?: SchoolClass[];
}

type SubjectCategory =
  | "ALL"
  | "RECOMMENDED"
  | "EXACT_SCIENCE"
  | "LANGUAGES"
  | "NATURAL"
  | "ARTS_SPORTS"
  | "SOCIAL";

export const CurriculumModal: React.FC<CurriculumModalProps> = ({
  isOpen,
  onClose,
  onSave,
  targetClass,
  allSubjects,
  allTeachers,
  allClasses = [],
}) => {
  const [subjectsList, setSubjectsList] = useState<ClassSubject[]>([]);
  const [selectedCopyClassId, setSelectedCopyClassId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"LIST" | "WEEKLY_GRID">("LIST");

  // Interactive Catalog / Drawer State
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<SubjectCategory>("RECOMMENDED");
  const [selectedCatalogSubjectIds, setSelectedCatalogSubjectIds] = useState<Record<string, number>>({});
  const lastInitializedClassIdRef = React.useRef<string | null>(null);

  // Tasdiqlash modali va Toast
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!isOpen || !targetClass) {
      lastInitializedClassIdRef.current = null;
      setSubjectsList([]);
      return;
    }

    if (lastInitializedClassIdRef.current !== targetClass.id) {
      lastInitializedClassIdRef.current = targetClass.id;
      setSubjectsList(targetClass.subjects || []);
      setSelectedCopyClassId("");
      setIsCatalogOpen(false);
      setCatalogSearch("");
      setSelectedCatalogSubjectIds({});
    }
  }, [isOpen, targetClass?.id, targetClass]);

  const subjectMap = useMemo(() => new Map(allSubjects.map((s) => [s.id, s])), [allSubjects]);
  const teacherMap = useMemo(() => new Map(allTeachers.map((t) => [t.id, t])), [allTeachers]);

  // Subject categorization helper
  const getSubjectCategory = useCallback((sub: Subject): SubjectCategory => {
    const name = sub.name.toLowerCase();
    if (
      name.includes("matematika") ||
      name.includes("algebra") ||
      name.includes("geometriya") ||
      name.includes("informatika") ||
      name.includes("fizika")
    ) {
      return "EXACT_SCIENCE";
    }
    if (
      name.includes("ona tili") ||
      name.includes("adabiyot") ||
      name.includes("ingliz") ||
      name.includes("rus") ||
      name.includes("nemis") ||
      name.includes("fransuz") ||
      name.includes("chet tili")
    ) {
      return "LANGUAGES";
    }
    if (
      name.includes("biologiya") ||
      name.includes("kimyo") ||
      name.includes("geografiya") ||
      name.includes("tabiiy") ||
      name.includes("tabiat") ||
      name.includes("astronomiya")
    ) {
      return "NATURAL";
    }
    if (
      name.includes("tasviriy") ||
      name.includes("rasm") ||
      name.includes("musiqa") ||
      name.includes("texnologiya") ||
      name.includes("jismoniy") ||
      name.includes("sport") ||
      name.includes("chizmachilik")
    ) {
      return "ARTS_SPORTS";
    }
    if (
      name.includes("tarix") ||
      name.includes("tarbiya") ||
      name.includes("huquq") ||
      name.includes("iqtisod") ||
      name.includes("chqbt") ||
      name.includes("sinf soati") ||
      name.includes("kelajak")
    ) {
      return "SOCIAL";
    }
    return "EXACT_SCIENCE";
  }, []);

  const { academicHours, homeroomHours, totalWeeklyHours, unassignedTeachersCount } = useMemo(() => {
    let academic = 0;
    let homeroom = 0;
    let unassigned = 0;
    for (const item of subjectsList) {
      const sub = subjectMap.get(item.subjectId);
      const isSinfSoati =
        item.subjectId === "sub_sinf_soati" ||
        item.subjectId === "sub_kelajak" ||
        sub?.name.toLowerCase().includes("sinf soati") ||
        sub?.name.toLowerCase().includes("kelajak");

      const h = Number(item.weeklyHours) || 0;
      if (isSinfSoati) {
        homeroom += h;
      } else {
        academic += h;
      }
      if (!item.teacherId) {
        unassigned++;
      }
    }
    return {
      academicHours: academic,
      homeroomHours: homeroom,
      totalWeeklyHours: academic + homeroom,
      unassignedTeachersCount: unassigned,
    };
  }, [subjectsList, subjectMap]);

  // Max recommended load: 1-4th grades: 22-26 hours, 5-9th: 28-32, 10-11th: 32-35 hours
  const recommendedHours = useMemo(() => {
    if (!targetClass) return 30;
    if (targetClass.grade === 1) return 22;
    if (targetClass.grade === 2) return 23;
    if (targetClass.grade === 3) return 24;
    if (targetClass.grade === 4) return 25;
    if (targetClass.grade <= 6) return 30;
    if (targetClass.grade <= 9) return 33;
    return 34;
  }, [targetClass]);

  const loadPercent = Math.min(100, Math.round((totalWeeklyHours / recommendedHours) * 100));
  const isOverloaded = totalWeeklyHours > recommendedHours + 2;

  // Grade standard template default hours map
  const gradeTemplateDefaultHours = useMemo(() => {
    const map = new Map<string, number>();
    if (!targetClass) return map;
    const gradeTemplates = UZBEKISTAN_STANDARD_CURRICULUM[targetClass.grade] || [];
    gradeTemplates.forEach((item) => {
      allSubjects.forEach((s) => {
        const sName = s.name.toLowerCase();
        if (
          s.id === item.prioritySubjectId ||
          item.searchAliases.some((alias) => sName.includes(alias.toLowerCase()))
        ) {
          map.set(s.id, item.defaultHours);
        }
      });
    });
    return map;
  }, [targetClass, allSubjects]);

  // Available subjects for catalog
  const filteredCatalogSubjects = useMemo(() => {
    const existingIds = new Set(subjectsList.map((s) => s.subjectId));
    const query = catalogSearch.trim().toLowerCase();

    return allSubjects.filter((s) => {
      if (s.isActive === false) return false;
      if (query) {
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesShort = s.shortName?.toLowerCase().includes(query);
        if (!matchesName && !matchesShort) return false;
      }
      if (catalogCategory === "RECOMMENDED") {
        return targetClass ? isSubjectSuitableForGrade(s, targetClass.grade) : true;
      }
      if (catalogCategory !== "ALL") {
        return getSubjectCategory(s) === catalogCategory;
      }
      return true;
    });
  }, [allSubjects, subjectsList, catalogSearch, catalogCategory, targetClass, getSubjectCategory]);

  // Other classes with existing curriculum to copy from
  const copyableClasses = useMemo(() => {
    if (!targetClass) return [];
    return allClasses.filter(
      (c) => c.id !== targetClass.id && (c.subjects?.length || 0) > 0
    );
  }, [allClasses, targetClass]);

  // Simulated weekly distribution schedule (Dushanba-Juma/Shanba)
  const is5DayWeek = (targetClass?.grade ?? 1) <= 4 || Boolean(targetClass?.isPrimary);
  const daysCount = is5DayWeek ? 5 : 6;
  const dayNames = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"].slice(
    0,
    daysCount
  );

  // Distribute items across days for preview (All hooks MUST be called before any early return)
  const weeklyDistribution = useMemo(() => {
    const days: Array<Array<{ subject: Subject; teacher?: Teacher; hoursCount: number }>> = Array.from(
      { length: daysCount },
      () => []
    );
    if (!targetClass) return days;

    let dayIdx = 0;
    subjectsList.forEach((item) => {
      const sub = subjectMap.get(item.subjectId);
      if (!sub) return;
      const teacher = teacherMap.get(item.teacherId);
      const isSinfSoati =
        item.subjectId === "sub_sinf_soati" ||
        item.subjectId === "sub_kelajak" ||
        sub.name.toLowerCase().includes("sinf soati") ||
        sub.name.toLowerCase().includes("kelajak");

      if (isSinfSoati) {
        days[0].unshift({ subject: sub, teacher, hoursCount: item.weeklyHours });
        return;
      }

      const hours = Number(item.weeklyHours) || 1;
      for (let h = 0; h < hours; h++) {
        days[dayIdx % daysCount].push({ subject: sub, teacher, hoursCount: 1 });
        dayIdx++;
      }
    });

    return days;
  }, [subjectsList, daysCount, subjectMap, teacherMap, targetClass]);

  if (!isOpen || !targetClass) return null;

  // 1-Click Davlat Standarti Shablonini yuklash
  const handleLoadStandardTemplate = () => {
    const generated = generateStandardCurriculumForClass(
      targetClass.grade,
      targetClass.id,
      targetClass.homeroomTeacherId,
      allSubjects,
      allTeachers
    );

    if (generated.length === 0) {
      showToast("Maktabingizda mos fanlar katalogi topilmadi. Avval Fanlar bo'limini tekshiring.");
      return;
    }

    setSubjectsList(generated);
    if (targetClass.grade <= 4) {
      showToast(`✅ ${targetClass.grade}-sinf standart rejasi yuklandi! Ona tili, O'qish va Matematika sinf rahbariga biriktirildi.`);
    } else {
      showToast(`✅ ${targetClass.grade}-sinf davlat standart o'quv rejasi yuklandi!`);
    }
  };

  // Boshlang'ich sinf qoidasi: Ona tili, O'qish, Matematika (va 1-sinfda Alifbe) -> Sinf rahbariga
  const handleApplyPrimaryHomeroomRule = () => {
    if (!targetClass.homeroomTeacherId) {
      showToast("Avval ushbu sinfga sinf rahbarini tayinlang!");
      return;
    }
    const hrId = targetClass.homeroomTeacherId;
    let updatedCount = 0;

    const updated = subjectsList.map((item) => {
      const sub = subjectMap.get(item.subjectId);
      if (!sub) return item;
      const isCore = isHomeroomPrimarySubject(sub, targetClass.grade);
      if (isCore && item.teacherId !== hrId) {
        updatedCount++;
        return { ...item, teacherId: hrId };
      }
      return item;
    });

    setSubjectsList(updated);
    showToast(`✅ Boshlang'ich qoida qo'llandi: Ona tili, O'qish va Matematika sinf rahbariga biriktirildi!`);
  };

  // Boshqa sinfdan o'quv rejasini ko'chirib olish
  const handleCopyFromOtherClass = () => {
    if (!selectedCopyClassId) return;
    const sourceClass = allClasses.find((c) => c.id === selectedCopyClassId);
    if (!sourceClass || !sourceClass.subjects) return;

    const copiedList: ClassSubject[] = sourceClass.subjects.map((cs) => {
      if (
        (cs.subjectId === "sub_sinf_soati" || cs.subjectId.includes("sinf_soati")) &&
        targetClass.homeroomTeacherId
      ) {
        return {
          ...cs,
          classId: targetClass.id,
          teacherId: targetClass.homeroomTeacherId,
        };
      }
      return {
        ...cs,
        classId: targetClass.id,
      };
    });

    setSubjectsList(copiedList);
    setSelectedCopyClassId("");
  };

  // Stepper hours (+ / -)
  const handleStepHours = (index: number, delta: number) => {
    setSubjectsList((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const current = Number(item.weeklyHours) || 0;
        const next = Math.max(1, Math.min(12, current + delta));
        return { ...item, weeklyHours: next };
      })
    );
  };

  // Quick preset hour
  const handleSetPresetHours = (index: number, hours: number) => {
    setSubjectsList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, weeklyHours: hours } : item))
    );
  };

  // Update item (subject or teacher)
  const handleUpdateItem = (index: number, key: keyof ClassSubject, val: any) => {
    setSubjectsList((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [key]: val };

        if (key === "subjectId") {
          const suitableTeacher = allTeachers.find((t) => t.subjectIds?.includes(val));
          if (suitableTeacher) {
            updated.teacherId = suitableTeacher.id;
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveSubject = (index: number) => {
    setSubjectsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setIsClearConfirmOpen(true);
  };

  // Toggle selection in catalog
  const handleToggleCatalogSubject = (subId: string) => {
    setSelectedCatalogSubjectIds((prev) => {
      const copy = { ...prev };
      if (copy[subId] !== undefined) {
        delete copy[subId];
      } else {
        const defaultHours = gradeTemplateDefaultHours.get(subId) || 2;
        copy[subId] = defaultHours;
      }
      return copy;
    });
  };

  // Adjust catalog hours
  const handleStepCatalogHours = (subId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCatalogSubjectIds((prev) => {
      const current = prev[subId] || 2;
      const next = Math.max(1, Math.min(10, current + delta));
      return { ...prev, [subId]: next };
    });
  };

  // Add all selected catalog subjects
  const handleAddSelectedFromCatalog = () => {
    const toAdd: ClassSubject[] = [];
    const existingIds = new Set(subjectsList.map((s) => s.subjectId));

    Object.entries(selectedCatalogSubjectIds).forEach(([subId, hours]) => {
      if (existingIds.has(subId)) return;

      const sub = subjectMap.get(subId);
      const isSinfSoati =
        subId === "sub_sinf_soati" ||
        subId === "sub_kelajak" ||
        sub?.name.toLowerCase().includes("sinf soati") ||
        sub?.name.toLowerCase().includes("kelajak");

      let teacherId = "";
      if (isSinfSoati && targetClass.homeroomTeacherId) {
        teacherId = targetClass.homeroomTeacherId;
      } else {
        const suitableTeacher = allTeachers.find((t) => t.subjectIds?.includes(subId));
        teacherId = suitableTeacher ? suitableTeacher.id : allTeachers[0]?.id || "";
      }

      toAdd.push({
        classId: targetClass.id,
        subjectId: subId,
        teacherId,
        weeklyHours: hours,
        groupType: "WHOLE",
      });
    });

    if (toAdd.length > 0) {
      setSubjectsList((prev) => [...prev, ...toAdd]);
    }

    setSelectedCatalogSubjectIds({});
    setIsCatalogOpen(false);
  };

  // Save full curriculum
  const handleSave = () => {
    const validList = subjectsList.filter(
      (s) => s.subjectId && s.teacherId && Number(s.weeklyHours) > 0
    );
    onSave(targetClass.id, validList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col min-w-0">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-border/80 bg-muted/30 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 text-primary flex items-center justify-center font-black text-base shrink-0 shadow-inner border border-primary/20">
              {targetClass.name}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-foreground text-sm sm:text-base tracking-tight truncate">
                  {targetClass.name} sinfi — O'quv Rejasi va Fan Soatlari
                </h3>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full font-black bg-primary/10 text-primary border border-primary/25 shrink-0">
                  {targetClass.grade}-sinf ({is5DayWeek ? "5 kunlik" : "6 kunlik"})
                </span>
                {targetClass.homeroomTeacherId && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25 shrink-0 flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>Rahbar: {teacherMap.get(targetClass.homeroomTeacherId)?.fullName}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                Haftalik dars taqsimoti, fanlar hajmi va mutaxassis o'qituvchilar biriktirilishi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {/* View Mode Switcher */}
            <div className="hidden md:flex items-center bg-muted/80 p-1 rounded-xl border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("LIST")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "LIST"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Fanlar ro'yxati ({subjectsList.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("WEEKLY_GRID")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === "WEEKLY_GRID"
                    ? "bg-card text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Haftalik jadval simulyatsiyasi</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── REAL-TIME PROGRESS & SANPIN HEALTH BAR ───────────────────────── */}
        <div className="px-5 sm:px-7 py-3 bg-muted/20 border-b border-border/60 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Chap: Haftalik soat hisobi va Progress bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-foreground text-sm">
                    {totalWeeklyHours} soat
                  </span>
                  <span className="text-muted-foreground">/ me'yor: ~{recommendedHours} soat</span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    ({academicHours} st fanlar + {homeroomHours} st Kelajak soati)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {unassignedTeachersCount > 0 && (
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{unassignedTeachersCount} ta fanga o'qituvchi tayinlanmagan</span>
                    </span>
                  )}
                  <span
                    className={`font-black text-xs px-2.5 py-0.5 rounded-full border ${
                      isOverloaded
                        ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                        : loadPercent >= 80
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    }`}
                  >
                    {isOverloaded
                      ? "⚠️ SanPiN me'yoridan ortiq"
                      : loadPercent >= 80
                      ? "🟢 Yuklama me'yorda"
                      : "🟡 Yuklama to'liq emas"}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden flex border border-border/40">
                <div
                  className={`h-full transition-all duration-300 rounded-full ${
                    isOverloaded
                      ? "bg-linear-to-r from-amber-500 to-rose-500"
                      : loadPercent >= 80
                      ? "bg-linear-to-r from-emerald-500 to-teal-500"
                      : "bg-linear-to-r from-amber-400 to-amber-500"
                  }`}
                  style={{ width: `${Math.min(100, (totalWeeklyHours / recommendedHours) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR (Action Buttons & Presets) ──────────────────────────── */}
        <div className="px-5 sm:px-7 py-3 bg-muted/40 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Primary Button: Open Visual Subject Catalog Modal */}
            <button
              type="button"
              onClick={() => setIsCatalogOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Fan Qo'shish (Fanlar Katalogi)</span>
            </button>

            {/* 1-Click Davlat Standarti Shablonini Yuklash */}
            <button
              type="button"
              onClick={handleLoadStandardTemplate}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/35 hover:bg-amber-500/25 transition-all shadow-xs cursor-pointer"
              title={`${targetClass.grade}-sinf uchun Davlat ta'lim standarti bo'yicha namunaviy dars soatlarini 1-bosishda avtomatik yuklash`}
            >
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
              <span>⚡ Standart Rejani Yuklash</span>
            </button>

            {/* Boshlang'ich sinf qoidasi (1-4-sinflar): Ona tili, O'qish, Matematika -> Sinf rahbariga */}
            {targetClass.grade <= 4 && (
              <button
                type="button"
                onClick={handleApplyPrimaryHomeroomRule}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/35 hover:bg-indigo-500/25 transition-all shadow-xs cursor-pointer"
                title="Boshlang'ich sinf qoidasi: Ona tili, O'qish va Matematika (1-sinfda Alifbe) hamda Kelajak soatini sinf rahbariga biriktirish"
              >
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>🎯 Boshlang'ich qoida (Ona tili, O'qish, Matematika)</span>
              </button>
            )}

            {/* Boshqa sinfdan nusxa olish */}
            {copyableClasses.length > 0 && (
              <div className="flex items-center gap-1">
                <select
                  value={selectedCopyClassId}
                  onChange={(e) => setSelectedCopyClassId(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-border bg-background cursor-pointer max-w-[150px] truncate font-medium"
                >
                  <option value="">Sinfdan nusxa...</option>
                  {copyableClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.subjects?.length || 0} fan)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleCopyFromOtherClass}
                  disabled={!selectedCopyClassId}
                  className="px-3 py-2 rounded-xl text-xs font-semibold border border-border bg-card hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1"
                  title="Tanlangan sinf fanlarini ko'chirish"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ko'chirish</span>
                </button>
              </div>
            )}
          </div>

          {subjectsList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Tozalash</span>
            </button>
          )}
        </div>

        {/* ── MAIN CONTENT AREA ───────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 min-w-0">
          {subjectsList.length === 0 ? (
            <div className="py-16 text-center rounded-3xl border border-dashed border-border/80 bg-muted/20">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 shadow-inner">
                <BookOpen className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-foreground">
                Ushbu sinfga hali fanlar kiritilmagan
              </h4>
              <p className="text-xs text-muted-foreground mt-1.5 max-w-md mx-auto leading-relaxed">
                Bittalab kiritib o'tirmasdan <strong>"⚡ Standart Rejani Yuklash"</strong> tugmasini
                bosing yoki <strong>"+ Fan Qo'shish"</strong> tugmasi orqali fanlar katalogidan
                tanlang.
              </p>
              <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleLoadStandardTemplate}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-amber-500 text-amber-950 hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{targetClass.grade}-sinf Standart O'quv Rejasini Yuklash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Fanlar Katalogidan Tanlash</span>
                </button>
              </div>
            </div>
          ) : viewMode === "LIST" ? (
            /* 📋 LIST VIEW: DYNAMIC TABLE / CARDS WITH INSTANT STEPPERS & PRESETS */
            <div className="space-y-2.5">
              <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-1.5 text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                <div className="col-span-4">Fan nomi va turi</div>
                <div className="col-span-4">Dars beruvchi o'qituvchi</div>
                <div className="col-span-3 text-center">Haftalik dars soati</div>
                <div className="col-span-1 text-center">O'chirish</div>
              </div>

              {subjectsList.map((item, index) => {
                const sub = subjectMap.get(item.subjectId);
                const teacherCandidates = allTeachers.filter((t) =>
                  t.subjectIds?.includes(item.subjectId)
                );
                const isSinfSoati =
                  item.subjectId === "sub_sinf_soati" ||
                  item.subjectId === "sub_kelajak" ||
                  sub?.name.toLowerCase().includes("sinf soati") ||
                  sub?.name.toLowerCase().includes("kelajak");

                const currentTeacher = teacherMap.get(item.teacherId);
                const hasTeacher = !!item.teacherId;

                return (
                  <div
                    key={`${item.subjectId}_${index}`}
                    className={`flex flex-col md:grid md:grid-cols-12 gap-3 p-3.5 rounded-2xl border transition-all items-center ${
                      isSinfSoati
                        ? "border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs"
                        : hasTeacher
                        ? "border-border/80 bg-card/90 hover:bg-card hover:border-primary/40 hover:shadow-xs"
                        : "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
                    }`}
                  >
                    {/* 1. FAN NOMI & COLOR PILL (Col-4) */}
                    <div className="w-full md:col-span-4 flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-3 h-10 rounded-full shrink-0 shadow-xs"
                        style={{ backgroundColor: isSinfSoati ? "#8B5CF6" : sub?.colorTag || "#3B82F6" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <select
                            value={item.subjectId}
                            onChange={(e) => handleUpdateItem(index, "subjectId", e.target.value)}
                            className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer truncate"
                          >
                            <optgroup
                              label={
                                targetClass.grade <= 4
                                  ? "🧒 Boshlang'ich sinfga mos fanlar (1-4):"
                                  : "🧑‍🎓 Yuqori sinfga mos fanlar (5-11):"
                              }
                            >
                              {allSubjects
                                .filter(
                                  (s) =>
                                    isSubjectSuitableForGrade(s, targetClass.grade) ||
                                    s.id === item.subjectId
                                )
                                .map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.name} ({s.difficultyScore || 5} ball)
                                  </option>
                                ))}
                            </optgroup>
                            {allSubjects.some(
                              (s) =>
                                !isSubjectSuitableForGrade(s, targetClass.grade) &&
                                s.id !== item.subjectId
                            ) && (
                              <optgroup label="📚 Boshqa barcha fanlar:">
                                {allSubjects
                                  .filter(
                                    (s) =>
                                      !isSubjectSuitableForGrade(s, targetClass.grade) &&
                                      s.id !== item.subjectId
                                  )
                                  .map((s) => (
                                    <option key={s.id} value={s.id}>
                                      {s.name} ({s.difficultyScore || 5} ball)
                                    </option>
                                  ))}
                              </optgroup>
                            )}
                          </select>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {isSinfSoati ? (
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1">
                              🎓 Sinf rahbari soati (Dushanba 1-dars)
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              SanPiN: {sub?.difficultyScore || 5} ball
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. O'QITUVCHI TANLASH (Col-4) */}
                    <div className="w-full md:col-span-4 min-w-0">
                      <select
                        value={item.teacherId}
                        onChange={(e) => handleUpdateItem(index, "teacherId", e.target.value)}
                        className={`w-full px-3 py-2 text-xs font-semibold rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer truncate ${
                          !item.teacherId
                            ? "border-amber-400 text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10"
                            : isSinfSoati
                            ? "border-indigo-300 font-bold text-indigo-950 dark:text-indigo-200"
                            : "border-border text-foreground"
                        }`}
                      >
                        <option value="">⚠️ O'qituvchi tanlanmagan</option>
                        {isSinfSoati && targetClass.homeroomTeacherId && (
                          <option value={targetClass.homeroomTeacherId}>
                            ⭐ Sinf rahbari ({teacherMap.get(targetClass.homeroomTeacherId)?.fullName})
                          </option>
                        )}
                        {teacherCandidates.length > 0 && (
                          <optgroup label="⭐️ Mutaxassis o'qituvchilar:">
                            {teacherCandidates.map((t) => (
                              <option key={t.id} value={t.id}>
                                ⭐️ {t.fullName} ({t.weeklyHourCapacity} st)
                              </option>
                            ))}
                          </optgroup>
                        )}
                        <optgroup label="Barcha o'qituvchilar:">
                          {allTeachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullName} ({t.weeklyHourCapacity} st)
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* 3. DARS SOATI STEPPER & PRESET CHIPS (Col-3) */}
                    <div className="w-full md:col-span-3 flex flex-col items-center justify-center gap-1.5 bg-muted/40 md:bg-transparent p-2 md:p-0 rounded-xl">
                      <div className="flex items-center justify-center gap-1.5 w-full">
                        <button
                          type="button"
                          onClick={() => handleStepHours(index, -1)}
                          disabled={item.weeklyHours <= 1}
                          className="w-8 h-8 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-95"
                          title="1 soat kamaytirish"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>

                        <div className="flex items-center justify-center min-w-[54px] px-2 py-1 rounded-xl bg-background border border-border/80 shadow-inner">
                          <span className="text-sm font-black text-foreground">
                            {item.weeklyHours}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-bold ml-1">st</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleStepHours(index, 1)}
                          disabled={item.weeklyHours >= 12}
                          className="w-8 h-8 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-95"
                          title="1 soat oshirish"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Tezkor soat preset pillari */}
                      <div className="flex items-center gap-1">
                        {[1, 2, 4, 6].map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleSetPresetHours(index, p)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              item.weeklyHours === p
                                ? "bg-primary text-primary-foreground shadow-xs"
                                : "bg-muted hover:bg-muted/80 text-muted-foreground"
                            }`}
                          >
                            {p}st
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 4. O'CHIRISH TUGMASI (Col-1) */}
                    <div className="w-full md:col-span-1 flex justify-end md:justify-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveSubject(index)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/15 transition-colors cursor-pointer"
                        title="Fanni o'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* 📅 WEEKLY TIMETABLE SIMULATION GRID */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-foreground">
                      Haftalik Darslar Simulyatsiyasi ({daysCount} kunlik)
                    </h4>
                    <p className="text-[11px] text-muted-foreground">
                      Ushbu fanlar va soatlar haftaning kunlari bo'yicha namunaviy taqsimlanganda
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/20">
                  Kuniga o'rtacha: {(totalWeeklyHours / daysCount).toFixed(1)} soat
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {dayNames.map((dayName, dIdx) => {
                  const dayLessons = weeklyDistribution[dIdx] || [];
                  const dayTotalHours = dayLessons.reduce((acc, cur) => acc + cur.hoursCount, 0);

                  return (
                    <div
                      key={dayName}
                      className="rounded-2xl border border-border/80 bg-card p-3 flex flex-col shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                        <span className="font-extrabold text-xs text-foreground">{dayName}</span>
                        <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                          {dayTotalHours} soat
                        </span>
                      </div>

                      <div className="space-y-1.5 flex-1 overflow-y-auto max-h-56">
                        {dayLessons.length === 0 ? (
                          <div className="py-6 text-center text-xs text-muted-foreground italic">
                            Dars yo'q
                          </div>
                        ) : (
                          dayLessons.map((l, lIdx) => (
                            <div
                              key={lIdx}
                              className="p-2 rounded-xl border border-border/60 bg-muted/30 text-xs flex items-center justify-between gap-1.5"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: l.subject.colorTag || "#3B82F6" }}
                                />
                                <span className="font-bold text-foreground truncate text-[11px]">
                                  {l.subject.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                                {l.teacher ? l.teacher.fullName.split(" ")[0] : "—"}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-t border-border/80 bg-muted/30 shrink-0">
          <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
            <span className="font-extrabold text-foreground">{subjectsList.length} ta fan</span>
            <span>•</span>
            <span className="font-semibold text-foreground">{academicHours} soat asosiy</span>
            <span>+</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {homeroomHours} soat Kelajak soati
            </span>
            <span>=</span>
            <span className="font-black text-primary text-sm">{totalWeeklyHours} soat jami</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all cursor-pointer active:scale-95"
            >
              Yuklamani Saqlash
            </button>
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE SUBJECT CATALOG MODAL (FANLAR KATALOGI & JADVALI) ── */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-sm sm:text-base">
                    Fanlar Katalogidan Tanlash
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {targetClass.name} ({targetClass.grade}-sinf) uchun fanlarni belgilang va soatlarini tanlang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Search & Category Filter Chips */}
            <div className="p-4 sm:px-6 border-b border-border/60 bg-muted/20 space-y-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Fan nomi yoki qisqartmasi bo'yicha qidiring (masalan: Ona tili, Fizika)..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
                {catalogSearch && (
                  <button
                    onClick={() => setCatalogSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Categories */}
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                {[
                  { id: "RECOMMENDED", label: `⭐ ${targetClass.grade}-sinfga mos`, icon: Sparkle },
                  { id: "ALL", label: "Barcha fanlar", icon: Layers },
                  { id: "EXACT_SCIENCE", label: "📐 Aniq fanlar", icon: null },
                  { id: "LANGUAGES", label: "🗣️ Tillar", icon: null },
                  { id: "NATURAL", label: "🌿 Tabiiy-ilmiy", icon: null },
                  { id: "ARTS_SPORTS", label: "🎨 San'at & Sport", icon: null },
                  { id: "SOCIAL", label: "⚖️ Ijtimoiy", icon: null },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCatalogCategory(cat.id as SubjectCategory)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                      catalogCategory === cat.id
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid of Interactive Subject Cards */}
            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
              {filteredCatalogSubjects.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  Qidiruv bo'yicha hech qanday fan topilmadi
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredCatalogSubjects.map((sub) => {
                    const isAlreadyAdded = subjectsList.some((s) => s.subjectId === sub.id);
                    const isSelected = selectedCatalogSubjectIds[sub.id] !== undefined;
                    const selectedHours =
                      selectedCatalogSubjectIds[sub.id] || gradeTemplateDefaultHours.get(sub.id) || 2;
                    const specializedTeachersCount = allTeachers.filter((t) =>
                      t.subjectIds?.includes(sub.id)
                    ).length;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => !isAlreadyAdded && handleToggleCatalogSubject(sub.id)}
                        className={`p-3.5 rounded-2xl border transition-all select-none flex flex-col justify-between ${
                          isAlreadyAdded
                            ? "border-emerald-500/30 bg-emerald-500/5 opacity-60 cursor-not-allowed"
                            : isSelected
                            ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md cursor-pointer scale-[1.01]"
                            : "border-border/80 bg-card hover:border-primary/40 hover:shadow-xs cursor-pointer"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                              style={{ backgroundColor: sub.colorTag || "#3B82F6" }}
                            />
                            <div className="min-w-0">
                              <h5 className="font-extrabold text-xs text-foreground truncate">
                                {sub.name}
                              </h5>
                              <p className="text-[10px] text-muted-foreground">
                                SanPiN: {sub.difficultyScore || 5} ball • {specializedTeachersCount} ta ustoz
                              </p>
                            </div>
                          </div>

                          {isAlreadyAdded ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Qo'shilgan</span>
                            </span>
                          ) : (
                            <div
                              className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground shadow-xs"
                                  : "border-border bg-background"
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          )}
                        </div>

                        {/* Card bottom: Hours Adjuster if Selected */}
                        {!isAlreadyAdded && isSelected && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="mt-3 pt-2.5 border-t border-primary/20 flex items-center justify-between text-xs"
                          >
                            <span className="text-[11px] font-bold text-primary">
                              Haftalik soat:
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleStepCatalogHours(sub.id, -1, e)}
                                disabled={selectedHours <= 1}
                                className="w-6 h-6 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-black text-xs px-2 py-0.5 rounded-md bg-background border border-border min-w-[28px] text-center">
                                {selectedHours}st
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleStepCatalogHours(sub.id, 1, e)}
                                disabled={selectedHours >= 10}
                                className="w-6 h-6 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Bottom Bar with Batch Add Button */}
            <div className="p-4 sm:px-6 border-t border-border/80 bg-muted/40 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs font-semibold text-muted-foreground">
                Tanlandi:{" "}
                <span className="font-black text-foreground">
                  {Object.keys(selectedCatalogSubjectIds).length} ta yangi fan
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCatalogOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleAddSelectedFromCatalog}
                  disabled={Object.keys(selectedCatalogSubjectIds).length === 0}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  Tanlangan ({Object.keys(selectedCatalogSubjectIds).length} ta) fanni qo'shish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TASDIQLASH MODALI (Zamonaviy UI Confirm) ── */}
      <ConfirmActionModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          setSubjectsList([]);
          setIsClearConfirmOpen(false);
          showToast("Barcha fanlar yuklamasi tozalandi");
        }}
        title="O'quv rejasini tozalash"
        description="Haqiqatan ham ushbu sinfning barcha fanlar yuklamasini tozalamoqchimisiz?"
        confirmText="Ha, tozalansin"
        cancelText="Bekor qilish"
        variant="danger"
      />

      {/* ── TOAST XABARNOMA ── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[1000] px-4 py-3 rounded-2xl shadow-xl bg-slate-900 text-white text-xs font-bold transition-all animate-in slide-in-from-bottom-2">
          {toastMessage}
        </div>
      )}
    </div>
  );
};
