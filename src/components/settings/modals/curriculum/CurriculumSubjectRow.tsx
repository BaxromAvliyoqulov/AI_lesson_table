import React from "react";
import { SchoolClass, Subject, Teacher } from "@/types";
import { isSubjectSuitableForGrade, isKelajakOrSinfSoatiSubject, isPrimaryGradeTeacher } from "@/lib/curriculum-templates";
import { TeacherSelectCombobox } from "../../shared/TeacherSelectCombobox";
import { GroupedSubjectItem } from "./useCurriculumLogic";
import { Users, UserCheck, Plus, Check, Minus, Trash2 } from "lucide-react";

interface CurriculumSubjectRowProps {
  group: GroupedSubjectItem;
  targetClass: SchoolClass;
  allSubjects: Subject[];
  subjectMap: Map<string, Subject>;
  availableTeachers: Teacher[];
  allClasses: SchoolClass[];
  onUpdateSubjectId: (oldSubjectId: string, newSubjectId: string) => void;
  onToggleSplitGroup: (subjectId: string) => void;
  onUpdateGroupTeacher: (
    subjectId: string,
    groupType: "WHOLE" | "GROUP_1" | "GROUP_2",
    teacherId: string
  ) => void;
  onStepHours: (subjectId: string, delta: number) => void;
  onSetPresetHours: (subjectId: string, hours: number) => void;
  onRemove: (subjectId: string) => void;
}

export const CurriculumSubjectRow: React.FC<CurriculumSubjectRowProps> = ({
  group,
  targetClass,
  allSubjects,
  subjectMap,
  availableTeachers,
  allClasses,
  onUpdateSubjectId,
  onToggleSplitGroup,
  onUpdateGroupTeacher,
  onStepHours,
  onSetPresetHours,
  onRemove,
}) => {
  const item = group.group1;
  const group2 = group.group2;
  const sub = subjectMap.get(group.subjectId) || allSubjects.find((s) => s.id === group.subjectId);
  const isHighGrade = targetClass.grade >= 5;

  const teacherCandidates = availableTeachers.filter((t) => {
    if (!t.subjectIds?.includes(group.subjectId)) return false;
    if (isHighGrade && isPrimaryGradeTeacher(t, allClasses)) return false;
    return true;
  });

  const isSinfSoati =
    group.subjectId === "sub_sinf_soati" ||
    group.subjectId === "sub_kelajak" ||
    isKelajakOrSinfSoatiSubject(group.subjectId, sub?.name);

  const isSplit = group.isSplit;
  const hasTeacher1 = Boolean(item.teacherId);
  const hasTeacher2 = isSplit ? Boolean(group2?.teacherId) : true;
  const hasAllTeachers = hasTeacher1 && hasTeacher2;

  return (
    <div
      className={`flex flex-col md:grid md:grid-cols-12 gap-3 p-3.5 rounded-2xl border transition-all items-center ${
        isSinfSoati
          ? "border-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs"
          : isSplit
          ? "border-purple-500/40 bg-purple-500/5 hover:border-purple-500/60 shadow-xs"
          : hasAllTeachers
          ? "border-border/80 bg-card/90 hover:bg-card hover:border-primary/40 hover:shadow-xs"
          : "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
      }`}
    >
      {/* 1. FAN NOMI & COLOR PILL (Col-4) */}
      <div className="w-full md:col-span-4 flex items-center gap-2.5 min-w-0">
        <div
          className="w-3 h-12 rounded-full shrink-0 shadow-xs"
          style={{ backgroundColor: isSinfSoati ? "#8B5CF6" : sub?.colorTag || "#3B82F6" }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <select
              value={group.subjectId}
              onChange={(e) => onUpdateSubjectId(group.subjectId, e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer truncate"
            >
              <optgroup
                label={
                  targetClass.grade <= 4
                    ? "🧒 Boshlang'ich sinfga mos fanlar (1-4):"
                    : "🧑‍🎓 Yuqori sinfga mos fanlar (5-11):"
                }
              >
                {allSubjects
                  .filter(
                    (s) =>
                      isSubjectSuitableForGrade(s, targetClass.grade) ||
                      s.id === group.subjectId
                  )
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.difficultyScore || 5} ball)
                    </option>
                  ))}
              </optgroup>
              {allSubjects.some(
                (s) =>
                  !isSubjectSuitableForGrade(s, targetClass.grade) &&
                  s.id !== group.subjectId
              ) && (
                <optgroup label="📚 Boshqa barcha fanlar:">
                  {allSubjects
                    .filter(
                      (s) =>
                        !isSubjectSuitableForGrade(s, targetClass.grade) &&
                        s.id !== group.subjectId
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.difficultyScore || 5} ball)
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {isSinfSoati ? (
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold flex items-center gap-1">
                🎓 Sinf rahbari soati (Dushanba 1-dars)
              </span>
            ) : (
              <>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  SanPiN: {sub?.difficultyScore || 5} ball
                </span>
                {!isSplit ? (
                  <button
                    type="button"
                    onClick={() => onToggleSplitGroup(group.subjectId)}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800 transition-all cursor-pointer shadow-2xs active:scale-95"
                    title="Fanni 2 guruhga (1-guruh va 2-guruh) ajratish"
                  >
                    <Users className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>👥 2 guruhga bo'lish</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                      <Users className="w-3 h-3 text-purple-600 shrink-0" />
                      <span>2 guruh</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleSplitGroup(group.subjectId)}
                      className="text-[10px] text-muted-foreground hover:text-rose-600 font-bold cursor-pointer underline transition-colors"
                      title="Guruhlarni birlashtirib butun sinfga qaytarish"
                    >
                      Birlashtirish
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. O'QITUVCHI TANLASH (Col-5) */}
      <div className="w-full md:col-span-5 min-w-0">
        {!isSplit ? (
          <div>
            <TeacherSelectCombobox
              value={item.teacherId}
              onChange={(tId) => onUpdateGroupTeacher(group.subjectId, "WHOLE", tId)}
              teachers={availableTeachers}
              candidates={teacherCandidates}
              homeroomTeacherId={isSinfSoati ? targetClass.homeroomTeacherId : undefined}
              placeholder="⚠️ O'qituvchi tanlanmagan"
              theme={isSinfSoati ? "indigo" : "default"}
            />

            <div className="flex items-center gap-1 flex-wrap mt-1.5">
              <span className="text-[10px] text-muted-foreground font-semibold">Tavsiya:</span>
              {isSinfSoati && targetClass.homeroomTeacherId && (
                <button
                  type="button"
                  onClick={() => onUpdateGroupTeacher(group.subjectId, "WHOLE", targetClass.homeroomTeacherId!)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                    item.teacherId === targetClass.homeroomTeacherId
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                  }`}
                  title="Sinf rahbarini biriktirish"
                >
                  <UserCheck className="w-3 h-3 shrink-0" />
                  <span>Sinf rahbari</span>
                </button>
              )}
              {teacherCandidates.slice(0, 3).map((candidate) => {
                const isSelected = item.teacherId === candidate.id;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => onUpdateGroupTeacher(group.subjectId, "WHOLE", candidate.id)}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-muted/70 hover:bg-emerald-500/15 text-foreground hover:text-emerald-700 dark:hover:text-emerald-300 border border-border/80"
                    }`}
                    title={`${candidate.fullName} (${candidate.weeklyHourCapacity} st)`}
                  >
                    {isSelected ? <Check className="w-2.5 h-2.5 shrink-0" /> : <Plus className="w-2.5 h-2.5 shrink-0" />}
                    <span className="truncate max-w-[110px]">
                      {candidate.fullName.split(" ")[0]} {candidate.fullName.split(" ")[1]?.[0] || ""}.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {/* 1-Guruh */}
            <div className="p-2.5 rounded-xl bg-sky-500/5 border border-sky-500/25">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-sky-700 dark:text-sky-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                  🔵 1-Guruh o'qituvchisi:
                </span>
              </div>
              <TeacherSelectCombobox
                value={item.teacherId}
                onChange={(tId) => onUpdateGroupTeacher(group.subjectId, "GROUP_1", tId)}
                teachers={availableTeachers}
                candidates={teacherCandidates}
                placeholder="⚠️ 1-guruh o'qituvchisi tanlanmagan"
                theme="sky"
                size="sm"
              />
              <div className="flex items-center gap-1 flex-wrap mt-1">
                <span className="text-[9px] text-muted-foreground font-semibold">Tavsiya:</span>
                {teacherCandidates.slice(0, 3).map((candidate) => {
                  const isSelected = item.teacherId === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => onUpdateGroupTeacher(group.subjectId, "GROUP_1", candidate.id)}
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                        isSelected ? "bg-sky-600 text-white" : "bg-muted hover:bg-sky-100 text-foreground border border-border/80"
                      }`}
                    >
                      {isSelected ? <Check className="w-2 h-2" /> : <Plus className="w-2 h-2" />}
                      <span className="truncate max-w-[90px]">
                        {candidate.fullName.split(" ")[0]} {candidate.fullName.split(" ")[1]?.[0] || ""}.
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2-Guruh */}
            <div className="p-2.5 rounded-xl bg-purple-500/5 border border-purple-500/25">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black text-purple-700 dark:text-purple-300 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  🟣 2-Guruh o'qituvchisi:
                </span>
              </div>
              <TeacherSelectCombobox
                value={group2?.teacherId || ""}
                onChange={(tId) => onUpdateGroupTeacher(group.subjectId, "GROUP_2", tId)}
                teachers={availableTeachers}
                candidates={teacherCandidates}
                placeholder="⚠️ 2-guruh o'qituvchisi tanlanmagan"
                theme="purple"
                size="sm"
              />
              <div className="flex items-center gap-1 flex-wrap mt-1">
                <span className="text-[9px] text-muted-foreground font-semibold">Tavsiya:</span>
                {teacherCandidates.slice(0, 4).map((candidate) => {
                  const isSelected = group2?.teacherId === candidate.id;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => onUpdateGroupTeacher(group.subjectId, "GROUP_2", candidate.id)}
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold transition-all cursor-pointer ${
                        isSelected ? "bg-purple-600 text-white" : "bg-muted hover:bg-purple-100 text-foreground border border-border/80"
                      }`}
                    >
                      {isSelected ? <Check className="w-2 h-2" /> : <Plus className="w-2 h-2" />}
                      <span className="truncate max-w-[90px]">
                        {candidate.fullName.split(" ")[0]} {candidate.fullName.split(" ")[1]?.[0] || ""}.
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. DARS SOATI STEPPER & PRESET CHIPS (Col-2) */}
      <div className="w-full md:col-span-2 flex flex-col items-center justify-center gap-1.5 bg-muted/40 md:bg-transparent p-2 md:p-0 rounded-xl">
        <div className="flex items-center justify-center gap-1.5 w-full">
          <button
            type="button"
            onClick={() => onStepHours(group.subjectId, -1)}
            disabled={item.weeklyHours <= 1}
            className="w-7 h-7 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-95"
            title="1 soat kamaytirish"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center justify-center min-w-[48px] px-2 py-1 rounded-xl bg-background border border-border/80 shadow-inner">
            <span className="text-sm font-black text-foreground">
              {item.weeklyHours}
            </span>
            <span className="text-[11px] text-muted-foreground font-bold ml-1">st</span>
          </div>

          <button
            type="button"
            onClick={() => onStepHours(group.subjectId, 1)}
            disabled={item.weeklyHours >= 12}
            className="w-7 h-7 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs active:scale-95"
            title="1 soat oshirish"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tezkor soat preset pillari */}
        <div className="flex items-center gap-1">
          {[1, 2, 4, 6].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onSetPresetHours(group.subjectId, p)}
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                item.weeklyHours === p
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              {p}st
            </button>
          ))}
        </div>
        {isSplit && (
          <span className="text-[9px] text-purple-600 dark:text-purple-400 font-extrabold text-center">
            (Parallel dars)
          </span>
        )}
      </div>

      {/* 4. O'CHIRISH TUGMASI (Col-1) */}
      <div className="w-full md:col-span-1 flex justify-end md:justify-center">
        <button
          type="button"
          onClick={() => onRemove(group.subjectId)}
          className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/15 transition-colors cursor-pointer"
          title="Fanni o'chirish"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
