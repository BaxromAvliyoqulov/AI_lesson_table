"use client";

import React, { useRef } from "react";
import { SchoolClass, Subject, Teacher, Room, Lesson } from "@/types";
import { Printer, X, Download, FileText } from "lucide-react";

interface OfficialSchedulePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms?: Room[];
  lessons: Lesson[];
  filterScopeTitle?: string;
  schoolName?: string;
  region?: string;
  directorName?: string;
  vicePrincipalName?: string;
  psychologistName?: string;
  academicYear?: string;
  approvalDate?: string;
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
  { period: 4, time: "10.40-11.25" },
  { period: 5, time: "11.30-12.15" },
  { period: 6, time: "12.20-13.05" },
];

export const OfficialSchedulePrintModal: React.FC<OfficialSchedulePrintModalProps> = ({
  isOpen,
  onClose,
  classes,
  subjects,
  teachers,
  lessons,
  filterScopeTitle = "UMUMIY MAKTAB DARS JADVALI",
  schoolName = "39 - umumiy o'rta ta'lim maktabi",
  region = "Muzrabot tumani",
  directorName = "M. Ramazonov",
  vicePrincipalName = "N. Narziqulov",
  psychologistName = "F.I.Sh",
  academicYear = "2025 - 2026",
  approvalDate = "2026-yil 28-mart",
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));

  // Display teachers and numbers
  const teacherNumberMap = new Map<string, number>();
  teachers.forEach((t, idx) => teacherNumberMap.set(t.id, idx + 1));

  // Cell lessons map
  const cellLessonMap = new Map<string, Lesson[]>();
  lessons.forEach((l) => {
    const k = `${l.classId}_${l.dayOfWeek}_${l.periodNumber}`;
    const list = cellLessonMap.get(k) || [];
    list.push(l);
    cellLessonMap.set(k, list);
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto">
      {/* Print styles injected for A3 landscape optimization */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #official-print-area,
          #official-print-area * {
            visibility: visible;
          }
          #official-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 5mm;
            background: white !important;
            color: black !important;
          }
          @page {
            size: A3 landscape;
            margin: 4mm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-7xl max-h-[95vh] bg-white rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden text-black font-sans">
        {/* Top Action Bar (No Print) */}
        <div className="no-print flex items-center justify-between px-6 py-3.5 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm">
              🖨️
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide">39-Maktab Rasmiy A3 Chop Etish (Print to PDF)</h2>
              <p className="text-[11px] text-slate-400">Direktor muhri, o'qituvchilar reestri va Zauch imzosi bilan</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish (Ctrl + P)</span>
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

        {/* Printable Document Area */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50/50 flex justify-center">
          <div
            id="official-print-area"
            ref={printRef}
            className="w-full bg-white p-4 text-black border border-slate-200 shadow-sm rounded-lg"
          >
            {/* 1. Rasmiy Hujjat Sarlavhasi (Header) */}
            <div className="w-full mb-3 font-serif">
              <div className="flex justify-between items-start text-xs leading-tight mb-2">
                {/* Chap: TASDIQLAYMAN */}
                <div className="max-w-xs">
                  <p className="font-bold tracking-widest text-xs uppercase">TASDIQLAYMAN</p>
                  <p className="mt-0.5 text-[11px]">
                    Maktab direktori: <span className="inline-block border-b border-black w-20"></span>{" "}
                    <span className="font-semibold">{directorName}</span>
                  </p>
                  <p className="text-[10px] text-gray-700 mt-0.5">{approvalDate}</p>
                </div>

                {/* O'rta: Maktab nomi va Bosqich */}
                <div className="text-center flex-1 px-4">
                  <p className="text-xs font-semibold">
                    {region} <span className="font-bold text-sm">{schoolName}</span>ning
                  </p>
                  <p className="text-xs font-semibold">
                    {academicYear} o'quv yili uchun tuzilgan
                  </p>
                  <h1 className="text-base sm:text-lg font-extrabold tracking-[0.2em] uppercase mt-0.5">
                    {filterScopeTitle} &nbsp;&nbsp; D A R S &nbsp;&nbsp; J A D V A L I
                  </h1>
                </div>

                {/* O'ng bo'sh joy */}
                <div className="w-24"></div>
              </div>
            </div>

            {/* 2. Jadval va Reestr */}
            <div className="w-full flex items-start gap-2">
              {/* Asosiy Jadval */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full border-collapse border border-black text-center text-[9px] leading-tight font-sans">
                  <thead>
                    <tr className="border-b border-black bg-slate-200 font-bold">
                      <th rowSpan={2} className="border border-black px-1 py-1 w-5 text-center text-[10px]">
                        Kun
                      </th>
                      <th rowSpan={2} className="border border-black px-1 py-1 w-4 text-center text-[10px]">
                        D
                      </th>
                      <th rowSpan={2} className="border border-black px-1 py-1 w-12 text-center text-[9px]">
                        Vaqt
                      </th>
                      {classes.map((cls) => (
                        <th
                          key={cls.id}
                          colSpan={2}
                          className="border border-black px-1 py-1 text-center font-black text-[10px] bg-slate-100 min-w-[70px]"
                        >
                          {cls.name}
                        </th>
                      ))}
                    </tr>
                    <tr className="border-b-2 border-black bg-slate-100 font-bold text-[8.5px]">
                      {classes.map((cls) => (
                        <React.Fragment key={`sub_${cls.id}`}>
                          <th className="border border-black px-0.5 py-0.5 text-center">Fan</th>
                          <th className="border border-black px-0.5 py-0.5 text-center w-5 bg-slate-200">№</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {DAYS.map((day) => (
                      <React.Fragment key={day.id}>
                        {PERIOD_TIMES.map((periodInfo, pIndex) => {
                          const isLastPeriod = pIndex === PERIOD_TIMES.length - 1;

                          return (
                            <tr
                              key={`${day.id}_${periodInfo.period}`}
                              className={isLastPeriod ? "border-b-[2.5px] border-black" : "border-b border-black"}
                            >
                              {pIndex === 0 && (
                                <td
                                  rowSpan={PERIOD_TIMES.length}
                                  className="border-2 border-black bg-slate-100 font-black text-[9.5px] tracking-[0.2em] text-center align-middle select-none w-5 p-0.5 text-slate-900"
                                  style={{
                                    writingMode: "vertical-lr",
                                    transform: "rotate(180deg)",
                                  }}
                                >
                                  {day.name}
                                </td>
                              )}

                              <td className="border border-black font-bold text-[9.5px] px-0.5 py-0.5">
                                {periodInfo.period}
                              </td>

                              <td className="border border-black font-mono text-[8px] font-semibold px-0.5 py-0.5 whitespace-nowrap">
                                {periodInfo.time}
                              </td>

                              {classes.map((cls) => {
                                const isPrimarySat = day.id === 6 && (cls.isPrimary || cls.grade <= 4);
                                if (isPrimarySat) {
                                  return (
                                    <td
                                      key={`cell_${cls.id}_${day.id}_${periodInfo.period}`}
                                      colSpan={2}
                                      className="border border-black bg-slate-50 text-slate-400 text-[8px] font-bold text-center"
                                    >
                                      —
                                    </td>
                                  );
                                }

                                const cellLessons = cellLessonMap.get(`${cls.id}_${day.id}_${periodInfo.period}`) || [];
                                const l1 = cellLessons[0];
                                const l2 = cellLessons[1];

                                const sub1 = l1 ? subjectMap.get(l1.subjectId) : undefined;
                                const sub2 = l2 ? subjectMap.get(l2.subjectId) : undefined;

                                const num1 = l1 ? teacherNumberMap.get(l1.teacherId) : undefined;
                                const num2 = l2 ? teacherNumberMap.get(l2.teacherId) : undefined;

                                if (cellLessons.length > 1) {
                                  // Split Group Parallel Cell
                                  return (
                                    <React.Fragment key={`cell_${cls.id}_${day.id}_${periodInfo.period}`}>
                                      <td className="border border-black px-0.5 py-0.5 text-left text-[7.5px] leading-tight max-w-[65px] truncate">
                                        <div className="border-b border-black/30 pb-0.5 truncate font-semibold">
                                          1-gr: {sub1?.shortName || sub1?.name || "Fan"}
                                        </div>
                                        <div className="pt-0.5 truncate font-semibold">
                                          2-gr: {sub2?.shortName || sub2?.name || "Fan"}
                                        </div>
                                      </td>
                                      <td className="border border-black px-0.5 py-0.5 text-center font-mono font-black text-[8px] w-5 bg-slate-50">
                                        <div className="border-b border-black/30 pb-0.5">{num1 || ""}</div>
                                        <div className="pt-0.5">{num2 || ""}</div>
                                      </td>
                                    </React.Fragment>
                                  );
                                }

                                return (
                                  <React.Fragment key={`cell_${cls.id}_${day.id}_${periodInfo.period}`}>
                                    <td className="border border-black px-1 py-0.5 text-left font-semibold text-[8.5px] max-w-[65px] truncate">
                                      {sub1?.shortName || sub1?.name || (l1 ? "Fan" : "—")}
                                    </td>
                                    <td className="border border-black px-0.5 py-0.5 text-center font-mono font-black text-[8.5px] w-5 bg-slate-50">
                                      {num1 || ""}
                                    </td>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* O'qituvchilar Reestri */}
              <div className="w-56 shrink-0 border border-black text-[8px] leading-tight">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-200 border-b border-black font-bold">
                      <th className="border-r border-black p-0.5 w-5 text-center">№</th>
                      <th className="border-r border-black p-0.5 text-left">O'qituvchi F.I.Sh</th>
                      <th className="p-0.5 text-center w-6">Soat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t, idx) => {
                      const tLessons = lessons.filter((l) => l.teacherId === t.id);
                      return (
                        <tr key={t.id} className="border-b border-black/50">
                          <td className="border-r border-black p-0.5 text-center font-mono font-bold">
                            {idx + 1}
                          </td>
                          <td className="border-r border-black p-0.5 text-left truncate font-semibold">
                            {t.fullName}
                          </td>
                          <td className="p-0.5 text-center font-mono font-bold">
                            {tLessons.length}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Rasmiy Imzolar (Footer) */}
            <div className="w-full mt-4 font-serif flex justify-between items-center text-xs px-4">
              <div>
                O'quv ishlari bo'yicha direktor o'rinbosari:{" "}
                <span className="inline-block border-b border-black w-24"></span>{" "}
                <span className="font-semibold">{vicePrincipalName}</span>
              </div>

              <div>
                Amaliyotchi Ruhshunos:{" "}
                <span className="inline-block border-b border-black w-24"></span>{" "}
                <span className="font-semibold">{psychologistName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
