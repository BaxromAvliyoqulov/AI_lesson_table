"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Teacher, Subject, SchoolClass } from "@/types";
import {
  isSubjectSuitableForGrade,
  isKelajakOrSinfSoatiSubject,
  isSubjectEligibleForSplit,
} from "@/lib/curriculum-templates";
import { sortClassesByName, normalizeClassName } from "@/lib/utils";
import {
  X,
  Plus,
  Trash2,
  Clock,
  BookOpen,
  GraduationCap,
  Minus,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Users2,
  UserCheck,
  Check,
  Zap,
  Building2,
} from "lucide-react";

export interface TeacherClassAssignment {
  classId: string;
  subjectId: string;
  weeklyHours: number;
  isSplit?: boolean;
  groupType?: "WHOLE" | "GROUP_1" | "GROUP_2";
  secondTeacherId?: string;
}

interface TeacherWorkloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: Teacher | null;
  classes: SchoolClass[];
  subjects: Subject[];
  teachers?: Teacher[];
  onSave: (teacherId: string, assignments: TeacherClassAssignment[]) => void;
}

export const TeacherWorkloadModal: React.FC<TeacherWorkloadModalProps> = ({
  isOpen,
  onClose,
  teacher,
  classes,
  subjects,
  teachers = [],
  onSave,
}) => {
  const [assignments, setAssignments] = useState<TeacherClassAssignment[]>([]);
  const lastInitializedTeacherIdRef = useRef<string | null>(null);

  // Faqat o'qituvchining maktabiga tegishli sinflarni olamiz va sinf nomi bo'yicha qat'iy deduplikatsiya qilamiz
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

  // Faqat shu maktab o'qituvchilarini tanlovga beramiz (boshqa maktab aralashib ketmasligi uchun)
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

  // Teacher's specialized subjects
  const teacherSubjects = useMemo(() => {
    if (!teacher) return [];
    return (teacher.subjectIds || [])
      .map((id) => subjectMap.get(id))
      .filter(Boolean) as Subject[];
  }, [teacher, subjectMap]);

  const defaultSubjectId = teacherSubjects[0]?.id || subjects[0]?.id || "";

  // Tezkor ommaviy sinf qo'shish paneli uchun state
  const [batchSubjectId, setBatchSubjectId] = useState<string>(defaultSubjectId);
  const [batchHours, setBatchHours] = useState<number>(4);
  const [isBatchOpen, setIsBatchOpen] = useState<boolean>(false);

  // Aqlli Filtrlash: Bino, Bosqich va Parallel (Harf) filtrlari
  const [branchFilter, setBranchFilter] = useState<string>("ALL");
  const [parallelFilter, setParallelFilter] = useState<string>("ALL");
  const [stageFilter, setStageFilter] = useState<"ALL" | "PRIMARY" | "HIGH">("ALL");

  // Collect all existing assignments for this teacher across all classes ONLY on open or teacher change
  useEffect(() => {
    if (!isOpen || !teacher) {
      lastInitializedTeacherIdRef.current = null;
      setAssignments([]);
      return;
    }

    if (lastInitializedTeacherIdRef.current !== teacher.id) {
      lastInitializedTeacherIdRef.current = teacher.id;
      setBatchSubjectId(teacherSubjects[0]?.id || subjects[0]?.id || "");

      // O'qituvchi profiliga qarab tezkor filtrlarni avtomatik moslash
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
              return; // Bir xil sinf va fan aslo 2 marta qo'shilmaydi!
            }

            // AVTOMATIK GURUH SEZISH: Ushbu sinfda ayni shu fanni o'tadigan boshqa o'qituvchini qidiramiz
            const otherTeacherSub = (cls.subjects || []).find(
              (other) =>
                other.subjectId === s.subjectId &&
                other.teacherId !== teacher.id &&
                Number(other.weeklyHours) > 0
            );

            // Agar guruh tipi GROUP_1/GROUP_2 bo'lsa YOKI sinfda ikkita o'qituvchi ayni fanni o'tsa -> AVTOMATIK SPLIT!
            const isSplit =
              s.groupType === "GROUP_1" ||
              s.groupType === "GROUP_2" ||
              Boolean(otherTeacherSub);

            const secondTeacherId = otherTeacherSub ? otherTeacherSub.teacherId : undefined;

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

      // KAFOLAT: Agar bu o'qituvchi sinf rahbari bo'lsa, uning sinfiga 1 soatlik Sinf soati avtomatik biriktiriladi!
      const homeroomClassId =
        teacher.homeroomClassId ||
        schoolClasses.find((c) => c.homeroomTeacherId === teacher.id)?.id;

      // KAFOLAT: O'qituvchining dars taqsimotida Sinf soati har doim MAKSIMUM 1 DANA bo'lishi shart!
      const sinfSoatiSub =
        subjects.find((s) => isKelajakOrSinfSoatiSubject(s.id, s.name)) ||
        subjects.find((s) => s.id === "sub_sinf_soati");

      // Barcha mavjud dublikat Sinf soatlarini olib tashlaymiz
      const filteredList = currentList.filter((item) => {
        const sub = subjectMap.get(item.subjectId) || subjects.find((s) => s.id === item.subjectId);
        return !isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name);
      });

      // Agar o'qituvchi sinf rahbari bo'lsa, o'z sinfiga FAQAT 1 DANA 1 soatlik Sinf soati qo'shamiz
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

  // 100% KAFOLAT: UI da har bir sinf va har bir fan uchun FAQAT VA FAQAT 1 DANA kartochka aks etadi!
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

  // Total hours assigned vs Teacher's capacity (Kelajak/Sinf soati dars stavkasidan qat'iy chegiriladi!)
  const { totalAssignedHours, totalHomeroomHours, totalPhysicalHours } = useMemo(() => {
    let assigned = 0;
    let homeroom = 0;
    uniqueAssignments.forEach(({ item }) => {
      const sub = subjectMap.get(item.subjectId) || subjects.find((s) => s.id === item.subjectId);
      const hours = Number(item.weeklyHours) || 0;
      // O'zbekiston xalq ta'limi qoidalariga ko'ra Kelajak/Sinf soati tarbiyaviy soat bo'lib,
      // u o'qituvchining umumiy pedagogik dars soati (stavkasi) yig'indisiga QO'SHILMAYDI!
      const isHomeroomClassHour = isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name);

      if (isHomeroomClassHour) {
        homeroom += hours;
      } else {
        assigned += hours;
      }
    });
    return {
      totalAssignedHours: assigned,
      totalHomeroomHours: homeroom,
      totalPhysicalHours: assigned + homeroom,
    };
  }, [uniqueAssignments, subjectMap, subjects, teacher?.homeroomClassId]);

  const capacity = teacher?.weeklyHourCapacity || 20;
  const remainingHours = capacity - totalAssignedHours;
  const isOverloaded = totalAssignedHours > capacity;

  // Har bir o'qituvchining joriy dars soatlari xaritasi (2-guruh ustozi tanlashda yuklamani ko'rsatish uchun)
  const teacherWorkloadMap = useMemo(() => {
    const map = new Map<string, number>();
    schoolClasses.forEach((cls) => {
      (cls.subjects || []).forEach((cs) => {
        const sub = subjectMap.get(cs.subjectId) || subjects.find((s) => s.id === cs.subjectId);
        if (cs.teacherId && !isKelajakOrSinfSoatiSubject(cs.subjectId, sub?.name)) {
          map.set(cs.teacherId, (map.get(cs.teacherId) || 0) + (Number(cs.weeklyHours) || 0));
        }
      });
    });
    return map;
  }, [schoolClasses, subjectMap, subjects]);

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
      // Allaqachon biriktirilgan -> o'chirish
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
      // Biriktirish
      const cls = targetClass;
      const standardHours = batchHours || (cls && cls.grade >= 5 ? 3 : 4);

      // AVTOMATIK GURUH SEZISH: bu sinfda bu fanni o'tayotgan boshqa ustoz bormi?
      const otherTeacherSub = (cls?.subjects || []).find(
        (s) =>
          s.subjectId === targetSubjectId &&
          s.teacherId !== teacher.id &&
          Number(s.weeklyHours) > 0
      );
      const isSplit = Boolean(otherTeacherSub);
      const hours = otherTeacherSub ? Number(otherTeacherSub.weeklyHours) || standardHours : standardHours;

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
          isSplit,
          groupType: isSplit ? "GROUP_1" : "WHOLE",
          secondTeacherId: otherTeacherSub ? otherTeacherSub.teacherId : undefined,
        },
      ]);
    }
  };

  // Guruhlangan sinflarni ommaviy tanlash (masalan 5-sinflar yoki 8-sinflar)
  const handleBulkSelectGrade = (grade: number) => {
    if (!teacher) return;
    const targetSubjectId = batchSubjectId || defaultSubjectId;
    const gradeClasses = schoolClasses.filter((c) => c.grade === grade);
    if (gradeClasses.length === 0) return;

    // Tekshiramiz: barchasi tanlanganmi?
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
      // Hammasini o'chirish
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
      // Tanlanmaganlarini qo'shish
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
          const otherTeacherSub = (c.subjects || []).find(
            (s) =>
              s.subjectId === targetSubjectId &&
              s.teacherId !== teacher.id &&
              Number(s.weeklyHours) > 0
          );
          const isSplit = Boolean(otherTeacherSub);
          const hours = otherTeacherSub ? Number(otherTeacherSub.weeklyHours) || (batchHours || 3) : (batchHours || 3);

          newItems.push({
            classId: c.id,
            subjectId: targetSubjectId,
            weeklyHours: hours,
            isSplit,
            groupType: isSplit ? "GROUP_1" : "WHOLE",
            secondTeacherId: otherTeacherSub ? otherTeacherSub.teacherId : undefined,
          });
        }
      });
      setAssignments((prev) => [...prev, ...newItems]);
    }
  };

  // Yakka qo'lda yangi qator qo'shish
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

  // Guruhga bo'lish toggle
  const handleToggleSplit = (index: number) => {
    setAssignments((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const nextIsSplit = !item.isSplit;

        if (nextIsSplit) {
          // Shu fanni o'tadigan boshqa o'qituvchini topamiz (default taklif)
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

    // KAFOLAT: Agar o'qituvchi sinf rahbari bo'lsa, uning sinfiga 1 soatlik Sinf soati doim saqlanadi
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

    // Qat'iy deduplikatsiya: har bir sinf va fan uchun FAQAT 1 DANA yozuv ketadi
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

  // Sinflarni guruhlar (1-4, 5-9, 10-11) bo'yicha ajratish
  const primaryClasses = useMemo(() => schoolClasses.filter((c) => c.grade <= 4), [schoolClasses]);
  const middleClasses = useMemo(() => schoolClasses.filter((c) => c.grade >= 5 && c.grade <= 9), [schoolClasses]);
  const highClasses = useMemo(() => schoolClasses.filter((c) => c.grade >= 10), [schoolClasses]);

  // Noyob sinf raqamlari (5, 6, 7, 8, 9 ...)
  const availableGrades = useMemo(() => {
    const set = new Set<number>();
    schoolClasses.forEach((c) => set.add(c.grade));
    return Array.from(set).sort((a, b) => a - b);
  }, [schoolClasses]);

  // Maktabdagi mavjud barcha parallel harflari (A, B, D...)
  const availableParallels = useMemo(() => {
    const set = new Set<string>();
    schoolClasses.forEach((c) => {
      const match = c.name.match(/[A-Za-zА-Яа-яЎўҚқҒғҲҳ]/);
      if (match) set.add(match[0].toUpperCase());
    });
    return Array.from(set).sort();
  }, [schoolClasses]);

  // Maktabdagi binolar ro'yxati (Asosiy / Filial)
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

  // Har bir sinf joriy filtrlarga mos keladimi?
  const isClassMatchingFilters = (c: SchoolClass) => {
    if (branchFilter !== "ALL" && c.branchId !== branchFilter) return false;
    if (parallelFilter !== "ALL") {
      const match = c.name.match(/[A-Za-zА-Яа-яЎўҚқҒғҲҳ]/);
      const letter = match ? match[0].toUpperCase() : "";
      if (letter !== parallelFilter) return false;
    }
    return true;
  };

  const filteredPrimaryClasses = useMemo(() => {
    if (stageFilter === "HIGH") return [];
    return primaryClasses.filter(isClassMatchingFilters);
  }, [primaryClasses, stageFilter, branchFilter, parallelFilter]);

  const filteredMiddleClasses = useMemo(() => {
    if (stageFilter === "PRIMARY") return [];
    return middleClasses.filter(isClassMatchingFilters);
  }, [middleClasses, stageFilter, branchFilter, parallelFilter]);

  const filteredHighClasses = useMemo(() => {
    if (stageFilter === "PRIMARY") return [];
    return highClasses.filter(isClassMatchingFilters);
  }, [highClasses, stageFilter, branchFilter, parallelFilter]);

  const allFilteredClasses = useMemo(() => {
    return [...filteredPrimaryClasses, ...filteredMiddleClasses, ...filteredHighClasses];
  }, [filteredPrimaryClasses, filteredMiddleClasses, filteredHighClasses]);

  // Filtrlangan barcha sinflarni 1-bosishda biriktirish yoki bekor qilish
  const handleBulkSelectFilteredClasses = () => {
    if (!teacher || allFilteredClasses.length === 0) return;
    const targetSubjectId = batchSubjectId || defaultSubjectId;
    const allSelected = allFilteredClasses.every((c) => {
      const normName = normalizeClassName(c.name).toUpperCase();
      return assignments.some((a) => {
        if (a.subjectId !== targetSubjectId) return false;
        if (a.classId === c.id) return true;
        const aCls = resolveCanonicalClass(a.classId);
        return aCls && normalizeClassName(aCls.name).toUpperCase() === normName;
      });
    });

    if (allSelected) {
      const classNormNames = new Set(allFilteredClasses.map((c) => normalizeClassName(c.name).toUpperCase()));
      const classIds = new Set(allFilteredClasses.map((c) => c.id));
      setAssignments((prev) =>
        prev.filter((a) => {
          if (a.subjectId !== targetSubjectId) return true;
          if (classIds.has(a.classId)) return false;
          const aCls = resolveCanonicalClass(a.classId);
          return !(aCls && classNormNames.has(normalizeClassName(aCls.name).toUpperCase()));
        })
      );
    } else {
      const newItems: TeacherClassAssignment[] = [];
      allFilteredClasses.forEach((c) => {
        const normName = normalizeClassName(c.name).toUpperCase();
        const isAssigned = assignments.some((a) => {
          if (a.subjectId !== targetSubjectId) return false;
          if (a.classId === c.id) return true;
          const aCls = resolveCanonicalClass(a.classId);
          return aCls && normalizeClassName(aCls.name).toUpperCase() === normName;
        });

        if (!isAssigned) {
          const otherTeacherSub = (c.subjects || []).find(
            (s) =>
              s.subjectId === targetSubjectId &&
              s.teacherId !== teacher.id &&
              Number(s.weeklyHours) > 0
          );
          const isSplit = Boolean(otherTeacherSub);
          const hours = otherTeacherSub
            ? Number(otherTeacherSub.weeklyHours) || (batchHours || 3)
            : (batchHours || (c.grade >= 5 ? 3 : 4));

          newItems.push({
            classId: c.id,
            subjectId: targetSubjectId,
            weeklyHours: hours,
            isSplit,
            groupType: isSplit ? "GROUP_1" : "WHOLE",
            secondTeacherId: otherTeacherSub ? otherTeacherSub.teacherId : undefined,
          });
        }
      });
      setAssignments((prev) => [...prev, ...newItems]);
    }
  };

  if (!isOpen || !teacher) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-card border border-border w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[94vh] flex flex-col min-w-0">
        {/* ── HEADER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
              {teacher.displayNumber ? `№${teacher.displayNumber}` : teacher.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-sm sm:text-base flex items-center gap-2 truncate">
                <span>{teacher.fullName} — Dars Soatlari Taqsimoti</span>
              </h3>
              <p className="text-xs text-muted-foreground truncate">
                Ushbu o'qituvchiga sinflarni 1-bosishda biriktirish yoki guruhlarga bo'lib o'tishni belgilash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── LIVE CAPACITY STATUS BAR ────────────────────────────────────── */}
        <div className="px-6 py-3 bg-muted/40 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 text-xs">
            <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-muted-foreground font-medium">Haftalik stavka yuklamasi:</span>
            <span
              className={`font-black px-2.5 py-1 rounded-xl text-xs flex items-center gap-1.5 ${
                isOverloaded
                  ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                  : totalAssignedHours === capacity
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                  : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30"
              }`}
            >
              <span>
                {totalAssignedHours} / {capacity} soat stavka
              </span>
              <span className="text-[10px] font-normal opacity-80">
                {remainingHours > 0
                  ? `(${remainingHours} soat bo'sh)`
                  : remainingHours === 0
                  ? "(Optimal stavka • 100%)"
                  : `(+${Math.abs(remainingHours)} soat ortiqcha)`}
              </span>
            </span>

            {totalHomeroomHours > 0 && (
              <span className="font-bold px-2.5 py-1 rounded-xl text-xs bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <span>👤 +{totalHomeroomHours} soat sinf rahbarligi</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBatchOpen(!isBatchOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isBatchOpen
                  ? "bg-indigo-500/15 text-indigo-600 border border-indigo-500/30"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isBatchOpen ? "Tezkor panelni yopish" : "⚡ Tezkor sinf tanlash"}</span>
            </button>

            <button
              type="button"
              onClick={handleAddAssignment}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Sinf biriktirish</span>
            </button>
          </div>
        </div>

        {/* ── ⚡ TEZKOR SINF TANLASH PANELI (SINF QO'SHISH GA O'XSHASH OSON) ──── */}
        {isBatchOpen && (
          <div className="bg-indigo-500/5 dark:bg-indigo-950/20 border-b border-indigo-500/20 px-6 py-3 space-y-2.5 shrink-0 max-h-[32vh] overflow-y-auto custom-scrollbar">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    Fan:
                  </span>
                  <select
                    value={batchSubjectId}
                    onChange={(e) => setBatchSubjectId(e.target.value)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg border border-border bg-background cursor-pointer focus:ring-2 focus:ring-indigo-500"
                  >
                    {teacherSubjects.length > 0 && (
                      <optgroup label="⭐ O'qituvchining ixtisoslashgan fanlari:">
                        {teacherSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="Barcha fanlar:">
                      {subjects
                        .filter((s) => !teacherSubjects.some((ts) => ts.id === s.id))
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Standart soat:
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setBatchHours((prev) => Math.max(1, prev - 1))}
                      className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-xs hover:bg-muted cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-2 font-black text-xs">{batchHours} st</span>
                    <button
                      type="button"
                      onClick={() => setBatchHours((prev) => Math.min(12, prev + 1))}
                      className="w-6 h-6 rounded border border-border bg-background flex items-center justify-center text-xs hover:bg-muted cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Aqlli Filtrlash paneli: Bino, Bosqich va Harflar */}
              <div className="flex flex-wrap items-center gap-2 pt-1 pb-1 border-t border-indigo-500/10">
                {/* 1. Bino filtri (agar 2 va undan ko'p bino bo'lsa) */}
                {availableBranches.length > 1 && (
                  <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground font-bold px-1.5 flex items-center gap-0.5">
                      <Building2 className="w-2.5 h-2.5" /> Bino:
                    </span>
                    <button
                      type="button"
                      onClick={() => setBranchFilter("ALL")}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        branchFilter === "ALL"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Barchasi
                    </button>
                    {availableBranches.map((b) => (
                      <button
                        key={`b_filter_${b.id}`}
                        type="button"
                        onClick={() => setBranchFilter(b.id)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          branchFilter === b.id
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* 2. Bosqich (Toifa) filtri */}
                <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border">
                  <span className="text-[10px] text-muted-foreground font-bold px-1.5 flex items-center gap-0.5">
                    <GraduationCap className="w-2.5 h-2.5" /> Toifa:
                  </span>
                  <button
                    type="button"
                    onClick={() => setStageFilter("ALL")}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      stageFilter === "ALL"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    Barchasi
                  </button>
                  <button
                    type="button"
                    onClick={() => setStageFilter("PRIMARY")}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      stageFilter === "PRIMARY"
                        ? "bg-teal-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    🧒 1-4
                  </button>
                  <button
                    type="button"
                    onClick={() => setStageFilter("HIGH")}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      stageFilter === "HIGH"
                        ? "bg-purple-600 text-white shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    🧑‍🎓 5-11
                  </button>
                </div>

                {/* 3. Parallel Harflar filtri (A, B, D...) */}
                {availableParallels.length > 1 && (
                  <div className="flex items-center gap-1 bg-background/80 p-0.5 rounded-lg border border-border">
                    <span className="text-[10px] text-muted-foreground font-bold px-1.5">
                      Harf:
                    </span>
                    <button
                      type="button"
                      onClick={() => setParallelFilter("ALL")}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        parallelFilter === "ALL"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      Barchasi
                    </button>
                    {availableParallels.map((letter) => (
                      <button
                        key={`p_filter_${letter}`}
                        type="button"
                        onClick={() => setParallelFilter(letter)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                          parallelFilter === letter
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                      >
                        {letter}
                      </button>
                    ))}
                  </div>
                )}

                {/* 4. ⚡ Filtrlangan barcha sinflarni 1-bosishda tanlash / bekor qilish */}
                {allFilteredClasses.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkSelectFilteredClasses}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-xs ${
                      allFilteredClasses.every((c) =>
                        assignments.some(
                          (a) => a.classId === c.id && a.subjectId === (batchSubjectId || defaultSubjectId)
                        )
                      )
                        ? "bg-rose-500 hover:bg-rose-600 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                    title="Hozirgi filtrlarga mos barcha sinflarga dars biriktirish yoki bekor qilish"
                  >
                    <Zap className="w-3 h-3" />
                    <span>
                      {allFilteredClasses.every((c) =>
                        uniqueAssignments.some(
                          ({ item: a }) => a.classId === c.id && a.subjectId === (batchSubjectId || defaultSubjectId)
                        )
                      )
                        ? `Filtrlanganlarni bekor qilish (${allFilteredClasses.length} sinf)`
                        : `Filtrlangan barchasini biriktirish (${allFilteredClasses.length} sinf)`}
                    </span>
                  </button>
                )}
              </div>

              {/* Tezkor sinf bosqichlari */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground font-semibold mr-1">Sinflar bo&apos;yicha:</span>
                {availableGrades
                  .filter((g) => {
                    if (stageFilter === "PRIMARY" && g > 4) return false;
                    if (stageFilter === "HIGH" && g < 5) return false;
                    return true;
                  })
                  .map((g) => {
                    const gClasses = schoolClasses.filter((c) => c.grade === g && isClassMatchingFilters(c));
                    if (gClasses.length === 0) return null;
                    const isAll =
                      gClasses.length > 0 &&
                      gClasses.every((c) => {
                        const normName = normalizeClassName(c.name).toUpperCase();
                        return uniqueAssignments.some(
                          ({ item: a }) =>
                            (a.classId === c.id || resolveCanonicalClass(a.classId)?.id === c.id || (resolveCanonicalClass(a.classId) && normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                            a.subjectId === (batchSubjectId || defaultSubjectId)
                        );
                      });
                    return (
                      <button
                        key={`bulk_grade_${g}`}
                        type="button"
                        onClick={() => handleBulkSelectGrade(g)}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                          isAll
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-background border border-border text-foreground hover:bg-muted"
                        }`}
                        title={`${g}-sinflarning barchasini tanlash / bekor qilish`}
                      >
                        {g}-sinflar
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Sinflar pill/kartochkalari (1-bosishda biriktirish) */}
            <div className="space-y-2">
              {/* 5-9 Sinflar */}
              {filteredMiddleClasses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <span>🧑 5-9 Sinflar:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredMiddleClasses.map((c) => {
                      const normName = normalizeClassName(c.name).toUpperCase();
                      const isAssigned = uniqueAssignments.some(
                        ({ item: a }) =>
                          (a.classId === c.id || resolveCanonicalClass(a.classId)?.id === c.id || (resolveCanonicalClass(a.classId) && normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                          a.subjectId === (batchSubjectId || defaultSubjectId)
                      );
                      const assignItem = uniqueAssignments.find(
                        ({ item: a }) =>
                          (a.classId === c.id || resolveCanonicalClass(a.classId)?.id === c.id || (resolveCanonicalClass(a.classId) && normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                          a.subjectId === (batchSubjectId || defaultSubjectId)
                      )?.item;
                      return (
                        <button
                          key={`btn_cls_${c.id}`}
                          type="button"
                          onClick={() => handleToggleClassAssignment(c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                            isAssigned
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40"
                              : "bg-background border border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50/30"
                          }`}
                        >
                          {isAssigned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
                          <span>{c.name}</span>
                          {isAssigned && (
                            <span className="text-[10px] opacity-80 font-normal">({assignItem?.weeklyHours}s)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 1-4 Sinflar */}
              {filteredPrimaryClasses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <span>🧒 1-4 Sinflar:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredPrimaryClasses.map((c) => {
                      const normName = normalizeClassName(c.name).toUpperCase();
                      const isAssigned = uniqueAssignments.some(
                        ({ item: a }) =>
                          (a.classId === c.id || resolveCanonicalClass(a.classId)?.id === c.id || (resolveCanonicalClass(a.classId) && normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                          a.subjectId === (batchSubjectId || defaultSubjectId)
                      );
                      const assignItem = uniqueAssignments.find(
                        ({ item: a }) =>
                          (a.classId === c.id || resolveCanonicalClass(a.classId)?.id === c.id || (resolveCanonicalClass(a.classId) && normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                          a.subjectId === (batchSubjectId || defaultSubjectId)
                      )?.item;
                      return (
                        <button
                          key={`btn_cls_${c.id}`}
                          type="button"
                          onClick={() => handleToggleClassAssignment(c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                            isAssigned
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40"
                              : "bg-background border border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50/30"
                          }`}
                        >
                          {isAssigned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
                          <span>{c.name}</span>
                          {isAssigned && (
                            <span className="text-[10px] opacity-80 font-normal">({assignItem?.weeklyHours}s)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 10-11 Sinflar */}
              {filteredHighClasses.length > 0 && (
                <div>
                  <div className="text-[11px] font-bold text-muted-foreground mb-1 flex items-center gap-1.5">
                    <span>🎓 10-11 Sinflar:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredHighClasses.map((c) => {
                      const normName = normalizeClassName(c.name).toUpperCase();
                      const isAssigned = uniqueAssignments.some(
                        ({ item: a }) =>
                          (a.classId === c.id || resolveCanonicalClass(a.classId)?.id === c.id || (resolveCanonicalClass(a.classId) && normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                          a.subjectId === (batchSubjectId || defaultSubjectId)
                      );
                      const assignItem = uniqueAssignments.find(
                        ({ item: a }) =>
                          (a.classId === c.id || resolveCanonicalClass(a.classId)?.id === c.id || (resolveCanonicalClass(a.classId) && normalizeClassName(resolveCanonicalClass(a.classId)!.name).toUpperCase() === normName)) &&
                          a.subjectId === (batchSubjectId || defaultSubjectId)
                      )?.item;
                      return (
                        <button
                          key={`btn_cls_${c.id}`}
                          type="button"
                          onClick={() => handleToggleClassAssignment(c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer select-none ${
                            isAssigned
                              ? "bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/40"
                              : "bg-background border border-border text-foreground hover:border-indigo-400 hover:bg-indigo-50/30"
                          }`}
                        >
                          {isAssigned ? <Check className="w-3 h-3 stroke-[3]" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
                          <span>{c.name}</span>
                          {isAssigned && (
                            <span className="text-[10px] opacity-80 font-normal">({assignItem?.weeklyHours}s)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {allFilteredClasses.length === 0 && (
                <div className="p-4 rounded-xl bg-background/60 border border-dashed border-border text-center text-xs text-muted-foreground">
                  Tanlangan parametrlar (bino/toifa/harf) bo&apos;yicha birorta ham sinf topilmadi. Filtrni o&apos;zgartirib ko&apos;ring.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── ASSIGNMENTS LIST ────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 min-w-0">
          {uniqueAssignments.length === 0 ? (
            <div className="py-14 text-center rounded-3xl border border-dashed border-border bg-muted/20">
              <GraduationCap className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-foreground">
                Hozircha birorta sinf biriktirilmagan
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Yuqoridagi <strong>&quot;⚡ Tezkor sinf tanlash&quot;</strong> panelidan kerakli sinflarni bir bosishda belgilang yoki <strong>&quot;Qatorda qo&apos;shish&quot;</strong> tugmasidan foydalaning.
              </p>
              <div className="mt-4 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleAddAssignment}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Dars soati biriktirish</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Header labels */}
              <div className="hidden sm:flex items-center gap-3 px-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="w-[28%]">Biriktirilgan sinf</div>
                <div className="w-[30%]">Fan</div>
                <div className="w-28 text-center">Haftalik soat</div>
                <div className="w-52 text-center">Guruhga bo&apos;lish</div>
                <div className="w-8 shrink-0 text-center">O&apos;chirish</div>
              </div>

              {uniqueAssignments.map(({ item, index }) => {
                const sub = subjectMap.get(item.subjectId);
                const cls = resolveCanonicalClass(item.classId) || classMap.get(item.classId);
                const isKelajak = isKelajakOrSinfSoatiSubject(item.subjectId, sub?.name);

                // Ayni shu fanni o'tadigan boshqa o'qituvchilar (2-guruh ustozi tanlash uchun)
                const candidateTeachers = schoolTeachers.filter((t) => t.id !== teacher.id);
                const specializedCandidateTeachers = candidateTeachers.filter((t) =>
                  (t.subjectIds || []).includes(item.subjectId)
                );
                const otherCandidateTeachers = candidateTeachers.filter(
                  (t) => !(t.subjectIds || []).includes(item.subjectId)
                );

                return (
                  <div
                    key={`${item.classId}_${item.subjectId}`}
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
                          onChange={(e) =>
                            handleUpdateAssignment(index, "classId", e.target.value)
                          }
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
                              onChange={(e) =>
                                handleUpdateAssignment(index, "subjectId", e.target.value)
                              }
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
                            onChange={(e) =>
                              handleUpdateAssignment(
                                index,
                                "weeklyHours",
                                Number(e.target.value)
                              )
                            }
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
                            title="Sinfni 2 ta guruhga bo'lib (masalan Ingliz tili, Rus tili, Informatika) 2 ta o'qituvchiga biriktirish"
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
                            onChange={(e) =>
                              handleUpdateAssignment(index, "secondTeacherId", e.target.value)
                            }
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
              })}
            </div>
          )}
        </div>

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/80 bg-muted/20 shrink-0">
          <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
            <span className="font-bold text-foreground">
              {uniqueAssignments.length} ta fan
            </span>
            <span>•</span>
            <span className="font-black text-indigo-600 dark:text-indigo-400">
              {totalAssignedHours} soat dars stavkasi
            </span>
            {totalHomeroomHours > 0 && (
              <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-100/90 dark:bg-purple-950/50 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-800">
                +{totalHomeroomHours} soat sinf soati
              </span>
            )}
            <span className="text-[11px] text-muted-foreground font-semibold">
              (Jami darslar: {totalPhysicalHours} soat)
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-border hover:bg-muted transition-colors cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Yuklamani Saqlash
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
