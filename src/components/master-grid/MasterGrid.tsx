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
  DragValidationResult,
} from "@/types";
import { LessonCard } from "./LessonCard";
import { AlertCircle, CheckCircle2, ShieldAlert, X } from "lucide-react";

interface MasterGridProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
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
  lesson?: Lesson;
  subject?: Subject;
  teacher?: Teacher;
  room?: Room | null;
  activeValidation?: DragValidationResult | null;
  isOver: boolean;
  onToggleLock: (lessonId: string) => void;
  onOpenZamena: (lesson: Lesson) => void;
}> = ({
  classId,
  day,
  period,
  lesson,
  subject,
  teacher,
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
  });

  // Cell status rangini aniqlash
  let statusBg = "bg-card/60 hover:bg-muted/30";
  let statusBorder = "border-border/60";

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

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[72px] rounded-lg border p-1 transition-all duration-150 flex flex-col justify-center ${statusBg} ${statusBorder}`}
    >
      {lesson ? (
        <LessonCard
          lesson={lesson}
          subject={subject}
          teacher={teacher}
          room={room}
          onToggleLock={onToggleLock}
          onOpenZamena={onOpenZamena}
        />
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
  onLessonsChange,
  onOpenZamena,
  zoomLevel,
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

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);

  // Filial bo'yicha sinflarni filtrlash
  const filteredClasses = useMemo(() => {
    if (selectedBranch === "ALL") return classes;
    return classes.filter((c) => c.branchId === selectedBranch);
  }, [classes, selectedBranch]);

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
        message: `Bu joyga qo'yib bo'lmaydi — ${teacher?.fullName || "O'qituvchi"} shu vaqtda ${
          clashClass?.name || "boshqa sinf"
        }da darsda band.`,
        conflicts: ["teacher_busy"],
      };
    }

    // 3. SWAP holati: Agar katakda boshqa dars bo'lsa
    if (targetExistingLesson && targetExistingLesson.id !== lessonToMove.id) {
      if (targetExistingLesson.isLocked) {
        return {
          status: "danger",
          message: "Bu dars qulflangan, o'rnini almashtirib bo'lmaydi.",
          conflicts: ["lesson_locked"],
        };
      }

      // Mavjud darsni manba katakka ko'chirganda ziddiyat bormi tekshirish
      const existingTeacher = teacherMap.get(targetExistingLesson.teacherId);
      const swapClash = lessons.find(
        (l) =>
          l.id !== targetExistingLesson.id &&
          l.id !== lessonToMove.id &&
          l.teacherId === targetExistingLesson.teacherId &&
          l.dayOfWeek === lessonToMove.dayOfWeek &&
          l.periodNumber === lessonToMove.periodNumber
      );

      if (swapClash) {
        return {
          status: "danger",
          message: `O'rin almashtirib bo'lmaydi — ${existingTeacher?.fullName || "O'qituvchi"} manba soatda band bo'ladi.`,
          conflicts: ["swap_clash"],
        };
      }
    }

    // 4. SOFT CONSTRAINT: SanPiN yuklama va takrorlanish
    if (subject && subject.difficultyScore >= 9 && targetPeriod >= 6) {
      return {
        status: "warning",
        message: `Diqqat: ${subject.name} og'ir fan hisoblanadi (SanPiN). Oxirgi ${targetPeriod}-soatga qo'yish o'quvchilarni toliqtirishi mumkin. Baribir joylashtirilsinmi?`,
        conflicts: ["sanpin_heavy_late"],
      };
    }

    return {
      status: "safe",
      message: "To'liq xavfsiz — ziddiyat yo'q.",
      conflicts: [],
    };
  };

  const handleDragStart = (event: DragStartEvent) => {
    const lesson = lessons.find((l) => l.id === event.active.id);
    if (lesson) {
      setActiveLesson(lesson);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || !active) {
      setActiveValidation(null);
      return;
    }

    const lessonToMove = lessons.find((l) => l.id === active.id);
    if (!lessonToMove) return;

    const overData = over.data.current as {
      classId: string;
      day: number;
      period: number;
      existingLesson?: Lesson;
    };

    if (overData) {
      const validation = validateMove(
        lessonToMove,
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

    if (!over) return;

    const lessonToMove = lessons.find((l) => l.id === active.id);
    if (!lessonToMove) return;

    const overData = over.data.current as {
      classId: string;
      day: number;
      period: number;
      existingLesson?: Lesson;
    };

    if (!overData) return;

    // O'z joyiga qaytarilsa
    if (
      lessonToMove.classId === overData.classId &&
      lessonToMove.dayOfWeek === overData.day &&
      lessonToMove.periodNumber === overData.period
    ) {
      return;
    }

    const validation = validateMove(
      lessonToMove,
      overData.classId,
      overData.day,
      overData.period,
      overData.existingLesson
    );

    // Qizil holat — rad etish
    if (validation.status === "danger") {
      setErrorMessage(validation.message);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    // Sariq holat — Tasdiqlash modali
    if (validation.status === "warning") {
      setWarningModal({
        isOpen: true,
        sourceLesson: lessonToMove,
        targetClassId: overData.classId,
        targetDay: overData.day,
        targetPeriod: overData.period,
        existingLesson: overData.existingLesson,
        message: validation.message,
      });
      return;
    }

    // Yashil holat — Darhol ko'chirish yoki Swap
    executeMove(
      lessonToMove,
      overData.classId,
      overData.day,
      overData.period,
      overData.existingLesson
    );
  };

  const executeMove = (
    sourceLesson: Lesson,
    targetClassId: string,
    targetDay: number,
    targetPeriod: number,
    existingLesson?: Lesson
  ) => {
    let updated = [...lessons];

    if (existingLesson && existingLesson.id !== sourceLesson.id) {
      // SWAP (O'rin almashtirish)
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
      // Oddiy bo'sh katakka ko'chirish
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

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="relative w-full overflow-hidden bg-background">
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

        {/* Warning Modal (Sariq holat tasdiqlash) */}
        {warningModal && warningModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
              <div className="flex items-center gap-3 text-amber-500 mb-3">
                <AlertCircle className="h-6 w-6" />
                <h3 className="font-bold text-base text-foreground">
                  Ogohlantirish (Soft Constraint)
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                {warningModal.message}
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setWarningModal(null)}
                  className="rounded-lg border border-border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
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
                  className="rounded-lg bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-semibold shadow-md transition-colors"
                >
                  Baribir joylashtirish
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Master Grid Scroll Container */}
        <div
          className="w-full overflow-auto max-h-[calc(100vh-4rem)] p-4 transition-transform origin-top-left"
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full border-collapse border border-border text-left">
              {/* Sticky Table Header (Sinflar) */}
              <thead className="sticky top-0 z-30 bg-card/95 backdrop-blur-md shadow-sm">
                <tr>
                  <th className="sticky left-0 z-40 w-36 border border-border bg-card/95 p-3 text-xs font-bold text-muted-foreground uppercase tracking-wider backdrop-blur-md">
                    Kun / Soat
                  </th>
                  {filteredClasses.map((cls) => (
                    <th
                      key={cls.id}
                      className="min-w-[140px] border border-border p-3 text-center text-xs font-bold text-foreground"
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                          {cls.name}
                        </span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          {cls.grade}-sinf
                        </span>
                      </div>
                    </th>
                  ))}
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
                        className="border border-border px-3 py-1.5 text-xs text-foreground/90 font-semibold bg-muted/60"
                      >
                        {day.name}
                      </td>
                    </tr>

                    {/* Period Qatorlari (1-7) */}
                    {PERIODS.map((period) => (
                      <tr key={`${day.id}_${period}`} className="hover:bg-muted/10">
                        {/* Sticky Chap Ustun: Period Raqami */}
                        <td className="sticky left-0 z-20 border border-border bg-card/95 p-2 text-xs font-semibold tabular-nums text-muted-foreground backdrop-blur-md">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-foreground">{period}-dars</span>
                            <span className="text-[10px] text-muted-foreground/70">
                              {period === 1
                                ? "08:00"
                                : period === 2
                                ? "08:50"
                                : period === 3
                                ? "09:40"
                                : period === 4
                                ? "10:35"
                                : period === 5
                                ? "11:25"
                                : period === 6
                                ? "12:15"
                                : "13:05"}
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
                          const room = cellLesson?.roomId
                            ? roomMap.get(cellLesson.roomId)
                            : null;

                          return (
                            <td
                              key={`${cls.id}_${day.id}_${period}`}
                              className="border border-border p-1 align-top"
                            >
                              <GridCell
                                classId={cls.id}
                                day={day.id}
                                period={period}
                                lesson={cellLesson}
                                subject={subject}
                                teacher={teacher}
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

        {/* Drag Overlay (Ko'chirilayotgan dars nusxasi) */}
        <DragOverlay>
          {activeLesson ? (
            <div className="w-[140px] opacity-90 shadow-2xl scale-105">
              <LessonCard
                lesson={activeLesson}
                subject={subjectMap.get(activeLesson.subjectId)}
                teacher={teacherMap.get(activeLesson.teacherId)}
                room={activeLesson.roomId ? roomMap.get(activeLesson.roomId) : null}
                isDragging
              />
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};
