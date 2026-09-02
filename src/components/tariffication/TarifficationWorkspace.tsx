"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  SchoolClass,
  Subject,
  Teacher,
  Branch,
  ClassSubject,
} from "@/types";
import {
  STANDARD_PRIMARY_CURRICULUM,
  STANDARD_HIGH_CURRICULUM,
  isSubjectSuitableForGrade,
} from "@/lib/curriculum-templates";
import {
  GraduationCap,
  Users,
  Building2,
  Sparkles,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  ArrowLeft,
  LayoutGrid,
  FileSpreadsheet,
  Filter,
  Copy,
  BookOpen,
  HelpCircle,
  Clock,
  Layers,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface TarifficationWorkspaceProps {
  initialClasses: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  branches: Branch[];
  schoolName: string;
  onSaveClassSubjects: (updatedClasses: SchoolClass[]) => Promise<void> | void;
  onGenerateAI?: () => void;
  isGenerating?: boolean;
}

type ViewMode = "BY_CLASS" | "BY_TEACHER" | "MATRIX";

export const TarifficationWorkspace: React.FC<TarifficationWorkspaceProps> = ({
  initialClasses,
  subjects,
  teachers,
  branches,
  schoolName,
  onSaveClassSubjects,
  onGenerateAI,
  isGenerating = false,
}) => {
  const router = useRouter();
  const [classesData, setClassesData] = useState<SchoolClass[]>(initialClasses);
  const [viewMode, setViewMode] = useState<ViewMode>("BY_CLASS");
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [stageFilter, setStageFilter] = useState<"ALL" | "PRIMARY" | "HIGH">("ALL");

  // Selection states
  const [activeClassId, setActiveClassId] = useState<string>(initialClasses[0]?.id || "");
  const [activeTeacherId, setActiveTeacherId] = useState<string>(teachers[0]?.id || "");

  // Search queries
  const [searchClassQuery, setSearchClassQuery] = useState<string>("");
  const [searchSubjectQuery, setSearchSubjectQuery] = useState<string>("");
  const [searchTeacherQuery, setSearchTeacherQuery] = useState<string>("");
  const [teacherFilterSubjectId, setTeacherFilterSubjectId] = useState<string>("ALL");

  // Notification Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Sync if initialClasses change
  useEffect(() => {
    setClassesData(initialClasses);
  }, [initialClasses]);

  // Maps
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);

  // Alifbo bo'yicha tartiblangan o'qituvchilar
  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.fullName.localeCompare(b.fullName, "uz"));
  }, [teachers]);

  // Real-time Teacher Assigned Hours
  const teacherAssignedHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const cls of classesData) {
      if (cls.isClosed) continue;
      for (const cs of cls.subjects) {
        if (cs.teacherId) {
          map.set(cs.teacherId, (map.get(cs.teacherId) || 0) + cs.weeklyHours);
        }
      }
    }
    return map;
  }, [classesData]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    return classesData.filter((c) => {
      if (selectedBranchId !== "ALL" && c.branchId !== selectedBranchId) return false;
      if (stageFilter === "PRIMARY" && !c.isPrimary && c.grade > 4) return false;
      if (stageFilter === "HIGH" && (c.isPrimary || c.grade <= 4)) return false;
      if (searchClassQuery.trim()) {
        const q = searchClassQuery.toLowerCase().trim();
        if (!c.name.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [classesData, selectedBranchId, stageFilter, searchClassQuery]);

  // Active Class
  const activeClass = useMemo(() => {
    const found = classesData.find((c) => c.id === activeClassId);
    return found || filteredClasses[0] || classesData[0];
  }, [classesData, activeClassId, filteredClasses]);

  // Active Teacher
  const activeTeacher = useMemo(() => {
    const found = teachers.find((t) => t.id === activeTeacherId);
    return found || sortedTeachers[0] || teachers[0];
  }, [teachers, activeTeacherId, sortedTeachers]);

  // Total school hours stats
  const totalSchoolHours = useMemo(() => {
    let total = 0;
    classesData.forEach((c) => {
      if (!c.isClosed) {
        c.subjects.forEach((cs) => (total += cs.weeklyHours));
      }
    });
    return total;
  }, [classesData]);

  // ── UPDATE HELPERS ────────────────────────────────────────────────────────
  const handleUpdateSubject = (
    classId: string,
    subjectId: string,
    teacherId: string,
    weeklyHours: number
  ) => {
    setClassesData((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const exists = cls.subjects.some((cs) => cs.subjectId === subjectId);
        let updated: ClassSubject[];

        if (weeklyHours <= 0) {
          updated = cls.subjects.filter((cs) => cs.subjectId !== subjectId);
        } else if (exists) {
          updated = cls.subjects.map((cs) =>
            cs.subjectId === subjectId ? { ...cs, teacherId, weeklyHours } : cs
          );
        } else {
          updated = [
            ...cls.subjects,
            { classId: cls.id, subjectId, teacherId, weeklyHours, groupType: "WHOLE" },
          ];
        }
        return { ...cls, subjects: updated };
      })
    );
  };

  // 1-Click Load Standard Curriculum for Active Class
  const handleLoadStandardForClass = (targetClass: SchoolClass) => {
    const isPrim = targetClass.isPrimary || targetClass.grade <= 4;
    const template = isPrim ? STANDARD_PRIMARY_CURRICULUM : STANDARD_HIGH_CURRICULUM;

    const teacherLookup = new Map(targetClass.subjects.map((s) => [s.subjectId, s.teacherId]));

    const newSubjects: ClassSubject[] = template
      .map((item) => {
        const subObj = subjects.find(
          (s) =>
            s.name.toLowerCase() === item.subjectName.toLowerCase() ||
            (s.shortName && s.shortName.toLowerCase() === item.subjectName.toLowerCase())
        );
        if (!subObj) return null;

        let teacherId = teacherLookup.get(subObj.id) || "";
        if (!teacherId) {
          const eligible = teachers.filter((t) => (t.subjectIds || []).includes(subObj.id));
          if (eligible.length > 0) {
            eligible.sort((a, b) => {
              const aH = teacherAssignedHours.get(a.id) || 0;
              const bH = teacherAssignedHours.get(b.id) || 0;
              return aH - bH;
            });
            teacherId = eligible[0].id;
          }
        }

        return {
          classId: targetClass.id,
          subjectId: subObj.id,
          teacherId: teacherId || "",
          weeklyHours: item.weeklyHours,
          groupType: "WHOLE" as const,
        };
      })
      .filter(Boolean) as ClassSubject[];

    setClassesData((prev) =>
      prev.map((cls) => (cls.id === targetClass.id ? { ...cls, subjects: newSubjects } : cls))
    );

    showToast(`✅ ${targetClass.name} sinfiga davlat standarti bo'yicha ${newSubjects.length} ta fan yuklandi!`);
  };

  // 1-Click Load Standard for ALL filtered classes
  const handleLoadStandardForAllClasses = () => {
    if (!window.confirm("Barcha tanlangan sinflarga davlat o'quv rejasini yuklashni tasdiqlaysizmi?")) return;

    setClassesData((prev) =>
      prev.map((cls) => {
        if (selectedBranchId !== "ALL" && cls.branchId !== selectedBranchId) return cls;
        if (stageFilter === "PRIMARY" && !cls.isPrimary && cls.grade > 4) return cls;
        if (stageFilter === "HIGH" && (cls.isPrimary || cls.grade <= 4)) return cls;

        const isPrim = cls.isPrimary || cls.grade <= 4;
        const template = isPrim ? STANDARD_PRIMARY_CURRICULUM : STANDARD_HIGH_CURRICULUM;
        const teacherLookup = new Map(cls.subjects.map((s) => [s.subjectId, s.teacherId]));

        const newSubjects: ClassSubject[] = template
          .map((item) => {
            const subObj = subjects.find(
              (s) =>
                s.name.toLowerCase() === item.subjectName.toLowerCase() ||
                (s.shortName && s.shortName.toLowerCase() === item.subjectName.toLowerCase())
            );
            if (!subObj) return null;

            let teacherId = teacherLookup.get(subObj.id) || "";
            if (!teacherId) {
              const eligible = teachers.filter((t) => (t.subjectIds || []).includes(subObj.id));
              if (eligible.length > 0) {
                eligible.sort((a, b) => (teacherAssignedHours.get(a.id) || 0) - (teacherAssignedHours.get(b.id) || 0));
                teacherId = eligible[0].id;
              }
            }

            return {
              classId: cls.id,
              subjectId: subObj.id,
              teacherId: teacherId || "",
              weeklyHours: item.weeklyHours,
              groupType: "WHOLE" as const,
            };
          })
          .filter(Boolean) as ClassSubject[];

        return { ...cls, subjects: newSubjects };
      })
    );

    showToast("✅ Barcha sinflarga davlat o'quv rejasi muvaffaqiyatli tatbiq etildi!");
  };

  // Save changes
  const handleSave = async () => {
    await onSaveClassSubjects(classesData);
    showToast("✅ Barcha o'quv rejalari va tarifikatsiya o'zgarishlari muvaffaqiyatli saqlandi!");
  };

  // Save and run AI Generator
  const handleSaveAndGenerate = async () => {
    await onSaveClassSubjects(classesData);
    if (onGenerateAI) {
      onGenerateAI();
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-top-2 ${
          toast.type === "success" ? "bg-emerald-600 text-white shadow-emerald-600/30" : "bg-rose-600 text-white shadow-rose-600/30"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ── TOP HEADER ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Back & Title */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Dars Jadvaliga Qaytish</span>
            </Link>

            <div className="h-5 w-px bg-slate-700 hidden sm:block" />

            <div>
              <h1 className="text-sm sm:text-base font-black flex items-center gap-2">
                <span className="p-1 rounded-lg bg-blue-600 text-white">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <span>O&apos;quv Rejasi &amp; Tarifikatsiya Konsoli</span>
              </h1>
              <p className="text-[11px] text-slate-400">
                {schoolName} • Jami: <strong className="text-white">{totalSchoolHours} soat</strong> dars yuklamasi
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Saqlash</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAndGenerate}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>{isGenerating ? "Generatsiya qilinmoqda..." : "Saqlash & AI Jadval Tuzish"}</span>
            </button>
          </div>
        </div>

        {/* Sub-Header: Mode Switcher & Global Filters */}
        <div className="bg-slate-950/80 border-t border-slate-800 px-4 sm:px-6 py-2">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* 3 xil View Mode Tablari */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setViewMode("BY_CLASS")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === "BY_CLASS"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>1. Sinf Bo&apos;yicha (Oson)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("BY_TEACHER")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === "BY_TEACHER"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>2. O&apos;qituvchi Bo&apos;yicha</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("MATRIX")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  viewMode === "MATRIX"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>3. Katta Matritsa (Excel)</span>
              </button>
            </div>

            {/* Bino va Bosqich filtrlari */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Bino */}
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">🏛️ Barcha Binolar ({classesData.length} ta sinf)</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({classesData.filter((c) => c.branchId === b.id).length} sinf)
                    </option>
                  ))}
                </select>
              </div>

              {/* Bosqich */}
              <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setStageFilter("ALL")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    stageFilter === "ALL" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Barchasi
                </button>
                <button
                  type="button"
                  onClick={() => setStageFilter("PRIMARY")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    stageFilter === "PRIMARY" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Boshlang&apos;ich (1-4)
                </button>
                <button
                  type="button"
                  onClick={() => setStageFilter("HIGH")}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    stageFilter === "HIGH" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Yuqori (5-11)
                </button>
              </div>

              {/* 1-Click Mass Load */}
              <button
                type="button"
                onClick={handleLoadStandardForAllClasses}
                className="flex items-center gap-1 px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                title="SanPiN me'yoridagi davlat standart o'quv rejasini barcha tanlangan sinflarga yuklash"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>⚡ Standart Rejani Barchaga Yuklash</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTENT ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {/* =================================================================== */}
        {/* 1-REJIM: SINF BO'YICHA O'QUV REJASI (ENG QULAY VA OSON KO'RINISH)   */}
        {/* =================================================================== */}
        {viewMode === "BY_CLASS" && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Chap: Sinflar Ro'yxati (4 kolonka) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span>Sinflar ({filteredClasses.length} ta)</span>
                </h2>
                <span className="text-[10px] font-bold text-slate-500">
                  Haftalik dars soati
                </span>
              </div>

              {/* Sinf qidiruvi */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Sinfni qidirish (masalan: 5A)..."
                  value={searchClassQuery}
                  onChange={(e) => setSearchClassQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Sinflar Listi */}
              <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
                {filteredClasses.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Sinf topilmadi
                  </div>
                ) : (
                  filteredClasses.map((cls) => {
                    const isSelected = activeClass.id === cls.id;
                    let totalHours = 0;
                    (cls.subjects || []).forEach((cs) => (totalHours += cs.weeklyHours));
                    const branchName = branchMap.get(cls.branchId)?.name || "";

                    return (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => setActiveClassId(cls.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? "bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-300"
                            : "bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {cls.name}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900">
                              {cls.name} sinfi
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {branchName} • {cls.isPrimary ? "Boshlang'ich" : "Yuqori sinf"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span
                            className={`inline-block font-mono font-black text-xs px-2 py-0.5 rounded-md ${
                              totalHours >= 24
                                ? "bg-emerald-100 text-emerald-800"
                                : totalHours > 0
                                ? "bg-blue-100 text-blue-800"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {totalHours} soat
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* O'ng: Tanlangan Sinfning O'quv Rejasi (8 kolonka) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              {/* Tanlangan Sinf Sarlavhasi */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-slate-900">
                      {activeClass.name} sinfi o&apos;quv rejasi
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-extrabold border border-blue-200">
                      {activeClass.subjects.reduce((sum, s) => sum + s.weeklyHours, 0)} haftalik soat
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Har bir fanga mas&apos;ul o&apos;qituvchini va haftalik dars soatini belgilang
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadStandardForClass(activeClass)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>⚡ Standart Rejani Yuklash</span>
                  </button>
                </div>
              </div>

              {/* Fanlar Ro'yxati Kartochkalari */}
              <div className="space-y-2">
                {subjects
                  .filter((sub) => isSubjectSuitableForGrade(sub.name, activeClass.grade))
                  .map((sub) => {
                    const currentAssignment = activeClass.subjects.find((cs) => cs.subjectId === sub.id);
                    const currentHours = currentAssignment?.weeklyHours || 0;
                    const currentTeacherId = currentAssignment?.teacherId || "";
                    const isAssigned = currentHours > 0;

                    const eligibleTeachers = sortedTeachers.filter((t) =>
                      (t.subjectIds || []).includes(sub.id)
                    );

                    return (
                      <div
                        key={sub.id}
                        className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${
                          isAssigned
                            ? "bg-slate-50/80 border-slate-300 shadow-xs"
                            : "bg-white border-slate-200 opacity-80 hover:opacity-100"
                        }`}
                      >
                        {/* Fan nomi */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                            style={{ backgroundColor: sub.colorTag || "#3B82F6" }}
                          />
                          <div>
                            <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                              <span>{sub.name}</span>
                              <span className="text-[10px] font-semibold text-slate-400">
                                (SanPiN: {sub.difficultyScore})
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {sub.allowDoubleLesson ? "Juft dars mumkin" : "1 kunda 1 dars"}
                            </div>
                          </div>
                        </div>

                        {/* O'qituvchi tanlash */}
                        <div className="flex-1 max-w-sm">
                          <select
                            value={currentTeacherId}
                            onChange={(e) =>
                              handleUpdateSubject(
                                activeClass.id,
                                sub.id,
                                e.target.value,
                                currentHours || (e.target.value ? 2 : 0)
                              )
                            }
                            className={`w-full text-xs font-semibold rounded-xl border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                              currentTeacherId
                                ? "bg-white border-slate-300 text-slate-900"
                                : "bg-slate-100 border-slate-200 text-slate-400 font-normal"
                            }`}
                          >
                            <option value="">— O&apos;qituvchi tanlanmagan —</option>
                            {(eligibleTeachers.length > 0 ? eligibleTeachers : sortedTeachers).map((t) => {
                              const assigned = teacherAssignedHours.get(t.id) || 0;
                              const cap = t.weeklyHourCapacity || 20;
                              return (
                                <option key={t.id} value={t.id}>
                                  {t.fullName} ({assigned}/{cap} s)
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        {/* Soat Stepperi [-] 4 [+] */}
                        <div className="flex items-center justify-end gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSubject(
                                activeClass.id,
                                sub.id,
                                currentTeacherId,
                                Math.max(0, currentHours - 1)
                              )
                            }
                            className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                            title="1 soat kamaytirish"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-12 text-center font-mono font-black text-sm text-slate-900">
                            {currentHours}{" "}
                            <span className="text-[10px] font-normal text-slate-500">soat</span>
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              handleUpdateSubject(
                                activeClass.id,
                                sub.id,
                                currentTeacherId,
                                currentHours + 1
                              )
                            }
                            className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center shadow-xs transition-colors cursor-pointer"
                            title="1 soat qo'shish"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 2-REJIM: O'QITUVCHI BO'YICHA YUKLAMA                                 */}
        {/* =================================================================== */}
        {viewMode === "BY_TEACHER" && (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Chap: O'qituvchilar Ro'yxati (4 kolonka) */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>O&apos;qituvchilar ({sortedTeachers.length})</span>
                </h2>
              </div>

              {/* Fan va Qidiruv filtri */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ustozni qidirish..."
                    value={searchTeacherQuery}
                    onChange={(e) => setSearchTeacherQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={teacherFilterSubjectId}
                    onChange={(e) => setTeacherFilterSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="ALL">🌟 Barcha Fanlar</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* O'qituvchilar ro'yxati */}
              <div className="space-y-1.5 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {sortedTeachers
                  .filter((t) => {
                    if (teacherFilterSubjectId !== "ALL" && !(t.subjectIds || []).includes(teacherFilterSubjectId))
                      return false;
                    if (searchTeacherQuery.trim()) {
                      const q = searchTeacherQuery.toLowerCase().trim();
                      if (!t.fullName.toLowerCase().includes(q)) return false;
                    }
                    return true;
                  })
                  .map((t) => {
                    const isSelected = activeTeacher.id === t.id;
                    const assigned = teacherAssignedHours.get(t.id) || 0;
                    const capacity = t.weeklyHourCapacity || 20;
                    const isOver = assigned > capacity;
                    const isFull = assigned === capacity;

                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setActiveTeacherId(t.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-400 shadow-sm ring-1 ring-indigo-300"
                            : "bg-white border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 truncate max-w-[170px]">
                            {t.fullName}
                          </span>
                          <span
                            className={`font-mono font-black text-xs ${
                              isOver ? "text-rose-600" : isFull ? "text-emerald-600" : "text-slate-700"
                            }`}
                          >
                            {assigned} / {capacity} s
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isOver ? "bg-rose-500" : isFull ? "bg-emerald-500" : "bg-indigo-500"
                            }`}
                            style={{ width: `${Math.min(100, (assigned / capacity) * 100)}%` }}
                          />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* O'ng: Tanlangan O'qituvchining Sinflar Taqsimoti (8 kolonka) */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <span>{activeTeacher.fullName}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold border border-indigo-200">
                      {teacherAssignedHours.get(activeTeacher.id) || 0} / {activeTeacher.weeklyHourCapacity || 20} soat
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    O&apos;qituvchiga biriktirilgan barcha darslar va sinflar ro&apos;yxati
                  </p>
                </div>
              </div>

              {/* Biriktirilgan Darslar */}
              <div className="space-y-2">
                {classesData.flatMap((cls) =>
                  (cls.subjects || [])
                    .filter((cs) => cs.teacherId === activeTeacher.id)
                    .map((cs) => {
                      const sub = subjectMap.get(cs.subjectId);
                      return (
                        <div
                          key={`${cls.id}_${cs.subjectId}`}
                          className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-xs px-2.5 py-1 rounded-lg bg-indigo-600 text-white">
                              {cls.name}
                            </span>
                            <div>
                              <div className="font-bold text-xs text-slate-900">
                                {sub?.name || "Fan"}
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {cls.isPrimary ? "Boshlang'ich" : "Yuqori sinf"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-slate-900">
                              {cs.weeklyHours} soat
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateSubject(cls.id, cs.subjectId, "", 0)
                              }
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Darsni o'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* 3-REJIM: KATTA MATRITSA (EXCEL USLUBIDA KENG EKRAN)                */}
        {/* =================================================================== */}
        {viewMode === "MATRIX" && (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">
                📊 Butun maktab bo&apos;yicha fanlar va sinflar matritsasi
              </span>
              <span className="text-slate-500">
                Gorizontal va vertikal skroll qilib istalgan katakchani tez tahrirlang
              </span>
            </div>

            <div className="flex-1 overflow-auto p-4 max-h-[calc(100vh-250px)]">
              <table className="border-collapse border border-slate-300 w-full text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300">
                    <th className="border border-slate-300 px-3 py-2 text-left font-black text-slate-800 w-48 sticky left-0 bg-slate-100 z-10">
                      Fan Nomi
                    </th>
                    {filteredClasses.map((cls) => {
                      const totalH = cls.subjects.reduce((sum, s) => sum + s.weeklyHours, 0);
                      return (
                        <th key={cls.id} className="border border-slate-300 px-2 py-1.5 text-center min-w-[140px]">
                          <div className="font-extrabold text-slate-900">{cls.name}</div>
                          <div className="text-[10px] font-bold text-blue-700 font-mono">{totalH} soat</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/80">
                      <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sub.colorTag || "#3B82F6" }} />
                          <span>{sub.name}</span>
                        </div>
                      </td>

                      {filteredClasses.map((cls) => {
                        const cs = cls.subjects.find((item) => item.subjectId === sub.id);
                        const curTeacherId = cs?.teacherId || "";
                        const curHours = cs?.weeklyHours || 0;

                        return (
                          <td key={`${cls.id}_${sub.id}`} className="border border-slate-300 p-1 text-center align-middle">
                            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-1 shadow-2xs">
                              <select
                                value={curTeacherId}
                                onChange={(e) =>
                                  handleUpdateSubject(
                                    cls.id,
                                    sub.id,
                                    e.target.value,
                                    curHours || (e.target.value ? 2 : 0)
                                  )
                                }
                                className="flex-1 text-[11px] font-semibold bg-transparent border-0 p-0 text-slate-900 truncate cursor-pointer"
                              >
                                <option value="">— Yo&apos;q —</option>
                                {sortedTeachers.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.fullName}
                                  </option>
                                ))}
                              </select>

                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={curHours}
                                onChange={(e) =>
                                  handleUpdateSubject(
                                    cls.id,
                                    sub.id,
                                    curTeacherId,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-7 text-center font-mono font-bold text-xs bg-slate-100 rounded border border-slate-200 py-0.5"
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
