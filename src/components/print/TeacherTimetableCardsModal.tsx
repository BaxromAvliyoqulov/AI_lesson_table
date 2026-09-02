"use client";

import React, { useState } from "react";
import { Teacher, SchoolClass, Subject, Room, Lesson } from "@/types";
import { Printer, X, User, Search, BookOpen, Clock, Calendar, CheckCircle2 } from "lucide-react";

interface TeacherTimetableCardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  rooms?: Room[];
  lessons: Lesson[];
  schoolName?: string;
  academicYear?: string;
}

const DAYS = [
  { id: 1, name: "DUSHANBA" },
  { id: 2, name: "SESHANBA" },
  { id: 3, name: "CHORSHANBA" },
  { id: 4, name: "PAYSHANBA" },
  { id: 5, name: "JUMA" },
  { id: 6, name: "SHANBA" },
];

const PERIOD_TIMES = [
  { period: 1, time: "08:00 - 08:45" },
  { period: 2, time: "08:50 - 09:35" },
  { period: 3, time: "09:40 - 10:25" },
  { period: 4, time: "10:40 - 11:25" },
  { period: 5, time: "11:30 - 12:15" },
  { period: 6, time: "12:20 - 13:05" },
];

export const TeacherTimetableCardsModal: React.FC<TeacherTimetableCardsModalProps> = ({
  isOpen,
  onClose,
  teachers,
  classes,
  subjects,
  lessons,
  schoolName = "39 - umumiy o'rta ta'lim maktabi",
  academicYear = "2025 - 2026",
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen) return null;

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));

  // 1. Alifbo bo'yicha saralangan barcha o'qituvchilar
  const sortedTeachers = [...teachers].sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "uz")
  );

  // 2. Fan bo'yicha mos keluvchi o'qituvchilar
  const teachersBySubject = selectedSubjectId === "ALL"
    ? sortedTeachers
    : sortedTeachers.filter((t) => (t.subjectIds || []).includes(selectedSubjectId));

  // 3. Qidiruv va tanlangan o'qituvchi bo'yicha filtr
  const filteredTeachers = teachersBySubject.filter((t) => {
    if (selectedTeacherId !== "ALL" && t.id !== selectedTeacherId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return t.fullName.toLowerCase().includes(q);
    }
    return true;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      {/* Print CSS for teacher cards */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #teacher-cards-print-area,
          #teacher-cards-print-area * {
            visibility: visible;
          }
          #teacher-cards-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 10mm;
            background: white !important;
            color: black !important;
          }
          .teacher-card-page {
            page-break-after: always;
            break-after: page;
            margin-bottom: 20mm;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-5xl max-h-[95vh] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden text-black font-sans">
        {/* Top Header & Filters */}
        <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base">
              📄
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-wide">
                O&apos;qituvchilar Shaxsiy Dars Jadvali Varaqalari
              </h2>
              <p className="text-xs text-slate-400">
                Har bir o&apos;qituvchining haftalik dars jadvalini A4/A5 varaqda alohida chop etish
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>
                {selectedTeacherId === "ALL"
                  ? `Barcha o&apos;qituvchilarni chop etish (${filteredTeachers.length} ta)`
                  : "Ushbu o'qituvchini chop etish"}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-slate-100 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="O'qituvchi ism-familiyasi bo'yicha qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-black font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Fan Bo'yicha Filtr */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Fan:</span>
              </span>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setSelectedTeacherId("ALL"); // Reset teacher when subject changes
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-black font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ALL">🌟 Barcha Fanlar ({subjects.length} ta)</option>
                {subjects.map((s) => {
                  const teachersCount = sortedTeachers.filter((t) =>
                    (t.subjectIds || []).includes(s.id)
                  ).length;
                  return (
                    <option key={s.id} value={s.id}>
                      {s.name} ({teachersCount} nafar ustoz)
                    </option>
                  );
                })}
              </select>
            </div>

            {/* O'qituvchi Tanlash */}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>O&apos;qituvchi:</span>
              </span>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-black font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-xs truncate"
              >
                <option value="ALL">
                  {selectedSubjectId === "ALL"
                    ? `🌟 Barcha o'qituvchilar (${teachersBySubject.length} ta)`
                    : `🎯 Shu fandagi barcha ustozlar (${teachersBySubject.length} ta)`}
                </option>
                {teachersBySubject.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Printable Teacher Cards Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
          <div id="teacher-cards-print-area" className="space-y-8">
            {filteredTeachers.length === 0 ? (
              <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-200">
                <p className="font-bold text-sm">Mos o&apos;qituvchi topilmadi</p>
                <p className="text-xs text-slate-400 mt-1">
                  Filtrni yoki qidiruv so&apos;zini o&apos;zgartirib ko&apos;ring
                </p>
              </div>
            ) : (
              filteredTeachers.map((teacher, tIdx) => {
                const teacherLessons = lessons.filter((l) => l.teacherId === teacher.id);
                const totalHours = teacherLessons.length;

                // Homeroom class if any
                const homeroomClass = classes.find((c) => c.homeroomTeacherId === teacher.id);

                // Teacher subjects names
                const teacherSubjectNames = (teacher.subjectIds || [])
                  .map((sid) => subjectMap.get(sid)?.name)
                  .filter(Boolean)
                  .join(", ");

                return (
                  <div
                    key={teacher.id}
                    className="teacher-card-page bg-white p-6 rounded-2xl border border-slate-300 shadow-sm font-sans"
                  >
                    {/* Card Header */}
                    <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-bold">
                          {schoolName} • {academicYear} O&apos;quv Yili
                        </p>
                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 flex-wrap">
                          <span>№{tIdx + 1}. {teacher.fullName}</span>
                          {homeroomClass && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              {homeroomClass.name} Sinf Rahbari
                            </span>
                          )}
                          {teacherSubjectNames && (
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                              {teacherSubjectNames}
                            </span>
                          )}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 flex-wrap">
                        <div>
                          Haftalik yuklama:{" "}
                          <span className="text-indigo-700 text-sm font-black">{totalHours} soat</span>
                        </div>
                        {teacher.methodDayOfWeek && (
                          <div className="text-emerald-800 border-l border-slate-300 pl-3 flex items-center gap-1">
                            <span>Metod kuni:</span>
                            <span className="font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                              {DAYS.find((d) => d.id === teacher.methodDayOfWeek)?.name || "—"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 6-Kunlik Haftalik Jadval */}
                    <table className="w-full border-collapse border border-black text-center text-xs">
                      <thead>
                        <tr className="bg-slate-200 font-black border-b border-black">
                          <th className="border border-black px-2 py-1.5 w-10">Dars</th>
                          <th className="border border-black px-2 py-1.5 w-24">Vaqt</th>
                          {DAYS.map((day) => {
                            const isMethodDay = teacher.methodDayOfWeek === day.id;
                            return (
                              <th
                                key={day.id}
                                className={`border border-black px-2 py-1.5 font-bold ${
                                  isMethodDay ? "bg-emerald-100 text-emerald-900" : ""
                                }`}
                              >
                                <div>{day.name}</div>
                                {isMethodDay && (
                                  <div className="text-[9px] font-black text-emerald-700 uppercase tracking-tighter">
                                    (Metod kuni)
                                  </div>
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {PERIOD_TIMES.map((pt) => (
                          <tr key={pt.period} className="border-b border-black">
                            <td className="border border-black font-black bg-slate-100 p-1">
                              {pt.period}
                            </td>
                            <td className="border border-black font-mono text-[10px] text-slate-600 p-1">
                              {pt.time}
                            </td>

                            {DAYS.map((day) => {
                              const isMethodDay = teacher.methodDayOfWeek === day.id;
                              const l = teacherLessons.find(
                                (item) => item.dayOfWeek === day.id && item.periodNumber === pt.period
                              );
                              const cls = l ? classMap.get(l.classId) : undefined;
                              const sub = l ? subjectMap.get(l.subjectId) : undefined;

                              if (!l) {
                                if (isMethodDay) {
                                  return (
                                    <td
                                      key={day.id}
                                      className="border border-black font-mono text-[10px] p-1 bg-emerald-50/50 text-emerald-600/70"
                                    >
                                      —
                                    </td>
                                  );
                                }
                                return (
                                  <td
                                    key={day.id}
                                    className="border border-black text-slate-300 font-mono text-[11px] p-1 bg-white"
                                  >
                                    —
                                  </td>
                                );
                              }

                              // Agar dars metod kuniga tushib qolgan bo'lsa (Ziddiyat)
                              if (isMethodDay) {
                                return (
                                  <td
                                    key={day.id}
                                    className="border border-black p-1 bg-rose-100 border-rose-600 font-semibold"
                                    title="Ziddiyat: O'qituvchining metod kuniga dars qo'yilgan!"
                                  >
                                    <div className="flex flex-col items-center text-rose-900">
                                      <span className="font-black text-xs">
                                        {cls?.name || "Sinf"}
                                      </span>
                                      <span className="text-[10px] truncate max-w-[90px]">
                                        {sub?.shortName || sub?.name || "Fan"}
                                      </span>
                                      <span className="text-[8px] font-bold text-rose-600 bg-rose-200 px-1 rounded mt-0.5">
                                        Metod kuni!
                                      </span>
                                    </div>
                                  </td>
                                );
                              }

                              return (
                                <td
                                  key={day.id}
                                  className="border border-black p-1 bg-indigo-50/70 font-semibold"
                                >
                                  <div className="flex flex-col items-center">
                                    <span className="font-black text-xs text-indigo-950">
                                      {cls?.name || "Sinf"}
                                    </span>
                                    <span className="text-[10px] text-slate-700 truncate max-w-[90px]">
                                      {sub?.shortName || sub?.name || "Fan"}
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Metod kuni eslatmasi */}
                    {teacher.methodDayOfWeek && (
                      <div className="mt-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1 flex items-center justify-between">
                        <span>
                          📌 <strong>{DAYS.find((d) => d.id === teacher.methodDayOfWeek)?.name}</strong> — o&apos;qituvchining rasmiy metodik kuni (o&apos;quv mashg&apos;ulotlaridan ozod).
                        </span>
                        <span className="font-bold text-[10px] uppercase text-emerald-700">
                          MMTV Standarti
                        </span>
                      </div>
                    )}

                    {/* Card Footer Signature */}
                    <div className="mt-4 pt-3 flex justify-between items-center text-xs font-serif text-slate-700">
                      <div>
                        O&apos;qituvchi imzosi: <span className="inline-block border-b border-black w-28"></span>
                      </div>
                      <div>
                        O&apos;IBDO&apos; (Zauch) imzosi: <span className="inline-block border-b border-black w-28"></span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

                  {/* Card Footer Signature */}
                  <div className="mt-4 pt-3 flex justify-between items-center text-xs font-serif text-slate-700">
                    <div>
                      O'qituvchi imzosi: <span className="inline-block border-b border-black w-28"></span>
                    </div>
                    <div>
                      O'IBDO' (Zauch) imzosi: <span className="inline-block border-b border-black w-28"></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
