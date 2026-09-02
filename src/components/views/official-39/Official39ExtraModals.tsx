import React from "react";
import { SchoolClass, Teacher } from "@/types";
import { Settings, X, Save, Users } from "lucide-react";

interface Official39RequisitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  requisitesForm: {
    name: string;
    region: string;
    directorName: string;
    vicePrincipalName: string;
    psychologistName: string;
    academicYear: string;
    approvalDate: string;
  };
  setRequisitesForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      region: string;
      directorName: string;
      vicePrincipalName: string;
      psychologistName: string;
      academicYear: string;
      approvalDate: string;
    }>
  >;
  onSave: (e: React.FormEvent) => void;
}

export const Official39RequisitesModal: React.FC<Official39RequisitesModalProps> = ({
  isOpen,
  onClose,
  requisitesForm,
  setRequisitesForm,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in no-print">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white text-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Maktab va Dars Jadvali Rekvizitlari
              </h3>
              <p className="text-[11px] text-slate-500">
                Chop etiladigan rasmiy hujjatdagi sarlavha va imzolarni o'zgartirish
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

        <form onSubmit={onSave} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Maktab nomi:
              </label>
              <input
                type="text"
                required
                value={requisitesForm.name}
                onChange={(e) => setRequisitesForm({ ...requisitesForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tuman / Hudud:
              </label>
              <input
                type="text"
                required
                value={requisitesForm.region}
                onChange={(e) => setRequisitesForm({ ...requisitesForm, region: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Maktab Direktori F.I.Sh:
              </label>
              <input
                type="text"
                required
                value={requisitesForm.directorName}
                onChange={(e) => setRequisitesForm({ ...requisitesForm, directorName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                O'quv ishlari bo'yicha zauch F.I.Sh:
              </label>
              <input
                type="text"
                required
                value={requisitesForm.vicePrincipalName}
                onChange={(e) => setRequisitesForm({ ...requisitesForm, vicePrincipalName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Ruhshunos F.I.Sh:
              </label>
              <input
                type="text"
                value={requisitesForm.psychologistName}
                onChange={(e) => setRequisitesForm({ ...requisitesForm, psychologistName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                O'quv yili:
              </label>
              <input
                type="text"
                required
                value={requisitesForm.academicYear}
                onChange={(e) => setRequisitesForm({ ...requisitesForm, academicYear: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tasdiqlash sanasi:
              </label>
              <input
                type="text"
                required
                value={requisitesForm.approvalDate}
                onChange={(e) => setRequisitesForm({ ...requisitesForm, approvalDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Rekvizitlarni saqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface Official39HomeroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  cls: SchoolClass;
  teachers: Teacher[];
  teacherSubjectsMap: Map<string, string>;
  selectedTeacherId: string;
  onSelectedTeacherChange: (id: string) => void;
  onSave: () => void;
}

export const Official39HomeroomModal: React.FC<Official39HomeroomModalProps> = ({
  isOpen,
  onClose,
  cls,
  teachers,
  teacherSubjectsMap,
  selectedTeacherId,
  onSelectedTeacherChange,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in no-print">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-900 p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {cls.name} — Sinf Rahbarini Tayinlash
              </h3>
              <p className="text-[11px] text-slate-500">
                Sinf rahbari o'zgarganda Juma kungi Sinf soati va imzolar avtomatik yangilanadi
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

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Sinf Rahbari (O'qituvchi):
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => onSelectedTeacherChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- O'qituvchini tanlang --</option>
              {teachers.map((t) => {
                const subjectsStr = teacherSubjectsMap.get(t.id) || "";
                return (
                  <option key={t.id} value={t.id}>
                    {t.fullName} {subjectsStr ? `(${subjectsStr})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
            <p className="font-bold mb-0.5">⚡ Avtomatik Zanjir (SaaS Reactive Sync):</p>
            <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-blue-800">
              <li>Jadvalning eng pastki qatoridagi <strong>Sinf rahbar</strong> F.I.Sh yangilanadi.</li>
              <li>Juma kuni 1-dars <strong>Sinf soati</strong> darsiga ushbu ustoz va uning tartib raqami (№) biriktiriladi.</li>
              <li>O'qituvchilar va fanlar reestrida o'zgarishlar sinxron aks etadi.</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={onSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 cursor-pointer transition-all"
          >
            Saqlash va Sinxronlash
          </button>
        </div>
      </div>
    </div>
  );
};
