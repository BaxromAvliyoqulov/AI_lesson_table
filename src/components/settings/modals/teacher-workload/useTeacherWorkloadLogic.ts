import { useState, useEffect, useMemo, useRef } from "react";
import { Teacher, Subject, SchoolClass } from "@/types";
import {
  isKelajakOrSinfSoatiSubject,
} from "@/lib/curriculum-templates";
import { sortClassesByName, normalizeClassName } from "@/lib/utils";
import { TeacherClassAssignment } from "./types";

export function useTeacherWorkloadLogic({
  isOpen,
  onClose,
  teacher,
  classes,
  subjects,
  teachers = [],
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers?: Teacher[];
  onSave: (teacherId: string, assignments: TeacherClassAssignment[]) => void;
}) {
  const [assignments, setAssignments] = useState<TeacherClassAssignment[]>([]);
  const lastInitializedTeacherIdRef = useRef<string | null>(null);

  const schoolClasses = useMemo(() => {
    const bySchool = teacher?.schoolId
      ? classes.filter((c) => !c.schoolId || c.schoolId === teacher.schoolId)
      : classes;
    const targetClasses = bySchool.length > 0 ? bySchool : classes;

    const seenNames = new Set<string>();
    const deduped: SchoolClass[] = [];
    for (const c of targetClasses) {
      const key = normalizeClassName(c.name).toUpperCase();
      if (!seenNames.has(key)) {
        seenNames.add(key);
        deduped.push(c);
      }
    }
    return sortClassesByName(deduped);
  }, [classes, teacher?.schoolId]);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map(schoolClasses.map((c) => [c.id, c])), [schoolClasses]);

  const schoolTeachers = useMemo(() => {
    const bySchool = teacher?.schoolId
      ? teachers.filter((t) => !t.schoolId || t.schoolId === teacher.schoolId)
      : teachers;
    return bySchool.length > 0 ? bySchool : teachers;
  }, [teachers, teacher?.schoolId]);

  const teacherMap = useMemo(() => new Map(schoolTeachers.map((t) => [t.id, t])), [schoolTeachers]);

  const classNameToCanonicalClassMap = useMemo(() => {
    const map = new Map<string, SchoolClass>();
    schoolClasses.forEach((c) => {
      map.set(normalizeClassName(c.name).toUpperCase(), c);
    });
    return map;
  }, [schoolClasses]);

  const resolveCanonicalClass = (classIdOrName: string): SchoolClass | undefined => {
    if (!classIdOrName) return undefined;
    const byId = classMap.get(classIdOrName);
    if (byId) return byId;

    const originalCls = classes.find((c) => c.id === classIdOrName);
    if (originalCls) {
      const norm = normalizeClassName(originalCls.name).toUpperCase();
      const canonical = classNameToCanonicalClassMap.get(norm);
      if (canonical) return canonical;
      return originalCls;
    }

    const norm = normalizeClassName(classIdOrName).toUpperCase();
    return classNameToCanonicalClassMap.get(norm);
  };

  const teacherSubjects = useMemo(() => {
    if (!teacher) return [];
    return (teacher.subjectIds || [])
      .map((id) => subjectMap.get(id))
      .filter(Boolean) as Subject[];
  }, [teacher, subjectMap]);

  const defaultSubjectId = teacherSubjects[0]?.id || subjects[0]?.id || "";

  const [batchSubjectId, setBatchSubjectId] = useState<string>(defaultSubjectId);
  const [batchHours, setBatchHours] = useState<number>(4);
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(false);

  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [parallelFilter, setParallelFilter] = useState<string>("ALL");
  const [stageFilter, setStageFilter] = useState<"ALL" | "PRIMARY" | "HIGH">("ALL");

  useEffect(() => {
    if (!isOpen || !teacher) {
      lastInitializedTeacherIdRef.current = null;
      setAssignments([]);
      return;
    }

    if (lastInitializedTeacherIdRef.current !== teacher.id) {
      lastInitializedTeacherIdRef.current = teacher.id;
      setBatchSubjectId(teacherSubjects[0]?.id || subjects[0]?.id || "");

      if (teacher.teachingStages === "PRIMARY") {
        setStageFilter("PRIMARY");
      } else if (teacher.teachingStages === "HIGH") {
        setStageFilter("HIGH");
      } else {
        setStageFilter("ALL");
      }

      if (teacher.branchIds && teacher.branchIds.length === 1) {
        setBranchFilter(teacher.branchIds[0]);
      } else {
        setBranchFilter("ALL");
      }
      setParallelFilter("ALL");

      const currentList: TeacherClassAssignment[] = [];
      const seenAssignmentKeys = new Set<string>();

      schoolClasses.forEach((cls) => {
        (cls.subjects || []).forEach((s) => {
          if (s.teacherId === teacher.id) {
            const canonicalCls = resolveCanonicalClass(cls.id) || cls;
            const normClassName = normalizeClassName(canonicalCls.name).toUpperCase();
            const dedupKey = `${normClassName}_${s.subjectId}`;

            if (seenAssignmentKeys.has(dedupKey)) {
              return;
            }

            const otherTeacherSub = (cls.subjects || []).find(
              (other) =>
                other.subjectId === s.subjectId &&
                other.teacherId !== teacher.id &&
                Number(other.weeklyHours) > 0
            );

            // QAT'IY QOIDA: Faqat va faqat fanning o'zi avvaldan GROUP_1 yoki GROUP_2 bo'lsagina guruhlangan hisoblanadi
            const isSplit = s.groupType === "GROUP_1" || s.groupType === "GROUP_2";
            const secondTeacherId = isSplit && otherTeacherSub ? otherTeacherSub.teacherId : undefined;

            seenAssignmentKeys.add(dedupKey);
            currentList.push({
              classId: canonicalCls.id,
              subjectId: s.subjectId,
              weeklyHours: Number(s.weeklyHours) || (otherTeacherSub ? Number(otherTeacherSub.weeklyHours) : 2),
              isSplit: isSplit,
              groupType: isSplit ? (s.groupType || "GROUP_1") : "WHOLE",
              secondTeacherId,
            });
          }
        });
      });

      const homeroomClassId =
        teacher.homeroomClassId ||
        schoolClasses.find((c) => c.homeroomTeacherId === teacher.id)?.id;

      const sinfSoatiSub =
        subjects.find((s) => isKelajakOrSinfSoatiSubject(s.id, s.name)) ||
        subjects.find((s) => s.id === "sub_sinf_soati");

      const filteredList = currentList.filter((item) => {
        const sub = subjectMap.get(item.subjectId) || subjects.find((s) => s.id === item.subjectId);
        return !isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name);
      });

      if (homeroomClassId && sinfSoatiSub) {
        const canonicalHrClass = resolveCanonicalClass(homeroomClassId);
        const finalHrClassId = canonicalHrClass?.id || homeroomClassId;
        filteredList.unshift({
          classId: finalHrClassId,
          subjectId: sinfSoatiSub.id,
          weeklyHours: 1,
          isSplit: false,
          groupType: "WHOLE",
        });
      }

      setAssignments(filteredList);
    }
  }, [isOpen, teacher?.id, teacher, schoolClasses, teacherSubjects, subjects, subjectMap]);

  const uniqueAssignments = useMemo(() => {
    const seen = new Set<string>();
    const result: { item: TeacherClassAssignment; index: number }[] = [];

    assignments.forEach((item, index) => {
      const canonicalClass = resolveCanonicalClass(item.classId);
      const normClassName = canonicalClass ? normalizeClassName(canonicalClass.name).toUpperCase() : item.classId;
      const key = `${normClassName}_${item.subjectId}`;

      if (!seen.has(key)) {
        seen.add(key);
        const cleanItem = canonicalClass && canonicalClass.id !== item.classId
          ? { ...item, classId: canonicalClass.id }
          : item;
        result.push({ item: cleanItem, index });
      }
    });

    return result;
  }, [assignments, classMap]);

  const { totalAssignedHours, totalHomeroomHours, totalPhysicalHours } = useMemo(() => {
    let assigned = 0;
    let homeroom = 0;
    uniqueAssignments.forEach(({ item }) => {
      const sub = subjectMap.get(item.subjectId) || subjects.find((s) => s.id === item.subjectId);
      const hours = Number(item.weeklyHours) || 0;
      const isHomeroomClassHour =
        isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name) &&
        teacher?.homeroomClassId === item.classId;

      if (isHomeroomClassHour) {
        homeroom += hours;
      } else {
        assigned += hours;
      }
    });
    return {
      totalAssignedHours: assigned,
      totalTeachingHours: assigned,
      totalHomeroomHours: homeroom,
      totalPhysicalHours: assigned + homeroom,
    };
  }, [uniqueAssignments, subjectMap, subjects, teacher?.homeroomClassId]);

  const capacity = teacher?.weeklyHourCapacity || 20;
  const isOverloaded = totalAssignedHours > capacity;
  const remainingHours = capacity - totalAssignedHours;

  const teacherWorkloadMap = useMemo(() => {
    const map = new Map<string, number>();
    schoolClasses.forEach((cls) => {
      (cls.subjects || []).forEach((cs) => {
        if (cs.teacherId) {
          map.set(cs.teacherId, (map.get(cs.teacherId) || 0) + (Number(cs.weeklyHours) || 0));
        }
      });
    });
    return map;
  }, [schoolClasses]);

  const handleToggleClassAssignment = (classId: string) => {
    if (!teacher) return;
    const targetSubjectId = batchSubjectId || defaultSubjectId;
    const targetClass = resolveCanonicalClass(classId);
    const targetClassId = targetClass ? targetClass.id : classId;
    const targetClassName = targetClass ? normalizeClassName(targetClass.name).toUpperCase() : "";

    const existingIndex = assignments.findIndex((a) => {
      if (a.subjectId !== targetSubjectId) return false;
      if (a.classId === targetClassId) return true;
      const aClass = resolveCanonicalClass(a.classId);
      return aClass && normalizeClassName(aClass.name).toUpperCase() === targetClassName;
    });

    if (existingIndex >= 0) {
      setAssignments((prev) =>
        prev.filter((a, i) => {
          if (i === existingIndex) return false;
          if (a.subjectId !== targetSubjectId) return true;
          if (a.classId === targetClassId) return false;
          const aClass = resolveCanonicalClass(a.classId);
          return !(aClass && normalizeClassName(aClass.name).toUpperCase() === targetClassName);
        })
      );
    } else {
      const cls = targetClass;
      const standardHours = batchHours || (cls && cls.grade >= 5 ? 3 : 4);

      // QAT'IY QOIDA (Ironclad Rule 9): Yangi biriktirilgan dars doim WHOLE (butun sinf) bo'ladi.
      // Faqat va faqat foydalanuvchi sinfda avval o'zi ushbu fanni GROUP_1/GROUP_2 ga ajratgan bo'lsagina guruh saqlanadi!
      const existingClassSub = (cls?.subjects || []).find((s) => s.subjectId === targetSubjectId);
      const isSplit = existingClassSub?.groupType === "GROUP_1" || existingClassSub?.groupType === "GROUP_2";
      const secondTeacherSub = isSplit
        ? (cls?.subjects || []).find((s) => s.subjectId === targetSubjectId && s.teacherId !== teacher.id)
        : undefined;
      const hours = existingClassSub ? Number(existingClassSub.weeklyHours) || standardHours : standardHours;

      setAssignments((prev) => [
        ...prev.filter((a) => {
          if (a.subjectId !== targetSubjectId) return true;
          if (a.classId === targetClassId) return false;
          const aClass = resolveCanonicalClass(a.classId);
          return !(aClass && normalizeClassName(aClass.name).toUpperCase() === targetClassName);
        }),
        {
          classId: targetClassId,
          subjectId: targetSubjectId,
          weeklyHours: hours,
          isSplit: Boolean(isSplit),
          groupType: isSplit ? (existingClassSub?.groupType || "GROUP_1") : "WHOLE",
          secondTeacherId: secondTeacherSub ? secondTeacherSub.teacherId : undefined,
        },
      ]);
    }
  };

  const handleBulkSelectGrade = (grade: number) => {
    if (!teacher) return;
    const targetSubjectId = batchSubjectId || defaultSubjectId;
    const gradeClasses = schoolClasses.filter((c) => c.grade === grade);
    if (gradeClasses.length === 0) return;

    const allSelected = gradeClasses.every((c) => {
      const normName = normalizeClassName(c.name).toUpperCase();
      return assignments.some((a) => {
        if (a.subjectId !== targetSubjectId) return false;
        if (a.classId === c.id) return true;
        const aCls = resolveCanonicalClass(a.classId);
        return aCls && normalizeClassName(aCls.name).toUpperCase() === normName;
      });
    });

    if (allSelected) {
      const gradeClassNormNames = new Set(gradeClasses.map((c) => normalizeClassName(c.name).toUpperCase()));
      const gradeClassIds = new Set(gradeClasses.map((c) => c.id));
      setAssignments((prev) =>
        prev.filter((a) => {
          if (a.subjectId !== targetSubjectId) return true;
          if (gradeClassIds.has(a.classId)) return false;
          const aCls = resolveCanonicalClass(a.classId);
          return !(aCls && gradeClassNormNames.has(normalizeClassName(aCls.name).toUpperCase()));
        })
      );
    } else {
      const newItems: TeacherClassAssignment[] = [];
      gradeClasses.forEach((c) => {
        const normName = normalizeClassName(c.name).toUpperCase();
        const alreadyAssigned = assignments.some((a) => {
          if (a.subjectId !== targetSubjectId) return false;
          if (a.classId === c.id) return true;
          const aCls = resolveCanonicalClass(a.classId);
          return aCls && normalizeClassName(aCls.name).toUpperCase() === normName;
        });

        if (!alreadyAssigned) {
          const existingClassSub = (c.subjects || []).find((s) => s.subjectId === targetSubjectId);
          const isSplit = existingClassSub?.groupType === "GROUP_1" || existingClassSub?.groupType === "GROUP_2";
          const secondTeacherSub = isSplit
            ? (c.subjects || []).find((s) => s.subjectId === targetSubjectId && s.teacherId !== teacher.id)
            : undefined;
          const hours = existingClassSub ? Number(existingClassSub.weeklyHours) || (batchHours || 3) : (batchHours || 3);

          newItems.push({
            classId: c.id,
            subjectId: targetSubjectId,
            weeklyHours: hours,
            isSplit: Boolean(isSplit),
            groupType: isSplit ? (existingClassSub?.groupType || "GROUP_1") : "WHOLE",
            secondTeacherId: secondTeacherSub ? secondTeacherSub.teacherId : undefined,
          });
        }
      });
      setAssignments((prev) => [...prev, ...newItems]);
    }
  };

  const handleAddAssignment = () => {
    const unassignedClass = schoolClasses.find((c) => {
      const normName = normalizeClassName(c.name).toUpperCase();
      return !assignments.some((a) => {
        if (a.subjectId !== defaultSubjectId) return false;
        if (a.classId === c.id) return true;
        const aCls = resolveCanonicalClass(a.classId);
        return aCls && normalizeClassName(aCls.name).toUpperCase() === normName;
      });
    });
    const classId = unassignedClass ? unassignedClass.id : schoolClasses[0]?.id || "";

    setAssignments((prev) => [
      ...prev,
      {
        classId,
        subjectId: defaultSubjectId,
        weeklyHours: batchHours || 4,
        isSplit: false,
        groupType: "WHOLE",
      },
    ]);
  };

  const handleRemoveAssignment = (index: number) => {
    setAssignments((prev) => {
      const target = prev[index];
      if (!target) return prev.filter((_, i) => i !== index);
      const targetClass = resolveCanonicalClass(target.classId);
      const targetName = targetClass ? normalizeClassName(targetClass.name).toUpperCase() : target.classId;

      return prev.filter((item, i) => {
        if (i === index) return false;
        const itemClass = resolveCanonicalClass(item.classId);
        const itemName = itemClass ? normalizeClassName(itemClass.name).toUpperCase() : item.classId;
        if (itemName === targetName && item.subjectId === target.subjectId) return false;
        return true;
      });
    });
  };

  const handleStepHours = (index: number, delta: number) => {
    setAssignments((prev) => {
      const target = prev[index];
      if (!target) return prev;
      const targetClass = resolveCanonicalClass(target.classId);
      const targetName = targetClass ? normalizeClassName(targetClass.name).toUpperCase() : target.classId;
      const current = Number(target.weeklyHours) || 0;
      const next = Math.max(1, Math.min(12, current + delta));

      return prev.map((item, i) => {
        if (i === index) return { ...item, weeklyHours: next };
        const itemClass = resolveCanonicalClass(item.classId);
        const itemName = itemClass ? normalizeClassName(itemClass.name).toUpperCase() : item.classId;
        if (itemName === targetName && item.subjectId === target.subjectId) {
          return { ...item, weeklyHours: next };
        }
        return item;
      });
    });
  };

  const handleUpdateAssignment = (
    index: number,
    key: keyof TeacherClassAssignment,
    val: any
  ) => {
    setAssignments((prev) => {
      const updated = prev.map((item, i) => (i === index ? { ...item, [key]: val } : item));
      const seen = new Set<string>();
      const result: TeacherClassAssignment[] = [];
      updated.forEach((item) => {
        const canonical = resolveCanonicalClass(item.classId);
        const normName = canonical ? normalizeClassName(canonical.name).toUpperCase() : item.classId;
        const dedupKey = `${normName}_${item.subjectId}`;
        if (!seen.has(dedupKey)) {
          seen.add(dedupKey);
          result.push(canonical && canonical.id !== item.classId ? { ...item, classId: canonical.id } : item);
        }
      });
      return result;
    });
  };

  const handleToggleSplit = (index: number) => {
    setAssignments((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const nextIsSplit = !item.isSplit;

        if (nextIsSplit) {
          const suitableTeacher = schoolTeachers.find(
            (t) => t.id !== teacher?.id && (t.subjectIds || []).includes(item.subjectId)
          );
          return {
            ...item,
            isSplit: true,
            groupType: "GROUP_1",
            secondTeacherId: item.secondTeacherId || suitableTeacher?.id || "",
          };
        } else {
          return {
            ...item,
            isSplit: false,
            groupType: "WHOLE",
            secondTeacherId: undefined,
          };
        }
      })
    );
  };

  const handleSave = () => {
    if (!teacher) return;
    let valid = assignments.filter(
      (a) => a.classId && a.subjectId && Number(a.weeklyHours) > 0
    );

    const homeroomClassId =
      teacher.homeroomClassId ||
      schoolClasses.find((c) => c.homeroomTeacherId === teacher.id)?.id;

    if (homeroomClassId) {
      const sinfSoatiSub =
        subjects.find((s) => isKelajakOrSinfSoatiSubject(s.id, s.name)) ||
        subjects.find((s) => s.id === "sub_sinf_soati");

      const hasHomeroomClassHour = valid.some((item) => {
        const sub = subjectMap.get(item.subjectId) || subjects.find((s) => s.id === item.subjectId);
        return (
          item.classId === homeroomClassId &&
          isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name)
        );
      });

      if (!hasHomeroomClassHour && sinfSoatiSub) {
        valid.unshift({
          classId: homeroomClassId,
          subjectId: sinfSoatiSub.id,
          weeklyHours: 1,
          isSplit: false,
          groupType: "WHOLE",
        });
      }
    }

    const seenSaveKeys = new Set<string>();
    const strictlyUniqueAssignments: TeacherClassAssignment[] = [];
    for (const a of valid) {
      const canonical = resolveCanonicalClass(a.classId);
      const normClassName = canonical ? normalizeClassName(canonical.name).toUpperCase() : a.classId;
      const key = `${normClassName}_${a.subjectId}`;
      if (!seenSaveKeys.has(key)) {
        seenSaveKeys.add(key);
        strictlyUniqueAssignments.push({
          ...a,
          classId: canonical ? canonical.id : a.classId,
        });
      }
    }

    onSave(teacher.id, strictlyUniqueAssignments);
    onClose();
  };

  const primaryClasses = useMemo(() => schoolClasses.filter((c) => c.grade <= 4), [schoolClasses]);
  const middleClasses = useMemo(() => schoolClasses.filter((c) => c.grade >= 5 && c.grade <= 9), [schoolClasses]);
  const highClasses = useMemo(() => schoolClasses.filter((c) => c.grade >= 10), [schoolClasses]);

  const availableGrades = useMemo(() => {
    const set = new Set<number>();
    schoolClasses.forEach((c) => set.add(c.grade));
    return Array.from(set).sort((a, b) => a - b);
  }, [schoolClasses]);

  const availableParallels = useMemo(() => {
    const set = new Set<string>();
    schoolClasses.forEach((c) => {
      const match = c.name.match(/[A-Za-zА-Яа-яЎўҚқҒғҲҳ]/);
      if (match) set.add(match[0].toUpperCase());
    });
    return Array.from(set).sort();
  }, [schoolClasses]);

  const availableBranches = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    schoolClasses.forEach((c) => {
      if (c.branchId && !map.has(c.branchId)) {
        const isBranch =
          c.branchId.toLowerCase().includes("filial") ||
          c.branchId === "b39_2" ||
          c.name.includes("-D");
        map.set(c.branchId, {
          id: c.branchId,
          name: isBranch ? "🏫 1-Filial" : "🏢 Asosiy bino",
        });
      }
    });
    return Array.from(map.values());
  }, [schoolClasses]);

  const isClassMatchingFilters = (c: SchoolClass) => {
    if (branchFilter !== "ALL" && c.branchId !== branchFilter) return false;
    if (parallelFilter !== "ALL") {
      const match = c.name.match(/[A-Za-zА-Яа-яЎўҚқҒғҲҳ]/);
      const letter = match ? match[0].toUpperCase() : "";
      if (letter !== parallelFilter) return false;
    }
    if (stageFilter === "PRIMARY" && c.grade > 4) return false;
    if (stageFilter === "HIGH" && c.grade < 5) return false;
    return true;
  };

  return {
    assignments,
    setAssignments,
    schoolClasses,
    subjectMap,
    classMap,
    schoolTeachers,
    teacherMap,
    resolveCanonicalClass,
    teacherSubjects,
    defaultSubjectId,
    batchSubjectId,
    setBatchSubjectId,
    batchHours,
    setBatchHours,
    isBatchOpen,
    setIsBatchOpen,
    branchFilter,
    setBranchFilter,
    parallelFilter,
    setParallelFilter,
    stageFilter,
    setStageFilter,
    uniqueAssignments,
    totalAssignedHours,
    totalHomeroomHours,
    totalPhysicalHours,
    capacity,
    remainingHours,
    isOverloaded,
    teacherWorkloadMap,
    handleToggleClassAssignment,
    handleBulkSelectGrade,
    handleAddAssignment,
    handleRemoveAssignment,
    handleStepHours,
    handleUpdateAssignment,
    handleToggleSplit,
    handleSave,
    primaryClasses,
    middleClasses,
    highClasses,
    availableGrades,
    availableParallels,
    availableBranches,
    isClassMatchingFilters,
  };
}
