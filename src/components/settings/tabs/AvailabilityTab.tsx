"use client";

import React, { useState, useEffect } from "react";
import { Teacher, TeacherAvailability } from "@/types";
import { TeacherSelectCombobox } from "../shared/TeacherSelectCombobox";
import {
  Calendar,
  Check,
  X,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Zap,
  RotateCcw,
} from "lucide-react";

interface AvailabilityTabProps {
  teachers: Teacher[];
  onSaveAvailability: (teacherId: string, availabilities: TeacherAvailability[]) => void;
}

const DAYS = [
  { id: 1, name: "Dushanba" },
  { id: 2, name: "Seshanba" },
  { id: 3, name: "Chorshanba" },
  { id: 4, name: "Payshanba" },
  { id: 5, name: "Juma" },
  { id: 6, name: "Shanba" },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

export const AvailabilityTab: React.FC<AvailabilityTabProps> = ({
  teachers,
  onSaveAvailability,
}) => {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id || ""
  );
  const [availabilities, setAvailabilities] = useState<TeacherAvailability[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  useEffect(() => {
    if (selectedTeacher) {
      setAvailabilities(selectedTeacher.availabilities || []);
      setHasUnsavedChanges(false);
    }
  }, [selectedTeacherId, selectedTeacher]);

  const isCellAvailable = (day: number, period: number): boolean => {
    // If it's teacher's method day, automatically unavailable
    if (selectedTeacher?.methodDayOfWeek === day) return false;

    const av = availabilities.find((a) => a.dayOfWeek === day && a.period === period);
    return av ? av.isAvailable : true; // Default true
  };

  const toggleCell = (day: number, period: number) => {
    if (selectedTeacher?.methodDayOfWeek === day) return; // Cannot toggle on method day

    const current = isCellAvailable(day, period);
    const existingIndex = availabilities.findIndex(
      (a) => a.dayOfWeek === day && a.period === period
    );

    let updated: TeacherAvailability[];
    if (existingIndex >= 0) {
      updated = availabilities.map((a, i) =>
        i === existingIndex ? { ...a, isAvailable: !current } : a
      );
    } else {
      updated = [
        ...availabilities,
        {
          teacherId: selectedTeacherId,
          dayOfWeek: day,
          period,
          isAvailable: !current,
        },
      ];
    }

    setAvailabilities(updated);
    setHasUnsavedChanges(true);
  };

  const handleSetAll = (available: boolean) => {
    const updated: TeacherAvailability[] = [];
    DAYS.forEach((d) => {
      if (selectedTeacher?.methodDayOfWeek !== d.id) {
        PERIODS.forEach((p) => {
          updated.push({
            teacherId: selectedTeacherId,
            dayOfWeek: d.id,
            period: p,
            isAvailable: available,
          });
        });
      }
    });
    setAvailabilities(updated);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!selectedTeacherId) return;
    onSaveAvailability(selectedTeacherId, availabilities);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl bg-card border border-border">
        <div className="w-full sm:w-80">
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
            O'qituvchini tanlang
          </label>
          <TeacherSelectCombobox
            value={selectedTeacherId}
            onChange={setSelectedTeacherId}
            teachers={teachers}
            placeholder="O'qituvchini tanlang..."
          />
        </div>

        {selectedTeacher && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleSetAll(true)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Barchasini bo'sh qilish
            </button>
            <button
              type="button"
              onClick={() => handleSetAll(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Barchasini band qilish
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {hasUnsavedChanges ? "O'zgarishlarni saqlash" : "Saqlangan"}
            </button>
          </div>
        )}
      </div>

      {/* Availability Matrix */}
      {selectedTeacher ? (
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/80">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>{selectedTeacher.fullName}</span>
                {selectedTeacher.methodDayOfWeek && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-600 border border-amber-500/20">
                    Metod kuni: {DAYS[selectedTeacher.methodDayOfWeek - 1]?.name}
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Katakchalarni bosish orqali dars qo'yish mumkin (yashil) yoki mumkin emas (qizil) holatini belgilang
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/20 border border-emerald-500 flex items-center justify-center text-emerald-600 text-[10px] font-bold">
                  ✓
                </span>
                <span className="text-muted-foreground">Bo'sh (Dars qo'yiladi)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-md bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-600 text-[10px] font-bold">
                  ✕
                </span>
                <span className="text-muted-foreground">Band (Dars qo'yilmasin)</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2.5 text-xs font-bold text-muted-foreground text-left w-20 border-b border-border">
                    Dars
                  </th>
                  {DAYS.map((d) => {
                    const isMethodDay = selectedTeacher.methodDayOfWeek === d.id;
                    return (
                      <th
                        key={d.id}
                        className={`p-2.5 text-xs font-bold text-center border-b border-border ${
                          isMethodDay ? "bg-amber-500/10 text-amber-600 font-extrabold" : "text-foreground"
                        }`}
                      >
                        <div>{d.name}</div>
                        {isMethodDay && <div className="text-[10px] font-medium text-amber-500">Metod kuni</div>}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period) => (
                  <tr key={period} className="border-b border-border/40 hover:bg-muted/10">
                    <td className="p-2.5 text-xs font-bold text-muted-foreground">
                      {period}-soat
                    </td>
                    {DAYS.map((day) => {
                      const isMethodDay = selectedTeacher.methodDayOfWeek === day.id;
                      const available = isCellAvailable(day.id, period);

                      return (
                        <td key={day.id} className="p-1.5 text-center">
                          {isMethodDay ? (
                            <div className="py-2.5 px-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-semibold cursor-not-allowed">
                              Bloklangan
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleCell(day.id, period)}
                              className={`w-full py-2.5 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                available
                                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25"
                                  : "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400 hover:bg-rose-500/25"
                              }`}
                            >
                              {available ? "Bo'sh" : "Band"}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">O'qituvchi tanlanmagan</p>
          <p className="text-xs text-muted-foreground mt-1">
            Yuqoridagi ro'yxatdan o'qituvchini tanlang
          </p>
        </div>
      )}
    </div>
  );
};
