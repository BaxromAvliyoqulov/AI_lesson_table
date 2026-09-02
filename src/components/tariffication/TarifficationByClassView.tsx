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
} from "lucide-react";

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
}) => {
  const [searchClassQuery, setSearchClassQuery] = useState("");
  const [searchSubjectQuery, setSearchSubjectQuery] = useState("");
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);

  const filteredClasses = classes.filter((c) => {
    if (!searchClassQuery.trim()) return true;
    return c.name.toLowerCase().includes(searchClassQuery.toLowerCase().trim());
  });

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Chap: Sinflar Ro'yxati (3 kolonka) */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
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
                  onClick={() => onSelectClass(cls.id)}
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

      {/* O'ng: Tanlangan Sinfning O'quv Rejasi (9 kolonka) */}
      <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Tanlangan Sinf Sarlavhasi va CRUD tugmalari */}
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

          {/* CRUD Boshqaruv Tugmalari */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddSubjectOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <BookPlus className="w-3.5 h-3.5" />
              <span>+ Fan Qo&apos;shish</span>
            </button>

            <button
              type="button"
              onClick={() => onLoadStandardForClass(activeClass)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              title="Davlat tayanch o'quv rejasini yuklash"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>⚡ Standart Reja</span>
            </button>

            {onClearClassSubjects && (
              <button
                type="button"
                onClick={() => onClearClassSubjects(activeClass.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Sinf o'quv rejasini tozalash"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Tozalash</span>
              </button>
            )}
          </div>
        </div>

        {/* Fanlarni tezkor qidirish */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Fan nomini qidirish..."
            value={searchSubjectQuery}
            onChange={(e) => setSearchSubjectQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </div>

        {/* Fanlar Ro'yxati Kartochkalari */}
        <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
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
                      ? "bg-slate-50/80 border-slate-300 shadow-xs"
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
                        onUpdateSubject(
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

                  {/* Soat Stepperi [-] 4 [+] va O'chirish (Trash) */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateSubject(
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
                        onUpdateSubject(
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

                    {/* O'chirish tugmasi */}
                    {isAssigned && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onRemoveSubject) {
                            onRemoveSubject(activeClass.id, sub.id);
                          } else {
                            onUpdateSubject(activeClass.id, sub.id, "", 0);
                          }
                        }}
                        className="w-7 h-7 ml-1 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
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

        {/* + Fan Qo'shish Modali */}
        {isAddSubjectOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <BookPlus className="w-4 h-4 text-blue-600" />
                  <span>{activeClass.name} sinfiga fan qo&apos;shish</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {subjects
                  .filter((s) => !activeClass.subjects.some((cs) => cs.subjectId === s.id && cs.weeklyHours > 0))
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: sub.colorTag || "#3B82F6" }}
                        />
                        <span className="font-bold text-xs text-slate-800">{sub.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          onUpdateSubject(activeClass.id, sub.id, "", 2);
                          setIsAddSubjectOpen(false);
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        + Qo&apos;shish (2s)
                      </button>
                    </div>
                  ))}
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
