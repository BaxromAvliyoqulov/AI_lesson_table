import React from "react";
import { SchoolClass, Subject, Teacher, Lesson } from "@/types";
import { Edit2, X, Lock, Unlock, UserCheck, Trash2 } from "lucide-react";
import { DAYS } from "./types";

interface Official39CellModalProps {
  isOpen: boolean;
  cellModal: {
    cls: SchoolClass;
    day: number;
    period: number;
    lesson?: Lesson;
  };
  subjects: Subject[];
  teachers: Teacher[];
  selectedSubjectId: string;
  selectedTeacherId: string;
  onSubjectChange: (id: string) => void;
  onTeacherChange: (id: string) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
  onToggleLock: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onOpenZamena?: (lesson: Lesson) => void;
}

export const Official39CellModal: React.FC<Official39CellModalProps> = ({
  isOpen,
  cellModal,
  subjects,
  teachers,
  selectedSubjectId,
  selectedTeacherId,
  onSubjectChange,
  onTeacherChange,
  onSave,
  onClose,
  onToggleLock,
  onDeleteLesson,
  onOpenZamena,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in no-print">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {cellModal.cls.name} &bull; {DAYS.find((d) => d.id === cellModal.day)?.name} {cellModal.period}-dars
              </h3>
              <p className="text-[11px] text-slate-500">
                {cellModal.lesson ? "Dars ma'lumotlarini tahrirlash" : "Yangi dars tayinlash"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fan:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.shortName || s.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              O'qituvchi (№ Tartib raqami bilan):
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => onTeacherChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
            >
              {teachers.map((t, idx) => (
                <option key={t.id} value={t.id}>
                  №{idx + 1} &bull; {t.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Zamena va Lock tugmalari (agar dars mavjud bo'lsa) */}
          {cellModal.lesson && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onToggleLock(cellModal.lesson!.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  cellModal.lesson.isLocked
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                {cellModal.lesson.isLocked ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Qulflangan</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Qulflash</span>
                  </>
                )}
              </button>

              {onOpenZamena && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenZamena(cellModal.lesson!);
                    onClose();
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Zamena</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onDeleteLesson(cellModal.lesson!.id)}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                title="Darsni o'chirish"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 cursor-pointer transition-all"
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
