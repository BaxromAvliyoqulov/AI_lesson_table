"use client";

import React from "react";
import { SchoolClass, Subject, Teacher } from "@/types";

interface TarifficationMatrixViewProps {
  filteredClasses: SchoolClass[];
  subjects: Subject[];
  sortedTeachers: Teacher[];
  onUpdateSubject: (
    classId: string,
    subjectId: string,
    teacherId: string,
    weeklyHours: number
  ) => void;
}

export const TarifficationMatrixView: React.FC<TarifficationMatrixViewProps> = ({
  filteredClasses,
  subjects,
  sortedTeachers,
  onUpdateSubject,
}) => {
  return (
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
                const totalH = (cls.subjects || []).reduce((sum, s) => sum + s.weeklyHours, 0);
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
                  const cs = (cls.subjects || []).find((item) => item.subjectId === sub.id);
                  const curTeacherId = cs?.teacherId || "";
                  const curHours = cs?.weeklyHours || 0;

                  return (
                    <td key={`${cls.id}_${sub.id}`} className="border border-slate-300 p-1 text-center align-middle">
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded p-1 shadow-2xs">
                        <select
                          value={curTeacherId}
                          onChange={(e) =>
                            onUpdateSubject(
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
                            onUpdateSubject(
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
  );
};
