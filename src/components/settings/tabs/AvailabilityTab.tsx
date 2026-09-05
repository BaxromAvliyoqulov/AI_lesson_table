import React, { useState, useEffect, useMemo } from "react";
import { Teacher, TeacherAvailability } from "@/types";
import { TeacherSelectCombobox } from "../shared/TeacherSelectCombobox";
import { useSchoolStore } from "@/lib/store/useSchoolStore";
import { getEffectiveTeacherMethodDay } from "@/lib/constants/method-days";
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
  Star,
  Sun,
  Moon,
  Layers,
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

const SHIFT_1_PERIOD_LIST = [
  { period: 1, time: "08:00–08:45" },
  { period: 2, time: "08:50–09:35" },
  { period: 3, time: "09:40–10:25" },
  { period: 4, time: "10:35–11:20" },
  { period: 5, time: "11:25–12:10" },
  { period: 6, time: "12:15–13:00" },
  { period: 7, time: "13:05–13:50" },
];

const SHIFT_2_PERIOD_LIST = [
  { period: 1, time: "13:00–13:45" },
  { period: 2, time: "13:50–14:35" },
  { period: 3, time: "14:45–15:30" },
  { period: 4, time: "15:35–16:20" },
  { period: 5, time: "16:25–17:10" },
  { period: 6, time: "17:15–18:00" },
  { period: 7, time: "18:05–18:50" },
];

type ShiftViewMode = "SHIFT_1" | "SHIFT_2" | "BOTH";

export const AvailabilityTab: React.FC<AvailabilityTabProps> = ({
  teachers,
  onSaveAvailability,
}) => {
  const { setTeacherMethodDay, subjects = [], shifts = [] } = useSchoolStore();
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(
    teachers[0]?.id || ""
  );
  const [availabilities, setAvailabilities] = useState<TeacherAvailability[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeShiftTab, setActiveShiftTab] = useState<ShiftViewMode>("SHIFT_1");

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  useEffect(() => {
    if (selectedTeacher) {
      setAvailabilities(selectedTeacher.availabilities || []);
      setHasUnsavedChanges(false);
    }
  }, [selectedTeacherId, selectedTeacher]);

  // O'qituvchining shaxsiy yoki uning fani standarti bo'yicha haqiqiy metod kuni
  const methodDayInfo = useMemo(() => {
    if (!selectedTeacher) return { day: null, dayName: null, source: "NONE" as const };
    return getEffectiveTeacherMethodDay(selectedTeacher, subjects);
  }, [selectedTeacher, subjects]);

  const handleSelectMethodDay = (dayId: number | null) => {
    if (!selectedTeacherId) return;
    setTeacherMethodDay(selectedTeacherId, dayId);
  };

  /**
   * Smena bo'yicha katak bo'sh yoki bandligini tekshirish:
   * - 1-smena uchun: period (1..7)
   * - 2-smena uchun: 10 + period (11..17)
   */
  const isCellAvailable = (day: number, period: number, shift: "SHIFT_1" | "SHIFT_2"): boolean => {
    if (methodDayInfo.day === day) return false;

    const key = shift === "SHIFT_2" ? 10 + period : period;
    const av = availabilities.find((a) => a.dayOfWeek === day && a.period === key);
    return av ? av.isAvailable : true;
  };

  /**
   * Smena bo'yicha katakni bosib bo'sh/band holatini almashtirish
   */
  const toggleCell = (day: number, period: number, shift: "SHIFT_1" | "SHIFT_2") => {
    if (methodDayInfo.day === day) return; // Metod kunida o'zgarmaydi

    const key = shift === "SHIFT_2" ? 10 + period : period;
    const current = isCellAvailable(day, period, shift);
    const existingIndex = availabilities.findIndex(
      (a) => a.dayOfWeek === day && a.period === key
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
          period: key,
          isAvailable: !current,
        },
      ];
    }

    setAvailabilities(updated);
    setHasUnsavedChanges(true);
  };

  /**
   * Tanlangan smenani to'liq bo'sh yoki to'liq band qilish
   */
  const handleSetShiftAll = (shift: "SHIFT_1" | "SHIFT_2", available: boolean) => {
    if (!selectedTeacherId) return;

    const periodOffset = shift === "SHIFT_2" ? 10 : 0;
    const periodsToUpdate = Array.from({ length: 7 }, (_, i) => periodOffset + i + 1);

    // Boshqa smenadagi darslarni saqlab qolamiz
    const otherShiftAvails = availabilities.filter(
      (a) => !periodsToUpdate.includes(a.period)
    );

    const newShiftAvails: TeacherAvailability[] = [];
    DAYS.forEach((d) => {
      if (selectedTeacher?.methodDayOfWeek !== d.id) {
        periodsToUpdate.forEach((p) => {
          newShiftAvails.push({
            teacherId: selectedTeacherId,
            dayOfWeek: d.id,
            period: p,
            isAvailable: available,
          });
        });
      }
    });

    setAvailabilities([...otherShiftAvails, ...newShiftAvails]);
    setHasUnsavedChanges(true);
  };

  /**
   * Butun haftani (har ikkala smenani) to'liq bo'sh qilish
   */
  const handleResetAll = () => {
    setAvailabilities([]);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (!selectedTeacherId) return;
    onSaveAvailability(selectedTeacherId, availabilities);
    setHasUnsavedChanges(false);
  };

  // Smenalar bo'yicha band soatlar statistikasi
  const shiftStats = useMemo(() => {
    let s1Blocked = 0;
    let s2Blocked = 0;

    availabilities.forEach((a) => {
      if (a.isAvailable === false) {
        if (a.period >= 11 && a.period <= 17) {
          s2Blocked++;
        } else if (a.period >= 1 && a.period <= 7) {
          s1Blocked++;
        }
      }
    });

    return { s1Blocked, s2Blocked };
  }, [availabilities]);

  const renderShiftMatrix = (
    shift: "SHIFT_1" | "SHIFT_2",
    title: string,
    badgeText: string,
    periodList: Array<{ period: number; time: string }>,
    accentColor: "blue" | "amber"
  ) => {
    const isAmber = accentColor === "amber";

    return (
      <div className={`p-5 rounded-3xl bg-card border ${
        isAmber ? "border-amber-500/30 shadow-xs" : "border-border shadow-xs"
      } space-y-4`}>
        {/* Smena sarlavhasi va tezkor amallar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
              isAmber
                ? "bg-amber-500/20 text-amber-700 dark:text-amber-300"
                : "bg-blue-500/20 text-blue-700 dark:text-blue-300"
            }`}>
              {isAmber ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-foreground">{title}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  isAmber
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                    : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30"
                }`}>
                  {badgeText}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Katakchalarni bosish orqali ushbu smenada dars qo&apos;yish mumkin (yashil) yoki mumkin emas (qizil) holatini belgilang
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleSetShiftAll(shift, true)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
              title="Ushbu smenadagi barcha soatlarni bo'sh qilish"
            >
              Smenani bo&apos;sh qilish
            </button>
            <button
              type="button"
              onClick={() => handleSetShiftAll(shift, false)}
              className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-colors cursor-pointer"
              title={`Ushbu o'qituvchi ${isAmber ? "faqat ertalab" : "faqat abetdan keyin"} dars o'tadigan bo'lsa, shu smenani to'liq band qilib qo'yadi`}
            >
              Smenani to&apos;liq band qilish
            </button>
          </div>
        </div>

        {/* Matritsa jadvali */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-sm font-bold text-muted-foreground text-left w-36 border-b border-border">
                  Dars & Vaqt
                </th>
                {DAYS.map((d) => {
                  const isMethodDay = methodDayInfo.day === d.id;
                  return (
                    <th
                      key={d.id}
                      className={`p-3 text-sm font-bold text-center border-b border-border transition-colors ${
                        isMethodDay
                          ? "bg-amber-500/20 text-amber-800 dark:text-amber-200 font-black"
                          : "text-foreground"
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-black text-sm tracking-wide">{d.name}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {periodList.map(({ period, time }) => (
                <tr key={period} className="border-b border-border/40 hover:bg-muted/10">
                  <td className="p-2.5 text-sm font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        isAmber ? "bg-amber-500/20 text-amber-700 dark:text-amber-300" : "bg-primary/10 text-primary"
                      }`}>
                        {period}
                      </span>
                      <div>
                        <div className="text-sm font-bold leading-snug">{period}-soat</div>
                        <div className="text-xs text-muted-foreground font-semibold tracking-tight">
                          {time}
                        </div>
                      </div>
                    </div>
                  </td>
                  {DAYS.map((day) => {
                    const isMethodDay = methodDayInfo.day === day.id;
                    const available = isCellAvailable(day.id, period, shift);

                    return (
                      <td key={day.id} className="p-2 text-center">
                        {isMethodDay ? (
                          <div className="py-3 px-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-sm font-bold select-none cursor-not-allowed flex items-center justify-center gap-1.5 shadow-2xs">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                            <span>Metod kuni</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleCell(day.id, period, shift)}
                            className={`w-full py-3 px-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer shadow-2xs ${
                              available
                                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/25 font-extrabold"
                                : "bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-400 hover:bg-rose-500/25 font-extrabold"
                            }`}
                            title={`Bosib ${available ? "Band qilish (dars qo'yilmasin)" : "Bo'sh qilish (dars qo'yilishi mumkin)"}`}
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
    );
  };

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-3xl bg-card border border-border shadow-xs">
        <div className="w-full sm:w-[480px]">
          <label className="block text-sm font-bold text-foreground mb-1.5">
            O&apos;qituvchini tanlang
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
              onClick={handleResetAll}
              className="px-3 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
              title="Barcha smenalardagi bandliklarni tozalab, bo'sh qilish"
            >
              Barcha vaqtlarni bo&apos;sh qilish
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasUnsavedChanges}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                hasUnsavedChanges
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90 ring-2 ring-primary/20"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              {hasUnsavedChanges ? "O'zgarishlarni saqlash" : "Saqlangan"}
            </button>
          </div>
        )}
      </div>

      {/* Smena Switcher va Asosiy Panellar */}
      {selectedTeacher ? (
        <div className="space-y-4">
          {/* O'qituvchi nomi, metod kuni va smena tablari */}
          <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>{selectedTeacher.fullName}</span>
                {methodDayInfo.day && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>
                      Metod kuni: {methodDayInfo.dayName}
                      {methodDayInfo.source === "SUBJECT_OFFICIAL" && (
                        <span className="opacity-80 ml-1">({methodDayInfo.subjectName} standarti)</span>
                      )}
                    </span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ertalabki va abetdan keyingi smenalar uchun vaqtlarni alohida sozlang
              </p>
            </div>

            {/* Smena ko'rinish rejimi tablari */}
            <div className="flex items-center gap-2 p-1.5 bg-muted/60 rounded-2xl border border-border">
              <button
                type="button"
                onClick={() => setActiveShiftTab("SHIFT_1")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeShiftTab === "SHIFT_1"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Sun className="w-4 h-4" />
                <span>☀️ 1-Smena (Ertalab)</span>
                {shiftStats.s1Blocked > 0 && (
                  <span className="ml-1 text-xs px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold">
                    {shiftStats.s1Blocked} band
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveShiftTab("SHIFT_2")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeShiftTab === "SHIFT_2"
                    ? "bg-amber-500 text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Moon className="w-4 h-4" />
                <span>🌤️ 2-Smena (Abetdan keyin)</span>
                {shiftStats.s2Blocked > 0 && (
                  <span className="ml-1 text-xs px-2 py-0.5 rounded-md bg-rose-500 text-white font-extrabold">
                    {shiftStats.s2Blocked} band
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveShiftTab("BOTH")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                  activeShiftTab === "BOTH"
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Ikkala smena</span>
              </button>
            </div>
          </div>

          {/* ⭐ METOD KUNI TEZKOR TANLASH VA BOSHQARUV PANELI */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                  {methodDayInfo.day
                    ? `Haftalik Metod kuni: ${methodDayInfo.dayName} ${
                        methodDayInfo.source === "SUBJECT_OFFICIAL"
                          ? `(⚡ ${methodDayInfo.subjectName || "Fan"} rasmiy standarti)`
                          : "(Qo'lda biriktirilgan)"
                      }`
                    : "Metod kuni belgilanmagan"}
                </div>
                <div className="text-[11px] text-amber-700/80 dark:text-amber-400">
                  Metod kunida o&apos;qituvchiga dars qo&apos;yilmaydi va barcha soatlar avtomatik bloklanadi
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {DAYS.map((d) => {
                const isSelected = methodDayInfo.day === d.id;
                const isExplicit = selectedTeacher.methodDayOfWeek === d.id;
                return (
                  <button
                    key={`method_select_${d.id}`}
                    type="button"
                    onClick={() => handleSelectMethodDay(isExplicit ? null : d.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 font-extrabold shadow-sm scale-105"
                        : "bg-white/80 dark:bg-card hover:bg-white text-foreground/80 border border-border"
                    }`}
                    title={isSelected ? "Metod kunini bekor qilish" : `${d.name}ni metod kuni qilish`}
                  >
                    <span>{d.name.slice(0, 3)}</span>
                    {isSelected && <span className="ml-1 text-[10px]">⭐</span>}
                  </button>
                );
              })}

              {selectedTeacher.methodDayOfWeek && (
                <button
                  type="button"
                  onClick={() => handleSelectMethodDay(null)}
                  className="px-2 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100/60 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Qo'lda kiritilgan metod kunini bekor qilish (fan standartiga qaytarish)"
                >
                  ✕ Bekor qilish
                </button>
              )}
            </div>
          </div>

          {/* Matritsa render qilish */}
          {(activeShiftTab === "SHIFT_1" || activeShiftTab === "BOTH") &&
            renderShiftMatrix(
              "SHIFT_1",
              "☀️ 1-Smena (Ertalabki darslar)",
              "08:00 – 13:00",
              SHIFT_1_PERIOD_LIST,
              "blue"
            )}

          {(activeShiftTab === "SHIFT_2" || activeShiftTab === "BOTH") &&
            renderShiftMatrix(
              "SHIFT_2",
              "🌤️ 2-Smena (Abetdan keyingi darslar)",
              "13:00 – 18:00",
              SHIFT_2_PERIOD_LIST,
              "amber"
            )}
        </div>
      ) : (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">O&apos;qituvchi tanlanmagan</p>
          <p className="text-xs text-muted-foreground mt-1">
            Yuqoridagi ro&apos;yxatdan o&apos;qituvchini tanlang
          </p>
        </div>
      )}
    </div>
  );
};
