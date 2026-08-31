"use client";

import React, { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  Lesson,
  SchoolClass,
  Subject,
  Teacher,
  Room,
  Branch,
  Shift,
  DragValidationResult,
} from "@/types";
import { LessonCard, GridDensity } from "./LessonCard";
import {
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  X,
  Building2,
  Clock,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  SlidersHorizontal,
  GraduationCap,
  Layers,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface MasterGridProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  branches?: Branch[];
  shifts?: Shift[];
  onLessonsChange: (lessons: Lesson[]) => void;
  onOpenZamena: (lesson: Lesson) => void;
  zoomLevel: number;
  selectedBranch: string;
}

const DAYS = [
  { id: 1, name: "Dushanba" },
  { id: 2, name: "Seshanba" },
  { id: 3, name: "Chorshanba" },
  { id: 4, name: "Payshanba" },
  { id: 5, name: "Juma" },
  { id: 6, name: "Shanba" },
];

const PERIODS = [1, 2, 3, 4, 5, 6, 7];

// Droppable katakcha komponenti
const GridCell: React.FC<{
  classId: string;
  day: number;
  period: number;
  density: GridDensity;
  isPrimaryWeekend?: boolean;
  lesson?: Lesson;
  subject?: Subject;
  teacher?: Teacher;
  teacherNumber?: number;
  room?: Room | null;
  activeValidation?: DragValidationResult | null;
  isOver: boolean;
  onToggleLock: (lessonId: string) => void;
  onOpenZamena: (lesson: Lesson) => void;
}> = ({
  classId,
  day,
  period,
  density,
  isPrimaryWeekend,
  lesson,
  subject,
  teacher,
  teacherNumber,
  room,
  activeValidation,
  isOver,
  onToggleLock,
  onOpenZamena,
}) => {
  const droppableId = `${classId}_${day}_${period}`;
  const { setNodeRef, isOver: isCellOver } = useDroppable({
    id: droppableId,
    data: { classId, day, period, existingLesson: lesson },
    disabled: isPrimaryWeekend,
  });

  // Cell status rangini aniqlash
  let statusBg = isPrimaryWeekend ? "bg-muted/15" : "bg-card/60 hover:bg-muted/30";
  let statusBorder = isPrimaryWeekend ? "border-border/30" : "border-border/60";

  if (isOver || isCellOver) {
    if (activeValidation?.status === "safe") {
      statusBg = "bg-emerald-500/20 ring-2 ring-emerald-500/80";
      statusBorder = "border-emerald-500";
    } else if (activeValidation?.status === "warning") {
      statusBg = "bg-amber-500/25 ring-2 ring-amber-500/80";
      statusBorder = "border-amber-500";
    } else if (activeValidation?.status === "danger") {
      statusBg = "bg-rose-500/25 ring-2 ring-rose-500/80";
      statusBorder = "border-rose-500";
    }
  }

  const minHeightClass =
    density === "NUMBERED"
      ? "min-h-[36px]"
      : density === "COMPACT"
      ? "min-h-[52px]"
      : "min-h-[72px]";

  return (
    <div
      ref={setNodeRef}
      className={`${minHeightClass} rounded-lg border p-1 transition-all duration-150 flex flex-col justify-center ${statusBg} ${statusBorder}`}
    >
      {lesson ? (
        <LessonCard
          lesson={lesson}
          subject={subject}
          teacher={teacher}
          teacherNumber={teacherNumber}
          room={room}
          density={density}
          onToggleLock={onToggleLock}
          onOpenZamena={onOpenZamena}
        />
      ) : isPrimaryWeekend ? (
        <div className="h-full w-full flex flex-col items-center justify-center text-[9px] text-slate-400/50 font-semibold select-none bg-slate-900/10 rounded">
          <span>Dam</span>
          <span className="text-[8px] text-slate-500/60">(5 kun)</span>
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center text-[10px] text-muted-foreground/30 font-mono select-none">
          +
        </div>
      )}
    </div>
  );
};

export const MasterGrid: React.FC<MasterGridProps> = ({
  classes,
  subjects,
  teachers,
  rooms,
  lessons,
  branches,
  shifts,
  onLessonsChange,
  onOpenZamena,
  zoomLevel: propZoomLevel,
  selectedBranch,
}) => {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeValidation, setActiveValidation] = useState<DragValidationResult | null>(null);
  const [warningModal, setWarningModal] = useState<{
    isOpen: boolean;
    sourceLesson: Lesson;
    targetClassId: string;
    targetDay: number;
    targetPeriod: number;
    existingLesson?: Lesson;
    message: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Local grid filters & controls
  const [stageFilter, setStageFilter] = useState<"ALL" | "PRIMARY" | "MIDDLE" | "HIGH">("ALL");
  const [shiftFilter, setShiftFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [density, setDensity] = useState<GridDensity>("STANDARD");

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const scrollHorizontally = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: "smooth" });
    }
  };

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const branchMap = useMemo(() => new Map((branches || []).map((b) => [b.id, b])), [branches]);
  const shiftMap = useMemo(() => new Map((shifts || []).map((s) => [s.id, s])), [shifts]);

  const teacherNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    teachers.forEach((t, i) => map.set(t.id, i + 1));
    return map;
  }, [teachers]);

  // Sinflarni filtrlash (Filial + Bosqich + Smena + Qidiruv)
  const filteredClasses = useMemo(() => {
    let list = classes;

    // 1. Filial filtri
    if (selectedBranch !== "ALL") {
      list = list.filter((c) => c.branchId === selectedBranch);
    }

    // 2. Bosqich filtri
    if (stageFilter === "PRIMARY") {
      list = list.filter((c) => c.grade <= 4);
    } else if (stageFilter === "MIDDLE") {
      list = list.filter((c) => c.grade >= 5 && c.grade <= 9);
    } else if (stageFilter === "HIGH") {
      list = list.filter((c) => c.grade >= 10);
    }

    // 3. Smena filtri
    if (shiftFilter !== "ALL") {
      list = list.filter((c) => c.shiftId === shiftFilter);
    }

    // 4. Qidiruv
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || `${c.grade}` === q);
    }

    return list;
  }, [classes, selectedBranch, stageFilter, shiftFilter, searchQuery]);

  // Lessons map: `${classId}_${day}_${period}` -> Lesson
  const lessonMap = useMemo(() => {
    const map = new Map<string, Lesson>();
    for (const l of lessons) {
      map.set(`${l.classId}_${l.dayOfWeek}_${l.periodNumber}`, l);
    }
    return map;
  }, [lessons]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Ziddiyatni tekshirish (Validation Engine)
  const validateMove = (
    lessonToMove: Lesson,
    targetClassId: string,
    targetDay: number,
    targetPeriod: number,
    targetExistingLesson?: Lesson
  ): DragValidationResult => {
    const teacher = teacherMap.get(lessonToMove.teacherId);
    const subject = subjectMap.get(lessonToMove.subjectId);

    // 1. HARD CONSTRAINT: O'qituvchi ish grafigi / Metod kuni
    if (teacher?.availabilities) {
      const av = teacher.availabilities.find(
        (a) => a.dayOfWeek === targetDay && a.period === targetPeriod
      );
      if (av && !av.isAvailable) {
        return {
          status: "danger",
          message: `Bu joyga qo'yib bo'lmaydi — bu ${teacher.fullName}ning metod kuni yoki band vaqti.`,
          conflicts: ["teacher_unavailable"],
        };
      }
    }

    // 2. HARD CONSTRAINT: O'qituvchi boshqa sinfda bandmi?
    const teacherClash = lessons.find(
      (l) =>
        l.id !== lessonToMove.id &&
        l.teacherId === lessonToMove.teacherId &&
        l.dayOfWeek === targetDay &&
        l.periodNumber === targetPeriod &&
        (!targetExistingLesson || l.id !== targetExistingLesson.id)
    );

    if (teacherClash) {
      const clashClass = classes.find((c) => c.id === teacherClash.classId);
      return {
        status: "danger",
        message: `Ziddiyat! ${teacher?.fullName || "O'qituvchi"} ayni shu paytda ${
          clashClass?.name || "boshqa"
        } sinfida darsda.`,
        conflicts: ["teacher_clash"],
      };
    }

    // 3. HARD CONSTRAINT: Xona bandligi
    if (lessonToMove.roomId) {
      const roomClash = lessons.find(
        (l) =>
          l.id !== lessonToMove.id &&
          l.roomId === lessonToMove.roomId &&
          l.dayOfWeek === targetDay &&
          l.periodNumber === targetPeriod &&
          (!targetExistingLesson || l.id !== targetExistingLesson.id)
      );
      if (roomClash) {
        const room = roomMap.get(lessonToMove.roomId);
        return {
          status: "danger",
          message: `${room?.name || "Xona"} ushbu vaqtda boshqa dars tomonidan band qilingan.`,
          conflicts: ["room_clash"],
        };
      }
    }

    // 4. SOFT CONSTRAINT: Kunlik darslar soni va SanPiN qiyinlik
    const classLessonsThisDay = lessons.filter(
      (l) =>
        l.classId === targetClassId &&
        l.dayOfWeek === targetDay &&
        l.id !== lessonToMove.id
    );

    const targetClass = classes.find((c) => c.id === targetClassId);
    const isPrimary = targetClass ? targetClass.grade <= 4 : false;
    const maxDayLessons = isPrimary ? 5 : 6;

    if (classLessonsThisDay.length >= maxDayLessons) {
      return {
        status: "warning",
        message: `SanPiN me'yori: ${targetClass?.name || "Sinf"} uchun ushbu kunda allaqachon ${
          classLessonsThisDay.length
        } ta dars bor. Yana dars qo'shish o'quvchilarni toliqtirishi mumkin.`,
        conflicts: ["daily_limit_exceeded"],
      };
    }

    return {
      status: "safe",
      message: "Darsni bu yerga ko'chirish mumkin (Ziddiyatsiz).",
      conflicts: [],
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const lesson = lessons.find((l) => l.id === active.id);
    if (lesson) {
      setActiveLesson(lesson);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !activeLesson) {
      setActiveValidation(null);
      return;
    }

    const overData = over.data.current as {
      classId: string;
      day: number;
      period: number;
      existingLesson?: Lesson;
    };

    if (overData) {
      const validation = validateMove(
        activeLesson,
        overData.classId,
        overData.day,
        overData.period,
        overData.existingLesson
      );
      setActiveValidation(validation);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLesson(null);
    setActiveValidation(null);

    if (!over || !active) return;

    const sourceLesson = lessons.find((l) => l.id === active.id);
    if (!sourceLesson) return;

    const overData = over.data.current as {
      classId: string;
      day: number;
      period: number;
      existingLesson?: Lesson;
    };

    if (!overData) return;

    const { classId: targetClassId, day: targetDay, period: targetPeriod, existingLesson } =
      overData;

    if (
      sourceLesson.classId === targetClassId &&
      sourceLesson.dayOfWeek === targetDay &&
      sourceLesson.periodNumber === targetPeriod
    ) {
      return;
    }

    const validation = validateMove(
      sourceLesson,
      targetClassId,
      targetDay,
      targetPeriod,
      existingLesson
    );

    if (validation.status === "danger") {
      setErrorMessage(validation.message);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    if (validation.status === "warning") {
      setWarningModal({
        isOpen: true,
        sourceLesson,
        targetClassId,
        targetDay,
        targetPeriod,
        existingLesson,
        message: validation.message,
      });
      return;
    }

    executeMove(sourceLesson, targetClassId, targetDay, targetPeriod, existingLesson);
  };

  const executeMove = (
    sourceLesson: Lesson,
    targetClassId: string,
    targetDay: number,
    targetPeriod: number,
    existingLesson?: Lesson
  ) => {
    let updated = [...lessons];

    if (existingLesson) {
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
        if (l.id === existingLesson.id) {
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

  const toggleLock = (lessonId: string) => {
    const updated = lessons.map((l) =>
      l.id === lessonId ? { ...l, isLocked: !l.isLocked } : l
    );
    onLessonsChange(updated);
  };

  // Ustun kengligi zichlikka qarab
  const colMinWidthClass =
    density === "NUMBERED"
      ? "min-w-[80px]"
      : density === "COMPACT"
      ? "min-w-[96px]"
      : "min-w-[145px]";

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="relative w-full overflow-hidden bg-background flex flex-col">
        {/* ── TOP CONTROL TOOLBAR ───────────────────────────────────────────── */}
        <div className="border-b border-border/80 bg-card/60 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Chap: Bosqich Filterlari */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Sinflar:</span>
            </span>

            {[
              { id: "ALL", label: `Barchasi (${classes.length})` },
              { id: "PRIMARY", label: `1-4 Boshlang'ich (${classes.filter((c) => c.grade <= 4).length})` },
              { id: "MIDDLE", label: `5-9 O'rta (${classes.filter((c) => c.grade >= 5 && c.grade <= 9).length})` },
              { id: "HIGH", label: `10-11 Yuqori (${classes.filter((c) => c.grade >= 10).length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStageFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  stageFilter === tab.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* O'ng: Qidiruv, Zichlik va Zoom */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Qidiruv */}
            <div className="relative w-32 sm:w-40">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Sinf qidirish..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 rounded-lg border border-border bg-background text-xs focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            {/* Ko'rinish zichligi (Density) */}
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-background">
              <button
                onClick={() => setDensity("STANDARD")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  density === "STANDARD" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Keng to'liq karta"
              >
                Keng
              </button>
              <button
                onClick={() => setDensity("COMPACT")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  density === "COMPACT" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                title="Zich (Barcha sinflar bir ekranga sig'adi)"
              >
                Zich
              </button>
              <button
                onClick={() => setDensity("NUMBERED")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                  density === "NUMBERED" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
                title="39-maktab raqamli ko'rinishi"
              >
                Raqamli
              </button>
            </div>

            {/* Horizontal Scroll Helpers */}
            <div className="flex items-center gap-1 bg-background rounded-lg border border-border p-0.5">
              <button
                onClick={() => scrollHorizontally(-360)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-muted/60 hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-all cursor-pointer"
                title="Chapdagi sinflarga scroll qilish"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Chapga</span>
              </button>
              <button
                onClick={() => scrollHorizontally(360)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-muted/60 hover:bg-primary hover:text-primary-foreground text-xs font-semibold transition-all cursor-pointer"
                title="O'ngdagi sinflarga scroll qilish"
              >
                <span className="hidden sm:inline">O'ngga</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Error Toast */}
        {errorMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-rose-500/50 bg-rose-950/90 text-rose-200 px-4 py-3 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0" />
            <p className="text-xs font-medium">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 rounded hover:bg-rose-900/50 text-rose-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Warning Modal */}
        {warningModal && warningModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-amber-500 mb-3">
                <AlertCircle className="h-6 w-6" />
                <h3 className="font-bold text-base text-foreground">Ogohlantirish (Soft Constraint)</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                {warningModal.message}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setWarningModal(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={() => {
                    executeMove(
                      warningModal.sourceLesson,
                      warningModal.targetClassId,
                      warningModal.targetDay,
                      warningModal.targetPeriod,
                      warningModal.existingLesson
                    );
                    setWarningModal(null);
                  }}
                  className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors cursor-pointer"
                >
                  Baribir joylashtirish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MASTER GRID SCROLL CONTAINER (GORIZONTAL VA VERTIKAL SCROLL) ─── */}
        <div
          ref={scrollContainerRef}
          className="w-full overflow-x-auto overflow-y-auto max-h-[calc(100vh-8.5rem)] p-3 custom-scrollbar-x select-none"
        >
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse border border-border text-left">
              {/* Sticky Table Header (Sinflar) */}
              <thead className="sticky top-0 z-30 bg-card/95 backdrop-blur-md shadow-sm">
                <tr>
                  <th className="sticky left-0 z-40 w-32 border border-border bg-card/95 p-2 text-xs font-bold text-muted-foreground uppercase tracking-wider backdrop-blur-md">
                    Kun / Soat
                  </th>
                  {filteredClasses.map((cls) => {
                    const branch = branchMap.get(cls.branchId);
                    const shift = shiftMap.get(cls.shiftId);
                    const isBranchNonMain = branch && !branch.isMain;

                    return (
                      <th
                        key={cls.id}
                        className={`${colMinWidthClass} border border-border p-2 text-center text-xs font-bold text-foreground transition-colors ${
                          isBranchNonMain ? "bg-indigo-500/5 dark:bg-indigo-950/20" : ""
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 tracking-tight">
                            {cls.name}
                          </span>
                          <div className="flex items-center gap-1 flex-wrap justify-center">
                            <span className="text-[10px] font-medium text-muted-foreground">
                              {cls.grade}-sinf
                            </span>
                            {branch && (
                              <span
                                className={`text-[8px] px-1 py-0.2 rounded font-semibold ${
                                  branch.isMain
                                    ? "bg-muted/80 text-muted-foreground"
                                    : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                                }`}
                                title={branch.name}
                              >
                                {branch.name.length > 8 ? branch.name.slice(0, 7) + ".." : branch.name}
                              </span>
                            )}
                            {shift && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium">
                                {shift.name.includes("2") ? "2-sm" : "1-sm"}
                              </span>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              {/* Table Body (Kunlar va Periodlar) */}
              <tbody>
                {DAYS.map((day) => (
                  <React.Fragment key={day.id}>
                    {/* Kun Sarlavhasi Qatori */}
                    <tr className="bg-muted/40 font-bold">
                      <td
                        colSpan={filteredClasses.length + 1}
                        className="sticky left-0 border border-border px-3 py-1 text-xs text-foreground/90 font-semibold bg-muted/70"
                      >
                        {day.name}
                      </td>
                    </tr>

                    {/* Period Qatorlari (1-7) */}
                    {PERIODS.map((period) => (
                      <tr key={`${day.id}_${period}`} className="hover:bg-muted/10">
                        {/* Sticky Chap Ustun: Period Raqami va Kirish-Chiqish Vaqtlari */}
                        <td className="sticky left-0 z-20 border border-border bg-card/95 p-1.5 text-xs font-semibold tabular-nums text-muted-foreground backdrop-blur-md">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-foreground text-xs">{period}-dars</span>
                            <span className="text-[9px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                              {period === 1
                                ? "08:00 - 08:45"
                                : period === 2
                                ? "08:50 - 09:35"
                                : period === 3
                                ? "09:45 - 10:30"
                                : period === 4
                                ? "10:50 - 11:35"
                                : period === 5
                                ? "11:45 - 12:30"
                                : period === 6
                                ? "12:35 - 13:20"
                                : "13:25 - 14:10"}
                            </span>
                          </div>
                        </td>

                        {/* Sinf Katakchalari */}
                        {filteredClasses.map((cls) => {
                          const cellLesson = lessonMap.get(`${cls.id}_${day.id}_${period}`);
                          const subject = cellLesson
                            ? subjectMap.get(cellLesson.subjectId)
                            : undefined;
                          const teacher = cellLesson
                            ? teacherMap.get(cellLesson.teacherId)
                            : undefined;
                          const teacherNum = cellLesson
                            ? teacherNumberMap.get(cellLesson.teacherId)
                            : undefined;
                          const room = cellLesson && cellLesson.roomId
                            ? roomMap.get(cellLesson.roomId)
                            : null;

                          const isPrimaryWeekend = day.id === 6 && (cls.isPrimary || cls.grade <= 4);

                          return (
                            <td
                              key={`${cls.id}_${day.id}_${period}`}
                              className="border border-border p-1"
                            >
                              <GridCell
                                classId={cls.id}
                                day={day.id}
                                period={period}
                                density={density}
                                isPrimaryWeekend={isPrimaryWeekend}
                                lesson={cellLesson}
                                subject={subject}
                                teacher={teacher}
                                teacherNumber={teacherNum}
                                room={room}
                                activeValidation={activeValidation}
                                isOver={false}
                                onToggleLock={toggleLock}
                                onOpenZamena={onOpenZamena}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeLesson ? (
            <div className="w-36 opacity-90 rotate-2 shadow-2xl scale-105">
              <LessonCard
                lesson={activeLesson}
                subject={subjectMap.get(activeLesson.subjectId)}
                teacher={teacherMap.get(activeLesson.teacherId)}
                teacherNumber={teacherNumberMap.get(activeLesson.teacherId)}
                room={activeLesson.roomId ? roomMap.get(activeLesson.roomId) : null}
                density={density}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
