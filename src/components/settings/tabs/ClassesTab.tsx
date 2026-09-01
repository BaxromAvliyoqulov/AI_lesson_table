"use client";

import React, { useState, useMemo, useCallback } from "react";
import { SchoolClass, Branch, Shift, Teacher, Subject } from "@/types";
import { sortClassesByName } from "@/lib/utils";
import { TeacherSelectCombobox } from "../shared/TeacherSelectCombobox";
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
}

type ClassFilterType = "ALL" | "PRIMARY" | "MIDDLE" | "HIGH" | "NO_HOMEROOM";

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
}) => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<ClassFilterType>("ALL");

  // Quick homeroom assignment modal
  const [quickClass, setQuickClass] = useState<SchoolClass | null>(null);
  const [quickTeacherId, setQuickTeacherId] = useState<string>("");

  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);
  const shiftMap = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);

  /**
   * Universal Class Homeroom Teacher Resolver:
   * 1. Direct match by homeroomTeacherId
   * 2. Reverse match: teacher whose homeroomClassId === cls.id or cls.name
   * 3. ClassSubject: teacher assigned to "sub_sinf_soati"
   */
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

      // Reverse lookup: teacher with this homeroomClassId
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

      // Sinf soati match
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

  const noHomeroomCount = useMemo(
    () => classes.filter((c) => !getClassHomeroomTeacher(c)).length,
    [classes, getClassHomeroomTeacher]
  );

  const filteredClasses = useMemo(() => {
    let list = classes;
    if (filterType === "PRIMARY") {
      list = list.filter((c) => c.grade <= 4);
    } else if (filterType === "MIDDLE") {
      list = list.filter((c) => c.grade >= 5 && c.grade <= 9);
    } else if (filterType === "HIGH") {
      list = list.filter((c) => c.grade >= 10);
    } else if (filterType === "NO_HOMEROOM") {
      list = list.filter((c) => !getClassHomeroomTeacher(c));
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
  }, [classes, filterType, search, getClassHomeroomTeacher]);

  const handleSaveQuickHomeroom = () => {
    if (!quickClass || !onSetHomeroomTeacher) return;
    onSetHomeroomTeacher(quickClass.id, quickTeacherId || null);
    setQuickClass(null);
  };

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-col gap-3 p-4 rounded-3xl bg-card border border-border shadow-xs">
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

          <button
            onClick={onAddClass}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0 self-end sm:self-auto"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Yangi sinf qo'shish</span>
          </button>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFilterType("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === "ALL"
                ? "bg-foreground text-background font-bold shadow-xs"
                : "bg-muted/40 hover:bg-muted text-muted-foreground"
            }`}
          >
            Barchasi ({classes.length})
          </button>

          <button
            onClick={() => setFilterType("PRIMARY")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === "PRIMARY"
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "bg-muted/40 hover:bg-muted text-muted-foreground"
            }`}
          >
            1-4 sinf
          </button>

          <button
            onClick={() => setFilterType("MIDDLE")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === "MIDDLE"
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "bg-muted/40 hover:bg-muted text-muted-foreground"
            }`}
          >
            5-9 sinf
          </button>

          <button
            onClick={() => setFilterType("HIGH")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
              filterType === "HIGH"
                ? "bg-primary text-primary-foreground font-bold shadow-xs"
                : "bg-muted/40 hover:bg-muted text-muted-foreground"
            }`}
          >
            10-11 sinf
          </button>

          {noHomeroomCount > 0 && (
            <button
              onClick={() => setFilterType("NO_HOMEROOM")}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredClasses.map((cls) => {
            const branch = branchMap.get(cls.branchId);
            const shift = shiftMap.get(cls.shiftId);
            const homeroom = getClassHomeroomTeacher(cls);
            const totalHours = (cls.subjects || []).reduce(
              (sum, s) => sum + (Number(s.weeklyHours) || 0),
              0
            );

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
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="truncate">{branch?.name || "Asosiy bino"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
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

                  {/* Info pills container */}
                  <div className="space-y-2 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-2xl border border-border/60 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>Smena:</span>
                      </span>
                      <span className="font-semibold text-foreground shrink-0 text-right truncate">
                        {shift?.name || "1-smena"}
                      </span>
                    </div>

                    {/* Homeroom teacher status & quick action (Zero overflow) */}
                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/40 gap-2 min-w-0">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground shrink-0">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Sinf rahbari:</span>
                      </span>
                      {homeroom ? (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickClass(cls);
                            setQuickTeacherId(homeroom.id);
                          }}
                          className="font-bold text-foreground hover:text-indigo-600 hover:underline truncate max-w-[130px] cursor-pointer text-right shrink-0"
                          title="Sinf rahbarini o'zgartirish"
                        >
                          {homeroom.fullName}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setQuickClass(cls);
                            setQuickTeacherId("");
                          }}
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30 transition-colors cursor-pointer shrink-0"
                          title="Sinf rahbarini tayinlash"
                        >
                          + Tayinlash
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/40 gap-2">
                      <span className="shrink-0">Yuklama:</span>
                      <span className="font-bold text-primary shrink-0 text-right truncate">
                        {cls.subjects?.length || 0} ta fan • {totalHours} st
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => onOpenCurriculum(cls)}
                  className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shrink-0"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>Fanlar taqsimoti ({totalHours} st)</span>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TEZKOR SINF RAHBARI BIRIKTIRISH MODALI ───────────────────────── */}
      {quickClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/80">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-foreground truncate">
                    {quickClass.name}-sinf Rahbarini Tayinlash
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    Sinfga rahbar o'qituvchini tanlang
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickClass(null)}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  Sinf rahbari (O'qituvchi):
                </label>
                <TeacherSelectCombobox
                  value={quickTeacherId}
                  onChange={setQuickTeacherId}
                  teachers={teachers}
                  placeholder="O'qituvchini tanlang (yoki bo'sh qoldiring)..."
                />
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground leading-relaxed">
                💡 Tanlangan o'qituvchiga ushbu sinfning Juma kungi <strong>Sinf soati</strong> darsi va rasmiy jadvaldagi imzo bandlari avtomatik birikadi.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setQuickClass(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleSaveQuickHomeroom}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
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
