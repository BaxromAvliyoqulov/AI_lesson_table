"use client";

import React, { useState, useEffect } from "react";
import { SchoolClass, Branch, Shift, Teacher } from "@/types";
import { TeacherSelectCombobox } from "../shared/TeacherSelectCombobox";
import { X, GraduationCap, Building2, Clock, UserCheck } from "lucide-react";

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: SchoolClass) => void;
  editingClass: SchoolClass | null;
  currentSchoolId: string;
  branches: Branch[];
  shifts: Shift[];
  teachers: Teacher[];
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingClass,
  currentSchoolId,
  branches,
  shifts,
  teachers,
}) => {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(1);
  const [branchId, setBranchId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);
  const [homeroomTeacherId, setHomeroomTeacherId] = useState("");
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name);
      setGrade(editingClass.grade);
      setBranchId(editingClass.branchId);
      setShiftId(editingClass.shiftId);
      setIsPrimary(editingClass.isPrimary);
      setHomeroomTeacherId(editingClass.homeroomTeacherId || "");
      setIsClosed(editingClass.isClosed || false);
    } else {
      setName("");
      setGrade(1);
      setBranchId(branches[0]?.id || "");
      setShiftId(shifts[0]?.id || "");
      setIsPrimary(true);
      setHomeroomTeacherId("");
      setIsClosed(false);
    }
  }, [editingClass, branches, shifts, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const classData: SchoolClass = {
      id: editingClass ? editingClass.id : `c_${currentSchoolId}_${Date.now()}`,
      schoolId: currentSchoolId,
      branchId: branchId || branches[0]?.id || "",
      shiftId: shiftId || shifts[0]?.id || "",
      name: name.trim().toUpperCase(),
      grade: Number(grade),
      isPrimary: Number(grade) <= 4 || isPrimary,
      isClosed,
      homeroomTeacherId: homeroomTeacherId || null,
      subjects: editingClass ? editingClass.subjects : [],
    };

    onSave(classData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {editingClass ? "Sinfni tahrirlash" : "Yangi sinf qo'shish"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Sinf raqami, binosi va sinf rahbarini belgilang
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Sinf nomi *
              </label>
              <input
                type="text"
                required
                placeholder="Masalan: 5-A, 10-B"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  const parsedGrade = parseInt(e.target.value);
                  if (!isNaN(parsedGrade) && parsedGrade >= 1 && parsedGrade <= 11) {
                    setGrade(parsedGrade);
                    setIsPrimary(parsedGrade <= 4);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Sinf bosqichi (1-11)
              </label>
              <select
                value={grade}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setGrade(val);
                  setIsPrimary(val <= 4);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold cursor-pointer"
              >
                {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    {g}-sinf {g <= 4 ? "(Boshlang'ich - 5 kun)" : "(Yuqori - 6 kun)"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                O'quv binosi (Filial)
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Smena
              </label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Sinf rahbari
            </label>
            <TeacherSelectCombobox
              value={homeroomTeacherId}
              onChange={setHomeroomTeacherId}
              teachers={teachers}
              placeholder="Sinf rahbarini tanlang..."
            />
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-border/60">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isClosed}
                onChange={(e) => setIsClosed(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              <span>Sinfni vaqtincha yopish (Jadvalga kiritilmaydi)</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
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
              {editingClass ? "Saqlash" : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
