import React from "react";
import { SchoolClass, Subject, Teacher, ClassSubject } from "@/types";
import { SubjectCategory } from "./types";
import {
  BookOpen,
  X,
  Search,
  Sparkle,
  Layers,
  CheckCircle2,
  Check,
  Minus,
  Plus,
} from "lucide-react";

interface CurriculumCatalogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetClass: SchoolClass;
  catalogSearch: string;
  setCatalogSearch: (s: string) => void;
  catalogCategory: SubjectCategory;
  setCatalogCategory: (cat: SubjectCategory) => void;
  filteredCatalogSubjects: Subject[];
  subjectsList: ClassSubject[];
  selectedCatalogSubjectIds: Record<string, number>;
  onToggleCatalogSubject: (id: string) => void;
  onStepCatalogHours: (id: string, delta: number, e: React.MouseEvent) => void;
  onAddSelectedFromCatalog: () => void;
  allTeachers: Teacher[];
}

export const CurriculumCatalogDrawer: React.FC<CurriculumCatalogDrawerProps> = ({
  isOpen,
  onClose,
  targetClass,
  catalogSearch,
  setCatalogSearch,
  catalogCategory,
  setCatalogCategory,
  filteredCatalogSubjects,
  subjectsList,
  selectedCatalogSubjectIds,
  onToggleCatalogSubject,
  onStepCatalogHours,
  onAddSelectedFromCatalog,
  allTeachers,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-foreground text-sm sm:text-base">
                Fanlar Katalogidan Tanlash
              </h3>
              <p className="text-xs text-muted-foreground">
                {targetClass.name} ({targetClass.grade}-sinf) uchun fanlarni belgilang va soatlarini tanlang
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

        {/* Live Search & Category Filter Chips */}
        <div className="p-4 sm:px-6 border-b border-border/60 bg-muted/20 space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Fan nomi yoki qisqartmasi bo'yicha qidiring (masalan: Ona tili, Fizika)..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
            />
            {catalogSearch && (
              <button
                onClick={() => setCatalogSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Categories */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {[
              { id: "RECOMMENDED", label: `⭐ ${targetClass.grade}-sinfga mos` },
              { id: "ALL", label: "Barcha fanlar" },
              { id: "EXACT_SCIENCE", label: "📐 Aniq fanlar" },
              { id: "LANGUAGES", label: "🗣️ Tillar" },
              { id: "NATURAL", label: "🌿 Tabiiy-ilmiy" },
              { id: "ARTS_SPORTS", label: "🎨 San'at & Sport" },
              { id: "SOCIAL", label: "⚖️ Ijtimoiy" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCatalogCategory(cat.id as SubjectCategory)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  catalogCategory === cat.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Interactive Subject Cards */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          {filteredCatalogSubjects.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Qidiruv bo'yicha hech qanday fan topilmadi
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCatalogSubjects.map((sub) => {
                const isAlreadyAdded = subjectsList.some((s) => s.subjectId === sub.id);
                const isSelected = selectedCatalogSubjectIds[sub.id] !== undefined;
                const selectedHours = selectedCatalogSubjectIds[sub.id] || 2;
                const specializedTeachersCount = allTeachers.filter((t) =>
                  t.subjectIds?.includes(sub.id)
                ).length;

                return (
                  <div
                    key={sub.id}
                    onClick={() => !isAlreadyAdded && onToggleCatalogSubject(sub.id)}
                    className={`p-3.5 rounded-2xl border transition-all select-none flex flex-col justify-between ${
                      isAlreadyAdded
                        ? "border-emerald-500/30 bg-emerald-500/5 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md cursor-pointer scale-[1.01]"
                        : "border-border/80 bg-card hover:border-primary/40 hover:shadow-xs cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: sub.colorTag || "#3B82F6" }}
                        />
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-xs text-foreground truncate">
                            {sub.name}
                          </h5>
                          <p className="text-[10px] text-muted-foreground">
                            SanPiN: {sub.difficultyScore || 5} ball • {specializedTeachersCount} ta ustoz
                          </p>
                        </div>
                      </div>

                      {isAlreadyAdded ? (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Qo'shilgan</span>
                        </span>
                      ) : (
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                            isSelected
                              ? "bg-primary border-primary text-primary-foreground shadow-xs"
                              : "border-border bg-background"
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      )}
                    </div>

                    {/* Card bottom: Hours Adjuster if Selected */}
                    {!isAlreadyAdded && isSelected && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3 pt-2.5 border-t border-primary/20 flex items-center justify-between text-xs"
                      >
                        <span className="text-[11px] font-bold text-primary">
                          Haftalik soat:
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => onStepCatalogHours(sub.id, -1, e)}
                            disabled={selectedHours <= 1}
                            className="w-6 h-6 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-black text-xs px-2 py-0.5 rounded-md bg-background border border-border min-w-[28px] text-center">
                            {selectedHours}st
                          </span>
                          <button
                            type="button"
                            onClick={(e) => onStepCatalogHours(sub.id, 1, e)}
                            disabled={selectedHours >= 10}
                            className="w-6 h-6 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Bar with Batch Add Button */}
        <div className="p-4 sm:px-6 border-t border-border/80 bg-muted/40 flex items-center justify-between gap-3 shrink-0">
          <div className="text-xs font-semibold text-muted-foreground">
            Tanlandi:{" "}
            <span className="font-black text-foreground">
              {Object.keys(selectedCatalogSubjectIds).length} ta yangi fan
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={onAddSelectedFromCatalog}
              disabled={Object.keys(selectedCatalogSubjectIds).length === 0}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              Tanlangan ({Object.keys(selectedCatalogSubjectIds).length} ta) fanni qo'shish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
