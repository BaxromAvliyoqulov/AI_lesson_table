"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Lock, Unlock, UserCheck, MapPin } from "lucide-react";
import { Lesson, Subject, Teacher, Room } from "@/types";

interface LessonCardProps {
  lesson: Lesson;
  subject?: Subject;
  teacher?: Teacher;
  room?: Room | null;
  onToggleLock?: (lessonId: string) => void;
  onOpenZamena?: (lesson: Lesson) => void;
  isDragging?: boolean;
}

export const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  subject,
  teacher,
  room,
  onToggleLock,
  onOpenZamena,
  isDragging = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: lesson.id,
    disabled: lesson.isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderLeftColor: subject?.colorTag || "#3B82F6",
  };

  const activeDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative flex flex-col justify-between rounded-md border border-border/80 border-l-[4px] bg-card p-2 text-xs shadow-sm select-none transition-all duration-200 ${
        activeDragging
          ? "opacity-40 ring-2 ring-blue-500 scale-95 z-50 cursor-grabbing shadow-lg"
          : lesson.isLocked
          ? "bg-muted/40 cursor-default opacity-90"
          : "hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md cursor-grab"
      }`}
    >
      {/* Top row: Fan nomi va Actions */}
      <div className="flex items-start justify-between gap-1">
        <span
          className="font-bold truncate text-[11px] leading-tight"
          title={subject?.name || "Fan"}
        >
          {subject?.shortName || subject?.name || "Fan"}
        </span>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Zamena tugmasi */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenZamena?.(lesson);
            }}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-blue-600 transition-colors"
            title="O'rinbosar (Zamena) tayinlash"
          >
            <UserCheck className="h-3 w-3" />
          </button>

          {/* Lock / Unlock */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleLock?.(lesson.id);
            }}
            className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title={lesson.isLocked ? "Qulfni ochish" : "Qulflash (joyida saqlash)"}
          >
            {lesson.isLocked ? (
              <Lock className="h-3 w-3 text-indigo-600" />
            ) : (
              <Unlock className="h-3 w-3 text-muted-foreground/60" />
            )}
          </button>
        </div>
      </div>

      {/* Middle row: O'qituvchi ismi */}
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="truncate font-medium" title={teacher?.fullName || "O'qituvchi"}>
          {teacher?.fullName
            ? teacher.fullName.split(" ").slice(0, 2).join(" ")
            : "O'qituvchi"}
        </span>
      </div>

      {/* Bottom row: Xona va Qulflanganlik belgisi */}
      {(room || lesson.isLocked) && (
        <div className="mt-1 flex items-center justify-between text-[9px] text-muted-foreground/80 border-t border-border/40 pt-0.5">
          {room ? (
            <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-medium truncate">
              <MapPin className="h-2.5 w-2.5" />
              {room.name}
            </span>
          ) : (
            <span />
          )}

          {lesson.isLocked && (
            <span className="flex items-center gap-0.5 text-indigo-600 dark:text-indigo-400 font-semibold">
              <Lock className="h-2 w-2" />
              Qulflangan
            </span>
          )}
        </div>
      )}
    </div>
  );
};
