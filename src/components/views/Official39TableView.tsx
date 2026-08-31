"use client";

import React, { useMemo, useState } from "react";
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
} from "lucide-react";
import { CSPSolver } from "@/lib/solver/csp-solver";

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

// Fanlar uchun zamonaviy rangli mavzular (Variant 2)
function getSubjectTheme(subject?: Subject, subjectId?: string) {
  if (!subject && !subjectId) return { border: "#CBD5E1", bg: "bg-white", text: "text-slate-900" };

  const id = (subject?.id || subjectId || "").toLowerCase();
  const name = (subject?.name || "").toLowerCase();

  if (id === "sub_sinf_soati" || name.includes("sinf soati")) {
    return { border: "#06B6D4", bg: "bg-cyan-50/80", text: "text-cyan-950" };
  }
  if (name.includes("matem") || name.includes("algebra") || name.includes("geom")) {
    return { border: "#2563EB", bg: "bg-blue-50/60", text: "text-blue-950" };
  }
  if (name.includes("fizika") || name.includes("informat")) {
    return { border: "#4F46E5", bg: "bg-indigo-50/60", text: "text-indigo-950" };
  }
  if (name.includes("ona tili") || name.includes("adabiyot")) {
    return { border: "#D97706", bg: "bg-amber-50/60", text: "text-amber-950" };
  }
  if (name.includes("ingliz") || name.includes("nemis") || name.includes("frans") || name.includes("xorijiy")) {
    return { border: "#7C3AED", bg: "bg-purple-50/60", text: "text-purple-950" };
  }
  if (name.includes("rus tili")) {
    return { border: "#DC2626", bg: "bg-rose-50/50", text: "text-rose-950" };
  }
  if (name.includes("kimyo") || name.includes("biolog") || name.includes("tabiiy")) {
    return { border: "#059669", bg: "bg-emerald-50/60", text: "text-emerald-950" };
  }
  if (name.includes("tarix") || name.includes("huquq") || name.includes("tarbiya")) {
    return { border: "#EA580C", bg: "bg-orange-50/60", text: "text-orange-950" };
  }
  if (name.includes("jismoniy") || name.includes("chqbt") || name.includes("sport") || name.includes("astronom")) {
    return { border: "#0284C7", bg: "bg-sky-50/60", text: "text-sky-950" };
  }
  if (name.includes("tasviriy") || name.includes("chizmachilik") || name.includes("musiqa") || name.includes("texnolog")) {
    return { border: "#DB2777", bg: "bg-pink-50/60", text: "text-pink-950" };
  }
  if (name.includes("geograf") || name.includes("iqtisod") || name.includes("tadbirkor")) {
    return { border: "#0D9488", bg: "bg-teal-50/60", text: "text-teal-950" };
  }

  return { border: "#64748B", bg: "bg-slate-50/60", text: "text-slate-900" };
}

// Draggable & Droppable Katakcha Komponenti (Variant 2: Smart SaaS)
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
  hoveredSlot?: { classId: string; day: number; period: number } | null;
  onHoverSlot?: (slot: { classId: string; day: number; period: number } | null) => void;
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
  hoveredSlot,
  onHoverSlot,
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

  const bottomBorderClass = isLastPeriodOfDay
    ? "border-b-[3.5px] border-b-black"
    : "border-b border-black";

  const isEven = period % 2 === 0;
  const isHoveredSlot = hoveredSlot?.classId === cls.id && hoveredSlot?.day === day && hoveredSlot?.period === period;
  const isHoveredRow = hoveredSlot?.day === day && hoveredSlot?.period === period;
  const isHoveredCol = hoveredSlot?.classId === cls.id;

  if (isPrimarySaturday) {
    return (
      <>
        <td
          colSpan={2}
          className={`border border-black bg-slate-100/70 text-slate-400 text-[9px] font-bold text-center p-1 select-none ${bottomBorderClass}`}
        >
          {period === 1 ? "Dam" : "—"}
        </td>
      </>
    );
  }

  const theme = lesson ? getSubjectTheme(subject, lesson.subjectId) : null;

  // Droppable, Hover va Ziddiyat (Conflict) vizual ko'rsatkichlari
  let bgClass = isHoveredSlot
    ? "bg-blue-100/90 ring-2 ring-blue-500 shadow-sm z-20"
    : isHoveredRow || isHoveredCol
    ? "bg-blue-50/40"
    : lesson
    ? theme?.bg || "bg-white"
    : isEven
    ? "bg-slate-50/60"
    : "bg-white";

  if (hasConflict) {
    bgClass = "bg-rose-100 ring-2 ring-rose-500 text-rose-950 font-bold z-20";
  } else if (isHoveredTeacher) {
    bgClass = "bg-amber-200 ring-2 ring-amber-500 text-amber-950 font-bold z-10";
  } else if (isOver) {
    bgClass = "bg-emerald-100 ring-2 ring-emerald-500 z-10";
  } else if (lesson?.isLocked) {
    bgClass = "bg-slate-100/90";
  }

  return (
    <>
      {/* Fan Nomi Ustuni (Rangli chap hoshiya bilan) */}
      <td
        ref={(el) => {
          setDropRef(el);
          if (lesson) setDragRef(el);
        }}
        {...(lesson ? listeners : {})}
        {...(lesson ? attributes : {})}
        onClick={() => onCellClick(cls, day, period, lesson)}
        onMouseEnter={() => onHoverSlot && onHoverSlot({ classId: cls.id, day, period })}
        onMouseLeave={() => onHoverSlot && onHoverSlot(null)}
        className={`border border-black px-1.5 py-1 text-left font-bold text-[10.5px] truncate max-w-[76px] cursor-pointer transition-all relative select-none ${bottomBorderClass} ${bgClass} ${
          isDragging ? "opacity-30" : ""
        }`}
        style={{
          borderLeft: lesson ? `3.5px solid ${theme?.border || "#3B82F6"}` : undefined,
        }}
        title={
          hasConflict
            ? `⚠️ ZIDDIYAT: ${teacher?.fullName || "O'qituvchi"} ayni shu paytda boshqa sinfda ham darsga qo'yilgan!`
            : lesson
            ? `${subject?.name || "Fan"} — ${teacher?.fullName || "O'qituvchi"}`
            : "Bo'sh katakcha (Dars qo'shish uchun bosing)"
        }
      >
        <div className="flex items-center justify-between gap-0.5">
          <span className={`truncate ${lesson ? "text-slate-950 font-bold tracking-tight" : "text-slate-300"}`}>
            {subject?.shortName || subject?.name || (lesson ? "Fan" : "—")}
          </span>
          {hasConflict && (
            <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0 inline no-print animate-bounce" />
          )}
          {lesson?.isLocked && (
            <Lock className="w-2.5 h-2.5 text-indigo-600 shrink-0 inline no-print" />
          )}
        </div>
      </td>

      {/* O'qituvchi Tartib Raqami Ustuni (Chiroyli mini-badge bilan) */}
      <td
        onClick={() => onCellClick(cls, day, period, lesson)}
        onMouseEnter={() => onHoverSlot && onHoverSlot({ classId: cls.id, day, period })}
        onMouseLeave={() => onHoverSlot && onHoverSlot(null)}
        className={`border border-black px-0.5 py-0.5 text-center font-mono text-[10px] w-6 cursor-pointer transition-colors select-none ${bottomBorderClass} ${
          hasConflict
            ? "bg-rose-200 text-rose-950 font-extrabold"
            : isHoveredTeacher
            ? "bg-amber-300 text-amber-950 font-extrabold"
            : isHoveredSlot
            ? "bg-blue-100"
            : isHoveredRow || isHoveredCol
            ? "bg-blue-50/40"
            : isEven
            ? "bg-slate-100/90"
            : "bg-slate-50"
        } ${isDragging ? "opacity-30" : ""}`}
        title={
          hasConflict
            ? `⚠️ Ziddiyat: №${teacherNumber} ${teacher?.fullName} band!`
            : teacher
            ? `№${teacherNumber}: ${teacher.fullName}`
            : ""
        }
      >
        {teacherNumber ? (
          <span
            className={`inline-flex items-center justify-center min-w-[17px] h-3.5 px-0.5 rounded text-[9px] font-mono font-black border transition-transform ${
              isHoveredTeacher
                ? "bg-amber-400 text-amber-950 border-amber-600 scale-110 shadow-sm"
                : "bg-white text-slate-900 border-slate-300 shadow-[0_1px_1px_rgba(0,0,0,0.06)]"
            }`}
          >
            {teacherNumber}
          </span>
        ) : (
          <span className="text-slate-300">—</span>
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
  const [hoveredSlot, setHoveredSlot] = useState<{ classId: string; day: number; period: number } | null>(null);
  const [activeDragLesson, setActiveDragLesson] = useState<Lesson | null>(null);

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

  const handleSaveHomeroomTeacher = () => {
    if (!homeroomModal || !selectedHomeroomTeacherId) return;
    if (onSetHomeroomTeacher) {
      onSetHomeroomTeacher(homeroomModal.cls.id, selectedHomeroomTeacherId);
    } else if (onLessonsChange) {
      const updatedLessons = lessons.map((l) => {
        if (
          l.classId === homeroomModal.cls.id &&
          (l.subjectId === "sub_sinf_soati" || (l.dayOfWeek === 5 && l.periodNumber === 1))
        ) {
          return { ...l, teacherId: selectedHomeroomTeacherId };
        }
        return l;
      });
      onLessonsChange(updatedLessons);
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

  // Asosiy bino va Filial (D sinflar) bo'yicha aniq filtrlangan sinflar
  const displayClasses = useMemo(() => {
    switch (filterScope) {
      case "MAIN_ALL":
        return classes.filter((c) => c.branchId === "b39_1");
      case "MAIN_HIGH":
        return classes.filter((c) => c.branchId === "b39_1" && !c.isPrimary && c.grade >= 5);
      case "MAIN_PRIMARY":
        return classes.filter((c) => c.branchId === "b39_1" && (c.isPrimary || c.grade <= 4));
      case "BRANCH_ALL":
        return classes.filter((c) => c.branchId === "b39_2");
      case "BRANCH_HIGH":
        return classes.filter((c) => c.branchId === "b39_2" && !c.isPrimary && c.grade >= 5);
      case "BRANCH_PRIMARY":
        return classes.filter((c) => c.branchId === "b39_2" && (c.isPrimary || c.grade <= 4));
      case "ALL":
      default:
        return classes;
    }
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
                <optgroup label="🏢 Asosiy Maktab" className="bg-white text-slate-900 font-bold">
                  <option value="MAIN_HIGH" className="bg-white text-slate-900">
                    🧑 Asosiy maktab — Katta sinf (5-11)
                  </option>
                  <option value="MAIN_PRIMARY" className="bg-white text-slate-900">
                    👦 Asosiy maktab — Boshlang'ich (1-4)
                  </option>
                  <option value="MAIN_ALL" className="bg-white text-slate-900">
                    🏢 Asosiy maktab — Hammasi (1-11)
                  </option>
                </optgroup>

                <optgroup label="🏠 Filial Binosi (D-sinflar)" className="bg-white text-amber-700 font-bold">
                  <option value="BRANCH_HIGH" className="bg-white text-slate-900">
                    🧑 Filial — Katta sinf (5-D, 6-D, 7-D)
                  </option>
                  <option value="BRANCH_PRIMARY" className="bg-white text-slate-900">
                    👦 Filial — Boshlang'ich (1-D .. 4-D)
                  </option>
                  <option value="BRANCH_ALL" className="bg-white text-slate-900">
                    🏠 Filial — Hammasi (1-D .. 7-D)
                  </option>
                </optgroup>

                <optgroup label="🏛️ Umumiy Maktab" className="bg-white text-purple-700 font-bold">
                  <option value="ALL" className="bg-white text-slate-900">
                    🏛️ Barcha filiallar (Umumiy maktab)
                  </option>
                </optgroup>
              </select>
            </div>

            {/* Tezkor Tab Tugmalari */}
            <div className="hidden lg:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setFilterScope("MAIN_HIGH")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterScope === "MAIN_HIGH"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Asosiy Katta
              </button>
              <button
                onClick={() => setFilterScope("MAIN_PRIMARY")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterScope === "MAIN_PRIMARY"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Asosiy Boshlang'ich
              </button>
              <button
                onClick={() => setFilterScope("BRANCH_HIGH")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterScope === "BRANCH_HIGH"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Filial Katta (5-7D)
              </button>
              <button
                onClick={() => setFilterScope("BRANCH_PRIMARY")}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterScope === "BRANCH_PRIMARY"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                Filial Boshlang'ich (1-4D)
              </button>
            </div>
          </div>

          {/* O'ng: AI Nazorat, Zoom, Rekvizitlar, Excel va Chop etish tugmalari */}
          <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
            {/* AI Patrul & Ziddiyatlarni tuzatish tugmasi */}
            {teacherConflictsSet.size > 0 ? (
              <button
                type="button"
                onClick={handleAutoFixConflicts}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer animate-pulse transition-all"
                title="Parallel darslarni AI algoritmi orqali 0 ziddiyatgacha avtomatik qayta taqsimlash"
              >
                <Sparkles className="w-4 h-4" />
                <span>⚡ AI Bilan To'g'rilash ({Math.round(teacherConflictsSet.size / 2)} ta ziddiyat)</span>
              </button>
            ) : (
              <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>0 Ziddiyat &bull; AI Nazoratida</span>
              </div>
            )}

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
              >
                <Download className="w-4 h-4" />
                <span>Excel yuklab olish</span>
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

                  {displayClasses.map((cls) => (
                    <th
                      key={cls.id}
                      colSpan={2}
                      className={`border border-black px-2 py-1.5 text-center font-black text-xs min-w-[92px] ${
                        cls.branchId === "b39_2"
                          ? "bg-amber-100 text-amber-950"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span className="tracking-wide font-black">{cls.name}</span>
                        {cls.branchId === "b39_2" && (
                          <span className="text-[8px] font-bold text-amber-900">(Filial)</span>
                        )}
                      </div>
                    </th>
                  ))}
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
                      const isRowHovered =
                        hoveredSlot?.day === day.id &&
                        hoveredSlot?.period === periodInfo.period;

                      return (
                        <tr
                          key={`${day.id}_${periodInfo.period}`}
                          className={`transition-colors ${
                            isRowHovered ? "bg-blue-50/50" : "hover:bg-blue-50/20"
                          } ${
                            isLastPeriod
                              ? "border-b-[3.5px] border-black"
                              : "border-b border-black"
                          }`}
                        >
                          {/* Vertikal Kun ustuni (Har bir kun alohida qalin hoshiya bilan ajratilgan) */}
                          {pIndex === 0 && (
                            <td
                              rowSpan={displayPeriods.length}
                              className="border-2 border-black bg-gradient-to-b from-slate-100 to-slate-200 font-black text-[11px] tracking-[0.25em] text-center align-middle select-none w-7 p-1 shadow-inner text-slate-900"
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
                              isRowHovered
                                ? "bg-blue-100"
                                : isEven
                                ? "bg-slate-100"
                                : "bg-white"
                            } ${isLastPeriod ? "border-b-[3.5px] border-b-black" : ""}`}
                          >
                            {periodInfo.period}
                          </td>

                          {/* Dars vaqti (8.00-8.45...) */}
                          <td
                            className={`border border-black font-mono text-[9px] font-semibold text-slate-700 px-1 py-1 w-16 text-center whitespace-nowrap ${
                              isRowHovered
                                ? "bg-blue-100"
                                : isEven
                                ? "bg-slate-100"
                                : "bg-white"
                            } ${isLastPeriod ? "border-b-[3.5px] border-b-black" : ""}`}
                          >
                            {periodInfo.time}
                          </td>

                          {/* Sinf Katakchalari: Fan (chap) + O'qituvchi raqami (o'ng) */}
                          {displayClasses.map((cls) => {
                            const lesson = lessonMap.get(`${cls.id}_${day.id}_${periodInfo.period}`);
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
                                hoveredSlot={hoveredSlot}
                                onHoverSlot={setHoveredSlot}
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
                    const homeroomTeacher =
                      teachers.find((t) => t.id === cls.homeroomTeacherId) ||
                      teachers.find((t) => t.homeroomClassId === cls.id);
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
                  disabled={!selectedHomeroomTeacherId}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md shadow-blue-600/20 cursor-pointer transition-all"
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
      </div>
    </DndContext>
  );
};
