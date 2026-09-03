import React from "react";
import { Teacher } from "@/types";

interface Official39TeacherSidebarProps {
  teachers: Teacher[];
  teacherNumberMap: Map<string, number>;
  teacherSubjectsMap: Map<string, string>;
  hoveredTeacherId: string | null;
  lockedTeacherIds?: string[];
  onToggleLockTeacher?: (teacherId: string) => void;
  onHoverTeacher: (teacherId: string | null) => void;
}

export const Official39TeacherSidebar: React.FC<Official39TeacherSidebarProps> = ({
  teachers,
  teacherNumberMap,
  teacherSubjectsMap,
  hoveredTeacherId,
  lockedTeacherIds,
  onToggleLockTeacher,
  onHoverTeacher,
}) => {
  return (
    <div className="ml-3 shrink-0 border-2 border-black font-sans text-[10px] w-84 bg-white shadow-sm">
      <div className="bg-slate-100 border-b-2 border-black p-1.5 text-center font-black text-xs uppercase tracking-wider text-slate-900">
        O'qituvchilar va Fanlar Reestri
      </div>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="bg-slate-200 border-b-2 border-black text-[9.5px]">
            <th className="border border-black p-1 text-center w-7 font-black text-slate-900">№</th>
            <th className="border border-black p-1 font-black text-slate-900 w-36">O'qituvchi F.I.Sh</th>
            <th className="border border-black p-1 font-black text-slate-900">O'tadigan Fani / Fanlari</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher, tIdx) => {
            const num = teacherNumberMap.get(teacher.id) ?? (tIdx + 1);
            const isHovered = hoveredTeacherId === teacher.id;
            const isLocked = lockedTeacherIds?.includes(teacher.id);
            const subjectsStr = teacherSubjectsMap.get(teacher.id) || "—";
            const isEven = tIdx % 2 !== 0;

            return (
              <tr
                key={teacher.id}
                onMouseEnter={() => onHoverTeacher(teacher.id)}
                onMouseLeave={() => onHoverTeacher(null)}
                className={`border-b border-black transition-colors cursor-pointer ${
                  isHovered
                    ? "bg-amber-200 font-bold"
                    : isLocked
                    ? "bg-rose-50"
                    : isEven
                    ? "bg-slate-50"
                    : "bg-white"
                }`}
                title={`${teacher.fullName} (${subjectsStr}) — ${
                  isLocked ? "🔒 Darslari qulflangan" : "Darslarini jadvalda ko'rish"
                }`}
              >
                <td className="border border-black p-1 text-center font-mono font-black text-slate-900 bg-slate-100">
                  {num}
                </td>
                <td className="border border-black p-1 font-bold text-slate-900">
                  <div className="flex items-center justify-between gap-1">
                    <span className="leading-tight break-words max-w-[150px]">{teacher.fullName}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLockTeacher?.(teacher.id);
                      }}
                      className={`p-0.5 rounded text-[10px] cursor-pointer transition-transform active:scale-90 hover:scale-110 ${
                        isLocked
                          ? "text-rose-600 font-bold"
                          : "text-slate-300 hover:text-slate-600 opacity-60 hover:opacity-100"
                      }`}
                      title={
                        isLocked
                          ? "🔒 O'qituvchi darslari qulflangan (Ochish uchun bosing)"
                          : "🔓 O'qituvchi darslarini qulflash (Generatsiyada darslari saqlanadi)"
                      }
                    >
                      {isLocked ? "🔒" : "🔓"}
                    </button>
                  </div>
                </td>
                <td className="border border-black p-1 text-[9.5px] text-slate-700 font-semibold truncate max-w-[140px]">
                  {subjectsStr}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
