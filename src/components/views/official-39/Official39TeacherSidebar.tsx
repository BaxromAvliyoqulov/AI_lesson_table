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
  // Agar o'qituvchilar soni 35 tadan ko'p bo'lsa, dars jadvali balandligi (36 soat) bilan
  // teng bo'lishi uchun avtomatik 2 ustunli (dual-column) ixcham reestrga o'tadi!
  const isTwoColumn = teachers.length > 35;
  const half = isTwoColumn ? Math.ceil(teachers.length / 2) : teachers.length;
  const rows = Array.from({ length: half });

  const renderTeacherBlock = (teacher?: Teacher, tIdx?: number, isBorderRight = false) => {
    if (!teacher) {
      return (
        <>
          <td className="border border-black p-0.5 bg-slate-50">&nbsp;</td>
          <td className="border border-black p-0.5 bg-slate-50">&nbsp;</td>
          <td className={`border border-black p-0.5 bg-slate-50 ${isBorderRight ? "border-r-2 border-r-black" : ""}`}>&nbsp;</td>
        </>
      );
    }

    const num = teacherNumberMap.get(teacher.id) ?? (tIdx !== undefined ? tIdx + 1 : "");
    const isHovered = hoveredTeacherId === teacher.id;
    const isLocked = lockedTeacherIds?.includes(teacher.id);
    const subjectsStr = teacherSubjectsMap.get(teacher.id) || "—";
    const isEven = (tIdx ?? 0) % 2 !== 0;

    return (
      <>
        <td className="border border-black px-1 py-0.5 text-center font-mono font-black text-slate-900 bg-slate-100 w-6 shrink-0 text-[9.5px]">
          {num}
        </td>
        <td
          onMouseEnter={() => onHoverTeacher(teacher.id)}
          onMouseLeave={() => onHoverTeacher(null)}
          className={`border border-black px-1 py-0.5 font-bold text-slate-900 transition-colors cursor-pointer w-36 max-w-[145px] ${
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
          <div className="flex items-center justify-between gap-0.5">
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
        <td
          onMouseEnter={() => onHoverTeacher(teacher.id)}
          onMouseLeave={() => onHoverTeacher(null)}
          className={`border border-black px-1 py-0.5 text-[9px] text-slate-700 font-medium truncate max-w-[115px] ${
            isBorderRight ? "border-r-2 border-r-black" : ""
          } ${isHovered ? "bg-amber-100" : ""}`}
          title={subjectsStr}
        >
          {subjectsStr}
        </td>
      </>
    );
  };

  return (
    <div
      className={`ml-3 shrink-0 border-2 border-black font-sans text-[10px] bg-white shadow-sm self-stretch flex flex-col justify-start ${
        isTwoColumn ? "w-[560px]" : "w-84"
      }`}
    >
      <div className="bg-slate-100 border-b-2 border-black p-1 text-center font-black text-xs uppercase tracking-wider text-slate-900">
        O'qituvchilar va Fanlar Reestri ({teachers.length} nafar)
      </div>
      <table className="w-full border-collapse text-left table-fixed">
        <thead>
          <tr className="bg-slate-200 border-b-2 border-black text-[9px]">
            <th className="border border-black p-1 text-center w-6 font-black text-slate-900">№</th>
            <th className="border border-black p-1 font-black text-slate-900 w-36">O'qituvchi F.I.Sh</th>
            <th className={`border border-black p-1 font-black text-slate-900 w-28 ${isTwoColumn ? "border-r-2 border-r-black" : ""}`}>
              O'tadigan Fani
            </th>
            {isTwoColumn && (
              <>
                <th className="border border-black p-1 text-center w-6 font-black text-slate-900">№</th>
                <th className="border border-black p-1 font-black text-slate-900 w-36">O'qituvchi F.I.Sh</th>
                <th className="border border-black p-1 font-black text-slate-900 w-28">O'tadigan Fani</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((_, rIdx) => {
            if (!isTwoColumn) {
              const teacher = teachers[rIdx];
              return (
                <tr key={teacher?.id || rIdx} className="border-b border-black">
                  {renderTeacherBlock(teacher, rIdx)}
                </tr>
              );
            }

            const t1 = teachers[rIdx];
            const t2 = teachers[rIdx + half];

            return (
              <tr key={t1?.id || rIdx} className="border-b border-black">
                {renderTeacherBlock(t1, rIdx, true)}
                {renderTeacherBlock(t2, rIdx + half, false)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
