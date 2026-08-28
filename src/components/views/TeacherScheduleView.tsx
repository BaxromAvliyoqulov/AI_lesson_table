"use client";

import React, { useState } from "react";
import { SchoolClass, Subject, Teacher, Room, Lesson } from "@/types";
import { Users, MapPin, Calendar, Clock } from "lucide-react";

interface TeacherScheduleViewProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
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

export const TeacherScheduleView: React.FC<TeacherScheduleViewProps> = ({
  classes,
  subjects,
  teachers,
  rooms,
  lessons,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || "");

  const activeTeacher = teachers.find((t) => t.id === selectedTeacherId) || teachers[0];

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));

  if (!activeTeacher) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground/40 mb-2" />
        <p className="text-sm font-semibold text-muted-foreground">
          O&apos;qituvchilar mavjud emas.
        </p>
      </div>
    );
  }

  // Tanlangan o'qituvchining darslari
  const teacherLessons = lessons.filter((l) => l.teacherId === activeTeacher.id);

  // Lesson lookup: `${day}_${period}`
  const lessonMap = new Map<string, Lesson>();
  for (const l of teacherLessons) {
    lessonMap.set(`${l.dayOfWeek}_${l.periodNumber}`, l);
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-4 max-w-7xl mx-auto">
      {/* Top Teacher Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            O&apos;qituvchini tanlang:
          </span>
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
          >
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {activeTeacher.fullName} &bull; {teacherLessons.length} soat dars (Haftalik yuklama:{" "}
            {activeTeacher.weeklyHourCapacity} soat)
          </span>
        </div>
      </div>

      {/* Responsive Weekly Grid for Teacher */}
      <div className="w-full overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left">
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

          <tbody>
            {PERIODS.map((period) => (
              <tr key={period.id} className="border-b border-border/60 hover:bg-muted/10">
                <td className="p-2.5 text-center bg-muted/20 text-xs font-semibold tabular-nums border-r border-border/60">
                  <span className="block font-bold text-foreground">{period.id}-dars</span>
                  <span className="text-[10px] text-muted-foreground/80">{period.time}</span>
                </td>

                {DAYS.map((day) => {
                  const lesson = lessonMap.get(`${day.id}_${period.id}`);
                  const subject = lesson ? subjectMap.get(lesson.subjectId) : undefined;
                  const cls = lesson ? classMap.get(lesson.classId) : undefined;
                  const room = lesson?.roomId ? roomMap.get(lesson.roomId) : null;

                  return (
                    <td
                      key={`${day.id}_${period.id}`}
                      className="p-2 align-top border-l border-border/60 min-w-[130px]"
                    >
                      {lesson ? (
                        <div
                          className="rounded-xl border border-border/80 border-l-4 p-2 bg-background shadow-sm"
                          style={{ borderLeftColor: subject?.colorTag || "#3B82F6" }}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-foreground truncate">
                              {subject?.name || "Fan"}
                            </span>
                            <span className="rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 text-[10px] font-extrabold">
                              {cls?.name}
                            </span>
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
