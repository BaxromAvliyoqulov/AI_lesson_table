"use client";

import React, { useState } from "react";
import { SchoolClass, Subject, Teacher, Room, Lesson } from "@/types";
import { LessonCard } from "@/components/master-grid/LessonCard";
import { GraduationCap, MapPin, UserCheck, Calendar } from "lucide-react";

interface SingleClassViewProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  onToggleLock?: (lessonId: string) => void;
  onOpenZamena?: (lesson: Lesson) => void;
}

const DAYS = [
  { id: 1, name: "Dushanba" },
  { id: 2, name: "Seshanba" },
  { id: 3, name: "Chorshanba" },
  { id: 4, name: "Payshanba" },
  { id: 5, name: "Juma" },
  { id: 6, name: "Shanba" },
];

const PERIODS = [
  { id: 1, time: "08:00 - 08:45" },
  { id: 2, time: "08:50 - 09:35" },
  { id: 3, time: "09:40 - 10:25" },
  { id: 4, time: "10:35 - 11:20" },
  { id: 5, time: "11:25 - 12:10" },
  { id: 6, time: "12:15 - 13:00" },
];

export const SingleClassView: React.FC<SingleClassViewProps> = ({
  classes,
  subjects,
  teachers,
  rooms,
  lessons,
  onToggleLock,
  onOpenZamena,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>(classes[0]?.id || "");

  const activeClass = classes.find((c) => c.id === selectedClassId) || classes[0];

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));

  if (!activeClass) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <GraduationCap className="h-12 w-12 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-semibold text-muted-foreground">
          Sinflar mavjud emas. Avval maktab sinflarini sozlang.
        </p>
      </div>
    );
  }

  // Tanlangan sinfning darslarini olish
  const classLessons = lessons.filter((l) => l.classId === activeClass.id);

  // Lesson lookup: `${day}_${period}`
  const lessonMap = new Map<string, Lesson>();
  for (const l of classLessons) {
    lessonMap.set(`${l.dayOfWeek}_${l.periodNumber}`, l);
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-4 max-w-[1920px] w-full mx-auto">
      {/* Top Class Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Sinfni tanlang:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClassId(cls.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition-all shadow-sm ${
                  cls.id === activeClass.id
                    ? "bg-blue-600 text-white shadow-blue-600/30 scale-105"
                    : "bg-card border border-border text-foreground hover:bg-muted"
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {activeClass.name} sinfi &bull; {classLessons.length} soat dars
          </span>
        </div>
      </div>

      {/* Responsive Weekly Grid (Bitta ekranga to'liq sig'adigan chiroyli jadval) */}
      <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left">
          {/* Kunlar Header */}
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="w-28 p-3 text-center text-xs font-bold text-muted-foreground uppercase">
                Dars / Vaqt
              </th>
              {DAYS.map((day) => (
                <th
                  key={day.id}
                  className="p-3 text-center text-xs font-extrabold text-foreground border-l border-border/60"
                >
                  {day.name}
                </th>
              ))}
            </tr>
          </thead>

          {/* Period Qatorlari (1-6) */}
          <tbody>
            {PERIODS.map((period) => (
              <tr key={period.id} className="border-b border-border/60 hover:bg-muted/10">
                {/* Vaqt va Dars raqami */}
                <td className="p-2.5 text-center bg-muted/20 text-xs font-semibold tabular-nums border-r border-border/60">
                  <span className="block font-bold text-foreground">{period.id}-dars</span>
                  <span className="text-[10px] text-muted-foreground/80">{period.time}</span>
                </td>

                {/* Kunlik Katakchalar */}
                {DAYS.map((day) => {
                  const lesson = lessonMap.get(`${day.id}_${period.id}`);
                  const subject = lesson ? subjectMap.get(lesson.subjectId) : undefined;
                  const teacher = lesson ? teacherMap.get(lesson.teacherId) : undefined;
                  const room = lesson?.roomId ? roomMap.get(lesson.roomId) : null;

                  return (
                    <td
                      key={`${day.id}_${period.id}`}
                      className="p-2 align-top border-l border-border/60 min-w-[130px]"
                    >
                      {lesson ? (
                        <div
                          className="rounded-xl border border-border/80 border-l-4 p-2 bg-background shadow-sm hover:shadow-md transition-shadow"
                          style={{ borderLeftColor: subject?.colorTag || "#3B82F6" }}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-xs text-foreground truncate">
                              {subject?.name || "Fan"}
                            </span>
                            {onOpenZamena && (
                              <button
                                onClick={() => onOpenZamena(lesson)}
                                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600"
                                title="O'rinbosar tayinlash"
                              >
                                <UserCheck className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground font-medium mt-1 truncate">
                            {teacher?.fullName}
                          </div>
                          {room && (
                            <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                              <MapPin className="h-2.5 w-2.5" />
                              <span className="truncate">{room.name}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-14 rounded-xl border border-dashed border-border/40 flex items-center justify-center text-muted-foreground/30 text-xs">
                          -
                        </div>
                      )}
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
