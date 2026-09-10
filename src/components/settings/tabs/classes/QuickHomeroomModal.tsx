import React from "react";
import { SchoolClass, Teacher } from "@/types";
import { TeacherSelectCombobox } from "../../shared/TeacherSelectCombobox";
import { X } from "lucide-react";

interface QuickHomeroomModalProps {
  quickClass: SchoolClass | null;
  teachers: Teacher[];
  quickTeacherId: string;
  setQuickTeacherId: (id: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const QuickHomeroomModal: React.FC<QuickHomeroomModalProps> = ({
  quickClass,
  teachers,
  quickTeacherId,
  setQuickTeacherId,
  onClose,
  onSave,
}) => {
  if (!quickClass) return null;

  return (
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
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">O&apos;qituvchi tanlang:</label>
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
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-semibold border border-border rounded-xl hover:bg-muted cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 cursor-pointer shadow-xs"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};
