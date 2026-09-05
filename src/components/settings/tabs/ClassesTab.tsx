"use client";

import React, { useState, useMemo, useCallback } from "react";
import { SchoolClass, Branch, Shift, Teacher, Subject } from "@/types";
import { sortClassesByName } from "@/lib/utils";
import { TeacherSelectCombobox } from "../shared/TeacherSelectCombobox";
import { useSchoolStore } from "@/lib/store/useSchoolStore";
import {
  GraduationCap,
  Plus,
  Search,
  BookOpen,
  Edit2,
  Trash2,
  Building2,
  Clock,
  UserCheck,
  AlertTriangle,
  X,
  Sparkles,
  FileSpreadsheet,
  Download,
  Upload,
  Check,
  CalendarOff,
  Users,
  Lock,
  Unlock,
  Layers,
  BarChart3,
  Sun,
  Sunset,
} from "lucide-react";

interface ClassesTabProps {
  classes: SchoolClass[];
  branches: Branch[];
  shifts: Shift[];
  teachers: Teacher[];
  subjects: Subject[];
  onAddClass: () => void;
  onEditClass: (cls: SchoolClass) => void;
  onDeleteClass: (classId: string) => void;
  onOpenCurriculum: (cls: SchoolClass) => void;
  onSetHomeroomTeacher?: (classId: string, teacherId: string | null) => void;
  onOpenEMaktabImport?: () => void;
  onBulkAddClasses?: (newClasses: SchoolClass[]) => void;
}

type ClassFilterType = "ALL" | "PRIMARY" | "MIDDLE" | "HIGH" | "NO_HOMEROOM" | "LOCKED";

const AVAILABLE_GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const AVAILABLE_LETTERS = ["A", "B", "D", "E", "F", "G", "H", "I", "J", "K"];

export const ClassesTab: React.FC<ClassesTabProps> = ({
  classes,
  branches,
  shifts,
  teachers,
  subjects,
  onAddClass,
  onEditClass,
  onDeleteClass,
  onOpenCurriculum,
  onSetHomeroomTeacher,
  onOpenEMaktabImport,
  onBulkAddClasses,
}) => {
  const { lockedClassIds = [], toggleLockClass, updateClass } = useSchoolStore();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ClassFilterType>("ALL");
  const [shiftFilter, setShiftFilter] = useState<"ALL" | "SHIFT_1" | "SHIFT_2">("ALL");
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);

  // Ommaviy generator holati
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [bulkBranchId, setBulkBranchId] = useState<string>(branches[0]?.id || "");
  const [bulkShiftId, setBulkShiftId] = useState<string>(shifts[0]?.id || "");
  const [bulkStudentCount, setBulkStudentCount] = useState<number>(25);

  // Yakka qo'lda kiritish holati
  const [singleClassName, setSingleClassName] = useState("");

  // Quick homeroom assignment modal
  const [quickClass, setQuickClass] = useState<SchoolClass | null>(null);
  const [quickTeacherId, setQuickTeacherId] = useState<string>("");

  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);
  const shiftMap = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);

  // Jonli kombinatsiya (Preview)
  const previewClassNames = useMemo(() => {
    const list: string[] = [];
    selectedGrades.forEach((g) => {
      selectedLetters.forEach((l) => {
        list.push(`${g}-${l}`);
      });
    });
    return list;
  }, [selectedGrades, selectedLetters]);

  // Sinf rahbarini topish
  const getClassHomeroomTeacher = useCallback(
    (cls: SchoolClass): Teacher | null => {
      if (cls.homeroomTeacherId) {
        if (teacherMap.has(cls.homeroomTeacherId)) {
          return teacherMap.get(cls.homeroomTeacherId)!;
        }
        const rawTarget = cls.homeroomTeacherId.trim().toLowerCase();
        const byName = teachers.find(
          (t) =>
            t.fullName.toLowerCase() === rawTarget ||
            (t.displayNumber && `t_${t.displayNumber}` === cls.homeroomTeacherId) ||
            t.id.toLowerCase() === rawTarget
        );
        if (byName) return byName;
      }

      const rawClassId = cls.id.toLowerCase();
      const rawClassName = cls.name.toLowerCase();
      const normClassName = rawClassName.replace(/[^a-z0-9]/g, "");

      const byTeacher = teachers.find((t) => {
        if (!t.homeroomClassId) return false;
        const tHId = t.homeroomClassId.toLowerCase();
        return (
          tHId === rawClassId ||
          tHId === rawClassName ||
          tHId.replace(/[^a-z0-9]/g, "") === normClassName
        );
      });
      if (byTeacher) return byTeacher;

      const sinfSoatiSub = cls.subjects?.find(
        (s) =>
          s.subjectId === "sub_sinf_soati" ||
          s.subjectId?.toLowerCase().includes("sinf_soati")
      );
      if (sinfSoatiSub && sinfSoatiSub.teacherId) {
        return (
          teacherMap.get(sinfSoatiSub.teacherId) ||
          teachers.find((t) => t.id === sinfSoatiSub.teacherId) ||
          null
        );
      }

      return null;
    },
    [teachers, teacherMap]
  );

  const primaryCount = useMemo(() => classes.filter((c) => c.grade <= 4).length, [classes]);
  const middleCount = useMemo(() => classes.filter((c) => c.grade >= 5 && c.grade <= 9).length, [classes]);
  const highCount = useMemo(() => classes.filter((c) => c.grade >= 10).length, [classes]);
  const totalStudents = useMemo(() => classes.reduce((sum, c) => sum + (c.studentCount || 25), 0), [classes]);
  const lockedCount = useMemo(() => classes.filter((c) => lockedClassIds.includes(c.id)).length, [classes, lockedClassIds]);

  const isClassShift2 = useCallback((c: SchoolClass) => {
    const s = shiftMap.get(c.shiftId);
    const sName = (s?.name || "").toLowerCase();
    const sId = (c.shiftId || "").toLowerCase();
    return (
      sId === "s39_2" ||
      sId.includes("shift_2") ||
      sId.includes("shift2") ||
      sId.includes("smena_2") ||
      sId.includes("smena2") ||
      sName.includes("2") ||
      sName.includes("tush") ||
      sName.includes("ikkinchi") ||
      sName.includes("keyin") ||
      sName.includes("abetdan")
    );
  }, [shiftMap]);

  const isClassShift1 = useCallback((c: SchoolClass) => !isClassShift2(c), [isClassShift2]);

  const shift1Count = useMemo(() => classes.filter(isClassShift1).length, [classes, isClassShift1]);
  const shift2Count = useMemo(() => classes.filter(isClassShift2).length, [classes, isClassShift2]);

  const handleToggleClassShift = useCallback((cls: SchoolClass, e: React.MouseEvent) => {
    e.stopPropagation();
    const is2 = isClassShift2(cls);
    const s1 = shifts.find((s) => !s.id.toLowerCase().includes("2") && !s.name.toLowerCase().includes("2")) || shifts[0];
    const s2 = shifts.find((s) => s.id.toLowerCase().includes("2") || s.name.toLowerCase().includes("2") || s.name.toLowerCase().includes("tush")) || shifts[1] || shifts[0];
    const targetShiftId = is2 ? (s1?.id || "s39_1") : (s2?.id || "s39_2");

    updateClass({
      ...cls,
      shiftId: targetShiftId,
    });
  }, [isClassShift2, shifts, updateClass]);

  const noHomeroomCount = useMemo(
    () => classes.filter((c) => !getClassHomeroomTeacher(c)).length,
    [classes, getClassHomeroomTeacher]
  );
  const withHomeroomCount = useMemo(() => classes.length - noHomeroomCount, [classes.length, noHomeroomCount]);

  // Har bir aniq sinf raqami (1..11) dagi sinflar soni
  const gradeCounts = useMemo(() => {
    const map = new Map<number, number>();
    for (let g = 1; g <= 11; g++) map.set(g, 0);
    classes.forEach((c) => {
      const g = c.grade || 1;
      map.set(g, (map.get(g) || 0) + 1);
    });
    return map;
  }, [classes]);

  const filteredClasses = useMemo(() => {
    let list = classes;

    // Smena filtri (Abetgacha / Abetdan keyin)
    if (shiftFilter === "SHIFT_1") {
      list = list.filter(isClassShift1);
    } else if (shiftFilter === "SHIFT_2") {
      list = list.filter(isClassShift2);
    }

    if (selectedGrade !== null) {
      list = list.filter((c) => c.grade === selectedGrade);
    } else if (filterType === "PRIMARY") {
      list = list.filter((c) => c.grade <= 4);
    } else if (filterType === "MIDDLE") {
      list = list.filter((c) => c.grade >= 5 && c.grade <= 9);
    } else if (filterType === "HIGH") {
      list = list.filter((c) => c.grade >= 10);
    } else if (filterType === "NO_HOMEROOM") {
      list = list.filter((c) => !getClassHomeroomTeacher(c));
    } else if (filterType === "LOCKED") {
      list = list.filter((c) => lockedClassIds.includes(c.id));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => {
        if (c.name.toLowerCase().includes(q)) return true;
        const homeroom = getClassHomeroomTeacher(c);
        if (homeroom && homeroom.fullName.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    return sortClassesByName(list);
  }, [classes, shiftFilter, isClassShift1, isClassShift2, selectedGrade, filterType, search, getClassHomeroomTeacher, lockedClassIds]);

  // Ommaviy sinflarni yaratish
  const handleCreateBulkClasses = () => {
    if (previewClassNames.length === 0) return;

    const currentSchoolId = classes[0]?.schoolId || "cmthn422g0001uff8vhccbxmz";
    const existingNames = new Set(classes.map((c) => c.name.toUpperCase()));

    const newClassesToCreate: SchoolClass[] = [];
    previewClassNames.forEach((cName) => {
      const upper = cName.toUpperCase();
      if (!existingNames.has(upper)) {
        const grade = parseInt(cName) || 1;
        const isD = cName.toUpperCase().endsWith("D");
        const bId =
          isD && branches.find((b) => !b.isMain)
            ? branches.find((b) => !b.isMain)!.id
            : bulkBranchId || branches[0]?.id || "";

        newClassesToCreate.push({
          id: `c_${currentSchoolId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          schoolId: currentSchoolId,
          branchId: bId,
          shiftId: bulkShiftId || shifts[0]?.id || "",
          name: upper,
          grade: grade,
          isPrimary: grade <= 4,
          studentCount: bulkStudentCount,
          blockedDays: grade <= 4 ? [6] : [],
          subjects: [],
        });
      }
    });

    if (newClassesToCreate.length > 0 && onBulkAddClasses) {
      onBulkAddClasses(newClassesToCreate);
      setSelectedGrades([]);
      setSelectedLetters([]);
    }
  };

  // Yakka sinf qo'shish
  const handleAddSingleClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleClassName.trim()) return;

    const upper = singleClassName.trim().toUpperCase();
    const currentSchoolId = classes[0]?.schoolId || "cmthn422g0001uff8vhccbxmz";
    const grade = parseInt(upper) || 1;
    const isD = upper.endsWith("D");
    const bId =
      isD && branches.find((b) => !b.isMain)
        ? branches.find((b) => !b.isMain)!.id
        : bulkBranchId || branches[0]?.id || "";

    const newClass: SchoolClass = {
      id: `c_${currentSchoolId}_${Date.now()}`,
      schoolId: currentSchoolId,
      branchId: bId,
      shiftId: bulkShiftId || shifts[0]?.id || "",
      name: upper,
      grade: grade,
      isPrimary: grade <= 4,
      studentCount: 25,
      blockedDays: grade <= 4 ? [6] : [],
      subjects: [],
    };

    if (onBulkAddClasses) {
      onBulkAddClasses([newClass]);
      setSingleClassName("");
    }
  };

  const handleSaveQuickHomeroom = () => {
    if (!quickClass || !onSetHomeroomTeacher) return;
    onSetHomeroomTeacher(quickClass.id, quickTeacherId || null);
    setQuickClass(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. Yuqori Excel Import Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Excel & eMaktab Import</h4>
            <p className="text-xs text-muted-foreground">
              Shablonni yuklab oling, to'ldiring va yuklang. Import'dan oldin ma'lumot ko'rsatiladi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onOpenEMaktabImport && (
            <button
              type="button"
              onClick={onOpenEMaktabImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>eMaktab Excel yuklash</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Kombinatorik Ommaviy Sinf Yaratish Paneli (Bulk Creator) */}
      <div className="p-5 rounded-3xl bg-card border border-border shadow-xs space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Sinf raqami (bir yoki bir nechta tanlang)</span>
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedGrades([...AVAILABLE_GRADES])}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                Barchasi
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                type="button"
                onClick={() => setSelectedGrades([1, 2, 3, 4])}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                1-4
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                type="button"
                onClick={() => setSelectedGrades([5, 6, 7, 8, 9])}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                5-9
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                type="button"
                onClick={() => setSelectedGrades([10, 11])}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                10-11
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                type="button"
                onClick={() => setSelectedGrades([])}
                className="text-muted-foreground hover:underline cursor-pointer"
              >
                Tozalash
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_GRADES.map((g) => {
              const isSelected = selectedGrades.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() =>
                    setSelectedGrades((prev) =>
                      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g].sort((a, b) => a - b)
                    )
                  }
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-2 ring-primary/30"
                      : "bg-background border border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <span>Sinf harflari (parallel — kerakli harflarni belgilang)</span>
            </label>
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setSelectedLetters(["A", "B", "D"])}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                A, B, D
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                type="button"
                onClick={() => setSelectedLetters(["A", "B"])}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                A, B
              </button>
              <span className="text-muted-foreground/40">•</span>
              <button
                type="button"
                onClick={() => setSelectedLetters([])}
                className="text-muted-foreground hover:underline cursor-pointer"
              >
                Tozalash
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_LETTERS.map((l) => {
              const isSelected = selectedLetters.includes(l);
              return (
                <button
                  key={l}
                  type="button"
                  onClick={() =>
                    setSelectedLetters((prev) =>
                      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]
                    )
                  }
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 ring-2 ring-primary/30"
                      : "bg-background border border-border text-foreground hover:border-primary/50"
                  }`}
                >
                  {l}
                </button>
              );
            })}
          </div>
        </div>

        {/* Parametrlar va Yaratish tugmasi */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">Smena:</label>
            <select
              value={bulkShiftId}
              onChange={(e) => setBulkShiftId(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-border bg-background cursor-pointer"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-muted-foreground">O'quvchilar soni:</label>
            <input
              type="number"
              min={1}
              max={50}
              value={bulkStudentCount}
              onChange={(e) => setBulkStudentCount(Number(e.target.value))}
              className="w-20 px-3 py-2 text-xs rounded-xl border border-border bg-background font-bold"
            />
          </div>

          <button
            type="button"
            disabled={previewClassNames.length === 0}
            onClick={handleCreateBulkClasses}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md ${
              previewClassNames.length > 0
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20"
                : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {previewClassNames.length > 0
                ? `+ ${previewClassNames.length} ta sinfni qo'shish`
                : "+ Sinflarni qo'shish"}
            </span>
          </button>
        </div>

        {/* Jonli namuna izohi */}
        {previewClassNames.length > 0 ? (
          <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-primary font-medium flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>Yaratiladigan sinflar:</span>
            <div className="flex flex-wrap gap-1.5">
              {previewClassNames.map((cn) => (
                <span key={cn} className="px-2 py-0.5 rounded-lg bg-primary/10 font-bold">
                  {cn}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Masalan: raqam <strong>5</strong> va harflar <strong>A, B</strong> tanlansa — <strong>5-A</strong> va <strong>5-B</strong> sinflari yaratiladi.
          </p>
        )}
      </div>

      {/* 3. Bitta sinfni qo'lda kiritish paneli */}
      <form
        onSubmit={handleAddSingleClass}
        className="flex items-center gap-3 p-4 rounded-3xl bg-card border border-border shadow-xs"
      >
        <div className="flex-1 max-w-xs">
          <label className="block text-[11px] font-medium text-muted-foreground mb-1">
            Yoki bitta sinfni qo'lda kiritish
          </label>
          <input
            type="text"
            placeholder="Masalan: 5-A"
            value={singleClassName}
            onChange={(e) => setSingleClassName(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold uppercase"
          />
        </div>
        <button
          type="submit"
          disabled={!singleClassName.trim()}
          className="self-end px-4 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted text-foreground transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Bitta qo'shish
        </button>
      </form>

      {/* 4. Toolbar, Status Bar va Kengaytirilgan Filtrlar */}
      <div className="flex flex-col gap-3.5 p-4 rounded-3xl bg-card border border-border shadow-xs">
        {/* Yuqori qidiruv va sinf qo'shish */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="relative flex-1 sm:w-80 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Sinf yoki sinf rahbari bo'yicha qidiring..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={onAddClass}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Sinf modali</span>
            </button>
          </div>
        </div>

        {/* 🌟 STATUS BAR (Sinflar holati, kontingent va rahbarlar monitoring paneli) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">Jami sinflar</div>
              <div className="text-xs font-extrabold text-foreground">{classes.length} ta sinf</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">O'quvchilar</div>
              <div className="text-xs font-extrabold text-foreground">~{totalStudents} nafar</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">1-4 / 5-9 / 10-11</div>
              <div className="text-xs font-extrabold text-foreground">{primaryCount} / {middleCount} / {highCount}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              noHomeroomCount === 0 ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
            }`}>
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">Sinf rahbarlari</div>
              <div className="text-xs font-extrabold text-foreground">{withHomeroomCount}/{classes.length} ta</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">Qulflangan</div>
              <div className="text-xs font-extrabold text-foreground">{lockedCount} ta sinf</div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/50">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] text-muted-foreground font-semibold">Ko'rsatilmoqda</div>
              <div className="text-xs font-extrabold text-foreground">{filteredClasses.length} ta sinf</div>
            </div>
          </div>
        </div>

        {/* Filter pills: Bosqichlar va Smena filtrlari (Abetgacha / Abetdan keyin) */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-2 border-t border-border/60">
          {/* Chap: Bosqichlar bo'yicha filtrlar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => { setFilterType("ALL"); setSelectedGrade(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === "ALL" && selectedGrade === null
                  ? "bg-foreground text-background font-bold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              Barchasi ({classes.length})
            </button>

            <button
              type="button"
              onClick={() => { setFilterType("PRIMARY"); setSelectedGrade(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === "PRIMARY" && selectedGrade === null
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              1-4 sinf ({primaryCount})
            </button>

            <button
              type="button"
              onClick={() => { setFilterType("MIDDLE"); setSelectedGrade(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === "MIDDLE" && selectedGrade === null
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              5-9 sinf ({middleCount})
            </button>

            <button
              type="button"
              onClick={() => { setFilterType("HIGH"); setSelectedGrade(null); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                filterType === "HIGH" && selectedGrade === null
                  ? "bg-primary text-primary-foreground font-bold shadow-xs"
                  : "bg-muted/40 hover:bg-muted text-muted-foreground"
              }`}
            >
              10-11 sinf ({highCount})
            </button>

            {lockedCount > 0 && (
              <button
                type="button"
                onClick={() => { setFilterType("LOCKED"); setSelectedGrade(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterType === "LOCKED"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                }`}
              >
                <Lock className="w-3.5 h-3.5 shrink-0" />
                <span>🔒 Qulflanganlar ({lockedCount})</span>
              </button>
            )}

            {noHomeroomCount > 0 && (
              <button
                type="button"
                onClick={() => { setFilterType("NO_HOMEROOM"); setSelectedGrade(null); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  filterType === "NO_HOMEROOM"
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>⚠️ Rahbari yo'qlar ({noHomeroomCount})</span>
              </button>
            )}
          </div>

          {/* O'ng: Smena Filtrlari (Bo'sh turgan joyni to'ldiradi) */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-2xl border border-border/70 shrink-0 self-start lg:self-auto shadow-xs">
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase px-2 shrink-0">
              Smena:
            </span>
            <button
              type="button"
              onClick={() => setShiftFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                shiftFilter === "ALL"
                  ? "bg-background text-foreground shadow-xs font-extrabold border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/40"
              }`}
            >
              Barcha smenalar ({classes.length})
            </button>
            <button
              type="button"
              onClick={() => setShiftFilter("SHIFT_1")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                shiftFilter === "SHIFT_1"
                  ? "bg-amber-500 text-white shadow-xs font-extrabold"
                  : "text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40"
              }`}
            >
              <Sun className="w-3.5 h-3.5 shrink-0 text-amber-300" />
              <span>☀️ Abetgacha ({shift1Count})</span>
            </button>
            <button
              type="button"
              onClick={() => setShiftFilter("SHIFT_2")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                shiftFilter === "SHIFT_2"
                  ? "bg-indigo-600 text-white shadow-xs font-extrabold"
                  : "text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
              }`}
            >
              <Sunset className="w-3.5 h-3.5 shrink-0 text-indigo-200" />
              <span>🌤️ Abetdan keyin ({shift2Count})</span>
            </button>
          </div>
        </div>

        {/* 🔢 Aniq sinf parallellari (1 dan 11 gacha) mikro-filtri */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider shrink-0 mr-1">
            Sinflar:
          </span>
          {AVAILABLE_GRADES.map((g) => {
            const count = gradeCounts.get(g) || 0;
            if (count === 0) return null;
            const isSelected = selectedGrade === g;

            return (
              <button
                key={`grade_btn_${g}`}
                type="button"
                onClick={() => setSelectedGrade(isSelected ? null : g)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs scale-105"
                    : "bg-muted/40 hover:bg-muted text-foreground/80"
                }`}
                title={`${g}-sinflarni ko'rish (${count} ta)`}
              >
                <span>{g}-sinf</span>
                <span className="ml-1 opacity-70 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Sinf topilmadi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Yuqoridagi kombinatorik paneldan bir necha soniyada sinflarni yarating
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5">
          {filteredClasses.map((cls) => {
            const branch = branchMap.get(cls.branchId);
            const shift = shiftMap.get(cls.shiftId);
            const homeroom = getClassHomeroomTeacher(cls);
            const totalHours = (cls.subjects || []).reduce(
              (sum, s) => sum + (Number(s.weeklyHours) || 0),
              0
            );
            const blockedDaysCount = (cls.blockedDays || (cls.grade <= 4 ? [6] : [])).length;
            const isShift2 = isClassShift2(cls);

            return (
              <div
                key={cls.id}
                className={`flex flex-col justify-between p-4 rounded-3xl border transition-all bg-card/80 hover:bg-card hover:shadow-lg min-w-0 overflow-hidden ${
                  cls.isClosed
                    ? "opacity-60 border-slate-200 dark:border-slate-800"
                    : !homeroom
                    ? "border-amber-300/80 dark:border-amber-800/60 hover:border-amber-400"
                    : "border-border/80 hover:border-primary/40"
                }`}
              >
                <div className="min-w-0">
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm shadow-inner shrink-0">
                        {cls.name}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5 truncate">
                          <span className="truncate">{cls.name}</span>
                          {cls.grade <= 4 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20 shrink-0">
                              5 kunlik
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate mt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={(e) => handleToggleClassShift(cls, e)}
                            title="Smenani almashtirish uchun bosing (1-smena <-> 2-smena)"
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold text-[10px] transition-all cursor-pointer border shadow-2xs ${
                              isShift2
                                ? "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/20"
                            }`}
                          >
                            {isShift2 ? (
                              <Sunset className="w-3 h-3 text-indigo-500 shrink-0" />
                            ) : (
                              <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                            )}
                            <span>{isShift2 ? "🌤️ 2-smena (Abetdan keyin)" : "☀️ 1-smena (Abetgacha)"}</span>
                          </button>
                          <span>•</span>
                          <span>{cls.studentCount || 25} o'quvchi</span>
                          {blockedDaysCount > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-rose-500 font-semibold">{blockedDaysCount} band kun</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLockClass(cls.id);
                        }}
                        title={
                          lockedClassIds.includes(cls.id)
                            ? "🔒 Dars jadvali qulflangan (Generatsiyada darslar o'zgarmaydi). Ochish uchun bosing"
                            : "🔓 Dars jadvalini qulflash"
                        }
                        className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                          lockedClassIds.includes(cls.id)
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {lockedClassIds.includes(cls.id) ? (
                          <Lock className="w-4 h-4 text-rose-600" />
                        ) : (
                          <Unlock className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => onEditClass(cls)}
                        title="Tahrirlash va dars cheklovlari"
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                      </button>
                      <button
                        onClick={() => onDeleteClass(cls.id)}
                        title="O'chirish"
                        className="p-1.5 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </button>
                    </div>
                  </div>

                  {/* Badges & Homeroom */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="flex items-center gap-1 text-[11px]">
                        <Building2 className="w-3.5 h-3.5 text-muted-foreground/70" />
                        {branch?.name || "Asosiy bino"}
                      </span>
                      <span className="font-semibold text-foreground text-[11px]">
                        {totalHours} soat/hafta
                      </span>
                    </div>

                    {/* Homeroom teacher badge */}
                    <div className="pt-1">
                      {homeroom ? (
                        <div
                          onClick={() => {
                            if (onSetHomeroomTeacher) {
                              setQuickClass(cls);
                              setQuickTeacherId(homeroom.id);
                            }
                          }}
                          className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 cursor-pointer hover:opacity-90 transition-opacity"
                          title="Sinf rahbarini o'zgartirish"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            <span className="text-[11px] font-bold truncate">
                              {homeroom.fullName}
                            </span>
                          </div>
                          <span className="text-[9px] underline opacity-70 shrink-0 ml-1">
                            o'zgartirish
                          </span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (onSetHomeroomTeacher) {
                              setQuickClass(cls);
                              setQuickTeacherId("");
                            }
                          }}
                          className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-semibold text-[11px] hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Sinf rahbari tayinlash</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom button: Curriculum */}
                <div className="mt-3 pt-3 border-t border-border/60">
                  <button
                    onClick={() => onOpenCurriculum(cls)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold bg-muted/50 hover:bg-primary/10 text-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>O'quv rejasi ({cls.subjects?.length || 0} fan)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Homeroom Modal */}
      {quickClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  {quickClass.name}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">Sinf rahbarini biriktirish</h3>
                  <p className="text-xs text-muted-foreground">{quickClass.name} sinfi uchun</p>
                </div>
              </div>
              <button
                onClick={() => setQuickClass(null)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground">O'qituvchi tanlang:</label>
              <TeacherSelectCombobox
                value={quickTeacherId}
                onChange={setQuickTeacherId}
                teachers={teachers}
                placeholder="O'qituvchini qidiring..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setQuickClass(null)}
                className="px-3 py-1.5 text-xs font-semibold border border-border rounded-xl hover:bg-muted cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSaveQuickHomeroom}
                className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
