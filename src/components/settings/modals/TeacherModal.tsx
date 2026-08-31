"use client";

import React, { useState, useEffect } from "react";
import { Teacher, Subject, Branch } from "@/types";
import { formatUzPhone, sanitizeFullName } from "@/lib/utils";
import { X, Users, BookOpen, Building2, Calendar, Phone, Clock } from "lucide-react";

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacherData: Teacher) => void;
  editingTeacher: Teacher | null;
  currentSchoolId: string;
  subjects: Subject[];
  branches: Branch[];
}

const WEEKDAYS = [
  { id: 1, name: "Dushanba" },
  { id: 2, name: "Seshanba" },
  { id: 3, name: "Chorshanba" },
  { id: 4, name: "Payshanba" },
  { id: 5, name: "Juma" },
  { id: 6, name: "Shanba" },
];

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTeacher,
  currentSchoolId,
  subjects,
  branches,
}) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [weeklyCapacity, setWeeklyCapacity] = useState(20);
  const [maxConsecutive, setMaxConsecutive] = useState(4);
  const [methodDay, setMethodDay] = useState<number | "">("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  useEffect(() => {
    if (editingTeacher) {
      setFullName(editingTeacher.fullName);
      setPhone(editingTeacher.phone || "");
      setWeeklyCapacity(editingTeacher.weeklyHourCapacity);
      setMaxConsecutive(editingTeacher.maxConsecutiveHours);
      setMethodDay(editingTeacher.methodDayOfWeek || "");
      setSelectedSubjects(editingTeacher.subjectIds || []);
      setSelectedBranches(editingTeacher.branchIds || (branches[0] ? [branches[0].id] : []));
    } else {
      setFullName("");
      setPhone("");
      setWeeklyCapacity(20);
      setMaxConsecutive(4);
      setMethodDay("");
      setSelectedSubjects([]);
      setSelectedBranches(branches[0] ? [branches[0].id] : []);
    }
  }, [editingTeacher, branches, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const teacherData: Teacher = {
      id: editingTeacher ? editingTeacher.id : `t_${currentSchoolId}_${Date.now()}`,
      schoolId: currentSchoolId,
      fullName: sanitizeFullName(fullName.trim()),
      phone: phone.trim() || null,
      weeklyHourCapacity: Number(weeklyCapacity),
      maxConsecutiveHours: Number(maxConsecutive),
      methodDayOfWeek: methodDay === "" ? null : Number(methodDay),
      subjectIds: selectedSubjects,
      branchIds: selectedBranches.length > 0 ? selectedBranches : (branches[0] ? [branches[0].id] : []),
      availabilities: editingTeacher?.availabilities || [],
      homeroomClassId: editingTeacher?.homeroomClassId || null,
    };

    onSave(teacherData);
    onClose();
  };

  const toggleSubject = (subId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const toggleBranch = (branchId: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId) ? prev.filter((id) => id !== branchId) : [...prev, branchId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {editingTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}
              </h3>
              <p className="text-xs text-muted-foreground">
                O'qituvchi profili, fanlari va metod kunini belgilang
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                F.I.SH (To'liq ism) *
              </label>
              <input
                type="text"
                required
                placeholder="Masalan: Karimova Dilnoza"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Telefon raqami
              </label>
              <input
                type="text"
                placeholder="+998 (90) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Haftalik stavka (soat)
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={weeklyCapacity}
                onChange={(e) => setWeeklyCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Ketma-ket dars (maks)
              </label>
              <input
                type="number"
                min={1}
                max={8}
                value={maxConsecutive}
                onChange={(e) => setMaxConsecutive(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Shaxsiy metod kuni
              </label>
              <select
                value={methodDay}
                onChange={(e) => setMethodDay(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
              >
                <option value="">Metod kuni yo'q</option>
                {WEEKDAYS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dars beradigan fanlari */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Dars beradigan fanlari ({selectedSubjects.length} ta tanlandi)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 rounded-2xl border border-border bg-muted/20 custom-scrollbar">
              {subjects.map((s) => {
                const isSelected = selectedSubjects.includes(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSubject(s.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-card border-border hover:border-slate-300 dark:hover:border-slate-700 text-muted-foreground"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: s.colorTag }}
                    />
                    <span className="truncate">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Binolari */}
          {branches.length > 1 && (
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-2">
                Dars o'tadigan binolari (Filiallar)
              </label>
              <div className="flex flex-wrap gap-2">
                {branches.map((b) => {
                  const isSelected = selectedBranches.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => toggleBranch(b.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-600 font-semibold"
                          : "bg-card border-border text-muted-foreground"
                      }`}
                    >
                      {b.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              {editingTeacher ? "Saqlash" : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
