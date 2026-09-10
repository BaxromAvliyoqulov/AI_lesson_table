import React, { useMemo } from "react";
import { SchoolClass, Branch, Teacher } from "@/types";
import {
  BookOpen,
  Edit2,
  Trash2,
  Building2,
  UserCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Sun,
  Sunset,
  Check,
  Plus,
} from "lucide-react";

interface ClassCardProps {
  cls: SchoolClass;
  branch?: Branch;
  homeroom: Teacher | null;
  isLocked: boolean;
  isShift2: boolean;
  onToggleLock: (classId: string) => void;
  onEdit: (cls: SchoolClass) => void;
  onDelete: (classId: string) => void;
  onToggleShift: (cls: SchoolClass, e: React.MouseEvent) => void;
  onOpenCurriculum: (cls: SchoolClass) => void;
  onOpenQuickHomeroom: (cls: SchoolClass) => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({
  cls,
  branch,
  homeroom,
  isLocked,
  isShift2,
  onToggleLock,
  onEdit,
  onDelete,
  onToggleShift,
  onOpenCurriculum,
  onOpenQuickHomeroom,
}) => {
  // 2-guruh darsi 1-guruh bilan parallel o'tilgani uchun sinf umumiy soatiga qo'shilmaydi
  const totalHours = useMemo(() => {
    return (cls.subjects || []).reduce(
      (sum, s) => sum + (s.groupType === "GROUP_2" ? 0 : Number(s.weeklyHours) || 0),
      0
    );
  }, [cls.subjects]);

  // Guruhlarga bo'lingan fanlarni (1-guruh va 2-guruh) yagona fan sifatida hisoblash
  const { totalSubjectsCount, assignedSubjectsCount, unassignedSubjectsCount } = useMemo(() => {
    const uniqueSubjectMap = new Map<string, { hasT1: boolean; hasT2: boolean; isSplit: boolean }>();
    (cls.subjects || []).forEach((s) => {
      if (!uniqueSubjectMap.has(s.subjectId)) {
        uniqueSubjectMap.set(s.subjectId, { hasT1: false, hasT2: false, isSplit: false });
      }
      const entry = uniqueSubjectMap.get(s.subjectId)!;
      if (s.groupType === "GROUP_2") {
        entry.isSplit = true;
        entry.hasT2 = !!s.teacherId;
      } else if (s.groupType === "GROUP_1") {
        entry.isSplit = true;
        entry.hasT1 = !!s.teacherId;
      } else {
        entry.hasT1 = !!s.teacherId;
      }
    });

    const totalCount = uniqueSubjectMap.size;
    let assignedCount = 0;
    uniqueSubjectMap.forEach((entry) => {
      if (entry.isSplit) {
        if (entry.hasT1 && entry.hasT2) assignedCount++;
      } else {
        if (entry.hasT1) assignedCount++;
      }
    });

    return {
      totalSubjectsCount: totalCount,
      assignedSubjectsCount: assignedCount,
      unassignedSubjectsCount: totalCount - assignedCount,
    };
  }, [cls.subjects]);

  const blockedDaysCount = (cls.blockedDays || (cls.grade <= 4 ? [6] : [])).length;

  return (
    <div
      className={`flex flex-col justify-between p-4 rounded-3xl border transition-all bg-card/80 hover:bg-card hover:shadow-lg min-w-0 overflow-hidden ${
        cls.isClosed
          ? "opacity-60 border-slate-200 dark:border-slate-800"
          : !homeroom
          ? "border-amber-300/80 dark:border-amber-800/60 hover:border-amber-400"
          : unassignedSubjectsCount > 0
          ? "border-amber-500/30 hover:border-amber-500/60"
          : "border-border/80 hover:border-primary/40"
      }`}
    >
      <div className="min-w-0">
        {/* Top card header: Sinf nomi va Qulflash/Tahrirlash/O'chirish */}
        <div className="flex items-center justify-between gap-2 mb-2.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm shadow-inner shrink-0">
              {cls.name}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-foreground text-sm flex items-center gap-1.5 flex-wrap">
                <span>{cls.name}</span>
                {cls.grade <= 4 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 font-bold border border-amber-500/20 shrink-0 whitespace-nowrap">
                    5 kunlik
                  </span>
                )}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleLock(cls.id);
              }}
              title={
                isLocked
                  ? "🔒 Dars jadvali qulflangan (Generatsiyada darslar o'zgarmaydi). Ochish uchun bosing"
                  : "🔓 Dars jadvalini qulflash"
              }
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                isLocked
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {isLocked ? <Lock className="w-4 h-4 text-rose-600" /> : <Unlock className="w-4 h-4 text-slate-400" />}
            </button>
            <button
              onClick={() => onEdit(cls)}
              title="Tahrirlash va dars cheklovlari"
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-blue-500" />
            </button>
            <button
              onClick={() => onDelete(cls.id)}
              title="O'chirish"
              className="p-1.5 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
            </button>
          </div>
        </div>

        {/* Smena va O'quvchilar qatori */}
        <div className="flex items-center justify-between gap-1.5 py-1.5 px-2.5 rounded-xl bg-muted/40 border border-border/50 mb-2.5">
          <button
            type="button"
            onClick={(e) => onToggleShift(cls, e)}
            title="Smenani almashtirish uchun bosing (1-smena <-> 2-smena)"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer border shadow-2xs whitespace-nowrap ${
              isShift2
                ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/25"
                : "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
            }`}
          >
            {isShift2 ? (
              <Sunset className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <span>{isShift2 ? "🌤️ 2-smena" : "☀️ 1-smena"}</span>
          </button>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold shrink-0">
            <span>{cls.studentCount || 25} o'quvchi</span>
            {blockedDaysCount > 0 && (
              <span className="text-rose-500 text-[10px] font-bold">• {blockedDaysCount} dam</span>
            )}
          </div>
        </div>

        {/* Badges & Homeroom */}
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1 text-[11px]">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground/70" />
              {branch?.name || "Asosiy bino"}
            </span>
            <span className="font-semibold text-foreground text-[11px]">{totalHours} soat/hafta</span>
          </div>

          {/* O'quv rejasi va ustozlar ta'minlanganligi statusi */}
          <div>
            {totalSubjectsCount === 0 ? (
              <div className="flex items-center gap-1.5 p-1.5 px-2 rounded-xl bg-muted/60 text-muted-foreground text-[10px] font-semibold">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                <span>O'quv rejasi belgilanmagan</span>
              </div>
            ) : unassignedSubjectsCount > 0 ? (
              <div className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                <div className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>{unassignedSubjectsCount} ta fan ustozsiz</span>
                </div>
                <span className="opacity-80">
                  ({assignedSubjectsCount}/{totalSubjectsCount})
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between p-1.5 px-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                <div className="flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span>Barcha fanlar ustozli</span>
                </div>
                <span>
                  ({totalSubjectsCount}/{totalSubjectsCount})
                </span>
              </div>
            )}
          </div>

          {/* Homeroom teacher badge */}
          <div className="pt-1">
            {homeroom ? (
              <div
                onClick={() => onOpenQuickHomeroom(cls)}
                className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 cursor-pointer hover:opacity-90 transition-opacity"
                title="Sinf rahbarini o'zgartirish"
              >
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-[11px] font-bold truncate">{homeroom.fullName}</span>
                </div>
                <span className="text-[9px] underline opacity-70 shrink-0 ml-1">o'zgartirish</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onOpenQuickHomeroom(cls)}
                className="w-full flex items-center justify-center gap-1.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-dashed border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 font-semibold text-[11px] hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Sinf rahbari tayinlash</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom button: Curriculum & Teacher Assignment */}
      <div className="mt-3 pt-3 border-t border-border/60">
        <button
          onClick={() => onOpenCurriculum(cls)}
          className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs ${
            unassignedSubjectsCount > 0
              ? "bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30"
              : totalSubjectsCount === 0
              ? "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
              : "bg-muted/50 hover:bg-primary/10 text-foreground hover:text-primary border border-border/50"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>
            {totalSubjectsCount === 0
              ? "⚡ O'quv rejasini yuklash"
              : unassignedSubjectsCount > 0
              ? `📚 Ustozlarni tayinlash (${assignedSubjectsCount}/${totalSubjectsCount})`
              : `📚 O'quv rejasi (${totalSubjectsCount} fan)`}
          </span>
        </button>
      </div>
    </div>
  );
};
