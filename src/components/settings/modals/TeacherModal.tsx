"use client";

import React, { useState, useEffect } from "react";
import { Teacher, Subject, Branch, Shift, SchoolClass } from "@/types";
import { formatUzPhone, sanitizeFullName } from "@/lib/utils";
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
  const [homeroomClassId, setHomeroomClassId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [teachingStages, setTeachingStages] = useState<"PRIMARY" | "HIGH" | "BOTH">("BOTH");
  const [travelPolicy, setTravelPolicy] = useState<"BY_SHIFT" | "BY_DAY" | "FLEXIBLE_BUFFER">("BY_SHIFT");
  const lastInitializedIdRef = React.useRef<string | null>(null);

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
        setTeachingStages(editingTeacher.teachingStages || "BOTH");
        setTravelPolicy(editingTeacher.travelPolicy || "BY_SHIFT");
      } else {
        setFullName("");
        setPhone("");
        setWeeklyCapacity(20);
        setMaxConsecutive(4);
        setMethodDay("");
        setHomeroomClassId("");
        setSelectedSubjects([]);
        setSelectedBranches(branches.map((b) => b.id));
        setSelectedShifts(shifts.map((s) => s.id));
        setTeachingStages("BOTH");
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
      <div className="bg-card border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
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
              💡 Sinf rahbarligi biriktirilsa, ushbu sinfning Juma kungi <strong>Sinf soati</strong> fani va rasmiy jadval imzolari avtomatik shu o'qituvchiga ulanadi.
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
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Ketma-ket dars (maks)
              </label>
              <input
                type="number"
                min={1}
                max={8}
                value={maxConsecutive}
                onChange={(e) => setMaxConsecutive(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Shaxsiy metod kuni
              </label>
              <select
                value={methodDay}
                onChange={(e) => setMethodDay(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm cursor-pointer"
              >
                <option value="">Metod kuni yo&apos;q</option>
                {WEEKDAYS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
            <label className="block text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
              Dars beradigan sinflari (Toifasi)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTeachingStages("PRIMARY")}
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
                onClick={() => setTeachingStages("HIGH")}
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
                onClick={() => setTeachingStages("BOTH")}
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTravelPolicy("BY_SHIFT")}
                  className={`p-2 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
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
                  className={`p-2 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                    travelPolicy === "BY_DAY"
                      ? "bg-card border-amber-600 text-foreground font-bold shadow-sm ring-1 ring-amber-600/40"
                      : "bg-card/50 border-amber-200/80 dark:border-amber-800/50 text-muted-foreground hover:bg-card"
                  }`}
                >
                  <div className="font-extrabold flex items-center gap-1">
                    <span>📅 Kunlar bo&apos;yicha</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    Dush/Chor Asosiy, Sesh/Pay Filial
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setTravelPolicy("FLEXIBLE_BUFFER")}
                  className={`p-2 rounded-xl text-left border text-[11px] transition-all cursor-pointer ${
                    travelPolicy === "FLEXIBLE_BUFFER"
                      ? "bg-card border-amber-600 text-foreground font-bold shadow-sm ring-1 ring-amber-600/40"
                      : "bg-card/50 border-amber-200/80 dark:border-amber-800/50 text-muted-foreground hover:bg-card"
                  }`}
                >
                  <div className="font-extrabold flex items-center gap-1">
                    <span>⏳ Yo&apos;l darchasi bilan</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-medium mt-0.5">
                    AI o&apos;rtada 1 soat oraliq vaqt qoldiradi
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── 5. FANLAR TANLOVI ───────────────────────────────────────────── */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Dars beradigan fanlari ({selectedSubjects.length} ta tanlandi)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto p-2 rounded-2xl border border-border bg-muted/20 custom-scrollbar">
              {subjects
                .filter((s) => s.isActive !== false || selectedSubjects.includes(s.id))
                .map((s) => {
                  const isSelected = selectedSubjects.includes(s.id);
                  const isInactive = s.isActive === false;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSubject(s.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                          : isInactive
                          ? "bg-muted/40 border-border opacity-60 text-muted-foreground"
                          : "bg-card border-border hover:border-slate-300 dark:hover:border-slate-700 text-muted-foreground"
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
