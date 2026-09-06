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
    <div className="ml-3 shrink-0 border-2 border-black font-sans text-[10px] bg-white shadow-sm self-stretch flex flex-col justify-start w-80 sm:w-92">
      {/* Sarlavha Banneri */}
      <div className="bg-slate-200 border-b-2 border-black p-1.5 text-center font-black text-xs uppercase tracking-wider text-slate-900">
        O&apos;qituvchilar va Fanlar Reestri ({teachers.length} nafar)
      </div>

      {/* Bitta to'liq uzun ro'yxat (Yagona 3 ta ustun: № | F.I.Sh | Fani) */}
      <table className="w-full border-collapse text-left table-fixed">
        <thead>
          <tr className="bg-slate-300 border-b-2 border-black text-[9.5px]">
            <th className="border border-black p-1 text-center w-7 font-black text-slate-950">№</th>
            <th className="border border-black p-1 font-black text-slate-950 w-48">
              O&apos;qituvchi F.I.Sh
            </th>
            <th className="border border-black p-1 font-black text-slate-950">O&apos;tadigan Fani</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher, tIdx) => {
            const num = teacherNumberMap.get(teacher.id) ?? tIdx + 1;
            const isHovered = hoveredTeacherId === teacher.id;
            const isLocked = lockedTeacherIds?.includes(teacher.id);
            const subjectsStr = teacherSubjectsMap.get(teacher.id) || "—";
            const isEven = tIdx % 2 !== 0;

            return (
              <tr
                key={teacher.id}
                className="border-b border-black hover:bg-amber-50 transition-colors"
                style={{ height: "23px" }}
              >
                {/* № */}
                <td className="border border-black px-1 py-0.5 text-center font-mono font-black text-slate-900 bg-slate-100 w-7 shrink-0 text-[9.5px]">
                  {num}
                </td>

                {/* O'qituvchi F.I.Sh */}
                <td
                  onMouseEnter={() => onHoverTeacher(teacher.id)}
                  onMouseLeave={() => onHoverTeacher(null)}
                  className={`border border-black px-1.5 py-0.5 font-bold text-slate-900 transition-colors cursor-pointer w-48 max-w-[190px] ${
                    isHovered
                      ? "bg-amber-200 font-black"
                      : isLocked
                      ? "bg-rose-50"
                      : isEven
                      ? "bg-slate-50/70"
                      : "bg-white"
                  }`}
                  title={`${teacher.fullName} (${subjectsStr}) — ${
                    isLocked ? "🔒 Darslari qulflangan" : "Darslarini jadvalda ko'rish"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="leading-tight truncate text-[9.5px]" title={teacher.fullName}>
                      {teacher.fullName}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleLockTeacher?.(teacher.id);
                      }}
                      className={`p-0.5 rounded text-[10px] cursor-pointer shrink-0 transition-transform active:scale-90 hover:scale-110 ${
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

                {/* O'tadigan Fani */}
                <td
                  onMouseEnter={() => onHoverTeacher(teacher.id)}
                  onMouseLeave={() => onHoverTeacher(null)}
                  className={`border border-black px-1.5 py-0.5 text-[9px] text-slate-700 font-medium truncate ${
                    isHovered ? "bg-amber-100" : ""
                  }`}
                  title={subjectsStr}
                >
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
