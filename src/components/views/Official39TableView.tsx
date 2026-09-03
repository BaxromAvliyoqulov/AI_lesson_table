"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SchoolClass,
  Subject,
  Teacher,
  Lesson,
} from "@/types";
import { CSPSolver } from "@/lib/solver/csp-solver";
import { sortClassesByName, getCanonicalOrderedTeachers } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";
import { FilterScope, Official39TableViewProps, DAYS, PERIOD_TIMES } from "./official-39/types";
import { validateDropSlot } from "@/lib/solver/drag-validator";
import { detectScheduleConflicts } from "@/lib/solver/schedule-conflict-detector";
import { isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";
import { Official39Header, Official39Signatures } from "./official-39/Official39Header";
import { Official39Filters } from "./official-39/Official39Filters";
import { Official39Grid } from "./official-39/Official39Grid";
import { Official39CellModal } from "./official-39/Official39CellModal";
import { Official39RequisitesModal, Official39HomeroomModal } from "./official-39/Official39ExtraModals";
import { AIConflictResolverModal } from "@/components/modals/AIConflictResolverModal";
import { useSchoolStore } from "@/lib/store/useSchoolStore";

export const Official39TableView: React.FC<Official39TableViewProps> = ({
  classes,
  subjects,
  teachers,
  rooms,
  lessons,
  branches = [],
  shifts = [],
  onLessonsChange,
  onExportExcel,
  onOpenZamena,
  onUpdateSchoolInfo,
  onSetHomeroomTeacher,
  zoomLevel = 100,
  onZoomChange,
  schoolName = "39 - umumiy o'rta ta'lim maktabi",
  region = "Muzrabot tumani",
  directorName = "M. Ramazonov",
  vicePrincipalName = "N. Narziqulov",
  psychologistName = "F.I.Sh",
  academicYear = "2025 - 2026",
  approvalDate = "2026-yil 28-mart",
}) => {
  const {
    branches: storeBranches,
    lockedClassIds,
    lockedTeacherIds,
    toggleLockClass,
    toggleLockTeacher,
    lockPrimaryClasses,
    lockAllClasses,
  } = useSchoolStore();

  const allBranches = (branches && branches.length > 0 ? branches : storeBranches) || [];

  const [filterScope, setFilterScopeState] = useState<FilterScope>("MAIN_ALL");

  // F5 va sahifa yangilanishida filtrni saqlash (URL ?scope=... + localStorage)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlScope = new URLSearchParams(window.location.search).get("scope")?.toUpperCase();
      const validScopes: FilterScope[] = [
        "MAIN_ALL",
        "MAIN_PRIMARY",
        "MAIN_HIGH",
        "BRANCH_ALL",
        "BRANCH_PRIMARY",
        "BRANCH_HIGH",
        "ALL",
      ];
      if (urlScope && validScopes.includes(urlScope as FilterScope)) {
        setFilterScopeState(urlScope as FilterScope);
        return;
      }
      const savedScope = localStorage.getItem("official39_filter_scope") as FilterScope;
      if (savedScope && validScopes.includes(savedScope)) {
        setFilterScopeState(savedScope);
      }
    }
  }, []);

  const setFilterScope = (scope: FilterScope) => {
    setFilterScopeState(scope);
    if (typeof window !== "undefined") {
      localStorage.setItem("official39_filter_scope", scope);
      const url = new URL(window.location.href);
      url.searchParams.set("scope", scope.toLowerCase());
      window.history.replaceState({}, "", url.toString());
    }
  };
  const [hoveredTeacherId, setHoveredTeacherId] = useState<string | null>(null);
  const [activeDragLesson, setActiveDragLesson] = useState<Lesson | null>(null);
  const [isFixingConflicts, setIsFixingConflicts] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Rekvizitlar modali
  const [isRequisitesModalOpen, setIsRequisitesModalOpen] = useState<boolean>(false);
  const [requisitesForm, setRequisitesForm] = useState({
    name: schoolName,
    region: region,
    directorName: directorName,
    vicePrincipalName: vicePrincipalName,
    psychologistName: psychologistName,
    academicYear: academicYear,
    approvalDate: approvalDate,
  });

  // Sync requisites form when props update from store or database
  useEffect(() => {
    setRequisitesForm({
      name: schoolName,
      region: region,
      directorName: directorName,
      vicePrincipalName: vicePrincipalName,
      psychologistName: psychologistName,
      academicYear: academicYear,
      approvalDate: approvalDate,
    });
  }, [
    schoolName,
    region,
    directorName,
    vicePrincipalName,
    psychologistName,
    academicYear,
    approvalDate,
  ]);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);

  // ─── KAFOLAT: Har bir sinf uchun Dushanba 1-soat Kelajak/Sinf soatini AVTOMATIK kafolatlash ───
  useEffect(() => {
    if (!onLessonsChange || classes.length === 0 || subjects.length === 0) return;

    let hasChanges = false;
    let updatedLessons = [...lessons];

    const sinfSoatiSub =
      subjects.find((s) => isKelajakOrSinfSoatiSubject(s.id, s.name)) ||
      subjects.find((s) => s.id === "sub_sinf_soati");

    classes.forEach((cls) => {
      const homeroomSub = (cls.subjects || []).find((s) =>
        isKelajakOrSinfSoatiSubject(s.subjectId, subjectMap.get(s.subjectId)?.name)
      );
      const homeroomTeacherId = cls.homeroomTeacherId || homeroomSub?.teacherId;

      if (!homeroomTeacherId || !sinfSoatiSub) return;

      const mondayL1 = updatedLessons.find(
        (l) => l.classId === cls.id && l.dayOfWeek === 1 && l.periodNumber === 1
      );

      if (!mondayL1) {
        // Dushanba 1-soat darsi bo'sh bo'lsa -> avtomatik yaratib qulflaymiz!
        updatedLessons.push({
          id: `les_${cls.id}_sinf_soati_${Date.now()}`,
          scheduleId: "draft-schedule",
          schoolId: cls.schoolId,
          classId: cls.id,
          subjectId: sinfSoatiSub.id,
          teacherId: homeroomTeacherId,
          roomId: null,
          branchId: cls.branchId,
          dayOfWeek: 1,
          periodNumber: 1,
          isLocked: true,
        });
        hasChanges = true;
      } else if (
        isKelajakOrSinfSoatiSubject(mondayL1.subjectId, subjectMap.get(mondayL1.subjectId)?.name) &&
        mondayL1.teacherId !== homeroomTeacherId
      ) {
        // Agar o'qituvchisi boshqa bo'lib qolgan bo'lsa -> yangi sinf rahbariga sinxronlash
        updatedLessons = updatedLessons.map((l) =>
          l.id === mondayL1.id
            ? { ...l, teacherId: homeroomTeacherId, isLocked: true }
            : l
        );
        hasChanges = true;
      }

      // Sinf dars jadvalidagi o'qituvchilarni amaldagi dars taqsimotiga (cls.subjects) sinxronlash
      const classLessons = updatedLessons.filter((l) => l.classId === cls.id);
      classLessons.forEach((l) => {
        if (l.isLocked) return;
        const assignedSub = (cls.subjects || []).find((s) => s.subjectId === l.subjectId);
        if (assignedSub && assignedSub.teacherId && assignedSub.teacherId !== l.teacherId) {
          updatedLessons = updatedLessons.map((item) =>
            item.id === l.id ? { ...item, teacherId: assignedSub.teacherId } : item
          );
          hasChanges = true;
        }
      });
    });

    if (hasChanges) {
      onLessonsChange(updatedLessons);
    }
  }, [classes, subjects, subjectMap, onLessonsChange]);

  // Sinf rahbarini almashtirish modali
  const [homeroomModal, setHomeroomModal] = useState<{
    isOpen: boolean;
    cls: SchoolClass;
    currentTeacherId?: string;
  } | null>(null);
  const [selectedHomeroomTeacherId, setSelectedHomeroomTeacherId] = useState<string>("");

  // Cell tahrirlash modali
  const [cellModal, setCellModal] = useState<{
    isOpen: boolean;
    cls: SchoolClass;
    day: number;
    period: number;
    lesson?: Lesson;
  } | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  // AI Ziddiyatlarni Bartaraf Qilish modali state
  const [conflictResolverLesson, setConflictResolverLesson] = useState<Lesson | null>(null);

  const handleApplyConflictSolution = (updatedLessons: Lesson[], msg: string) => {
    if (onLessonsChange) {
      onLessonsChange(updatedLessons);
    }
    showToast(msg, "success");
  };

  // Asosiy bino va Filial bo'yicha aniq filtrlangan va tartiblangan sinflar
  const displayClasses = useMemo(() => {
    const isBranch = (c: SchoolClass) => {
      // 1. Agar sinfning branchId si filial branchiga tegishli bo'lsa
      const branch = allBranches.find((b) => b.id === c.branchId);
      if (branch && (!branch.isMain || branch.name.toLowerCase().includes("filial"))) return true;

      // 2. Agar branchId nomida yoki id sida filial so'zi bo'lsa yoki b39_2 bo'lsa
      if (
        c.branchId === "b39_2" ||
        c.branchId?.toLowerCase().includes("branch_2") ||
        c.branchId?.toLowerCase().includes("filial")
      ) {
        return true;
      }

      // 3. O'zbekiston maktablaridagi filial sinflari: harfi "D" bo'lgan barcha sinflar (masalan 1-D, 2-D, 3-D, 4-D)
      const nameUpper = c.name.trim().toUpperCase();
      if (
        nameUpper.endsWith("D") ||
        nameUpper.includes("-D") ||
        nameUpper.includes(" D") ||
        nameUpper.includes("D SINF")
      ) {
        return true;
      }

      return false;
    };

    const isMain = (c: SchoolClass) => !isBranch(c);

    let list: SchoolClass[];
    switch (filterScope) {
      case "MAIN_ALL":
        list = classes.filter(isMain);
        break;
      case "MAIN_HIGH":
        list = classes.filter((c) => isMain(c) && !c.isPrimary && c.grade >= 5);
        break;
      case "MAIN_PRIMARY":
        list = classes.filter((c) => isMain(c) && (c.isPrimary || c.grade <= 4));
        break;
      case "BRANCH_ALL":
        list = classes.filter(isBranch);
        break;
      case "BRANCH_HIGH":
        list = classes.filter((c) => isBranch(c) && !c.isPrimary && c.grade >= 5);
        break;
      case "BRANCH_PRIMARY":
        list = classes.filter((c) => isBranch(c) && (c.isPrimary || c.grade <= 4));
        break;
      case "ALL":
      default:
        list = classes;
        break;
    }

    return sortClassesByName(list);
  }, [classes, filterScope, allBranches]);

  const isPrimaryOnly = filterScope === "MAIN_PRIMARY" || filterScope === "BRANCH_PRIMARY";
  const displayDays = useMemo(() => (isPrimaryOnly ? DAYS.slice(0, 5) : DAYS), [isPrimaryOnly]);
  const displayPeriods = useMemo(() => (isPrimaryOnly ? PERIOD_TIMES.slice(0, 5) : PERIOD_TIMES), [isPrimaryOnly]);

  const classTotalHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const cls of displayClasses) {
      const count = lessons.filter((l) => l.classId === cls.id).length;
      map.set(cls.id, count);
    }
    return map;
  }, [displayClasses, lessons]);

  const cellLessonMap = useMemo(() => {
    const map = new Map<string, Lesson[]>();
    for (const l of lessons) {
      const k = `${l.classId}_${l.dayOfWeek}_${l.periodNumber}`;
      const list = map.get(k) || [];
      list.push(l);
      map.set(k, list);
    }
    return map;
  }, [lessons]);

  // Butun maktab bo'yicha QAT'IY VA YAGONA tartib va raqamlash (1-A, 1-B, 1-D ... sinf rahbarlari birinchi!)
  const { orderedTeachers: canonicalTeachers, teacherNumberMap } = useMemo(() => {
    return getCanonicalOrderedTeachers(classes, teachers, (sId, sName) =>
      isKelajakOrSinfSoatiSubject(sId, sName || subjectMap.get(sId)?.name)
    );
  }, [classes, teachers, subjectMap]);

  // Tab bo'yicha ko'rsatiladigan o'qituvchilar (ammo № raqamlari butun maktab bo'yicha o'zgarmas qat'iy saqlanadi!)
  const displayTeachers = useMemo(() => {
    if (filterScope === "ALL") return canonicalTeachers;
    const activeTeacherIds = new Set<string>();
    for (const cls of displayClasses) {
      if (cls.homeroomTeacherId) activeTeacherIds.add(cls.homeroomTeacherId);
      cls.subjects.forEach((s) => activeTeacherIds.add(s.teacherId));
    }
    const filtered = canonicalTeachers.filter((t) => activeTeacherIds.has(t.id));
    return filtered.length > 0 ? filtered : canonicalTeachers;
  }, [canonicalTeachers, displayClasses, filterScope]);

  // Yagona Haqiqat Manbai (Single Source of Truth) orqali barcha ziddiyatlarni aniqlash
  const conflictDetectionResult = useMemo(() => {
    return detectScheduleConflicts({
      lessons,
      classes,
      subjects,
      teachers,
    });
  }, [lessons, classes, subjects, teachers]);

  const teacherConflictsSet = conflictDetectionResult.conflictLessonIds;

  const teacherSubjectsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teachers) {
      const subjectNames = new Set<string>();
      if (t.subjectIds && t.subjectIds.length > 0) {
        t.subjectIds.forEach((sid) => {
          const s = subjectMap.get(sid);
          if (s && s.id !== "sub_sinf_soati") {
            subjectNames.add(s.shortName || s.name);
          }
        });
      }
      for (const cls of classes) {
        cls.subjects.forEach((cs) => {
          if (cs.teacherId === t.id && cs.subjectId !== "sub_sinf_soati") {
            const s = subjectMap.get(cs.subjectId);
            if (s) subjectNames.add(s.shortName || s.name);
          }
        });
      }
      map.set(t.id, subjectNames.size === 0 ? "—" : Array.from(subjectNames).join(", "));
    }
    return map;
  }, [teachers, classes, subjectMap]);

  const getHomeroomTeacher = useCallback(
    (cls: SchoolClass): Teacher | undefined => {
      if (cls.homeroomTeacherId) {
        const direct = teachers.find((t) => t.id === cls.homeroomTeacherId);
        if (direct) return direct;
        const byName = teachers.find(
          (t) =>
            t.fullName.toLowerCase() === cls.homeroomTeacherId?.toLowerCase() ||
            (t.displayNumber && `t_${t.displayNumber}` === cls.homeroomTeacherId)
        );
        if (byName) return byName;
      }
      const rawClassId = cls.id.toLowerCase();
      const rawClassName = cls.name.toLowerCase();
      const normClassName = rawClassName.replace(/[^a-z0-9]/g, "");

      const byTeacher = teachers.find((t) => {
        if (!t.homeroomClassId) return false;
        const tHId = t.homeroomClassId.toLowerCase();
        return (
          tHId === rawClassId ||
          tHId === rawClassName ||
          tHId.replace(/[^a-z0-9]/g, "") === normClassName
        );
      });
      if (byTeacher) return byTeacher;

      const sinfSoati = cls.subjects?.find(
        (s) =>
          s.subjectId === "sub_sinf_soati" ||
          s.subjectId?.toLowerCase().includes("sinf_soati")
      );
      if (sinfSoati && sinfSoati.teacherId) {
        return teachers.find((t) => t.id === sinfSoati.teacherId);
      }
      return undefined;
    },
    [teachers]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const lesson = event.active.data.current?.lesson as Lesson | undefined;
    if (lesson) setActiveDragLesson(lesson);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragLesson(null);
    if (!over || !active || !onLessonsChange) return;

    const sourceLesson = active.data.current?.lesson as Lesson | undefined;
    const overData = over.data.current as
      | { classId: string; day: number; period: number; lesson?: Lesson }
      | undefined;

    if (!sourceLesson || !overData) return;
    const { classId: targetClassId, day: targetDay, period: targetPeriod, lesson: targetExistingLesson } = overData;

    if (
      sourceLesson.classId === targetClassId &&
      sourceLesson.dayOfWeek === targetDay &&
      sourceLesson.periodNumber === targetPeriod
    ) {
      return;
    }

    const targetClass = classes.find((c) => c.id === targetClassId);
    if (!targetClass) return;

    // Drag-Drop qat'iy tekshiruvi (Ziddiyatli joyga ko'chirish taqiqlanadi)
    const val = validateDropSlot({
      draggedLesson: sourceLesson,
      targetClass,
      targetDay,
      targetPeriod,
      allLessons: lessons,
      teachers,
      subjects,
      rooms,
    });

    if (val.status === "conflict") {
      showToast(val.reason || "🛑 Ziddiyat aniqlandi! Darsni bu joyga qo'yish mumkin emas.", "error");
      return;
    }

    let updated = [...lessons];
    if (targetExistingLesson) {
      updated = updated.map((l) => {
        if (l.id === sourceLesson.id) {
          return { ...l, classId: targetClassId, dayOfWeek: targetDay, periodNumber: targetPeriod };
        }
        if (l.id === targetExistingLesson.id) {
          return { ...l, classId: sourceLesson.classId, dayOfWeek: sourceLesson.dayOfWeek, periodNumber: sourceLesson.periodNumber };
        }
        return l;
      });
    } else {
      updated = updated.map((l) =>
        l.id === sourceLesson.id
          ? { ...l, classId: targetClassId, dayOfWeek: targetDay, periodNumber: targetPeriod }
          : l
      );
    }
    onLessonsChange(updated);
    showToast("Dars muvaffaqiyatli ko'chirildi", "success");
  };

  const handleAutoFixConflicts = () => {
    if (!onLessonsChange) return;
    setIsFixingConflicts(true);
    showToast("⚡ AI algoritm dars jadvalidagi barcha ziddiyatlarni dinamik tahlil qilmoqda...", "info");

    setTimeout(() => {
      try {
        const solver = new CSPSolver({
          classes,
          teachers,
          subjects,
          rooms,
          branches,
          shifts,
        });
        const result = solver.solve();
        onLessonsChange(result.lessons);
        setIsFixingConflicts(false);
        showToast(
          `✅ AI barcha ziddiyatlarni bartaraf qildi! (${result.lessons.length} ta dars dinamik tartiblandi)`,
          "success"
        );
      } catch (err) {
        setIsFixingConflicts(false);
        showToast("Ziddiyatlarni to'g'rilashda xatolik yuz berdi", "error");
      }
    }, 400);
  };

  const handleCellClick = (cls: SchoolClass, day: number, period: number, lesson?: Lesson) => {
    setCellModal({ isOpen: true, cls, day, period, lesson });
    setSelectedSubjectId(lesson?.subjectId || cls.subjects[0]?.subjectId || subjects[0]?.id || "");
    setSelectedTeacherId(lesson?.teacherId || cls.subjects[0]?.teacherId || teachers[0]?.id || "");
  };

  const handleSaveCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cellModal || !onLessonsChange) return;
    const { cls, day, period, lesson } = cellModal;

    // 1. QAT'IY TEKSHIRUV: Bir kunda bir sinfda bir xil fan takrorlanishi
    const hasSameSubject = lessons.some(
      (l) =>
        l.classId === cls.id &&
        l.dayOfWeek === day &&
        l.subjectId === selectedSubjectId &&
        (!lesson || l.id !== lesson.id)
    );

    if (hasSameSubject) {
      const sub = subjectMap.get(selectedSubjectId);
      showToast(
        `🛑 ${cls.name} sinfida bu kunda "${sub?.name || "ushbu fan"}" darsi allaqachon mavjud! Bir kunda bir xil fanni 2 marta qo'yish qat'iyan taqiqlanadi!`,
        "error"
      );
      return;
    }

    // 2. QAT'IY TEKSHIRUV: Metod kuni
    const teacher = teacherMap.get(selectedTeacherId);
    const isTeacherMethod =
      teacher?.methodDayOfWeek !== undefined &&
      teacher.methodDayOfWeek !== null &&
      teacher.methodDayOfWeek === day;

    const sub = subjectMap.get(selectedSubjectId);
    const isSubMethod =
      sub?.methodDayOfWeek !== undefined &&
      sub.methodDayOfWeek !== null &&
      sub.methodDayOfWeek === day;

    if (isTeacherMethod || isSubMethod) {
      const targetEntity = isTeacherMethod ? `${teacher?.fullName || "O'qituvchi"}` : `${sub?.name || "Fan"}`;
      showToast(
        `🛑 ${targetEntity} uchun bu kun rasmiy Metod kuni! Dars qo'yish taqiqlanadi!`,
        "error"
      );
      return;
    }

    let updated = [...lessons];
    if (lesson) {
      updated = updated.map((l) =>
        l.id === lesson.id ? { ...l, subjectId: selectedSubjectId, teacherId: selectedTeacherId } : l
      );
    } else {
      const newLesson: Lesson = {
        id: `l_${cls.id}_${day}_${period}_${Date.now()}`,
        scheduleId: "draft-schedule",
        schoolId: cls.schoolId,
        classId: cls.id,
        subjectId: selectedSubjectId,
        teacherId: selectedTeacherId,
        roomId: null,
        branchId: cls.branchId,
        dayOfWeek: day,
        periodNumber: period,
        isLocked: false,
      };
      updated.push(newLesson);
    }
    onLessonsChange(updated);
    showToast("Dars muvaffaqiyatli saqlandi", "success");
    setCellModal(null);
  };

  const handleToggleLock = (lessonId: string) => {
    if (!onLessonsChange) return;
    const updated = lessons.map((l) => (l.id === lessonId ? { ...l, isLocked: !l.isLocked } : l));
    onLessonsChange(updated);
    setCellModal((prev) =>
      prev && prev.lesson ? { ...prev, lesson: { ...prev.lesson, isLocked: !prev.lesson.isLocked } } : prev
    );
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (!onLessonsChange) return;
    const updated = lessons.filter((l) => l.id !== lessonId);
    onLessonsChange(updated);
    setCellModal(null);
  };

  const handleSaveHomeroomTeacher = () => {
    if (!homeroomModal) return;
    if (onSetHomeroomTeacher) {
      onSetHomeroomTeacher(homeroomModal.cls.id, selectedHomeroomTeacherId || "");
      showToast(`${homeroomModal.cls.name} sinf rahbari yangilandi!`, "success");
    } else if (onLessonsChange && selectedHomeroomTeacherId) {
      const updatedLessons = lessons.map((l) => {
        if (
          l.classId === homeroomModal.cls.id &&
          (l.subjectId === "sub_sinf_soati" || (l.dayOfWeek === 1 && l.periodNumber === 1))
        ) {
          return { ...l, teacherId: selectedHomeroomTeacherId };
        }
        return l;
      });
      onLessonsChange(updatedLessons);
      showToast(`${homeroomModal.cls.name} dars jadvalida Kelajak soati yangilandi!`, "success");
    }
    setHomeroomModal(null);
  };

  const handleSaveRequisites = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSchoolInfo) {
      onUpdateSchoolInfo(requisitesForm);
      showToast("Maktab rekvizitlari muvaffaqiyatli saqlandi!", "success");
    }
    setIsRequisitesModalOpen(false);
  };

  const stageTitle = useMemo(() => {
    switch (filterScope) {
      case "MAIN_ALL":
        return "ASOSIY MAKTAB (1-11 SINFLAR)";
      case "MAIN_HIGH":
        return "ASOSIY MAKTAB KATTA VA O'RTA SINFLAR (5-11)";
      case "MAIN_PRIMARY":
        return "ASOSIY MAKTAB BOSHLANG'ICH SINFLAR (1-4)";
      case "BRANCH_ALL":
        return "FILIAL BINOSI (1-D .. 7-D SINFLAR)";
      case "BRANCH_HIGH":
        return "FILIAL KATTA SINFLAR (5-D, 6-D, 7-D)";
      case "BRANCH_PRIMARY":
        return "FILIAL BOSHLANG'ICH SINFLAR (1-D .. 4-D)";
      case "ALL":
      default:
        return "UMUMIY MAKTAB (BARCHA FILIALLAR)";
    }
  }, [filterScope]);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="w-full bg-white text-black p-4 sm:p-6 print:p-0 rounded-2xl shadow-xl border border-slate-200">
        <Official39Filters
          filterScope={filterScope}
          onFilterScopeChange={setFilterScope}
          conflictsCount={teacherConflictsSet.size}
          isFixingConflicts={isFixingConflicts}
          onAutoFixConflicts={handleAutoFixConflicts}
          zoomLevel={zoomLevel}
          onZoomChange={onZoomChange}
          onOpenRequisites={() => setIsRequisitesModalOpen(true)}
          onExportExcel={onExportExcel}
          onPrint={() => window.print()}
          lockedClassesCount={lockedClassIds.length}
          onLockPrimaryClasses={() => lockPrimaryClasses()}
          onLockAllClasses={() => lockAllClasses()}
        />

        <div
          className="w-full flex flex-col origin-top-left transition-transform duration-150"
          style={{ zoom: `${zoomLevel}%` }}
          suppressHydrationWarning
        >
          <Official39Header
            schoolName={schoolName}
            region={region}
            directorName={directorName}
            academicYear={academicYear}
            approvalDate={approvalDate}
            stageTitle={stageTitle}
            onOpenRequisites={() => setIsRequisitesModalOpen(true)}
          />

          <Official39Grid
            displayClasses={displayClasses}
            displayDays={displayDays}
            displayPeriods={displayPeriods}
            displayTeachers={displayTeachers}
            lessons={lessons}
            teachers={teachers}
            subjects={subjects}
            rooms={rooms}
            subjectMap={subjectMap}
            teacherMap={teacherMap}
            teacherNumberMap={teacherNumberMap}
            teacherSubjectsMap={teacherSubjectsMap}
            classTotalHours={classTotalHours}
            cellLessonMap={cellLessonMap}
            teacherConflictsSet={teacherConflictsSet}
            hoveredTeacherId={hoveredTeacherId}
            activeDragLesson={activeDragLesson}
            lockedClassIds={lockedClassIds}
            lockedTeacherIds={lockedTeacherIds}
            onToggleLockClass={toggleLockClass}
            onToggleLockTeacher={toggleLockTeacher}
            onHoverTeacher={setHoveredTeacherId}
            onCellClick={handleCellClick}
            getHomeroomTeacher={getHomeroomTeacher}
            onOpenHomeroomModal={(cls, currentTeacherId) => {
              setHomeroomModal({ isOpen: true, cls, currentTeacherId });
              setSelectedHomeroomTeacherId(currentTeacherId || "");
            }}
            onResolveConflict={(l) => setConflictResolverLesson(l)}
          />

          <Official39Signatures
            vicePrincipalName={vicePrincipalName}
            psychologistName={psychologistName}
            onOpenRequisites={() => setIsRequisitesModalOpen(true)}
          />
        </div>

        <Official39RequisitesModal
          isOpen={isRequisitesModalOpen}
          onClose={() => setIsRequisitesModalOpen(false)}
          requisitesForm={requisitesForm}
          setRequisitesForm={setRequisitesForm}
          onSave={handleSaveRequisites}
        />

        {cellModal && (
          <Official39CellModal
            isOpen={cellModal.isOpen}
            cellModal={cellModal}
            subjects={subjects}
            teachers={teachers}
            allLessons={lessons}
            selectedSubjectId={selectedSubjectId}
            selectedTeacherId={selectedTeacherId}
            onSubjectChange={setSelectedSubjectId}
            onTeacherChange={setSelectedTeacherId}
            onSave={handleSaveCell}
            onClose={() => setCellModal(null)}
            onToggleLock={handleToggleLock}
            onDeleteLesson={handleDeleteLesson}
            onOpenZamena={onOpenZamena}
            teacherNumberMap={teacherNumberMap}
          />
        )}

        {homeroomModal && (
          <Official39HomeroomModal
            isOpen={homeroomModal.isOpen}
            onClose={() => setHomeroomModal(null)}
            cls={homeroomModal.cls}
            teachers={teachers}
            teacherSubjectsMap={teacherSubjectsMap}
            selectedTeacherId={selectedHomeroomTeacherId}
            onSelectedTeacherChange={setSelectedHomeroomTeacherId}
            onSave={handleSaveHomeroomTeacher}
          />
        )}

        <AIConflictResolverModal
          isOpen={!!conflictResolverLesson}
          onClose={() => setConflictResolverLesson(null)}
          conflictLesson={conflictResolverLesson}
          classes={classes}
          teachers={teachers}
          subjects={subjects}
          allLessons={lessons}
          onApplySolution={handleApplyConflictSolution}
        />

        <DragOverlay>
          {activeDragLesson ? (
            <div className="px-2 py-1 rounded bg-amber-200 border-2 border-amber-600 shadow-2xl text-xs font-bold text-black flex items-center justify-between gap-2 min-w-[80px]">
              <span>{subjectMap.get(activeDragLesson.subjectId)?.shortName || "Fan"}</span>
              <span className="font-mono bg-amber-400 px-1 rounded text-[10px]">
                {teacherNumberMap.get(activeDragLesson.teacherId) || ""}
              </span>
            </div>
          ) : null}
        </DragOverlay>

        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 border animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-xl ${
              toastMessage.type === "success"
                ? "bg-slate-900/95 text-emerald-300 border-emerald-500/40 shadow-emerald-950/40"
                : toastMessage.type === "error"
                ? "bg-slate-900/95 text-rose-300 border-rose-500/40 shadow-rose-950/40"
                : "bg-slate-900/95 text-blue-300 border-blue-500/40 shadow-blue-950/40"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : toastMessage.type === "error" ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        )}
      </div>
    </DndContext>
  );
};
export default Official39TableView;
