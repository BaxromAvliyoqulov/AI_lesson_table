"use client";

import React, { useState } from "react";
import { SchoolClass, Subject, Teacher } from "@/types";
import {
  Users,
  Search,
  Trash2,
  Plus,
  Minus,
  ArrowRightLeft,
  X,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

interface TarifficationByTeacherViewProps {
  classesData: SchoolClass[];
  teachers: Teacher[];
  sortedTeachers: Teacher[];
  activeTeacher: Teacher;
  onSelectTeacher: (teacherId: string) => void;
  subjects: Subject[];
  subjectMap: Map<string, Subject>;
  teacherAssignedHours: Map<string, number>;
  onUpdateSubject: (
    classId: string,
    subjectId: string,
    teacherId: string,
    weeklyHours: number
  ) => void;
  onTransferLesson?: (
    fromTeacherId: string,
    toTeacherId: string,
    classId: string,
    subjectId: string
  ) => void;
}

export const TarifficationByTeacherView: React.FC<TarifficationByTeacherViewProps> = ({
  classesData,
  teachers,
  sortedTeachers,
  activeTeacher,
  onSelectTeacher,
  subjects,
  subjectMap,
  teacherAssignedHours,
  onUpdateSubject,
  onTransferLesson,
}) => {
  const [searchTeacherQuery, setSearchTeacherQuery] = useState("");
  const [teacherFilterSubjectId, setTeacherFilterSubjectId] = useState("ALL");
  const [workloadStatusFilter, setWorkloadStatusFilter] = useState<"ALL" | "UNDER" | "OPTIMAL" | "OVER">("ALL");

  // + Dars Biriktirish modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>(classesData[0]?.id || "");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || "");
  const [assignHours, setAssignHours] = useState<number>(2);

  // O'tkazish (Transfer) modal state
  const [transferTarget, setTransferTarget] = useState<{
    classId: string;
    subjectId: string;
    subjectName: string;
    className: string;
    hours: number;
  } | null>(null);
  const [targetTeacherId, setTargetTeacherId] = useState<string>("");

  const filteredTeachers = sortedTeachers.filter((t) => {
    if (teacherFilterSubjectId !== "ALL" && !(t.subjectIds || []).includes(teacherFilterSubjectId)) {
      return false;
    }
    if (searchTeacherQuery.trim()) {
      const q = searchTeacherQuery.toLowerCase().trim();
      if (!t.fullName.toLowerCase().includes(q)) return false;
    }
    const assigned = teacherAssignedHours.get(t.id) || 0;
    const capacity = t.weeklyHourCapacity || 20;

    if (workloadStatusFilter === "UNDER" && assigned >= capacity) return false;
    if (workloadStatusFilter === "OPTIMAL" && assigned !== capacity) return false;
    if (workloadStatusFilter === "OVER" && assigned <= capacity) return false;

    return true;
  });

  const activeTeacherAssignedHours = teacherAssignedHours.get(activeTeacher.id) || 0;
  const activeTeacherCapacity = activeTeacher.weeklyHourCapacity || 20;

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Chap: O'qituvchilar Ro'yxati (4 kolonka) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>O&apos;qituvchilar ({filteredTeachers.length})</span>
          </h2>
        </div>

        {/* Qidiruv va Filtrlar */}
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

          <div className="grid grid-cols-2 gap-1.5">
            <select
              value={teacherFilterSubjectId}
              onChange={(e) => setTeacherFilterSubjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">🌟 Barcha Fanlar</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <select
              value={workloadStatusFilter}
              onChange={(e) => setWorkloadStatusFilter(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">📊 Barcha Stavkalar</option>
              <option value="UNDER">⚡ To&apos;lmagan (&lt;stavka)</option>
              <option value="OPTIMAL">🟢 To&apos;liq (=stavka)</option>
              <option value="OVER">🔴 Ortiqcha (&gt;stavka)</option>
            </select>
          </div>
        </div>

        {/* O'qituvchilar ro'yxati */}
        <div className="space-y-1.5 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
          {filteredTeachers.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">Ustoz topilmadi</div>
          ) : (
            filteredTeachers.map((t) => {
              const isSelected = activeTeacher.id === t.id;
              const assigned = teacherAssignedHours.get(t.id) || 0;
              const capacity = t.weeklyHourCapacity || 20;
              const isOver = assigned > capacity;
              const isFull = assigned === capacity;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectTeacher(t.id)}
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
            })
          )}
        </div>
      </div>

      {/* O'ng: Tanlangan O'qituvchining Sinflar Taqsimoti (8 kolonka) */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        {/* Sarlavha va + Dars Biriktirish Tugmasi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <span>{activeTeacher.fullName}</span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold border ${
                  activeTeacherAssignedHours > activeTeacherCapacity
                    ? "bg-rose-100 text-rose-800 border-rose-200"
                    : activeTeacherAssignedHours === activeTeacherCapacity
                    ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-indigo-100 text-indigo-800 border-indigo-200"
                }`}
              >
                {activeTeacherAssignedHours} / {activeTeacherCapacity} soat
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              O&apos;qituvchiga biriktirilgan darslar, soatlar va sinflar ro&apos;yxati
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Dars Biriktirish</span>
          </button>
        </div>

        {/* Biriktirilgan Darslar Ro'yxati */}
        <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
          {classesData.flatMap((cls) =>
            (cls.subjects || [])
              .filter((cs) => cs.teacherId === activeTeacher.id && cs.weeklyHours > 0)
              .map((cs) => {
                const sub = subjectMap.get(cs.subjectId);
                return (
                  <div
                    key={`${cls.id}_${cs.subjectId}`}
                    className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 hover:bg-slate-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors"
                  >
                    {/* Sinf va Fan */}
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-xs px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white shadow-xs">
                        {cls.name}
                      </span>
                      <div>
                        <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: sub?.colorTag || "#6366F1" }}
                          />
                          <span>{sub?.name || "Fan"}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {cls.isPrimary ? "Boshlang'ich sinf" : "Yuqori sinf"}
                        </div>
                      </div>
                    </div>

                    {/* Stepper, O'tkazish va O'chirish */}
                    <div className="flex items-center justify-end gap-2">
                      {/* Soat Stepperi */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSubject(
                              cls.id,
                              cs.subjectId,
                              activeTeacher.id,
                              Math.max(0, cs.weeklyHours - 1)
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center cursor-pointer transition-colors"
                          title="1 soat kamaytirish"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-10 text-center font-mono font-black text-xs text-slate-900">
                          {cs.weeklyHours} s
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateSubject(
                              cls.id,
                              cs.subjectId,
                              activeTeacher.id,
                              cs.weeklyHours + 1
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition-colors"
                          title="1 soat oshirish"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Boshqa ustozga o'tkazish */}
                      <button
                        type="button"
                        onClick={() => {
                          setTransferTarget({
                            classId: cls.id,
                            subjectId: cs.subjectId,
                            subjectName: sub?.name || "Fan",
                            className: cls.name,
                            hours: cs.weeklyHours,
                          });
                          const otherTeacher = sortedTeachers.find((t) => t.id !== activeTeacher.id);
                          setTargetTeacherId(otherTeacher?.id || "");
                        }}
                        className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Darsni boshqa ustozga o'tkazish"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span className="hidden sm:inline">O&apos;tkazish</span>
                      </button>

                      {/* O'chirish */}
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateSubject(cls.id, cs.subjectId, "", 0)
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Darsni biriktirishdan olib tashlash"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
          )}

          {classesData.flatMap((cls) =>
            (cls.subjects || []).filter((cs) => cs.teacherId === activeTeacher.id && cs.weeklyHours > 0)
          ).length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-2xl">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">
                Bu o&apos;qituvchiga hozircha dars biriktirilmagan
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Yuqoridagi &quot;+ Dars Biriktirish&quot; tugmasi orqali dars qo&apos;shing
              </p>
            </div>
          )}
        </div>

        {/* + Dars Biriktirish Modali */}
        {isAssignModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  <span>{activeTeacher.fullName} ga dars biriktirish</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sinfni tanlang:
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {classesData.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} sinfi
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fanni tanlang:
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Haftalik dars soati:
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignHours(Math.max(1, assignHours - 1))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={assignHours}
                      onChange={(e) => setAssignHours(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center font-mono font-black text-sm bg-slate-50 border border-slate-200 rounded-xl py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setAssignHours(assignHours + 1)}
                      className="w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-semibold text-slate-500">soat</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedClassId || !selectedSubjectId) return;
                    onUpdateSubject(selectedClassId, selectedSubjectId, activeTeacher.id, assignHours);
                    setIsAssignModalOpen(false);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Biriktirish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 🔄 Darsni Boshqa Ustozga O'tkazish Modali */}
        {transferTarget && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
                  <span>Darsni boshqa ustozga o&apos;tkazish</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setTransferTarget(null)}
                  className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <div className="text-xs font-bold text-indigo-900">
                  {transferTarget.className} sinfi • {transferTarget.subjectName}
                </div>
                <div className="text-[11px] text-indigo-700 mt-0.5">
                  Haftalik yuklama: {transferTarget.hours} soat
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Yangi o&apos;qituvchini tanlang:
                </label>
                <select
                  value={targetTeacherId}
                  onChange={(e) => setTargetTeacherId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {sortedTeachers
                    .filter((t) => t.id !== activeTeacher.id)
                    .map((t) => {
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

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferTarget(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!targetTeacherId) return;
                    if (onTransferLesson) {
                      onTransferLesson(
                        activeTeacher.id,
                        targetTeacherId,
                        transferTarget.classId,
                        transferTarget.subjectId
                      );
                    } else {
                      onUpdateSubject(
                        transferTarget.classId,
                        transferTarget.subjectId,
                        targetTeacherId,
                        transferTarget.hours
                      );
                    }
                    setTransferTarget(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  O&apos;tkazish
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

