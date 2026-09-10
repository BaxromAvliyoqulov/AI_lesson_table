"use client";

import React from "react";
import { BookOpen, Sparkles } from "lucide-react";
import { TeacherSubjectSelectorProps } from "./types";

export const TeacherSubjectSelector: React.FC<TeacherSubjectSelectorProps> = ({
  subjects,
  selectedSubjects,
  toggleSubject,
  setSelectedSubjects,
  teachingStages,
}) => {
  const handleSelectPrimaryPackage = () => {
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
  };

  const filteredSubjects = subjects.filter((s) => {
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
      return selectedSubjects.includes(s.id) || !isHighOnly;
    }
    if (teachingStages === "HIGH") {
      const isPrimaryOnly = l.includes("o'qish savodxonligi") || l.includes("savodxonlik");
      return selectedSubjects.includes(s.id) || !isPrimaryOnly;
    }
    return true;
  });

  return (
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
            onClick={handleSelectPrimaryPackage}
            className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 px-2 py-1 rounded-lg border border-teal-200 dark:border-teal-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-teal-600" />
            Boshlang&apos;ich paketini tanlash
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-2xl border border-border bg-muted/10">
        {filteredSubjects.map((s) => {
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
  );
};
