"use client";

import React, { useState, useMemo } from "react";
import { SchoolClass, Branch, Shift, Teacher, Subject } from "@/types";
import { sortClassesByName } from "@/lib/utils";
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
  Sparkles,
  Layers,
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
}

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
}) => {
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("ALL");

  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);
  const shiftMap = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);

  const filteredClasses = useMemo(() => {
    let list = classes;
    if (gradeFilter === "PRIMARY") {
      list = list.filter((c) => c.grade <= 4);
    } else if (gradeFilter === "MIDDLE") {
      list = list.filter((c) => c.grade >= 5 && c.grade <= 9);
    } else if (gradeFilter === "HIGH") {
      list = list.filter((c) => c.grade >= 10);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    return sortClassesByName(list);
  }, [classes, gradeFilter, search]);

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Sinf nomi bo'yicha qidiring..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <div className="flex items-center p-1 rounded-xl border border-border bg-muted/30 text-xs">
            <button
              onClick={() => setGradeFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                gradeFilter === "ALL" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground"
              }`}
            >
              Barchasi ({classes.length})
            </button>
            <button
              onClick={() => setGradeFilter("PRIMARY")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                gradeFilter === "PRIMARY" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground"
              }`}
            >
              1-4 sinf
            </button>
            <button
              onClick={() => setGradeFilter("MIDDLE")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                gradeFilter === "MIDDLE" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground"
              }`}
            >
              5-9 sinf
            </button>
            <button
              onClick={() => setGradeFilter("HIGH")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                gradeFilter === "HIGH" ? "bg-card text-foreground shadow-sm font-bold" : "text-muted-foreground"
              }`}
            >
              10-11 sinf
            </button>
          </div>
        </div>

        <button
          onClick={onAddClass}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi sinf qo'shish</span>
        </button>
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Sinf topilmadi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Qidiruv so'zini o'zgartiring yoki yangi sinf qo'shing
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredClasses.map((cls) => {
            const branch = branchMap.get(cls.branchId);
            const shift = shiftMap.get(cls.shiftId);
            const homeroom = cls.homeroomTeacherId ? teacherMap.get(cls.homeroomTeacherId) : null;
            const totalHours = (cls.subjects || []).reduce(
              (sum, s) => sum + (Number(s.weeklyHours) || 0),
              0
            );

            return (
              <div
                key={cls.id}
                className={`flex flex-col justify-between p-4 rounded-3xl border transition-all bg-card/80 hover:bg-card hover:shadow-lg ${
                  cls.isClosed
                    ? "opacity-60 border-slate-200 dark:border-slate-800"
                    : "border-border/80 hover:border-primary/40"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-extrabold text-sm shadow-inner">
                        {cls.name}
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                          <span>{cls.name}</span>
                          {cls.grade <= 4 && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20">
                              5 kunlik
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{branch?.name || "Asosiy bino"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditClass(cls)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`${cls.name} sinfini o'chirishni tasdiqlaysizmi?`)) {
                            onDeleteClass(cls.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Info pills */}
                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-2xl border border-border/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Smena:</span>
                      </span>
                      <span className="font-semibold text-foreground">
                        {shift?.name || "1-smena"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>Sinf rahbari:</span>
                      </span>
                      <span className="font-semibold text-foreground truncate max-w-[120px]">
                        {homeroom ? homeroom.fullName : "Biriktirilmagan"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40">
                      <span>Yuklama:</span>
                      <span className="font-bold text-primary">
                        {cls.subjects?.length || 0} ta fan • {totalHours} soat
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onOpenCurriculum(cls)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Fanlar taqsimoti ({totalHours} st)</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
