"use client";

import React, { useState } from "react";
import { Lesson, Subject, Teacher, SchoolClass } from "@/types";
import { UserCheck, X, Calendar, Clock, BookOpen, AlertCircle, Check } from "lucide-react";

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

  // Shu fanni o'qita oladigan va bo'sh bo'lgan o'qituvchilar
  const qualifiedAndFree = allTeachers.filter(
    (t) =>
      t.id !== originalTeacher?.id &&
      t.subjectIds.includes(lesson.subjectId) &&
      !busyTeacherIds.has(t.id)
  );

  // Boshqa barcha bo'sh o'qituvchilar
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
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                O&apos;rinbosar tayinlash (Zamena)
              </h3>
              <p className="text-xs text-muted-foreground">
                {classObj?.name} sinfi &bull; {lesson.dayOfWeek}-kun, {lesson.periodNumber}-dars
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
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
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              O&apos;rinbosar o&apos;qituvchini tanlang:
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">-- O&apos;qituvchini tanlang --</option>

              {qualifiedAndFree.length > 0 && (
                <optgroup label="⭐ Shu fan mutaxassisi (Bo'sh o'qituvchilar)">
                  {qualifiedAndFree.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} (Mutaxassis)
                    </option>
                  ))}
                </optgroup>
              )}

              {otherFreeTeachers.length > 0 && (
                <optgroup label="Boshqa bo'sh o'qituvchilar">
                  {otherFreeTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
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
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="Masalan: Malaka oshirish kursi, kasallik varaqasi"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={!selectedTeacherId}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>O&apos;rinbosarni tasdiqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
