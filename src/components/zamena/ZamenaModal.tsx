"use client";

import React, { useState } from "react";
import { Lesson, Subject, Teacher, SchoolClass } from "@/types";
import { UserCheck, X, Calendar, Clock, BookOpen, AlertCircle, CheckCircle2, Sparkles, Star } from "lucide-react";

interface ZamenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: Lesson | null;
  subject?: Subject;
  originalTeacher?: Teacher;
  classObj?: SchoolClass;
  allTeachers: Teacher[];
  allLessons: Lesson[];
  onAssignReplacement: (lessonId: string, replacementTeacherId: string, reason: string) => void;
}

export const ZamenaModal: React.FC<ZamenaModalProps> = ({
  isOpen,
  onClose,
  lesson,
  subject,
  originalTeacher,
  classObj,
  allTeachers,
  allLessons,
  onAssignReplacement,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [reason, setReason] = useState<string>("Kasallik varaqasi / Sababli kelolmaslik");

  if (!isOpen || !lesson) return null;

  // Shu dars vaqtida boshqa sinfda dars o'tmayotgan bo'sh o'qituvchilarni aniqlash
  const busyTeacherIds = new Set(
    allLessons
      .filter(
        (l) =>
          l.id !== lesson.id &&
          l.dayOfWeek === lesson.dayOfWeek &&
          l.periodNumber === lesson.periodNumber
      )
      .map((l) => l.teacherId)
  );

  // 1. Shu fan mutaxassisi va ayni paytda bo'sh turgan o'qituvchilar (Eng optimal)
  const qualifiedAndFree = allTeachers.filter(
    (t) =>
      t.id !== originalTeacher?.id &&
      t.subjectIds.includes(lesson.subjectId) &&
      !busyTeacherIds.has(t.id)
  );

  // 2. Boshqa bo'sh o'qituvchilar
  const otherFreeTeachers = allTeachers.filter(
    (t) =>
      t.id !== originalTeacher?.id &&
      !t.subjectIds.includes(lesson.subjectId) &&
      !busyTeacherIds.has(t.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) return;
    onAssignReplacement(lesson.id, selectedTeacherId, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <span>Aqlli O&apos;rinbosar Tayinlash (Zamena)</span>
                <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
                  AI Tavsiya
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                {classObj?.name} sinfi &bull; {lesson.dayOfWeek}-kun, {lesson.periodNumber}-dars
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Lesson Details */}
        <div className="my-4 rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Fan:</span>
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: subject?.colorTag || "#3B82F6" }}
              />
              {subject?.name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Asosiy o&apos;qituvchi:</span>
            <span className="font-semibold text-foreground">{originalTeacher?.fullName}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* AI Recommended Fast Chips */}
          {qualifiedAndFree.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Tavsiya etadigan eng maqbul ustozlar:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {qualifiedAndFree.slice(0, 3).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTeacherId(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      selectedTeacherId === t.id
                        ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-500/40"
                        : "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{t.fullName}</span>
                    <span className="text-[10px] opacity-80">(Bo'sh)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              O&apos;rinbosar o&apos;qituvchini tanlang:
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
            >
              <option value="">-- O&apos;qituvchini tanlang --</option>

              {qualifiedAndFree.length > 0 && (
                <optgroup label="⭐ Shu fan mutaxassisi (Bo'sh o'qituvchilar)">
                  {qualifiedAndFree.map((t) => (
                    <option key={t.id} value={t.id}>
                      🟢 {t.fullName} (Fan mutaxassisi • Bo'sh)
                    </option>
                  ))}
                </optgroup>
              )}

              {otherFreeTeachers.length > 0 && (
                <optgroup label="Boshqa bo'sh o'qituvchilar">
                  {otherFreeTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      🟡 {t.fullName} (Bo'sh)
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Almashtirish sababi:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Masalan: Kasallik, Xizmat safari, Malaka oshirish"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={!selectedTeacherId}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>O&apos;rinbosar Tayinlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
