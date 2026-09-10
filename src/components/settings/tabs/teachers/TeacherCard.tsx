import React from "react";
import { Teacher, Subject, SchoolClass } from "@/types";
import { TeacherWorkloadInfo } from "./types";
import { getEffectiveTeacherMethodDay } from "@/lib/constants/method-days";
import { isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";
import {
  Phone,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  GraduationCap,
  BookOpen,
  Check,
  Plus,
} from "lucide-react";

interface TeacherCardProps {
  teacher: Teacher;
  subjects: Subject[];
  subjectMap: Map<string, Subject>;
  homeroomClass: SchoolClass | null;
  workload: TeacherWorkloadInfo;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onOpenWorkload?: () => void;
  onOpenQuickHomeroom?: () => void;
  canSetHomeroom: boolean;
}

export const TeacherCard: React.FC<TeacherCardProps> = ({
  teacher,
  subjects,
  subjectMap,
  homeroomClass,
  workload,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onOpenWorkload,
  onOpenQuickHomeroom,
  canSetHomeroom,
}) => {
  let teacherSubs = teacher.subjectIds
    .map((id) => subjectMap.get(id))
    .filter(Boolean) as Subject[];

  // Agar o'qituvchi sinf rahbari bo'lsa, uning fanlari qatoriga "Sinf soati" ham albatta qo'shiladi!
  if (homeroomClass) {
    const hasSinfSoati = teacherSubs.some((s) => isKelajakOrSinfSoatiSubject(s.id, s.name));
    if (!hasSinfSoati) {
      const sinfSoatiSub =
        subjects.find((s) => isKelajakOrSinfSoatiSubject(s.id, s.name)) ||
        subjectMap.get("sub_sinf_soati") ||
        ({
          id: "sub_sinf_soati",
          name: "Sinf soati",
          shortName: "Sinf soati",
          colorTag: "#6366f1",
          schoolId: teacher.schoolId,
        } as Subject);
      teacherSubs = [...teacherSubs, sinfSoatiSub];
    }
  }

  const capacity = Number(teacher.weeklyHourCapacity) || 20;
  const workloadPct = Math.round((workload.assignedHours / capacity) * 100);
  const isOptimal = workloadPct >= 80 && workloadPct <= 100;
  const isOverloaded = workloadPct > 100;

  const eff = getEffectiveTeacherMethodDay(teacher, subjects);

  return (
    <div
      onClick={onSelect}
      className={`flex flex-col justify-between p-4 rounded-3xl transition-all min-w-0 overflow-hidden space-y-3 cursor-pointer ${
        isSelected
          ? "border-2 border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-xl shadow-blue-500/15 ring-4 ring-blue-500/20 scale-[1.015]"
          : "border border-border/80 bg-card/80 hover:bg-card hover:border-primary/40 hover:shadow-lg"
      }`}
    >
      <div className="min-w-0">
        {/* Top card header: Avatar + Name + Phone + Action buttons */}
        <div className="flex items-start justify-between gap-2 mb-2.5 min-w-0">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shadow-inner shrink-0 mt-0.5 transition-colors ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              }`}
            >
              {teacher.fullName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4
                  className="font-bold text-foreground text-sm leading-snug break-words"
                  title={teacher.fullName}
                >
                  {teacher.fullName}
                </h4>
                {isSelected && (
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-black tracking-wide flex items-center gap-0.5 shadow-xs shrink-0">
                    <Check className="w-2.5 h-2.5" /> Tanlangan
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 shrink-0" />
                <span className="break-all">{teacher.phone || "Telefon yo'q"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Tahrirlash"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="O'chirish"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── TEACHER CARD LIVE WORKLOAD STATUS BAR ───────────────── */}
        <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/70 mb-2.5 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3 text-primary shrink-0" />
              <span>Dars yuklamasi:</span>
            </span>
            <span className="font-black text-foreground">
              {workload.assignedHours}{" "}
              <span className="font-normal text-muted-foreground">/ {capacity} st</span>
            </span>
          </div>

          {/* Progress Bar Track */}
          <div className="w-full h-2 rounded-full bg-muted/80 overflow-hidden p-0.5 border border-border/30">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOverloaded
                  ? "bg-rose-500"
                  : isOptimal
                  ? "bg-emerald-500"
                  : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, workloadPct)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] pt-0.5">
            <span
              className={`font-bold px-1.5 py-0.2 rounded-md ${
                isOverloaded
                  ? "text-rose-700 dark:text-rose-300 bg-rose-500/10"
                  : isOptimal
                  ? "text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                  : "text-amber-700 dark:text-amber-300 bg-amber-500/10"
              }`}
            >
              {isOverloaded
                ? `🔴 +${workload.assignedHours - capacity} st ortiqcha`
                : isOptimal
                ? "🟢 Optimal stavka"
                : `🟡 ${capacity - workload.assignedHours} st bo'sh`}
            </span>
            <span className="font-extrabold text-foreground">{workloadPct}%</span>
          </div>
        </div>

        {/* Metadata Container */}
        <div className="space-y-2 text-xs text-muted-foreground bg-muted/10 p-2.5 rounded-2xl border border-border/50 mb-2.5 min-w-0">
          <div className="flex items-center justify-between text-[11px] gap-2">
            <span className="flex items-center gap-1 shrink-0">
              <Calendar className="w-3 h-3 shrink-0" />
              <span>Metod kuni:</span>
            </span>
            <span className="font-semibold text-foreground shrink-0 text-right truncate">
              {!eff.day ? (
                <span className="text-[10px] text-muted-foreground">Belgilanmagan</span>
              ) : (
                <span
                  className={`px-2 py-0.5 rounded font-bold text-[10px] border inline-flex items-center gap-1 ${
                    eff.source === "TEACHER_EXPLICIT"
                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
                      : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25"
                  }`}
                  title={
                    eff.source === "TEACHER_EXPLICIT"
                      ? "O'qituvchiga shaxsiy belgilangan metod kuni"
                      : `${eff.subjectName || "Fan"} rasmiy standarti bo'yicha avtomatik belgilangan`
                  }
                >
                  <span>{eff.dayName}</span>
                  {eff.source !== "TEACHER_EXPLICIT" && eff.subjectName && (
                    <span className="opacity-75 text-[9px]">({eff.subjectName.slice(0, 8)})</span>
                  )}
                </span>
              )}
            </span>
          </div>

          {/* Sinf rahbari qatori */}
          <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 min-w-0">
            <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground shrink-0">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Sinf rahbari:</span>
            </span>
            {homeroomClass ? (
              <div className="flex items-center gap-1.5 min-w-0 shrink-0">
                <span className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-black text-xs truncate max-w-[70px]">
                  {homeroomClass.name}
                </span>
                {canSetHomeroom && onOpenQuickHomeroom && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenQuickHomeroom();
                    }}
                    className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors cursor-pointer"
                    title="Sinfni o'zgartirish"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                {canSetHomeroom && onOpenQuickHomeroom ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenQuickHomeroom();
                    }}
                    className="text-[10.5px] font-bold px-2 py-0.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                    title="Sinf rahbarligini biriktirish"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Biriktirish</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-muted-foreground italic shrink-0">
                    Yo&apos;q
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subject tags */}
      <div className="min-w-0">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center justify-between">
          <span>Fanlari ({teacherSubs.length})</span>
        </div>
        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar min-w-0">
          {teacherSubs.length === 0 ? (
            <span className="text-[10px] text-muted-foreground italic">
              Fan biriktirilmagan
            </span>
          ) : (
            teacherSubs.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border max-w-full truncate shrink-0"
                style={{
                  backgroundColor: `${s.colorTag}15`,
                  color: s.colorTag,
                  borderColor: `${s.colorTag}30`,
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: s.colorTag }}
                />
                <span className="truncate max-w-[120px]">{s.name}</span>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Workload button */}
      {onOpenWorkload && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenWorkload();
          }}
          className="mt-2 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer shrink-0 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs"
        >
          <BookOpen className="w-3.5 h-3.5 shrink-0" />
          <span>
            Dars taqsimoti ({workload.assignedHours} st stavka • {workload.classCount} sinf)
          </span>
        </button>
      )}
    </div>
  );
};
