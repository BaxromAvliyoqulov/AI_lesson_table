"use client";

import React, { useState, useEffect, useMemo } from "react";
import { BellPeriod, Shift } from "@/types";
import { Clock, Plus, Trash2, Save, Sparkles, RefreshCw, CheckCircle2, Sun, Moon } from "lucide-react";

interface BellsTabProps {
  shifts?: Shift[];
  bellPeriods: BellPeriod[];
  onSaveBells: (bells: BellPeriod[], shiftId?: string) => void;
}

const DEFAULT_LESSON_DURATION = 45; // Standart dars davomiyligi 45 daqiqa

export const DEFAULT_SHIFT_1_BELLS: BellPeriod[] = [
  { periodNumber: 1, startTime: "08:00", endTime: "08:45", breakDurationMinutes: 5 },
  { periodNumber: 2, startTime: "08:50", endTime: "09:35", breakDurationMinutes: 5 },
  { periodNumber: 3, startTime: "09:40", endTime: "10:25", breakDurationMinutes: 10 },
  { periodNumber: 4, startTime: "10:35", endTime: "11:20", breakDurationMinutes: 5 },
  { periodNumber: 5, startTime: "11:25", endTime: "12:10", breakDurationMinutes: 5 },
  { periodNumber: 6, startTime: "12:15", endTime: "13:00", breakDurationMinutes: 5 },
  { periodNumber: 7, startTime: "13:05", endTime: "13:50", breakDurationMinutes: 5 },
];

export const DEFAULT_SHIFT_2_BELLS: BellPeriod[] = [
  { periodNumber: 1, startTime: "13:00", endTime: "13:45", breakDurationMinutes: 5 },
  { periodNumber: 2, startTime: "13:50", endTime: "14:35", breakDurationMinutes: 10 },
  { periodNumber: 3, startTime: "14:45", endTime: "15:30", breakDurationMinutes: 5 },
  { periodNumber: 4, startTime: "15:35", endTime: "16:20", breakDurationMinutes: 5 },
  { periodNumber: 5, startTime: "16:25", endTime: "17:10", breakDurationMinutes: 5 },
  { periodNumber: 6, startTime: "17:15", endTime: "18:00", breakDurationMinutes: 5 },
  { periodNumber: 7, startTime: "18:05", endTime: "18:50", breakDurationMinutes: 5 },
];

function timeToMins(t: string): number {
  if (!t || !t.includes(":")) return 8 * 60;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minsToTime(m: number): string {
  const norm = ((m % 1440) + 1440) % 1440;
  const hours = Math.floor(norm / 60);
  const mins = norm % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Berilgan index'dan boshlab keyingi barcha darslarning boshlanish va tugash vaqtlarini
 * zanjirsimon (cascade) tarzda avtomatik qayta hisoblash dvigateli.
 */
function recalculateCascade(
  periodsList: BellPeriod[],
  fromIndex: number = 0,
  defaultStart: string = "08:00"
): BellPeriod[] {
  const next = periodsList.map((p, i) => ({ ...p, periodNumber: i + 1 }));
  if (next.length === 0) return next;

  for (let i = Math.max(0, fromIndex); i < next.length; i++) {
    if (i === 0) {
      const startM = timeToMins(next[0].startTime || defaultStart);
      next[0].startTime = minsToTime(startM);
      next[0].endTime = minsToTime(startM + DEFAULT_LESSON_DURATION);
    } else {
      const prev = next[i - 1];
      const prevEndM = timeToMins(prev.endTime);
      const breakM = Number(prev.breakDurationMinutes) || 5;

      const currentStartM = prevEndM + breakM;
      const currentEndM = currentStartM + DEFAULT_LESSON_DURATION;

      next[i].startTime = minsToTime(currentStartM);
      next[i].endTime = minsToTime(currentEndM);
    }
  }

  return next;
}

export const BellsTab: React.FC<BellsTabProps> = ({
  shifts = [],
  bellPeriods,
  onSaveBells,
}) => {
  // Smenalarni tartiblash: 1-smena va 2-smena
  const resolvedShifts = useMemo(() => {
    if (shifts && shifts.length > 0) {
      return [...shifts].sort((a, b) => (a.order ?? 1) - (b.order ?? 1));
    }
    return [
      { id: "shift_1", schoolId: "", name: "1-Smena (Ertalabki)", startTime: "08:00", endTime: "13:00", periodsCount: 6, order: 1 },
      { id: "shift_2", schoolId: "", name: "2-Smena (Abetdan keyin)", startTime: "13:00", endTime: "18:00", periodsCount: 6, order: 2 },
    ];
  }, [shifts]);

  const [activeShiftIndex, setActiveShiftIndex] = useState(0);
  const activeShift = resolvedShifts[activeShiftIndex] || resolvedShifts[0];
  const isSecondShift = activeShiftIndex === 1 || activeShift?.order === 2 || activeShift?.name.toLowerCase().includes("2") || activeShift?.startTime.startsWith("13");
  const defaultStartTime = isSecondShift ? "13:00" : "08:00";

  // Har bir smena uchun alohida periods state
  const [shiftBellsMap, setShiftBellsMap] = useState<Record<string, BellPeriod[]>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Dastlabki yuklanishda smenalarning mavjud bellPeriodslarini tayyorlash
  useEffect(() => {
    const map: Record<string, BellPeriod[]> = {};
    resolvedShifts.forEach((s, idx) => {
      const isShift2 = idx === 1 || s.order === 2 || s.name.toLowerCase().includes("2") || s.startTime.startsWith("13");
      const defaultTpl = isShift2 ? DEFAULT_SHIFT_2_BELLS : DEFAULT_SHIFT_1_BELLS;
      const defStart = isShift2 ? "13:00" : "08:00";

      if (s.bellPeriods && Array.isArray(s.bellPeriods) && s.bellPeriods.length > 0) {
        map[s.id] = recalculateCascade(s.bellPeriods, 1, defStart);
      } else if (!isShift2 && bellPeriods && bellPeriods.length > 0) {
        map[s.id] = recalculateCascade(bellPeriods, 1, "08:00");
      } else {
        map[s.id] = defaultTpl;
      }
    });
    setShiftBellsMap(map);
    setHasChanges(false);
  }, [resolvedShifts, bellPeriods]);

  const currentPeriods = shiftBellsMap[activeShift?.id] || (isSecondShift ? DEFAULT_SHIFT_2_BELLS : DEFAULT_SHIFT_1_BELLS);

  // Har qanday tanaffus yoki boshlanish vaqti o'zgarganda KEYINGI BARCHA VAQTLARNI DINAMIK SURISH
  const handleUpdate = (index: number, key: keyof BellPeriod, val: any) => {
    const updatedList = currentPeriods.map((p, i) => (i === index ? { ...p, [key]: val } : { ...p }));

    let result = updatedList;
    if (key === "breakDurationMinutes") {
      result = recalculateCascade(updatedList, index + 1, defaultStartTime);
    } else if (key === "startTime") {
      const startM = timeToMins(val);
      updatedList[index].startTime = minsToTime(startM);
      updatedList[index].endTime = minsToTime(startM + DEFAULT_LESSON_DURATION);
      result = recalculateCascade(updatedList, index + 1, defaultStartTime);
    } else if (key === "endTime") {
      result = recalculateCascade(updatedList, index + 1, defaultStartTime);
    }

    setShiftBellsMap((prev) => ({
      ...prev,
      [activeShift.id]: result,
    }));
    setHasChanges(true);
  };

  const handleAddPeriod = () => {
    const nextNum = currentPeriods.length + 1;
    const last = currentPeriods[currentPeriods.length - 1];
    let start = isSecondShift ? "18:15" : "14:05";
    let end = isSecondShift ? "19:00" : "14:50";

    if (last) {
      const lastEndM = timeToMins(last.endTime);
      const breakM = Number(last.breakDurationMinutes) || 5;
      const newStartM = lastEndM + breakM;
      const newEndM = newStartM + DEFAULT_LESSON_DURATION;

      start = minsToTime(newStartM);
      end = minsToTime(newEndM);
    }

    const nextList = [
      ...currentPeriods,
      {
        periodNumber: nextNum,
        startTime: start,
        endTime: end,
        breakDurationMinutes: 5,
      },
    ];

    setShiftBellsMap((prev) => ({
      ...prev,
      [activeShift.id]: nextList,
    }));
    setHasChanges(true);
  };

  const handleRemovePeriod = (index: number) => {
    const filtered = currentPeriods.filter((_, i) => i !== index);
    const recalculated = recalculateCascade(filtered, Math.max(0, index - 1), defaultStartTime);
    setShiftBellsMap((prev) => ({
      ...prev,
      [activeShift.id]: recalculated,
    }));
    setHasChanges(true);
  };

  // 1-bosishda butun jadvalni qayta tekislash
  const handleRecalculateAll = () => {
    const recalculated = recalculateCascade(currentPeriods, 0, defaultStartTime);
    setShiftBellsMap((prev) => ({
      ...prev,
      [activeShift.id]: recalculated,
    }));
    setHasChanges(true);
  };

  const handleApplyPreset = (presetList: BellPeriod[]) => {
    setShiftBellsMap((prev) => ({
      ...prev,
      [activeShift.id]: presetList,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSaveBells(currentPeriods, activeShift.id);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      {/* Shift Switcher Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground text-sm">
              Qo&apos;ng&apos;iroqlar jadvali (Smenalar bo&apos;yicha dars vaqtlari)
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Dinamik vaqt zanjiri yoqilgan
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            1-smena va 2-smena dars, tanaffus va katta tanaffus vaqtlarini alohida boshqaring
          </p>
        </div>

        {/* Smena Tabs Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-2xl border border-border/80">
          {resolvedShifts.map((s, idx) => {
            const isSelected = activeShiftIndex === idx;
            const isShift2 = idx === 1 || s.order === 2 || s.name.toLowerCase().includes("2") || s.startTime.startsWith("13");
            return (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => {
                  setActiveShiftIndex(idx);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? isShift2
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                {isShift2 ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <span>{s.name || `${idx + 1}-Smena`}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isSelected ? "bg-black/15 font-extrabold" : "bg-muted text-muted-foreground"
                }`}>
                  {isShift2 ? "13:00 dan" : "08:00 dan"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-extrabold flex items-center gap-1.5 ${
            isSecondShift
              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
              : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
          }`}>
            {isSecondShift ? "🌤️ 2-Smena (Abetdan keyin / 13:00–18:00)" : "☀️ 1-Smena (Ertalabki / 08:00–13:00)"}
          </span>
          <span className="text-xs text-muted-foreground">
            {currentPeriods.length} ta dars soati belgilangan
          </span>

          {/* Quick Presets for 2nd shift */}
          {isSecondShift && (
            <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleApplyPreset(DEFAULT_SHIFT_2_BELLS)}
                className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                title="13:00 dan boshlanadi, 2-darsdan keyin 10 min katta tanaffus"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>⚡ 2-darsdan keyin 10 min tanaffus</span>
              </button>
              <span className="text-amber-400 text-xs">•</span>
              <button
                type="button"
                onClick={() => {
                  const p: BellPeriod[] = [
                    { periodNumber: 1, startTime: "13:00", endTime: "13:45", breakDurationMinutes: 5 },
                    { periodNumber: 2, startTime: "13:50", endTime: "14:35", breakDurationMinutes: 5 },
                    { periodNumber: 3, startTime: "14:40", endTime: "15:25", breakDurationMinutes: 10 },
                    { periodNumber: 4, startTime: "15:35", endTime: "16:20", breakDurationMinutes: 5 },
                    { periodNumber: 5, startTime: "16:25", endTime: "17:10", breakDurationMinutes: 5 },
                    { periodNumber: 6, startTime: "17:15", endTime: "18:00", breakDurationMinutes: 5 },
                    { periodNumber: 7, startTime: "18:05", endTime: "18:50", breakDurationMinutes: 5 },
                  ];
                  handleApplyPreset(p);
                }}
                className="px-2 py-0.5 rounded-lg text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 transition-all cursor-pointer flex items-center gap-1"
                title="13:00 dan boshlanadi, 3-darsdan keyin 10 min katta tanaffus"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>⚡ 3-darsdan keyin 10 min tanaffus</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRecalculateAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="1-darsdan boshlab barcha dars vaqtlarini tekislash"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Vaqtlarni yangilash ({defaultStartTime})</span>
          </button>

          <button
            type="button"
            onClick={handleAddPeriod}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>Soat qo&apos;shish</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hasChanges
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 ring-2 ring-primary/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{hasChanges ? "Saqlash" : "Saqlangan"}</span>
          </button>
        </div>
      </div>

      {/* Periods Table */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs font-semibold">
                <th className="p-3 text-left w-24">Dars №</th>
                <th className="p-3 text-left">Boshlanish vaqti</th>
                <th className="p-3 text-left">Tugash vaqti</th>
                <th className="p-3 text-left">Dars davomiyligi</th>
                <th className="p-3 text-left">Keyingi tanaffus</th>
                <th className="p-3 text-right w-16">Amal</th>
              </tr>
            </thead>
            <tbody>
              {currentPeriods.map((period, index) => {
                const startM = timeToMins(period.startTime);
                const endM = timeToMins(period.endTime);
                const duration = endM > startM ? endM - startM : DEFAULT_LESSON_DURATION;
                const isBigBreak = Number(period.breakDurationMinutes) >= 10;

                return (
                  <tr
                    key={`${activeShift.id}_${index}`}
                    className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                  >
                    <td className="p-3 font-bold text-sm text-foreground">
                      <div className="flex items-center gap-2">
                        <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                          isSecondShift ? "bg-amber-500/15 text-amber-700 dark:text-amber-300" : "bg-primary/10 text-primary"
                        }`}>
                          {period.periodNumber}
                        </span>
                        <span className="text-xs font-semibold">{period.periodNumber}-soat</span>
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={period.startTime}
                          onChange={(e) => handleUpdate(index, "startTime", e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-bold"
                        />
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="time"
                          value={period.endTime}
                          onChange={(e) => handleUpdate(index, "endTime", e.target.value)}
                          className="px-3 py-1.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-bold"
                        />
                      </div>
                    </td>

                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted/50 text-foreground border border-border/50">
                        {duration} daqiqa
                      </span>
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={period.breakDurationMinutes}
                          onChange={(e) =>
                            handleUpdate(index, "breakDurationMinutes", Number(e.target.value))
                          }
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isBigBreak
                              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-900 dark:text-amber-300 ring-1 ring-amber-500/30"
                              : "border-border bg-background text-foreground"
                          }`}
                        >
                          <option value={5}>5 daqiqa</option>
                          <option value={10}>10 daqiqa (Katta tanaffus)</option>
                          <option value={15}>15 daqiqa (Katta tanaffus)</option>
                          <option value={20}>20 daqiqa (Ovqatlanish)</option>
                          <option value={25}>25 daqiqa (Katta tanaffus)</option>
                          <option value={30}>30 daqiqa (Katta tanaffus)</option>
                        </select>
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleRemovePeriod(index)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
