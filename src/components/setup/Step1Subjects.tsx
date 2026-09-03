"use client";

import React, { useState } from "react";
import type { SetupData } from "@/app/setup/page";
import { StepLayout } from "./StepLayout";
import { Plus, Trash2, BookOpen } from "lucide-react";

type Props = { data: SetupData; updateData: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void; onNext: () => void; onBack: () => void };
type Subject = SetupData["subjects"][0];

const COLORS = ["#6366F1","#8B5CF6","#EC4899","#EF4444","#F97316","#EAB308","#22C55E","#10B981","#14B8A6","#06B6D4","#3B82F6","#64748B"];

const DEFAULT_SUBJECTS = [
  "Matematika","Algebra","Geometriya","Ona tili","Adabiyot","Rus tili","Ingliz tili",
  "Tarix","Jahon tarixi","O'zbekiston tarixi","Geografiya","Biologiya","Fizika","Kimyo",
  "Informatika","Tabiiy fan","Texnologiya","Tasviriy san'at","Musiqa","Jismoniy tarbiya",
  "Chizmachilik","Huquq","Iqtisod","Tadbirkorlik asoslari","Astronomiya","Tarbiya",
  "CHQBT","Kelajak soati",
];

const makeSubject = (name: string, i: number): Subject => ({
  name, colorTag: COLORS[i % COLORS.length], difficultyScore: 5, allowDoubleLesson: false, requiresRoomType: null,
});

export function Step1Subjects({ data, updateData, onNext, onBack }: Props) {
  const subjects = data.subjects;
  const [newName, setNewName] = useState("");

  const set = (s: Subject[]) => updateData("subjects", s);
  const addBulk = (names: string[]) => {
    const existing = new Set(subjects.map((s) => s.name));
    const toAdd = names.filter((n) => !existing.has(n)).map((n, i) => makeSubject(n, subjects.length + i));
    set([...subjects, ...toAdd]);
  };
  const addOne = () => {
    const name = newName.trim();
    if (!name || subjects.some((s) => s.name === name)) { setNewName(""); return; }
    set([...subjects, makeSubject(name, subjects.length)]);
    setNewName("");
  };
  const remove = (i: number) => set(subjects.filter((_, idx) => idx !== i));
  const update = (i: number, field: keyof Subject, val: any) => {
    const arr = [...subjects];
    arr[i] = { ...arr[i], [field]: val };
    set(arr);
  };

  const allSelected = DEFAULT_SUBJECTS.every((n) => subjects.some((s) => s.name === n));

  return (
    <StepLayout
      title="Fanlar katalogi"
      subtitle="Maktabingizda o'qitiladigan fanlar ro'yxatini tuzing. Fan nomlarini faqat shu ro'yxatdan tanlanadi — hato yozuv imkonsiz bo'ladi."
      icon={<BookOpen className="w-6 h-6" />}
      onNext={onNext}
      onBack={onBack}
      canNext={subjects.length > 0}
    >
      {/* Tezkor tanlash */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-300">Standart O'zbekiston maktab fanlari</span>
          <button onClick={() => allSelected ? set([]) : addBulk(DEFAULT_SUBJECTS)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
            {allSelected ? "Hammasini olib tashlash" : "Hammasini tanlash"}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_SUBJECTS.map((name) => {
            const selected = subjects.some((s) => s.name === name);
            return (
              <button key={name} onClick={() => selected ? set(subjects.filter((s) => s.name !== name)) : addBulk([name])}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selected ? "bg-indigo-600 text-white" : "bg-white/10 text-slate-400 hover:bg-white/15"
                }`}>
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Qo'shimcha fan qo'shish */}
      <div className="flex gap-2">
        <input
          id="subject-new-name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addOne()}
          placeholder="Yangi fan nomi..."
          className="input-field flex-1"
        />
        <button onClick={addOne} disabled={!newName.trim()}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-40 flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Qo'shish
        </button>
      </div>

      {/* Tanlangan fanlar */}
      {subjects.length > 0 && (
        <div>
          <p className="text-sm text-slate-400 mb-3">Tanlangan fanlar ({subjects.length} ta)</p>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {subjects.map((subj, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                <input type="color" value={subj.colorTag} onChange={(e) => update(i, "colorTag", e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent shrink-0" />
                <span className="flex-1 text-sm text-white font-medium">{subj.name}</span>
                <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                  <input type="checkbox" checked={subj.allowDoubleLesson}
                    onChange={(e) => update(i, "allowDoubleLesson", e.target.checked)}
                    className="rounded" />
                  2-soat ketma-ket
                </label>
                <button onClick={() => remove(i)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </StepLayout>
  );
}
