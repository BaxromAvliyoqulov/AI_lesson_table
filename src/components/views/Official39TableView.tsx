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
} from "lucide-react";

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

// Draggable & Droppable Katakcha Komponenti
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

  if (isPrimarySaturday) {
    return (
      <>
        <td
          colSpan={2}
          className="border border-black bg-gray-100 text-gray-400 text-[8px] font-semibold text-center p-0.5 select-none"
        >
          {period === 1 ? "Dam" : ""}
        </td>
      </>
    );
  }

  // Droppable va Hover vizual ko'rsatkichlari
  let bgClass = "bg-white";
  if (isHoveredTeacher) {
    bgClass = "bg-amber-100 ring-2 ring-amber-500 z-10";
  } else if (isOver) {
    bgClass = "bg-emerald-100 ring-2 ring-emerald-500 z-10";
  } else if (lesson?.isLocked) {
    bgClass = "bg-slate-50";
  }

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
        className={`border border-black px-1 py-0.5 text-left font-medium text-[10px] truncate max-w-[70px] cursor-pointer transition-colors relative select-none ${bgClass} ${
          isDragging ? "opacity-30" : ""
        }`}
        title={
          lesson
            ? `${subject?.name || "Fan"} — ${teacher?.fullName || "O'qituvchi"}`
            : "Bo'sh katakcha (Dars qo'shish uchun bosing)"
        }
      >
        <div className="flex items-center justify-between gap-0.5">
          <span className="truncate">{subject?.shortName || subject?.name || (lesson ? "Fan" : "—")}</span>
          {lesson?.isLocked && (
            <Lock className="w-2.5 h-2.5 text-indigo-600 shrink-0 inline no-print" />
          )}
        </div>
      </td>

      {/* O'qituvchi Tartib Raqami Ustuni */}
      <td
        onClick={() => onCellClick(cls, day, period, lesson)}
        className={`border border-black px-0.5 py-0.5 text-center font-bold text-[10px] w-6 cursor-pointer transition-colors select-none ${
          isHoveredTeacher ? "bg-amber-200 text-amber-900 font-extrabold" : teacherNumber ? "bg-amber-50/70 text-black font-mono" : "text-gray-300"
        } ${isDragging ? "opacity-30" : ""}`}
        title={teacher ? `№${teacherNumber}: ${teacher.fullName}` : ""}
      >
        {teacherNumber || ""}
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
  schoolName = "39 - umumiy o'rta ta'lim maktabi",
  region = "Muzrabot tumani",
  directorName = "M. Ramazonov",
  vicePrincipalName = "N. Narziqulov",
  psychologistName = "F.I.Sh",
  academicYear = "2025 - 2026",
  approvalDate = "2026-yil 28-mart",
}) => {
  // Bosqich filtri: "HIGH" (5-11), "PRIMARY" (1-4), "ALL" (1-11)
  const [stageFilter, setStageFilter] = useState<"HIGH" | "PRIMARY" | "ALL">("HIGH");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [hoveredTeacherId, setHoveredTeacherId] = useState<string | null>(null);
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

  // Har bir o'qituvchiga tartib raqami (1..N)
  const teacherNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    teachers.forEach((t, i) => map.set(t.id, i + 1));
    return map;
  }, [teachers]);

  // Lessons map: `${classId}_${day}_${period}` -> Lesson
  const lessonMap = useMemo(() => {
    const map = new Map<string, Lesson>();
    for (const l of lessons) {
      map.set(`${l.classId}_${l.dayOfWeek}_${l.periodNumber}`, l);
    }
    return map;
  }, [lessons]);

  // Bosqich va Filial bo'yicha filtrlangan sinflar
  const displayClasses = useMemo(() => {
    let list = classes;
    if (selectedBranch !== "ALL") {
      list = list.filter((c) => c.branchId === selectedBranch);
    }
    if (stageFilter === "PRIMARY") {
      list = list.filter((c) => c.isPrimary || c.grade <= 4);
    } else if (stageFilter === "HIGH") {
      list = list.filter((c) => !c.isPrimary && c.grade >= 5);
    }
    return list;
  }, [classes, selectedBranch, stageFilter]);

  // Boshlang'ich sinflar uchun 5 kunlik hafta (Dushanba-Juma)
  const displayDays = useMemo(() => {
    if (stageFilter === "PRIMARY") {
      return DAYS.slice(0, 5); // Faqat Dushanba-Juma
    }
    return DAYS; // Dushanba-Shanba
  }, [stageFilter]);

  // Boshlang'ich sinflar uchun odatda 5 dars, yuqori sinflar uchun 6 dars
  const displayPeriods = useMemo(() => {
    if (stageFilter === "PRIMARY") {
      return PERIOD_TIMES.slice(0, 5);
    }
    return PERIOD_TIMES;
  }, [stageFilter]);

  // Har bir sinf uchun jami dars soatlari
  const classTotalHours = useMemo(() => {
    const map = new Map<string, number>();
    for (const cls of displayClasses) {
      const count = lessons.filter((l) => l.classId === cls.id).length;
      map.set(cls.id, count);
    }
    return map;
  }, [displayClasses, lessons]);

  // Joriy ko'rinishdagi o'qituvchilar ro'yxati (o'ng tarafdagi jadval uchun)
  const displayTeachers = useMemo(() => {
    if (stageFilter === "ALL") return teachers;
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
  }, [teachers, displayClasses, lessons, stageFilter]);

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

  const stageTitle =
    stageFilter === "PRIMARY"
      ? "BOSHLANG'ICH SINFLAR (1-4)"
      : stageFilter === "HIGH"
      ? "YUQORI VA O'RTA SINFLAR (5-11)"
      : "UMUMIY MAKTAB (1-11 SINFLAR)";

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full flex flex-col bg-white text-black p-4 sm:p-6 print:p-0 select-text">
        {/* ── TOP ACTION & TAB CONTROLS ───────────────────────────────────────── */}
        <div className="no-print mb-6 p-4 rounded-2xl bg-slate-900 text-white shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border border-slate-800">
          {/* Chap: Bosqich Tablari (Boshlang'ich / Katta sinflar / Barchasi) */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 self-start">
            <button
              onClick={() => setStageFilter("HIGH")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                stageFilter === "HIGH"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>🧑 Katta sinflar (5-11)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-950 text-blue-300 font-mono">
                {classes.filter((c) => !c.isPrimary && c.grade >= 5).length}
              </span>
            </button>

            <button
              onClick={() => setStageFilter("PRIMARY")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                stageFilter === "PRIMARY"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>👦 Boshlang'ich (1-4)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-mono">
                {classes.filter((c) => c.isPrimary || c.grade <= 4).length}
              </span>
            </button>

            <button
              onClick={() => setStageFilter("ALL")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                stageFilter === "ALL"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>🏫 Barchasi (1-11)</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-purple-950 text-purple-300 font-mono">
                {classes.length}
              </span>
            </button>
          </div>

          {/* O'ng: Filial filtri, Rekvizitlar, Excel va Chop etish tugmalari */}
          <div className="flex items-center gap-2.5 flex-wrap self-end md:self-auto">
            {branches.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-white text-xs font-semibold outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">
                    🏛️ Barcha binolar
                  </option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

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
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow-sm cursor-pointer transition-all"
              title="Maktab nomi, direktor va zauch rekvizitlarini o'zgartirish"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Rekvizitlar</span>
            </button>

            {onExportExcel && (
              <button
                onClick={onExportExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Excel yuklab olish</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Chop etish (Print / PDF)</span>
            </button>
          </div>
        </div>

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
                <tr className="bg-gray-100 font-bold border-b border-black">
                  <th rowSpan={2} className="border border-black px-1.5 py-1 w-6 text-center">
                    Kun
                  </th>
                  <th rowSpan={2} className="border border-black px-1 py-1 w-5 text-center">
                    Dars
                  </th>
                  <th rowSpan={2} className="border border-black px-1.5 py-1 w-16 text-center font-mono">
                    Vaqti
                  </th>

                  {displayClasses.map((cls) => (
                    <th
                      key={cls.id}
                      colSpan={2}
                      className="border border-black px-2 py-1 text-center font-bold text-xs bg-gray-50 min-w-[90px]"
                    >
                      {cls.name}
                    </th>
                  ))}
                </tr>

                {/* 2-qator: Har bir sinf tagida Fan | № ustunlari */}
                <tr className="bg-gray-200 font-semibold text-[9px] border-b-2 border-black">
                  {displayClasses.map((cls) => (
                    <React.Fragment key={`sub_${cls.id}`}>
                      <th className="border border-black px-1 py-0.5 text-center w-16">Fan</th>
                      <th className="border border-black px-1 py-0.5 text-center w-6 bg-gray-300 font-bold">
                        №
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>

              <tbody>
                {displayDays.map((day) => (
                  <React.Fragment key={day.id}>
                    {displayPeriods.map((periodInfo, pIndex) => (
                      <tr
                        key={`${day.id}_${periodInfo.period}`}
                        className={`hover:bg-blue-50/30 transition-colors ${
                          pIndex === displayPeriods.length - 1 ? "border-b-2 border-black" : "border-b border-gray-300"
                        }`}
                      >
                        {/* Vertikal Kun ustuni */}
                        {pIndex === 0 && (
                          <td
                            rowSpan={displayPeriods.length}
                            className="border border-black bg-gray-100 font-bold text-[10px] tracking-wider text-center align-middle select-none w-6 p-1"
                            style={{
                              writingMode: "vertical-lr",
                              transform: "rotate(180deg)",
                            }}
                          >
                            {day.name}
                          </td>
                        )}

                        {/* Dars raqami (1..6) */}
                        <td className="border border-black font-bold text-center px-1 py-1 w-5 bg-gray-50">
                          {periodInfo.period}
                        </td>

                        {/* Dars vaqti (8.00-8.45...) */}
                        <td className="border border-black font-mono text-[9px] text-gray-700 px-1 py-1 w-16 text-center whitespace-nowrap bg-gray-50">
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
                              onCellClick={handleCellClick}
                            />
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {/* ── 3. PASTDAGI STATISTIKA QATORLARI ───────────────────────── */}
                {/* Dars soati jami */}
                <tr className="bg-gray-200 font-bold border-t-2 border-b border-black text-xs">
                  <td colSpan={3} className="border border-black px-2 py-1 text-right">
                    Dars soati
                  </td>
                  {displayClasses.map((cls) => (
                    <td
                      key={`hours_${cls.id}`}
                      colSpan={2}
                      className="border border-black px-1 py-1 text-center font-mono font-bold text-xs bg-gray-100"
                    >
                      {classTotalHours.get(cls.id) || 0}
                    </td>
                  ))}
                </tr>

                {/* Sinf rahbar F.I.Sh */}
                <tr className="bg-white font-semibold border-b-2 border-black text-[10px]">
                  <td colSpan={3} className="border border-black px-2 py-1 text-right font-bold">
                    Sinf rahbar
                  </td>
                  {displayClasses.map((cls) => {
                    const homeroomTeacher = teachers.find((t) => t.homeroomClassId === cls.id);
                    const shortName = homeroomTeacher
                      ? homeroomTeacher.fullName.split(" ").slice(0, 2).join(" ")
                      : "—";

                    return (
                      <td
                        key={`homeroom_${cls.id}`}
                        colSpan={2}
                        className="border border-black px-1 py-1 text-center truncate max-w-[85px] text-[9px]"
                        title={homeroomTeacher?.fullName || "Sinf rahbari"}
                      >
                        {shortName}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>

            {/* O'ng tomondagi O'qituvchilarning I.F.O Reestri (Legend) */}
            <div className="ml-3 shrink-0 border border-black font-sans text-[10px] w-60 bg-white">
              <div className="bg-gray-100 border-b border-black p-1 text-center font-bold text-xs uppercase">
                O'qituvchilarning I.F.O
              </div>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-gray-200 border-b border-black text-[9px]">
                    <th className="border-r border-black p-1 text-center w-7 font-bold">№</th>
                    <th className="p-1 font-bold">O'qituvchi F.I.Sh</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTeachers.map((teacher) => {
                    const num = teacherNumberMap.get(teacher.id) || 1;
                    const isHovered = hoveredTeacherId === teacher.id;
                    return (
                      <tr
                        key={teacher.id}
                        onMouseEnter={() => setHoveredTeacherId(teacher.id)}
                        onMouseLeave={() => setHoveredTeacherId(null)}
                        className={`border-b border-gray-200 transition-colors cursor-pointer ${
                          isHovered
                            ? "bg-amber-200 font-bold"
                            : num % 2 === 0
                            ? "bg-white"
                            : "bg-gray-50"
                        }`}
                        title={`${teacher.fullName}ning barcha darslarini jadvalda ko'rish`}
                      >
                        <td className="border-r border-black p-1 text-center font-mono font-bold text-gray-700">
                          {num}
                        </td>
                        <td className="p-1 font-medium truncate max-w-[190px]">
                          {teacher.fullName}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 4. RASMIY IMZO QATORLARI ───────────────────────────────────────── */}
        <div
          className="w-full mt-6 flex justify-between items-center text-xs sm:text-sm font-serif pt-4 cursor-pointer group"
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

          <div>
            <p>
              <span className="font-bold">Ruhshunos:</span>{" "}
              <span className="inline-block border-b border-black w-36"></span>{" "}
              <span className="font-semibold underline decoration-dotted decoration-blue-500/50">{psychologistName}</span>
            </p>
          </div>
        </div>

        {/* ── 5. INTERAKTIV REKVIZITLARNI TAHRIRLASH MODALI ─────────────────── */}
        {isRequisitesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in no-print">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 text-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">Maktab Rasmiy Rekvizitlari</h3>
                    <p className="text-[11px] text-slate-400">
                      Hujjat sarlavhasi va imzolarida aks etuvchi rasmiy ma'lumotlar
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRequisitesModalOpen(false)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRequisites} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Maktab nomi:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.name}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tuman / Hudud:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.region}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, region: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Maktab Direktori F.I.Sh:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.directorName}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, directorName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      O'quv ishlari bo'yicha zauch F.I.Sh:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.vicePrincipalName}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, vicePrincipalName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Ruhshunos F.I.Sh:
                    </label>
                    <input
                      type="text"
                      value={requisitesForm.psychologistName}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, psychologistName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      O'quv yili:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.academicYear}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, academicYear: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Tasdiqlash sanasi:
                    </label>
                    <input
                      type="text"
                      required
                      value={requisitesForm.approvalDate}
                      onChange={(e) => setRequisitesForm({ ...requisitesForm, approvalDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsRequisitesModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 cursor-pointer flex items-center gap-1.5"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in no-print">
            <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 text-white p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      {cellModal.cls.name} &bull; {DAYS.find((d) => d.id === cellModal.day)?.name} {cellModal.period}-dars
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {cellModal.lesson ? "Dars ma'lumotlarini tahrirlash" : "Yangi dars tayinlash"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCellModal(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCell} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Fan:
                  </label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.shortName || s.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    O'qituvchi (№ Tartib raqami bilan):
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs outline-none focus:ring-2 focus:ring-amber-500"
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
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleToggleLock(cellModal.lesson!.id)}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        cellModal.lesson.isLocked
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                      }`}
                    >
                      {cellModal.lesson.isLocked ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Qulflangan</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
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
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-colors cursor-pointer"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Zamena</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteLesson(cellModal.lesson!.id)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer"
                      title="Darsni o'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setCellModal(null)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Saqlash
                  </button>
                </div>
              </form>
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
