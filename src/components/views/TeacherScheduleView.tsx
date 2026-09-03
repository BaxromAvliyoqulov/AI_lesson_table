"use client";

import React, { useState, useMemo } from "react";
import { SchoolClass, Subject, Teacher, Room, Lesson } from "@/types";
import {
  Users,
  MapPin,
  Calendar,
  Clock,
  BookOpen,
  Activity,
  GraduationCap,
  Sparkles,
} from "lucide-react";

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
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || "");

  // Alifbo bo'yicha saralangan barcha o'qituvchilar
  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.fullName.localeCompare(b.fullName, "uz"));
  }, [teachers]);

  // Fan bo'yicha filtr
  const teachersBySubject = useMemo(() => {
    if (selectedSubjectId === "ALL") return sortedTeachers;
    return sortedTeachers.filter((t) => (t.subjectIds || []).includes(selectedSubjectId));
  }, [sortedTeachers, selectedSubjectId]);

  // Agar tanlangan o'qituvchi filtr natijasida yo'q bo'lsa, birinchisini tanlash
  const activeTeacher = useMemo(() => {
    const found = teachersBySubject.find((t) => t.id === selectedTeacherId);
    return found || teachersBySubject[0] || teachers[0];
  }, [teachersBySubject, selectedTeacherId, teachers]);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  // Lessons for active teacher
  const teacherLessons = useMemo(() => {
    if (!activeTeacher) return [];
    return lessons.filter((l) => l.teacherId === activeTeacher.id);
  }, [lessons, activeTeacher]);

  // Daily lesson counts
  const dailyLessonCounts = useMemo(() => {
    const map = new Map<number, number>();
    DAYS.forEach((d) => map.set(d.id, 0));
    teacherLessons.forEach((l) => {
      map.set(l.dayOfWeek, (map.get(l.dayOfWeek) || 0) + 1);
    });
    return map;
  }, [teacherLessons]);

  // Classes taught by active teacher
  const taughtClassesCount = useMemo(() => {
    const classSet = new Set(teacherLessons.map((l) => l.classId));
    return classSet.size;
  }, [teacherLessons]);

  const capacity = Number(activeTeacher?.weeklyHourCapacity) || 20;
  const scheduledCount = teacherLessons.length;
  const loadPercentage = Math.round((scheduledCount / capacity) * 100);
  const isOptimal = loadPercentage >= 80 && loadPercentage <= 100;
  const isOverloaded = loadPercentage > 100;

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

  // Lesson lookup: `${day}_${period}`
  const lessonMap = new Map<string, Lesson>();
  for (const l of teacherLessons) {
    lessonMap.set(`${l.dayOfWeek}_${l.periodNumber}`, l);
  }

  const homeroomClass = classes.find((c) => c.homeroomTeacherId === activeTeacher.id);
  const activeMethodDayName = activeTeacher.methodDayOfWeek
    ? DAYS.find((d) => d.id === activeTeacher.methodDayOfWeek)?.name
    : null;

  return (
    <div className="flex flex-col h-full space-y-4 p-4 max-w-[1920px] w-full mx-auto">
      {/* ── TEACHER STATUS & SELECTOR DASHBOARD ─────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-3xl bg-card border border-border shadow-xs">
        {/* Left: Subject & Teacher Switcher */}
        <div className="flex items-center gap-3 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-base shadow-inner shrink-0">
            {activeTeacher.fullName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1 flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Fan filtri */}
            <div className="w-full sm:w-48">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-indigo-500" />
                <span>Fan:</span>
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                }}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer truncate shadow-xs"
              >
                <option value="ALL">🌟 Barcha Fanlar ({subjects.length} ta)</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* O'qituvchi tanlash */}
            <div className="w-full sm:w-64">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-500" />
                <span>O&apos;qituvchi:</span>
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer truncate shadow-xs"
              >
                {teachersBySubject.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Teacher Live Workload Status Bar */}
        <div className="w-full md:w-80 p-3 rounded-2xl bg-muted/20 border border-border/80 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-muted-foreground flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>Jadvaldagi darslar:</span>
            </span>
            <span className="font-black text-foreground">
              {scheduledCount} <span className="font-normal text-muted-foreground">/ {capacity} st</span>
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2 rounded-full bg-muted/80 overflow-hidden p-0.5 border border-border/40">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverloaded ? "bg-rose-500" : isOptimal ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, loadPercentage)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] pt-0.5">
            <span
              className={`font-bold px-1.5 py-0.2 rounded-md ${
                isOverloaded
                  ? "text-rose-700 dark:text-rose-300 bg-rose-500/10"
                  : isOptimal
                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                  : "text-amber-700 dark:text-amber-300 bg-amber-500/10"
              }`}
            >
              {isOverloaded
                ? `🔴 +${scheduledCount - capacity} st ortiqcha`
                : isOptimal
                ? "🟢 To'liq rejalashtirilgan"
                : `🟡 ${capacity - scheduledCount} st rejalashtirilmagan`}
            </span>
            <span className="font-extrabold text-foreground">{loadPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Metod kuni Banneri */}
      {activeMethodDayName && (
        <div className="flex items-center justify-between px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">📌</span>
            <span>
              <strong>{activeTeacher.fullName}</strong> uchun rasmiy metodik kun:{" "}
              <span className="font-black uppercase underline decoration-emerald-500 decoration-2">
                {activeMethodDayName}
              </span>{" "}
              (Dars o&apos;tilmaydi, o&apos;quv mashg&apos;ulotlaridan ozod).
            </span>
          </div>
          <span className="hidden sm:inline-block font-black text-[10px] uppercase bg-emerald-200/80 dark:bg-emerald-800/80 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-md">
            MMTV Standarti
          </span>
        </div>
      )}

      {/* ── DAILY WORKLOAD STATUS PILLS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {DAYS.map((day) => {
          const count = dailyLessonCounts.get(day.id) || 0;
          const isMethodDay = activeTeacher.methodDayOfWeek === day.id;

          return (
            <div
              key={day.id}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                isMethodDay
                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-xs"
                  : count > 0
                  ? "bg-card border-border/80 shadow-xs"
                  : "bg-muted/10 border-border/40 opacity-50"
              }`}
            >
              <div className="text-[11px] font-bold text-muted-foreground flex items-center justify-center gap-1">
                <span>{day.name}</span>
                {isMethodDay && <span className="text-emerald-600 text-[9px] font-black">★</span>}
              </div>
              <div className="text-sm font-black text-foreground mt-0.5">
                {isMethodDay && count === 0 ? (
                  <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">Metod kuni</span>
                ) : (
                  <>
                    {count}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">soat</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Responsive Weekly Grid for Teacher */}
      <div className="w-full overflow-x-auto rounded-3xl border border-border bg-card shadow-sm">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-muted/40 border-b border-border">
              <th className="w-28 p-3 text-center text-xs font-bold text-muted-foreground uppercase">
                Dars / Vaqt
              </th>
              {DAYS.map((day) => {
                const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
                return (
                  <th
                    key={day.id}
                    className={`p-3 text-center text-xs font-extrabold border-l border-border/60 ${
                      isMethodDay
                        ? "bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200"
                        : "text-foreground"
                    }`}
                  >
                    <div>{day.name}</div>
                    {isMethodDay && (
                      <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter">
                        (Metod kuni)
                      </div>
                    )}
                  </th>
                );
              })}
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
                  const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
                  const lesson = lessonMap.get(`${day.id}_${period.id}`);
                  const subject = lesson ? subjectMap.get(lesson.subjectId) : undefined;
                  const cls = lesson ? classMap.get(lesson.classId) : undefined;
                  const room = lesson?.roomId ? roomMap.get(lesson.roomId) : null;

                  if (!lesson) {
                    if (isMethodDay) {
                      return (
                        <td
                          key={`${day.id}_${period.id}`}
                          className="p-2 align-top border-l border-border/60 min-w-[130px] bg-emerald-50/20 dark:bg-emerald-950/10"
                        >
                          <div className="h-16 rounded-2xl border border-dashed border-emerald-300/40 dark:border-emerald-700/30 flex items-center justify-center text-emerald-600/60 dark:text-emerald-400/50 text-xs font-bold">
                            Metod kuni
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={`${day.id}_${period.id}`}
                        className="p-2 align-top border-l border-border/60 min-w-[130px]"
                      >
                        <div className="h-16 rounded-2xl border border-dashed border-border/40 flex items-center justify-center text-muted-foreground/30 text-xs">
                          -
                        </div>
                      </td>
                    );
                  }

                  // Agar dars metod kuniga tushib qolgan bo'lsa
                  if (isMethodDay) {
                    return (
                      <td
                        key={`${day.id}_${period.id}`}
                        className="p-2 align-top border-l border-border/60 min-w-[130px] bg-rose-50/40 dark:bg-rose-950/20"
                      >
                        <div
                          className="rounded-2xl border border-rose-300 dark:border-rose-700 border-l-4 border-l-rose-600 p-2.5 bg-rose-100/50 dark:bg-rose-900/30 shadow-xs space-y-1"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs text-rose-900 dark:text-rose-200 truncate" title={subject?.name}>
                              {subject?.name || "Fan"}
                            </span>
                            <span className="rounded-lg bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 px-2 py-0.5 text-[10px] font-extrabold shrink-0">
                              {cls?.name}
                            </span>
                          </div>
                          <div className="text-[9px] font-black text-rose-600 dark:text-rose-400">
                            ⚠️ Metod kuniga tushgan dars!
                          </div>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={`${day.id}_${period.id}`}
                      className="p-2 align-top border-l border-border/60 min-w-[130px]"
                    >
                      <div
                        className="rounded-2xl border border-border/80 border-l-4 p-2.5 bg-background hover:shadow-md transition-all space-y-1"
                        style={{ borderLeftColor: subject?.colorTag || "#3B82F6" }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-xs text-foreground truncate" title={subject?.name}>
                            {subject?.name || "Fan"}
                          </span>
                          <span className="rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-extrabold shrink-0 border border-blue-200 dark:border-blue-900">
                            {cls?.name}
                          </span>
                        </div>
                        {room && (
                          <div className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            <span className="truncate">{room.name}</span>
                          </div>
                        )}
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
