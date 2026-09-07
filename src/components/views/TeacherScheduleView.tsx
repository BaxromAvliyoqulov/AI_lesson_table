"use client";

import React, { useState, useMemo } from "react";
import { SchoolClass, Subject, Teacher, Room, Lesson, Shift, Branch } from "@/types";
import { isClassSecondShift } from "@/lib/utils";
import {
  Users,
  MapPin,
  Clock,
  BookOpen,
  Activity,
  GraduationCap,
  Sparkles,
  Sun,
  Moon,
  Coffee,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Printer,
  ShieldCheck,
  Layers,
  ArrowUpRight,
  School,
  Building,
  FileDown,
  Loader2,
} from "lucide-react";
import { exportTeacherScheduleToPDF } from "@/lib/export/teacher-pdf-exporter";

interface TeacherScheduleViewProps {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  shifts?: Shift[];
  branches?: Branch[];
  onOpenZamena?: (lesson: Lesson) => void;
  onSelectClass?: (classId: string) => void;
}

const DAYS = [
  { id: 1, name: "Dushanba", shortName: "Dush" },
  { id: 2, name: "Seshanba", shortName: "Sesh" },
  { id: 3, name: "Chorshanba", shortName: "Chor" },
  { id: 4, name: "Payshanba", shortName: "Pay" },
  { id: 5, name: "Juma", shortName: "Jum" },
  { id: 6, name: "Shanba", shortName: "Shan" },
];

// Standart 1-smena (Ertalabki / Abetgacha) qo'ng'iroqlar jadvali
const DEFAULT_SHIFT_1_PERIODS = [
  { period: 1, time: "08:00 - 08:45", start: "08:00", end: "08:45" },
  { period: 2, time: "08:50 - 09:35", start: "08:50", end: "09:35" },
  { period: 3, time: "09:40 - 10:25", start: "09:40", end: "10:25" },
  { period: 4, time: "10:35 - 11:20", start: "10:35", end: "11:20" },
  { period: 5, time: "11:25 - 12:10", start: "11:25", end: "12:10" },
  { period: 6, time: "12:15 - 13:00", start: "12:15", end: "13:00" },
];

// Standart 2-smena (Tushdan keyin / Abetdan keyin) qo'ng'iroqlar jadvali
const DEFAULT_SHIFT_2_PERIODS = [
  { period: 1, time: "13:00 - 13:45", start: "13:00", end: "13:45" },
  { period: 2, time: "13:50 - 14:35", start: "13:50", end: "14:35" },
  { period: 3, time: "14:40 - 15:25", start: "14:40", end: "15:25" },
  { period: 4, time: "15:35 - 16:20", start: "15:35", end: "16:20" },
  { period: 5, time: "16:25 - 17:10", start: "16:25", end: "17:10" },
  { period: 6, time: "17:15 - 18:00", start: "17:15", end: "18:00" },
];

export const TeacherScheduleView: React.FC<TeacherScheduleViewProps> = ({
  classes,
  subjects,
  teachers,
  rooms,
  lessons,
  shifts = [],
  branches = [],
  onOpenZamena,
  onSelectClass,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || "");
  const [shiftFilter, setShiftFilter] = useState<"ALL" | "SHIFT_1" | "SHIFT_2">("ALL");
  const [isCopied, setIsCopied] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");

  // Alifbo bo'yicha saralangan barcha o'qituvchilar
  const sortedTeachers = useMemo(() => {
    return [...teachers].sort((a, b) => a.fullName.localeCompare(b.fullName, "uz"));
  }, [teachers]);

  // Fan va qidiruv bo'yicha filtr
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

  // Faol o'qituvchi
  const activeTeacher = useMemo(() => {
    const found = filteredTeachers.find((t) => t.id === selectedTeacherId);
    return found || filteredTeachers[0] || teachers[0];
  }, [filteredTeachers, selectedTeacherId, teachers]);

  // Keyingi va oldingi o'qituvchi navigatsiyasi
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

  // Maplar
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const roomMap = useMemo(() => new Map(rooms.map((r) => [r.id, r])), [rooms]);
  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);

  // Faol o'qituvchining barcha darslari
  const teacherLessons = useMemo(() => {
    if (!activeTeacher) return [];
    return lessons.filter((l) => l.teacherId === activeTeacher.id);
  }, [lessons, activeTeacher]);

  // Har bir dars uchun smena aniqlash (1 = Ertalabki/Abetgacha, 2 = Tushdan keyin/Abetdan keyin)
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

  // Katakcha darslari lookup: `${day}_${shift}_${period}` => Lesson[]
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

  // Kunlik va smenali darslar hisob-kitobi
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

    // Darchalar (Oynalar / Window gaps) hisoblash har bir smena ichida
    DAYS.forEach((d) => {
      const dayData = stats.get(d.id);
      if (!dayData) return;

      let dayGaps = 0;

      // 1-smena darchalari
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

      // 2-smena darchalari
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

  // Jami darchalar
  const totalGapsCount = useMemo(() => {
    let sum = 0;
    dailyStats.forEach((st) => {
      sum += st.gaps;
    });
    return sum;
  }, [dailyStats]);

  // O'qitilayotgan sinflar
  const taughtClasses = useMemo(() => {
    const classIdSet = new Set(teacherLessons.map((l) => l.classId));
    return Array.from(classIdSet)
      .map((id) => classMap.get(id))
      .filter((c): c is SchoolClass => !!c)
      .sort((a, b) => a.name.localeCompare(b.name, "uz", { numeric: true }));
  }, [teacherLessons, classMap]);

  // O'qitilayotgan fanlar va ularning soatlari
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

  // Xonalar ro'yxati
  const usedRooms = useMemo(() => {
    const roomIdSet = new Set(
      teacherLessons.map((l) => l.roomId).filter((id): id is string => !!id)
    );
    return Array.from(roomIdSet)
      .map((id) => roomMap.get(id))
      .filter((r): r is Room => !!r);
  }, [teacherLessons, roomMap]);

  // O'qituvchi yuklamasi ko'rsatkichlari
  const capacity = Number(activeTeacher?.weeklyHourCapacity) || 20;
  const scheduledCount = teacherLessons.length;
  const shift1Count = shiftLessons.shift1.length;
  const shift2Count = shiftLessons.shift2.length;
  const loadPercentage = capacity > 0 ? Math.round((scheduledCount / capacity) * 100) : 100;
  const isOptimal = loadPercentage >= 85 && loadPercentage <= 100;
  const isOverloaded = scheduledCount > capacity;
  const isUnderloaded = scheduledCount < capacity;

  // Kelajak (Sinf) soati va mutaxassislik fanlarini alohida ajratish
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

  // Sinf rahbarligi
  const homeroomClass = useMemo(() => {
    if (!activeTeacher) return null;
    return classes.find(
      (c) => c.homeroomTeacherId === activeTeacher.id || activeTeacher.homeroomClassId === c.id
    );
  }, [classes, activeTeacher]);

  // Rasmiy metod kuni
  const activeMethodDayName = useMemo(() => {
    if (!activeTeacher?.methodDayOfWeek) return null;
    return DAYS.find((d) => d.id === activeTeacher.methodDayOfWeek)?.name || null;
  }, [activeTeacher]);

  // Metod kuniga dars tushib qolganlik xavfi
  const methodDayViolations = useMemo(() => {
    if (!activeTeacher?.methodDayOfWeek) return 0;
    return teacherLessons.filter((l) => l.dayOfWeek === activeTeacher.methodDayOfWeek).length;
  }, [teacherLessons, activeTeacher]);

  // Jadvalni Telegram yoki Clipboardga chiroyli nusxalash
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

      // 1-smena
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

      // 2-smena
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

  if (!activeTeacher) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center">
        <Users className="h-16 w-16 text-muted-foreground/30 mb-3 animate-pulse" />
        <p className="text-base font-bold text-muted-foreground">
          O&apos;qituvchilar bazasi bo&apos;sh yoki filtr bo&apos;yicha hech kim topilmadi.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-5 p-4 sm:p-6 max-w-[1920px] w-full mx-auto print:p-0 print:space-y-2">
      {/* ── TOP ACTION & SELECTOR BAR ─────────────────────────────────────── */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-card border border-border/80 shadow-xs print:hidden">
        {/* Left: Avatar, Teacher Switcher & Navigation */}
        <div className="flex items-center gap-3.5 flex-1 min-w-0">
          <div className="relative">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-primary/20 to-purple-500/20 text-primary border border-primary/20 flex items-center justify-center font-black text-xl shadow-inner shrink-0">
              {activeTeacher.fullName.charAt(0)}
            </div>
            {homeroomClass && (
              <span
                className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-black shadow-xs ring-2 ring-background"
                title={`Sinf rahbari: ${homeroomClass.name}`}
              >
                ★
              </span>
            )}
          </div>

          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                O&apos;qituvchi Dars Portali
              </span>
              {homeroomClass && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-300">
                  <GraduationCap className="w-3 h-3" />
                  <span>{homeroomClass.name} rahbari</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-base sm:text-lg font-black text-foreground truncate tracking-tight">
                {activeTeacher.fullName}
              </h2>
              {/* Prev / Next buttons */}
              <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-0.5 border border-border/60 shrink-0">
                <button
                  onClick={handlePrevTeacher}
                  disabled={currentTeacherIndex <= 0}
                  className="p-1 rounded-lg hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent text-foreground cursor-pointer transition-colors"
                  title="Oldingi o'qituvchi"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-bold px-1 text-muted-foreground">
                  {currentTeacherIndex + 1}/{filteredTeachers.length}
                </span>
                <button
                  onClick={handleNextTeacher}
                  disabled={currentTeacherIndex >= filteredTeachers.length - 1}
                  className="p-1 rounded-lg hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent text-foreground cursor-pointer transition-colors"
                  title="Keyingi o'qituvchi"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mutaxassislik fanlari chipi */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1">
              {subjectHoursBreakdown.map(({ subject, hours }) => (
                <span
                  key={subject.id}
                  className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded-lg border shadow-2xs"
                  style={{
                    backgroundColor: `${subject.colorTag}15`,
                    borderColor: `${subject.colorTag}40`,
                    color: subject.colorTag,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: subject.colorTag }}
                  />
                  <span>{subject.name}</span>
                  <span className="text-[9px] opacity-75 font-semibold">({hours} st)</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Center/Right: Dropdowns & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Fan filtri */}
          <div className="w-40 sm:w-44">
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer truncate shadow-xs"
            >
              <option value="ALL">🌟 Barcha Fanlar ({subjects.length})</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* O'qituvchi tanlash */}
          <div className="w-56 sm:w-64">
            <select
              value={activeTeacher.id}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary focus:outline-none cursor-pointer truncate shadow-xs"
            >
              {filteredTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons: Copy to Telegram & Print */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyScheduleToClipboard}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground shadow-xs cursor-pointer transition-all active:scale-95"
              title="O'qituvchiga yuborish uchun dars jadvalini nusxalash"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Nusxalandi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Nusxalash</span>
                </>
              )}
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground shadow-xs cursor-pointer transition-all active:scale-95"
              title="O'qituvchi dars jadvalini chop etish"
            >
              <Printer className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              <span>Chop etish</span>
            </button>

            <button
              onClick={handleExportPDF}
              disabled={isExportingPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 disabled:opacity-60"
              title="O'qituvchiga yuborish uchun dars jadvalini rasmiy A4 PDF formatida yuklab olish"
            >
              {isExportingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>PDF tayyorlanmoqda...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5 text-white" />
                  <span>PDF</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── PRINT HEADER (Faqat printerda chiqadigan rasmiy sarlavha) ───────── */}
      <div className="hidden print:block border-b-2 border-black pb-2 text-center">
        <h1 className="text-base font-black uppercase">
          39-UMUMIY O&apos;RTA TA&apos;LIM MAKTABI O&apos;QITUVCHISI DARS JADVALI
        </h1>
        <div className="text-sm font-bold mt-1">
          {activeTeacher.fullName} &bull;{" "}
          {homeroomHours > 0 ? `${subjectHours} + ${homeroomHours}` : scheduledCount} soat{" "}
          {homeroomHours > 0 ? `(${scheduledCount} st) ` : ""}
          ({activeMethodDayName ? `Metod kuni: ${activeMethodDayName}` : ""})
        </div>
      </div>

      {/* ── EXECUTIVE KPI METRICS DASHBOARD (JAMI VA STATUSLAR) ───────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 print:hidden">
        {/* Card 1: JAMI HAFTALIK YUKLAMA */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-primary" />
              <span>Jami Yuklama</span>
            </span>
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                isOverloaded
                  ? "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                  : isOptimal
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
              }`}
            >
              {isOverloaded ? `+${scheduledCount - capacity} st ortiq` : isOptimal ? "Normada" : "Kam"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            {homeroomHours > 0 ? (
              <div className="flex items-baseline gap-1 flex-wrap">
                <span className="text-2xl font-black text-foreground">{subjectHours}</span>
                <span
                  className="text-lg font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1 rounded border border-indigo-500/20"
                  title={`${homeroomHours} soat Kelajak soati (Sinf rahbarligi)`}
                >
                  +{homeroomHours}
                </span>
                <span className="text-xs font-semibold text-muted-foreground ml-1">
                  / {capacity} st <span className="text-[10px] font-bold text-foreground">({scheduledCount} st)</span>
                </span>
              </div>
            ) : (
              <>
                <span className="text-2xl font-black text-foreground">{scheduledCount}</span>
                <span className="text-xs font-semibold text-muted-foreground">/ {capacity} soat</span>
              </>
            )}
          </div>
          {homeroomHours > 0 ? (
            <div className="mt-2 text-[9.5px] font-bold text-muted-foreground flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span>{subjectHours} st fan + {homeroomHours} st Kelajak soati</span>
            </div>
          ) : (
            <div className="mt-2 w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverloaded ? "bg-rose-500" : isOptimal ? "bg-emerald-500" : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, loadPercentage)}%` }}
              />
            </div>
          )}
        </div>

        {/* Card 2: ☀️ ABETGACHA (1-SMENA) */}
        <div
          onClick={() => setShiftFilter(shiftFilter === "SHIFT_1" ? "ALL" : "SHIFT_1")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
            shiftFilter === "SHIFT_1"
              ? "bg-amber-500/10 border-amber-500/50 shadow-xs ring-2 ring-amber-500/20"
              : "bg-card border-border/80 hover:border-amber-500/40 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Abetgacha (1-sm)</span>
            </span>
            <span className="text-[9px] font-bold text-muted-foreground">08:00 - 13:00</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {shift1Count}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              soat ({scheduledCount > 0 ? Math.round((shift1Count / scheduledCount) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-1 text-[10px] font-bold text-muted-foreground truncate">
            {shiftLessons.shift1.length > 0 ? "Ertalabki guruhlar" : "Dars mavjud emas"}
          </div>
        </div>

        {/* Card 3: 🌤️ ABETDAN KEYIN (2-SMENA) */}
        <div
          onClick={() => setShiftFilter(shiftFilter === "SHIFT_2" ? "ALL" : "SHIFT_2")}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
            shiftFilter === "SHIFT_2"
              ? "bg-indigo-500/10 border-indigo-500/50 shadow-xs ring-2 ring-indigo-500/20"
              : "bg-card border-border/80 hover:border-indigo-500/40 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Abetdan keyin (2-sm)</span>
            </span>
            <span className="text-[9px] font-bold text-muted-foreground">13:00 - 18:00</span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {shift2Count}
            </span>
            <span className="text-xs font-semibold text-muted-foreground">
              soat ({scheduledCount > 0 ? Math.round((shift2Count / scheduledCount) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-1 text-[10px] font-bold text-muted-foreground truncate">
            {shiftLessons.shift2.length > 0 ? "Tushdan keyingi guruhlar" : "Dars mavjud emas"}
          </div>
        </div>

        {/* Card 4: DARCHALAR (OYNALAR) AUDITI */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-teal-500" />
              <span>Darchalar (Oyna)</span>
            </span>
            <span
              className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                totalGapsCount === 0
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
              }`}
            >
              {totalGapsCount === 0 ? "Ideal jadval" : "Darcha bor"}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-foreground">{totalGapsCount}</span>
            <span className="text-xs font-semibold text-muted-foreground">ta darcha</span>
          </div>
          <div className="mt-1 text-[10px] font-bold text-muted-foreground">
            {totalGapsCount === 0
              ? "🟢 Bo'shliqlar yo'q, kompakt"
              : `⚠️ Haftasiga ${totalGapsCount} ta oraliq bo'shliq`}
          </div>
        </div>

        {/* Card 5: O'QITILAYOTGAN SINFLAR */}
        <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold flex items-center gap-1.5">
              <School className="w-3.5 h-3.5 text-blue-500" />
              <span>O&apos;qitiladigan Sinflar</span>
            </span>
            <span className="text-[9px] font-extrabold text-blue-600 bg-blue-500/10 px-1.5 py-0.5 rounded-md">
              {taughtClasses.length} ta sinf
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 flex-wrap max-h-12 overflow-y-auto">
            {taughtClasses.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectClass?.(c.id)}
                className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border/60 transition-colors cursor-pointer"
                title={`${c.name} dars jadvaliga o'tish`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="mt-1 text-[9.5px] font-bold text-muted-foreground truncate">
            {taughtClasses.length > 0 ? "Barcha biriktirilgan sinflar" : "Sinf biriktirilmagan"}
          </div>
        </div>

        {/* Card 6: METOD KUNI VA STATUS */}
        <div
          className={`p-3.5 rounded-2xl border shadow-xs flex flex-col justify-between ${
            methodDayViolations > 0
              ? "bg-rose-500/10 border-rose-500/40"
              : activeMethodDayName
              ? "bg-emerald-500/10 border-emerald-500/40"
              : "bg-card border-border/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rasmiy Metod Kuni</span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded">
              MMTV
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 uppercase">
              {activeMethodDayName || "Belgilanmagan"}
            </span>
          </div>
          <div className="mt-1 text-[10px] font-bold">
            {methodDayViolations > 0 ? (
              <span className="text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>⚠️ {methodDayViolations} ta dars tushgan!</span>
              </span>
            ) : activeMethodDayName ? (
              <span className="text-emerald-700 dark:text-emerald-400">
                ✓ Darslardan to&apos;liq ozod
              </span>
            ) : (
              <span className="text-muted-foreground">Sozlamalarda kiritilmagan</span>
            )}
          </div>
        </div>
      </div>

      {/* ── SHIFT FILTER TOGGLE TABS ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-2xl border border-border/60">
          <button
            onClick={() => setShiftFilter("ALL")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              shiftFilter === "ALL"
                ? "bg-background text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>Barchasi (1 & 2-Smena)</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-muted text-foreground">
              {scheduledCount} st
            </span>
          </button>

          <button
            onClick={() => setShiftFilter("SHIFT_1")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              shiftFilter === "SHIFT_1"
                ? "bg-amber-500/15 text-amber-800 dark:text-amber-200 shadow-xs border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>1-Smena (Abetgacha: 08:00–13:00)</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-900 dark:text-amber-100">
              {shift1Count} st
            </span>
          </button>

          <button
            onClick={() => setShiftFilter("SHIFT_2")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              shiftFilter === "SHIFT_2"
                ? "bg-indigo-500/15 text-indigo-800 dark:text-indigo-200 shadow-xs border border-indigo-500/30"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            <span>2-Smena (Abetdan keyin: 13:00–18:00)</span>
            <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-indigo-500/20 text-indigo-900 dark:text-indigo-100">
              {shift2Count} st
            </span>
          </button>
        </div>

        {/* Xonalar va Binolar ma'lumoti */}
        {usedRooms.length > 0 && (
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-primary" />
              <span>Dars o&apos;tiladigan xonalar:</span>
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {usedRooms.map((r) => (
                <span
                  key={r.id}
                  className="px-2 py-0.5 rounded-lg bg-card border border-border/80 text-[10.5px] font-extrabold text-foreground shadow-2xs"
                >
                  🚪 {r.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── DAILY WORKLOAD STATUS PILLS WITH SHIFT SPLIT ──────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2 print:hidden">
        {DAYS.map((day) => {
          const stats = dailyStats.get(day.id);
          const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
          const count = stats?.total || 0;
          const s1 = stats?.shift1 || 0;
          const s2 = stats?.shift2 || 0;
          const gaps = stats?.gaps || 0;

          return (
            <div
              key={day.id}
              className={`p-2.5 rounded-2xl border text-center transition-all ${
                isMethodDay
                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-xs"
                  : count > 0
                  ? "bg-card border-border/80 shadow-xs"
                  : "bg-muted/10 border-border/40 opacity-60"
              }`}
            >
              <div className="text-[11px] font-bold text-muted-foreground flex items-center justify-center gap-1">
                <span>{day.name}</span>
                {isMethodDay && <span className="text-emerald-600 text-[10px] font-black">★</span>}
              </div>

              <div className="text-sm font-black text-foreground mt-0.5">
                {isMethodDay && count === 0 ? (
                  <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                    Metod kuni
                  </span>
                ) : (
                  <>
                    {count}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">soat</span>
                  </>
                )}
              </div>

              {/* Smena taqsimoti chipi */}
              {count > 0 && (
                <div className="mt-1 flex items-center justify-center gap-1 text-[9px] font-black">
                  {s1 > 0 && (
                    <span
                      className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
                      title="Abetgacha darslar soni"
                    >
                      ☀️ {s1} st
                    </span>
                  )}
                  {s2 > 0 && (
                    <span
                      className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20"
                      title="Abetdan keyin darslar soni"
                    >
                      🌤️ {s2} st
                    </span>
                  )}
                </div>
              )}

              {gaps > 0 && (
                <div className="text-[8.5px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  ⚠️ {gaps} ta darcha
                </div>
              )}
            </div>
          );
        })}

        {/* 7-Pill: JAMI HAFTALIK PILL */}
        <div className="p-2.5 rounded-2xl border-2 border-primary/40 bg-primary/5 text-center shadow-xs flex flex-col justify-center">
          <div className="text-[10px] font-black uppercase text-primary tracking-wide">
            JAMI HAFTALIK
          </div>
          <div className="text-base font-black text-foreground mt-0.5 flex items-baseline justify-center gap-1">
            {homeroomHours > 0 ? (
              <>
                <span>{subjectHours}</span>
                <span
                  className="text-xs font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1 py-0.2 rounded border border-indigo-500/20"
                  title={`${homeroomHours} soat Kelajak soati (Sinf rahbarligi)`}
                >
                  +{homeroomHours}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">soat</span>
                <span className="text-[10px] font-bold text-muted-foreground/80">({scheduledCount} st)</span>
              </>
            ) : (
              <>
                {scheduledCount} <span className="text-xs font-semibold text-muted-foreground">soat</span>
              </>
            )}
          </div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[9px] font-black">
            <span className="text-amber-600">☀️ {shift1Count} st</span>
            <span className="text-muted-foreground">&bull;</span>
            <span className="text-indigo-600">🌤️ {shift2Count} st</span>
          </div>
        </div>
      </div>

      {/* ── RESPONSIVE COMPREHENSIVE TIMETABLE GRID ───────────────────────── */}
      <div className="w-full overflow-x-auto rounded-3xl border border-border bg-card shadow-sm print:border-black print:rounded-none">
        <table className="w-full border-collapse text-left font-sans text-xs">
          <thead>
            <tr className="bg-muted/50 border-b border-border text-center print:border-black">
              <th className="w-32 sm:w-36 p-3 text-center text-xs font-black text-muted-foreground uppercase border-r border-border/80 print:border-black">
                Dars / Vaqt
              </th>
              {DAYS.map((day) => {
                const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
                const stats = dailyStats.get(day.id);
                return (
                  <th
                    key={day.id}
                    className={`p-3 text-center text-xs font-black border-l border-border/80 print:border-black min-w-[130px] sm:min-w-[150px] ${
                      isMethodDay
                        ? "bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200"
                        : "text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{day.name}</span>
                      {isMethodDay && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">★</span>
                      )}
                    </div>
                    {isMethodDay ? (
                      <div className="text-[9px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tighter mt-0.5">
                        (Metod kuni)
                      </div>
                    ) : (
                      <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                        {stats?.total || 0} soat dars
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {/* ══════════════════════════════════════════════════════════════════
                1-SMENA: ERTALABKI DARSLAR (ABETGACHA: 08:00 - 13:00)
               ══════════════════════════════════════════════════════════════════ */}
            {(shiftFilter === "ALL" || shiftFilter === "SHIFT_1") && (
              <>
                {/* 1-Smena Section Header */}
                <tr className="bg-amber-500/10 dark:bg-amber-500/15 border-y-2 border-amber-500/30 print:border-black">
                  <td
                    colSpan={7}
                    className="px-4 py-2 text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Sun className="w-4 h-4 text-amber-600" />
                        <span>☀️ 1-Smena — Ertalabki Darslar (Abetgacha: 08:00 – 13:00)</span>
                      </span>
                      <span className="text-[10px] font-extrabold bg-amber-500/20 px-2 py-0.5 rounded-md">
                        Haftalik: {shift1Count} soat
                      </span>
                    </div>
                  </td>
                </tr>

                {DEFAULT_SHIFT_1_PERIODS.map((periodInfo) => (
                  <tr
                    key={`shift1_p${periodInfo.period}`}
                    className="border-b border-border/70 hover:bg-muted/10 print:border-black transition-colors"
                  >
                    {/* Period Column */}
                    <td className="p-2 text-center bg-muted/20 border-r border-border/80 print:border-black tabular-nums">
                      <span className="block font-black text-xs text-foreground">
                        {periodInfo.period}-dars
                      </span>
                      <span className="inline-block text-[10.5px] font-semibold text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/60 mt-0.5">
                        {periodInfo.time}
                      </span>
                      <span className="block text-[8.5px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                        (Abetgacha)
                      </span>
                    </td>

                    {/* Days Columns */}
                    {DAYS.map((day) => {
                      const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
                      const lessonsInCell = cellLessonMap.get(`${day.id}_1_${periodInfo.period}`) || [];

                      return (
                        <td
                          key={`cell_${day.id}_1_${periodInfo.period}`}
                          className={`p-2 align-top border-l border-border/70 print:border-black ${
                            isMethodDay ? "bg-emerald-50/15 dark:bg-emerald-950/10" : ""
                          }`}
                        >
                          {renderCellContent(
                            lessonsInCell,
                            isMethodDay,
                            subjectMap,
                            classMap,
                            roomMap,
                            branchMap,
                            onOpenZamena,
                            onSelectClass
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                TUSHLIK VA SMENALAR ALMASHINUVI AJRATUVCHISI (LUNCH BREAK)
               ══════════════════════════════════════════════════════════════════ */}
            {shiftFilter === "ALL" && (
              <tr className="bg-slate-100 dark:bg-slate-900/80 border-y-2 border-dashed border-slate-300 dark:border-slate-700 print:hidden">
                <td colSpan={7} className="py-2 text-center text-xs font-bold text-slate-600 dark:text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Coffee className="w-4 h-4 text-amber-500" />
                    <span>🥪 13:00 — 13:15 &bull; Tushlik va Smenalar almashinuvi tanaffusi</span>
                  </div>
                </td>
              </tr>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                2-SMENA: TUSHDAN KEYINGI DARSLAR (ABETDAN KEYIN: 13:00 - 18:00)
               ══════════════════════════════════════════════════════════════════ */}
            {(shiftFilter === "ALL" || shiftFilter === "SHIFT_2") && (
              <>
                {/* 2-Smena Section Header */}
                <tr className="bg-indigo-500/10 dark:bg-indigo-500/15 border-y-2 border-indigo-500/30 print:border-black">
                  <td
                    colSpan={7}
                    className="px-4 py-2 text-xs font-black text-indigo-900 dark:text-indigo-200 uppercase tracking-wider"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Moon className="w-4 h-4 text-indigo-600" />
                        <span>🌤️ 2-Smena — Tushdan Keyingi Darslar (Abetdan keyin: 13:00 – 18:00)</span>
                      </span>
                      <span className="text-[10px] font-extrabold bg-indigo-500/20 px-2 py-0.5 rounded-md">
                        Haftalik: {shift2Count} soat
                      </span>
                    </div>
                  </td>
                </tr>

                {DEFAULT_SHIFT_2_PERIODS.map((periodInfo) => (
                  <tr
                    key={`shift2_p${periodInfo.period}`}
                    className="border-b border-border/70 hover:bg-muted/10 print:border-black transition-colors"
                  >
                    {/* Period Column */}
                    <td className="p-2 text-center bg-muted/20 border-r border-border/80 print:border-black tabular-nums">
                      <span className="block font-black text-xs text-foreground">
                        {periodInfo.period}-dars
                      </span>
                      <span className="inline-block text-[10.5px] font-semibold text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded border border-border/60 mt-0.5">
                        {periodInfo.time}
                      </span>
                      <span className="block text-[8.5px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">
                        (Abetdan keyin)
                      </span>
                    </td>

                    {/* Days Columns */}
                    {DAYS.map((day) => {
                      const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
                      const lessonsInCell = cellLessonMap.get(`${day.id}_2_${periodInfo.period}`) || [];

                      return (
                        <td
                          key={`cell_${day.id}_2_${periodInfo.period}`}
                          className={`p-2 align-top border-l border-border/70 print:border-black ${
                            isMethodDay ? "bg-emerald-50/15 dark:bg-emerald-950/10" : ""
                          }`}
                        >
                          {renderCellContent(
                            lessonsInCell,
                            isMethodDay,
                            subjectMap,
                            classMap,
                            roomMap,
                            branchMap,
                            onOpenZamena,
                            onSelectClass
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </>
            )}
          </tbody>

          {/* ══════════════════════════════════════════════════════════════════
              PASTDAGI JAMI VA XULOSA QATORLARI (COMPREHENSIVE SUMMARY FOOTER)
             ══════════════════════════════════════════════════════════════════ */}
          <tfoot>
            {/* 1. KUNLIK JAMI SOAT QATORI */}
            <tr className="bg-primary/10 border-t-2 border-b border-primary/30 font-black text-xs text-foreground print:border-black">
              <td className="p-2.5 text-right font-black uppercase tracking-tight border-r border-border/80 print:border-black">
                Jami Dars Soati:
              </td>
              {DAYS.map((day) => {
                const stats = dailyStats.get(day.id);
                const count = stats?.total || 0;
                const isMethodDay = activeTeacher.methodDayOfWeek === day.id;
                return (
                  <td
                    key={`foot_total_${day.id}`}
                    className="p-2.5 text-center border-l border-border/80 print:border-black"
                  >
                    {isMethodDay && count === 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        Metod kuni
                      </span>
                    ) : (
                      <span className="text-sm font-black text-foreground">{count} soat</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* 2. ABETGACHA (1-SMENA) SOATI QATORI */}
            <tr className="bg-amber-500/5 border-b border-border/60 text-xs font-bold text-amber-900 dark:text-amber-200 print:border-black">
              <td className="p-2 text-right border-r border-border/80 print:border-black flex items-center justify-end gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>☀️ Abetgacha (1-sm):</span>
              </td>
              {DAYS.map((day) => {
                const s1 = dailyStats.get(day.id)?.shift1 || 0;
                return (
                  <td
                    key={`foot_s1_${day.id}`}
                    className="p-2 text-center border-l border-border/80 print:border-black"
                  >
                    {s1 > 0 ? (
                      <span className="font-extrabold text-amber-700 dark:text-amber-300">
                        {s1} soat
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 font-normal">—</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* 3. ABETDAN KEYIN (2-SMENA) SOATI QATORI */}
            <tr className="bg-indigo-500/5 border-b border-border/60 text-xs font-bold text-indigo-900 dark:text-indigo-200 print:border-black">
              <td className="p-2 text-right border-r border-border/80 print:border-black flex items-center justify-end gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>🌤️ Abetdan keyin (2-sm):</span>
              </td>
              {DAYS.map((day) => {
                const s2 = dailyStats.get(day.id)?.shift2 || 0;
                return (
                  <td
                    key={`foot_s2_${day.id}`}
                    className="p-2 text-center border-l border-border/80 print:border-black"
                  >
                    {s2 > 0 ? (
                      <span className="font-extrabold text-indigo-700 dark:text-indigo-300">
                        {s2} soat
                      </span>
                    ) : (
                      <span className="text-muted-foreground/40 font-normal">—</span>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* 4. DARCHALAR (OYNALAR) AUDITI QATORI */}
            <tr className="bg-muted/30 border-b-2 border-border/80 text-[11px] font-bold text-muted-foreground print:hidden">
              <td className="p-2 text-right border-r border-border/80 flex items-center justify-end gap-1.5">
                <Coffee className="w-3 h-3 text-teal-600 shrink-0" />
                <span>🪟 Darchalar (Oynalar):</span>
              </td>
              {DAYS.map((day) => {
                const gaps = dailyStats.get(day.id)?.gaps || 0;
                return (
                  <td
                    key={`foot_gaps_${day.id}`}
                    className="p-2 text-center border-l border-border/80"
                  >
                    {gaps > 0 ? (
                      <span className="text-amber-600 font-black">⚠️ {gaps} ta</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">0 ta</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── PROACTIVE PEDAGOGICAL INSIGHTS & SUGGESTIONS (TAKLIFLAR VA IDEALAR) ─ */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-500/5 via-primary/5 to-purple-500/5 border border-primary/20 space-y-3 print:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-primary text-primary-foreground">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs sm:text-sm font-black text-foreground">
              AI Pedagogik Tahlil & Mukammallashtirish Takliflari
            </h4>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Smart Advisor
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Taklif 1: Yuklama balansi */}
          <div className="p-3 rounded-2xl bg-card border border-border/60 space-y-1 shadow-2xs">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span>⚖️ Kunlik Yuklama Balansi</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {dailyStats.get(2)?.total === 8 || dailyStats.get(6)?.total === 8 ? (
                <span>
                  Seshanba va Shanba kunlarida darslar soni 8 soatga yetgan. Bu 1-smena va 2-smena
                  orasida tushlik tanaffusi hisobiga joylashgan. Chorshanba kuni esa 5 soat. Yuklamani
                  yanada tenglashtirish mumkin.
                </span>
              ) : (
                <span>
                  Hafta kunlari bo&apos;yicha darslar optimal taqsimlangan. Kunlik me&apos;yor SanPiN talablariga mos.
                </span>
              )}
            </p>
          </div>

          {/* Taklif 2: Smenalararo harakat */}
          <div className="p-3 rounded-2xl bg-card border border-border/60 space-y-1 shadow-2xs">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span>🔄 Smenalararo Harakat</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {shift1Count > 0 && shift2Count > 0 ? (
                <span>
                  O&apos;qituvchi ikkala smenada ham ({shift1Count} st ertalab, {shift2Count} st
                  tushdan keyin) dars beradi. 13:00–13:15 tushlik tanaffusida dam olish uchun sharoit
                  yaratilgan.
                </span>
              ) : shift1Count > 0 ? (
                <span>O&apos;qituvchining barcha darslari 1-smenaga (Abetgacha) to&apos;plangan.</span>
              ) : (
                <span>O&apos;qituvchining barcha darslari 2-smenaga (Abetdan keyin) to&apos;plangan.</span>
              )}
            </p>
          </div>

          {/* Taklif 3: Darcha va Oynalar */}
          <div className="p-3 rounded-2xl bg-card border border-border/60 space-y-1 shadow-2xs">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span>🎯 Jadval Kompaktligi</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {totalGapsCount === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  Jadvalda 0 ta darcha (oyna) mavjud! O&apos;qituvchi har bir smenada ketma-ket
                  uzluksiz dars o&apos;tadi, vaqt behuda sarflanmaydi.
                </span>
              ) : (
                <span>
                  Hafta davomida {totalGapsCount} ta darcha aniqlandi. Drag & Drop orqali ularni
                  oldingi yoki keyingi soatlarga siljitish tavsiya etiladi.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Katakcha ichidagi darslarni render qilish yordamchi funksiyasi
 */
function renderCellContent(
  lessonsInCell: Lesson[],
  isMethodDay: boolean,
  subjectMap: Map<string, Subject>,
  classMap: Map<string, SchoolClass>,
  roomMap: Map<string, Room>,
  branchMap: Map<string, Branch>,
  onOpenZamena?: (lesson: Lesson) => void,
  onSelectClass?: (classId: string) => void
) {
  if (lessonsInCell.length === 0) {
    if (isMethodDay) {
      return (
        <div className="h-16 rounded-2xl border border-dashed border-emerald-300/40 dark:border-emerald-700/30 flex items-center justify-center text-emerald-600/60 dark:text-emerald-400/50 text-[11px] font-bold select-none">
          Metod kuni
        </div>
      );
    }
    return (
      <div className="h-16 rounded-2xl border border-dashed border-border/40 flex items-center justify-center text-muted-foreground/30 text-xs select-none">
        —
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {lessonsInCell.map((lesson) => {
        const subject = subjectMap.get(lesson.subjectId);
        const cls = classMap.get(lesson.classId);
        const room = lesson.roomId ? roomMap.get(lesson.roomId) : null;
        const branch = lesson.branchId ? branchMap.get(lesson.branchId) : null;

        // Metod kuniga xato tushgan dars
        if (isMethodDay) {
          return (
            <div
              key={lesson.id}
              onClick={() => onOpenZamena?.(lesson)}
              className="rounded-2xl border border-rose-300 dark:border-rose-700 border-l-4 border-l-rose-600 p-2 bg-rose-100/50 dark:bg-rose-900/30 shadow-xs space-y-1 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-xs text-rose-900 dark:text-rose-100 truncate">
                  {subject?.name || "Fan"}
                </span>
                <span className="rounded-md bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 px-1.5 py-0.5 text-[10px] font-black shrink-0">
                  {cls?.name}
                </span>
              </div>
              <div className="text-[9px] font-extrabold text-rose-600 dark:text-rose-400">
                ⚠️ Metod kuniga tushgan!
              </div>
            </div>
          );
        }

        // Oddiy to'liq dars kartasi
        return (
          <div
            key={lesson.id}
            onClick={() => onOpenZamena?.(lesson)}
            className="group rounded-2xl border border-border/80 border-l-4 p-2 bg-card hover:bg-muted/30 hover:shadow-md transition-all space-y-1 cursor-pointer"
            style={{ borderLeftColor: subject?.colorTag || "#3B82F6" }}
          >
            <div className="flex items-center justify-between gap-1">
              <span
                className="font-black text-xs text-foreground truncate group-hover:text-primary transition-colors"
                title={subject?.name}
              >
                {subject?.name || "Fan"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (cls) onSelectClass?.(cls.id);
                }}
                className="rounded-md bg-primary/10 hover:bg-primary/20 text-primary px-1.5 py-0.5 text-[10px] font-black shrink-0 border border-primary/20 cursor-pointer transition-colors"
                title={`${cls?.name} dars jadvalini ko'rish`}
              >
                {cls?.name}
              </button>
            </div>

            {/* Pastki meta ma'lumotlar: Xona, Guruh, Filial */}
            <div className="flex items-center gap-1.5 flex-wrap text-[9.5px] text-muted-foreground font-semibold">
              {room && (
                <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 font-bold">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{room.name}</span>
                </span>
              )}

              {lesson.groupType && lesson.groupType !== "WHOLE" && (
                <span className="px-1 rounded bg-muted text-[8.5px] font-bold">
                  {lesson.groupType === "GROUP_1" ? "1-gr" : "2-gr"}
                </span>
              )}

              {branch && !branch.isMain && (
                <span className="px-1 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[8.5px] font-bold">
                  Filial
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
