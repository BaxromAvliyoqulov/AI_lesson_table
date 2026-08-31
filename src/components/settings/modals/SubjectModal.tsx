"use client";

import React, { useState, useEffect } from "react";
import { Subject, RoomType } from "@/types";
import { X, BookOpen, Sparkles, Layers, ShieldCheck } from "lucide-react";

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subjectData: Subject) => void;
  editingSubject: Subject | null;
  currentSchoolId: string;
}

const PRESET_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Emerald
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#14B8A6", // Teal
  "#6366F1", // Indigo
  "#F97316", // Orange
  "#84CC16", // Lime
  "#64748B", // Slate
];

const WEEKDAYS = [
  { id: 1, name: "Dushanba" },
  { id: 2, name: "Seshanba" },
  { id: 3, name: "Chorshanba" },
  { id: 4, name: "Payshanba" },
  { id: 5, name: "Juma" },
  { id: 6, name: "Shanba" },
];

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSubject,
  currentSchoolId,
}) => {
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [colorTag, setColorTag] = useState("#3B82F6");
  const [difficultyScore, setDifficultyScore] = useState(5);
  const [allowDoubleLesson, setAllowDoubleLesson] = useState(false);
  const [requiresRoomType, setRequiresRoomType] = useState<RoomType | "">("");
  const [methodDayOfWeek, setMethodDayOfWeek] = useState<number | "">("");

  useEffect(() => {
    if (editingSubject) {
      setName(editingSubject.name);
      setShortName(editingSubject.shortName || "");
      setColorTag(editingSubject.colorTag);
      setDifficultyScore(editingSubject.difficultyScore);
      setAllowDoubleLesson(editingSubject.allowDoubleLesson);
      setRequiresRoomType(editingSubject.requiresRoomType || "");
      setMethodDayOfWeek(editingSubject.methodDayOfWeek || "");
    } else {
      setName("");
      setShortName("");
      setColorTag(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
      setDifficultyScore(5);
      setAllowDoubleLesson(false);
      setRequiresRoomType("");
      setMethodDayOfWeek("");
    }
  }, [editingSubject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const subjectData: Subject = {
      id: editingSubject ? editingSubject.id : `sub_${currentSchoolId}_${Date.now()}`,
      schoolId: currentSchoolId,
      name: name.trim(),
      shortName: shortName.trim() || name.slice(0, 3).toUpperCase(),
      colorTag,
      difficultyScore: Number(difficultyScore),
      allowDoubleLesson,
      requiresRoomType: requiresRoomType === "" ? null : (requiresRoomType as RoomType),
      methodDayOfWeek: methodDayOfWeek === "" ? null : Number(methodDayOfWeek),
    };

    onSave(subjectData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: colorTag }}
            >
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {editingSubject ? "Fanni tahrirlash" : "Yangi fan qo'shish"}
              </h3>
              <p className="text-xs text-muted-foreground">
                SanPiN yuklama bali, qisqa nomi va xona talabi
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
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Fan nomi *
              </label>
              <input
                type="text"
                required
                placeholder="Masalan: Matematika, Fizika"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!shortName && e.target.value.length >= 3) {
                    setShortName(e.target.value.slice(0, 3).toUpperCase());
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Qisqa nomi
              </label>
              <input
                type="text"
                placeholder="MAT"
                value={shortName}
                onChange={(e) => setShortName(e.target.value.toUpperCase())}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold uppercase text-center"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Rang belgisi (Kartochka rangi)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColorTag(c)}
                  className={`w-7 h-7 rounded-xl transition-all cursor-pointer ${
                    colorTag === c ? "ring-2 ring-primary ring-offset-2 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={colorTag}
                onChange={(e) => setColorTag(e.target.value)}
                className="w-7 h-7 rounded-xl border border-border cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground">
                  SanPiN aqliy yuklama
                </label>
                <span className="text-xs font-bold text-primary">{difficultyScore} ball</span>
              </div>
              <input
                type="range"
                min={1}
                max={13}
                value={difficultyScore}
                onChange={(e) => setDifficultyScore(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>1 (Yengil)</span>
                <span>7 (O'rta)</span>
                <span>13 (Og'ir)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Maxsus xona talabi
              </label>
              <select
                value={requiresRoomType}
                onChange={(e) => setRequiresRoomType(e.target.value as RoomType | "")}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
              >
                <option value="">Oddiy sinf xonasi</option>
                <option value="GYM">Sport zali</option>
                <option value="COMP_LAB">Informatika xonasi</option>
                <option value="LAB">Laboratoriya (Fizika/Kimyo)</option>
                <option value="OUTDOOR_PITCH">Ochiq sport maydoni</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/60">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Fan metod kuni
              </label>
              <select
                value={methodDayOfWeek}
                onChange={(e) => setMethodDayOfWeek(e.target.value === "" ? "" : Number(e.target.value))}
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

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowDoubleLesson}
                  onChange={(e) => setAllowDoubleLesson(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary w-4 h-4"
                />
                <span>2 soat ketma-ket (para) ruxsat</span>
              </label>
            </div>
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
              {editingSubject ? "Saqlash" : "Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
