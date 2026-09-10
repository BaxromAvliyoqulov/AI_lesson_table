import React from "react";
import { SchoolClass, Subject, Room, Lesson, Branch, Teacher } from "@/types";
import { DAYS, DEFAULT_SHIFT_1_PERIODS, DEFAULT_SHIFT_2_PERIODS } from "./types";
import { Sun, Moon, Coffee, MapPin } from "lucide-react";

interface TeacherScheduleShiftTableProps {
  shiftFilter: "ALL" | "SHIFT_1" | "SHIFT_2";
  shift1Count: number;
  shift2Count: number;
  activeTeacher: Teacher;
  dailyStats: Map<number, { total: number; shift1: number; shift2: number; gaps: number }>;
  cellLessonMap: Map<string, Lesson[]>;
  subjectMap: Map<string, Subject>;
  classMap: Map<string, SchoolClass>;
  roomMap: Map<string, Room>;
  branchMap: Map<string, Branch>;
  onOpenZamena?: (lesson: Lesson) => void;
  onSelectClass?: (classId: string) => void;
}

export const TeacherScheduleShiftTable: React.FC<TeacherScheduleShiftTableProps> = ({
  shiftFilter,
  shift1Count,
  shift2Count,
  activeTeacher,
  dailyStats,
  cellLessonMap,
  subjectMap,
  classMap,
  roomMap,
  branchMap,
  onOpenZamena,
  onSelectClass,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-3xl border border-border bg-card shadow-sm print:border-black print:rounded-none">
      <table className="w-full border-collapse text-left font-sans text-xs">
        <thead>
          <tr className="bg-muted/50 border-b border-border text-center print:border-black">
            <th className="w-32 sm:w-36 p-3 text-center text-xs font-black text-muted-foreground uppercase border-r border-border/80 print:border-black">
              Dars / Vaqt
            </th>
            {DAYS.map((day) => {
              const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
              const stats = dailyStats.get(day.id);
              return (
                <th
                  key={day.id}
                  className={`p-3 text-center text-xs font-black border-l border-border/80 print:border-black min-w-[130px] sm:min-w-[150px] ${
                    isMethodDay
                      ? "bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200"
                      : "text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{day.name}</span>
                    {isMethodDay && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400">★</span>
                    )}
                  </div>
                  {isMethodDay ? (
                    <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter mt-0.5">
                      (Metod kuni)
                    </div>
                  ) : (
                    <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                      {stats?.total || 0} soat dars
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {/* 1-SMENA: ERTALABKI DARSLAR */}
          {(shiftFilter === "ALL" || shiftFilter === "SHIFT_1") && (
            <>
              <tr className="bg-amber-500/10 dark:bg-amber-500/15 border-y-2 border-amber-500/30 print:border-black">
                <td
                  colSpan={7}
                  className="px-4 py-2 text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-600" />
                      <span>☀️ 1-Smena — Ertalabki Darslar (Abetgacha: 08:00 – 13:00)</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-amber-500/20 px-2 py-0.5 rounded-md">
                      Haftalik: {shift1Count} soat
                    </span>
                  </div>
                </td>
              </tr>

              {DEFAULT_SHIFT_1_PERIODS.map((periodInfo) => (
                <tr
                  key={`shift1_p${periodInfo.period}`}
                  className="border-b border-border/70 hover:bg-muted/10 print:border-black transition-colors"
                >
                  <td className="p-2 text-center bg-muted/20 border-r border-border/80 print:border-black tabular-nums">
                    <span className="block font-black text-xs text-foreground">
                      {periodInfo.period}-dars
                    </span>
                    <span className="inline-block text-[10.5px] font-semibold text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/60 mt-0.5">
                      {periodInfo.time}
                    </span>
                    <span className="block text-[8.5px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                      (Abetgacha)
                    </span>
                  </td>

                  {DAYS.map((day) => {
                    const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
                    const lessonsInCell = cellLessonMap.get(`${day.id}_1_${periodInfo.period}`) || [];

                    return (
                      <td
                        key={`cell_${day.id}_1_${periodInfo.period}`}
                        className={`p-2 align-top border-l border-border/70 print:border-black ${
                          isMethodDay ? "bg-emerald-50/15 dark:bg-emerald-950/10" : ""
                        }`}
                      >
                        {renderCellContent(
                          lessonsInCell,
                          isMethodDay,
                          subjectMap,
                          classMap,
                          roomMap,
                          branchMap,
                          onOpenZamena,
                          onSelectClass
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </>
          )}

          {/* TUSHLIK TANAFFUSI */}
          {shiftFilter === "ALL" && (
            <tr className="bg-slate-100 dark:bg-slate-900/80 border-y-2 border-dashed border-slate-300 dark:border-slate-700 print:hidden">
              <td colSpan={7} className="py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-center gap-2">
                  <Coffee className="w-4 h-4 text-amber-500" />
                  <span>🥪 13:00 — 13:15 &bull; Tushlik va Smenalar almashinuvi tanaffusi</span>
                </div>
              </td>
            </tr>
          )}

          {/* 2-SMENA: TUSHDAN KEYINGI DARSLAR */}
          {(shiftFilter === "ALL" || shiftFilter === "SHIFT_2") && (
            <>
              <tr className="bg-indigo-500/10 dark:bg-indigo-500/15 border-y-2 border-indigo-500/30 print:border-black">
                <td
                  colSpan={7}
                  className="px-4 py-2 text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Moon className="w-4 h-4 text-indigo-600" />
                      <span>🌤️ 2-Smena — Tushdan Keyingi Darslar (Abetdan keyin: 13:00 – 18:00)</span>
                    </span>
                    <span className="text-[10px] font-extrabold bg-indigo-500/20 px-2 py-0.5 rounded-md">
                      Haftalik: {shift2Count} soat
                    </span>
                  </div>
                </td>
              </tr>

              {DEFAULT_SHIFT_2_PERIODS.map((periodInfo) => (
                <tr
                  key={`shift2_p${periodInfo.period}`}
                  className="border-b border-border/70 hover:bg-muted/10 print:border-black transition-colors"
                >
                  <td className="p-2 text-center bg-muted/20 border-r border-border/80 print:border-black tabular-nums">
                    <span className="block font-black text-xs text-foreground">
                      {periodInfo.period}-dars
                    </span>
                    <span className="inline-block text-[10.5px] font-semibold text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/60 mt-0.5">
                      {periodInfo.time}
                    </span>
                    <span className="block text-[8.5px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                      (Abetdan keyin)
                    </span>
                  </td>

                  {DAYS.map((day) => {
                    const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
                    const lessonsInCell = cellLessonMap.get(`${day.id}_2_${periodInfo.period}`) || [];

                    return (
                      <td
                        key={`cell_${day.id}_2_${periodInfo.period}`}
                        className={`p-2 align-top border-l border-border/70 print:border-black ${
                          isMethodDay ? "bg-emerald-50/15 dark:bg-emerald-950/10" : ""
                        }`}
                      >
                        {renderCellContent(
                          lessonsInCell,
                          isMethodDay,
                          subjectMap,
                          classMap,
                          roomMap,
                          branchMap,
                          onOpenZamena,
                          onSelectClass
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </>
          )}
        </tbody>

        <tfoot>
          <tr className="bg-primary/10 border-t-2 border-b border-primary/30 font-black text-xs text-foreground print:border-black">
            <td className="p-2.5 text-right font-black uppercase tracking-tight border-r border-border/80 print:border-black">
              Jami Dars Soati:
            </td>
            {DAYS.map((day) => {
              const stats = dailyStats.get(day.id);
              const count = stats?.total || 0;
              const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
              return (
                <td
                  key={`foot_total_${day.id}`}
                  className="p-2.5 text-center border-l border-border/80 print:border-black"
                >
                  {isMethodDay && count === 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                      Metod kuni
                    </span>
                  ) : (
                    <span className="text-sm font-black text-foreground">{count} soat</span>
                  )}
                </td>
              );
            })}
          </tr>

          <tr className="bg-amber-500/5 border-b border-border/60 text-xs font-bold text-amber-900 dark:text-amber-200 print:border-black">
            <td className="p-2 text-right border-r border-border/80 print:border-black flex items-center justify-end gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>☀️ Abetgacha (1-sm):</span>
            </td>
            {DAYS.map((day) => {
              const s1 = dailyStats.get(day.id)?.shift1 || 0;
              return (
                <td
                  key={`foot_s1_${day.id}`}
                  className="p-2 text-center border-l border-border/80 print:border-black"
                >
                  {s1 > 0 ? (
                    <span className="font-extrabold text-amber-700 dark:text-amber-300">
                      {s1} soat
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40 font-normal">—</span>
                  )}
                </td>
              );
            })}
          </tr>

          <tr className="bg-indigo-500/5 border-b border-border/60 text-xs font-bold text-indigo-900 dark:text-indigo-200 print:border-black">
            <td className="p-2 text-right border-r border-border/80 print:border-black flex items-center justify-end gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>🌤️ Abetdan keyin (2-sm):</span>
            </td>
            {DAYS.map((day) => {
              const s2 = dailyStats.get(day.id)?.shift2 || 0;
              return (
                <td
                  key={`foot_s2_${day.id}`}
                  className="p-2 text-center border-l border-border/80 print:border-black"
                >
                  {s2 > 0 ? (
                    <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                      {s2} soat
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40 font-normal">—</span>
                  )}
                </td>
              );
            })}
          </tr>

          <tr className="bg-muted/30 border-b-2 border-border/80 text-[11px] font-bold text-muted-foreground print:hidden">
            <td className="p-2 text-right border-r border-border/80 flex items-center justify-end gap-1.5">
              <Coffee className="w-3 h-3 text-teal-600 shrink-0" />
              <span>🪟 Darchalar (Oynalar):</span>
            </td>
            {DAYS.map((day) => {
              const gaps = dailyStats.get(day.id)?.gaps || 0;
              return (
                <td
                  key={`foot_gaps_${day.id}`}
                  className="p-2 text-center border-l border-border/80"
                >
                  {gaps > 0 ? (
                    <span className="text-amber-600 font-black">⚠️ {gaps} ta</span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">0 ta</span>
                  )}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

function renderCellContent(
  lessonsInCell: Lesson[],
  isMethodDay: boolean,
  subjectMap: Map<string, Subject>,
  classMap: Map<string, SchoolClass>,
  roomMap: Map<string, Room>,
  branchMap: Map<string, Branch>,
  onOpenZamena?: (lesson: Lesson) => void,
  onSelectClass?: (classId: string) => void
) {
  if (lessonsInCell.length === 0) {
    if (isMethodDay) {
      return (
        <div className="h-16 rounded-2xl border border-dashed border-emerald-300/40 dark:border-emerald-700/30 flex items-center justify-center text-emerald-600/60 dark:text-emerald-400/50 text-[11px] font-bold select-none">
          Metod kuni
        </div>
      );
    }
    return (
      <div className="h-16 rounded-2xl border border-dashed border-border/40 flex items-center justify-center text-muted-foreground/30 text-xs select-none">
        —
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {lessonsInCell.map((lesson) => {
        const subject = subjectMap.get(lesson.subjectId);
        const cls = classMap.get(lesson.classId);
        const room = lesson.roomId ? roomMap.get(lesson.roomId) : null;
        const branch = lesson.branchId ? branchMap.get(lesson.branchId) : null;

        if (isMethodDay) {
          return (
            <div
              key={lesson.id}
              onClick={() => onOpenZamena?.(lesson)}
              className="rounded-2xl border border-rose-300 dark:border-rose-700 border-l-4 border-l-rose-600 p-2 bg-rose-100/50 dark:bg-rose-900/30 shadow-xs space-y-1 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-xs text-rose-900 dark:text-rose-100 truncate">
                  {subject?.name || "Fan"}
                </span>
                <span className="rounded-md bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 px-1.5 py-0.5 text-[10px] font-black shrink-0">
                  {cls?.name}
                </span>
              </div>
              <div className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400">
                ⚠️ Metod kuniga tushgan!
              </div>
            </div>
          );
        }

        return (
          <div
            key={lesson.id}
            onClick={() => onOpenZamena?.(lesson)}
            className="group rounded-2xl border border-border/80 border-l-4 p-2 bg-card hover:bg-muted/30 hover:shadow-md transition-all space-y-1 cursor-pointer"
            style={{ borderLeftColor: subject?.colorTag || "#3B82F6" }}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className="font-black text-xs text-foreground truncate group-hover:text-primary transition-colors"
                title={subject?.name}
              >
                {subject?.name || "Fan"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (cls) onSelectClass?.(cls.id);
                }}
                className="rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-black shrink-0 border border-primary/20 cursor-pointer transition-colors"
                title={`${cls?.name} dars jadvalini ko'rish`}
              >
                {cls?.name}
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-[9.5px] text-muted-foreground font-semibold">
              {room && (
                <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-bold">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{room.name}</span>
                </span>
              )}

              {lesson.groupType && lesson.groupType !== "WHOLE" && (
                <span className="px-1 rounded bg-muted text-[8.5px] font-bold">
                  {lesson.groupType === "GROUP_1" ? "1-gr" : "2-gr"}
                </span>
              )}

              {branch && !branch.isMain && (
                <span className="px-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[8.5px] font-bold">
                  Filial
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
