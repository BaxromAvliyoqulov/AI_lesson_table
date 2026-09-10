"use client";

import React from "react";
import { SchoolClass, Subject, Teacher, Room, Lesson, Shift, Branch } from "@/types";
import {
  Users,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Printer,
  Layers,
  Sun,
  Moon,
  Building,
  FileDown,
  Loader2,
} from "lucide-react";
import { useTeacherScheduleLogic } from "./teacher-schedule/useTeacherScheduleLogic";
import { TeacherScheduleKPI } from "./teacher-schedule/TeacherScheduleKPI";
import { TeacherScheduleShiftTable } from "./teacher-schedule/TeacherScheduleShiftTable";
import { TeacherScheduleInsights } from "./teacher-schedule/TeacherScheduleInsights";

export interface TeacherScheduleViewProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  shifts?: Shift[];
  branches?: Branch[];
  onOpenZamena?: (lesson: Lesson) => void;
  onSelectClass?: (classId: string) => void;
}

export const TeacherScheduleView: React.FC<TeacherScheduleViewProps> = ({
  classes,
  subjects,
  teachers,
  rooms,
  lessons,
  shifts = [],
  branches = [],
  onOpenZamena,
  onSelectClass,
}) => {
  const {
    selectedSubjectId,
    setSelectedSubjectId,
    setSelectedTeacherId,
    shiftFilter,
    setShiftFilter,
    isCopied,
    isExportingPdf,
    filteredTeachers,
    activeTeacher,
    currentTeacherIndex,
    handlePrevTeacher,
    handleNextTeacher,
    subjectMap,
    classMap,
    roomMap,
    branchMap,
    shiftLessons,
    cellLessonMap,
    dailyStats,
    totalGapsCount,
    taughtClasses,
    subjectHoursBreakdown,
    usedRooms,
    capacity,
    scheduledCount,
    shift1Count,
    shift2Count,
    loadPercentage,
    isOptimal,
    isOverloaded,
    homeroomHours,
    subjectHours,
    homeroomClass,
    activeMethodDayName,
    methodDayViolations,
    handleCopyScheduleToClipboard,
    handleExportPDF,
  } = useTeacherScheduleLogic({
    classes,
    subjects,
    teachers,
    rooms,
    lessons,
    shifts,
    branches,
  });

  if (!activeTeacher) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <Users className="h-16 w-16 text-muted-foreground/30 mb-3 animate-pulse" />
        <p className="text-base font-bold text-muted-foreground">
          O&apos;qituvchilar bazasi bo&apos;sh yoki filtr bo&apos;yicha hech kim topilmadi.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-5 p-4 sm:p-6 max-w-[1920px] w-full mx-auto print:p-0 print:space-y-2">
      {/* ── TOP ACTION & SELECTOR BAR ─────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-xs print:hidden">
        {/* Left: Avatar, Teacher Switcher & Navigation */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="relative">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-primary/20 to-purple-500/20 text-primary border border-primary/20 flex items-center justify-center font-black text-xl shadow-inner shrink-0">
              {activeTeacher.fullName.charAt(0)}
            </div>
            {homeroomClass && (
              <span
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-black shadow-xs ring-2 ring-background"
                title={`Sinf rahbari: ${homeroomClass.name}`}
              >
                ★
              </span>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                O&apos;qituvchi Dars Portali
              </span>
              {homeroomClass && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                  <GraduationCap className="w-3 h-3" />
                  <span>{homeroomClass.name} rahbari</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-base sm:text-lg font-black text-foreground truncate tracking-tight">
                {activeTeacher.fullName}
              </h2>
              <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-0.5 border border-border/60 shrink-0">
                <button
                  onClick={handlePrevTeacher}
                  disabled={currentTeacherIndex <= 0}
                  className="p-1 rounded-lg hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent text-foreground cursor-pointer transition-colors"
                  title="Oldingi o'qituvchi"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold px-1 text-muted-foreground">
                  {currentTeacherIndex + 1}/{filteredTeachers.length}
                </span>
                <button
                  onClick={handleNextTeacher}
                  disabled={currentTeacherIndex >= filteredTeachers.length - 1}
                  className="p-1 rounded-lg hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent text-foreground cursor-pointer transition-colors"
                  title="Keyingi o'qituvchi"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {subjectHoursBreakdown.map(({ subject, hours }) => (
                <span
                  key={subject.id}
                  className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-lg border shadow-2xs"
                  style={{
                    backgroundColor: `${subject.colorTag}15`,
                    borderColor: `${subject.colorTag}40`,
                    color: subject.colorTag,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: subject.colorTag }}
                  />
                  <span>{subject.name}</span>
                  <span className="text-[9px] opacity-75 font-semibold">({hours} st)</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right: Dropdowns & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-40 sm:w-44">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer truncate shadow-xs"
            >
              <option value="ALL">🌟 Barcha Fanlar ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-56 sm:w-64">
            <select
              value={activeTeacher.id}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer truncate shadow-xs"
            >
              {filteredTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons: Copy, Print, PDF */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyScheduleToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground shadow-xs cursor-pointer transition-all active:scale-95"
              title="O'qituvchiga yuborish uchun dars jadvalini nusxalash"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Nusxalandi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Nusxalash</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground shadow-xs cursor-pointer transition-all active:scale-95"
              title="O'qituvchi dars jadvalini chop etish"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span>Chop etish</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-60"
              title="Rasmiy A4 PDF formatida yuklab olish"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>PDF tayyorlanmoqda...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── PRINT HEADER ─────────────────────────────────────────────────── */}
      <div className="hidden print:block border-b-2 border-black pb-2 text-center">
        <h1 className="text-base font-black uppercase">
          39-UMUMIY O&apos;RTA TA&apos;LIM MAKTABI O&apos;QITUVCHISI DARS JADVALI
        </h1>
        <div className="text-sm font-bold mt-1">
          {activeTeacher.fullName} &bull;{" "}
          {homeroomHours > 0 ? `${subjectHours} + ${homeroomHours}` : scheduledCount} soat{" "}
          {homeroomHours > 0 ? `(${scheduledCount} st) ` : ""}
          ({activeMethodDayName ? `Metod kuni: ${activeMethodDayName}` : ""})
        </div>
      </div>

      {/* ── EXECUTIVE KPI METRICS DASHBOARD ──────────────────────────────── */}
      <TeacherScheduleKPI
        scheduledCount={scheduledCount}
        capacity={capacity}
        subjectHours={subjectHours}
        homeroomHours={homeroomHours}
        loadPercentage={loadPercentage}
        isOverloaded={isOverloaded}
        isOptimal={isOptimal}
        shift1Count={shift1Count}
        shift2Count={shift2Count}
        totalGapsCount={totalGapsCount}
        taughtClasses={taughtClasses}
        methodDayViolations={methodDayViolations}
        activeMethodDayName={activeMethodDayName}
        shiftFilter={shiftFilter}
        setShiftFilter={setShiftFilter}
        onSelectClass={onSelectClass}
      />

      {/* ── SHIFT FILTER TOGGLE TABS ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-2xl border border-border/60">
          <button
            onClick={() => setShiftFilter("ALL")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              shiftFilter === "ALL"
                ? "bg-background text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Barchasi (1 & 2-Smena)</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-muted text-foreground">
              {scheduledCount} st
            </span>
          </button>

          <button
            onClick={() => setShiftFilter("SHIFT_1")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              shiftFilter === "SHIFT_1"
                ? "bg-amber-500/15 text-amber-800 dark:text-amber-200 shadow-xs border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Smena (Abetgacha: 08:00–13:00)</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-100">
              {shift1Count} st
            </span>
          </button>

          <button
            onClick={() => setShiftFilter("SHIFT_2")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              shiftFilter === "SHIFT_2"
                ? "bg-indigo-500/15 text-indigo-800 dark:text-indigo-200 shadow-xs border border-indigo-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            <span>2-Smena (Abetdan keyin: 13:00–18:00)</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-900 dark:text-indigo-100">
              {shift2Count} st
            </span>
          </button>
        </div>

        {usedRooms.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-primary" />
              <span>Dars o&apos;tiladigan xonalar:</span>
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {usedRooms.map((r) => (
                <span
                  key={r.id}
                  className="px-2 py-0.5 rounded-lg bg-card border border-border/80 text-[10.5px] font-extrabold text-foreground shadow-2xs"
                >
                  🚪 {r.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── RESPONSIVE COMPREHENSIVE TIMETABLE GRID ───────────────────────── */}
      <TeacherScheduleShiftTable
        shiftFilter={shiftFilter}
        shift1Count={shift1Count}
        shift2Count={shift2Count}
        activeTeacher={activeTeacher}
        dailyStats={dailyStats}
        cellLessonMap={cellLessonMap}
        subjectMap={subjectMap}
        classMap={classMap}
        roomMap={roomMap}
        branchMap={branchMap}
        onOpenZamena={onOpenZamena}
        onSelectClass={onSelectClass}
      />

      {/* ── PROACTIVE PEDAGOGICAL INSIGHTS & SUGGESTIONS ──────────────────── */}
      <TeacherScheduleInsights
        dailyStats={dailyStats}
        shift1Count={shift1Count}
        shift2Count={shift2Count}
        totalGapsCount={totalGapsCount}
      />
    </div>
  );
};
