import { useState, useMemo } from "react";
import { SchoolClass, Subject, Teacher, Room, Lesson, Shift, Branch } from "@/types";
import { isClassSecondShift } from "@/lib/utils";
import { exportTeacherScheduleToPDF } from "@/lib/export/teacher-pdf-exporter";
import { DAYS } from "./types";

export function useTeacherScheduleLogic({
  classes,
  subjects,
  teachers,
  rooms,
  lessons,
  shifts = [],
  branches = [],
}: {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  shifts?: Shift[];
  branches?: Branch[];
}) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || "");
  const [shiftFilter, setShiftFilter] = useState<"ALL" | "SHIFT_1" | "SHIFT_2">("ALL");
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");

  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.fullName.localeCompare(b.fullName, "uz"));
  }, [teachers]);

  const filteredTeachers = useMemo(() => {
    return sortedTeachers.filter((t) => {
      const matchSubject =
        selectedSubjectId === "ALL" || (t.subjectIds || []).includes(selectedSubjectId);
      const matchSearch =
        !teacherSearch.trim() ||
        t.fullName.toLowerCase().includes(teacherSearch.toLowerCase().trim());
      return matchSubject && matchSearch;
    });
  }, [sortedTeachers, selectedSubjectId, teacherSearch]);

  const activeTeacher = useMemo(() => {
    const found = filteredTeachers.find((t) => t.id === selectedTeacherId);
    return found || filteredTeachers[0] || teachers[0];
  }, [filteredTeachers, selectedTeacherId, teachers]);

  const currentTeacherIndex = useMemo(() => {
    return filteredTeachers.findIndex((t) => t.id === activeTeacher?.id);
  }, [filteredTeachers, activeTeacher]);

  const handlePrevTeacher = () => {
    if (currentTeacherIndex > 0) {
      setSelectedTeacherId(filteredTeachers[currentTeacherIndex - 1].id);
    }
  };

  const handleNextTeacher = () => {
    if (currentTeacherIndex < filteredTeachers.length - 1) {
      setSelectedTeacherId(filteredTeachers[currentTeacherIndex + 1].id);
    }
  };

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);

  const teacherLessons = useMemo(() => {
    if (!activeTeacher) return [];
    return lessons.filter((l) => l.teacherId === activeTeacher.id);
  }, [lessons, activeTeacher]);

  const shiftLessons = useMemo(() => {
    const shift1List: Lesson[] = [];
    const shift2List: Lesson[] = [];

    teacherLessons.forEach((l) => {
      const cls = classMap.get(l.classId);
      const isShift2 = isClassSecondShift(cls, shifts);
      if (isShift2) {
        shift2List.push(l);
      } else {
        shift1List.push(l);
      }
    });

    return { shift1: shift1List, shift2: shift2List };
  }, [teacherLessons, classMap, shifts]);

  const cellLessonMap = useMemo(() => {
    const map = new Map<string, Lesson[]>();

    teacherLessons.forEach((l) => {
      const cls = classMap.get(l.classId);
      const shiftNum = isClassSecondShift(cls, shifts) ? 2 : 1;
      const key = `${l.dayOfWeek}_${shiftNum}_${l.periodNumber}`;
      const existing = map.get(key) || [];
      existing.push(l);
      map.set(key, existing);
    });

    return map;
  }, [teacherLessons, classMap, shifts]);

  const dailyStats = useMemo(() => {
    const stats = new Map<
      number,
      { total: number; shift1: number; shift2: number; gaps: number }
    >();

    DAYS.forEach((d) => {
      stats.set(d.id, { total: 0, shift1: 0, shift2: 0, gaps: 0 });
    });

    teacherLessons.forEach((l) => {
      const dayData = stats.get(l.dayOfWeek);
      if (!dayData) return;

      const cls = classMap.get(l.classId);
      const isShift2 = isClassSecondShift(cls, shifts);

      dayData.total += 1;
      if (isShift2) {
        dayData.shift2 += 1;
      } else {
        dayData.shift1 += 1;
      }
    });

    DAYS.forEach((d) => {
      const dayData = stats.get(d.id);
      if (!dayData) return;

      let dayGaps = 0;

      const p1List: number[] = [];
      for (let p = 1; p <= 6; p++) {
        if ((cellLessonMap.get(`${d.id}_1_${p}`) || []).length > 0) {
          p1List.push(p);
        }
      }
      if (p1List.length >= 2) {
        const minP = Math.min(...p1List);
        const maxP = Math.max(...p1List);
        for (let p = minP; p <= maxP; p++) {
          if (!p1List.includes(p)) dayGaps++;
        }
      }

      const p2List: number[] = [];
      for (let p = 1; p <= 6; p++) {
        if ((cellLessonMap.get(`${d.id}_2_${p}`) || []).length > 0) {
          p2List.push(p);
        }
      }
      if (p2List.length >= 2) {
        const minP = Math.min(...p2List);
        const maxP = Math.max(...p2List);
        for (let p = minP; p <= maxP; p++) {
          if (!p2List.includes(p)) dayGaps++;
        }
      }

      dayData.gaps = dayGaps;
    });

    return stats;
  }, [teacherLessons, classMap, shifts, cellLessonMap]);

  const totalGapsCount = useMemo(() => {
    let sum = 0;
    dailyStats.forEach((st) => {
      sum += st.gaps;
    });
    return sum;
  }, [dailyStats]);

  const taughtClasses = useMemo(() => {
    const classIdSet = new Set(teacherLessons.map((l) => l.classId));
    return Array.from(classIdSet)
      .map((id) => classMap.get(id))
      .filter((c): c is SchoolClass => !!c)
      .sort((a, b) => a.name.localeCompare(b.name, "uz", { numeric: true }));
  }, [teacherLessons, classMap]);

  const subjectHoursBreakdown = useMemo(() => {
    const map = new Map<string, { subject: Subject; hours: number }>();
    teacherLessons.forEach((l) => {
      const subj = subjectMap.get(l.subjectId);
      if (!subj) return;
      const current = map.get(subj.id) || { subject: subj, hours: 0 };
      current.hours += 1;
      map.set(subj.id, current);
    });
    return Array.from(map.values()).sort((a, b) => b.hours - a.hours);
  }, [teacherLessons, subjectMap]);

  const usedRooms = useMemo(() => {
    const roomIdSet = new Set(
      teacherLessons.map((l) => l.roomId).filter((id): id is string => !!id)
    );
    return Array.from(roomIdSet)
      .map((id) => roomMap.get(id))
      .filter((r): r is Room => !!r);
  }, [teacherLessons, roomMap]);

  const capacity = Number(activeTeacher?.weeklyHourCapacity) || 20;
  const scheduledCount = teacherLessons.length;
  const shift1Count = shiftLessons.shift1.length;
  const shift2Count = shiftLessons.shift2.length;
  const loadPercentage = capacity > 0 ? Math.round((scheduledCount / capacity) * 100) : 100;
  const isOptimal = loadPercentage >= 85 && loadPercentage <= 100;
  const isOverloaded = scheduledCount > capacity;
  const isUnderloaded = scheduledCount < capacity;

  const { homeroomHours, subjectHours } = useMemo(() => {
    let homeroomCount = 0;
    let subjectCount = 0;

    teacherLessons.forEach((l) => {
      const subj = subjectMap.get(l.subjectId);
      const isHomeroom =
        subj?.name?.toLowerCase().includes("kelajak") ||
        subj?.name?.toLowerCase().includes("sinf soati");

      if (isHomeroom) {
        homeroomCount += 1;
      } else {
        subjectCount += 1;
      }
    });

    return { homeroomHours: homeroomCount, subjectHours: subjectCount };
  }, [teacherLessons, subjectMap]);

  const homeroomClass = useMemo(() => {
    if (!activeTeacher) return null;
    return classes.find(
      (c) => c.homeroomTeacherId === activeTeacher.id || activeTeacher.homeroomClassId === c.id
    );
  }, [classes, activeTeacher]);

  const activeMethodDayName = useMemo(() => {
    if (!activeTeacher?.methodDayOfWeek) return null;
    return DAYS.find((d) => d.id === activeTeacher.methodDayOfWeek)?.name || null;
  }, [activeTeacher]);

  const methodDayViolations = useMemo(() => {
    if (!activeTeacher?.methodDayOfWeek) return 0;
    return teacherLessons.filter((l) => l.dayOfWeek === activeTeacher.methodDayOfWeek).length;
  }, [teacherLessons, activeTeacher]);

  const handleCopyScheduleToClipboard = () => {
    if (!activeTeacher) return;

    let text = `📋 ${activeTeacher.fullName} — DARS JADVALI\n`;
    const totalHoursStr =
      homeroomHours > 0
        ? `${subjectHours}+${homeroomHours} soat (${scheduledCount} st, Kelajak soati bilan)`
        : `${scheduledCount} soat`;
    text += `🏢 Maktab: 39-maktab | Jami yuklama: ${totalHoursStr} (${capacity} st me'yor)\n`;
    text += `☀️ 1-Smena: ${shift1Count} st | 🌤️ 2-Smena: ${shift2Count} st\n`;
    if (activeMethodDayName) text += `📌 Metod kuni: ${activeMethodDayName}\n`;
    if (homeroomClass) text += `🎖️ Sinf rahbari: ${homeroomClass.name}\n`;
    text += `------------------------------------\n\n`;

    DAYS.forEach((day) => {
      const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
      const dayStats = dailyStats.get(day.id);
      text += `📅 ${day.name.toUpperCase()} (${dayStats?.total || 0} soat)${
        isMethodDay ? " [★ Metod kuni]" : ""
      }:\n`;

      let hasShift1 = false;
      for (let p = 1; p <= 6; p++) {
        const lessonsInCell = cellLessonMap.get(`${day.id}_1_${p}`) || [];
        lessonsInCell.forEach((l) => {
          hasShift1 = true;
          const subj = subjectMap.get(l.subjectId)?.name || "Fan";
          const cls = classMap.get(l.classId)?.name || "";
          const room = l.roomId ? ` (${roomMap.get(l.roomId)?.name || ""})` : "";
          text += `  ☀️ ${p}-dars (08:00-08:45): ${subj} — ${cls}${room}\n`;
        });
      }

      let hasShift2 = false;
      for (let p = 1; p <= 6; p++) {
        const lessonsInCell = cellLessonMap.get(`${day.id}_2_${p}`) || [];
        lessonsInCell.forEach((l) => {
          hasShift2 = true;
          const subj = subjectMap.get(l.subjectId)?.name || "Fan";
          const cls = classMap.get(l.classId)?.name || "";
          const room = l.roomId ? ` (${roomMap.get(l.roomId)?.name || ""})` : "";
          text += `  🌤️ ${p}-dars (13:00-13:45): ${subj} — ${cls}${room}\n`;
        });
      }

      if (!hasShift1 && !hasShift2) {
        text += isMethodDay ? `  ✨ Metodik kun (Dars yo'q)\n` : `  — Dars belgilanmagan\n`;
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleExportPDF = async () => {
    if (!activeTeacher) return;
    setIsExportingPdf(true);
    try {
      await exportTeacherScheduleToPDF({
        teacher: activeTeacher,
        lessons,
        classes,
        subjects,
        rooms,
        shifts,
        schoolName: "39-UMUMIY O'RTA TA'LIM MAKTABI",
        academicYear: "2025 - 2026",
      });
    } catch (err) {
      console.error("PDF export error:", err);
      window.print();
    } finally {
      setIsExportingPdf(false);
    }
  };

  return {
    selectedSubjectId,
    setSelectedSubjectId,
    selectedTeacherId,
    setSelectedTeacherId,
    shiftFilter,
    setShiftFilter,
    isCopied,
    isExportingPdf,
    teacherSearch,
    setTeacherSearch,
    sortedTeachers,
    filteredTeachers,
    activeTeacher,
    currentTeacherIndex,
    handlePrevTeacher,
    handleNextTeacher,
    subjectMap,
    classMap,
    roomMap,
    branchMap,
    teacherLessons,
    shiftLessons,
    cellLessonMap,
    dailyStats,
    totalGapsCount,
    taughtClasses,
    subjectHoursBreakdown,
    usedRooms,
    capacity,
    scheduledCount,
    shift1Count,
    shift2Count,
    loadPercentage,
    isOptimal,
    isOverloaded,
    isUnderloaded,
    homeroomHours,
    subjectHours,
    homeroomClass,
    activeMethodDayName,
    methodDayViolations,
    handleCopyScheduleToClipboard,
    handleExportPDF,
  };
}
