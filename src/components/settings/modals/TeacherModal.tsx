"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Teacher, Subject, Branch, Shift, SchoolClass } from "@/types";
import { formatUzPhone, sanitizeFullName } from "@/lib/utils";
import { getOfficialMethodDayForSubject } from "@/lib/constants/method-days";
import { ClassSelectCombobox } from "../shared/ClassSelectCombobox";
import {
  X,
  Users,
  BookOpen,
  Building2,
  Calendar,
  Phone,
  Clock,
  Sun,
  Sunset,
  GraduationCap,
  Sparkles,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacherData: Teacher) => void;
  editingTeacher: Teacher | null;
  currentSchoolId: string;
  subjects: Subject[];
  branches: Branch[];
  shifts?: Shift[];
  classes?: SchoolClass[];
  allTeachers?: Teacher[];
}

const WEEKDAYS = [
  { id: 1, name: "Dushanba" },
  { id: 2, name: "Seshanba" },
  { id: 3, name: "Chorshanba" },
  { id: 4, name: "Payshanba" },
  { id: 5, name: "Juma" },
  { id: 6, name: "Shanba" },
];

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTeacher,
  currentSchoolId,
  subjects,
  branches,
  shifts = [],
  classes = [],
  allTeachers = [],
}) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [weeklyCapacity, setWeeklyCapacity] = useState(20);
  const [maxConsecutive, setMaxConsecutive] = useState(4);
  const [methodDay, setMethodDay] = useState<number | "">("");
  const [isManualMethodDayOverride, setIsManualMethodDayOverride] = useState<boolean>(false);
  const [homeroomClassId, setHomeroomClassId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [teachingStages, setTeachingStages] = useState<"PRIMARY" | "HIGH" | "BOTH">("BOTH");
  const [isManualTeachingStagesOverride, setIsManualTeachingStagesOverride] = useState<boolean>(false);
  const [travelPolicy, setTravelPolicy] = useState<"BY_SHIFT" | "BY_DAY" | "ALTERNATING_DAYS" | "FLEXIBLE_BUFFER">("BY_SHIFT");
  const lastInitializedIdRef = useRef<string | null>(null);

  // Tanlangan fan(lar) bo'yicha rasmiy metod kunini avtomatik aniqlash
  const autoDetectedMethodDay = useMemo(() => {
    for (const sid of selectedSubjects) {
      const sub = subjects.find((s) => s.id === sid);
      if (sub) {
        const day = sub.methodDayOfWeek ?? getOfficialMethodDayForSubject(sub.name || sub.id);
        if (day && day >= 1 && day <= 6) {
          return {
            day,
            dayName: WEEKDAYS.find((w) => w.id === day)?.name || "",
            subjectName: sub.name,
          };
        }
      }
    }
    return null;
  }, [selectedSubjects, subjects]);

  // Fan tanlanganda, agar foydalanuvchi qo'lda boshqa kunga override qilmagan bo'lsa, avtomatik moslash
  useEffect(() => {
    if (!isManualMethodDayOverride && autoDetectedMethodDay) {
      setMethodDay(autoDetectedMethodDay.day);
    }
  }, [autoDetectedMethodDay, isManualMethodDayOverride]);

  // Fanlar yoki sinf rahbari o'zgarganda Toifani (Boshlang'ich/Katta/Hammasi) AVTOMATIK aniqlash
  useEffect(() => {
    if (!isManualTeachingStagesOverride) {
      // 1. Agar sinf rahbarligi bo'lsa:
      if (homeroomClassId) {
        const cls = classes.find((c) => c.id === homeroomClassId);
        if (cls) {
          if ((cls.grade && cls.grade <= 4) || cls.isPrimary) {
            setTeachingStages("PRIMARY");
            return;
          } else if (cls.grade && cls.grade >= 5) {
            setTeachingStages("HIGH");
            return;
          }
        }
      }

      if (selectedSubjects.length === 0) {
        setTeachingStages("BOTH");
        return;
      }

      const selectedSubs = selectedSubjects
        .map((id) => subjects.find((s) => s.id === id))
        .filter(Boolean) as Subject[];

      const highOnlyKeywords = [
        "algebra", "geometriya", "fizika", "kimyo", "biologiya",
        "geografiya", "tarix", "jahon tarixi", "o'zb. tarixi",
        "huquq", "davlat va huquq", "iqtisod", "astronomiya",
        "adabiyot", "chqbt", "chaqiruv"
      ];

      const primaryOnlyKeywords = [
        "o'qish", "o'qish savodxonligi", "alifbe", "yozuv"
      ];

      let hasHighOnly = false;
      let hasPrimaryOnly = false;

      for (const s of selectedSubs) {
        const name = (s.name || "").toLowerCase();
        if (highOnlyKeywords.some((k) => name.includes(k))) {
          hasHighOnly = true;
        }
        if (primaryOnlyKeywords.some((k) => name.includes(k))) {
          hasPrimaryOnly = true;
        }
      }

      if (hasPrimaryOnly && !hasHighOnly) {
        setTeachingStages("PRIMARY");
        return;
      }
      if (hasHighOnly && !hasPrimaryOnly) {
        setTeachingStages("HIGH");
        return;
      }

      const subNames = selectedSubs.map((s) => (s.name || "").toLowerCase());
      const hasOnaTili = subNames.some((n) => n.includes("ona tili"));
      const hasMatematika = subNames.some((n) => n.includes("matematika"));

      if (hasOnaTili && hasMatematika && !hasHighOnly) {
        setTeachingStages("PRIMARY");
        return;
      }

      setTeachingStages("BOTH");
    }
  }, [selectedSubjects, homeroomClassId, subjects, classes, isManualTeachingStagesOverride]);

  useEffect(() => {
    if (!isOpen) {
      lastInitializedIdRef.current = null;
      return;
    }

    const currentTeacherId = editingTeacher ? editingTeacher.id : "__NEW_TEACHER__";
    if (lastInitializedIdRef.current !== currentTeacherId) {
      lastInitializedIdRef.current = currentTeacherId;

      if (editingTeacher) {
        setFullName(editingTeacher.fullName);
        setPhone(editingTeacher.phone || "");
        setWeeklyCapacity(editingTeacher.weeklyHourCapacity);
        setMaxConsecutive(editingTeacher.maxConsecutiveHours);
        setMethodDay(editingTeacher.methodDayOfWeek || "");
        setIsManualMethodDayOverride(editingTeacher.methodDayOfWeek !== undefined && editingTeacher.methodDayOfWeek !== null);
        setHomeroomClassId(editingTeacher.homeroomClassId || "");
        setSelectedSubjects(editingTeacher.subjectIds || []);
        setSelectedBranches(
          editingTeacher.branchIds && editingTeacher.branchIds.length > 0
            ? editingTeacher.branchIds
            : branches.map((b) => b.id)
        );
        setSelectedShifts(
          editingTeacher.shiftIds && editingTeacher.shiftIds.length > 0
            ? editingTeacher.shiftIds
            : shifts.map((s) => s.id)
        );
        if (editingTeacher.teachingStages) {
          setTeachingStages(editingTeacher.teachingStages);
          setIsManualTeachingStagesOverride(true);
        } else {
          setIsManualTeachingStagesOverride(false);
        }
        setTravelPolicy(editingTeacher.travelPolicy || "BY_SHIFT");
      } else {
        setFullName("");
        setPhone("");
        setWeeklyCapacity(20);
        setMaxConsecutive(4);
        setMethodDay("");
        setIsManualMethodDayOverride(false);
        setHomeroomClassId("");
        setSelectedSubjects([]);
        setSelectedBranches(branches.map((b) => b.id));
        setSelectedShifts(shifts.map((s) => s.id));
        setTeachingStages("BOTH");
        setIsManualTeachingStagesOverride(false);
        setTravelPolicy("BY_SHIFT");
      }
    }
  }, [isOpen, editingTeacher?.id, editingTeacher, branches, shifts]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const teacherData: Teacher = {
      id: editingTeacher ? editingTeacher.id : `t_${currentSchoolId}_${Date.now()}`,
      schoolId: currentSchoolId,
      displayNumber: editingTeacher?.displayNumber,
      fullName: sanitizeFullName(fullName.trim()),
      phone: phone.trim() || null,
      weeklyHourCapacity: Number(weeklyCapacity),
      maxConsecutiveHours: Number(maxConsecutive),
      methodDayOfWeek: methodDay === "" ? null : Number(methodDay),
      subjectIds: selectedSubjects,
      branchIds: selectedBranches.length > 0 ? selectedBranches : branches.map((b) => b.id),
      shiftIds: selectedShifts.length > 0 ? selectedShifts : shifts.map((s) => s.id),
      teachingStages,
      travelPolicy,
      availabilities: editingTeacher?.availabilities || [],
      homeroomClassId: homeroomClassId.trim() || null,
    };

    onSave(teacherData);
    onClose();
  };

  const toggleSubject = (subId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const toggleBranch = (branchId: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.length > 1
          ? prev.filter((id) => id !== branchId)
          : prev
        : [...prev, branchId]
    );
  };

  const toggleShift = (shiftId: string) => {
    setSelectedShifts((prev) =>
      prev.includes(shiftId)
        ? prev.length > 1
          ? prev.filter((id) => id !== shiftId)
          : prev
        : [...prev, shiftId]
    );
  };

  const hasMultipleBranches = selectedBranches.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {editingTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                O&apos;qituvchi profili, sinf rahbarligi, binolari va fanlarini sozlang
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

        {/* ── FORM CONTENT ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* F.I.Sh va Telefon */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                F.I.SH (To&apos;liq ism) *
              </label>
              <input
                type="text"
                required
                placeholder="Masalan: Karimova Dilnoza"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Telefon raqami
              </label>
              <input
                type="text"
                placeholder="+998 (90) 123-45-67"
                value={phone}
                onChange={(e) => setPhone(formatUzPhone(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
              />
            </div>
          </div>

          {/* ── SINF RAHBARLIGI (Biriktirilgan sinf) ────────────────────────── */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/80 dark:border-indigo-800/50">
            <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Sinf rahbari (Biriktirilgan sinf)
              </span>
              {homeroomClassId && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white shadow-xs">
                  Sinf rahbari
                </span>
              )}
            </label>
            <ClassSelectCombobox
              value={homeroomClassId}
              onChange={setHomeroomClassId}
              classes={classes}
              teachers={allTeachers.length > 0 ? allTeachers : (editingTeacher ? [editingTeacher] : [])}
              placeholder="Sinf rahbari bo'lgan sinfni tanlang..."
            />
            <p className="text-[11px] text-indigo-900/80 dark:text-indigo-300/80 mt-1.5 leading-relaxed">
              💡 Sinf rahbarligi biriktirilsa, ushbu sinfga Dushanba 1-soatdagi <strong>Kelajak soati</strong> fani va rasmiy jadval imzolari avtomatik biriktiriladi.
            </p>
          </div>

          {/* Stavka, Ketma-ket dars va Metod kuni */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Haftalik stavka (soat)
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={weeklyCapacity}
                onChange={(e) => setWeeklyCapacity(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1" title="Bir kunda o'qituvchiga qo'yiladigan maksimal dars soati">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  Kuniga maks dars
                </label>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setMaxConsecutive((prev) => Math.max(2, prev - 1))}
                  className="w-8 h-9 rounded-xl border border-border bg-muted/40 hover:bg-muted flex items-center justify-center font-bold text-xs cursor-pointer select-none transition-colors"
                  title="1 soat kamaytirish"
                >
                  -
                </button>
                <input
                  type="number"
                  min={2}
                  max={8}
                  value={maxConsecutive}
                  onChange={(e) => setMaxConsecutive(Math.max(2, Math.min(8, Number(e.target.value))))}
                  className="w-full px-2 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-black text-center"
                />
                <button
                  type="button"
                  onClick={() => setMaxConsecutive((prev) => Math.min(8, prev + 1))}
                  className="w-8 h-9 rounded-xl border border-border bg-muted/40 hover:bg-muted flex items-center justify-center font-bold text-xs cursor-pointer select-none transition-colors"
                  title="1 soat oshirish"
                >
                  +
                </button>
              </div>
              <span className="text-[10px] text-muted-foreground block mt-1">
                1 kunda ko'pi bilan (soat)
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Metod kuni
                </label>
                {autoDetectedMethodDay && !isManualMethodDayOverride && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> Fandan avto
                  </span>
                )}
                {isManualMethodDayOverride && autoDetectedMethodDay && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualMethodDayOverride(false);
                      setMethodDay(autoDetectedMethodDay.day);
                    }}
                    title="Fanning rasmiy metod kuniga qaytarish"
                    className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-0.5 cursor-pointer font-medium"
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> Fandan avto
                  </button>
                )}
              </div>
              <select
                value={methodDay}
                onChange={(e) => {
                  setIsManualMethodDayOverride(true);
                  setMethodDay(e.target.value === "" ? "" : Number(e.target.value));
                }}
                className={`w-full px-3 py-2 rounded-xl border text-sm cursor-pointer transition-all ${
                  !isManualMethodDayOverride && autoDetectedMethodDay
                    ? "border-emerald-500/60 bg-emerald-50/20 text-foreground font-semibold ring-1 ring-emerald-500/20"
                    : "border-border bg-background text-foreground"
                }`}
              >
                <option value="">Metod kuni yo&apos;q</option>
                {WEEKDAYS.map((w) => {
                  const isMatchOfficial = autoDetectedMethodDay?.day === w.id;
                  return (
                    <option key={w.id} value={w.id}>
                      {w.name} {isMatchOfficial ? `⚡ (${autoDetectedMethodDay?.subjectName} fani)` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Mantiqiy ogohlantirish (Kunlik dars soati stavkaga nisbatan yetarli bo'lishi kerak) */}
          {weeklyCapacity > 0 && maxConsecutive * 5 < weeklyCapacity && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                💡 Haftalik <strong>{weeklyCapacity} soat</strong> stavka sig&apos;ishi uchun kuniga kamida <strong>{Math.ceil(weeklyCapacity / 5)} soat</strong> dars belgilanishi tavsiya etiladi (5 kunlik o&apos;quv haftasida).
              </span>
            </div>
          )}

          {/* ── 1. BINOLAR TANLOVI (FILIALLAR) ─────────────────────────────── */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Dars o&apos;tadigan binolari (Filiallar)
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {selectedBranches.length} ta bino tanlandi
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {branches.map((b) => {
                const isSelected = selectedBranches.includes(b.id);
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggleBranch(b.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-600/30"
                        : "bg-card border-border hover:border-slate-300 text-muted-foreground"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] ${
                        isSelected ? "bg-blue-600 text-white" : "border border-slate-300 bg-white dark:bg-slate-800"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span>{b.name}</span>
                  </button>
                );
              })}

              {branches.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSelectedBranches(branches.map((b) => b.id))}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
                >
                  🌐 Ikkala binoda ham
                </button>
              )}
            </div>
          </div>

          {/* ── 2. SMENALAR TANLOVI (1-smena, 2-smena) ───────────────────────── */}
          <div>
            <label className="block text-xs font-bold text-foreground mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Dars o&apos;tadigan smenalari
              </span>
              <span className="text-[11px] text-muted-foreground font-normal">
                {selectedShifts.length === (shifts.length || 2) ? "Barcha smenalarda" : "Tanlangan smenalarda"}
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedShifts(shifts.length > 0 ? [shifts[0].id] : ["s39_1"])}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedShifts.length === 1 && selectedShifts[0] === (shifts[0]?.id || "s39_1")
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-600 text-amber-900 dark:text-amber-300 shadow-sm ring-1 ring-amber-600/30"
                    : "bg-card border-border hover:border-slate-300 text-muted-foreground"
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>☀️ 1-Smena (Ertalabki)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedShifts(shifts.length > 1 ? [shifts[1].id] : ["s39_2"])
                }
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedShifts.length === 1 &&
                  selectedShifts[0] === (shifts[1]?.id || "s39_2")
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-600 text-indigo-900 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-600/30"
                    : "bg-card border-border hover:border-slate-300 text-muted-foreground"
                }`}
              >
                <Sunset className="w-4 h-4 text-indigo-500" />
                <span>🌤️ 2-Smena (Tushdan keyin)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedShifts(shifts.length > 0 ? shifts.map((s) => s.id) : ["s39_1", "s39_2"])
                }
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  selectedShifts.length > 1 || (shifts.length === 0 && selectedShifts.length === 2)
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-600/30"
                    : "bg-card border-border hover:border-slate-300 text-muted-foreground"
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>🔄 Har ikkala smenada ham</span>
              </button>
            </div>
          </div>

          {/* ── 3. SINFLAR TOIFASI (BOSQICHLAR) ─────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                <span>Dars beradigan sinflari (Toifasi)</span>
              </label>
              {!isManualTeachingStagesOverride && (
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                  ⚡ Avtomatik aniqlangan
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTeachingStages("PRIMARY");
                  setIsManualTeachingStagesOverride(true);
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  teachingStages === "PRIMARY"
                    ? "bg-teal-50 dark:bg-teal-950/40 border-teal-600 text-teal-900 dark:text-teal-300 shadow-sm ring-1 ring-teal-600/30"
                    : "bg-card border-border hover:border-slate-300 text-muted-foreground"
                }`}
              >
                <span>🧒 Boshlang&apos;ich (1-4)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTeachingStages("HIGH");
                  setIsManualTeachingStagesOverride(true);
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  teachingStages === "HIGH"
                    ? "bg-purple-50 dark:bg-purple-950/40 border-purple-600 text-purple-900 dark:text-purple-300 shadow-sm ring-1 ring-purple-600/30"
                    : "bg-card border-border hover:border-slate-300 text-muted-foreground"
                }`}
              >
                <span>🧑‍🎓 Katta (5-11)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTeachingStages("BOTH");
                  setIsManualTeachingStagesOverride(true);
                }}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  teachingStages === "BOTH"
                    ? "bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-900 dark:text-blue-300 shadow-sm ring-1 ring-blue-600/30"
                    : "bg-card border-border hover:border-slate-300 text-muted-foreground"
                }`}
              >
                <span>🌟 Hammasi (1-11)</span>
              </button>
            </div>
          </div>

          {/* ── 4. BINO VA SMENA LOGISTIKASI (Agar 2 ta binoda dars bersa) ───── */}
          {hasMultipleBranches && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-2 flex items-center gap-1.5">
                <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
                Filial va Asosiy Bino o&apos;rtasida harakatlanish qoidasi:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setTravelPolicy("BY_SHIFT")}
                  className={`p-2.5 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                    travelPolicy === "BY_SHIFT"
                      ? "bg-card border-amber-600 text-foreground font-bold shadow-sm ring-1 ring-amber-600/40"
                      : "bg-card/50 border-amber-200/80 dark:border-amber-800/50 text-muted-foreground hover:bg-card"
                  }`}
                >
                  <div className="font-extrabold flex items-center gap-1">
                    <span>🏢➡️🏫 Smenalar bo&apos;yicha</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    1-smena Asosiyda, 2-smena Filialda
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTravelPolicy("BY_DAY")}
                  className={`p-2.5 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                    travelPolicy === "BY_DAY"
                      ? "bg-card border-amber-600 text-foreground font-bold shadow-sm ring-1 ring-amber-600/40"
                      : "bg-card/50 border-amber-200/80 dark:border-amber-800/50 text-muted-foreground hover:bg-card"
                  }`}
                >
                  <div className="font-extrabold flex items-center gap-1">
                    <span>📅 Kunlar bo&apos;yicha</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    Kunlik bloklar (Dush/Chor Asosiy...)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTravelPolicy("ALTERNATING_DAYS")}
                  className={`p-2.5 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                    travelPolicy === "ALTERNATING_DAYS"
                      ? "bg-card border-amber-600 text-foreground font-bold shadow-sm ring-1 ring-amber-600/40"
                      : "bg-card/50 border-amber-200/80 dark:border-amber-800/50 text-muted-foreground hover:bg-card"
                  }`}
                >
                  <div className="font-extrabold flex items-center gap-1">
                    <span>🔄 1 kun Asosiy, 1 kun Filial</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    Kunma-kun navbatlashuv (1 kun/1 kun)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTravelPolicy("FLEXIBLE_BUFFER")}
                  className={`p-2.5 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                    travelPolicy === "FLEXIBLE_BUFFER"
                      ? "bg-card border-amber-600 text-foreground font-bold shadow-sm ring-1 ring-amber-600/40"
                      : "bg-card/50 border-amber-200/80 dark:border-amber-800/50 text-muted-foreground hover:bg-card"
                  }`}
                >
                  <div className="font-extrabold flex items-center gap-1">
                    <span>⏳ Yo&apos;l darchasi bilan</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    AI o&apos;rtada 1 soat oraliq qoldiradi
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── 5. FANLAR TANLOVI ───────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-foreground flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Dars beradigan fanlari</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  ({selectedSubjects.length} ta tanlandi)
                </span>
              </label>

              {teachingStages === "PRIMARY" && (
                <button
                  type="button"
                  onClick={() => {
                    const primarySubIds = subjects
                      .filter((s) => {
                        const l = s.name.toLowerCase();
                        return (
                          l.includes("ona tili") ||
                          l.includes("o'qish") ||
                          l.includes("matematika") ||
                          l.includes("tarbiya") ||
                          l.includes("tabiiy")
                        );
                      })
                      .map((s) => s.id);
                    setSelectedSubjects((prev) => Array.from(new Set([...prev, ...primarySubIds])));
                  }}
                  className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 px-2 py-1 rounded-lg border border-teal-200 dark:border-teal-800 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-teal-600" />
                  Boshlang&apos;ich paketini tanlash
                </button>
              )}
            </div>

            {/* Scroll olib tashlangan, toza ochiq grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl border border-border bg-muted/10">
              {subjects
                .filter((s) => {
                  if (s.isActive === false && !selectedSubjects.includes(s.id)) return false;
                  const l = s.name.toLowerCase();
                  const isHighOnly =
                    l.includes("fizika") ||
                    l.includes("kimyo") ||
                    l.includes("biologiya") ||
                    l.includes("geografiya") ||
                    l.includes("algebra") ||
                    l.includes("geometriya") ||
                    l.includes("tarix") ||
                    l.includes("huquq") ||
                    l.includes("chqbt") ||
                    l.includes("astronomiya") ||
                    l.includes("chizmachilik") ||
                    l.includes("iqtisod") ||
                    l.includes("tadbirkor");

                  if (teachingStages === "PRIMARY") {
                    // Agar tanlangan bo'lsa doim ko'rinsin, aks holda faqat boshlang'ich fanlar
                    return selectedSubjects.includes(s.id) || !isHighOnly;
                  }
                  if (teachingStages === "HIGH") {
                    // Katta sinflar uchun o'qish savodxonligi kabi xos boshlang'ich fanlar yashiriladi
                    const isPrimaryOnly = l.includes("o'qish savodxonligi") || l.includes("savodxonlik");
                    return selectedSubjects.includes(s.id) || !isPrimaryOnly;
                  }
                  return true;
                })
                .map((s) => {
                  const isSelected = selectedSubjects.includes(s.id);
                  const isInactive = s.isActive === false;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs ring-1 ring-primary/20"
                          : isInactive
                          ? "bg-muted/40 border-border opacity-60 text-muted-foreground"
                          : "bg-card border-border hover:border-slate-300 dark:hover:border-slate-700 text-foreground hover:bg-muted/30"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.colorTag }}
                      />
                      <span className="truncate">
                        {s.name} {isInactive ? "(Nofaol)" : ""}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* ── FOOTER ACTIONS ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              {editingTeacher ? "O'zgarishlarni Saqlash" : "O'qituvchini Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
