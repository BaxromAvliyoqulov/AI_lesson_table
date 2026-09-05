import React, { useMemo } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  SchoolClass,
  Subject,
  Teacher,
  Room,
  Lesson,
} from "@/types";
import { Lock, AlertTriangle } from "lucide-react";
import { validateDropSlot, DropSlotValidation } from "@/lib/solver/drag-validator";

export interface OfficialTableCellProps {
  cls: SchoolClass;
  day: number;
  period: number;
  lesson?: Lesson;
  subject?: Subject;
  teacher?: Teacher;
  teacherNumber?: number;
  isHoveredTeacher: boolean;
  isPrimarySaturday: boolean;
  hasConflict: boolean;
  isLastPeriodOfDay?: boolean;
  activeDragLesson?: Lesson | null;
  allLessons: Lesson[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  cellLessons?: Lesson[];
  teacherNumberMap?: Map<string, number>;
  classes?: SchoolClass[];
  onHoverTeacher: (teacherId: string | null) => void;
  onCellClick: (cls: SchoolClass, day: number, period: number, lesson?: Lesson) => void;
  onResolveConflict?: (lesson: Lesson) => void;
}

export const OfficialTableCell: React.FC<OfficialTableCellProps> = ({
  cls,
  day,
  period,
  lesson,
  subject,
  teacher,
  teacherNumber,
  isHoveredTeacher,
  isPrimarySaturday,
  hasConflict,
  isLastPeriodOfDay,
  activeDragLesson,
  allLessons,
  teachers,
  subjects,
  rooms,
  cellLessons,
  teacherNumberMap,
  classes = [],
  onHoverTeacher,
  onCellClick,
  onResolveConflict,
}) => {
  const cellId = `${cls.id}_${day}_${period}`;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop_${cellId}`,
    data: { classId: cls.id, day, period, lesson },
    disabled: isPrimarySaturday,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: lesson ? lesson.id : `empty_${cellId}`,
    data: { lesson, classId: cls.id, day, period },
    disabled: !lesson || lesson.isLocked || isPrimarySaturday,
  });

  // Real-time Drag & Drop ziddiyat va yuklama tahlili (Yashil/Sariq/Qizil)
  const validation: DropSlotValidation | null = useMemo(() => {
    if (!activeDragLesson || isPrimarySaturday || activeDragLesson.id === lesson?.id) {
      return null;
    }
    return validateDropSlot({
      draggedLesson: activeDragLesson,
      targetClass: cls,
      targetDay: day,
      targetPeriod: period,
      allLessons,
      teachers,
      subjects,
      rooms,
      classes,
    });
  }, [
    activeDragLesson,
    isPrimarySaturday,
    lesson?.id,
    cls,
    day,
    period,
    allLessons,
    teachers,
    subjects,
    rooms,
    classes,
  ]);

  const bottomBorderClass = isLastPeriodOfDay
    ? "border-b-[3.5px] border-b-black"
    : "border-b border-black";

  const isEven = period % 2 === 0;

  if (isPrimarySaturday) {
    return (
      <>
        <td
          colSpan={2}
          className={`border border-black bg-slate-100/60 text-slate-400 text-[9px] font-bold text-center p-1 select-none ${bottomBorderClass}`}
        >
          {period === 1 ? "Dam" : "—"}
        </td>
      </>
    );
  }

  // Droppable, Hover va Ziddiyat (Conflict) vizual ko'rsatkichlari
  let bgClass = isEven ? "bg-slate-50/70" : "bg-white";

  if (activeDragLesson) {
    if (isOver && validation) {
      bgClass = `${validation.colorClass} font-bold z-30 scale-[1.03] shadow-lg animate-pulse`;
    } else if (validation?.status === "conflict") {
      bgClass = "bg-rose-50 text-rose-950 border-rose-300 ring-1 ring-rose-300/40 opacity-70";
    } else if (validation?.status === "warning") {
      bgClass = "bg-amber-50/90 text-amber-950 border-amber-300 ring-1 ring-amber-300/40";
    } else if (validation?.status === "safe") {
      bgClass = "bg-emerald-50/90 text-emerald-950 border-emerald-300 ring-1 ring-emerald-300/40";
    }
  } else {
    if (hasConflict) {
      bgClass = "bg-rose-100 ring-2 ring-rose-500 text-rose-950 font-bold z-20";
    } else if (isHoveredTeacher) {
      bgClass = "bg-amber-200/90 ring-2 ring-amber-500 text-amber-950 z-10";
    } else if (isOver) {
      bgClass = "bg-emerald-100 ring-2 ring-emerald-500 z-10";
    } else if (lesson?.isLocked) {
      bgClass = "bg-slate-100/90";
    }
  }

  const isSplitGroup = cellLessons && cellLessons.length > 1;
  const l1 = isSplitGroup ? cellLessons[0] : lesson;
  const l2 = isSplitGroup ? cellLessons[1] : undefined;
  const s1 = l1 ? subjects.find((s) => s.id === l1.subjectId) : subject;
  const s2 = l2 ? subjects.find((s) => s.id === l2.subjectId) : undefined;
  const num1 = l1 && teacherNumberMap ? teacherNumberMap.get(l1.teacherId) : teacherNumber;
  const num2 = l2 && teacherNumberMap ? teacherNumberMap.get(l2.teacherId) : undefined;

  return (
    <>
      {/* Fan Nomi Ustuni */}
      <td
        ref={(el) => {
          setDropRef(el);
          if (lesson) setDragRef(el);
        }}
        {...(lesson ? listeners : {})}
        {...(lesson ? attributes : {})}
        onClick={() => onCellClick(cls, day, period, lesson)}
        onMouseEnter={() => lesson && onHoverTeacher(lesson.teacherId)}
        onMouseLeave={() => onHoverTeacher(null)}
        className={`border border-black px-1 py-1 text-left font-semibold text-[10px] truncate max-w-[76px] cursor-pointer transition-all relative select-none ${bottomBorderClass} ${bgClass} ${
          isDragging ? "opacity-30" : ""
        }`}
        title={
          validation?.reason
            ? `[${validation.badge}] ${validation.reason}`
            : hasConflict
            ? `⚠️ ZIDDIYAT: ${teacher?.fullName || "O'qituvchi"} ayni shu paytda boshqa sinfda ham darsga qo'yilgan!`
            : lesson
            ? `${subject?.name || "Fan"} — ${teacher?.fullName || "O'qituvchi"}`
            : "Bo'sh katakcha (Dars qo'shish uchun bosing)"
        }
      >
        {isSplitGroup ? (
          <div className="flex items-center justify-between gap-0.5 truncate">
            <span className="font-bold truncate text-slate-900 text-[9.5px]">
              {s1?.shortName || s1?.name || (s2 ? `${s1?.shortName || s1?.name}/${s2?.shortName || s2?.name}` : "Fan")}
            </span>
            <span className="text-[7px] font-black text-indigo-700 bg-indigo-100/90 px-1 py-0.5 rounded border border-indigo-200 shrink-0">
              1-2 gr
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-0.5">
            <span className={`truncate ${lesson ? "text-slate-900 font-semibold" : "text-slate-300"}`}>
              {subject?.shortName || subject?.name || (lesson ? "Fan" : "—")}
            </span>
            {validation?.status === "conflict" && isOver && (
              <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0 inline no-print animate-bounce" />
            )}
            {hasConflict && !activeDragLesson && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (lesson) onResolveConflict?.(lesson);
                }}
                className="p-0.5 rounded hover:bg-rose-200 text-rose-600 transition-all hover:scale-125 active:scale-95 cursor-pointer shrink-0 inline no-print"
                title="⚡ AI Yordamida Ziddiyatni Bartaraf Qilish (bosing)"
              >
                <AlertTriangle className="w-2.5 h-2.5 animate-bounce" />
              </button>
            )}
            {lesson?.isLocked && (
              <Lock className="w-2.5 h-2.5 text-indigo-600 shrink-0 inline no-print" />
            )}
          </div>
        )}
      </td>

      {/* O'qituvchi Tartib Raqami Ustuni */}
      <td
        onClick={() => onCellClick(cls, day, period, lesson)}
        onMouseEnter={() => lesson && onHoverTeacher(lesson.teacherId)}
        onMouseLeave={() => onHoverTeacher(null)}
        className={`border border-black px-0.5 py-1 text-center font-mono font-black text-[10px] w-6 cursor-pointer transition-colors select-none ${bottomBorderClass} ${
          hasConflict
            ? "bg-rose-200 text-rose-950 font-extrabold"
            : isHoveredTeacher
            ? "bg-amber-300 text-amber-950 font-extrabold"
            : teacherNumber
            ? isEven
              ? "bg-slate-100 text-slate-950 font-black"
              : "bg-slate-50 text-slate-950 font-black"
            : "text-slate-300"
        } ${isDragging ? "opacity-30" : ""}`}
        title={
          hasConflict
            ? `⚠️ Ziddiyat: №${teacherNumber} ${teacher?.fullName} band!`
            : teacher
            ? `№${teacherNumber}: ${teacher.fullName}`
            : ""
        }
      >
        {isSplitGroup && (num1 || num2) ? (
          <span className="font-mono font-black text-[9px] text-slate-950 whitespace-nowrap tracking-tighter px-0.5">
            {num1 || "?"} / {num2 || "?"}
          </span>
        ) : (
          (lesson && teacherNumberMap ? teacherNumberMap.get(lesson.teacherId) : teacherNumber) || ""
        )}
      </td>
    </>
  );
};
