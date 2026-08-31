"use client";

import React, { useState } from "react";
import type { SetupData } from "@/app/setup/page";
import { StepLayout } from "./StepLayout";
import { GraduationCap, Plus, Trash2, Copy } from "lucide-react";

type Props = {
  data: SetupData;
  updateData: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void;
  onNext: () => void;
  onBack: () => void;
  onFinish?: () => void;
  isSubmitting?: boolean;
};
type SchoolClass = SetupData["classes"][0];
type ClassSubject = SchoolClass["subjects"][0];

export function Step5Classes({ data, updateData, onNext, onBack, onFinish, isSubmitting }: Props) {
  const classes = data.classes;
  const subjects = data.subjects.map((s) => s.name);
  const shifts = data.shifts.map((s) => s.name);
  const branches = data.branches.map((b) => b.name);
  const teachers = data.teachers;

  const [grade, setGrade] = useState(1);
  const [name, setName] = useState("1-A");
  const [branch, setBranch] = useState(branches[0] || "");
  const [shift, setShift] = useState(shifts[0] || "");
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  const set = (c: SchoolClass[]) => updateData("classes", c);

  const filteredTeachers = (subjectName: string) =>
    teachers.filter((t) => t.subjectNames.includes(subjectName));

  const updateSubject = (i: number, field: keyof ClassSubject, val: any) => {
    const arr = [...classSubjects];
    arr[i] = { ...arr[i], [field]: val };
    setClassSubjects(arr);
  };

  const addSubjectRow = (subjectName: string) => {
    if (classSubjects.some((cs) => cs.subjectName === subjectName)) return;
    setClassSubjects([...classSubjects, { subjectName, teacherFullName: "", weeklyHours: 2 }]);
  };

  const addClass = () => {
    if (!name.trim()) return;
    set([...classes, { name: name.trim(), grade, branchName: branch, shiftName: shift, subjects: classSubjects }]);
    setClassSubjects([]);
    setName(`${grade}-${String.fromCharCode(65 + classes.filter((c) => c.grade === grade).length)}`);
  };

  const duplicate = (i: number) => {
    const src = classes[i];
    const newName = `${src.grade}-${String.fromCharCode(65 + classes.filter((c) => c.grade === src.grade).length)}`;
    set([...classes, { ...src, name: newName }]);
  };

  const remove = (i: number) => {
    set(classes.filter((_, idx) => idx !== i));
    if (selectedClass === i) setSelectedClass(null);
  };

  return (
    <StepLayout
      title="Sinflar"
      subtitle="Sinflarni kiriting. 'Nusxa olish' tugmasi orqali bir xil tuzilmadagi sinflarni tez yarating."
      icon={<GraduationCap className="w-6 h-6" />}
      onBack={onBack}
      onFinish={onFinish}
      canNext={classes.length > 0}
      isLast
      isSubmitting={isSubmitting}
    >
      {/* Yangi sinf */}
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <h3 className="text-sm font-semibold text-indigo-300">Yangi sinf</h3>
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="label-sm">Sinf *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="1-A" className="input-field w-full" />
          </div>
          <div>
            <label className="label-sm">Bosqich</label>
            <select value={grade} onChange={(e) => setGrade(+e.target.value)} className="input-field w-full">
              {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>{g}-sinf</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-sm">Filial</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="input-field w-full">
              {branches.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="label-sm">Smena</label>
            <select value={shift} onChange={(e) => setShift(e.target.value)} className="input-field w-full">
              {shifts.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Fan-soat-o'qituvchi */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label-sm">Fan taqsimoti</label>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {subjects.filter((sn) => !classSubjects.some((cs) => cs.subjectName === sn)).map((sn) => (
              <button key={sn} onClick={() => addSubjectRow(sn)}
                className="px-2.5 py-1 rounded-lg text-xs bg-white/10 text-slate-400 hover:bg-indigo-600/30 hover:text-indigo-300 transition-all">
                + {sn}
              </button>
            ))}
          </div>
          {classSubjects.length > 0 && (
            <div className="space-y-1.5">
              {classSubjects.map((cs, i) => (
                <div key={i} className="grid grid-cols-5 gap-2 items-center">
                  <span className="text-xs text-white col-span-2 truncate">{cs.subjectName}</span>
                  <select value={cs.teacherFullName} onChange={(e) => updateSubject(i, "teacherFullName", e.target.value)}
                    className="input-field col-span-2 text-xs">
                    <option value="">O'qituvchi...</option>
                    {filteredTeachers(cs.subjectName).map((t) => (
                      <option key={t.fullName} value={t.fullName}>{t.fullName}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-1">
                    <input type="number" min={1} max={10} value={cs.weeklyHours}
                      onChange={(e) => updateSubject(i, "weeklyHours", +e.target.value)}
                      className="input-field w-12 text-center text-xs" />
                    <button onClick={() => setClassSubjects(classSubjects.filter((_, idx) => idx !== i))}
                      className="text-slate-600 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button onClick={addClass} disabled={!name.trim()}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Sinf qo'shish
        </button>
      </div>

      {/* Sinflar ro'yxati */}
      {classes.length > 0 && (
        <div>
          <p className="text-sm text-slate-400 mb-2">{classes.length} ta sinf</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {classes.map((c, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 group">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-300 text-sm font-bold shrink-0">
                  {c.name}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white">{c.grade}-bosqich · {c.branchName} · {c.shiftName}</div>
                  <div className="text-xs text-slate-500">{c.subjects.length} ta fan · {c.subjects.reduce((s, cs) => s + cs.weeklyHours, 0)} soat/hafta</div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => duplicate(i)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-indigo-300 transition-colors" title="Nusxa olish">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </StepLayout>
  );
}
