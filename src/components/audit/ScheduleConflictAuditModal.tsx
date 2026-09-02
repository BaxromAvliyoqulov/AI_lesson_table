"use client";

import React, { useMemo } from "react";
import {
  AlertTriangle,
  X,
  Sparkles,
  CheckCircle2,
  Users,
  Calendar,
  Layers,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Flame,
  Coffee,
  HelpCircle,
} from "lucide-react";
import { Lesson, SchoolClass, Subject, Teacher, Room } from "@/types";

const WEEKDAY_NAMES = [
  "",
  "Dushanba",
  "Seshanba",
  "Chorshanba",
  "Payshanba",
  "Juma",
  "Shanba",
];

export interface ScheduleConflictItem {
  id: string;
  type: "TEACHER_COLLISION" | "METHOD_DAY" | "SAME_DAY_DUPLICATE" | "PRIMARY_SATURDAY" | "TEACHER_FATIGUE";
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  title: string;
  description: string;
  className: string;
  classId: string;
  subjectName: string;
  teacherName: string;
  teacherNumber?: number;
  dayOfWeek: number;
  dayName: string;
  periodNumber: number;
  relatedLessons: Lesson[];
  recommendation: string;
}

interface ScheduleConflictAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: Lesson[];
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  onAutoFixAI?: () => void;
  onSelectClass?: (classId: string) => void;
}

export const ScheduleConflictAuditModal: React.FC<ScheduleConflictAuditModalProps> = ({
  isOpen,
  onClose,
  lessons = [],
  classes = [],
  subjects = [],
  teachers = [],
  onAutoFixAI,
  onSelectClass,
}) => {
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);

  // Analyze conflicts
  const conflicts: ScheduleConflictItem[] = useMemo(() => {
    const list: ScheduleConflictItem[] = [];

    // 1. O'qituvchilar Kolliziyasi (Teacher Collisions)
    const teacherSlotMap = new Map<string, Lesson[]>();
    for (const l of lessons) {
      const key = `${l.teacherId}_${l.dayOfWeek}_${l.periodNumber}`;
      const existing = teacherSlotMap.get(key) || [];
      existing.push(l);
      teacherSlotMap.set(key, existing);
    }

    teacherSlotMap.forEach((matchedLessons, key) => {
      if (matchedLessons.length > 1) {
        const first = matchedLessons[0];
        const teacher = teacherMap.get(first.teacherId);
        const classNames = matchedLessons.map((l) => classMap.get(l.classId)?.name || "Sinf").join(", ");
        const subNames = matchedLessons.map((l) => subjectMap.get(l.subjectId)?.name || "Fan").join(", ");

        list.push({
          id: `collision_${key}`,
          type: "TEACHER_COLLISION",
          severity: "CRITICAL",
          title: `O'qituvchi Kolliziyasi (${matchedLessons.length} ta sinfda bir vaqtda)`,
          description: `${teacher?.fullName || "O'qituvchi"} bir vaqtning o'zida (${WEEKDAY_NAMES[first.dayOfWeek]}, ${first.periodNumber}-dars) ${classNames} sinflariga dars o'tishi kerak bo'lib qolgan.`,
          className: classNames,
          classId: first.classId,
          subjectName: subNames,
          teacherName: teacher?.fullName || "O'qituvchi",
          teacherNumber: teacher?.displayNumber,
          dayOfWeek: first.dayOfWeek,
          dayName: WEEKDAY_NAMES[first.dayOfWeek] || `${first.dayOfWeek}-kun`,
          periodNumber: first.periodNumber,
          relatedLessons: matchedLessons,
          recommendation: `Darslardan birini o'qituvchi bo'sh bo'lgan boshqa soatga ko'chiring yoki AI bilan 1 bosishda to'g'rilang.`,
        });
      }
    });

    // 2. Metod Kuni Xatolari (Method Day Violations)
    for (const l of lessons) {
      const teacher = teacherMap.get(l.teacherId);
      const subject = subjectMap.get(l.subjectId);
      const cls = classMap.get(l.classId);

      const isTeacherMethodDay =
        teacher?.methodDayOfWeek !== undefined &&
        teacher.methodDayOfWeek !== null &&
        teacher.methodDayOfWeek === l.dayOfWeek;

      const isSubjectMethodDay =
        subject?.methodDayOfWeek !== undefined &&
        subject.methodDayOfWeek !== null &&
        subject.methodDayOfWeek === l.dayOfWeek;

      if (isTeacherMethodDay || isSubjectMethodDay) {
        const targetEntity = isTeacherMethodDay
          ? `${teacher?.fullName || "O'qituvchi"}ning shaxsiy metod kuni`
          : `${subject?.name || "Fan"}ning rasmiy metod kuni`;

        list.push({
          id: `method_${l.id}`,
          type: "METHOD_DAY",
          severity: "CRITICAL",
          title: `Metod Kunida Dars Qo'yilgan`,
          description: `${cls?.name || "Sinf"}da ${WEEKDAY_NAMES[l.dayOfWeek]} kuni ${l.periodNumber}-darsga ${subject?.name || "Fan"} qo'yilgan. Bu kun ${targetEntity} hisoblanadi.`,
          className: cls?.name || "Sinf",
          classId: l.classId,
          subjectName: subject?.name || "Fan",
          teacherName: teacher?.fullName || "O'qituvchi",
          teacherNumber: teacher?.displayNumber,
          dayOfWeek: l.dayOfWeek,
          dayName: WEEKDAY_NAMES[l.dayOfWeek] || `${l.dayOfWeek}-kun`,
          periodNumber: l.periodNumber,
          relatedLessons: [l],
          recommendation: `Ushbu darsni haftaning boshqa bo'sh kuniga o'tkazing.`,
        });
      }
    }

    // 3. Bir kunda bir xil fan takrorlanishi (Same Day Duplicate)
    const classDaySubjectMap = new Map<string, Lesson[]>();
    for (const l of lessons) {
      const sub = subjectMap.get(l.subjectId);
      if (!sub?.allowDoubleLesson) {
        const key = `${l.classId}_${l.dayOfWeek}_${l.subjectId}`;
        const existing = classDaySubjectMap.get(key) || [];
        existing.push(l);
        classDaySubjectMap.set(key, existing);
      }
    }

    classDaySubjectMap.forEach((matched, key) => {
      if (matched.length > 1) {
        const first = matched[0];
        const cls = classMap.get(first.classId);
        const subject = subjectMap.get(first.subjectId);
        const teacher = teacherMap.get(first.teacherId);
        const periods = matched.map((m) => `${m.periodNumber}-dars`).join(" va ");

        list.push({
          id: `duplicate_${key}`,
          type: "SAME_DAY_DUPLICATE",
          severity: "HIGH",
          title: `Bir Kunda Bir Xil Fanning Takrorlanishi`,
          description: `${cls?.name || "Sinf"}da ${WEEKDAY_NAMES[first.dayOfWeek]} kuni ${subject?.name || "Fan"} darsi ${matched.length} marta (${periods}) qo'yilgan. Maktab me'yori bo'yicha bu fanga kuniga 1 soat ruxsat berilgan.`,
          className: cls?.name || "Sinf",
          classId: first.classId,
          subjectName: subject?.name || "Fan",
          teacherName: teacher?.fullName || "O'qituvchi",
          teacherNumber: teacher?.displayNumber,
          dayOfWeek: first.dayOfWeek,
          dayName: WEEKDAY_NAMES[first.dayOfWeek] || `${first.dayOfWeek}-kun`,
          periodNumber: first.periodNumber,
          relatedLessons: matched,
          recommendation: `Ikkinchi darsni haftaning bu fan bo'lmagan boshqa kuniga suring.`,
        });
      }
    });

    // 4. Boshlang'ich sinf Shanba darsi
    for (const l of lessons) {
      const cls = classMap.get(l.classId);
      if (cls?.isPrimary && l.dayOfWeek === 6) {
        const subject = subjectMap.get(l.subjectId);
        const teacher = teacherMap.get(l.teacherId);
        list.push({
          id: `primary_sat_${l.id}`,
          type: "PRIMARY_SATURDAY",
          severity: "MEDIUM",
          title: `Boshlang'ich Sinfda Shanba Darsi`,
          description: `${cls.name} boshlang'ich sinf bo'lib, Shanba kuni dam olish kuni hisoblanadi.`,
          className: cls.name,
          classId: l.classId,
          subjectName: subject?.name || "Fan",
          teacherName: teacher?.fullName || "O'qituvchi",
          dayOfWeek: 6,
          dayName: "Shanba",
          periodNumber: l.periodNumber,
          relatedLessons: [l],
          recommendation: `Darsni Dushanba-Juma oralig'idagi soatlarga ko'chiring.`,
        });
      }
    }

    return list;
  }, [lessons, classMap, subjectMap, teacherMap]);

  if (!isOpen) return null;

  const criticalCount = conflicts.filter((c) => c.severity === "CRITICAL").length;
  const highCount = conflicts.filter((c) => c.severity === "HIGH").length;
  const mediumCount = conflicts.filter((c) => c.severity === "MEDIUM").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-card text-foreground rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-xl text-white shadow-md ${
                conflicts.length === 0
                  ? "bg-emerald-600 shadow-emerald-600/30"
                  : "bg-rose-600 shadow-rose-600/30"
              }`}
            >
              {conflicts.length === 0 ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Dars Jadvali Ziddiyatlari va Tahlil Radari
                </h2>
                <span
                  className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-full border ${
                    conflicts.length === 0
                      ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                      : "bg-rose-500/15 text-rose-600 border-rose-500/30"
                  }`}
                >
                  {conflicts.length === 0 ? "0 ta ziddiyat (Ideal)" : `${conflicts.length} ta ogohlantirish`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                O'qituvchilar to'qnashuvi, rasmiy metod kunlari va 1 kun 1 fan qoidalarining real-vaqt monitoringi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Stats Banner */}
        <div className="px-6 py-3 border-b border-border bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="flex items-center gap-1.5 font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              {criticalCount} ta kritik kolliziya
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              {highCount} ta fan takrori
            </span>
            {mediumCount > 0 && (
              <span className="flex items-center gap-1.5 font-bold text-blue-600 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
                {mediumCount} ta SanPiN eslatma
              </span>
            )}
          </div>

          {conflicts.length > 0 && onAutoFixAI && (
            <button
              onClick={() => {
                onAutoFixAI();
                onClose();
              }}
              className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>AI Bilan 0 Ziddiyat Qilish (Avto-Tuzatish)</span>
            </button>
          )}
        </div>

        {/* Conflicts List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {conflicts.length === 0 ? (
            <div className="py-14 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-foreground">
                Ajoyib! Dars jadvalida birorta ham ziddiyat yo'q!
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Barcha 55 nafar ustoz va 29 ta sinf darslari o'qituvchilar to'qnashuvisiz, metod kunlariga to'liq rioya qilingan holda va bir kunda bir xil fan takrorlanmasdan to'g'ri joylashtirilgan.
              </p>
            </div>
          ) : (
            conflicts.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.severity === "CRITICAL"
                    ? "border-rose-500/40 bg-rose-500/5 shadow-sm"
                    : item.severity === "HIGH"
                    ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
                    : "border-blue-500/30 bg-blue-500/5"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider ${
                          item.severity === "CRITICAL"
                            ? "bg-rose-600 text-white"
                            : item.severity === "HIGH"
                            ? "bg-amber-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {item.type === "TEACHER_COLLISION"
                          ? "🔴 O'qituvchi Kolliziyasi"
                          : item.type === "METHOD_DAY"
                          ? "🛑 Metod Kuni"
                          : item.type === "SAME_DAY_DUPLICATE"
                          ? "⚠️ Fan Takrori"
                          : "ℹ️ SanPiN Eslatma"}
                      </span>

                      <span className="text-xs font-bold text-foreground">
                        {item.title}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                      {item.description}
                    </p>

                    {/* Metadata tags */}
                    <div className="flex items-center gap-3 mt-2.5 text-[11px] text-muted-foreground flex-wrap">
                      <span className="font-bold text-foreground bg-muted/70 px-2 py-0.5 rounded-lg border border-border">
                        🏫 {item.className}
                      </span>
                      <span className="font-semibold text-foreground/80 bg-muted/70 px-2 py-0.5 rounded-lg border border-border">
                        📖 {item.subjectName}
                      </span>
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-lg border border-indigo-500/20">
                        👨‍🏫 {item.teacherName} {item.teacherNumber ? `(№${item.teacherNumber})` : ""}
                      </span>
                      <span className="font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-lg border border-blue-500/20">
                        📅 {item.dayName}, {item.periodNumber}-dars
                      </span>
                    </div>

                    {/* Recommendation */}
                    <div className="mt-2.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 flex items-start gap-1.5">
                      <span className="text-xs">💡</span>
                      <span>{item.recommendation}</span>
                    </div>
                  </div>

                  {/* Class Jump Button */}
                  {onSelectClass && (
                    <button
                      onClick={() => {
                        onSelectClass(item.classId);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer self-end sm:self-center shrink-0"
                      title="Ushbu sinf jadvaliga o'tish"
                    >
                      <span>Sinfga o'tish</span>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-600" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            Ziddiyatsiz dars jadvali — o'quvchilar va ustozlar uchun eng qulay tartib kafolati.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
