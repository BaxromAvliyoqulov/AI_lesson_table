import React from "react";
import { SchoolClass, Subject, Teacher } from "@/types";
import { isSubjectSuitableForGrade, isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";
import { TeacherClassAssignment } from "./types";
import { Minus, Plus, Users2, Trash2, UserCheck } from "lucide-react";

interface TeacherWorkloadAssignmentCardProps {
  item: TeacherClassAssignment;
  index: number;
  teacher: Teacher;
  schoolClasses: SchoolClass[];
  teacherSubjects: Subject[];
  subjects: Subject[];
  subjectMap: Map<string, Subject>;
  classMap: Map<string, SchoolClass>;
  schoolTeachers: Teacher[];
  teacherWorkloadMap: Map<string, number>;
  resolveCanonicalClass: (idOrName: string) => SchoolClass | undefined;
  handleUpdateAssignment: (index: number, key: keyof TeacherClassAssignment, val: any) => void;
  handleStepHours: (index: number, delta: number) => void;
  handleToggleSplit: (index: number) => void;
  handleRemoveAssignment: (index: number) => void;
}

export const TeacherWorkloadAssignmentCard: React.FC<TeacherWorkloadAssignmentCardProps> = ({
  item,
  index,
  teacher,
  schoolClasses,
  teacherSubjects,
  subjects,
  subjectMap,
  classMap,
  schoolTeachers,
  teacherWorkloadMap,
  resolveCanonicalClass,
  handleUpdateAssignment,
  handleStepHours,
  handleToggleSplit,
  handleRemoveAssignment,
}) => {
  const sub = subjectMap.get(item.subjectId);
  const cls = resolveCanonicalClass(item.classId) || classMap.get(item.classId);
  const isKelajak = isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name);

  const candidateTeachers = schoolTeachers.filter((t) => t.id !== teacher.id);
  const specializedCandidateTeachers = candidateTeachers.filter((t) =>
    (t.subjectIds || []).includes(item.subjectId)
  );
  const otherCandidateTeachers = candidateTeachers.filter(
    (t) => !(t.subjectIds || []).includes(item.subjectId)
  );

  return (
    <div
      className={`flex flex-col gap-2.5 p-3.5 rounded-2xl border transition-all min-w-0 ${
        item.isSplit
          ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-300/80 dark:border-indigo-800/80 shadow-xs"
          : "bg-card/80 border-border/80 hover:border-primary/40 hover:shadow-xs"
      }`}
    >
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        {/* 1. Sinf tanlash */}
        <div className="w-full sm:w-[28%] min-w-0">
          <select
            value={item.classId}
            onChange={(e) => handleUpdateAssignment(index, "classId", e.target.value)}
            className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer truncate"
          >
            {schoolClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} sinfi ({c.grade}-sinf)
              </option>
            ))}
          </select>
        </div>

        {/* 2. Fan tanlash */}
        <div className="w-full sm:w-[30%] min-w-0">
          {(() => {
            const targetGrade = cls?.grade || 5;
            const isPrimaryClass = targetGrade <= 4;
            const suitableTeacherSubs = teacherSubjects.filter((s) =>
              isSubjectSuitableForGrade(s, targetGrade)
            );
            const suitableAllSubs = subjects.filter((s) =>
              isSubjectSuitableForGrade(s, targetGrade)
            );
            const otherAllSubs = subjects.filter((s) => !isSubjectSuitableForGrade(s, targetGrade));

            return (
              <select
                value={item.subjectId}
                onChange={(e) => handleUpdateAssignment(index, "subjectId", e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer truncate"
              >
                {suitableTeacherSubs.length > 0 && (
                  <optgroup label="⭐ Mutaxassislik fanlari:">
                    {suitableTeacherSubs.map((s) => (
                      <option key={s.id} value={s.id}>
                        ⭐ {s.name}
                      </option>
                    ))}
                  </optgroup>
                )}

                {isPrimaryClass ? (
                  <optgroup label="🧒 Boshlang'ichga mos boshqa fanlar (1-4):">
                    {suitableAllSubs
                      .filter((s) => !suitableTeacherSubs.some((ts) => ts.id === s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </optgroup>
                ) : (
                  <optgroup label="🧑‍🎓 Yuqori sinfga mos boshqa fanlar (5-11):">
                    {suitableAllSubs
                      .filter((s) => !suitableTeacherSubs.some((ts) => ts.id === s.id))
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </optgroup>
                )}

                {otherAllSubs.length > 0 && (
                  <optgroup label="📚 Barcha qolgan fanlar:">
                    {otherAllSubs.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            );
          })()}
        </div>

        {/* 3. Haftalik soat STEPPER (+ / -) */}
        <div className="flex items-center justify-between sm:justify-center gap-1 w-full sm:w-28 shrink-0 bg-muted/40 sm:bg-transparent p-1 sm:p-0 rounded-xl">
          <span className="sm:hidden text-xs text-muted-foreground font-semibold pl-2">
            Haftalik soat:
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleStepHours(index, -1)}
              disabled={item.weeklyHours <= 1}
              className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              title="1 soat kamaytirish"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>

            <input
              type="number"
              min={1}
              max={12}
              value={item.weeklyHours}
              onChange={(e) => handleUpdateAssignment(index, "weeklyHours", Number(e.target.value))}
              className="w-10 px-1 py-1 text-xs font-black text-center rounded-lg border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />

            <button
              type="button"
              onClick={() => handleStepHours(index, 1)}
              disabled={item.weeklyHours >= 12}
              className="w-7 h-7 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
              title="1 soat oshirish"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-muted-foreground font-bold px-0.5">st</span>
          </div>
        </div>

        {/* 4. 👥 GURUHGA BO'LISH TOGGLE TUGMASI */}
        <div className="w-full sm:w-52 shrink-0 flex items-center justify-center">
          {isKelajak ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-muted/50 text-muted-foreground border border-border">
              Butun sinf (Majburiy)
            </span>
          ) : (
            <button
              type="button"
              onClick={() => handleToggleSplit(index)}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                item.isSplit
                  ? "bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-700"
                  : "bg-card border border-border text-foreground hover:bg-muted/60"
              }`}
              title="Sinfni 2 ta guruhga bo'lib 2 ta o'qituvchiga biriktirish"
            >
              <Users2 className="w-3.5 h-3.5 shrink-0" />
              <span>{item.isSplit ? "Guruhga bo'lingan (1-2)" : "Guruhga bo'lish"}</span>
            </button>
          )}
        </div>

        {/* 5. O'chirish tugmasi */}
        <div className="shrink-0 flex items-center justify-end sm:justify-center">
          <button
            type="button"
            onClick={() => handleRemoveAssignment(index)}
            className="w-8 h-8 rounded-xl text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center cursor-pointer"
            title="Dars soatini o'chirish"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SINF SOATI BO'LSA — NISHON */}
      {isKelajak && teacher.homeroomClassId === item.classId && (
        <div className="text-[11px] font-semibold text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950/40 px-3 py-1 rounded-xl flex items-center gap-1.5 border border-purple-200 dark:border-purple-800">
          <span>👤 {cls?.name} sinf rahbarligi — 1 soatlik Kelajak soati dars stavkasiga qo&apos;shilmaydi</span>
        </div>
      )}

      {/* AGAR BOSHQA SINFDA ADASHIB SINF SOATI TANLANGAN BO'LSA */}
      {isKelajak && teacher.homeroomClassId !== item.classId && (
        <div className="text-[11px] font-medium text-amber-800 dark:text-amber-200 bg-amber-500/10 px-3 py-1.5 rounded-xl flex flex-wrap items-center justify-between gap-2 border border-amber-500/30">
          <span className="flex items-center gap-1.5">
            ⚠️ Siz faqat {classMap.get(teacher.homeroomClassId || "")?.name || "o'z sinfingiz"} rahbari hisoblanasiz. {cls?.name} sinfida &quot;Sinf soati&quot; o&apos;rniga asosiy mutaxassislik fanni tanlang.
          </span>
          {teacherSubjects[0] && (
            <button
              type="button"
              onClick={() => handleUpdateAssignment(index, "subjectId", teacherSubjects[0].id)}
              className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-[10.5px] hover:bg-amber-700 shrink-0 cursor-pointer shadow-xs"
            >
              ⚡ {teacherSubjects[0].name} ga almashtirish
            </button>
          )}
        </div>
      )}

      {/* ── 👥 GURUHNI 2-QISMINI O'TADIGAN O'QITUVCHINI BELGILASH ── */}
      {item.isSplit && !isKelajak && (
        <div className="mt-1 p-2.5 rounded-xl bg-indigo-500/10 dark:bg-indigo-950/30 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-200 font-bold">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span>1-guruh:</span>
            <span className="text-foreground font-extrabold">{teacher.fullName}</span>
            <span className="text-[10px] text-muted-foreground font-normal">({item.weeklyHours} soat)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-bold text-indigo-950 dark:text-indigo-200 shrink-0 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              2-guruh o&apos;qituvchisi:
            </span>
            <select
              value={item.secondTeacherId || ""}
              onChange={(e) => handleUpdateAssignment(index, "secondTeacherId", e.target.value)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-indigo-300 dark:border-indigo-700 bg-background text-foreground focus:ring-2 focus:ring-indigo-500 cursor-pointer min-w-[200px]"
            >
              <option value="">-- O&apos;qituvchini tanlang --</option>
              {specializedCandidateTeachers.length > 0 && (
                <optgroup label="⭐ Shu fan mutaxassislari:">
                  {specializedCandidateTeachers.map((t) => {
                    const hours = teacherWorkloadMap.get(t.id) || 0;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.displayNumber ? `№${t.displayNumber} ` : ""}
                        {t.fullName} ({hours}/{t.weeklyHourCapacity || 20}s)
                      </option>
                    );
                  })}
                </optgroup>
              )}
              {otherCandidateTeachers.length > 0 && (
                <optgroup label="Boshqa o'qituvchilar:">
                  {otherCandidateTeachers.map((t) => {
                    const hours = teacherWorkloadMap.get(t.id) || 0;
                    return (
                      <option key={t.id} value={t.id}>
                        {t.displayNumber ? `№${t.displayNumber} ` : ""}
                        {t.fullName} ({hours}/{t.weeklyHourCapacity || 20}s)
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
