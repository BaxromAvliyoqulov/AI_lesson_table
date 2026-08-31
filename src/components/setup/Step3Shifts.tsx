"use client";

import React, { useState } from "react";
import type { SetupData } from "@/app/setup/page";
import { StepLayout } from "./StepLayout";
import { Clock, Plus, Trash2, RefreshCw } from "lucide-react";

type Props = { data: SetupData; updateData: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void; onNext: () => void; onBack: () => void };
type BellPeriod = { period: number; start: string; end: string; breakMin: number };
type Shift = SetupData["shifts"][0];

const DEFAULT_BELL: BellPeriod[] = [
  { period: 1, start: "08:00", end: "08:45", breakMin: 5 },
  { period: 2, start: "08:50", end: "09:35", breakMin: 5 },
  { period: 3, start: "09:40", end: "10:25", breakMin: 10 },
  { period: 4, start: "10:35", end: "11:20", breakMin: 5 },
  { period: 5, start: "11:25", end: "12:10", breakMin: 5 },
  { period: 6, start: "12:15", end: "13:00", breakMin: 0 },
];

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function recalcBells(bells: BellPeriod[], lessonMin = 45): BellPeriod[] {
  return bells.map((b, i) => {
    const start = i === 0 ? b.start : addMinutes(bells[i - 1].end, bells[i - 1].breakMin);
    const end = addMinutes(start, lessonMin);
    return { ...b, start, end };
  });
}

const blankShift = (): Shift => ({ name: "", startTime: "08:00", endTime: "13:00", periodsCount: 6, bellPeriods: DEFAULT_BELL });

export function Step3Shifts({ data, updateData, onNext, onBack }: Props) {
  const shifts = data.shifts;
  const [form, setForm] = useState<Shift>(blankShift());
  const [editing, setEditing] = useState<number | null>(null);

  const set = (s: Shift[]) => updateData("shifts", s);
  const setF = (field: keyof Shift, val: any) => setForm((p) => ({ ...p, [field]: val }));

  const updateBell = (i: number, field: keyof BellPeriod, val: any) => {
    const bells = [...(form.bellPeriods as BellPeriod[])];
    bells[i] = { ...bells[i], [field]: val };
    setF("bellPeriods", bells);
  };

  const recalc = () => setF("bellPeriods", recalcBells(form.bellPeriods as BellPeriod[]));

  const addPeriod = () => {
    const bells = form.bellPeriods as BellPeriod[];
    const last = bells[bells.length - 1];
    setF("bellPeriods", [...bells, { period: bells.length + 1, start: addMinutes(last.end, last.breakMin), end: addMinutes(addMinutes(last.end, last.breakMin), 45), breakMin: 0 }]);
    setF("periodsCount", bells.length + 1);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editing !== null) { const arr = [...shifts]; arr[editing] = form; set(arr); setEditing(null); }
    else set([...shifts, form]);
    setForm(blankShift());
  };

  return (
    <StepLayout
      title="Smenalar va qo'ng'iroqlar"
      subtitle="Maktabingizning smena jadvalini kiriting. Period vaqtlari avtomatik qayta hisoblanadi."
      icon={<Clock className="w-6 h-6" />}
      onNext={onNext}
      onBack={onBack}
      canNext={shifts.length > 0}
    >
      <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="label-sm">Smena nomi *</label>
            <input value={form.name} onChange={(e) => setF("name", e.target.value)}
              placeholder="1-smena" className="input-field w-full" />
          </div>
          <div>
            <label className="label-sm">Boshlanish</label>
            <input type="time" value={form.startTime}
              onChange={(e) => { setF("startTime", e.target.value); setF("bellPeriods", recalcBells([{ ...(form.bellPeriods as BellPeriod[])[0], start: e.target.value }, ...(form.bellPeriods as BellPeriod[]).slice(1)])); }}
              className="input-field w-full" />
          </div>
          <div>
            <label className="label-sm">Tugash</label>
            <input type="time" value={form.endTime} onChange={(e) => setF("endTime", e.target.value)}
              className="input-field w-full" />
          </div>
        </div>

        {/* Bell jadvali */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label-sm">Qo'ng'iroq jadvali</label>
            <div className="flex gap-2">
              <button onClick={recalc} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Qayta hisoblash
              </button>
              <button onClick={addPeriod} className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1">
                <Plus className="w-3 h-3" /> Period qo'shish
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {(form.bellPeriods as BellPeriod[]).map((b, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-center">
                <span className="text-xs text-slate-500 text-center">{b.period}-dars</span>
                <input type="time" value={b.start} onChange={(e) => updateBell(i, "start", e.target.value)} className="input-field col-span-1 text-sm" />
                <input type="time" value={b.end} onChange={(e) => updateBell(i, "end", e.target.value)} className="input-field col-span-1 text-sm" />
                <div className="flex items-center gap-1">
                  <input type="number" min={0} max={30} value={b.breakMin} onChange={(e) => updateBell(i, "breakMin", +e.target.value)}
                    className="input-field w-14 text-sm text-center" />
                  <span className="text-xs text-slate-600">daq</span>
                </div>
                {i > 0 && (
                  <button onClick={() => { const bells = (form.bellPeriods as BellPeriod[]).filter((_, idx) => idx !== i).map((b2, idx2) => ({ ...b2, period: idx2 + 1 })); setF("bellPeriods", bells); setF("periodsCount", bells.length); }}
                    className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                )}
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} disabled={!form.name.trim()}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />{editing !== null ? "Yangilash" : "Smena qo'shish"}
        </button>
      </div>

      {shifts.length > 0 && (
        <div className="space-y-2">
          {shifts.map((s, i) => (
            <div key={i} onClick={() => { setEditing(i); setForm(s); }}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/8 cursor-pointer transition-all group">
              <Clock className="w-5 h-5 text-indigo-400 shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{s.name}</div>
                <div className="text-xs text-slate-500">{s.startTime} – {s.endTime} · {s.periodsCount} ta period</div>
              </div>
              <button onClick={(e) => { e.stopPropagation(); set(shifts.filter((_, idx) => idx !== i)); }}
                className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </StepLayout>
  );
}
