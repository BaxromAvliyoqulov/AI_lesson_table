import React from "react";

interface TeacherWorkloadFooterProps {
  totalAssignmentsCount: number;
  totalAssignedHours: number;
  totalHomeroomHours: number;
  totalPhysicalHours: number;
  onClose: () => void;
  onSave: () => void;
}

export const TeacherWorkloadFooter: React.FC<TeacherWorkloadFooterProps> = ({
  totalAssignmentsCount,
  totalAssignedHours,
  totalHomeroomHours,
  totalPhysicalHours,
  onClose,
  onSave,
}) => {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-t border-border/80 bg-muted/20 shrink-0">
      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
        <span className="font-bold text-foreground">
          {totalAssignmentsCount} ta fan
        </span>
        <span>•</span>
        <span className="font-black text-indigo-600 dark:text-indigo-400">
          {totalAssignedHours} soat dars stavkasi
        </span>
        {totalHomeroomHours > 0 && (
          <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-100/90 dark:bg-purple-950/50 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
            +{totalHomeroomHours} soat sinf soati
          </span>
        )}
        <span className="text-[11px] text-muted-foreground font-semibold">
          (Jami darslar: {totalPhysicalHours} soat)
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
          onClick={onSave}
          className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          Yuklamani Saqlash
        </button>
      </div>
    </div>
  );
};
