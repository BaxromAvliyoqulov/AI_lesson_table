import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { SchoolClass, Subject, Teacher, ClassSubject } from "@/types";
import {
  generateStandardCurriculumForClass,
  isSubjectSuitableForGrade,
  isHomeroomPrimarySubject,
  isKelajakOrSinfSoatiSubject,
  isPrimaryGradeTeacher,
  UZBEKISTAN_STANDARD_CURRICULUM,
} from "@/lib/curriculum-templates";
import { SubjectCategory } from "./types";
import { deduplicateClassSubjects, getSubjectCategory } from "./curriculumUtils";

export interface GroupedSubjectItem {
  subjectId: string;
  isSplit: boolean;
  group1: ClassSubject;
  group2?: ClassSubject;
}

export function useCurriculumLogic({
  isOpen,
  onClose,
  onSave,
  targetClass,
  allSubjects,
  allTeachers,
  allClasses = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (classId: string, subjects: ClassSubject[]) => void;
  targetClass: SchoolClass | null;
  allSubjects: Subject[];
  allTeachers: Teacher[];
  allClasses?: SchoolClass[];
}) {
  const [subjectsList, setSubjectsList] = useState<ClassSubject[]>([]);
  const [selectedCopyClassId, setSelectedCopyClassId] = useState<string>("");
  const [viewMode, setViewMode] = useState<"LIST" | "WEEKLY_GRID">("LIST");
  const [curriculumFilter, setCurriculumFilter] = useState<"ALL" | "UNASSIGNED" | "ASSIGNED">("ALL");

  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState<SubjectCategory>("RECOMMENDED");
  const [selectedCatalogSubjectIds, setSelectedCatalogSubjectIds] = useState<Record<string, number>>({});
  const lastInitializedClassIdRef = useRef<string | null>(null);

  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const subjectMap = useMemo(() => new Map(allSubjects.map((s) => [s.id, s])), [allSubjects]);
  const teacherMap = useMemo(() => new Map(allTeachers.map((t) => [t.id, t])), [allTeachers]);
  const isTargetHighGrade = targetClass ? targetClass.grade >= 5 : false;

  const availableTeachers = useMemo(() => {
    if (isTargetHighGrade) {
      return allTeachers.filter((t) => !isPrimaryGradeTeacher(t, allClasses));
    }
    return allTeachers;
  }, [allTeachers, isTargetHighGrade, allClasses]);

  const cleanSubjectsList = useMemo(() => {
    return deduplicateClassSubjects(
      subjectsList,
      subjectMap,
      allSubjects,
      targetClass?.homeroomTeacherId
    );
  }, [subjectsList, subjectMap, allSubjects, targetClass?.homeroomTeacherId]);

  useEffect(() => {
    if (!isOpen || !targetClass) {
      lastInitializedClassIdRef.current = null;
      setSubjectsList([]);
      return;
    }

    const classKey = `${targetClass.id}_${(targetClass.subjects || []).length}_${targetClass.homeroomTeacherId || ""}`;
    if (lastInitializedClassIdRef.current !== classKey) {
      lastInitializedClassIdRef.current = classKey;
      const cleanList = deduplicateClassSubjects(
        targetClass.subjects || [],
        subjectMap,
        allSubjects,
        targetClass.homeroomTeacherId
      );
      setSubjectsList(cleanList);
      setSelectedCopyClassId("");
      setIsCatalogOpen(false);
      setCatalogSearch("");
      setSelectedCatalogSubjectIds({});
    }
  }, [isOpen, targetClass?.id, targetClass?.subjects?.length, targetClass?.homeroomTeacherId, targetClass, subjectMap, allSubjects]);

  const { academicHours, homeroomHours, totalWeeklyHours, unassignedTeachersCount } = useMemo(() => {
    let academic = 0;
    let homeroom = 0;
    let unassigned = 0;
    for (const item of cleanSubjectsList) {
      const sub = subjectMap.get(item.subjectId) || allSubjects.find((s) => s.id === item.subjectId);
      const isSinfSoati =
        item.subjectId === "sub_sinf_soati" ||
        item.subjectId === "sub_kelajak" ||
        isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name);

      const h = Number(item.weeklyHours) || 0;
      if (item.groupType !== "GROUP_2") {
        if (isSinfSoati) {
          homeroom += h;
        } else {
          academic += h;
        }
      }
      if (!item.teacherId) {
        unassigned++;
      }
    }
    return {
      academicHours: academic,
      homeroomHours: homeroom,
      totalWeeklyHours: academic + homeroom,
      unassignedTeachersCount: unassigned,
    };
  }, [cleanSubjectsList, subjectMap, allSubjects]);

  const groupedSubjectsList = useMemo(() => {
    const map = new Map<string, GroupedSubjectItem>();
    const order: string[] = [];

    for (const item of cleanSubjectsList) {
      const existing = map.get(item.subjectId);
      if (!existing) {
        order.push(item.subjectId);
        if (item.groupType === "GROUP_2") {
          map.set(item.subjectId, {
            subjectId: item.subjectId,
            isSplit: true,
            group1: { ...item, groupType: "GROUP_1", teacherId: "" },
            group2: item,
          });
        } else if (item.groupType === "GROUP_1") {
          map.set(item.subjectId, {
            subjectId: item.subjectId,
            isSplit: true,
            group1: item,
          });
        } else {
          map.set(item.subjectId, {
            subjectId: item.subjectId,
            isSplit: false,
            group1: item,
          });
        }
      } else {
        if (item.groupType === "GROUP_2") {
          existing.isSplit = true;
          existing.group2 = item;
        } else if (item.groupType === "GROUP_1") {
          existing.isSplit = true;
          existing.group1 = item;
        }
      }
    }

    return order.map((id) => map.get(id)!);
  }, [cleanSubjectsList]);

  const assignedTeachersCount = cleanSubjectsList.length - unassignedTeachersCount;
  const fulfillmentPercent = cleanSubjectsList.length > 0 ? Math.round((assignedTeachersCount / cleanSubjectsList.length) * 100) : 100;

  const visibleGroupedList = useMemo(() => {
    if (curriculumFilter === "UNASSIGNED") {
      return groupedSubjectsList.filter(
        (g) => !g.group1.teacherId || (g.isSplit && !g.group2?.teacherId)
      );
    }
    if (curriculumFilter === "ASSIGNED") {
      return groupedSubjectsList.filter(
        (g) => !!g.group1.teacherId && (!g.isSplit || !!g.group2?.teacherId)
      );
    }
    return groupedSubjectsList;
  }, [groupedSubjectsList, curriculumFilter]);

  const recommendedHours = useMemo(() => {
    if (!targetClass) return 35;
    const g = targetClass.grade;
    if (g === 1) return 22;
    if (g === 2) return 24;
    if (g === 3) return 25;
    if (g === 4) return 25;
    if (g === 5) return 30;
    if (g === 6) return 31;
    if (g === 7) return 36;
    if (g === 8) return 35;
    if (g === 9) return 35;
    if (g === 10) return 34;
    if (g === 11) return 34;
    return 35;
  }, [targetClass]);

  const maxSanPiNHours = useMemo(() => {
    if (!targetClass) return 36;
    const g = targetClass.grade;
    if (g === 1) return 24;
    if (g <= 4) return 26;
    return 36;
  }, [targetClass]);

  const loadPercent = Math.min(100, Math.round((totalWeeklyHours / recommendedHours) * 100));
  const isOverloaded = totalWeeklyHours > maxSanPiNHours;

  const gradeTemplateDefaultHours = useMemo(() => {
    const map = new Map<string, number>();
    if (!targetClass) return map;
    const gradeTemplates = UZBEKISTAN_STANDARD_CURRICULUM[targetClass.grade] || [];
    gradeTemplates.forEach((item) => {
      allSubjects.forEach((s) => {
        const sName = s.name.toLowerCase();
        if (
          s.id === item.prioritySubjectId ||
          item.searchAliases.some((alias) => sName.includes(alias.toLowerCase()))
        ) {
          map.set(s.id, item.defaultHours);
        }
      });
    });
    return map;
  }, [targetClass, allSubjects]);

  const filteredCatalogSubjects = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return allSubjects.filter((s) => {
      if (s.isActive === false) return false;
      if (query) {
        const matchesName = s.name.toLowerCase().includes(query);
        const matchesShort = s.shortName?.toLowerCase().includes(query);
        if (!matchesName && !matchesShort) return false;
      }
      if (catalogCategory === "RECOMMENDED") {
        return targetClass ? isSubjectSuitableForGrade(s, targetClass.grade) : true;
      }
      if (catalogCategory !== "ALL") {
        return getSubjectCategory(s) === catalogCategory;
      }
      return true;
    });
  }, [allSubjects, catalogSearch, catalogCategory, targetClass]);

  const copyableClasses = useMemo(() => {
    if (!targetClass) return [];
    return allClasses.filter(
      (c) => c.id !== targetClass.id && (c.subjects?.length || 0) > 0
    );
  }, [allClasses, targetClass]);

  const is5DayWeek = (targetClass?.grade ?? 1) <= 4 || Boolean(targetClass?.isPrimary);
  const daysCount = is5DayWeek ? 5 : 6;
  const dayNames = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"].slice(0, daysCount);

  const weeklyDistribution = useMemo(() => {
    const days: Array<Array<{ subject: Subject; teacher?: Teacher; hoursCount: number }>> = Array.from(
      { length: daysCount },
      () => []
    );
    if (!targetClass) return days;

    let dayIdx = 0;
    cleanSubjectsList.forEach((item) => {
      if (item.groupType === "GROUP_2") return;
      const sub = subjectMap.get(item.subjectId) || allSubjects.find((s) => s.id === item.subjectId);
      if (!sub) return;
      const teacher = teacherMap.get(item.teacherId);
      const isSinfSoati =
        item.subjectId === "sub_sinf_soati" ||
        item.subjectId === "sub_kelajak" ||
        isKelajakOrSinfSoatiSubject(item.subjectId, sub.name);

      if (isSinfSoati) {
        days[0].unshift({ subject: sub, teacher, hoursCount: item.weeklyHours });
        return;
      }

      const hours = Number(item.weeklyHours) || 1;
      for (let h = 0; h < hours; h++) {
        days[dayIdx % daysCount].push({ subject: sub, teacher, hoursCount: 1 });
        dayIdx++;
      }
    });

    return days;
  }, [cleanSubjectsList, daysCount, subjectMap, teacherMap, targetClass, allSubjects]);

  const handleLoadStandardTemplate = () => {
    if (!targetClass) return;
    const generated = generateStandardCurriculumForClass(
      targetClass.grade,
      targetClass.id,
      targetClass.homeroomTeacherId,
      allSubjects,
      allTeachers,
      undefined,
      allClasses
    );

    if (generated.length === 0) {
      showToast("Maktabingizda mos fanlar katalogi topilmadi. Avval Fanlar bo'limini tekshiring.");
      return;
    }

    setSubjectsList(deduplicateClassSubjects(generated, subjectMap, allSubjects, targetClass.homeroomTeacherId));
    if (targetClass.grade <= 4) {
      showToast(`✅ ${targetClass.grade}-sinf standart rejasi yuklandi! Ona tili, O'qish va Matematika sinf rahbariga biriktirildi.`);
    } else {
      showToast(`✅ ${targetClass.grade}-sinf davlat standart o'quv rejasi yuklandi!`);
    }
  };

  const handleApplyPrimaryHomeroomRule = () => {
    if (!targetClass || !targetClass.homeroomTeacherId) {
      showToast("Avval ushbu sinfga sinf rahbarini tayinlang!");
      return;
    }
    const hrId = targetClass.homeroomTeacherId;

    const updated = cleanSubjectsList.map((item) => {
      const sub = subjectMap.get(item.subjectId) || allSubjects.find((s) => s.id === item.subjectId);
      if (!sub) return item;
      const isCore = isHomeroomPrimarySubject(sub, targetClass.grade);
      if (isCore && item.teacherId !== hrId) {
        return { ...item, teacherId: hrId };
      }
      return item;
    });

    setSubjectsList(deduplicateClassSubjects(updated, subjectMap, allSubjects, targetClass.homeroomTeacherId));
    showToast(`✅ Boshlang'ich qoida qo'llandi: Ona tili, O'qish va Matematika sinf rahbariga biriktirildi!`);
  };

  const handleCopyFromOtherClass = () => {
    if (!targetClass || !selectedCopyClassId) return;
    const sourceClass = allClasses.find((c) => c.id === selectedCopyClassId);
    if (!sourceClass || !sourceClass.subjects) return;

    const copiedList: ClassSubject[] = sourceClass.subjects.map((cs) => {
      if (
        (cs.subjectId === "sub_sinf_soati" || cs.subjectId.includes("sinf_soati")) &&
        targetClass.homeroomTeacherId
      ) {
        return {
          ...cs,
          classId: targetClass.id,
          teacherId: targetClass.homeroomTeacherId,
        };
      }
      return {
        ...cs,
        classId: targetClass.id,
      };
    });

    setSubjectsList(deduplicateClassSubjects(copiedList, subjectMap, allSubjects, targetClass.homeroomTeacherId));
    setSelectedCopyClassId("");
    showToast("✅ Tanlangan sinfdan o'quv rejasi nusxalandi!");
  };

  const handleToggleSplitGroup = (subjectId: string) => {
    setSubjectsList((prev) => {
      const list = deduplicateClassSubjects(prev, subjectMap, allSubjects, targetClass?.homeroomTeacherId);
      const isCurrentlySplit = list.some((s) => s.subjectId === subjectId && s.groupType === "GROUP_2");

      if (isCurrentlySplit) {
        const updated: ClassSubject[] = [];
        let kept = false;
        for (const s of list) {
          if (s.subjectId === subjectId) {
            if (!kept) {
              kept = true;
              updated.push({ ...s, groupType: "WHOLE" });
            }
          } else {
            updated.push(s);
          }
        }
        showToast("✅ Guruhlar butun sinfga birlashtirildi");
        return deduplicateClassSubjects(updated, subjectMap, allSubjects, targetClass?.homeroomTeacherId);
      } else {
        const targetItem = list.find((s) => s.subjectId === subjectId);
        if (!targetItem) return list;

        const candidates = allTeachers.filter(
          (t) => t.subjectIds?.includes(subjectId) && t.id !== targetItem.teacherId
        );
        const secondTeacherId = candidates[0]?.id || "";

        const updated: ClassSubject[] = [];
        for (const s of list) {
          if (s.subjectId === subjectId) {
            updated.push({ ...s, groupType: "GROUP_1" });
            updated.push({
              classId: targetItem.classId,
              subjectId: targetItem.subjectId,
              weeklyHours: targetItem.weeklyHours,
              teacherId: secondTeacherId,
              groupType: "GROUP_2",
            });
          } else {
            updated.push(s);
          }
        }
        showToast("👥 Fan 2 guruhga (1-guruh va 2-guruh) ajratildi!");
        return deduplicateClassSubjects(updated, subjectMap, allSubjects, targetClass?.homeroomTeacherId);
      }
    });
  };

  const handleUpdateGroupTeacher = (
    subjectId: string,
    groupType: "WHOLE" | "GROUP_1" | "GROUP_2",
    teacherId: string
  ) => {
    setSubjectsList((prev) => {
      const list = deduplicateClassSubjects(prev, subjectMap, allSubjects, targetClass?.homeroomTeacherId);

      if (groupType === "GROUP_2") {
        const hasGroup2 = list.some(
          (item) => item.subjectId === subjectId && item.groupType === "GROUP_2"
        );
        if (!hasGroup2) {
          const group1Item = list.find((item) => item.subjectId === subjectId);
          const newGroup2Item: ClassSubject = {
            classId: targetClass?.id || "",
            subjectId,
            weeklyHours: group1Item?.weeklyHours || 1,
            teacherId,
            groupType: "GROUP_2",
          };
          const updated = list.map((item) =>
            item.subjectId === subjectId ? { ...item, groupType: "GROUP_1" as const } : item
          );
          return deduplicateClassSubjects(
            [...updated, newGroup2Item],
            subjectMap,
            allSubjects,
            targetClass?.homeroomTeacherId
          );
        }
      }

      if (groupType === "GROUP_1") {
        const hasGroup1 = list.some(
          (item) => item.subjectId === subjectId && (item.groupType === "GROUP_1" || item.groupType === "WHOLE")
        );
        if (!hasGroup1) {
          const newGroup1Item: ClassSubject = {
            classId: targetClass?.id || "",
            subjectId,
            weeklyHours: 1,
            teacherId,
            groupType: "GROUP_1",
          };
          return deduplicateClassSubjects(
            [...list, newGroup1Item],
            subjectMap,
            allSubjects,
            targetClass?.homeroomTeacherId
          );
        }
      }

      return list.map((item) => {
        if (item.subjectId === subjectId) {
          const gType = item.groupType || "WHOLE";
          if (
            gType === groupType ||
            (groupType === "WHOLE" && (gType === "WHOLE" || gType === "GROUP_1"))
          ) {
            return { ...item, teacherId };
          }
        }
        return item;
      });
    });
  };

  const handleStepSubjectHours = (subjectId: string, delta: number) => {
    setSubjectsList((prev) => {
      const list = deduplicateClassSubjects(prev, subjectMap, allSubjects, targetClass?.homeroomTeacherId);
      return list.map((item) => {
        if (item.subjectId === subjectId) {
          const current = Number(item.weeklyHours) || 0;
          const next = Math.max(1, Math.min(12, current + delta));
          return { ...item, weeklyHours: next };
        }
        return item;
      });
    });
  };

  const handleSetSubjectPresetHours = (subjectId: string, hours: number) => {
    setSubjectsList((prev) => {
      const list = deduplicateClassSubjects(prev, subjectMap, allSubjects, targetClass?.homeroomTeacherId);
      return list.map((item) => {
        if (item.subjectId === subjectId) {
          return { ...item, weeklyHours: hours };
        }
        return item;
      });
    });
  };

  const handleRemoveSubjectBySubjectId = (subjectId: string) => {
    setSubjectsList((prev) => {
      const list = deduplicateClassSubjects(prev, subjectMap, allSubjects, targetClass?.homeroomTeacherId);
      return list.filter((item) => item.subjectId !== subjectId);
    });
  };

  const handleUpdateSubjectId = (oldSubjectId: string, newSubjectId: string) => {
    setSubjectsList((prev) => {
      const list = deduplicateClassSubjects(prev, subjectMap, allSubjects, targetClass?.homeroomTeacherId);
      const suitableTeacher = allTeachers.find((t) => t.subjectIds?.includes(newSubjectId));
      return list.map((item) => {
        if (item.subjectId === oldSubjectId) {
          return {
            ...item,
            subjectId: newSubjectId,
            teacherId: suitableTeacher ? suitableTeacher.id : item.teacherId,
          };
        }
        return item;
      });
    });
  };

  const handleToggleCatalogSubject = (subId: string) => {
    setSelectedCatalogSubjectIds((prev) => {
      const copy = { ...prev };
      if (copy[subId] !== undefined) {
        delete copy[subId];
      } else {
        const defaultHours = gradeTemplateDefaultHours.get(subId) || 2;
        copy[subId] = defaultHours;
      }
      return copy;
    });
  };

  const handleStepCatalogHours = (subId: string, delta: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCatalogSubjectIds((prev) => {
      const current = prev[subId] || 2;
      const next = Math.max(1, Math.min(10, current + delta));
      return { ...prev, [subId]: next };
    });
  };

  const handleAddSelectedFromCatalog = () => {
    if (!targetClass) return;
    const toAdd: ClassSubject[] = [];
    const existingIds = new Set(subjectsList.map((s) => s.subjectId));

    Object.entries(selectedCatalogSubjectIds).forEach(([subId, hours]) => {
      if (existingIds.has(subId)) return;

      const sub = subjectMap.get(subId);
      const isSinfSoati =
        subId === "sub_sinf_soati" ||
        subId === "sub_kelajak" ||
        sub?.name.toLowerCase().includes("sinf soati") ||
        sub?.name.toLowerCase().includes("kelajak");

      let teacherId = "";
      if (isSinfSoati && targetClass.homeroomTeacherId) {
        teacherId = targetClass.homeroomTeacherId;
      } else {
        const suitableTeacher = allTeachers.find((t) => t.subjectIds?.includes(subId));
        teacherId = suitableTeacher
          ? suitableTeacher.id
          : targetClass.homeroomTeacherId
          ? targetClass.homeroomTeacherId
          : availableTeachers[0]?.id || allTeachers[0]?.id || "";
      }

      toAdd.push({
        classId: targetClass.id,
        subjectId: subId,
        teacherId,
        weeklyHours: hours,
        groupType: "WHOLE",
      });
    });

    if (toAdd.length > 0) {
      setSubjectsList((prev) => [...prev, ...toAdd]);
      showToast(`✅ ${toAdd.length} ta fan o'quv rejasiga qo'shildi`);
    }

    setSelectedCatalogSubjectIds({});
    setIsCatalogOpen(false);
  };

  const handleAddNewSubjectRow = () => {
    if (!targetClass) return;
    const existingIds = new Set(subjectsList.map((s) => s.subjectId));
    const nextSub =
      allSubjects.find((s) => !existingIds.has(s.id) && isSubjectSuitableForGrade(s, targetClass.grade)) ||
      allSubjects.find((s) => !existingIds.has(s.id)) ||
      allSubjects[0];
    if (!nextSub) return;

    const suitableTeacher =
      allTeachers.find((t) => t.subjectIds?.includes(nextSub.id)) ||
      (targetClass.homeroomTeacherId ? allTeachers.find((t) => t.id === targetClass.homeroomTeacherId) : null) ||
      availableTeachers[0] ||
      allTeachers[0];

    const newItem: ClassSubject = {
      classId: targetClass.id,
      subjectId: nextSub.id,
      teacherId: suitableTeacher ? suitableTeacher.id : (allTeachers[0]?.id || ""),
      weeklyHours: 2,
      groupType: "WHOLE",
    };

    setSubjectsList((prev) => [...prev, newItem]);
    showToast(`✅ "${nextSub.name}" fani o'quv rejasiga qo'shildi`);
  };

  const handleAutoAssignSpecialists = () => {
    if (!targetClass || subjectsList.length === 0) return;

    const localTracker = new Map<string, number>();
    subjectsList.forEach((s) => {
      if (s.teacherId) {
        localTracker.set(
          s.teacherId,
          (localTracker.get(s.teacherId) || 0) + (Number(s.weeklyHours) || 0)
        );
      }
    });

    let assignedCountNow = 0;
    let fixedMismatchCount = 0;

    const updated = subjectsList.map((item) => {
      const sub = subjectMap.get(item.subjectId);
      const isSinfSoati =
        item.subjectId === "sub_sinf_soati" ||
        item.subjectId === "sub_kelajak" ||
        sub?.name.toLowerCase().includes("sinf soati") ||
        sub?.name.toLowerCase().includes("kelajak");

      if (
        targetClass.homeroomTeacherId &&
        (isSinfSoati || (targetClass.grade <= 4 && sub && isHomeroomPrimarySubject(sub, targetClass.grade)))
      ) {
        if (item.teacherId !== targetClass.homeroomTeacherId) {
          assignedCountNow++;
          return { ...item, teacherId: targetClass.homeroomTeacherId };
        }
        return item;
      }

      const isHighGrade = targetClass.grade >= 5;
      const specialistCandidates = allTeachers.filter((t) => {
        if (!t.subjectIds?.includes(item.subjectId)) return false;
        if (isHighGrade && isPrimaryGradeTeacher(t, allClasses)) return false;
        return true;
      });

      const isCurrentTeacherPrimaryMismatch = isHighGrade && item.teacherId && isPrimaryGradeTeacher(
        allTeachers.find((t) => t.id === item.teacherId) || ({ id: item.teacherId } as any),
        allClasses
      );

      if (item.teacherId && specialistCandidates.some((c) => c.id === item.teacherId) && !isCurrentTeacherPrimaryMismatch) {
        return item;
      }

      if (specialistCandidates.length === 0) {
        return item;
      }

      let bestTeacher = specialistCandidates[0];
      let minLoad = Infinity;
      for (const t of specialistCandidates) {
        const load = localTracker.get(t.id) || 0;
        const cap = t.weeklyHourCapacity || 20;
        const score = load + (load >= cap ? 1000 : 0);
        if (score < minLoad) {
          minLoad = score;
          bestTeacher = t;
        }
      }

      if (bestTeacher) {
        if (item.teacherId) fixedMismatchCount++;
        else assignedCountNow++;
        const cur = localTracker.get(bestTeacher.id) || 0;
        localTracker.set(bestTeacher.id, cur + (Number(item.weeklyHours) || 0));
        return { ...item, teacherId: bestTeacher.id };
      }

      return item;
    });

    setSubjectsList(updated);
    if (assignedCountNow > 0 || fixedMismatchCount > 0) {
      showToast(
        `🎉 ${assignedCountNow + fixedMismatchCount} ta fan mutaxassislari muvaffaqiyatli yangilandi!`
      );
    } else {
      showToast("Barcha fanlarga o'z mutaxassislari to'g'ri biriktirilgan!");
    }
  };

  const handleSave = () => {
    if (!targetClass) return;
    let finalList = [...cleanSubjectsList];

    const localTracker = new Map<string, number>();
    finalList.forEach((s) => {
      if (s.teacherId) {
        localTracker.set(s.teacherId, (localTracker.get(s.teacherId) || 0) + (Number(s.weeklyHours) || 0));
      }
    });

    finalList = finalList.map((item) => {
      if (item.teacherId) return item;

      const sub = subjectMap.get(item.subjectId) || allSubjects.find((s) => s.id === item.subjectId);
      const isSinfSoati =
        item.subjectId === "sub_sinf_soati" ||
        item.subjectId === "sub_kelajak" ||
        isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name);

      if (
        targetClass.homeroomTeacherId &&
        (isSinfSoati || (targetClass.grade <= 4 && sub && isHomeroomPrimarySubject(sub, targetClass.grade)))
      ) {
        return { ...item, teacherId: targetClass.homeroomTeacherId };
      }

      const specialistCandidates = allTeachers.filter((t) => t.subjectIds?.includes(item.subjectId));
      const pool =
        specialistCandidates.length > 0
          ? specialistCandidates
          : availableTeachers.length > 0
          ? availableTeachers
          : allTeachers;

      if (pool.length > 0) {
        let bestTeacher = pool[0];
        let minLoad = Infinity;
        for (const t of pool) {
          const load = localTracker.get(t.id) || 0;
          const cap = t.weeklyHourCapacity || 20;
          const score = load + (load >= cap ? 1000 : 0);
          if (score < minLoad) {
            minLoad = score;
            bestTeacher = t;
          }
        }
        const current = localTracker.get(bestTeacher.id) || 0;
        localTracker.set(bestTeacher.id, current + (Number(item.weeklyHours) || 0));
        return { ...item, teacherId: bestTeacher.id };
      }

      const fallbackTeacher =
        (targetClass.homeroomTeacherId && allTeachers.find((t) => t.id === targetClass.homeroomTeacherId)) ||
        availableTeachers[0] ||
        allTeachers[0];

      return { ...item, teacherId: fallbackTeacher?.id || "" };
    });

    const dedupedList = deduplicateClassSubjects(
      finalList,
      subjectMap,
      allSubjects,
      targetClass.homeroomTeacherId
    );

    const defaultFallbackId =
      (targetClass.homeroomTeacherId && allTeachers.find((t) => t.id === targetClass.homeroomTeacherId)?.id) ||
      availableTeachers[0]?.id ||
      allTeachers[0]?.id ||
      "";

    const fullyAssigned = dedupedList.map((s) => ({
      ...s,
      teacherId: s.teacherId || defaultFallbackId,
    }));

    const validList = fullyAssigned.filter(
      (s) => s.subjectId && s.teacherId && Number(s.weeklyHours) > 0
    );

    onSave(targetClass.id, validList);
    onClose();
  };

  const handleConfirmClear = () => {
    setSubjectsList([]);
    setIsClearConfirmOpen(false);
    showToast("Fanlar ro'yxati tozalandi");
  };

  return {
    subjectsList,
    setSubjectsList,
    selectedCopyClassId,
    setSelectedCopyClassId,
    viewMode,
    setViewMode,
    curriculumFilter,
    setCurriculumFilter,
    isCatalogOpen,
    setIsCatalogOpen,
    catalogSearch,
    setCatalogSearch,
    catalogCategory,
    setCatalogCategory,
    selectedCatalogSubjectIds,
    isClearConfirmOpen,
    setIsClearConfirmOpen,
    toastMessage,
    showToast,
    subjectMap,
    teacherMap,
    availableTeachers,
    cleanSubjectsList,
    groupedSubjectsList,
    visibleGroupedList,
    academicHours,
    homeroomHours,
    totalWeeklyHours,
    unassignedTeachersCount,
    assignedTeachersCount,
    fulfillmentPercent,
    recommendedHours,
    maxSanPiNHours,
    loadPercent,
    isOverloaded,
    filteredCatalogSubjects,
    copyableClasses,
    daysCount,
    dayNames,
    weeklyDistribution,
    handleLoadStandardTemplate,
    handleApplyPrimaryHomeroomRule,
    handleCopyFromOtherClass,
    handleToggleSplitGroup,
    handleUpdateGroupTeacher,
    handleStepSubjectHours,
    handleSetSubjectPresetHours,
    handleRemoveSubjectBySubjectId,
    handleUpdateSubjectId,
    handleToggleCatalogSubject,
    handleStepCatalogHours,
    handleAddSelectedFromCatalog,
    handleAddNewSubjectRow,
    handleAutoAssignSpecialists,
    handleSave,
    handleConfirmClear,
  };
}
