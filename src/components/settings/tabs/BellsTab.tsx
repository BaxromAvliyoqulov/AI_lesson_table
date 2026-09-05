"use client";

import React, { useState } from "react";
import { BellPeriod } from "@/types";
import { Clock, Plus, Trash2, Save, Sparkles, RefreshCw, CheckCircle2 } from "lucide-react";

interface BellsTabProps {
  bellPeriods: BellPeriod[];
  onSaveBells: (bells: BellPeriod[]) => void;
}

const DEFAULT_LESSON_DURATION = 45; // Standart dars davomiyligi 45 daqiqa

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
function recalculateCascade(periodsList: BellPeriod[], fromIndex: number = 0): BellPeriod[] {
  const next = periodsList.map((p, i) => ({ ...p, periodNumber: i + 1 }));
  if (next.length === 0) return next;

  for (let i = Math.max(0, fromIndex); i < next.length; i++) {
    if (i === 0) {
      const startM = timeToMins(next[0].startTime || "08:00");
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
  bellPeriods,
  onSaveBells,
}) => {
  const [periods, setPeriods] = useState<BellPeriod[]>(() => {
    // Agar darslar orasida nomutanosiblik bo'lsa, yuklanishda ham bir tekislab olamiz
    if (bellPeriods && bellPeriods.length > 0) {
      return recalculateCascade(bellPeriods, 1);
    }
    return bellPeriods;
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Har qanday tanaffus yoki boshlanish vaqti o'zgarganda KEYINGI BARCHA VAQTLARNI DINAMIK SURISH
  const handleUpdate = (index: number, key: keyof BellPeriod, val: any) => {
    setPeriods((prev) => {
      const updated = prev.map((p, i) => (i === index ? { ...p, [key]: val } : { ...p }));

      if (key === "breakDurationMinutes") {
        // Tanaffus o'zgardi -> index + 1 dan boshlab barcha keyingi darslar dinamik suriladi!
        return recalculateCascade(updated, index + 1);
      }

      if (key === "startTime") {
        // Boshlanish vaqti o'zgardi -> index dan boshlab dars tugashi va keyingi darslar suriladi
        const startM = timeToMins(val);
        updated[index].startTime = minsToTime(startM);
        updated[index].endTime = minsToTime(startM + DEFAULT_LESSON_DURATION);
        return recalculateCascade(updated, index + 1);
      }

      if (key === "endTime") {
        // Tugash vaqti o'zgardi -> index + 1 dan boshlab keyingi darslar suriladi
        return recalculateCascade(updated, index + 1);
      }

      return updated;
    });
    setHasChanges(true);
  };

  const handleAddPeriod = () => {
    const nextNum = periods.length + 1;
    const last = periods[periods.length - 1];
    let start = "14:05";
    let end = "14:50";

    if (last) {
      const lastEndM = timeToMins(last.endTime);
      const breakM = Number(last.breakDurationMinutes) || 5;
      const newStartM = lastEndM + breakM;
      const newEndM = newStartM + DEFAULT_LESSON_DURATION;

      start = minsToTime(newStartM);
      end = minsToTime(newEndM);
    }

    const nextList = [
      ...periods,
      {
        periodNumber: nextNum,
        startTime: start,
        endTime: end,
        breakDurationMinutes: 5,
      },
    ];

    setPeriods(nextList);
    setHasChanges(true);
  };

  const handleRemovePeriod = (index: number) => {
    const filtered = periods.filter((_, i) => i !== index);
    const recalculated = recalculateCascade(filtered, Math.max(0, index - 1));
    setPeriods(recalculated);
    setHasChanges(true);
  };

  // 1-bosishda butun jadvalni qayta tekislash (08:00 dan boshlab)
  const handleRecalculateAll = () => {
    setPeriods((prev) => recalculateCascade(prev, 0));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSaveBells(periods);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-3xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground text-sm">
              Qo&apos;ng&apos;iroqlar jadvali (Dars va tanaffus vaqtlari)
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Dinamik vaqt zanjiri yoqilgan
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Keyingi tanaffus (yoki dars vaqti) o&apos;zgartirilsa, keyingi darslarning vaqti avtomatik dinamik suriladi
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleRecalculateAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-colors cursor-pointer"
            title="Barcha darslarni 1-darsdan boshlab qayta hisoblash"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
            <span>Vaqtlarni yangilash</span>
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
                <th className="p-3 text-left w-20">Dars №</th>
                <th className="p-3 text-left">Boshlanish vaqti</th>
                <th className="p-3 text-left">Tugash vaqti</th>
                <th className="p-3 text-left">Dars davomiyligi</th>
                <th className="p-3 text-left">Keyingi tanaffus</th>
                <th className="p-3 text-right w-16">Amal</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period, index) => {
                const startM = timeToMins(period.startTime);
                const endM = timeToMins(period.endTime);
                const duration = endM > startM ? endM - startM : DEFAULT_LESSON_DURATION;
                const isBigBreak = Number(period.breakDurationMinutes) >= 10;

                return (
                  <tr
                    key={index}
                    className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                  >
                    <td className="p-3 font-bold text-sm text-foreground">
                      <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs">
                        {period.periodNumber}
                      </span>
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

