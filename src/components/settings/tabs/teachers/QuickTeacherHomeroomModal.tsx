import React from "react";
import { Teacher, SchoolClass } from "@/types";
import { ClassSelectCombobox } from "../../shared/ClassSelectCombobox";
import { GraduationCap, X } from "lucide-react";

interface QuickTeacherHomeroomModalProps {
  teacher: Teacher | null;
  classes: SchoolClass[];
  quickClassId: string;
  setQuickClassId: (id: string) => void;
  onClose: () => void;
  onSave: () => void;
  onRemoveHomeroom: () => void;
}

export const QuickTeacherHomeroomModal: React.FC<QuickTeacherHomeroomModalProps> = ({
  teacher,
  classes,
  quickClassId,
  setQuickClassId,
  onClose,
  onSave,
  onRemoveHomeroom,
}) => {
  if (!teacher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border/80">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-sm text-foreground truncate">
                Sinf Rahbarligini Belgilash
              </h3>
              <p className="text-xs text-primary font-semibold truncate">
                {teacher.fullName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <label className="block text-xs font-semibold text-muted-foreground">
            Biriktiriladigan sinfni tanlang:
          </label>

          <ClassSelectCombobox
            classes={classes}
            value={quickClassId}
            onChange={(cId) => setQuickClassId(cId)}
            placeholder="Sinfni qidiring..."
          />

          <p className="text-[11px] text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/60">
            💡 Sinf rahbari biriktirilganda, ushbu sinfning <strong>Dushanba 1-soat</strong> dars jadvaliga avtomatik tarzda &quot;Kelajak soati&quot; belgilanadi.
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border/80">
          <button
            type="button"
            onClick={onRemoveHomeroom}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            Rahbarlikni bekor qilish
          </button>

          <div className="flex items-center gap-2">
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
              disabled={!quickClassId}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              Biriktirish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
