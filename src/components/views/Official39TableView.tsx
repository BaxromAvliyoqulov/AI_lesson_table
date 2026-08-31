"use client";

import React, { useMemo, useState } from "react";
import {
  SchoolClass,
  Subject,
  Teacher,
  Room,
  Lesson,
  Branch,
  Shift,
} from "@/types";
import {
  Printer,
  Download,
  FileSpreadsheet,
  Edit2,
  Lock,
  Unlock,
  Check,
  X,
  Building2,
  Sparkles,
} from "lucide-react";

interface Official39TableViewProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  branches?: Branch[];
  shifts?: Shift[];
  onLessonsChange?: (lessons: Lesson[]) => void;
  onExportExcel?: () => void;
  schoolName?: string;
  region?: string;
  directorName?: string;
  vicePrincipalName?: string;
  psychologistName?: string;
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
  { period: 1, time: "8.00-8.45" },
  { period: 2, time: "8.50-9.35" },
  { period: 3, time: "9.40-10.25" },
  { period: 4, time: "10.35-11.20" },
  { period: 5, time: "11.25-12.10" },
  { period: 6, time: "12.15-13.00" },
];

export const Official39TableView: React.FC<Official39TableViewProps> = ({
  classes,
  subjects,
  teachers,
  rooms,
  lessons,
  branches = [],
  shifts = [],
  onLessonsChange,
  onExportExcel,
  schoolName = "39 - umumiy o'rta ta'lim maktabi",
  region = "Muzrabot tumani",
  directorName = "M. Ramazonov",
  vicePrincipalName = "N. Narziqulov",
  psychologistName = "F.I.Sh",
  academicYear = "2025 - 2026",
}) => {
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [editingCell, setEditingCell] = useState<{
    classId: string;
    day: number;
    period: number;
    lesson?: Lesson;
  } | null>(null);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  // Har bir o'qituvchiga tartib raqami (1..N)
  const teacherNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    teachers.forEach((t, i) => map.set(t.id, i + 1));
    return map;
  }, [teachers]);

  // Lessons map: `${classId}_${day}_${period}` -> Lesson
  const lessonMap = useMemo(() => {
    const map = new Map<string, Lesson>();
    for (const l of lessons) {
      map.set(`${l.classId}_${l.dayOfWeek}_${l.periodNumber}`, l);
    }
    return map;
  }, [lessons]);

  // Filial bo'yicha filtrlangan sinflar
  const displayClasses = useMemo(() => {
    if (selectedBranch === "ALL") return classes;
    return classes.filter((c) => c.branchId === selectedBranch);
  }, [classes, selectedBranch]);

  // Har bir sinf uchun jami dars soatlarini hisoblash
  const classTotalHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const cls of displayClasses) {
      const count = lessons.filter((l) => l.classId === cls.id).length;
      map.set(cls.id, count);
    }
    return map;
  }, [displayClasses, lessons]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full flex flex-col bg-white text-black p-4 sm:p-6 print:p-0 select-text">
      {/* ── TOP ACTION BAR (Ekran rejimida ko'rinadi, chop etganda yashiriladi) ── */}
      <div className="no-print mb-6 p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex flex-wrap items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm sm:text-base text-white">
                39-Maktab Rasmiy Dars Jadvali
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Rasmiy Andoza
              </span>
            </div>
            <p className="text-xs text-slate-400">
              O'quv ishlari bo'yicha direktor o'rinbosari (Zauch) va tuman bo'limi uchun rasmiy shakl
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {branches.length > 1 && (
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs outline-none"
            >
              <option value="ALL">Barcha binolar</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          )}

          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Excel yuklab olish</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Chop etish (Print / PDF)</span>
          </button>
        </div>
      </div>

      {/* ── 1. RASMIY HUJJAT SARLAVHASI (TASDIQLAYMAN & MAKTAB NOMI) ─────────── */}
      <div className="w-full mb-4 font-serif">
        {/* Yuqori qator: TASDIQLAYMAN va Maktab nomi */}
        <div className="flex justify-between items-start text-xs sm:text-sm leading-relaxed mb-3">
          {/* Chap: TASDIQLAYMAN */}
          <div className="max-w-xs">
            <p className="font-bold tracking-widest text-sm sm:text-base uppercase">TASDIQLAYMAN</p>
            <p className="mt-1">
              Maktab direktori: <span className="inline-block border-b border-black w-24"></span> {directorName}
            </p>
            <p className="text-[11px] text-gray-700 mt-0.5">2026-yil 28-mart</p>
          </div>

          {/* O'rta / O'ng: Maktab nomi */}
          <div className="text-center flex-1 px-4">
            <p className="text-xs sm:text-sm font-semibold tracking-wide">
              {region} <span className="font-bold text-base">{schoolName}</span>ning
            </p>
            <p className="text-xs sm:text-sm font-semibold">
              {academicYear} o'quv yili uchun tuzilgan
            </p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-[0.3em] uppercase mt-1">
              D A R S &nbsp;&nbsp; J A D V A L I
            </h1>
          </div>

          {/* O'ng bo'sh joy (muvozanat uchun) */}
          <div className="w-32 hidden sm:block"></div>
        </div>
      </div>

      {/* ── 2. ASOSIY SPREADSHEET JADVALI VA O'QITUVCHILAR REESTRI ──────────── */}
      <div className="w-full overflow-x-auto border-t-2 border-b-2 border-black">
        <div className="flex items-start">
          {/* Asosiy Dars Jadvali */}
          <table className="border-collapse border border-black text-center text-[10px] sm:text-[11px] leading-tight font-sans">
            <thead>
              {/* 1-qator: Sarlavhalar va Sinf nomlari */}
              <tr className="bg-gray-100 font-bold border-b border-black">
                <th rowSpan={2} className="border border-black px-1.5 py-1 w-6 text-center">
                  Kun
                </th>
                <th rowSpan={2} className="border border-black px-1 py-1 w-5 text-center">
                  Dars
                </th>
                <th rowSpan={2} className="border border-black px-1.5 py-1 w-16 text-center font-mono">
                  Vaqti
                </th>

                {displayClasses.map((cls) => (
                  <th
                    key={cls.id}
                    colSpan={2}
                    className="border border-black px-2 py-1 text-center font-bold text-xs bg-gray-50 min-w-[90px]"
                  >
                    {cls.name}
                  </th>
                ))}
              </tr>

              {/* 2-qator: Har bir sinf tagida Fan | № ustunlari */}
              <tr className="bg-gray-200 font-semibold text-[9px] border-b-2 border-black">
                {displayClasses.map((cls) => (
                  <React.Fragment key={`sub_${cls.id}`}>
                    <th className="border border-black px-1 py-0.5 text-center w-16">Fan</th>
                    <th className="border border-black px-1 py-0.5 text-center w-6 bg-gray-300 font-bold">
                      №
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {DAYS.map((day) => (
                <React.Fragment key={day.id}>
                  {PERIOD_TIMES.map((periodInfo, pIndex) => (
                    <tr
                      key={`${day.id}_${periodInfo.period}`}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        pIndex === PERIOD_TIMES.length - 1 ? "border-b-2 border-black" : "border-b border-gray-300"
                      }`}
                    >
                      {/* Vertikal Kun ustuni (Har bir kunning faqat 1-darsida render bo'ladi va 6 qatorga birlashadi) */}
                      {pIndex === 0 && (
                        <td
                          rowSpan={6}
                          className="border border-black bg-gray-100 font-bold text-[10px] tracking-wider text-center align-middle select-none w-6 p-1"
                          style={{
                            writingMode: "vertical-lr",
                            transform: "rotate(180deg)",
                          }}
                        >
                          {day.name}
                        </td>
                      )}

                      {/* Dars raqami (1..6) */}
                      <td className="border border-black font-bold text-center px-1 py-1 w-5 bg-gray-50">
                        {periodInfo.period}
                      </td>

                      {/* Dars vaqti (8.00-8.45...) */}
                      <td className="border border-black font-mono text-[9px] text-gray-700 px-1 py-1 w-16 text-center whitespace-nowrap bg-gray-50">
                        {periodInfo.time}
                      </td>

                      {/* Sinf Katakchalari: Fan nomi (chap) + O'qituvchi tartib raqami (o'ng) */}
                      {displayClasses.map((cls) => {
                        const lesson = lessonMap.get(`${cls.id}_${day.id}_${periodInfo.period}`);
                        const subject = lesson ? subjectMap.get(lesson.subjectId) : undefined;
                        const teacherNum = lesson ? teacherNumberMap.get(lesson.teacherId) : undefined;
                        const isPrimarySaturday = day.id === 6 && (cls.isPrimary || cls.grade <= 4);

                        if (isPrimarySaturday) {
                          return (
                            <React.Fragment key={`cell_${cls.id}_${day.id}_${periodInfo.period}`}>
                              <td
                                colSpan={2}
                                className="border border-black bg-gray-100 text-gray-400 text-[8px] font-semibold text-center p-0.5 select-none"
                              >
                                {pIndex === 0 ? "Dam" : ""}
                              </td>
                            </React.Fragment>
                          );
                        }

                        return (
                          <React.Fragment key={`cell_${cls.id}_${day.id}_${periodInfo.period}`}>
                            {/* Fan nomi */}
                            <td
                              className="border border-black px-1 py-0.5 text-left font-medium truncate max-w-[70px]"
                              title={subject?.name || ""}
                            >
                              {subject?.shortName || subject?.name || ""}
                            </td>

                            {/* O'qituvchi tartib raqami (№) */}
                            <td
                              className={`border border-black px-1 py-0.5 text-center font-bold text-[10px] w-6 ${
                                teacherNum ? "bg-amber-50/70 text-black font-mono" : "text-gray-300"
                              }`}
                              title={
                                lesson
                                  ? teacherMap.get(lesson.teacherId)?.fullName || "O'qituvchi"
                                  : ""
                              }
                            >
                              {teacherNum || ""}
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}

              {/* ── 3. PASTDAGI STATISTIKA QATORLARI ─────────────────────────── */}
              {/* Dars soati jami */}
              <tr className="bg-gray-200 font-bold border-t-2 border-b border-black text-xs">
                <td colSpan={3} className="border border-black px-2 py-1 text-right">
                  Dars soati
                </td>
                {displayClasses.map((cls) => (
                  <td
                    key={`hours_${cls.id}`}
                    colSpan={2}
                    className="border border-black px-1 py-1 text-center font-mono font-bold text-xs bg-gray-100"
                  >
                    {classTotalHours.get(cls.id) || 0}
                  </td>
                ))}
              </tr>

              {/* Sinf rahbar F.I.Sh */}
              <tr className="bg-white font-semibold border-b-2 border-black text-[10px]">
                <td colSpan={3} className="border border-black px-2 py-1 text-right font-bold">
                  Sinf rahbar
                </td>
                {displayClasses.map((cls) => {
                  const homeroomTeacher = teachers.find((t) => t.homeroomClassId === cls.id);
                  const shortName = homeroomTeacher
                    ? homeroomTeacher.fullName.split(" ").slice(0, 2).join(" ")
                    : "—";

                  return (
                    <td
                      key={`homeroom_${cls.id}`}
                      colSpan={2}
                      className="border border-black px-1 py-1 text-center truncate max-w-[85px] text-[9px]"
                      title={homeroomTeacher?.fullName || "Sinf rahbari"}
                    >
                      {shortName}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>

          {/* O'ng tomondagi O'qituvchilarning I.F.O Reestri (Legend) */}
          <div className="ml-3 shrink-0 border border-black font-sans text-[10px] w-60 bg-white">
            <div className="bg-gray-100 border-b border-black p-1 text-center font-bold text-xs uppercase">
              O'qituvchilarning I.F.O
            </div>
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-gray-200 border-b border-black text-[9px]">
                  <th className="border-r border-black p-1 text-center w-7 font-bold">№</th>
                  <th className="p-1 font-bold">O'qituvchi F.I.Sh</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher, index) => (
                  <tr
                    key={teacher.id}
                    className={`border-b border-gray-200 hover:bg-amber-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="border-r border-black p-1 text-center font-mono font-bold text-gray-700">
                      {index + 1}
                    </td>
                    <td className="p-1 font-medium truncate max-w-[190px]">
                      {teacher.fullName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 4. RASMIY IMZO QATORLARI (PASTKI BLOK) ───────────────────────────── */}
      <div className="w-full mt-6 flex justify-between items-center text-xs sm:text-sm font-serif pt-4">
        <div>
          <p>
            <span className="font-bold">O'quv ishlar bo'yicha direktor o'rinbosari:</span>{" "}
            <span className="inline-block border-b border-black w-36"></span> {vicePrincipalName}
          </p>
        </div>

        <div>
          <p>
            <span className="font-bold">Ruhshunos:</span>{" "}
            <span className="inline-block border-b border-black w-36"></span> {psychologistName}
          </p>
        </div>
      </div>
    </div>
  );
};
