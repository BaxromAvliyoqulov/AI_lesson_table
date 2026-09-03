"use client";

import React, { useState, useMemo } from "react";
import { Subject } from "@/types";
import { getSanPiNBadge } from "@/lib/utils";
import { getOfficialMethodDayForSubject } from "@/lib/constants/method-days";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  DoorOpen,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Power,
  SlidersHorizontal,
} from "lucide-react";

export const STANDARD_UZBEK_SUBJECTS: Array<{
  id: string;
  name: string;
  shortName: string;
  colorTag: string;
  difficultyScore: number;
  allowDoubleLesson: boolean;
  requiresRoomType?: "LAB" | "COMP_LAB" | "GYM" | "GENERAL" | null;
  methodDayOfWeek: number | null;
  category?: string;
}> = [
  // ── I. FILOLOGIYA FANLARI ──────────────────────────────────
  { id: "sub_ona", name: "Ona tili", shortName: "Ona tili", colorTag: "#EC4899", difficultyScore: 9, allowDoubleLesson: false, methodDayOfWeek: 2, category: "Filologiya fanlari" },
  { id: "sub_oqish", name: "O'qish savodxonligi", shortName: "O'qish", colorTag: "#F43F5E", difficultyScore: 7, allowDoubleLesson: false, methodDayOfWeek: 2, category: "Filologiya fanlari" },
  { id: "sub_adab", name: "Adabiyot", shortName: "Adabiyot", colorTag: "#DB2777", difficultyScore: 8, allowDoubleLesson: false, methodDayOfWeek: 2, category: "Filologiya fanlari" },
  { id: "sub_rus", name: "Rus tili", shortName: "Rus tili", colorTag: "#A855F7", difficultyScore: 8, allowDoubleLesson: false, methodDayOfWeek: 2, category: "Filologiya fanlari" },
  { id: "sub_chet_tili", name: "Chet tili", shortName: "Chet tili", colorTag: "#8B5CF6", difficultyScore: 8, allowDoubleLesson: false, methodDayOfWeek: 5, category: "Filologiya fanlari" },
  { id: "sub_ing", name: "Ingliz tili", shortName: "Ingliz tili", colorTag: "#7C3AED", difficultyScore: 8, allowDoubleLesson: false, methodDayOfWeek: 5, category: "Filologiya fanlari" },
  { id: "sub_nemis", name: "Nemis tili", shortName: "Nemis tili", colorTag: "#9333EA", difficultyScore: 8, allowDoubleLesson: false, methodDayOfWeek: 5, category: "Filologiya fanlari" },
  { id: "sub_fransuz", name: "Fransuz tili", shortName: "Fransuz tili", colorTag: "#6D28D9", difficultyScore: 8, allowDoubleLesson: false, methodDayOfWeek: 5, category: "Filologiya fanlari" },

  // ── II. IJTIMOIY FANLAR ────────────────────────────────────
  { id: "sub_tarixdan_hikoyalar", name: "Tarixdan hikoyalar", shortName: "Tarixdan hik.", colorTag: "#EA580C", difficultyScore: 6, allowDoubleLesson: false, methodDayOfWeek: 4, category: "Ijtimoiy fanlar" },
  { id: "sub_qadimgi_dunyo", name: "Qadimgi dunyo tarixi", shortName: "Qadimgi tarix", colorTag: "#C2410C", difficultyScore: 7, allowDoubleLesson: false, methodDayOfWeek: 4, category: "Ijtimoiy fanlar" },
  { id: "sub_ozb_tar", name: "O'zbekiston tarixi", shortName: "O'zb. Tarixi", colorTag: "#D97706", difficultyScore: 7, allowDoubleLesson: false, methodDayOfWeek: 4, category: "Ijtimoiy fanlar" },
  { id: "sub_jahon_tar", name: "Jahon tarixi", shortName: "Jahon tarixi", colorTag: "#B45309", difficultyScore: 7, allowDoubleLesson: false, methodDayOfWeek: 4, category: "Ijtimoiy fanlar" },
  { id: "sub_tar", name: "Tarix", shortName: "Tarix", colorTag: "#F59E0B", difficultyScore: 7, allowDoubleLesson: false, methodDayOfWeek: 4, category: "Ijtimoiy fanlar" },
  { id: "sub_huquq", name: "Davlat va huquq asoslari", shortName: "Huquq", colorTag: "#64748B", difficultyScore: 5, allowDoubleLesson: false, methodDayOfWeek: 4, category: "Ijtimoiy fanlar" },
  { id: "sub_tarbiya", name: "Tarbiya", shortName: "Tarbiya", colorTag: "#F97316", difficultyScore: 3, allowDoubleLesson: false, methodDayOfWeek: 4, category: "Ijtimoiy fanlar" },

  // ── III. ANIQ FANLAR ───────────────────────────────────────
  { id: "sub_mat", name: "Matematika", shortName: "Matematika", colorTag: "#3B82F6", difficultyScore: 11, allowDoubleLesson: false, methodDayOfWeek: 3, category: "Aniq fanlar" },
  { id: "sub_alg", name: "Algebra", shortName: "Algebra", colorTag: "#2563EB", difficultyScore: 12, allowDoubleLesson: false, methodDayOfWeek: 3, category: "Aniq fanlar" },
  { id: "sub_geom", name: "Geometriya", shortName: "Geometriya", colorTag: "#1D4ED8", difficultyScore: 10, allowDoubleLesson: false, methodDayOfWeek: 3, category: "Aniq fanlar" },
  { id: "sub_inf", name: "Informatika va axborot texnologiyalari", shortName: "Informatika", colorTag: "#6366F1", difficultyScore: 8, allowDoubleLesson: false, requiresRoomType: "COMP_LAB", methodDayOfWeek: 3, category: "Aniq fanlar" },

  // ── IV. TABIIY VA IQTISODIY FANLAR ─────────────────────────
  { id: "sub_fiz", name: "Fizika", shortName: "Fizika", colorTag: "#06B6D4", difficultyScore: 10, allowDoubleLesson: false, requiresRoomType: "LAB", methodDayOfWeek: 6, category: "Tabiiy va iqtisodiy fanlar" },
  { id: "sub_astronomiya", name: "Astronomiya", shortName: "Astronomiya", colorTag: "#0284C7", difficultyScore: 6, allowDoubleLesson: false, methodDayOfWeek: 6, category: "Tabiiy va iqtisodiy fanlar" },
  { id: "sub_kim", name: "Kimyo", shortName: "Kimyo", colorTag: "#10B981", difficultyScore: 10, allowDoubleLesson: false, requiresRoomType: "LAB", methodDayOfWeek: 6, category: "Tabiiy va iqtisodiy fanlar" },
  { id: "sub_bio", name: "Biologiya", shortName: "Biologiya", colorTag: "#84CC16", difficultyScore: 7, allowDoubleLesson: false, methodDayOfWeek: 6, category: "Tabiiy va iqtisodiy fanlar" },
  { id: "sub_geo", name: "Geografiya", shortName: "Geografiya", colorTag: "#14B8A6", difficultyScore: 6, allowDoubleLesson: false, methodDayOfWeek: 4, category: "Tabiiy va iqtisodiy fanlar" },
  { id: "sub_iqtisod", name: "Iqtisodiy bilim asoslari", shortName: "Iqtisod", colorTag: "#059669", difficultyScore: 4, allowDoubleLesson: false, methodDayOfWeek: 4, category: "Tabiiy va iqtisodiy fanlar" },
  { id: "sub_tadbirkor", name: "Tadbirkorlik asoslari", shortName: "Tadbirkorlik", colorTag: "#0D9488", difficultyScore: 4, allowDoubleLesson: false, methodDayOfWeek: 4, category: "Tabiiy va iqtisodiy fanlar" },
  { id: "sub_tabiiy", name: "Tabiiy fan (Science)", shortName: "Tabiiy fan", colorTag: "#10B981", difficultyScore: 7, allowDoubleLesson: false, methodDayOfWeek: 6, category: "Tabiiy va iqtisodiy fanlar" },

  // ── V. AMALIY FANLAR ───────────────────────────────────────
  { id: "sub_musiqa", name: "Musiqa madaniyati", shortName: "Musiqa", colorTag: "#F43F5E", difficultyScore: 1, allowDoubleLesson: false, methodDayOfWeek: 6, category: "Amaliy fanlar" },
  { id: "sub_sanat", name: "Tasviriy san'at", shortName: "Tasviriy san'at", colorTag: "#D946EF", difficultyScore: 1, allowDoubleLesson: false, methodDayOfWeek: 6, category: "Amaliy fanlar" },
  { id: "sub_chiz", name: "Chizmachilik", shortName: "Chizmachilik", colorTag: "#C026D3", difficultyScore: 3, allowDoubleLesson: false, methodDayOfWeek: 6, category: "Amaliy fanlar" },
  { id: "sub_texno", name: "Texnologiya", shortName: "Texnologiya", colorTag: "#EA580C", difficultyScore: 3, allowDoubleLesson: false, methodDayOfWeek: 6, category: "Amaliy fanlar" },
  { id: "sub_jism", name: "Jismoniy tarbiya", shortName: "Jismoniy", colorTag: "#EF4444", difficultyScore: 2, allowDoubleLesson: false, requiresRoomType: "GYM", methodDayOfWeek: 6, category: "Amaliy fanlar" },
  { id: "sub_chqbt", name: "Chaqiruvga qadar boshlang'ich tayyorgarlik", shortName: "CHQBT", colorTag: "#475569", difficultyScore: 3, allowDoubleLesson: false, methodDayOfWeek: 6, category: "Amaliy fanlar" },

  // ── MAJBURIY TARBIYAVIY SOAT ────────────────────────────────
  { id: "sub_sinf_soati", name: "Kelajak soati", shortName: "Kelajak s.", colorTag: "#8B5CF6", difficultyScore: 1, allowDoubleLesson: false, methodDayOfWeek: 1, category: "Majburiy" },
];

interface SubjectsTabProps {
  subjects: Subject[];
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
  onToggleActive?: (subjectId: string, newState?: boolean) => void;
  onAddPresetSubject?: (preset: Partial<Subject>) => void;
}

const WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

const ROOM_TYPE_LABELS: Record<string, string> = {
  GENERAL: "Oddiy xona",
  GYM: "Sport zal",
  COMP_LAB: "Informatika xonasi",
  LAB: "Laboratoriya",
  OUTDOOR_PITCH: "Ochiq maydon",
};

export const SubjectsTab: React.FC<SubjectsTabProps> = ({
  subjects,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
  onToggleActive,
  onAddPresetSubject,
}) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // O'chirish tasdiqlash modali va toast
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };
  const [selectedPresetId, setSelectedPresetId] = useState("");

  const activeCount = useMemo(
    () => subjects.filter((s) => s.isActive !== false).length,
    [subjects]
  );
  const inactiveCount = subjects.length - activeCount;

  const existingSubjectNames = useMemo(
    () => new Set(subjects.map((s) => s.name.toLowerCase().trim())),
    [subjects]
  );

  // Available presets that are not yet added
  const missingPresets = useMemo(() => {
    return STANDARD_UZBEK_SUBJECTS.filter(
      (p) =>
        !existingSubjectNames.has(p.name.toLowerCase().trim()) &&
        !subjects.some((s) => s.id === p.id)
    );
  }, [existingSubjectNames, subjects]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      // 1. Status Filter
      if (statusFilter === "ACTIVE" && s.isActive === false) return false;
      if (statusFilter === "INACTIVE" && s.isActive !== false) return false;

      // 2. Search Query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.shortName && s.shortName.toLowerCase().includes(q))
      );
    });
  }, [subjects, search, statusFilter]);

  const handleAddPreset = () => {
    if (!selectedPresetId || !onAddPresetSubject) return;
    const preset = STANDARD_UZBEK_SUBJECTS.find((p) => p.id === selectedPresetId);
    if (!preset) return;

    onAddPresetSubject({
      id: `${preset.id}_${Date.now()}`,
      name: preset.name,
      shortName: preset.shortName,
      colorTag: preset.colorTag,
      difficultyScore: preset.difficultyScore,
      allowDoubleLesson: preset.allowDoubleLesson,
      requiresRoomType: preset.requiresRoomType || null,
      methodDayOfWeek: preset.methodDayOfWeek,
      isActive: true,
    });

    setSelectedPresetId("");
  };

  const handleAddAllMissingPresets = () => {
    if (!onAddPresetSubject || missingPresets.length === 0) return;
    missingPresets.forEach((preset, idx) => {
      onAddPresetSubject({
        id: `${preset.id}_${Date.now()}_${idx}`,
        name: preset.name,
        shortName: preset.shortName,
        colorTag: preset.colorTag,
        difficultyScore: preset.difficultyScore,
        allowDoubleLesson: preset.allowDoubleLesson,
        requiresRoomType: preset.requiresRoomType || null,
        methodDayOfWeek: preset.methodDayOfWeek,
        isActive: true,
      });
    });
    showToast(`${missingPresets.length} ta rasmiy fan muvaffaqiyatli qo'shildi!`, "success");
  };

  return (
    <div className="space-y-4">
      {/* ── TOP TOOLBAR ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 p-4 rounded-3xl bg-card border border-border min-w-0 shadow-xs">
        {/* Chap: Qidiruv va Status Filtrlari */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 min-w-0">
          <div className="relative flex-1 sm:max-w-xs min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Fan nomi bo'yicha qidiring..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-2xl border border-border shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-background text-foreground shadow-xs border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Barchasi ({subjects.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-xs"
                  : "text-muted-foreground hover:text-emerald-600"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Faol ({activeCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("INACTIVE")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                statusFilter === "INACTIVE"
                  ? "bg-muted text-foreground border border-border shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
              <span>Nofaol ({inactiveCount})</span>
            </button>
          </div>
        </div>

        {/* O'ng: Tezkor Standart Qo'shish + Yangi Fan */}
        <div className="flex items-center gap-2 flex-wrap min-w-0 justify-end">
          {/* Quick preset subject addition */}
          {onAddPresetSubject && missingPresets.length > 0 && (
            <div className="flex items-center gap-1.5 min-w-0">
              <select
                value={selectedPresetId}
                onChange={(e) => setSelectedPresetId(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-border bg-background cursor-pointer max-w-[190px] truncate font-medium"
              >
                <option value="">⚡ Standart fanni tanlash...</option>
                {missingPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    + {p.name} ({p.difficultyScore} ball)
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddPreset}
                disabled={!selectedPresetId}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-200 border border-amber-500/30 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0"
                title="Tanlangan standart fanni maktab katalogiga qo'shish"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Qo'shish</span>
              </button>

              <button
                type="button"
                onClick={handleAddAllMissingPresets}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 hover:bg-blue-500/25 transition-all cursor-pointer shrink-0"
                title="MMTV rasmiy jadvalidagi barcha yetishmayotgan fanlarni maktabga qo'shish"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Barchasini to&apos;ldirish ({missingPresets.length})</span>
              </button>
            </div>
          )}

          <button
            onClick={onAddSubject}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi fan qo'shish</span>
          </button>
        </div>
      </div>

      {/* ── SUBJECTS GRID ────────────────────────────────────────────────────── */}
      {filteredSubjects.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Fan topilmadi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Qidiruv so'zini o'zgartiring yoki yuqoridagi filtrlarni tekshiring
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 min-w-0">
          {filteredSubjects.map((subject) => {
            const sanpin = getSanPiNBadge(subject.difficultyScore);
            const isActive = subject.isActive !== false;

            return (
              <div
                key={subject.id}
                className={`flex flex-col justify-between p-4 rounded-3xl border transition-all min-w-0 overflow-hidden ${
                  isActive
                    ? "border-border/80 bg-card/90 hover:bg-card hover:border-primary/40 hover:shadow-lg"
                    : "border-border/40 bg-muted/20 opacity-70 hover:opacity-100 hover:border-border"
                }`}
              >
                <div className="min-w-0">
                  {/* Card Header: Icon + Title + Actions */}
                  <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-xs shadow-md shrink-0 transition-transform ${
                          !isActive ? "grayscale opacity-60" : ""
                        }`}
                        style={{ backgroundColor: subject.colorTag }}
                      >
                        {subject.shortName ? subject.shortName.slice(0, 3).toUpperCase() : subject.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-foreground text-sm truncate" title={subject.name}>
                            {subject.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          Qisqa: {subject.shortName || subject.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditSubject(subject)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSubjectToDelete(subject)}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata Box */}
                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-2xl border border-border/60 mb-3 min-w-0">
                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="flex items-center gap-1 shrink-0">
                        <Layers className="w-3 h-3 shrink-0" />
                        <span>SanPiN balli:</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border shrink-0 ${sanpin.badgeClass}`}>
                        {subject.difficultyScore} ball • {sanpin.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="flex items-center gap-1 shrink-0">
                        <DoorOpen className="w-3 h-3 shrink-0" />
                        <span>Talab etiladigan xona:</span>
                      </span>
                      <span className="font-medium text-foreground truncate">
                        {subject.requiresRoomType ? ROOM_TYPE_LABELS[subject.requiresRoomType] : "Oddiy sinf xonasi"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] gap-2">
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>Metod kuni:</span>
                      </span>
                      <span className="font-semibold text-foreground shrink-0 text-right">
                        {(() => {
                          const eff = subject.methodDayOfWeek ?? getOfficialMethodDayForSubject(subject.name || subject.id);
                          if (!eff) return <span className="text-[10px] text-muted-foreground">Yo'q</span>;
                          const isCustom = subject.methodDayOfWeek !== undefined && subject.methodDayOfWeek !== null;
                          return (
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                              isCustom
                                ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                                : "bg-primary/10 text-primary border-primary/20"
                            }`}>
                              {WEEKDAYS[eff - 1]}
                              {!isCustom && <span className="ml-1 text-[9px] opacity-75">(Standart)</span>}
                            </span>
                          );
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* ── CARD FOOTER: ACTIVE / INACTIVE TOGGLE SWITCH ─────────────── */}
                <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2 text-[11px] min-w-0">
                  {/* Left: Active/Inactive Switch Toggle */}
                  <button
                    type="button"
                    onClick={() => onToggleActive && onToggleActive(subject.id, !isActive)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer shrink-0 border ${
                      isActive
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25"
                        : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                    }`}
                    title={
                      isActive
                        ? "Fan faol: dars jadvallarida foydalaniladi. O'chirish uchun bosing."
                        : "Fan nofaol: dars jadvallarida ko'rinmaydi. Faollashtirish uchun bosing."
                    }
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isActive ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"
                      }`}
                    />
                    <span>{isActive ? "🟢 Faol dars" : "⚪ Nofaol"}</span>
                  </button>

                  {/* Right: Para dars belgisi */}
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-md text-[10px] truncate ${
                      subject.allowDoubleLesson
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                        : "text-muted-foreground/60"
                    }`}
                  >
                    {subject.allowDoubleLesson ? "Juft (para)" : "Yakka"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TASDIQLASH MODALI (Zamonaviy UI Confirm) ── */}
      <ConfirmActionModal
        isOpen={!!subjectToDelete}
        onClose={() => setSubjectToDelete(null)}
        onConfirm={() => {
          if (subjectToDelete) {
            onDeleteSubject(subjectToDelete.id);
            showToast(`"${subjectToDelete.name}" fani muvaffaqiyatli o'chirildi`);
            setSubjectToDelete(null);
          }
        }}
        title="Fanni o'chirish"
        description={`"${subjectToDelete?.name}" fanini katalogdan o'chirishni tasdiqlaysizmi? Ushbu fanga biriktirilgan darslar jadvaldan olib tashlanadi.`}
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
        variant="danger"
      />

      {/* ── TOAST XABARNOMA ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-[1000] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-bottom-2 ${
            toast.type === "success"
              ? "bg-emerald-600 text-white shadow-emerald-600/30"
              : "bg-rose-600 text-white shadow-rose-600/30"
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};
