"use client";

import React, { useState } from "react";
import type { SetupData } from "@/app/setup/page";
import { StepLayout } from "./StepLayout";
import { Users, Plus, Trash2, Phone } from "lucide-react";

type Props = { data: SetupData; updateData: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void; onNext: () => void; onBack: () => void };
type Teacher = SetupData["teachers"][0];

const DAY_NAMES = ["—", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const blank = (): Teacher => ({ fullName: "", phone: "", methodDay: null, weeklyHourCapacity: 20, subjectNames: [], branchNames: ["Asosiy bino"] });

export function Step2Teachers({ data, updateData, onNext, onBack }: Props) {
  const teachers = data.teachers;
  const subjects = data.subjects.map((s) => s.name);
  const branches = data.branches.map((b) => b.name);
  const [form, setForm] = useState<Teacher>(blank());
  const [editing, setEditing] = useState<number | null>(null);

  const set = (t: Teacher[]) => updateData("teachers", t);
  const setF = (field: keyof Teacher, val: any) => setForm((p) => ({ ...p, [field]: val }));

  const save = () => {
    if (!form.fullName.trim()) return;
    if (editing !== null) {
      const arr = [...teachers];
      arr[editing] = form;
      set(arr);
      setEditing(null);
    } else {
      set([...teachers, form]);
    }
    setForm(blank());
  };

  const edit = (i: number) => { setEditing(i); setForm(teachers[i]); };
  const remove = (i: number) => { set(teachers.filter((_, idx) => idx !== i)); if (editing === i) { setEditing(null); setForm(blank()); } };

  const toggleSubject = (name: string) => setF("subjectNames", form.subjectNames.includes(name) ? form.subjectNames.filter((s) => s !== name) : [...form.subjectNames, name]);
  const toggleBranch = (name: string) => setF("branchNames", form.branchNames.includes(name) ? form.branchNames.filter((b) => b !== name) : [...form.branchNames, name]);

  return (
    <StepLayout
      title="O'qituvchilar"
      subtitle="Har bir o'qituvchini kiriting. Metod kuni va fanlar bo'yicha constraint solver avtomatik hisobga oladi."
      icon={<Users className="w-6 h-6" />}
      onNext={onNext}
      onBack={onBack}
      canNext={teachers.length > 0}
    >
      {/* Form */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <h3 className="text-sm font-semibold text-indigo-300">
          {editing !== null ? `${editing + 1}-o'qituvchini tahrirlash` : "Yangi o'qituvchi"}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label-sm">F.I.Sh *</label>
            <input id="teacher-name" value={form.fullName}
              onChange={(e) => setF("fullName", e.target.value.trimStart())}
              placeholder="Sunkov Ahmad Valiyevich"
              className="input-field w-full" />
          </div>
          <div>
            <label className="label-sm"><Phone className="w-3 h-3 inline mr-1" />Telefon</label>
            <input id="teacher-phone" value={form.phone} onChange={(e) => setF("phone", e.target.value)}
              placeholder="+998 90 123 45 67" className="input-field w-full" />
          </div>
          <div>
            <label className="label-sm">Haftalik sig'im (soat)</label>
            <input type="number" min={1} max={40} value={form.weeklyHourCapacity}
              onChange={(e) => setF("weeklyHourCapacity", +e.target.value)}
              className="input-field w-full" />
          </div>
          <div className="col-span-2">
            <label className="label-sm">Metod kuni (bu kunda dars yo'q)</label>
            <div className="flex gap-2 flex-wrap mt-1.5">
              {DAY_NAMES.map((day, i) => (
                <button key={i} type="button"
                  onClick={() => setF("methodDay", i === 0 ? null : (form.methodDay === i ? null : i))}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    (i === 0 && form.methodDay === null) || form.methodDay === i
                      ? "bg-amber-500 text-white font-medium"
                      : "bg-white/10 text-slate-400 hover:bg-white/15"
                  }`}>
                  {day}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fanlar */}
        {subjects.length > 0 && (
          <div>
            <label className="label-sm">Fanlar (o'qitadigan)</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {subjects.map((name) => (
                <button key={name} type="button" onClick={() => toggleSubject(name)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    form.subjectNames.includes(name) ? "bg-indigo-600 text-white" : "bg-white/10 text-slate-400 hover:bg-white/15"
                  }`}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filiallar */}
        {branches.length > 1 && (
          <div>
            <label className="label-sm">Filial(lar)</label>
            <div className="flex gap-2 mt-1.5">
              {branches.map((name) => (
                <button key={name} type="button" onClick={() => toggleBranch(name)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                    form.branchNames.includes(name) ? "bg-indigo-600 text-white" : "bg-white/10 text-slate-400 hover:bg-white/15"
                  }`}>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        <button onClick={save} disabled={!form.fullName.trim()}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          {editing !== null ? "Yangilash" : "O'qituvchi qo'shish"}
        </button>
      </div>

      {/* Ro'yxat */}
      {teachers.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-slate-400">{teachers.length} ta o'qituvchi</p>
          {teachers.map((t, i) => (
            <div key={i} onClick={() => edit(i)}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 cursor-pointer transition-all group">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-300 text-xs font-bold shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">{t.fullName}</div>
                <div className="text-xs text-slate-500 truncate">
                  {t.subjectNames.slice(0, 3).join(", ")}{t.subjectNames.length > 3 ? "..." : ""}
                  {t.methodDay ? ` · Metod: ${DAY_NAMES[t.methodDay]}` : ""}
                </div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); remove(i); }}
                className="text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </StepLayout>
  );
}
