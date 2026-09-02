"use client";

import React, { useState } from "react";
import { SchoolClass, Subject, Teacher } from "@/types";
import { Users, Search, Trash2 } from "lucide-react";

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
}

export const TarifficationByTeacherView: React.FC<TarifficationByTeacherViewProps> = ({
  classesData,
  sortedTeachers,
  activeTeacher,
  onSelectTeacher,
  subjects,
  subjectMap,
  teacherAssignedHours,
  onUpdateSubject,
}) => {
  const [searchTeacherQuery, setSearchTeacherQuery] = useState("");
  const [teacherFilterSubjectId, setTeacherFilterSubjectId] = useState("ALL");

  return (
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
                          onUpdateSubject(cls.id, cs.subjectId, "", 0)
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
  );
};
