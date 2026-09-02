"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  Calendar,
  Layers,
  FileSpreadsheet,
  Printer,
  Trash2,
  Edit2,
  ArrowRight,
  X,
  AlertTriangle,
  RotateCcw,
  Check,
} from "lucide-react";
import { Schedule, Lesson } from "@/types";
import {
  getSchoolScheduleVersions,
  createScheduleVersionAction,
  restoreScheduleVersionAction,
  renameScheduleVersionAction,
  deleteScheduleVersionAction,
} from "@/lib/actions/schedule.actions";

interface ScheduleVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolId: string;
  currentLessons: Lesson[];
  academicYear?: string;
  onVersionRestored: (lessons: Lesson[], scheduleName: string) => void;
  showToast: (text: string, type?: "success" | "error" | "info") => void;
  onPrintA3?: () => void;
}

export const ScheduleVersionsModal: React.FC<ScheduleVersionsModalProps> = ({
  isOpen,
  onClose,
  schoolId,
  currentLessons = [],
  academicYear = "2025 - 2026",
  onVersionRestored,
  showToast,
  onPrintA3,
}) => {
  const [versions, setVersions] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Load versions from database
  const loadVersions = async () => {
    setIsLoading(true);
    try {
      const res = await getSchoolScheduleVersions(schoolId);
      if (res.success && res.data) {
        setVersions(res.data);
      }
    } catch (err) {
      console.error("Versiyalarni yuklash xatosi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, schoolId]);

  if (!isOpen) return null;

  // Save current timetable as new version
  const handleSaveNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionName.trim()) {
      showToast("Versiya nomini kiriting!", "error");
      return;
    }
    if (currentLessons.length === 0) {
      showToast("Saqlash uchun avval dars jadvalini tuzing!", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await createScheduleVersionAction(
        schoolId,
        newVersionName.trim(),
        currentLessons,
        academicYear,
        1,
        false
      );

      if (res.success) {
        showToast(`✅ "${newVersionName}" versiyasi muvaffaqiyatli saqlandi!`);
        setNewVersionName("");
        await loadVersions();
      } else {
        showToast(res.error || "Versiyani saqlashda xatolik yuz berdi", "error");
      }
    } catch (err: any) {
      showToast("Xatolik: " + err?.message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Restore/Activate version
  const handleRestoreVersion = async (v: Schedule) => {
    try {
      const res = await restoreScheduleVersionAction(schoolId, v.id);
      if (res.success && res.data) {
        onVersionRestored(res.data.lessons, res.data.schedule.name);
        showToast(`✅ "${v.name}" versiyasi qayta yuklandi va faol holatga o'tkazildi!`);
        await loadVersions();
        onClose();
      } else {
        showToast(res.error || "Versiyani tiklashda xatolik yuz berdi", "error");
      }
    } catch (err: any) {
      showToast("Tiklashda xatolik: " + err?.message, "error");
    }
  };

  // Rename version
  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      const res = await renameScheduleVersionAction(schoolId, id, editingName.trim());
      if (res.success) {
        showToast("Versiya nomi muvaffaqiyatli o'zgartirildi!");
        setEditingId(null);
        await loadVersions();
      }
    } catch (err: any) {
      showToast("Xatolik: " + err?.message, "error");
    }
  };

  // Delete version
  const handleDelete = async (id: string) => {
    try {
      const res = await deleteScheduleVersionAction(schoolId, id);
      if (res.success) {
        showToast("Versiya o'chirildi!");
        setDeletingId(null);
        await loadVersions();
      } else {
        showToast(res.error || "O'chirishda xatolik yuz berdi", "error");
      }
    } catch (err: any) {
      showToast("O'chirishda xatolik: " + err?.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[90vh] bg-card text-foreground rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Dars Jadvali Versiyalari va Arxiv Boshqaruvi
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-extrabold bg-blue-500/15 text-blue-600 rounded-full border border-blue-500/30">
                  {versions.length} ta versiya
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Istalgan dars jadvalini nom bilan saqlang, arxivlang va kerakli paytda 1 bosishda qayta yuklang
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Save Current as New Version Form */}
        <div className="p-5 border-b border-border bg-muted/20">
          <form onSubmit={handleSaveNewVersion} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Save className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Yangi versiya nomini kiriting (masalan: 1-chorak rasmiy jadvali, Oktyabr varianti)..."
                value={newVersionName}
                onChange={(e) => setNewVersionName(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSaving || !newVersionName.trim()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isSaving ? "Saqlanmoqda..." : "Hozirgi Jadvalni Saqlash"}</span>
            </button>
          </form>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Hozirgi ekrandagi {currentLessons.length} ta dars to'liq snapshot sifatida saqlanadi.</span>
          </div>
        </div>

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
              Versiyalar bazadan yuklanmoqda...
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center">
              <History className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-foreground">Hozircha saqlangan versiyalar yo'q</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Yuqoridagi maydonga nom berib, hozirgi dars jadvalingizni birinchi versiya sifatida saqlang!
              </p>
            </div>
          ) : (
            versions.map((v) => {
              const isEditing = editingId === v.id;
              const isDeleting = deletingId === v.id;

              return (
                <div
                  key={v.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${
                    v.isActive
                      ? "border-emerald-500/50 bg-emerald-500/5 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                      : "border-border bg-card hover:border-blue-500/30"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 flex-1 max-w-md">
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="flex-1 px-3 py-1 text-xs font-bold rounded-lg border border-border bg-card focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRename(v.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
                            title="Saqlash"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Bekor qilish"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span>{v.name}</span>
                          <button
                            onClick={() => {
                              setEditingId(v.id);
                              setEditingName(v.name);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            title="Nomini tahrirlash"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </h3>
                      )}

                      {v.isActive ? (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Hozirgi Faol Jadval
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-muted text-muted-foreground rounded-full">
                          Arxivlangan versiya
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" />
                        {new Date(v.createdAt).toLocaleDateString("uz-UZ", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-indigo-500" />
                        {v.lessonsCount || currentLessons.length} ta dars
                      </span>
                      <span className="font-semibold text-foreground/80">
                        {v.academicYear} o'quv yili
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {!v.isActive && (
                      <button
                        onClick={() => handleRestoreVersion(v)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-all cursor-pointer"
                        title="Ushbu versiyani faollashtirish va tahrirlash"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Faollashtirish</span>
                      </button>
                    )}

                    {onPrintA3 && (
                      <button
                        onClick={onPrintA3}
                        className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
                        title="A3 Formatda chop etish"
                      >
                        <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    )}

                    {isDeleting ? (
                      <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-xl border border-rose-500/20">
                        <span className="text-[10px] font-bold text-rose-600 px-1">O'chirish?</span>
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 cursor-pointer"
                        >
                          Ha
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className="px-2 py-0.5 text-[10px] font-bold bg-muted text-muted-foreground rounded-lg cursor-pointer"
                        >
                          Yo'q
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingId(v.id)}
                        disabled={v.isActive && versions.length === 1}
                        className="p-2 rounded-xl border border-border bg-card hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer disabled:opacity-30"
                        title="Versiyani o'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            Barcha versiyalar Neon PostgreSQL bulutida xavfsiz va abadiy saqlanadi.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
};
