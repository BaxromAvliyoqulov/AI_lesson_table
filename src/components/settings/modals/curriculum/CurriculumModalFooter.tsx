import React from "react";

interface CurriculumModalFooterProps {
  subjectsCount: number;
  academicHours: number;
  homeroomHours: number;
  totalWeeklyHours: number;
  onClose: () => void;
  onSave: () => void;
}

export const CurriculumModalFooter: React.FC<CurriculumModalFooterProps> = ({
  subjectsCount,
  academicHours,
  homeroomHours,
  totalWeeklyHours,
  onClose,
  onSave,
}) => {
  return (
    <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-t border-border/80 bg-muted/30 shrink-0">
      <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
        <span className="font-extrabold text-foreground">{subjectsCount} ta fan</span>
        <span>•</span>
        <span className="font-semibold text-foreground">{academicHours} soat asosiy</span>
        <span>+</span>
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
          {homeroomHours} soat Kelajak soati
        </span>
        <span>=</span>
        <span className="font-black text-primary text-sm">{totalWeeklyHours} soat jami</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
        >
          Bekor qilish
        </button>
        <button
          type="button"
          onClick={onSave}
          className="px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all cursor-pointer active:scale-95"
        >
          Yuklamani Saqlash
        </button>
      </div>
    </div>
  );
};
