"use client";

import React, { useState, useEffect, useMemo } from "react";
import { SchoolClass, Subject, Teacher, ClassSubject } from "@/types";
import { TeacherSelectCombobox } from "../shared/TeacherSelectCombobox";
import { X, BookOpen, Plus, Trash2, GraduationCap, AlertCircle, CheckCircle2, Clock } from "lucide-react";

interface CurriculumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classId: string, subjects: ClassSubject[]) => void;
  targetClass: SchoolClass | null;
  allSubjects: Subject[];
  allTeachers: Teacher[];
}

export const CurriculumModal: React.FC<CurriculumModalProps> = ({
  isOpen,
  onClose,
  onSave,
  targetClass,
  allSubjects,
  allTeachers,
}) => {
  const [subjectsList, setSubjectsList] = useState<ClassSubject[]>([]);

  useEffect(() => {
    if (targetClass) {
      setSubjectsList(targetClass.subjects || []);
    } else {
      setSubjectsList([]);
    }
  }, [targetClass, isOpen]);

  const totalWeeklyHours = useMemo(
    () => subjectsList.reduce((sum, item) => sum + (Number(item.weeklyHours) || 0), 0),
    [subjectsList]
  );

  const subjectMap = useMemo(() => new Map(allSubjects.map((s) => [s.id, s])), [allSubjects]);

  if (!isOpen || !targetClass) return null;

  const handleAddSubject = () => {
    const unassignedSubject = allSubjects.find(
      (s) => !subjectsList.some((cs) => cs.subjectId === s.id)
    );
    const subjectId = unassignedSubject ? unassignedSubject.id : allSubjects[0]?.id || "";
    
    // Find teacher who teaches this subject
    const suitableTeacher = allTeachers.find((t) => t.subjectIds.includes(subjectId));
    const teacherId = suitableTeacher ? suitableTeacher.id : allTeachers[0]?.id || "";

    setSubjectsList((prev) => [
      ...prev,
      {
        classId: targetClass.id,
        subjectId,
        teacherId,
        weeklyHours: 2,
        groupType: "WHOLE",
      },
    ]);
  };

  const handleRemoveSubject = (index: number) => {
    setSubjectsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, key: keyof ClassSubject, val: any) => {
    setSubjectsList((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [key]: val };

        // If subject changed, auto-suggest first suitable teacher
        if (key === "subjectId") {
          const suitableTeacher = allTeachers.find((t) => t.subjectIds.includes(val));
          if (suitableTeacher) {
            updated.teacherId = suitableTeacher.id;
          }
        }
        return updated;
      })
    );
  };

  const handleSave = () => {
    // Filter out invalid items
    const validList = subjectsList.filter((s) => s.subjectId && s.teacherId && s.weeklyHours > 0);
    onSave(targetClass.id, validList);
    onClose();
  };

  // Max recommended load: 1-4th grades: 24-28 hours, 5-11th: 30-34 hours
  const maxRecommendedHours = targetClass.grade <= 4 ? 26 : 34;
  const isOverloaded = totalWeeklyHours > maxRecommendedHours;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground flex items-center gap-2">
                <span>{targetClass.name} sinfi — O'quv rejasi va yuklama</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-primary/10 text-primary border border-primary/20">
                  {targetClass.grade}-sinf
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Haftalik fanlar va biriktirilgan o'qituvchilar taqsimoti
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total hours indicator */}
        <div className="px-6 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Jami haftalik dars soati:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-md ${
                isOverloaded
                  ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                  : "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
              }`}
            >
              {totalWeeklyHours} soat / {maxRecommendedHours} soat me'yor
            </span>
          </div>

          <button
            type="button"
            onClick={handleAddSubject}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Fan qo'shish</span>
          </button>
        </div>

        {/* Subjects list table */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3">
          {subjectsList.length === 0 ? (
            <div className="py-12 text-center">
              <BookOpen className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">Hozircha birorta fan biriktirilmagan</p>
              <p className="text-xs text-muted-foreground mt-1">
                "Fan qo'shish" tugmasini bosib ushbu sinfga dars soatlarini taqsimlang
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {subjectsList.map((item, index) => {
                const sub = subjectMap.get(item.subjectId);
                const teacherCandidates = allTeachers.filter((t) =>
                  t.subjectIds.includes(item.subjectId)
                );

                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-2xl border border-border/80 bg-card/60 hover:bg-card transition-all"
                  >
                    {/* Subject color indicator */}
                    <div
                      className="w-2.5 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: sub?.colorTag || "#3B82F6" }}
                    />

                    {/* Subject select */}
                    <div className="w-1/3">
                      <select
                        value={item.subjectId}
                        onChange={(e) => handleUpdateItem(index, "subjectId", e.target.value)}
                        className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                      >
                        {allSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.difficultyScore} ball)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Teacher select */}
                    <div className="flex-1">
                      <select
                        value={item.teacherId}
                        onChange={(e) => handleUpdateItem(index, "teacherId", e.target.value)}
                        className="w-full px-3 py-2 text-xs font-medium rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                      >
                        <option value="">O'qituvchi tanlang...</option>
                        {teacherCandidates.length > 0 ? (
                          teacherCandidates.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullName} ({t.weeklyHourCapacity} st)
                            </option>
                          ))
                        ) : (
                          allTeachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.fullName}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Weekly hours input */}
                    <div className="w-24 flex items-center gap-1">
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={item.weeklyHours}
                        onChange={(e) =>
                          handleUpdateItem(index, "weeklyHours", Number(e.target.value))
                        }
                        className="w-full px-2.5 py-2 text-xs font-bold text-center rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                      <span className="text-[11px] text-muted-foreground font-medium">soat</span>
                    </div>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(index)}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/80 bg-muted/20 shrink-0">
          <div className="text-xs text-muted-foreground">
            {subjectsList.length} ta fan • {totalWeeklyHours} haftalik soat
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              Yuklamani saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
