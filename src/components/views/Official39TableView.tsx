"use client";

import React, { useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import {
  SchoolClass,
  Subject,
  Teacher,
  Room,
  Lesson,
  Branch,
  Shift,
  SchoolInfo,
} from "@/types";
import {
  Printer,
  Download,
  FileSpreadsheet,
  Edit2,
  Lock,
  Unlock,
  Building2,
  UserCheck,
  Trash2,
  GraduationCap,
  Users,
  Layers,
  X,
  Settings,
  Award,
  Save,
  ZoomIn,
  ZoomOut,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { CSPSolver } from "@/lib/solver/csp-solver";
import { validateDropSlot, DropSlotValidation } from "@/lib/solver/drag-validator";
import { sortClassesByName } from "@/lib/utils";

export type FilterScope =
  | "MAIN_HIGH"
  | "MAIN_PRIMARY"
  | "MAIN_ALL"
  | "BRANCH_HIGH"
  | "BRANCH_PRIMARY"
  | "BRANCH_ALL"
  | "ALL";

interface Official39TableViewProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  branches?: Branch[];
  shifts?: Shift[];
  onLessonsChange?: (lessons: Lesson[]) => void;
  onExportExcel?: () => void;
  onOpenZamena?: (lesson: Lesson) => void;
  onUpdateSchoolInfo?: (updates: Partial<SchoolInfo>) => void;
  onSetHomeroomTeacher?: (classId: string, teacherId: string) => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  schoolName?: string;
  region?: string;
  directorName?: string;
  vicePrincipalName?: string;
  psychologistName?: string;
  academicYear?: string;
  approvalDate?: string;
}

const DAYS = [
  { id: 1, name: "DUSHANBA" },
  { id: 2, name: "SESHANBA" },
  { id: 3, name: "CHORSHANBA" },
  { id: 4, name: "PAYSHANBA" },
  { id: 5, name: "JUMA" },
  { id: 6, name: "SHANBA" },
];

const PERIOD_TIMES = [
  { period: 1, time: "8.00-8.45" },
  { period: 2, time: "8.50-9.35" },
  { period: 3, time: "9.40-10.25" },
  { period: 4, time: "10.35-11.20" },
  { period: 5, time: "11.25-12.10" },
  { period: 6, time: "12.15-13.00" },
];

// Draggable & Droppable Katakcha Komponenti (1-Variant: Klassik Rasmiy Excel Premium + Live Drag Conflict Radar)
const OfficialTableCell: React.FC<{
  cls: SchoolClass;
  day: number;
  period: number;
  lesson?: Lesson;
  subject?: Subject;
  teacher?: Teacher;
  teacherNumber?: number;
  isHoveredTeacher: boolean;
  isPrimarySaturday: boolean;
  hasConflict: boolean;
  isLastPeriodOfDay?: boolean;
  activeDragLesson?: Lesson | null;
  allLessons: Lesson[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  cellLessons?: Lesson[];
  teacherNumberMap?: Map<string, number>;
  onHoverTeacher: (teacherId: string | null) => void;
  onCellClick: (cls: SchoolClass, day: number, period: number, lesson?: Lesson) => void;
}> = ({
  cls,
  day,
  period,
  lesson,
  subject,
  teacher,
  teacherNumber,
  isHoveredTeacher,
  isPrimarySaturday,
  hasConflict,
  isLastPeriodOfDay,
  activeDragLesson,
  allLessons,
  teachers,
  subjects,
  rooms,
  cellLessons,
  teacherNumberMap,
  onHoverTeacher,
  onCellClick,
}) => {
  const cellId = `${cls.id}_${day}_${period}`;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop_${cellId}`,
    data: { classId: cls.id, day, period, lesson },
    disabled: isPrimarySaturday,
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({
    id: lesson ? lesson.id : `empty_${cellId}`,
    data: { lesson, classId: cls.id, day, period },
    disabled: !lesson || lesson.isLocked || isPrimarySaturday,
  });

  // Real-time Drag & Drop ziddiyat va yuklama tahlili (Yashil/Sariq/Qizil)
  const validation: DropSlotValidation | null = useMemo(() => {
    if (!activeDragLesson || isPrimarySaturday || activeDragLesson.id === lesson?.id) {
      return null;
    }
    return validateDropSlot({
      draggedLesson: activeDragLesson,
      targetClass: cls,
      targetDay: day,
      targetPeriod: period,
      allLessons,
      teachers,
      subjects,
      rooms,
    });
  }, [
    activeDragLesson,
    isPrimarySaturday,
    lesson?.id,
    cls,
    day,
    period,
    allLessons,
    teachers,
    subjects,
    rooms,
  ]);

  const bottomBorderClass = isLastPeriodOfDay
    ? "border-b-[3.5px] border-b-black"
    : "border-b border-black";

  const isEven = period % 2 === 0;

  if (isPrimarySaturday) {
    return (
      <>
        <td
          colSpan={2}
          className={`border border-black bg-slate-100/60 text-slate-400 text-[9px] font-bold text-center p-1 select-none ${bottomBorderClass}`}
        >
          {period === 1 ? "Dam" : "—"}
        </td>
      </>
    );
  }

  // Droppable, Hover va Ziddiyat (Conflict) vizual ko'rsatkichlari
  let bgClass = isEven ? "bg-slate-50/70" : "bg-white";

  if (activeDragLesson) {
    if (isOver && validation) {
      bgClass = `${validation.colorClass} font-bold z-30 scale-[1.03] shadow-lg animate-pulse`;
    } else if (validation?.status === "conflict") {
      bgClass = "bg-rose-50 text-rose-950 border-rose-300 ring-1 ring-rose-300/40 opacity-70";
    } else if (validation?.status === "warning") {
      bgClass = "bg-amber-50/90 text-amber-950 border-amber-300 ring-1 ring-amber-300/40";
    } else if (validation?.status === "safe") {
      bgClass = "bg-emerald-50/90 text-emerald-950 border-emerald-300 ring-1 ring-emerald-300/40";
    }
  } else {
    if (hasConflict) {
      bgClass = "bg-rose-100 ring-2 ring-rose-500 text-rose-950 font-bold z-20";
    } else if (isHoveredTeacher) {
      bgClass = "bg-amber-200/90 ring-2 ring-amber-500 text-amber-950 z-10";
    } else if (isOver) {
      bgClass = "bg-emerald-100 ring-2 ring-emerald-500 z-10";
    } else if (lesson?.isLocked) {
      bgClass = "bg-slate-100/90";
    }
  }

  const isSplitGroup = cellLessons && cellLessons.length > 1;
  const l1 = isSplitGroup ? cellLessons[0] : lesson;
  const l2 = isSplitGroup ? cellLessons[1] : undefined;
  const s1 = l1 ? subjects.find((s) => s.id === l1.subjectId) : subject;
  const s2 = l2 ? subjects.find((s) => s.id === l2.subjectId) : undefined;
  const num1 = l1 && teacherNumberMap ? teacherNumberMap.get(l1.teacherId) : teacherNumber;
  const num2 = l2 && teacherNumberMap ? teacherNumberMap.get(l2.teacherId) : undefined;

  return (
    <>
      {/* Fan Nomi Ustuni */}
      <td
        ref={(el) => {
          setDropRef(el);
          if (lesson) setDragRef(el);
        }}
        {...(lesson ? listeners : {})}
        {...(lesson ? attributes : {})}
        onClick={() => onCellClick(cls, day, period, lesson)}
        onMouseEnter={() => lesson && onHoverTeacher(lesson.teacherId)}
        onMouseLeave={() => onHoverTeacher(null)}
        className={`border border-black px-1 py-1 text-left font-semibold text-[10px] truncate max-w-[76px] cursor-pointer transition-all relative select-none ${bottomBorderClass} ${bgClass} ${
          isDragging ? "opacity-30" : ""
        }`}
        title={
          validation?.reason
            ? `[${validation.badge}] ${validation.reason}`
            : hasConflict
            ? `⚠️ ZIDDIYAT: ${teacher?.fullName || "O'qituvchi"} ayni shu paytda boshqa sinfda ham darsga qo'yilgan!`
            : lesson
            ? `${subject?.name || "Fan"} — ${teacher?.fullName || "O'qituvchi"}`
            : "Bo'sh katakcha (Dars qo'shish uchun bosing)"
        }
      >
        {isSplitGroup ? (
          <div className="flex flex-col text-[8px] leading-tight">
            <div className="flex items-center justify-between border-b border-black/30 pb-0.5 truncate">
              <span className="font-bold truncate text-blue-950">{s1?.shortName || s1?.name || "1-gr"}</span>
              <span className="text-[7px] text-blue-700 font-extrabold ml-0.5">1-g</span>
            </div>
            <div className="flex items-center justify-between pt-0.5 truncate">
              <span className="font-bold truncate text-indigo-950">{s2?.shortName || s2?.name || "2-gr"}</span>
              <span className="text-[7px] text-indigo-700 font-extrabold ml-0.5">2-g</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-0.5">
            <span className={`truncate ${lesson ? "text-slate-900 font-semibold" : "text-slate-300"}`}>
              {subject?.shortName || subject?.name || (lesson ? "Fan" : "—")}
            </span>
            {validation?.status === "conflict" && isOver && (
              <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0 inline no-print animate-bounce" />
            )}
            {hasConflict && !activeDragLesson && (
              <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0 inline no-print animate-bounce" />
            )}
            {lesson?.isLocked && (
              <Lock className="w-2.5 h-2.5 text-indigo-600 shrink-0 inline no-print" />
            )}
          </div>
        )}
      </td>

      {/* O'qituvchi Tartib Raqami Ustuni */}
      <td
        onClick={() => onCellClick(cls, day, period, lesson)}
        onMouseEnter={() => lesson && onHoverTeacher(lesson.teacherId)}
        onMouseLeave={() => onHoverTeacher(null)}
        className={`border border-black px-0.5 py-1 text-center font-mono font-black text-[10px] w-6 cursor-pointer transition-colors select-none ${bottomBorderClass} ${
          hasConflict
            ? "bg-rose-200 text-rose-950 font-extrabold"
            : isHoveredTeacher
            ? "bg-amber-300 text-amber-950 font-extrabold"
            : teacherNumber
            ? isEven
              ? "bg-slate-100 text-slate-950 font-black"
              : "bg-slate-50 text-slate-950 font-black"
            : "text-slate-300"
        } ${isDragging ? "opacity-30" : ""}`}
        title={
          hasConflict
            ? `⚠️ Ziddiyat: №${teacherNumber} ${teacher?.fullName} band!`
            : teacher
            ? `№${teacherNumber}: ${teacher.fullName}`
            : ""
        }
      >
        {isSplitGroup ? (
          <div className="flex flex-col text-[8.5px] leading-tight font-mono font-black">
            <div className="border-b border-black/30 pb-0.5 text-blue-950">{num1 || "—"}</div>
            <div className="pt-0.5 text-indigo-950">{num2 || "—"}</div>
          </div>
        ) : (
          teacherNumber || ""
        )}
      </td>
    </>
  );
};

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
  // Foydalanuvchi tanlagan aniq bino va bosqich filtri
  const [filterScope, setFilterScope] = useState<FilterScope>("MAIN_HIGH");
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

  // Rekvizitlarni tahrirlash modali
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

  // Sinf rahbarini almashtirish modali
  const [homeroomModal, setHomeroomModal] = useState<{
    isOpen: boolean;
    cls: SchoolClass;
    currentTeacherId?: string;
  } | null>(null);
  const [selectedHomeroomTeacherId, setSelectedHomeroomTeacherId] = useState<string>("");

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

      // Reverse lookup
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

      // Sinf soati
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
      showToast(`${homeroomModal.cls.name} sinf rahbari yangilandi!`, "success");
    }
    setHomeroomModal(null);
  };

  // Cell Tahrirlash Modali
  const [cellModal, setCellModal] = useState<{
    isOpen: boolean;
    cls: SchoolClass;
    day: number;
    period: number;
    lesson?: Lesson;
  } | null>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  // Asosiy bino va Filial bo'yicha aniq filtrlangan va tartiblangan sinflar
  const displayClasses = useMemo(() => {
    const isBranch = (c: SchoolClass) =>
      c.branchId === "b39_2" ||
      c.branchId?.includes("branch_2") ||
      c.branchId?.includes("filial");

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
  }, [classes, filterScope]);

  // Boshlang'ich sinflar uchun 5 kunlik hafta (Dushanba-Juma)
  const isPrimaryOnly = filterScope === "MAIN_PRIMARY" || filterScope === "BRANCH_PRIMARY";
  const displayDays = useMemo(() => {
    if (isPrimaryOnly) {
      return DAYS.slice(0, 5); // Faqat Dushanba-Juma
    }
    return DAYS; // Dushanba-Shanba
  }, [isPrimaryOnly]);

  // Boshlang'ich sinflar uchun odatda 5 dars, yuqori sinflar uchun 6 dars
  const displayPeriods = useMemo(() => {
    if (isPrimaryOnly) {
      return PERIOD_TIMES.slice(0, 5);
    }
    return PERIOD_TIMES;
  }, [isPrimaryOnly]);

  // Har bir sinf uchun jami dars soatlari
  const classTotalHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const cls of displayClasses) {
      const count = lessons.filter((l) => l.classId === cls.id).length;
      map.set(cls.id, count);
    }
    return map;
  }, [displayClasses, lessons]);

  // Lessons map: `${classId}_${day}_${period}` -> Lesson
  const lessonMap = useMemo(() => {
    const map = new Map<string, Lesson>();
    for (const l of lessons) {
      map.set(`${l.classId}_${l.dayOfWeek}_${l.periodNumber}`, l);
    }
    return map;
  }, [lessons]);

  // Cell lessons map (Split groups: 1-guruh / 2-guruh): `${classId}_${day}_${period}` -> Lesson[]
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

  // Joriy ko'rinishdagi o'qituvchilar ro'yxati (o'ng tarafdagi jadval va dars jadvali uchun)
  const displayTeachers = useMemo(() => {
    if (filterScope === "ALL") return teachers;
    const activeTeacherIds = new Set<string>();
    for (const cls of displayClasses) {
      if (cls.homeroomTeacherId) activeTeacherIds.add(cls.homeroomTeacherId);
      cls.subjects.forEach((s) => activeTeacherIds.add(s.teacherId));
    }
    for (const l of lessons) {
      if (displayClasses.some((c) => c.id === l.classId)) {
        activeTeacherIds.add(l.teacherId);
      }
    }
    const filtered = teachers.filter((t) => activeTeacherIds.has(t.id));
    return filtered.length > 0 ? filtered : teachers;
  }, [teachers, displayClasses, lessons, filterScope]);

  // QAT'IY KETMA-KET TARTIB RAQAMLASH (1..N):
  // Dars jadvalida va O'ng tarafdagi Reestrda raqamlar 100% ketma-ket, uzilishsiz (1, 2, 3, 4 ... N) chiqadi!
  const teacherNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    displayTeachers.forEach((t, i) => map.set(t.id, i + 1));
    return map;
  }, [displayTeachers]);

  // Real-vaqt parallel dars ziddiyatlarini tekshirish (AI Patrul)
  const teacherConflictsSet = useMemo(() => {
    const map = new Map<string, number>();
    const conflicts = new Set<string>();
    for (const l of lessons) {
      const key = `${l.teacherId}_${l.dayOfWeek}_${l.periodNumber}`;
      map.set(key, (map.get(key) || 0) + 1);
    }
    for (const l of lessons) {
      const key = `${l.teacherId}_${l.dayOfWeek}_${l.periodNumber}`;
      if ((map.get(key) || 0) > 1) {
        conflicts.add(l.id);
      }
    }
    return conflicts;
  }, [lessons]);

  const handleAutoFixConflicts = () => {
    if (!onLessonsChange) return;
    setIsFixingConflicts(true);
    showToast("⚡ AI algoritm dars jadvalidagi barcha ziddiyatlarni tahlil qilmoqda...", "info");

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
          `✅ AI barcha ziddiyatlarni muvaffaqiyatli bartaraf qildi! (${result.lessons.length} ta dars qayta tartiblandi)`,
          "success"
        );
      } catch (err) {
        setIsFixingConflicts(false);
        showToast("Ziddiyatlarni to'g'rilashda xatolik yuz berdi", "error");
      }
    }, 500);
  };

  // Har bir o'qituvchining o'tadigan fanlari ro'yxati (Fan nomi / qisqartmasi)
  const teacherSubjectsMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of teachers) {
      const subjectNames = new Set<string>();
      // 1. O'qituvchiga biriktirilgan fanlar (subjectIds)
      if (t.subjectIds && t.subjectIds.length > 0) {
        t.subjectIds.forEach((sid) => {
          const s = subjectMap.get(sid);
          if (s && s.id !== "sub_sinf_soati") {
            subjectNames.add(s.shortName || s.name);
          }
        });
      }
      // 2. Sinflar bo'yicha yuklamalardan (ClassSubject)
      for (const cls of classes) {
        cls.subjects.forEach((cs) => {
          if (cs.teacherId === t.id && cs.subjectId !== "sub_sinf_soati") {
            const s = subjectMap.get(cs.subjectId);
            if (s) subjectNames.add(s.shortName || s.name);
          }
        });
      }
      // 3. Haqiqiy qo'yilgan darslardan (Lesson)
      for (const l of lessons) {
        if (l.teacherId === t.id && l.subjectId !== "sub_sinf_soati") {
          const s = subjectMap.get(l.subjectId);
          if (s) subjectNames.add(s.shortName || s.name);
        }
      }

      if (subjectNames.size === 0) {
        map.set(t.id, "—");
      } else {
        map.set(t.id, Array.from(subjectNames).join(", "));
      }
    }
    return map;
  }, [teachers, classes, lessons, subjectMap]);

  // DnD sensorlari
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lesson = active.data.current?.lesson as Lesson | undefined;
    if (lesson) {
      setActiveDragLesson(lesson);
    }
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

    const { classId: targetClassId, day: targetDay, period: targetPeriod, lesson: targetExistingLesson } =
      overData;

    if (
      sourceLesson.classId === targetClassId &&
      sourceLesson.dayOfWeek === targetDay &&
      sourceLesson.periodNumber === targetPeriod
    ) {
      return;
    }

    let updated = [...lessons];

    if (targetExistingLesson) {
      // Katak almashinuvi (SWAP)
      updated = updated.map((l) => {
        if (l.id === sourceLesson.id) {
          return {
            ...l,
            classId: targetClassId,
            dayOfWeek: targetDay,
            periodNumber: targetPeriod,
          };
        }
        if (l.id === targetExistingLesson.id) {
          return {
            ...l,
            classId: sourceLesson.classId,
            dayOfWeek: sourceLesson.dayOfWeek,
            periodNumber: sourceLesson.periodNumber,
          };
        }
        return l;
      });
    } else {
      // Bo'sh katakka ko'chirish
      updated = updated.map((l) =>
        l.id === sourceLesson.id
          ? {
              ...l,
              classId: targetClassId,
              dayOfWeek: targetDay,
              periodNumber: targetPeriod,
            }
          : l
      );
    }

    onLessonsChange(updated);
  };

  const handleCellClick = (cls: SchoolClass, day: number, period: number, lesson?: Lesson) => {
    setCellModal({
      isOpen: true,
      cls,
      day,
      period,
      lesson,
    });
    setSelectedSubjectId(lesson?.subjectId || cls.subjects[0]?.subjectId || subjects[0]?.id || "");
    setSelectedTeacherId(lesson?.teacherId || cls.subjects[0]?.teacherId || teachers[0]?.id || "");
  };

  const handleSaveCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cellModal || !onLessonsChange) return;

    const { cls, day, period, lesson } = cellModal;

    let updated = [...lessons];

    if (lesson) {
      updated = updated.map((l) =>
        l.id === lesson.id
          ? {
              ...l,
              subjectId: selectedSubjectId,
              teacherId: selectedTeacherId,
            }
          : l
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
    setCellModal(null);
  };

  const handleSaveRequisites = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSchoolInfo) {
      onUpdateSchoolInfo(requisitesForm);
    }
    setIsRequisitesModalOpen(false);
  };

  const handleToggleLock = (lessonId: string) => {
    if (!onLessonsChange) return;
    const updated = lessons.map((l) =>
      l.id === lessonId ? { ...l, isLocked: !l.isLocked } : l
    );
    onLessonsChange(updated);
    setCellModal((prev) =>
      prev && prev.lesson
        ? { ...prev, lesson: { ...prev.lesson, isLocked: !prev.lesson.isLocked } }
        : prev
    );
  };

  const handleDeleteLesson = (lessonId: string) => {
    if (!onLessonsChange) return;
    const updated = lessons.filter((l) => l.id !== lessonId);
    onLessonsChange(updated);
    setCellModal(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Dinamik Sarlavha
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full flex flex-col bg-white text-black p-4 sm:p-6 print:p-0 select-text">
        {/* ── DRAG & DROP JONLI ZIDDIYAT RADAR BANNERI (Live Status Indicator) ────── */}
        {activeDragLesson && (
          <div className="no-print mb-4 p-3.5 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm">
                🎯
              </div>
              <div>
                <p className="text-xs font-bold">
                  Ko'chirilmoqda:{" "}
                  <span className="text-amber-300">
                    {subjectMap.get(activeDragLesson.subjectId)?.name || "Fan"}
                  </span>{" "}
                  —{" "}
                  <span className="text-white">
                    {teacherMap.get(activeDragLesson.teacherId)?.fullName || "O'qituvchi"}
                  </span>
                </p>
                <p className="text-[11px] text-slate-400">
                  Katakcha ustiga suring: Yashil — xavfsiz joy, Sariq — ogohlantirish, Qizil — ziddiyat (kolliziya)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                🟢 Bo'sh / Xavfsiz
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                🟡 Yuklama
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30">
                🔴 Ziddiyat
              </span>
            </div>
          </div>
        )}

        {/* ── TOP ACTION & TAB CONTROLS (Toza Oq / Light Mode) ───────────────────────────────────────── */}
        <div className="no-print mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3.5">
          {/* Chap: Asosiy Maktab va Filial Aniq Filtrlari */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
              <Building2 className="w-4 h-4 text-blue-600 ml-2" />
              <select
                value={filterScope}
                onChange={(e) => setFilterScope(e.target.value as FilterScope)}
                className="bg-transparent text-slate-800 text-xs font-bold py-1.5 pr-3 outline-none cursor-pointer"
              >
                <option value="MAIN_ALL" className="bg-white text-slate-900 font-bold">
                  1. 🏢 Asosiy — Hammasi (1-11)
                </option>
                <option value="MAIN_PRIMARY" className="bg-white text-slate-900 font-bold">
                  2. 👦 Asosiy — Boshlang'ich (1-4)
                </option>
                <option value="MAIN_HIGH" className="bg-white text-slate-900 font-bold">
                  3. 🧑 Asosiy — Kattalar (5-11)
                </option>
                <option value="BRANCH_ALL" className="bg-white text-slate-900 font-bold">
                  4. 🏠 Filial — Hammasi (1-7 D)
                </option>
                <option value="BRANCH_PRIMARY" className="bg-white text-slate-900 font-bold">
                  5. 👦 Filial — Boshlang'ich (1-4 D)
                </option>
                <option value="BRANCH_HIGH" className="bg-white text-slate-900 font-bold">
                  6. 🧑 Filial — Kattalar (5-7 D)
                </option>
                <option value="ALL" className="bg-white text-slate-900 font-bold">
                  7. 🏛️ Hammasi (Butun maktab)
                </option>
              </select>
            </div>

            {/* 7 xil Aniq Dars Jadvali Ko'rinishlari (1 dan 7 gacha) */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm flex-wrap">
              {/* 1. Asosiy Hammasi */}
              <button
                type="button"
                onClick={() => setFilterScope("MAIN_ALL")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  filterScope === "MAIN_ALL"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="1. Asosiy binodagi barcha sinflar (1-11 A, B, V)"
              >
                <span>1. 🏢 Asosiy Hammasi</span>
              </button>

              {/* 2. Asosiy Boshlang'ich */}
              <button
                type="button"
                onClick={() => setFilterScope("MAIN_PRIMARY")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  filterScope === "MAIN_PRIMARY"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="2. Asosiy bino boshlang'ich sinflari (1-4 A, B, V)"
              >
                <span>2. 👦 Asosiy Boshlang'ich</span>
              </button>

              {/* 3. Asosiy Kattalar */}
              <button
                type="button"
                onClick={() => setFilterScope("MAIN_HIGH")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  filterScope === "MAIN_HIGH"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="3. Asosiy bino yuqori sinflari (5-11 A, B, V)"
              >
                <span>3. 🧑 Asosiy Kattalar</span>
              </button>

              {/* 4. Filial Hammasi */}
              <button
                type="button"
                onClick={() => setFilterScope("BRANCH_ALL")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  filterScope === "BRANCH_ALL"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="4. Filialdagi barcha sinflar (1-D .. 7-D)"
              >
                <span>4. 🏠 Filial Hammasi</span>
              </button>

              {/* 5. Filial Boshlang'ich */}
              <button
                type="button"
                onClick={() => setFilterScope("BRANCH_PRIMARY")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  filterScope === "BRANCH_PRIMARY"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="5. Filial boshlang'ich sinflari (1-D .. 4-D)"
              >
                <span>5. 👦 Filial Boshlang'ich</span>
              </button>

              {/* 6. Filial Kattalar */}
              <button
                type="button"
                onClick={() => setFilterScope("BRANCH_HIGH")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  filterScope === "BRANCH_HIGH"
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="6. Filial yuqori sinflari (5-D .. 7-D)"
              >
                <span>6. 🧑 Filial Kattalar</span>
              </button>

              {/* 7. Hammasi */}
              <button
                type="button"
                onClick={() => setFilterScope("ALL")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 ${
                  filterScope === "ALL"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
                title="7. Butun maktab: barcha bino va filiallardagi barcha sinflar"
              >
                <span>7. 🏛️ Hammasi</span>
              </button>
            </div>
          </div>

          {/* O'ng: AI Nazorat, Zoom, Rekvizitlar, Excel va Chop etish tugmalari */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            {/* AI Patrul & Ziddiyatlarni tuzatish tugmasi */}
            <div suppressHydrationWarning className="inline-flex items-center">
              {teacherConflictsSet.size > 0 ? (
                <button
                  type="button"
                  onClick={handleAutoFixConflicts}
                  disabled={isFixingConflicts}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-60 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer transition-all"
                  title="Parallel darslarni AI algoritmi orqali 0 ziddiyatgacha avtomatik qayta taqsimlash"
                >
                  {isFixingConflicts ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                  )}
                  <span>
                    {isFixingConflicts
                      ? "AI To'g'rilamoqda..."
                      : `⚡ AI Bilan To'g'rilash (${Math.round(teacherConflictsSet.size / 2)} ta ziddiyat)`}
                  </span>
                </button>
              ) : (
                <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>0 Ziddiyat &bull; AI Nazoratida</span>
                </div>
              )}
            </div>

            {/* Zoom Boshqaruvi */}
            <div className="flex items-center gap-1 rounded-xl bg-white border border-slate-200 p-1 shadow-sm" suppressHydrationWarning>
              <button
                type="button"
                onClick={() => onZoomChange && onZoomChange(Math.max(50, zoomLevel - 10))}
                disabled={zoomLevel <= 50}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
                title="Kichraytirish (-10%)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onZoomChange && onZoomChange(100)}
                className="px-2 text-xs font-bold tabular-nums text-slate-700 hover:text-blue-600 hover:underline cursor-pointer"
                title="100% ga qaytarish"
                suppressHydrationWarning
              >
                {zoomLevel}%
              </button>
              <button
                type="button"
                onClick={() => onZoomChange && onZoomChange(Math.min(150, zoomLevel + 10))}
                disabled={zoomLevel >= 150}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 disabled:opacity-40 transition-colors cursor-pointer"
                title="Kattalashtirish (+10%)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Maktab Rekvizitlarini tezkor tahrirlash tugmasi */}
            <button
              onClick={() => {
                setRequisitesForm({
                  name: schoolName,
                  region: region,
                  directorName: directorName,
                  vicePrincipalName: vicePrincipalName,
                  psychologistName: psychologistName,
                  academicYear: academicYear,
                  approvalDate: approvalDate,
                });
                setIsRequisitesModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-bold border border-slate-200 shadow-sm cursor-pointer transition-all"
              title="Maktab nomi, direktor va zauch rekvizitlarini o'zgartirish"
            >
              <Settings className="w-4 h-4 text-amber-500" />
              <span>Rekvizitlar</span>
            </button>

            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
                title="39-maktab rasmiy A3 albom andozasidagi Excel faylini yuklab olish"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Eksport (A3 Excel)</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish (Print / PDF)</span>
            </button>
          </div>
        </div>

        {/* ── ZOOM CONTAINER (Butun jadval va rasmiy hujjat uchun) ───────────── */}
        <div
          className="w-full flex flex-col origin-top-left transition-transform duration-150"
          style={{ zoom: `${zoomLevel}%` }}
          suppressHydrationWarning
        >
          {/* ── 1. RASMIY HUJJAT SARLAVHASI (TASDIQLAYMAN & MAKTAB NOMI) ─────────── */}
          <div className="w-full mb-4 font-serif">
          <div className="flex justify-between items-start text-xs sm:text-sm leading-relaxed mb-3">
            {/* Chap: TASDIQLAYMAN */}
            <div
              className="max-w-xs cursor-pointer group"
              onClick={() => {
                setRequisitesForm({
                  name: schoolName,
                  region: region,
                  directorName: directorName,
                  vicePrincipalName: vicePrincipalName,
                  psychologistName: psychologistName,
                  academicYear: academicYear,
                  approvalDate: approvalDate,
                });
                setIsRequisitesModalOpen(true);
              }}
              title="Direktor rekvizitini tahrirlash uchun bosing"
            >
              <p className="font-bold tracking-widest text-sm sm:text-base uppercase flex items-center gap-1">
                TASDIQLAYMAN
                <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-600 no-print transition-opacity" />
              </p>
              <p className="mt-1">
                Maktab direktori: <span className="inline-block border-b border-black w-24"></span>{" "}
                <span className="font-semibold underline decoration-dotted decoration-blue-500/50">{directorName}</span>
              </p>
              <p className="text-[11px] text-gray-700 mt-0.5">{approvalDate}</p>
            </div>

            {/* O'rta: Maktab nomi va Bosqich */}
            <div
              className="text-center flex-1 px-4 cursor-pointer group"
              onClick={() => {
                setRequisitesForm({
                  name: schoolName,
                  region: region,
                  directorName: directorName,
                  vicePrincipalName: vicePrincipalName,
                  psychologistName: psychologistName,
                  academicYear: academicYear,
                  approvalDate: approvalDate,
                });
                setIsRequisitesModalOpen(true);
              }}
              title="Maktab nomini tahrirlash uchun bosing"
            >
              <p className="text-xs sm:text-sm font-semibold tracking-wide">
                {region} <span className="font-bold text-base">{schoolName}</span>ning
              </p>
              <p className="text-xs sm:text-sm font-semibold">
                {academicYear} o'quv yili uchun tuzilgan
              </p>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-[0.25em] uppercase mt-1">
                {stageTitle} &nbsp;&nbsp; D A R S &nbsp;&nbsp; J A D V A L I
              </h1>
            </div>

            {/* O'ng bo'sh joy */}
            <div className="w-32 hidden sm:block"></div>
          </div>
        </div>

        {/* ── 2. ASOSIY SPREADSHEET JADVALI VA O'QITUVCHILAR REESTRI ──────────── */}
        <div className="w-full overflow-x-auto border-t-2 border-b-2 border-black pb-2">
          <div className="flex items-start">
            {/* Asosiy Dars Jadvali */}
            <table className="border-collapse border border-black text-center text-[10px] sm:text-[11px] leading-tight font-sans">
              <thead>
                {/* 1-qator: Sarlavhalar va Sinf nomlari */}
                <tr className="border-b border-black">
                  <th rowSpan={2} className="border border-black px-1.5 py-1.5 w-6 text-center text-xs font-black text-slate-900 bg-slate-200">
                    Kun
                  </th>
                  <th rowSpan={2} className="border border-black px-1 py-1.5 w-5 text-center text-xs font-black text-slate-900 bg-slate-200">
                    Dars
                  </th>
                  <th rowSpan={2} className="border border-black px-1.5 py-1.5 w-16 text-center font-black text-[10px] text-slate-900 bg-slate-200">
                    Vaqti
                  </th>

                  {displayClasses.map((cls) => {
                    const homeroomTeacher = getHomeroomTeacher(cls);

                    return (
                      <th
                        key={cls.id}
                        colSpan={2}
                        onClick={() => {
                          setHomeroomModal({
                            isOpen: true,
                            cls,
                            currentTeacherId: homeroomTeacher?.id,
                          });
                          setSelectedHomeroomTeacherId(homeroomTeacher?.id || "");
                        }}
                        className={`border border-black px-1.5 py-1 text-center font-black text-xs min-w-[92px] cursor-pointer hover:opacity-90 transition-opacity select-none ${
                          cls.branchId === "b39_2"
                            ? "bg-amber-100 text-amber-950"
                            : "bg-slate-100 text-slate-900"
                        }`}
                        title={`${cls.name} sinfi — Sinf rahbari: ${homeroomTeacher?.fullName || "Tayinlanmagan"} (O'zgartirish uchun bosing)`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="tracking-wide font-black text-xs">{cls.name}</span>
                          {homeroomTeacher ? (
                            <span className="text-[8px] font-semibold text-slate-600 truncate max-w-[85px]">
                              {homeroomTeacher.fullName.split(" ")[0]}
                            </span>
                          ) : (
                            <span className="text-[7.5px] font-bold text-rose-600/80">
                              + Rahbar
                            </span>
                          )}
                          {cls.branchId === "b39_2" && (
                            <span className="text-[7.5px] font-bold text-amber-900">(Filial)</span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>

                {/* 2-qator: Har bir sinf tagida Fan | № ustunlari */}
                <tr className="border-b-2 border-black">
                  {displayClasses.map((cls) => (
                    <React.Fragment key={`sub_${cls.id}`}>
                      <th className="border border-black px-1 py-1 text-center w-16 font-bold text-[9px] text-slate-800 bg-slate-200/80">Fan</th>
                      <th className="border border-black px-1 py-1 text-center w-6 bg-slate-300 font-black text-[9.5px] text-slate-950">
                        №
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {displayDays.map((day) => (
                  <React.Fragment key={day.id}>
                    {displayPeriods.map((periodInfo, pIndex) => {
                      const isLastPeriod = pIndex === displayPeriods.length - 1;
                      const isEven = periodInfo.period % 2 === 0;

                      return (
                        <tr
                          key={`${day.id}_${periodInfo.period}`}
                          className={`transition-colors ${
                            isLastPeriod
                              ? "border-b-[3.5px] border-black"
                              : "border-b border-black"
                          }`}
                        >
                          {/* Vertikal Kun ustuni (Har bir kun alohida qalin hoshiya bilan ajratilgan) */}
                          {pIndex === 0 && (
                            <td
                              rowSpan={displayPeriods.length}
                              className="border-2 border-black bg-slate-100 font-black text-[11px] tracking-[0.25em] text-center align-middle select-none w-7 p-1 shadow-inner text-slate-900"
                              style={{
                                writingMode: "vertical-lr",
                                transform: "rotate(180deg)",
                              }}
                            >
                              {day.name}
                            </td>
                          )}

                          {/* Dars raqami (1..6) */}
                          <td
                            className={`border border-black font-black text-xs text-center px-1 py-1 w-5 text-slate-900 ${
                              isEven ? "bg-slate-100" : "bg-white"
                            } ${isLastPeriod ? "border-b-[3.5px] border-b-black" : ""}`}
                          >
                            {periodInfo.period}
                          </td>

                          {/* Dars vaqti (8.00-8.45...) */}
                          <td
                            className={`border border-black font-mono text-[9px] font-semibold text-slate-700 px-1 py-1 w-16 text-center whitespace-nowrap ${
                              isEven ? "bg-slate-100" : "bg-white"
                            } ${isLastPeriod ? "border-b-[3.5px] border-b-black" : ""}`}
                          >
                            {periodInfo.time}
                          </td>

                          {/* Sinf Katakchalari: Fan (chap) + O'qituvchi raqami (o'ng) */}
                          {displayClasses.map((cls) => {
                            const cellLessons = cellLessonMap.get(`${cls.id}_${day.id}_${periodInfo.period}`) || [];
                            const lesson = cellLessons[0];
                            const subject = lesson ? subjectMap.get(lesson.subjectId) : undefined;
                            const teacher = lesson ? teacherMap.get(lesson.teacherId) : undefined;
                            const teacherNum = lesson ? teacherNumberMap.get(lesson.teacherId) : undefined;
                            const isPrimarySaturday = day.id === 6 && (cls.isPrimary || cls.grade <= 4);
                            const isHoveredTeacher = !!(lesson && hoveredTeacherId === lesson.teacherId);

                            return (
                              <OfficialTableCell
                                key={`cell_${cls.id}_${day.id}_${periodInfo.period}`}
                                cls={cls}
                                day={day.id}
                                period={periodInfo.period}
                                lesson={lesson}
                                subject={subject}
                                teacher={teacher}
                                teacherNumber={teacherNum}
                                isHoveredTeacher={isHoveredTeacher}
                                isPrimarySaturday={isPrimarySaturday}
                                isLastPeriodOfDay={isLastPeriod}
                                activeDragLesson={activeDragLesson}
                                allLessons={lessons}
                                teachers={teachers}
                                subjects={subjects}
                                rooms={rooms}
                                cellLessons={cellLessons}
                                teacherNumberMap={teacherNumberMap}
                                onHoverTeacher={setHoveredTeacherId}
                                hasConflict={lesson ? teacherConflictsSet.has(lesson.id) : false}
                                onCellClick={handleCellClick}
                              />
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}

                {/* ── 3. PASTDAGI STATISTIKA QATORLARI ───────────────────────── */}
                {/* Dars soati jami */}
                <tr className="bg-slate-200 font-black border-t-2 border-b border-black text-xs text-slate-900">
                  <td colSpan={3} className="border border-black px-2 py-1 text-right">
                    Dars soati
                  </td>
                  {displayClasses.map((cls) => (
                    <td
                      key={`hours_${cls.id}`}
                      colSpan={2}
                      className="border border-black px-1 py-1 text-center font-mono font-black text-xs bg-slate-100 text-slate-950"
                    >
                      {classTotalHours.get(cls.id) || 0}
                    </td>
                  ))}
                </tr>

                {/* Sinf rahbar F.I.Sh */}
                <tr className="bg-white font-bold border-b-2 border-black text-[10px] text-slate-900">
                  <td colSpan={3} className="border border-black px-2 py-1 text-right font-black">
                    Sinf rahbar
                  </td>
                  {displayClasses.map((cls) => {
                    const homeroomTeacher = getHomeroomTeacher(cls);
                    const shortName = homeroomTeacher
                      ? homeroomTeacher.fullName.split(" ").slice(0, 2).join(" ")
                      : "—";

                    return (
                      <td
                        key={`homeroom_${cls.id}`}
                        colSpan={2}
                        onClick={() => {
                          setHomeroomModal({
                            isOpen: true,
                            cls,
                            currentTeacherId: homeroomTeacher?.id,
                          });
                          setSelectedHomeroomTeacherId(homeroomTeacher?.id || "");
                        }}
                        className="border border-black px-1 py-1 text-center truncate max-w-[85px] text-[9.5px] cursor-pointer hover:bg-amber-100 hover:text-amber-950 font-bold transition-colors select-none"
                        title={`${cls.name} sinf rahbari: ${homeroomTeacher?.fullName || "Tayinlanmagan"} (O'zgartirish uchun bosing)`}
                      >
                        {shortName}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>

            {/* O'ng tomondagi O'qituvchilarning I.F.O va Fanlari Reestri */}
            <div className="ml-3 shrink-0 border-2 border-black font-sans text-[10px] w-84 bg-white shadow-sm">
              <div className="bg-slate-100 border-b-2 border-black p-1.5 text-center font-black text-xs uppercase tracking-wider text-slate-900">
                O'qituvchilar va Fanlar Reestri
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-200 border-b-2 border-black text-[9.5px]">
                    <th className="border border-black p-1 text-center w-7 font-black text-slate-900">№</th>
                    <th className="border border-black p-1 font-black text-slate-900 w-36">O'qituvchi F.I.Sh</th>
                    <th className="border border-black p-1 font-black text-slate-900">O'tadigan Fani / Fanlari</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTeachers.map((teacher, tIdx) => {
                    const num = teacherNumberMap.get(teacher.id) || 1;
                    const isHovered = hoveredTeacherId === teacher.id;
                    const subjectsStr = teacherSubjectsMap.get(teacher.id) || "—";
                    const isEven = tIdx % 2 !== 0;

                    return (
                      <tr
                        key={teacher.id}
                        onMouseEnter={() => setHoveredTeacherId(teacher.id)}
                        onMouseLeave={() => setHoveredTeacherId(null)}
                        className={`border-b border-black transition-colors cursor-pointer ${
                          isHovered
                            ? "bg-amber-200 font-bold"
                            : isEven
                            ? "bg-slate-50"
                            : "bg-white"
                        }`}
                        title={`${teacher.fullName} (${subjectsStr}) — darslarini jadvalda ko'rish`}
                      >
                        <td className="border border-black p-1 text-center font-mono font-black text-slate-900 bg-slate-100">
                          {num}
                        </td>
                        <td className="border border-black p-1 font-bold text-slate-900 truncate max-w-[130px]">
                          {teacher.fullName}
                        </td>
                        <td className="border border-black p-1 text-[9.5px] text-slate-700 font-semibold truncate max-w-[140px]">
                          {subjectsStr}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 4. RASMIY IMZO QATORLARI (Jadval kengligiga 100% moslangan) ──────────── */}
          <div
            className="mt-6 flex justify-between items-center text-xs sm:text-sm font-serif pt-3 cursor-pointer group"
            onClick={() => {
              setRequisitesForm({
                name: schoolName,
                region: region,
                directorName: directorName,
                vicePrincipalName: vicePrincipalName,
                psychologistName: psychologistName,
                academicYear: academicYear,
                approvalDate: approvalDate,
              });
              setIsRequisitesModalOpen(true);
            }}
            title="Zauch va Ruhshunos rekvizitlarini tahrirlash uchun bosing"
          >
            <div>
              <p>
                <span className="font-bold">O'quv ishlar bo'yicha direktor o'rinbosari:</span>{" "}
                <span className="inline-block border-b border-black w-36"></span>{" "}
                <span className="font-semibold underline decoration-dotted decoration-blue-500/50">{vicePrincipalName}</span>
              </p>
            </div>

            <div className="pr-4">
              <p>
                <span className="font-bold">Ruhshunos:</span>{" "}
                <span className="inline-block border-b border-black w-36"></span>{" "}
                <span className="font-semibold underline decoration-dotted decoration-blue-500/50">{psychologistName}</span>
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* ── 5. INTERAKTIV REKVIZITLARNI TAHRIRLASH MODALI ─────────────────── */}
        {isRequisitesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in no-print">
            <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white text-slate-900 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Maktab Rasmiy Rekvizitlari</h3>
                    <p className="text-[11px] text-slate-500">
                      Hujjat sarlavhasi va imzolarida aks etuvchi rasmiy ma'lumotlar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRequisitesModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRequisites} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Maktab nomi:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.name}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tuman / Hudud:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.region}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, region: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Maktab Direktori F.I.Sh:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.directorName}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, directorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      O'quv ishlari bo'yicha zauch F.I.Sh:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.vicePrincipalName}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, vicePrincipalName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ruhshunos F.I.Sh:
                    </label>
                    <input
                      type="text"
                      value={requisitesForm.psychologistName}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, psychologistName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      O'quv yili:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.academicYear}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, academicYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tasdiqlash sanasi:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.approvalDate}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, approvalDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsRequisitesModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Rekvizitlarni saqlash</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 6. INTERAKTIV CELL TAHRIRLASH MODALI ──────────────────────────── */}
        {cellModal && cellModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in no-print">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-900 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {cellModal.cls.name} &bull; {DAYS.find((d) => d.id === cellModal.day)?.name} {cellModal.period}-dars
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {cellModal.lesson ? "Dars ma'lumotlarini tahrirlash" : "Yangi dars tayinlash"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCellModal(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCell} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fan:
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.shortName || s.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    O'qituvchi (№ Tartib raqami bilan):
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {teachers.map((t, idx) => (
                      <option key={t.id} value={t.id}>
                        №{idx + 1} &bull; {t.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Zamena va Lock tugmalari (agar dars mavjud bo'lsa) */}
                {cellModal.lesson && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleToggleLock(cellModal.lesson!.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        cellModal.lesson.isLocked
                          ? "bg-amber-50 text-amber-700 border-amber-300"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                      }`}
                    >
                      {cellModal.lesson.isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Qulflangan</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Qulflash</span>
                        </>
                      )}
                    </button>

                    {onOpenZamena && (
                      <button
                        type="button"
                        onClick={() => {
                          onOpenZamena(cellModal.lesson!);
                          setCellModal(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Zamena</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteLesson(cellModal.lesson!.id)}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors cursor-pointer"
                      title="Darsni o'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCellModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                  >
                    Saqlash
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── 6. SINF RAHBARINI ALMASHTIRISH MODALI ───────────────────────── */}
        {homeroomModal && homeroomModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in no-print">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white text-slate-900 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      {homeroomModal.cls.name} — Sinf Rahbarini Tayinlash
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Sinf rahbari o'zgarganda Juma kungi Sinf soati va imzolar avtomatik yangilanadi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setHomeroomModal(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Sinf Rahbari (O'qituvchi):
                  </label>
                  <select
                    value={selectedHomeroomTeacherId}
                    onChange={(e) => setSelectedHomeroomTeacherId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">-- O'qituvchini tanlang --</option>
                    {teachers.map((t) => {
                      const subjectsStr = teacherSubjectsMap.get(t.id) || "";
                      return (
                        <option key={t.id} value={t.id}>
                          {t.fullName} {subjectsStr ? `(${subjectsStr})` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                  <p className="font-bold mb-0.5">⚡ Avtomatik Zanjir (SaaS Reactive Sync):</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-[10px] text-blue-800">
                    <li>Jadvalning eng pastki qatoridagi <strong>Sinf rahbar</strong> F.I.Sh yangilanadi.</li>
                    <li>Juma kuni 1-dars <strong>Sinf soati</strong> darsiga ushbu ustoz va uning tartib raqami (№) biriktiriladi.</li>
                    <li>O'qituvchilar va fanlar reestrida o'zgarishlar sinxron aks etadi.</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHomeroomModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="button"
                  onClick={handleSaveHomeroomTeacher}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  Saqlash va Sinxronlash
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Drag Overlay */}
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

        {/* ── JONLI TOAST NOTIFICATION ────────────────────────────────────── */}
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
