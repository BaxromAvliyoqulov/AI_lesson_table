import React, { useState, useMemo } from "react";
import { SchoolClass, Branch, Shift } from "@/types";
import { AVAILABLE_GRADES, AVAILABLE_LETTERS } from "./types";
import { Plus, Sparkles } from "lucide-react";

interface BulkClassGeneratorProps {
  branches: Branch[];
  shifts: Shift[];
  existingClasses: SchoolClass[];
  onBulkAddClasses?: (newClasses: SchoolClass[]) => void;
}

export const BulkClassGenerator: React.FC<BulkClassGeneratorProps> = ({
  branches,
  shifts,
  existingClasses,
  onBulkAddClasses,
}) => {
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<string[]>([]);
  const [bulkBranchId, setBulkBranchId] = useState<string>(branches[0]?.id || "");
  const [bulkShiftId, setBulkShiftId] = useState<string>(shifts[0]?.id || "");
  const [bulkStudentCount, setBulkStudentCount] = useState<number>(25);
  const [singleClassName, setSingleClassName] = useState("");

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

  // Ommaviy sinflarni yaratish
  const handleCreateBulkClasses = () => {
    if (previewClassNames.length === 0) return;

    const currentSchoolId = existingClasses[0]?.schoolId || "cmthn422g0001uff8vhccbxmz";
    const existingNames = new Set(existingClasses.map((c) => c.name.toUpperCase()));

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
          id: `c_${currentSchoolId}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
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
    const currentSchoolId = existingClasses[0]?.schoolId || "cmthn422g0001uff8vhccbxmz";
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

  return (
    <div className="space-y-4">
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
    </div>
  );
};
