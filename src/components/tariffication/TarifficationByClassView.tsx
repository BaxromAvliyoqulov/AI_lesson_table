"use client";

import React, { useState } from "react";
import { SchoolClass, Subject, Teacher, Branch } from "@/types";
import { isSubjectSuitableForGrade } from "@/lib/curriculum-templates";
import {
  GraduationCap,
  Search,
  Plus,
  Minus,
  Sparkles,
  Trash2,
  BookPlus,
  X,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";

// O'zR MMTV 2026-2027 Davlat Standart Haftalik Dars Soati Me'yorlari (MMTV 2026-2027 tayanch reja + Kelajak soati)
export const GRADE_STANDARD_LIMITS: Record<number, number> = {
  1: 22,
  2: 25,
  3: 25,
  4: 25,
  5: 30,
  6: 31,
  7: 36,
  8: 34,
  9: 35,
  10: 32,
  11: 32,
};

interface TarifficationByClassViewProps {
  classes: SchoolClass[];
  activeClass: SchoolClass;
  onSelectClass: (classId: string) => void;
  subjects: Subject[];
  sortedTeachers: Teacher[];
  teacherAssignedHours: Map<string, number>;
  branchMap: Map<string, Branch>;
  onUpdateSubject: (
    classId: string,
    subjectId: string,
    teacherId: string,
    weeklyHours: number
  ) => void;
  onRemoveSubject?: (classId: string, subjectId: string) => void;
  onClearClassSubjects?: (classId: string) => void;
  onLoadStandardForClass: (cls: SchoolClass) => void;
  onSetHomeroomTeacher?: (classId: string, teacherId: string) => void;
}

export const TarifficationByClassView: React.FC<TarifficationByClassViewProps> = ({
  classes,
  activeClass,
  onSelectClass,
  subjects,
  sortedTeachers,
  teacherAssignedHours,
  branchMap,
  onUpdateSubject,
  onRemoveSubject,
  onClearClassSubjects,
  onLoadStandardForClass,
  onSetHomeroomTeacher,
}) => {
  const [searchClassQuery, setSearchClassQuery] = useState("");
  const [searchSubjectQuery, setSearchSubjectQuery] = useState("");
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  const filteredClasses = classes.filter((c) => {
    if (!searchClassQuery.trim()) return true;
    return c.name.toLowerCase().includes(searchClassQuery.toLowerCase().trim());
  });

  // Hozirgi tanlangan sinfning me'yori va jami soatlari (activeClass bo'sh bo'lishidan himoyalangan)
  const maxStandardHours = activeClass ? (GRADE_STANDARD_LIMITS[activeClass.grade] || 25) : 25;
  const currentTotalHours = (activeClass?.subjects || []).reduce(
    (sum, s) => sum + s.weeklyHours,
    0
  );
  const remainingHours = maxStandardHours - currentTotalHours;
  const progressPercent = Math.min(100, Math.round((currentTotalHours / maxStandardHours) * 100));

  // Faol sinf rahbari
  const activeHomeroomTeacher = activeClass
    ? sortedTeachers.find(
        (t) => t.id === activeClass.homeroomTeacherId || t.homeroomClassId === activeClass.id
      )
    : undefined;

  // Stepper [+] bosilganda limitni tekshirish
  const handleIncreaseHours = (subId: string, teacherId: string, currentHours: number) => {
    if (currentTotalHours >= maxStandardHours) {
      setLimitWarning(
        `🛑 ${activeClass.name} sinfi uchun belgilangan davlat me'yori (${maxStandardHours} soat) to'lgan! Limitdan oshib ketish taqiqlanadi.`
      );
      setTimeout(() => setLimitWarning(null), 4000);
      return;
    }
    setLimitWarning(null);
    onUpdateSubject(activeClass.id, subId, teacherId, currentHours + 1);
  };

  // Sinf soati o'qituvchisi o'zgarsa yoki yuqoridan rahbar tanlansa sinxronlash
  const handleTeacherChange = (sub: Subject, teacherId: string, curHours: number) => {
    onUpdateSubject(activeClass.id, sub.id, teacherId, curHours || (teacherId ? 2 : 0));

    // Agar Sinf soati bo'lsa, avtomatik sinf rahbarini ham o'rnatamiz
    if (
      (sub.id === "sub_sinf_soati" ||
        sub.name.toLowerCase().includes("sinf soati") ||
        sub.name.toLowerCase().includes("kelajak")) &&
      teacherId &&
      onSetHomeroomTeacher
    ) {
      onSetHomeroomTeacher(activeClass.id, teacherId);
    }
  };

  if (!activeClass) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-16 text-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-sm font-bold text-slate-600">Hech qanday sinf tanlanmagan yoki sinflar mavjud emas.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Chap: Sinflar Ro'yxati (3 kolonka) */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Sinflar ({filteredClasses.length} ta)</span>
          </h2>
          <span className="text-[10px] font-bold text-slate-400">
            Tayyorgarlik foizi
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

        {/* Sinflar Listi & Dynamic Ring/Progress Bar */}
        <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Sinf topilmadi
            </div>
          ) : (
            filteredClasses.map((cls) => {
              const isSelected = activeClass.id === cls.id;
              const totalHours = (cls.subjects || []).reduce(
                (sum, s) => sum + s.weeklyHours,
                0
              );
              const classMaxHours = GRADE_STANDARD_LIMITS[cls.grade] || 25;
              const pct = Math.min(100, Math.round((totalHours / classMaxHours) * 100));
              const isComplete = totalHours >= classMaxHours;

              const branchName = branchMap.get(cls.branchId)?.name || "Asosiy bino";
              const hrTeacher = sortedTeachers.find(
                (t) => t.id === cls.homeroomTeacherId || t.homeroomClassId === cls.id
              );

              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => onSelectClass(cls.id)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isSelected
                      ? "bg-blue-50/90 border-blue-500 shadow-sm ring-2 ring-blue-300/40"
                      : "bg-white border-slate-200 hover:border-blue-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-2xs ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {cls.name}
                      </div>
                      <div className="truncate">
                        <div className="font-bold text-xs text-slate-900 truncate">
                          {cls.name} sinfi
                        </div>
                        <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                          <span>{branchName}</span>
                          <span>•</span>
                          <span className={hrTeacher ? "text-indigo-600 font-medium" : "text-amber-600 italic"}>
                            👤 {hrTeacher ? hrTeacher.fullName.split(" ")[0] : "Rahbar yo'q"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Soat va foiz badge */}
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block font-mono font-black text-xs px-2 py-0.5 rounded-lg border ${
                          isComplete
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : totalHours > 0
                            ? "bg-blue-100 text-blue-800 border-blue-300"
                            : "bg-slate-100 text-slate-400 border-slate-200"
                        }`}
                      >
                        {totalHours}/{classMaxHours} s
                      </span>
                    </div>
                  </div>

                  {/* Dinamik Progress Bar */}
                  <div className="w-full">
                    <div className="flex items-center justify-between text-[10px] font-bold mb-1">
                      <span className={isComplete ? "text-emerald-700" : "text-slate-500"}>
                        {isComplete ? "✅ 100% Tayyor" : `${pct}% to'ldi`}
                      </span>
                      <span className="font-mono text-slate-400">
                        {totalHours < classMaxHours ? `yana ${classMaxHours - totalHours}s` : "to'liq"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isComplete
                            ? "bg-emerald-500"
                            : pct > 50
                            ? "bg-blue-500"
                            : pct > 0
                            ? "bg-amber-500"
                            : "bg-transparent"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* O'ng: Tanlangan Sinfning O'quv Rejasi (9 kolonka) */}
      <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Yuqori Sinf Sarlavhasi, Sinf Rahbari va CRUD tugmalari */}
        <div className="flex flex-col gap-3 pb-3 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xl font-black text-slate-900">
                  {activeClass.name} sinfi o&apos;quv rejasi
                </span>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-black border ${
                    currentTotalHours === maxStandardHours
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : currentTotalHours > maxStandardHours
                      ? "bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-blue-100 text-blue-800 border-blue-200"
                  }`}
                >
                  {currentTotalHours} / {maxStandardHours} haftalik soat
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Davlat me&apos;yori: <strong>{maxStandardHours} soat</strong> • Har bir fanga mas&apos;ul o&apos;qituvchini va soatini belgilang
              </p>
            </div>

            {/* CRUD Boshqaruv Tugmalari */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddSubjectOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <BookPlus className="w-4 h-4" />
                <span>+ Fan Qo&apos;shish</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLimitWarning(null);
                  onLoadStandardForClass(activeClass);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                title="Davlat tayanch o'quv rejasini yuklash"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>⚡ Standart Rejani Yuklash</span>
              </button>

              {onClearClassSubjects && (
                <button
                  type="button"
                  onClick={() => {
                    setLimitWarning(null);
                    onClearClassSubjects(activeClass.id);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Sinf o'quv rejasini tozalash"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Tozalash</span>
                </button>
              )}
            </div>
          </div>

          {/* Sinf Rahbari & Dinamik Tayyorgarlik Paneli */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {/* Sinf Rahbari tanlash kartochkasi */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-800">Sinf Rahbari:</div>
                  <div className="text-[10px] text-slate-500">
                    Kelajak soati darsi orqali ham bog&apos;lanadi
                  </div>
                </div>
              </div>

              <select
                value={activeClass.homeroomTeacherId || activeHomeroomTeacher?.id || ""}
                onChange={(e) => {
                  if (onSetHomeroomTeacher) {
                    onSetHomeroomTeacher(activeClass.id, e.target.value);
                  }
                }}
                className="flex-1 max-w-[220px] text-xs font-bold bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer truncate"
              >
                <option value="">— Sinf rahbari tanlanmagan —</option>
                {sortedTeachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>

            {/* Dinamik Progress Status Bar */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-center gap-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-slate-700">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dars soati balansi:</span>
                </span>
                <span
                  className={`font-mono font-black ${
                    currentTotalHours === maxStandardHours
                      ? "text-emerald-700"
                      : currentTotalHours > maxStandardHours
                      ? "text-rose-600"
                      : "text-blue-700"
                  }`}
                >
                  {currentTotalHours} / {maxStandardHours} soat ({progressPercent}%)
                </span>
              </div>

              {/* Keng rangli progress bar */}
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    currentTotalHours === maxStandardHours
                      ? "bg-emerald-500"
                      : currentTotalHours > maxStandardHours
                      ? "bg-rose-500"
                      : "bg-blue-600"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="text-[10px] flex items-center justify-between font-semibold">
                {currentTotalHours === maxStandardHours ? (
                  <span className="text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>O&apos;quv rejasi davlat me&apos;yoriga 100% mos va to&apos;liq!</span>
                  </span>
                ) : currentTotalHours > maxStandardHours ? (
                  <span className="text-rose-600 flex items-center gap-1 font-bold">
                    <ShieldAlert className="w-3 h-3" />
                    <span>Diqqat! Me&apos;yordan {currentTotalHours - maxStandardHours} soat ortiq dars kiritilgan!</span>
                  </span>
                ) : (
                  <span className="text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Yana {remainingHours} soat dars kiritilishi kerak ({remainingHours} soat bo&apos;sh).</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Limit ogohlantirish banneri */}
          {limitWarning && (
            <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-shake">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{limitWarning}</span>
              </div>
              <button
                type="button"
                onClick={() => setLimitWarning(null)}
                className="text-rose-500 hover:text-rose-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Fanlarni tezkor qidirish */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Fan nomini qidirish..."
            value={searchSubjectQuery}
            onChange={(e) => setSearchSubjectQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Fanlar Ro'yxati Kartochkalari */}
        <div className="space-y-2 max-h-[calc(100vh-360px)] overflow-y-auto pr-1">
          {subjects
            .filter((sub) => {
              const currentAssignment = activeClass.subjects.find((cs) => cs.subjectId === sub.id);
              const isAssigned = (currentAssignment?.weeklyHours || 0) > 0;
              const isSuitable = isSubjectSuitableForGrade(sub, activeClass.grade);
              if (!isAssigned && !isSuitable) return false;

              if (searchSubjectQuery.trim()) {
                return sub.name.toLowerCase().includes(searchSubjectQuery.toLowerCase().trim());
              }
              return true;
            })
            .sort((a, b) => {
              const aAssigned = (activeClass.subjects.find((cs) => cs.subjectId === a.id)?.weeklyHours || 0) > 0;
              const bAssigned = (activeClass.subjects.find((cs) => cs.subjectId === b.id)?.weeklyHours || 0) > 0;
              if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
              return a.name.localeCompare(b.name, "uz");
            })
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
                      ? "bg-slate-50/90 border-slate-300 shadow-xs"
                      : "bg-white border-slate-200 opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* Fan nomi va SanPiN */}
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
                        {isAssigned && (
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                            Rejada bor
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {sub.allowDoubleLesson ? "Juft dars mumkin" : "1 kunda 1 dars"}
                      </div>
                    </div>
                  </div>

                  {/* O'qituvchi tanlash */}
                  <div className="flex-1 max-w-md">
                    <select
                      value={currentTeacherId}
                      onChange={(e) => handleTeacherChange(sub, e.target.value, currentHours)}
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

                  {/* Soat Stepperi [-] 4 [+] va O'chirish (Trash) */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setLimitWarning(null);
                        onUpdateSubject(
                          activeClass.id,
                          sub.id,
                          currentTeacherId,
                          Math.max(0, currentHours - 1)
                        );
                      }}
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
                      onClick={() => handleIncreaseHours(sub.id, currentTeacherId, currentHours)}
                      disabled={currentTotalHours >= maxStandardHours}
                      className={`w-7 h-7 rounded-lg font-bold flex items-center justify-center transition-colors cursor-pointer ${
                        currentTotalHours >= maxStandardHours
                          ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      }`}
                      title={
                        currentTotalHours >= maxStandardHours
                          ? `Limit to'lgan (${maxStandardHours} soat)`
                          : "1 soat oshirish"
                      }
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Trash Tugmasi (Faqat darsi bo'lsa) */}
                    {isAssigned && onRemoveSubject && (
                      <button
                        type="button"
                        onClick={() => {
                          setLimitWarning(null);
                          onRemoveSubject(activeClass.id, sub.id);
                        }}
                        className="w-7 h-7 ml-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center transition-colors cursor-pointer"
                        title="Fanni rejadagi soatini 0 qilish va o'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Fan Qo'shish Modali */}
      {isAddSubjectOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <BookPlus className="w-4 h-4 text-blue-600" />
                <span>{activeClass.name} sinfiga fan qo&apos;shish</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSubjectOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ushbu sinf me&apos;yori: <strong>{maxStandardHours} soat</strong> (hozirda {currentTotalHours} soat).
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {subjects
                .filter((sub) => {
                  const hasHours = (activeClass.subjects.find((cs) => cs.subjectId === sub.id)?.weeklyHours || 0) > 0;
                  return !hasHours;
                })
                .map((sub) => {
                  const isSuitable = isSubjectSuitableForGrade(sub, activeClass.grade);
                  return (
                    <div
                      key={sub.id}
                      className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 gap-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: sub.colorTag || "#3B82F6" }}
                        />
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {sub.name}
                        </span>
                        {!isSuitable && (
                          <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1 rounded">
                            Nostandart
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const addHours = Math.min(2, Math.max(1, remainingHours));
                          if (currentTotalHours >= maxStandardHours) {
                            setLimitWarning(`Limit to'lgan (${maxStandardHours} soat)!`);
                            setIsAddSubjectOpen(false);
                            return;
                          }
                          onUpdateSubject(activeClass.id, sub.id, "", addHours);
                          setIsAddSubjectOpen(false);
                        }}
                        disabled={currentTotalHours >= maxStandardHours}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        + Qo&apos;shish
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
