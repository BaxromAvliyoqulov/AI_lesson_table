"use client";

import React, { useState, useEffect } from "react";
import { SchoolClass, Branch, Shift, Teacher, ClassBlockedPeriod } from "@/types";
import { normalizeClassName } from "@/lib/utils";
import { TeacherSelectCombobox } from "../shared/TeacherSelectCombobox";
import {
  X,
  GraduationCap,
  Building2,
  Clock,
  UserCheck,
  Calendar,
  CalendarOff,
  Users,
  Check,
  AlertCircle,
} from "lucide-react";

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classData: SchoolClass) => void;
  editingClass: SchoolClass | null;
  currentSchoolId: string;
  branches: Branch[];
  shifts: Shift[];
  teachers: Teacher[];
}

const DAYS = [
  { id: 1, name: "Dushanba", short: "Dush" },
  { id: 2, name: "Seshanba", short: "Sesh" },
  { id: 3, name: "Chorshanba", short: "Chor" },
  { id: 4, name: "Payshanba", short: "Pay" },
  { id: 5, name: "Juma", short: "Jum" },
  { id: 6, name: "Shanba", short: "Shan" },
];

const PERIOD_TIMES: Record<number, string> = {
  1: "08:00–08:45",
  2: "08:55–09:40",
  3: "09:50–10:35",
  4: "10:55–11:40",
  5: "11:50–12:35",
  6: "12:45–13:30",
  7: "13:40–14:25",
};

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingClass,
  currentSchoolId,
  branches,
  shifts,
  teachers,
}) => {
  const [name, setName] = useState("");
  const [grade, setGrade] = useState(1);
  const [branchId, setBranchId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [isPrimary, setIsPrimary] = useState(true);
  const [studentCount, setStudentCount] = useState(25);
  const [homeroomTeacherId, setHomeroomTeacherId] = useState("");
  const [isClosed, setIsClosed] = useState(false);

  // Band kunlar (masalan: [6] => Shanba dam kuni)
  const [blockedDays, setBlockedDays] = useState<number[]>([]);

  // Band soatlar (aniq kun va soat)
  const [blockedPeriods, setBlockedPeriods] = useState<ClassBlockedPeriod[]>([]);

  const lastInitializedIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      lastInitializedIdRef.current = null;
      return;
    }

    const currentClassId = editingClass ? editingClass.id : "__NEW_CLASS__";
    if (lastInitializedIdRef.current !== currentClassId) {
      lastInitializedIdRef.current = currentClassId;

      if (editingClass) {
        setName(editingClass.name);
        setGrade(editingClass.grade);
        setBranchId(editingClass.branchId);
        setShiftId(editingClass.shiftId);
        setIsPrimary(editingClass.isPrimary);
        setStudentCount(editingClass.studentCount || 25);
        setHomeroomTeacherId(editingClass.homeroomTeacherId || "");
        setIsClosed(editingClass.isClosed || false);
        setBlockedDays(
          editingClass.blockedDays || (editingClass.grade <= 4 ? [6] : [])
        );
        setBlockedPeriods(editingClass.blockedPeriods || []);
      } else {
        setName("");
        setGrade(1);
        setBranchId(branches[0]?.id || "");
        setShiftId(shifts[0]?.id || "");
        setIsPrimary(true);
        setStudentCount(25);
        setHomeroomTeacherId("");
        setIsClosed(false);
        setBlockedDays([6]); // 1-sinf uchun Shanba standart dam kuni
        setBlockedPeriods([]);
      }
    }
  }, [isOpen, editingClass?.id, editingClass, branches, shifts]);

  if (!isOpen) return null;

  // Kunni bosganda band qilish / yechish
  const toggleDayBlocked = (dayId: number) => {
    setBlockedDays((prev) =>
      prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
    );
  };

  // Soatni bosganda band qilish / yechish
  const togglePeriodBlocked = (dayOfWeek: number, periodNumber: number) => {
    // Agar butun kun band bo'lsa, alohida katak o'zgarmaydi
    if (blockedDays.includes(dayOfWeek)) return;

    setBlockedPeriods((prev) => {
      const exists = prev.some(
        (p) => p.dayOfWeek === dayOfWeek && p.periodNumber === periodNumber
      );
      if (exists) {
        return prev.filter(
          (p) => !(p.dayOfWeek === dayOfWeek && p.periodNumber === periodNumber)
        );
      } else {
        return [...prev, { dayOfWeek, periodNumber }];
      }
    });
  };

  const isPeriodBlocked = (dayOfWeek: number, periodNumber: number) => {
    if (blockedDays.includes(dayOfWeek)) return true;
    return blockedPeriods.some(
      (p) => p.dayOfWeek === dayOfWeek && p.periodNumber === periodNumber
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedName = normalizeClassName(name);
    if (!formattedName) return;

    const classData: SchoolClass = {
      id: editingClass ? editingClass.id : `c_${currentSchoolId}_${Date.now()}`,
      schoolId: currentSchoolId,
      branchId: branchId || branches[0]?.id || "",
      shiftId: shiftId || shifts[0]?.id || "",
      name: formattedName,
      grade: Number(grade),
      isPrimary: Number(grade) <= 4 || isPrimary,
      isClosed,
      studentCount: Number(studentCount) || 25,
      homeroomTeacherId: homeroomTeacherId || null,
      blockedDays,
      blockedPeriods,
      subjects: editingClass ? editingClass.subjects : [],
    };

    onSave(classData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-inner">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">
                {editingClass ? `${editingClass.name} sinfini tahrirlash` : "Yangi sinf qo'shish"}
              </h3>
              <p className="text-xs text-muted-foreground">
                Sinf parametrlari, dam kunlari va dars cheklovlari
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

        {/* Modal Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* 1. Asosiy parametrlar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Sinf nomi *
              </label>
              <input
                type="text"
                required
                placeholder="Masalan: 5-A, 10-B"
                value={name}
                onChange={(e) => {
                  setName(e.target.value.toUpperCase());
                  const parsedGrade = parseInt(e.target.value);
                  if (!isNaN(parsedGrade) && parsedGrade >= 1 && parsedGrade <= 11) {
                    setGrade(parsedGrade);
                    setIsPrimary(parsedGrade <= 4);
                    if (parsedGrade <= 4 && !blockedDays.includes(6)) {
                      setBlockedDays([6]);
                    }
                  }
                }}
                onBlur={() => {
                  if (name.trim()) {
                    setName(normalizeClassName(name));
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-bold uppercase tracking-wider"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Format: <span className="font-semibold text-primary">1-A, 5-B, 10-A</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Sinf bosqichi (1-11)
              </label>
              <select
                value={grade}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setGrade(val);
                  setIsPrimary(val <= 4);
                  if (val <= 4 && !blockedDays.includes(6)) {
                    setBlockedDays([6]);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold cursor-pointer"
              >
                {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>
                    {g}-sinf {g <= 4 ? "(Boshlang'ich - 5 kun)" : "(Yuqori - 6 kun)"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                O'quvchilar soni
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* 2. Bino, Smena va Sinf rahbari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                O'quv binosi (Filial)
              </label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} {b.isMain ? "(Asosiy)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Smena
              </label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Sinf rahbari
            </label>
            <TeacherSelectCombobox
              value={homeroomTeacherId}
              onChange={setHomeroomTeacherId}
              teachers={teachers}
              placeholder="Sinf rahbarini tanlang..."
            />
          </div>

          {/* 3. Band kunlar (Dam kunlari) */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <CalendarOff className="w-4 h-4 text-amber-500" />
                  Band kunlar (bu sinfga dars qo'yilmaydi)
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Kunni bosib band qiling — o'sha kuni bu sinfga umuman dars qo'yilmaydi (masalan boshlang'ich sinflar uchun Shanba dam kuni).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {DAYS.map((day) => {
                const isBlocked = blockedDays.includes(day.id);
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => toggleDayBlocked(day.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isBlocked
                        ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-500/30"
                        : "bg-background border border-border text-foreground hover:border-primary/40 hover:bg-muted/50"
                    }`}
                  >
                    <span>{day.name}</span>
                    {isBlocked && <X className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Band soatlar (Aniq kun va soat jadvali) */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/70 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Band soatlar (aniq kun va soat)
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Katakni bosib band qiling — o'sha kun-soatga dars qo'yilmaydi (tarbiyaviy soat yoki sinf tadbiri uchun).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBlockedPeriods([])}
                className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
              >
                Soatlarni tozalash
              </button>
            </div>

            {/* Matritsa jadvali */}
            <div className="overflow-x-auto rounded-xl border border-border/80 bg-card">
              <table className="w-full text-xs text-center border-collapse">
                <thead>
                  <tr className="bg-primary text-primary-foreground font-semibold">
                    <th className="py-2 px-2 border-r border-primary-foreground/20 w-16">Soat</th>
                    {DAYS.map((day) => (
                      <th key={day.id} className="py-2 px-2 border-r last:border-r-0 border-primary-foreground/20">
                        {day.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {Array.from({ length: 6 }, (_, i) => i + 1).map((periodNum) => (
                    <tr key={periodNum} className="hover:bg-muted/20">
                      <td className="py-2 px-1 font-bold border-r border-border/60 bg-muted/30">
                        <div>{periodNum}</div>
                        <div className="text-[9px] text-muted-foreground font-normal">
                          {PERIOD_TIMES[periodNum]?.split("–")[0] || ""}
                        </div>
                      </td>
                      {DAYS.map((day) => {
                        const isDayBlocked = blockedDays.includes(day.id);
                        const isBlocked = isPeriodBlocked(day.id, periodNum);

                        return (
                          <td
                            key={day.id}
                            onClick={() => !isDayBlocked && togglePeriodBlocked(day.id, periodNum)}
                            className={`py-2 px-2 border-r last:border-r-0 border-border/60 transition-colors font-medium select-none ${
                              isDayBlocked
                                ? "bg-muted/50 text-muted-foreground cursor-not-allowed text-[11px]"
                                : isBlocked
                                ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer font-bold"
                                : "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 cursor-pointer"
                            }`}
                          >
                            {isDayBlocked ? (
                              <span className="opacity-70">dam</span>
                            ) : isBlocked ? (
                              <span className="flex items-center justify-center gap-1">
                                band <X className="w-3 h-3" />
                              </span>
                            ) : (
                              "bo'sh"
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

          {/* 5. Vaqtincha yopish */}
          <div className="pt-1 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={isClosed}
                onChange={(e) => setIsClosed(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary w-4 h-4"
              />
              <span>Sinfni vaqtincha nofaol qilish (Dars jadvaliga kiritilmaydi)</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Yopish
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
