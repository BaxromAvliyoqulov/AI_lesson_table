"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Teacher, Subject, Branch, Shift, SchoolClass } from "@/types";
import { sanitizeFullName } from "@/lib/utils";
import { getOfficialMethodDayForSubject } from "@/lib/constants/method-days";
import { X, Users } from "lucide-react";
import { WEEKDAYS } from "./teacher-modal/types";
import { TeacherBasicFields } from "./teacher-modal/TeacherBasicFields";
import { TeacherScheduleFields } from "./teacher-modal/TeacherScheduleFields";
import { TeacherSubjectSelector } from "./teacher-modal/TeacherSubjectSelector";

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (teacherData: Teacher) => void;
  editingTeacher: Teacher | null;
  currentSchoolId: string;
  subjects: Subject[];
  branches: Branch[];
  shifts?: Shift[];
  classes?: SchoolClass[];
  allTeachers?: Teacher[];
  onOpenWorkload?: (teacher: Teacher) => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTeacher,
  currentSchoolId,
  subjects,
  branches,
  shifts = [],
  classes = [],
  allTeachers = [],
  onOpenWorkload,
}) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [weeklyCapacity, setWeeklyCapacity] = useState(20);
  const [maxConsecutive, setMaxConsecutive] = useState(4);
  const [methodDay, setMethodDay] = useState<number | "">("");
  const [isManualMethodDayOverride, setIsManualMethodDayOverride] = useState<boolean>(false);
  const [homeroomClassId, setHomeroomClassId] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedShifts, setSelectedShifts] = useState<string[]>([]);
  const [teachingStages, setTeachingStages] = useState<"PRIMARY" | "HIGH" | "BOTH">("BOTH");
  const [isManualTeachingStagesOverride, setIsManualTeachingStagesOverride] = useState<boolean>(false);
  const [travelPolicy, setTravelPolicy] = useState<"BY_SHIFT" | "BY_DAY" | "ALTERNATING_DAYS" | "FLEXIBLE_BUFFER">("BY_SHIFT");
  const lastInitializedIdRef = useRef<string | null>(null);

  // Tanlangan fan(lar) bo'yicha rasmiy metod kunini avtomatik aniqlash
  const autoDetectedMethodDay = useMemo(() => {
    for (const sid of selectedSubjects) {
      const sub = subjects.find((s) => s.id === sid);
      if (sub) {
        const day = sub.methodDayOfWeek ?? getOfficialMethodDayForSubject(sub.name || sub.id);
        if (day && day >= 1 && day <= 6) {
          return {
            day,
            dayName: WEEKDAYS.find((w) => w.id === day)?.name || "",
            subjectName: sub.name,
          };
        }
      }
    }
    return null;
  }, [selectedSubjects, subjects]);

  // Fan tanlanganda, agar foydalanuvchi qo'lda boshqa kunga override qilmagan bo'lsa, avtomatik moslash
  useEffect(() => {
    if (!isManualMethodDayOverride && autoDetectedMethodDay) {
      setMethodDay(autoDetectedMethodDay.day);
    }
  }, [autoDetectedMethodDay, isManualMethodDayOverride]);

  // Fanlar yoki sinf rahbari o'zgarganda Toifani (Boshlang'ich/Katta/Hammasi) AVTOMATIK aniqlash
  useEffect(() => {
    if (!isManualTeachingStagesOverride) {
      if (homeroomClassId) {
        const cls = classes.find((c) => c.id === homeroomClassId);
        if (cls) {
          if ((cls.grade && cls.grade <= 4) || cls.isPrimary) {
            setTeachingStages("PRIMARY");
            return;
          } else if (cls.grade && cls.grade >= 5) {
            setTeachingStages("HIGH");
            return;
          }
        }
      }

      if (selectedSubjects.length === 0) {
        setTeachingStages("BOTH");
        return;
      }

      const selectedSubs = selectedSubjects
        .map((id) => subjects.find((s) => s.id === id))
        .filter(Boolean) as Subject[];

      const highOnlyKeywords = [
        "algebra", "geometriya", "fizika", "kimyo", "biologiya",
        "geografiya", "tarix", "jahon tarixi", "o'zb. tarixi",
        "huquq", "davlat va huquq", "iqtisod", "astronomiya",
        "adabiyot", "chqbt", "chaqiruv"
      ];

      const primaryOnlyKeywords = [
        "o'qish", "o'qish savodxonligi", "alifbe", "yozuv"
      ];

      let hasHighOnly = false;
      let hasPrimaryOnly = false;

      for (const s of selectedSubs) {
        const name = (s.name || "").toLowerCase();
        if (highOnlyKeywords.some((k) => name.includes(k))) {
          hasHighOnly = true;
        }
        if (primaryOnlyKeywords.some((k) => name.includes(k))) {
          hasPrimaryOnly = true;
        }
      }

      if (hasPrimaryOnly && !hasHighOnly) {
        setTeachingStages("PRIMARY");
        return;
      }
      if (hasHighOnly && !hasPrimaryOnly) {
        setTeachingStages("HIGH");
        return;
      }

      const subNames = selectedSubs.map((s) => (s.name || "").toLowerCase());
      const hasOnaTili = subNames.some((n) => n.includes("ona tili"));
      const hasMatematika = subNames.some((n) => n.includes("matematika"));

      if (hasOnaTili && hasMatematika && !hasHighOnly) {
        setTeachingStages("PRIMARY");
        return;
      }

      setTeachingStages("BOTH");
    }
  }, [selectedSubjects, homeroomClassId, subjects, classes, isManualTeachingStagesOverride]);

  useEffect(() => {
    if (!isOpen) {
      lastInitializedIdRef.current = null;
      return;
    }

    const currentTeacherId = editingTeacher ? editingTeacher.id : "__NEW_TEACHER__";
    if (lastInitializedIdRef.current !== currentTeacherId) {
      lastInitializedIdRef.current = currentTeacherId;

      if (editingTeacher) {
        setFullName(editingTeacher.fullName);
        setPhone(editingTeacher.phone || "");
        setWeeklyCapacity(editingTeacher.weeklyHourCapacity);
        setMaxConsecutive(editingTeacher.maxConsecutiveHours);
        setMethodDay(editingTeacher.methodDayOfWeek || "");
        setIsManualMethodDayOverride(editingTeacher.methodDayOfWeek !== undefined && editingTeacher.methodDayOfWeek !== null);
        const existingClassId =
          editingTeacher.homeroomClassId ||
          classes.find((c) => c.homeroomTeacherId === editingTeacher.id)?.id ||
          "";
        setHomeroomClassId(existingClassId);
        setSelectedSubjects(editingTeacher.subjectIds || []);
        let initialBranchIds =
          editingTeacher.branchIds && editingTeacher.branchIds.length > 0
            ? [...editingTeacher.branchIds]
            : branches.map((b) => b.id);
        const hrClass = classes.find((c) => c.id === existingClassId);
        if (hrClass?.branchId && !initialBranchIds.includes(hrClass.branchId)) {
          initialBranchIds.push(hrClass.branchId);
        }
        setSelectedBranches(initialBranchIds);
        setSelectedShifts(
          editingTeacher.shiftIds && editingTeacher.shiftIds.length > 0
            ? editingTeacher.shiftIds
            : shifts.map((s) => s.id)
        );
        if (editingTeacher.teachingStages) {
          setTeachingStages(editingTeacher.teachingStages);
          setIsManualTeachingStagesOverride(true);
        } else {
          setIsManualTeachingStagesOverride(false);
        }
        setTravelPolicy(editingTeacher.travelPolicy || "BY_SHIFT");
      } else {
        setFullName("");
        setPhone("");
        setWeeklyCapacity(20);
        setMaxConsecutive(4);
        setMethodDay("");
        setIsManualMethodDayOverride(false);
        setHomeroomClassId("");
        setSelectedSubjects([]);
        setSelectedBranches(branches.map((b) => b.id));
        setSelectedShifts(shifts.map((s) => s.id));
        setTeachingStages("BOTH");
        setIsManualTeachingStagesOverride(false);
        setTravelPolicy("BY_SHIFT");
      }
    }
  }, [isOpen, editingTeacher?.id, editingTeacher, branches, shifts, classes]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    const teacherData: Teacher = {
      id: editingTeacher ? editingTeacher.id : `t_${currentSchoolId}_${Date.now()}`,
      schoolId: currentSchoolId,
      displayNumber: editingTeacher?.displayNumber,
      fullName: sanitizeFullName(fullName.trim()),
      phone: phone.trim() || null,
      weeklyHourCapacity: Number(weeklyCapacity),
      maxConsecutiveHours: Number(maxConsecutive),
      methodDayOfWeek: methodDay === "" ? null : Number(methodDay),
      subjectIds: selectedSubjects,
      branchIds: selectedBranches.length > 0 ? selectedBranches : branches.map((b) => b.id),
      shiftIds: selectedShifts.length > 0 ? selectedShifts : shifts.map((s) => s.id),
      teachingStages,
      travelPolicy,
      availabilities: editingTeacher?.availabilities || [],
      homeroomClassId: homeroomClassId.trim() || null,
    };

    onSave(teacherData);
    onClose();
  };

  const toggleSubject = (subId: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const toggleBranch = (branchId: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.length > 1
          ? prev.filter((id) => id !== branchId)
          : prev
        : [...prev, branchId]
    );
  };

  const handleBranchNeeded = (branchId: string) => {
    setSelectedBranches((prev) => (prev.includes(branchId) ? prev : [...prev, branchId]));
  };

  const hasMultipleBranches = selectedBranches.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {editingTeacher ? "O'qituvchini tahrirlash" : "Yangi o'qituvchi qo'shish"}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                O&apos;qituvchi profili, sinf rahbarligi, binolari va fanlarini sozlang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── FORM CONTENT ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <TeacherBasicFields
            fullName={fullName}
            setFullName={setFullName}
            phone={phone}
            setPhone={setPhone}
            homeroomClassId={homeroomClassId}
            setHomeroomClassId={setHomeroomClassId}
            classes={classes}
            allTeachers={allTeachers}
            editingTeacher={editingTeacher}
            weeklyCapacity={weeklyCapacity}
            setWeeklyCapacity={setWeeklyCapacity}
            maxConsecutive={maxConsecutive}
            setMaxConsecutive={setMaxConsecutive}
            methodDay={methodDay}
            setMethodDay={setMethodDay}
            isManualMethodDayOverride={isManualMethodDayOverride}
            setIsManualMethodDayOverride={setIsManualMethodDayOverride}
            autoDetectedMethodDay={autoDetectedMethodDay}
            onBranchNeeded={handleBranchNeeded}
          />

          <TeacherScheduleFields
            branches={branches}
            selectedBranches={selectedBranches}
            toggleBranch={toggleBranch}
            setSelectedBranches={setSelectedBranches}
            shifts={shifts}
            selectedShifts={selectedShifts}
            setSelectedShifts={setSelectedShifts}
            teachingStages={teachingStages}
            setTeachingStages={setTeachingStages}
            isManualTeachingStagesOverride={isManualTeachingStagesOverride}
            setIsManualTeachingStagesOverride={setIsManualTeachingStagesOverride}
            classes={classes}
            homeroomClassId={homeroomClassId}
            editingTeacher={editingTeacher}
            onOpenWorkload={onOpenWorkload}
            travelPolicy={travelPolicy}
            setTravelPolicy={setTravelPolicy}
            hasMultipleBranches={hasMultipleBranches}
          />

          <TeacherSubjectSelector
            subjects={subjects}
            selectedSubjects={selectedSubjects}
            toggleSubject={toggleSubject}
            setSelectedSubjects={setSelectedSubjects}
            teachingStages={teachingStages}
          />

          {/* ── FOOTER ACTIONS ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              {editingTeacher ? "O'zgarishlarni Saqlash" : "O'qituvchini Qo'shish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
