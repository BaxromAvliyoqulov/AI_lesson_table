"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Teacher, Subject, SchoolClass } from "@/types";
import { ClassSelectCombobox } from "../shared/ClassSelectCombobox";
import { getEffectiveTeacherMethodDay } from "@/lib/constants/method-days";
import { isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import {
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  GraduationCap,
  FileSpreadsheet,
  Loader2,
  BookOpen,
  X,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Check,
  Activity,
  Layers,
  Upload,
} from "lucide-react";

interface TeachersTabProps {
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  schoolName?: string;
  onAddTeacher: () => void;
  onEditTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
  onSetTeacherHomeroomClass?: (teacherId: string, classId: string | null) => void;
  onOpenTeacherWorkload?: (teacher: Teacher) => void;
  onOpenEMaktabImport?: () => void;
}

const WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

type HomeroomFilterType = "ALL" | "HOMEROOM_ONLY" | "NON_HOMEROOM";
type WorkloadFilterType = "ALL" | "OPTIMAL" | "UNDERLOADED" | "OVERLOADED";

export const TeachersTab: React.FC<TeachersTabProps> = ({
  teachers,
  subjects,
  classes,
  schoolName,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
  onSetTeacherHomeroomClass,
  onOpenTeacherWorkload,
  onOpenEMaktabImport,
}) => {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [homeroomFilter, setHomeroomFilter] = useState<HomeroomFilterType>("ALL");
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilterType>("ALL");
  const [isExporting, setIsExporting] = useState(false);

  // Quick homeroom assignment modal state
  const [quickHomeroomTeacher, setQuickHomeroomTeacher] = useState<Teacher | null>(null);
  const [quickClassId, setQuickClassId] = useState<string>("");

  // O'chirishni tasdiqlash modali va Toast
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  /**
   * Universal Homeroom Class Resolver
   */
  const getTeacherHomeroomClass = useCallback(
    (teacher: Teacher): SchoolClass | null => {
      if (teacher.homeroomClassId) {
        if (classMap.has(teacher.homeroomClassId)) {
          return classMap.get(teacher.homeroomClassId)!;
        }
        const rawTarget = teacher.homeroomClassId.trim().toLowerCase();
        const normTarget = rawTarget.replace(/[^a-z0-9]/g, "");
        const byName = classes.find(
          (c) =>
            c.name.toLowerCase() === rawTarget ||
            c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normTarget ||
            c.id.toLowerCase() === rawTarget
        );
        if (byName) return byName;
      }

      // Reverse match: class with this teacher as homeroomTeacherId
      const byTeacherId = classes.find(
        (c) =>
          c.homeroomTeacherId === teacher.id ||
          c.homeroomTeacherId === teacher.fullName ||
          (teacher.displayNumber && c.homeroomTeacherId === `t_${teacher.displayNumber}`)
      );
      if (byTeacherId) return byTeacherId;

      // Sinf soati / Kelajak soati match
      const bySinfSoati = classes.find((c) =>
        c.subjects?.some(
          (s) =>
            (s.subjectId === "sub_sinf_soati" ||
              s.subjectId === "sub_kelajak" ||
              s.subjectId?.toLowerCase().includes("sinf_soati") ||
              s.subjectId?.toLowerCase().includes("kelajak")) &&
            s.teacherId === teacher.id
        )
      );
      if (bySinfSoati) return bySinfSoati;

      return null;
    },
    [classes, classMap]
  );

  // 1. Calculate each teacher's assigned hours and class count (Sinf rahbari soati ham dars yuklamasiga kiradi)
  const teacherWorkloadMap = useMemo(() => {
    const map = new Map<string, { assignedHours: number; classCount: number }>();
    teachers.forEach((t) => {
      let hours = 0;
      const classSet = new Set<string>();
      classes.forEach((c) => {
        (c.subjects || []).forEach((cs) => {
          if (cs.teacherId === t.id) {
            hours += Number(cs.weeklyHours) || 0;
            classSet.add(c.id);
          }
        });
      });

      // KAFOLAT: Agar o'qituvchi sinf rahbari bo'lsa, kamida o'z sinfidagi 1 soatlik Sinf soati uning yuklamasiga qo'shiladi!
      const homeroomClass = getTeacherHomeroomClass(t);
      if (homeroomClass) {
        classSet.add(homeroomClass.id);
        const hasSinfSoatiInSubs = (homeroomClass.subjects || []).some(
          (cs) => cs.teacherId === t.id && isKelajakOrSinfSoatiSubject(cs.subjectId)
        );
        if (!hasSinfSoatiInSubs && hours === 0) {
          hours += 1;
        }
      }

      map.set(t.id, { assignedHours: hours, classCount: classSet.size });
    });
    return map;
  }, [teachers, classes, subjectMap, getTeacherHomeroomClass]);

  // 2. Global Aggregations for Top Status Bars
  const totalCapacityHours = useMemo(
    () => teachers.reduce((sum, t) => sum + (Number(t.weeklyHourCapacity) || 20), 0),
    [teachers]
  );

  const totalAssignedHours = useMemo(() => {
    let sum = 0;
    teacherWorkloadMap.forEach((val) => {
      sum += val.assignedHours;
    });
    return sum;
  }, [teacherWorkloadMap]);

  const globalWorkloadPercentage =
    totalCapacityHours > 0
      ? Math.min(100, Math.round((totalAssignedHours / totalCapacityHours) * 100))
      : 0;

  // Workload Category Counts
  const { optimalCount, underloadedCount, overloadedCount } = useMemo(() => {
    let optimal = 0;
    let under = 0;
    let over = 0;

    teachers.forEach((t) => {
      const assigned = teacherWorkloadMap.get(t.id)?.assignedHours || 0;
      const cap = Number(t.weeklyHourCapacity) || 20;
      const pct = (assigned / cap) * 100;
      if (pct > 100) over++;
      else if (pct >= 80) optimal++;
      else under++;
    });

    return { optimalCount: optimal, underloadedCount: under, overloadedCount: over };
  }, [teachers, teacherWorkloadMap]);

  // Homeroom Counts
  const homeroomCount = useMemo(
    () => teachers.filter((t) => !!getTeacherHomeroomClass(t)).length,
    [teachers, getTeacherHomeroomClass]
  );
  const nonHomeroomCount = teachers.length - homeroomCount;

  const homeroomPercentage =
    classes.length > 0
      ? Math.min(100, Math.round((homeroomCount / classes.length) * 100))
      : 0;

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    let list = teachers;

    if (subjectFilter !== "ALL") {
      list = list.filter((t) => t.subjectIds.includes(subjectFilter));
    }

    if (homeroomFilter === "HOMEROOM_ONLY") {
      list = list.filter((t) => !!getTeacherHomeroomClass(t));
    } else if (homeroomFilter === "NON_HOMEROOM") {
      list = list.filter((t) => !getTeacherHomeroomClass(t));
    }

    if (workloadFilter !== "ALL") {
      list = list.filter((t) => {
        const assigned = teacherWorkloadMap.get(t.id)?.assignedHours || 0;
        const cap = Number(t.weeklyHourCapacity) || 20;
        const pct = (assigned / cap) * 100;
        if (workloadFilter === "OVERLOADED") return pct > 100;
        if (workloadFilter === "OPTIMAL") return pct >= 80 && pct <= 100;
        if (workloadFilter === "UNDERLOADED") return pct < 80;
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        if (t.fullName.toLowerCase().includes(q)) return true;
        if (t.phone && t.phone.toLowerCase().includes(q)) return true;
        const hClass = getTeacherHomeroomClass(t);
        if (hClass && hClass.name.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [teachers, subjectFilter, homeroomFilter, workloadFilter, search, getTeacherHomeroomClass, teacherWorkloadMap]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teachers, subjects, classes, schoolName }),
      });
      if (!res.ok) throw new Error("Export xatosi");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename\*=UTF-8''(.+)/)?.[1]
        ? decodeURIComponent(res.headers.get("Content-Disposition")!.match(/filename\*=UTF-8''(.+)/)![1])
        : `oqituvchilar_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast("Excel yuklashda xatolik yuz berdi", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveQuickHomeroom = () => {
    if (!quickHomeroomTeacher || !onSetTeacherHomeroomClass) return;
    onSetTeacherHomeroomClass(quickHomeroomTeacher.id, quickClassId || null);
    setQuickHomeroomTeacher(null);
  };

  return (
    <div className="space-y-4">
      {/* ── 1. GLOBAL STATUS BARS DASHBOARD ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Status Bar 1: Jami Stavka Yuklamasi */}
        <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Umumiy Dars Yuklamasi</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
              {globalWorkloadPercentage}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-lg font-black text-foreground">
                {totalAssignedHours}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {totalCapacityHours} soat
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground">
                {teachers.length} ta o'qituvchi
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2.5 rounded-full bg-muted/60 overflow-hidden p-0.5 border border-border/40">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  globalWorkloadPercentage >= 80 && globalWorkloadPercentage <= 100
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : globalWorkloadPercentage > 100
                    ? "bg-gradient-to-r from-amber-500 to-rose-500"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500"
                }`}
                style={{ width: `${Math.min(100, (totalAssignedHours / (totalCapacityHours || 1)) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Status Bar 2: O'qituvchilar Taqsimot Holati */}
        <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>Stavka Taqsimoti</span>
            </span>
            <span className="text-xs text-muted-foreground font-semibold">
              Jami: {teachers.length} nafar
            </span>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1.5 text-center">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-1.5">
                <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {optimalCount}
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  🟢 To'liq (80-100%)
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-1.5">
                <div className="text-sm font-black text-amber-700 dark:text-amber-300">
                  {underloadedCount}
                </div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                  🟡 Bo'sh (&lt;80%)
                </div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-1.5">
                <div className="text-sm font-black text-rose-700 dark:text-rose-300">
                  {overloadedCount}
                </div>
                <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                  🔴 Ortiqcha (&gt;100%)
                </div>
              </div>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden flex">
              <div
                style={{ width: `${teachers.length ? (optimalCount / teachers.length) * 100 : 0}%` }}
                className="bg-emerald-500 h-full transition-all duration-300"
                title={`To'liq stavka: ${optimalCount} nafar`}
              />
              <div
                style={{ width: `${teachers.length ? (underloadedCount / teachers.length) * 100 : 0}%` }}
                className="bg-amber-400 h-full transition-all duration-300"
                title={`Bo'sh soatli: ${underloadedCount} nafar`}
              />
              <div
                style={{ width: `${teachers.length ? (overloadedCount / teachers.length) * 100 : 0}%` }}
                className="bg-rose-500 h-full transition-all duration-300"
                title={`Ortiqcha yuklama: ${overloadedCount} nafar`}
              />
            </div>
          </div>
        </div>

        {/* Status Bar 3: Sinf Rahbarligi Qamrovi */}
        <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sinf Rahbarligi Qamrovi</span>
            </span>
            <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
              {homeroomPercentage}%
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between text-xs">
              <span className="text-lg font-black text-foreground">
                {homeroomCount}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  / {classes.length} ta sinfga biriktirilgan
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground font-medium">
                {classes.length - homeroomCount > 0 ? (
                  <span className="text-rose-500 font-bold">
                    {classes.length - homeroomCount} ta bo'sh
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold">Hammasi to'liq</span>
                )}
              </span>
            </div>

            {/* Progress Track */}
            <div className="w-full h-2.5 rounded-full bg-muted/60 overflow-hidden p-0.5 border border-border/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${homeroomPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. TOP TOOLBAR (Search + Filters + Actions) ────────────────────── */}
      <div className="flex flex-col gap-3.5 p-4 rounded-3xl bg-card border border-border shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Chap: Qidiruv va Fan filtri */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Ism, telefon yoki sinf bo'yicha qidiring..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
              />
            </div>

            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer font-medium shrink-0"
            >
              <option value="ALL">Barcha fanlar ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* O'ng: Excel va Yangi o'qituvchi */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <button
              id="teachers-export-excel"
              onClick={handleExportExcel}
              disabled={isExporting || teachers.length === 0}
              title="O'qituvchilar ro'yxatini Excel formatida yuklab olish"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-green-500/30 bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  Yuklanmoqda...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
                  Excel ({teachers.length})
                </>
              )}
            </button>

            {/* eMaktab Import Tugmasi */}
            {onOpenEMaktabImport && (
              <button
                type="button"
                onClick={onOpenEMaktabImport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 transition-all cursor-pointer shrink-0"
                title="eMaktab (Kundalik) Excel faylidan o'qituvchilarni yuklash"
              >
                <Upload className="w-3.5 h-3.5 shrink-0" />
                <span>eMaktab Import</span>
              </button>
            )}

            <button
              onClick={onAddTeacher}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Yangi o'qituvchi</span>
            </button>
          </div>
        </div>

        {/* ── FILTR TABLARI (Sinf Rahbarligi & Stavka Yuklamasi) ───────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-border/60">
          {/* Sinf Rahbarligi Filtrlar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setHomeroomFilter("ALL")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                homeroomFilter === "ALL"
                  ? "bg-foreground text-background shadow-xs font-bold"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              <span>Barchasi</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10 font-bold">
                {teachers.length}
              </span>
            </button>

            <button
              onClick={() => setHomeroomFilter("HOMEROOM_ONLY")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                homeroomFilter === "HOMEROOM_ONLY"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 shrink-0" />
              <span>🎓 Sinf rahbarlari</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-white/20 font-bold">
                {homeroomCount}
              </span>
            </button>

            <button
              onClick={() => setHomeroomFilter("NON_HOMEROOM")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                homeroomFilter === "NON_HOMEROOM"
                  ? "bg-slate-700 text-white shadow-xs font-bold"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              <span>Rahbar bo'lmaganlar</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10 font-bold">
                {nonHomeroomCount}
              </span>
            </button>
          </div>

          {/* Yuklama Statusi Filtrlar */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setWorkloadFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                workloadFilter === "ALL"
                  ? "bg-muted text-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Yuklama: Hammasi
            </button>
            <button
              onClick={() => setWorkloadFilter("OPTIMAL")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                workloadFilter === "OPTIMAL"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30"
                  : "text-muted-foreground hover:text-emerald-600"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>To'liq ({optimalCount})</span>
            </button>
            <button
              onClick={() => setWorkloadFilter("UNDERLOADED")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                workloadFilter === "UNDERLOADED"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30"
                  : "text-muted-foreground hover:text-amber-600"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Bo'sh ({underloadedCount})</span>
            </button>
            <button
              onClick={() => setWorkloadFilter("OVERLOADED")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                workloadFilter === "OVERLOADED"
                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold border border-rose-500/30"
                  : "text-muted-foreground hover:text-rose-600"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Ortiqcha ({overloadedCount})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. TEACHERS GRID ───────────────────────────────────────────────── */}
      {filteredTeachers.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">O'qituvchi topilmadi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Qidiruv so'zini yoki tanlangan filtrlarni o'zgartiring
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 min-w-0">
          {filteredTeachers.map((teacher) => {
            const homeroomClass = getTeacherHomeroomClass(teacher);
            let teacherSubs = teacher.subjectIds
              .map((id) => subjectMap.get(id))
              .filter(Boolean) as Subject[];

            // Agar o'qituvchi sinf rahbari bo'lsa, uning fanlari qatoriga "Sinf soati" ham albatta qo'shiladi!
            if (homeroomClass) {
              const hasSinfSoati = teacherSubs.some((s) => isKelajakOrSinfSoatiSubject(s.id, s.name));
              if (!hasSinfSoati) {
                const sinfSoatiSub =
                  subjects.find((s) => isKelajakOrSinfSoatiSubject(s.id, s.name)) ||
                  subjectMap.get("sub_sinf_soati") ||
                  ({
                    id: "sub_sinf_soati",
                    name: "Sinf soati",
                    shortName: "Sinf soati",
                    colorTag: "#6366f1",
                    schoolId: teacher.schoolId,
                  } as Subject);
                teacherSubs = [...teacherSubs, sinfSoatiSub];
              }
            }
            const workload = teacherWorkloadMap.get(teacher.id) || {
              assignedHours: 0,
              classCount: 0,
            };

            const capacity = Number(teacher.weeklyHourCapacity) || 20;
            const workloadPct = Math.round((workload.assignedHours / capacity) * 100);
            const isOptimal = workloadPct >= 80 && workloadPct <= 100;
            const isOverloaded = workloadPct > 100;

            const isSelected = selectedTeacherId === teacher.id;

            return (
              <div
                key={teacher.id}
                onClick={() => setSelectedTeacherId(isSelected ? null : teacher.id)}
                className={`flex flex-col justify-between p-4 rounded-3xl transition-all min-w-0 overflow-hidden space-y-3 cursor-pointer ${
                  isSelected
                    ? "border-2 border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-xl shadow-blue-500/15 ring-4 ring-blue-500/20 scale-[1.015]"
                    : "border border-border/80 bg-card/80 hover:bg-card hover:border-primary/40 hover:shadow-lg"
                }`}
              >
                <div className="min-w-0">
                  {/* Top card header: Avatar + Name + Phone + Action buttons */}
                  <div className="flex items-start justify-between gap-2 mb-2.5 min-w-0">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shadow-inner shrink-0 mt-0.5 transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        {teacher.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            className="font-bold text-foreground text-sm leading-snug break-words"
                            title={teacher.fullName}
                          >
                            {teacher.fullName}
                          </h4>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black tracking-wide flex items-center gap-0.5 shadow-xs shrink-0">
                              <Check className="w-2.5 h-2.5" /> Tanlangan
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          <span className="break-all">{teacher.phone || "Telefon yo'q"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditTeacher(teacher);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTeacherToDelete(teacher);
                        }}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ── TEACHER CARD LIVE WORKLOAD STATUS BAR ───────────────── */}
                  <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/70 mb-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary shrink-0" />
                        <span>Dars yuklamasi:</span>
                      </span>
                      <span className="font-black text-foreground">
                        {workload.assignedHours}{" "}
                        <span className="font-normal text-muted-foreground">/ {capacity} st</span>
                      </span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full h-2 rounded-full bg-muted/80 overflow-hidden p-0.5 border border-border/30">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverloaded
                            ? "bg-rose-500"
                            : isOptimal
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.min(100, workloadPct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] pt-0.5">
                      <span
                        className={`font-bold px-1.5 py-0.2 rounded-md ${
                          isOverloaded
                            ? "text-rose-700 dark:text-rose-300 bg-rose-500/10"
                            : isOptimal
                            ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                            : "text-amber-700 dark:text-amber-300 bg-amber-500/10"
                        }`}
                      >
                        {isOverloaded
                          ? `🔴 +${workload.assignedHours - capacity} st ortiqcha`
                          : isOptimal
                          ? "🟢 Optimal stavka"
                          : `🟡 ${capacity - workload.assignedHours} st bo'sh`}
                      </span>
                      <span className="font-extrabold text-foreground">{workloadPct}%</span>
                    </div>
                  </div>

                  {/* Metadata Container */}
                  <div className="space-y-2 text-xs text-muted-foreground bg-muted/10 p-2.5 rounded-2xl border border-border/50 mb-2.5 min-w-0">
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>Metod kuni:</span>
                      </span>
                      <span className="font-semibold text-foreground shrink-0 text-right truncate">
                        {(() => {
                          const eff = getEffectiveTeacherMethodDay(teacher, subjects);
                          if (!eff.day) {
                            return <span className="text-[10px] text-muted-foreground">Belgilanmagan</span>;
                          }
                          const isCustom = eff.source === "TEACHER_EXPLICIT";
                          return (
                            <span
                              className={`px-2 py-0.5 rounded font-bold text-[10px] border inline-flex items-center gap-1 ${
                                isCustom
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                  : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25"
                              }`}
                              title={
                                isCustom
                                  ? "O'qituvchiga shaxsiy belgilangan metod kuni"
                                  : `${eff.subjectName || "Fan"} rasmiy standarti bo'yicha avtomatik belgilangan`
                              }
                            >
                              <span>{eff.dayName}</span>
                              {!isCustom && eff.subjectName && (
                                <span className="opacity-75 text-[9px]">({eff.subjectName.slice(0, 8)})</span>
                              )}
                            </span>
                          );
                        })()}
                      </span>
                    </div>

                    {/* Sinf rahbari qatori */}
                    <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 min-w-0">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground shrink-0">
                        <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Sinf rahbari:</span>
                      </span>
                      {homeroomClass ? (
                        <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black text-xs truncate max-w-[70px]">
                            {homeroomClass.name}
                          </span>
                          {onSetTeacherHomeroomClass && (
                            <button
                              type="button"
                              onClick={() => {
                                setQuickHomeroomTeacher(teacher);
                                setQuickClassId(homeroomClass.id);
                              }}
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
                              title="Sinfni o'zgartirish"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 shrink-0">
                          {onSetTeacherHomeroomClass ? (
                            <button
                              type="button"
                              onClick={() => {
                                setQuickHomeroomTeacher(teacher);
                                setQuickClassId("");
                              }}
                              className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                              title="Sinf rahbarligini biriktirish"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Biriktirish</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-muted-foreground italic shrink-0">
                              Yo'q
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Subject tags */}
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Fanlari ({teacherSubs.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar min-w-0">
                    {teacherSubs.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground italic">
                        Fan biriktirilmagan
                      </span>
                    ) : (
                      teacherSubs.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border max-w-full truncate shrink-0"
                          style={{
                            backgroundColor: `${s.colorTag}15`,
                            color: s.colorTag,
                            borderColor: `${s.colorTag}30`,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: s.colorTag }}
                          />
                          <span className="truncate max-w-[120px]">{s.name}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Workload button */}
                {onOpenTeacherWorkload && (
                  <button
                    type="button"
                    onClick={() => onOpenTeacherWorkload(teacher)}
                    className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shrink-0 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs"
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Dars taqsimoti ({workload.assignedHours} st stavka • {workload.classCount} sinf)
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── TEZKOR SINF RAHBARI BIRIKTIRISH MODALI ───────────────────────── */}
      {quickHomeroomTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-foreground truncate">
                    Sinf Rahbarligini Belgilash
                  </h3>
                  <p className="text-xs text-primary font-semibold truncate">
                    {quickHomeroomTeacher.fullName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickHomeroomTeacher(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-muted-foreground">
                Biriktiriladigan sinfni tanlang:
              </label>

              <ClassSelectCombobox
                classes={classes}
                value={quickClassId}
                onChange={(cId) => setQuickClassId(cId)}
                placeholder="Sinfni qidiring..."
              />

              <p className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/60">
                💡 Sinf rahbari biriktirilganda, ushbu sinfning <strong>Dushanba 1-soat</strong> dars jadvaliga avtomatik tarzda &quot;Kelajak soati&quot; belgilanadi.
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/80">
              <button
                type="button"
                onClick={() => {
                  if (onSetTeacherHomeroomClass) {
                    onSetTeacherHomeroomClass(quickHomeroomTeacher.id, null);
                  }
                  setQuickHomeroomTeacher(null);
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                Rahbarlikni bekor qilish
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuickHomeroomTeacher(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuickHomeroom}
                  disabled={!quickClassId}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  Biriktirish
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TASDIQLASH MODALI (Zamonaviy UI Confirm) ── */}
      <ConfirmActionModal
        isOpen={!!teacherToDelete}
        onClose={() => setTeacherToDelete(null)}
        onConfirm={() => {
          if (teacherToDelete) {
            onDeleteTeacher(teacherToDelete.id);
            showToast(`"${teacherToDelete.fullName}" o'qituvchisi muvaffaqiyatli o'chirildi`);
            setTeacherToDelete(null);
          }
        }}
        title="O'qituvchini o'chirish"
        description={`"${teacherToDelete?.fullName}" o'qituvchisini ro'yxatdan o'chirishni tasdiqlaysizmi? Unga biriktirilgan barcha darslar va yuklamalar ham bo'shatiladi.`}
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
        variant="danger"
      />

      {/* ── TOAST XABARNOMA ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[1000] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-bottom-2 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/30"
              : "bg-rose-600 text-white shadow-rose-600/30"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
