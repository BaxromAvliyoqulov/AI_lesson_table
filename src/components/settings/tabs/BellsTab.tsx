"use client";

import React, { useState } from "react";
import { BellPeriod } from "@/types";
import { Clock, Plus, Trash2, CheckCircle2, Save, Sparkles } from "lucide-react";

interface BellsTabProps {
  bellPeriods: BellPeriod[];
  onSaveBells: (bells: BellPeriod[]) => void;
}

export const BellsTab: React.FC<BellsTabProps> = ({
  bellPeriods,
  onSaveBells,
}) => {
  const [periods, setPeriods] = useState<BellPeriod[]>(bellPeriods);
  const [hasChanges, setHasChanges] = useState(false);

  const handleUpdate = (index: number, key: keyof BellPeriod, val: any) => {
    setPeriods((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [key]: val } : p))
    );
    setHasChanges(true);
  };

  const handleAddPeriod = () => {
    const nextNum = periods.length + 1;
    const last = periods[periods.length - 1];
    let start = "14:05";
    let end = "14:50";

    if (last) {
      const [lastEndH, lastEndM] = last.endTime.split(":").map(Number);
      const newStartTotal = lastEndH * 60 + lastEndM + (last.breakDurationMinutes || 5);
      const newStartH = Math.floor(newStartTotal / 60);
      const newStartM = newStartTotal % 60;
      const newEndTotal = newStartTotal + 45;
      const newEndH = Math.floor(newEndTotal / 60);
      const newEndM = newEndTotal % 60;

      start = `${String(newStartH).padStart(2, "0")}:${String(newStartM).padStart(2, "0")}`;
      end = `${String(newEndH).padStart(2, "0")}:${String(newEndM).padStart(2, "0")}`;
    }

    setPeriods((prev) => [
      ...prev,
      {
        periodNumber: nextNum,
        startTime: start,
        endTime: end,
        breakDurationMinutes: 5,
      },
    ]);
    setHasChanges(true);
  };

  const handleRemovePeriod = (index: number) => {
    setPeriods((prev) =>
      prev
        .filter((_, i) => i !== index)
        .map((p, i) => ({ ...p, periodNumber: i + 1 }))
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    onSaveBells(periods);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-4 rounded-3xl bg-card border border-border">
        <div>
          <h3 className="font-bold text-foreground text-sm">
            Qo'ng'iroqlar jadvali (Dars va tanaffus vaqtlari)
          </h3>
          <p className="text-xs text-muted-foreground">
            Har bir darsning boshlanish, tugash va tanaffus davomiyligi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAddPeriod}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Soat qo'shish</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              hasChanges
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
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
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs">
                <th className="p-3 text-left w-24">Dars №</th>
                <th className="p-3 text-left">Boshlanish vaqti</th>
                <th className="p-3 text-left">Tugash vaqti</th>
                <th className="p-3 text-left">Dars davomiyligi</th>
                <th className="p-3 text-left">Keyingi tanaffus</th>
                <th className="p-3 text-right w-16">Amal</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((period, index) => (
                <tr
                  key={index}
                  className="border-b border-border/40 hover:bg-muted/10 transition-colors"
                >
                  <td className="p-3 font-bold text-sm text-foreground">
                    <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs">
                      {period.periodNumber}
                    </span>
                  </td>

                  <td className="p-3">
                    <input
                      type="time"
                      value={period.startTime}
                      onChange={(e) => handleUpdate(index, "startTime", e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold"
                    />
                  </td>

                  <td className="p-3">
                    <input
                      type="time"
                      value={period.endTime}
                      onChange={(e) => handleUpdate(index, "endTime", e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-semibold"
                    />
                  </td>

                  <td className="p-3 text-xs text-muted-foreground font-medium">
                    45 daqiqa
                  </td>

                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={period.breakDurationMinutes}
                        onChange={(e) =>
                          handleUpdate(index, "breakDurationMinutes", Number(e.target.value))
                        }
                        className="px-2.5 py-1.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-xs font-medium cursor-pointer"
                      >
                        <option value={5}>5 daqiqa</option>
                        <option value={10}>10 daqiqa</option>
                        <option value={15}>15 daqiqa (Katta tanaffus)</option>
                        <option value={20}>20 daqiqa (Ovqatlanish)</option>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
