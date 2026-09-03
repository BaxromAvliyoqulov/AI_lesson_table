"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Sparkles,
  Search,
  Users,
  GraduationCap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ChevronDown,
  Clock,
  Plus,
} from "lucide-react";
import {
  SchoolClass,
  Subject,
  Teacher,
  Branch,
  ClassSubject,
} from "@/types";
import { isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";

interface TarifficationMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  branches: Branch[];
  onSaveClassSubjects: (updatedClasses: SchoolClass[]) => void;
  onGenerateAI: () => void;
  isGenerating?: boolean;
}

export const TarifficationMatrixModal: React.FC<TarifficationMatrixModalProps> = ({
  isOpen,
  onClose,
  classes: initialClasses,
  subjects,
  teachers,
  branches,
  onSaveClassSubjects,
  onGenerateAI,
  isGenerating = false,
}) => {
  const [classesData, setClassesData] = useState<SchoolClass[]>(initialClasses);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("ALL");
  const [stageFilter, setStageFilter] = useState<"ALL" | "PRIMARY" | "HIGH">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [teacherSearchQuery, setTeacherSearchQuery] = useState<string>("");
  const [teacherStatusFilter, setTeacherStatusFilter] = useState<"ALL" | "FULL" | "AVAILABLE" | "OVER">("ALL");
  const [highlightTeacherId, setHighlightTeacherId] = useState<string | null>(null);

  // Sync state if props change when opening
  React.useEffect(() => {
    setClassesData(initialClasses);
  }, [initialClasses, isOpen]);

  // Maps for fast lookups
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  // Alifbo bo'yicha saralangan barcha o'qituvchilar (Selectlar uchun)
  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.fullName.localeCompare(b.fullName, "uz"));
  }, [teachers]);

  // Filtered classes
  const filteredClasses = useMemo(() => {
    return classesData.filter((c) => {
      if (selectedBranchId !== "ALL" && c.branchId !== selectedBranchId) return false;
      if (stageFilter === "PRIMARY" && !c.isPrimary && c.grade > 4) return false;
      if (stageFilter === "HIGH" && (c.isPrimary || c.grade <= 4)) return false;
      return true;
    });
  }, [classesData, selectedBranchId, stageFilter]);

  // Filtered subjects
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjects;
    const q = searchQuery.toLowerCase().trim();
    return subjects.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      (s.shortName && s.shortName.toLowerCase().includes(q))
    );
  }, [subjects, searchQuery]);

  // Real-time Teacher Assigned Hours Calculation (Kelajak soati dars stavkasiga kirmaydi)
  const teacherAssignedHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const cls of classesData) {
      if (cls.isClosed) continue;
      for (const cs of cls.subjects) {
        if (cs.teacherId) {
          const sub = subjectMap.get(cs.subjectId);
          if (!isKelajakOrSinfSoatiSubject(cs.subjectId, sub?.name)) {
            map.set(cs.teacherId, (map.get(cs.teacherId) || 0) + cs.weeklyHours);
          }
        }
      }
    }
    return map;
  }, [classesData, subjectMap]);

  // Filtered and Sorted Teachers for Sidebar
  const filteredTeachers = useMemo(() => {
    const query = (teacherSearchQuery || searchQuery).toLowerCase().trim();

    return sortedTeachers.filter((t) => {
      // 1. Qidiruv matni (Ism-familiya bo'yicha)
      if (query && !t.fullName.toLowerCase().includes(query)) {
        return false;
      }

      // 2. Status filtri
      const assigned = teacherAssignedHours.get(t.id) || 0;
      const capacity = t.weeklyHourCapacity || 20;

      if (teacherStatusFilter === "FULL" && assigned < capacity) return false;
      if (teacherStatusFilter === "AVAILABLE" && assigned >= capacity) return false;
      if (teacherStatusFilter === "OVER" && assigned <= capacity) return false;

      return true;
    });
  }, [sortedTeachers, teacherSearchQuery, searchQuery, teacherStatusFilter, teacherAssignedHours]);

  // Helper to get ClassSubject for a given class & subject
  const getClassSubject = (cls: SchoolClass, subjectId: string): ClassSubject | undefined => {
    return cls.subjects.find((cs) => cs.subjectId === subjectId);
  };

  // Update teacher or hours for a specific class & subject
  const handleUpdateAssignment = (
    classId: string,
    subjectId: string,
    teacherId: string,
    weeklyHours: number
  ) => {
    setClassesData((prev) =>
      prev.map((cls) => {
        if (cls.id !== classId) return cls;
        const exists = cls.subjects.some((cs) => cs.subjectId === subjectId);
        let updatedSubjects: ClassSubject[];

        if (weeklyHours <= 0) {
          // Remove subject if 0 hours
          updatedSubjects = cls.subjects.filter((cs) => cs.subjectId !== subjectId);
        } else if (exists) {
          updatedSubjects = cls.subjects.map((cs) =>
            cs.subjectId === subjectId
              ? { ...cs, teacherId, weeklyHours }
              : cs
          );
        } else {
          updatedSubjects = [
            ...cls.subjects,
            { classId: cls.id, subjectId, teacherId, weeklyHours, groupType: "WHOLE" },
          ];
        }

        return { ...cls, subjects: updatedSubjects };
      })
    );
  };

  const handleSaveAndGenerate = () => {
    onSaveClassSubjects(classesData);
    onGenerateAI();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="flex h-[92vh] w-full max-w-7xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 flex items-center gap-2">
                O&apos;quv Yuklamasi &amp; Tarifikatsiya Matritsasi
                <span className="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                  5-Ustunli AI Engine
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Har bir sinf va fan bo&apos;yicha o&apos;qituvchilar dars soatlarini biriktirish va ziddiyatlarsiz AI generatsiya qilish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAndGenerate}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              {isGenerating ? "Generatsiya qilinmoqda..." : "AI Jadval Generatsiya Qilish"}
            </button>

            <button
              onClick={onClose}
              className="rounded-xl p-2 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── FILTERS & STATS TOOLBAR ────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            {/* Branch Filter */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Bino:</span>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-slate-100 border border-slate-300 rounded-lg px-2 py-1 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">Barcha Binolar ({classesData.length} ta sinf)</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name.replace(/\s*\(?boshlang['`ʻ]?ich\)?/gi, "").trim()} ({classesData.filter((c) => c.branchId === b.id).length} ta sinf)
                  </option>
                ))}
              </select>
            </div>

            {/* Stage Filter */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setStageFilter("ALL")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  stageFilter === "ALL" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Barchasi
              </button>
              <button
                onClick={() => setStageFilter("PRIMARY")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  stageFilter === "PRIMARY" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Boshlang&apos;ich (1-4)
              </button>
              <button
                onClick={() => setStageFilter("HIGH")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  stageFilter === "HIGH" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Yuqori (5-11)
              </button>
            </div>
          </div>

          {/* Subject Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Fanni qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 font-medium"
            />
          </div>
        </div>

        {/* ── MAIN CONTENT (MATRITSA & O'QITUVCHILAR YUKLAMASI) ───────────────── */}
        <div className="flex-1 flex overflow-hidden">
          {/* Matritsa Jadvali */}
          <div className="flex-1 overflow-auto p-4">
            <table className="border-collapse border border-slate-300 w-full text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300">
                  <th className="border border-slate-300 px-3 py-2 text-left font-black text-slate-800 w-48 sticky left-0 bg-slate-100 z-10">
                    Fan Nomi &amp; SanPiN
                  </th>
                  {filteredClasses.map((cls) => {
                    let totalClassHours = 0;
                    cls.subjects.forEach((cs) => (totalClassHours += cs.weeklyHours));
                    return (
                      <th
                        key={cls.id}
                        className={`border border-slate-300 px-2 py-1.5 text-center min-w-[130px] ${
                          cls.branchId === "b39_2" ? "bg-amber-50" : "bg-slate-50"
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-black text-xs text-slate-900">{cls.name}</span>
                          <span className="text-[10px] font-semibold text-slate-500">
                            Jami: <strong className="text-blue-600">{totalClassHours} soat</strong>
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {filteredSubjects.map((sub, sIdx) => (
                  <tr
                    key={sub.id}
                    className={`border-b border-slate-200 hover:bg-blue-50/30 transition-colors ${
                      sIdx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    }`}
                  >
                    {/* Fan Nomi */}
                    <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900 sticky left-0 bg-inherit z-10">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: sub.colorTag || "#3B82F6" }}
                        />
                        <span className="truncate">{sub.name}</span>
                        <span className="ml-auto text-[9px] text-slate-400 font-mono">
                          q={sub.difficultyScore}
                        </span>
                      </div>
                    </td>

                    {/* Har bir sinf uchun biriktirish katagi */}
                    {filteredClasses.map((cls) => {
                      const cs = getClassSubject(cls, sub.id);
                      const currentTeacherId = cs?.teacherId || "";
                      const currentHours = cs?.weeklyHours || 0;
                      const isHighlighted = highlightTeacherId && currentTeacherId === highlightTeacherId;

                      return (
                        <td
                          key={`${cls.id}_${sub.id}`}
                          className={`border border-slate-300 p-1 text-center align-middle transition-colors ${
                            isHighlighted ? "bg-amber-100/80 ring-2 ring-amber-400" : ""
                          }`}
                        >
                          <div className={`flex items-center gap-1 border rounded p-1 shadow-sm transition-all ${
                            isHighlighted
                              ? "bg-amber-50 border-amber-300 shadow-amber-100"
                              : "bg-white border-slate-200"
                          }`}>
                            {/* O'qituvchi tanlash */}
                            <select
                              value={currentTeacherId}
                              onChange={(e) =>
                                handleUpdateAssignment(
                                  cls.id,
                                  sub.id,
                                  e.target.value,
                                  currentHours || (e.target.value ? 2 : 0)
                                )
                              }
                              className={`flex-1 text-[11px] font-semibold bg-transparent border-0 focus:ring-0 p-0 text-slate-900 truncate cursor-pointer ${
                                !currentTeacherId ? "text-slate-400 font-normal" : ""
                              }`}
                            >
                              <option value="">— O&apos;qituvchi yo&apos;q —</option>
                              {sortedTeachers.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.fullName}
                                </option>
                              ))}
                            </select>

                            {/* Soat miqdori */}
                            <input
                              type="number"
                              min="0"
                              max="10"
                              value={currentHours}
                              onChange={(e) =>
                                handleUpdateAssignment(
                                  cls.id,
                                  sub.id,
                                  currentTeacherId,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className={`w-7 text-center font-mono font-bold text-xs bg-slate-100 rounded border border-slate-200 py-0.5 focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 ${
                                currentHours > 0 ? "text-blue-700" : "text-slate-300"
                              }`}
                              title="Haftalik dars soati"
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

          {/* O'ng Tomon: O'qituvchilar Yuklamasi Paneli */}
          <div className="w-80 shrink-0 border-l border-slate-200 bg-slate-50/70 p-3.5 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>O&apos;qituvchilar ({filteredTeachers.length})</span>
              </h3>
              {highlightTeacherId && (
                <button
                  type="button"
                  onClick={() => setHighlightTeacherId(null)}
                  className="text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                >
                  Filtrni tozalash
                </button>
              )}
            </div>

            {/* O'qituvchini Qidirish Inputi */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ustozni qidirish..."
                value={teacherSearchQuery}
                onChange={(e) => setTeacherSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm font-medium"
              />
              {teacherSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTeacherSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* O'qituvchilar Status Filtrlari */}
            <div className="grid grid-cols-4 gap-1 mb-2.5 bg-slate-200/60 p-1 rounded-xl text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setTeacherStatusFilter("ALL")}
                className={`py-1 rounded-lg transition-all text-center truncate cursor-pointer ${
                  teacherStatusFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-sm font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Hammasi
              </button>
              <button
                type="button"
                onClick={() => setTeacherStatusFilter("FULL")}
                className={`py-1 rounded-lg transition-all text-center truncate cursor-pointer ${
                  teacherStatusFilter === "FULL"
                    ? "bg-emerald-600 text-white shadow-sm font-extrabold"
                    : "text-emerald-700 hover:bg-emerald-100"
                }`}
                title="Stavkasi 100% to'lgan o'qituvchilar"
              >
                To&apos;liq
              </button>
              <button
                type="button"
                onClick={() => setTeacherStatusFilter("AVAILABLE")}
                className={`py-1 rounded-lg transition-all text-center truncate cursor-pointer ${
                  teacherStatusFilter === "AVAILABLE"
                    ? "bg-blue-600 text-white shadow-sm font-extrabold"
                    : "text-blue-700 hover:bg-blue-100"
                }`}
                title="Bo'sh soati bor o'qituvchilar"
              >
                Bo&apos;sh
              </button>
              <button
                type="button"
                onClick={() => setTeacherStatusFilter("OVER")}
                className={`py-1 rounded-lg transition-all text-center truncate cursor-pointer ${
                  teacherStatusFilter === "OVER"
                    ? "bg-rose-600 text-white shadow-sm font-extrabold"
                    : "text-rose-700 hover:bg-rose-100"
                }`}
                title="Stavkadan ortiqcha dars yuklanganlar"
              >
                Ortiqcha
              </button>
            </div>

            {/* O'qituvchilar Ro'yxati */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredTeachers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Mos o&apos;qituvchi topilmadi
                </div>
              ) : (
                filteredTeachers.map((t) => {
                  const assigned = teacherAssignedHours.get(t.id) || 0;
                  const capacity = t.weeklyHourCapacity || 20;
                  const isOver = assigned > capacity;
                  const isFull = assigned === capacity;
                  const isSelected = highlightTeacherId === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() =>
                        setHighlightTeacherId(isSelected ? null : t.id)
                      }
                      className={`p-2 rounded-xl border transition-all cursor-pointer text-xs ${
                        isSelected
                          ? "bg-amber-50 border-amber-400 shadow-md ring-1 ring-amber-300"
                          : "bg-white border-slate-200 hover:border-blue-300 shadow-sm"
                      }`}
                      title="Matritsada ushbu o'qituvchi darslarini ajratib ko'rish uchun bosing"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                        <span className="truncate max-w-[155px]" title={t.fullName}>
                          {t.fullName}
                        </span>
                        <span
                          className={`font-mono font-black ${
                            isOver
                              ? "text-rose-600"
                              : isFull
                              ? "text-emerald-600"
                              : "text-slate-700"
                          }`}
                        >
                          {assigned} / {capacity} s
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isOver
                              ? "bg-rose-500"
                              : isFull
                              ? "bg-emerald-500"
                              : "bg-blue-500"
                          }`}
                          style={{
                            width: `${Math.min(100, (assigned / capacity) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-3">
          <div className="text-xs text-slate-500 font-medium">
            💡 Maslahat: Har bir sinfga davlat o&apos;quv rejasidagi fanlar va o&apos;qituvchilar to&apos;liq biriktirilgach, AI generatsiya 100% ideal ishlaydi.
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl transition-colors"
            >
              Yopish
            </button>
            <button
              onClick={() => {
                onSaveClassSubjects(classesData);
                onClose();
              }}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow"
            >
              O&apos;zgarishlarni Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
