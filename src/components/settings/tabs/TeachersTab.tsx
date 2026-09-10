"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Teacher, SchoolClass } from "@/types";
import { isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";
import { ConfirmActionModal } from "@/components/modals/ConfirmActionModal";
import { Users } from "lucide-react";
import {
  TeachersTabProps,
  HomeroomFilterType,
  HomeroomStageFilterType,
  WorkloadFilterType,
  TeacherWorkloadInfo,
} from "./teachers/types";
import { TeachersStatusDashboard } from "./teachers/TeachersStatusDashboard";
import { TeachersToolbar } from "./teachers/TeachersToolbar";
import { TeacherCard } from "./teachers/TeacherCard";
import { QuickTeacherHomeroomModal } from "./teachers/QuickTeacherHomeroomModal";

export const TeachersTab: React.FC<TeachersTabProps> = ({
  teachers,
  subjects,
  classes,
  schoolName,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
  onSetTeacherHomeroomClass,
  onOpenTeacherWorkload,
  onOpenEMaktabImport,
}) => {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");
  const [homeroomFilter, setHomeroomFilter] = useState<HomeroomFilterType>("ALL");
  const [homeroomStageFilter, setHomeroomStageFilter] = useState<HomeroomStageFilterType>("ALL_STAGES");
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilterType>("ALL");
  const [isExporting, setIsExporting] = useState(false);

  // Quick homeroom assignment modal state
  const [quickHomeroomTeacher, setQuickHomeroomTeacher] = useState<Teacher | null>(null);
  const [quickClassId, setQuickClassId] = useState<string>("");

  // O'chirishni tasdiqlash modali va Toast
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  /**
   * Universal Homeroom Class Resolver
   */
  const getTeacherHomeroomClass = useCallback(
    (teacher: Teacher): SchoolClass | null => {
      if (teacher.homeroomClassId) {
        if (classMap.has(teacher.homeroomClassId)) {
          return classMap.get(teacher.homeroomClassId)!;
        }
        const rawTarget = teacher.homeroomClassId.trim().toLowerCase();
        const normTarget = rawTarget.replace(/[^a-z0-9]/g, "");
        const byName = classes.find(
          (c) =>
            c.name.toLowerCase() === rawTarget ||
            c.name.toLowerCase().replace(/[^a-z0-9]/g, "") === normTarget ||
            c.id.toLowerCase() === rawTarget
        );
        if (byName) return byName;
      }

      // Reverse match: class with this teacher as homeroomTeacherId
      const byTeacherId = classes.find(
        (c) =>
          c.homeroomTeacherId === teacher.id ||
          c.homeroomTeacherId === teacher.fullName ||
          (teacher.displayNumber && c.homeroomTeacherId === `t_${teacher.displayNumber}`)
      );
      if (byTeacherId) return byTeacherId;

      // Sinf soati / Kelajak soati match
      const bySinfSoati = classes.find((c) =>
        c.subjects?.some(
          (s) =>
            (s.subjectId === "sub_sinf_soati" ||
              s.subjectId === "sub_kelajak" ||
              s.subjectId?.toLowerCase().includes("sinf_soati") ||
              s.subjectId?.toLowerCase().includes("kelajak")) &&
            s.teacherId === teacher.id
        )
      );
      if (bySinfSoati) return bySinfSoati;

      return null;
    },
    [classes, classMap]
  );

  // Calculate each teacher's assigned hours and class count
  const teacherWorkloadMap = useMemo(() => {
    const map = new Map<string, TeacherWorkloadInfo>();
    teachers.forEach((t) => {
      let hours = 0;
      const classSet = new Set<string>();
      classes.forEach((c) => {
        (c.subjects || []).forEach((cs) => {
          if (cs.teacherId === t.id) {
            hours += Number(cs.weeklyHours) || 0;
            classSet.add(c.id);
          }
        });
      });

      const homeroomClass = getTeacherHomeroomClass(t);
      if (homeroomClass) {
        classSet.add(homeroomClass.id);
        const alreadyHasHomeroomHour = (homeroomClass.subjects || []).some(
          (cs) => cs.teacherId === t.id && isKelajakOrSinfSoatiSubject(cs.subjectId, subjectMap.get(cs.subjectId)?.name)
        );
        if (!alreadyHasHomeroomHour) {
          hours += 1;
        }
      }

      map.set(t.id, { assignedHours: hours, classCount: classSet.size });
    });
    return map;
  }, [teachers, classes, subjectMap, getTeacherHomeroomClass]);

  // Global Aggregations
  const totalCapacityHours = useMemo(
    () => teachers.reduce((sum, t) => sum + (Number(t.weeklyHourCapacity) || 20), 0),
    [teachers]
  );

  const totalAssignedHours = useMemo(() => {
    let sum = 0;
    teacherWorkloadMap.forEach((val) => {
      sum += val.assignedHours;
    });
    return sum;
  }, [teacherWorkloadMap]);

  const globalWorkloadPercentage =
    totalCapacityHours > 0
      ? Math.min(100, Math.round((totalAssignedHours / totalCapacityHours) * 100))
      : 0;

  // Workload Category Counts
  const { optimalCount, underloadedCount, overloadedCount } = useMemo(() => {
    let optimal = 0;
    let under = 0;
    let over = 0;

    teachers.forEach((t) => {
      const assigned = teacherWorkloadMap.get(t.id)?.assignedHours || 0;
      const cap = Number(t.weeklyHourCapacity) || 20;
      const pct = (assigned / cap) * 100;
      if (pct > 100) over++;
      else if (pct >= 80) optimal++;
      else under++;
    });

    return { optimalCount: optimal, underloadedCount: under, overloadedCount: over };
  }, [teachers, teacherWorkloadMap]);

  // Homeroom Counts
  const homeroomCount = useMemo(
    () => teachers.filter((t) => !!getTeacherHomeroomClass(t)).length,
    [teachers, getTeacherHomeroomClass]
  );
  const nonHomeroomCount = teachers.length - homeroomCount;

  const { primaryHrCount, middleHrCount, highHrCount } = useMemo(() => {
    let primary = 0;
    let middle = 0;
    let high = 0;

    teachers.forEach((t) => {
      const cls = getTeacherHomeroomClass(t);
      if (!cls) return;
      const grade = cls.grade || parseInt(cls.name.match(/^(\d+)/)?.[1] || "1", 10);
      if (grade <= 4) primary++;
      else if (grade <= 9) middle++;
      else high++;
    });

    return { primaryHrCount: primary, middleHrCount: middle, highHrCount: high };
  }, [teachers, getTeacherHomeroomClass]);

  const homeroomPercentage =
    classes.length > 0
      ? Math.min(100, Math.round((homeroomCount / classes.length) * 100))
      : 0;

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    let list = teachers;

    if (subjectFilter !== "ALL") {
      list = list.filter((t) => t.subjectIds.includes(subjectFilter));
    }

    if (homeroomFilter === "HOMEROOM_ONLY") {
      list = list.filter((t) => {
        const cls = getTeacherHomeroomClass(t);
        if (!cls) return false;
        if (homeroomStageFilter === "ALL_STAGES") return true;
        const grade = cls.grade || parseInt(cls.name.match(/^(\d+)/)?.[1] || "1", 10);
        if (homeroomStageFilter === "PRIMARY") return grade <= 4;
        if (homeroomStageFilter === "MIDDLE") return grade >= 5 && grade <= 9;
        if (homeroomStageFilter === "HIGH") return grade >= 10;
        return true;
      });
    } else if (homeroomFilter === "NON_HOMEROOM") {
      list = list.filter((t) => !getTeacherHomeroomClass(t));
    }

    if (workloadFilter !== "ALL") {
      list = list.filter((t) => {
        const assigned = teacherWorkloadMap.get(t.id)?.assignedHours || 0;
        const cap = Number(t.weeklyHourCapacity) || 20;
        const pct = (assigned / cap) * 100;
        if (workloadFilter === "OVERLOADED") return pct > 100;
        if (workloadFilter === "OPTIMAL") return pct >= 80 && pct <= 100;
        if (workloadFilter === "UNDERLOADED") return pct < 80;
        return true;
      });
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => {
        if (t.fullName.toLowerCase().includes(q)) return true;
        if (t.phone && t.phone.toLowerCase().includes(q)) return true;
        const hClass = getTeacherHomeroomClass(t);
        if (hClass && hClass.name.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [
    teachers,
    subjectFilter,
    homeroomFilter,
    homeroomStageFilter,
    workloadFilter,
    search,
    getTeacherHomeroomClass,
    teacherWorkloadMap,
  ]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/export/teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teachers, subjects, classes, schoolName }),
      });
      if (!res.ok) throw new Error("Export xatosi");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("Content-Disposition")?.match(/filename\*=UTF-8''(.+)/)?.[1]
        ? decodeURIComponent(res.headers.get("Content-Disposition")!.match(/filename\*=UTF-8''(.+)/)![1])
        : `oqituvchilar_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Excel yuklashda xatolik yuz berdi", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const handleSaveQuickHomeroom = () => {
    if (!quickHomeroomTeacher || !onSetTeacherHomeroomClass) return;
    onSetTeacherHomeroomClass(quickHomeroomTeacher.id, quickClassId || null);
    setQuickHomeroomTeacher(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. Global Status Bars Dashboard */}
      <TeachersStatusDashboard
        globalWorkloadPercentage={globalWorkloadPercentage}
        totalAssignedHours={totalAssignedHours}
        totalCapacityHours={totalCapacityHours}
        teachersCount={teachers.length}
        optimalCount={optimalCount}
        underloadedCount={underloadedCount}
        overloadedCount={overloadedCount}
        homeroomCount={homeroomCount}
        classesCount={classes.length}
        homeroomPercentage={homeroomPercentage}
      />

      {/* 2. Toolbar (Search, Filter, Export, Add) */}
      <TeachersToolbar
        search={search}
        setSearch={setSearch}
        subjectFilter={subjectFilter}
        setSubjectFilter={setSubjectFilter}
        subjects={subjects}
        teachersCount={teachers.length}
        isExporting={isExporting}
        onExportExcel={handleExportExcel}
        onOpenEMaktabImport={onOpenEMaktabImport}
        onAddTeacher={onAddTeacher}
        homeroomFilter={homeroomFilter}
        setHomeroomFilter={setHomeroomFilter}
        homeroomStageFilter={homeroomStageFilter}
        setHomeroomStageFilter={setHomeroomStageFilter}
        workloadFilter={workloadFilter}
        setWorkloadFilter={setWorkloadFilter}
        homeroomCount={homeroomCount}
        nonHomeroomCount={nonHomeroomCount}
        optimalCount={optimalCount}
        underloadedCount={underloadedCount}
        overloadedCount={overloadedCount}
        primaryHrCount={primaryHrCount}
        middleHrCount={middleHrCount}
        highHrCount={highHrCount}
      />

      {/* 3. Teachers Grid */}
      {filteredTeachers.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">O&apos;qituvchi topilmadi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Qidiruv so&apos;zini yoki tanlangan filtrlarni o&apos;zgartiring
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 min-w-0">
          {filteredTeachers.map((teacher) => {
            const homeroomClass = getTeacherHomeroomClass(teacher);
            const workload = teacherWorkloadMap.get(teacher.id) || {
              assignedHours: 0,
              classCount: 0,
            };

            return (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                subjects={subjects}
                subjectMap={subjectMap}
                homeroomClass={homeroomClass}
                workload={workload}
                isSelected={selectedTeacherId === teacher.id}
                onSelect={() => setSelectedTeacherId(selectedTeacherId === teacher.id ? null : teacher.id)}
                onEdit={() => onEditTeacher(teacher)}
                onDelete={() => setTeacherToDelete(teacher)}
                onOpenWorkload={onOpenTeacherWorkload ? () => onOpenTeacherWorkload(teacher) : undefined}
                onOpenQuickHomeroom={() => {
                  setQuickHomeroomTeacher(teacher);
                  setQuickClassId(homeroomClass ? homeroomClass.id : "");
                }}
                canSetHomeroom={!!onSetTeacherHomeroomClass}
              />
            );
          })}
        </div>
      )}

      {/* 4. Tezkor Sinf Rahbari Biriktirish Modali */}
      <QuickTeacherHomeroomModal
        teacher={quickHomeroomTeacher}
        classes={classes}
        quickClassId={quickClassId}
        setQuickClassId={setQuickClassId}
        onClose={() => setQuickHomeroomTeacher(null)}
        onSave={handleSaveQuickHomeroom}
        onRemoveHomeroom={() => {
          if (onSetTeacherHomeroomClass && quickHomeroomTeacher) {
            onSetTeacherHomeroomClass(quickHomeroomTeacher.id, null);
          }
          setQuickHomeroomTeacher(null);
        }}
      />

      {/* 5. Tasdiqlash Modali */}
      <ConfirmActionModal
        isOpen={!!teacherToDelete}
        onClose={() => setTeacherToDelete(null)}
        onConfirm={() => {
          if (teacherToDelete) {
            onDeleteTeacher(teacherToDelete.id);
            showToast(`"${teacherToDelete.fullName}" o'qituvchisi muvaffaqiyatli o'chirildi`);
            setTeacherToDelete(null);
          }
        }}
        title="O'qituvchini o'chirish"
        description={`"${teacherToDelete?.fullName}" o'qituvchisini ro'yxatdan o'chirishni tasdiqlaysizmi? Unga biriktirilgan barcha darslar va yuklamalar ham bo'shatiladi.`}
        confirmText="Ha, o'chirilsin"
        cancelText="Bekor qilish"
        variant="danger"
      />

      {/* 6. Toast Xabarnoma */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-1000 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold transition-all animate-in slide-in-from-bottom-2 ${
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
