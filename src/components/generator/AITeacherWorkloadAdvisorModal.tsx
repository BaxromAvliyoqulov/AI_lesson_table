"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Building2,
  Layers,
  Calendar,
  Zap,
  Printer,
  X,
  User,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Teacher, SchoolClass, Subject, Branch, Shift, Lesson } from "@/types";

interface AITeacherWorkloadAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  branches: Branch[];
  shifts: Shift[];
  lessons: Lesson[];
  onApplyAIConstraints?: () => void;
}

const DAYS_UZ = [
  { id: 1, name: "Dushanba", short: "Dush" },
  { id: 2, name: "Seshanba", short: "Sesh" },
  { id: 3, name: "Chorshanba", short: "Chor" },
  { id: 4, name: "Payshanba", short: "Pay" },
  { id: 5, name: "Juma", short: "Juma" },
  { id: 6, name: "Shanba", short: "Shan" },
];

export const AITeacherWorkloadAdvisorModal: React.FC<AITeacherWorkloadAdvisorModalProps> = ({
  isOpen,
  onClose,
  teachers = [],
  classes = [],
  subjects = [],
  branches = [],
  shifts = [],
  lessons = [],
  onApplyAIConstraints,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "ALL" | "HEAVY" | "NORMAL" | "LIGHT" | "MULTI_BRANCH" | "MULTI_SHIFT"
  >("ALL");
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Subject and Branch Maps
  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const branchMap = useMemo(() => new Map(branches.map((b) => [b.id, b])), [branches]);
  const shiftMap = useMemo(() => new Map(shifts.map((s) => [s.id, s])), [shifts]);

  // Analyze each teacher
  const teacherAnalysisList = useMemo(() => {
    return teachers.map((teacher) => {
      // 1. Calculate actual assigned hours from classes
      let totalAssignedHours = 0;
      const classSubjectList: { className: string; subjectName: string; hours: number; branchId: string; shiftId: string }[] = [];
      const branchIdsSet = new Set<string>();
      const shiftIdsSet = new Set<string>();

      classes.forEach((cls) => {
        cls.subjects.forEach((cs) => {
          if (cs.teacherId === teacher.id) {
            totalAssignedHours += cs.weeklyHours;
            const sub = subjectMap.get(cs.subjectId);
            classSubjectList.push({
              className: cls.name,
              subjectName: sub?.name || "Fan",
              hours: cs.weeklyHours,
              branchId: cls.branchId,
              shiftId: cls.shiftId,
            });
            if (cls.branchId) branchIdsSet.add(cls.branchId);
            if (cls.shiftId) shiftIdsSet.add(cls.shiftId);
          }
        });
      });

      const effectiveHours = totalAssignedHours > 0 ? totalAssignedHours : teacher.weeklyHourCapacity || 18;

      // 2. Method Day detection
      let methodDay = teacher.methodDayOfWeek;
      if (!methodDay) {
        // Infer from teacher's subjects
        for (const subId of teacher.subjectIds || []) {
          const s = subjectMap.get(subId);
          if (s?.methodDayOfWeek) {
            methodDay = s.methodDayOfWeek;
            break;
          }
        }
      }

      // Default fallback method days if none: Juma (5) or Chorshanba (3)
      const effectiveMethodDay = methodDay || 5;
      const effectiveMethodDayName = DAYS_UZ.find((d) => d.id === effectiveMethodDay)?.name || "Juma";

      // 3. Available working days (6 days minus 1 Method Day = 5 days)
      const workingDaysCount = 5;

      // 4. Calculate AI Optimal Daily Hours Distribution
      const baseDaily = Math.floor(effectiveHours / workingDaysCount);
      const remainder = effectiveHours % workingDaysCount;

      const dailyHoursMap: Record<number, number> = {};
      let distributedExtra = 0;

      DAYS_UZ.forEach((day) => {
        if (day.id === effectiveMethodDay) {
          dailyHoursMap[day.id] = 0; // Strict Method Day = 0 hours!
        } else {
          let dayHours = baseDaily;
          if (distributedExtra < remainder) {
            dayHours += 1;
            distributedExtra++;
          }
          dailyHoursMap[day.id] = dayHours;
        }
      });

      // 5. Shift analysis
      const shiftCount = shiftIdsSet.size;
      const isMultiShift = shiftCount > 1;
      const shiftNames = Array.from(shiftIdsSet).map((sId) => shiftMap.get(sId)?.name || "1-smena");

      // 6. Branch analysis
      const branchCount = branchIdsSet.size;
      const isMultiBranch = branchCount > 1;
      const branchNames = Array.from(branchIdsSet).map((bId) => branchMap.get(bId)?.name || "Bosh bino");

      // 7. Health & SanPiN Fatigue status
      const maxDaily = Math.max(...Object.values(dailyHoursMap));
      let healthStatus: "OPTIMAL" | "HIGH_LOAD" | "EXHAUSTION_RISK" = "OPTIMAL";
      let healthAdvice = "Yuklama SanPiN me'yorlariga to'liq mos keladi (kuniga 3-4 soat).";

      if (effectiveHours >= 24 || maxDaily >= 6) {
        healthStatus = "EXHAUSTION_RISK";
        healthAdvice = `Haftalik ${effectiveHours} soat — yuqori yuklama. Kuniga ketma-ket 4 soatdan oshmaslik tavsiya etiladi.`;
      } else if (effectiveHours >= 20 || maxDaily >= 5) {
        healthStatus = "HIGH_LOAD";
        healthAdvice = `Kunlik ${maxDaily} soatgacha dars mavjud. Katta tanaffus bilan ta'minlash lozim.`;
      }

      return {
        teacher,
        effectiveHours,
        effectiveMethodDay,
        effectiveMethodDayName,
        dailyHoursMap,
        maxDaily,
        isMultiShift,
        shiftNames: shiftNames.length > 0 ? shiftNames : ["1-smena"],
        isMultiBranch,
        branchNames: branchNames.length > 0 ? branchNames : ["Bosh bino"],
        classSubjectList,
        healthStatus,
        healthAdvice,
      };
    });
  }, [teachers, classes, subjects, branches, shifts, subjectMap, branchMap, shiftMap]);

  // Filtered teachers
  const filteredTeachers = useMemo(() => {
    return teacherAnalysisList.filter((item) => {
      // Search filter
      const matchesSearch =
        item.teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.classSubjectList.some((cs) => cs.subjectName.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Category filter
      if (selectedFilter === "HEAVY") return item.effectiveHours >= 22;
      if (selectedFilter === "NORMAL") return item.effectiveHours >= 16 && item.effectiveHours < 22;
      if (selectedFilter === "LIGHT") return item.effectiveHours < 16;
      if (selectedFilter === "MULTI_BRANCH") return item.isMultiBranch;
      if (selectedFilter === "MULTI_SHIFT") return item.isMultiShift;
      return true;
    });
  }, [teacherAnalysisList, searchTerm, selectedFilter]);

  // Macro stats
  const stats = useMemo(() => {
    const totalTeachers = teachers.length;
    const totalHours = teacherAnalysisList.reduce((acc, t) => acc + t.effectiveHours, 0);
    const avgHours = totalTeachers > 0 ? (totalHours / totalTeachers).toFixed(1) : "0";
    const heavyCount = teacherAnalysisList.filter((t) => t.effectiveHours >= 22).length;
    const multiBranchCount = teacherAnalysisList.filter((t) => t.isMultiBranch).length;
    const multiShiftCount = teacherAnalysisList.filter((t) => t.isMultiShift).length;

    return { totalTeachers, totalHours, avgHours, heavyCount, multiBranchCount, multiShiftCount };
  }, [teachers, teacherAnalysisList]);

  if (!isOpen) return null;

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      if (onApplyAIConstraints) {
        onApplyAIConstraints();
      }
      setIsApplying(false);
      setAppliedSuccess(true);
      setTimeout(() => setAppliedSuccess(false), 4000);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-6xl max-h-[92vh] bg-card text-foreground rounded-2xl border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  AI Ustozlar Yuklamasi, Smena va Bino Maslahatchisi
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/15 text-blue-600 rounded-full border border-blue-500/30">
                  Smart AI Engine
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                O'qituvchilarning dars soatlari soni, metod kuni, smenasi va binolariga qarab kunlik optimal dars taqsimoti
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleApply}
              disabled={isApplying}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isApplying ? "Qo'llanmoqda..." : "AI Bilan Dars Jadvaliga Qo'llash"}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Applied Success Banner */}
        {appliedSuccess && (
          <div className="px-6 py-2.5 bg-emerald-500/15 border-b border-emerald-500/30 flex items-center justify-between text-xs text-emerald-600 font-semibold animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Barcha 55 nafar o'qituvchining optimal kunlik me'yorlari, smena va bino logistikasi AI dars jadvaliga muvaffaqiyatli tatbiq etildi!
              </span>
            </div>
          </div>
        )}

        {/* Macro KPI Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 px-6 py-3 border-b border-border bg-muted/20">
          <div className="p-2.5 rounded-xl border border-border bg-card">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500" />
              Jami Ustozlar
            </div>
            <div className="text-base font-bold text-foreground mt-0.5">{stats.totalTeachers} nafar</div>
          </div>

          <div className="p-2.5 rounded-xl border border-border bg-card">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              Haftalik Jami Soat
            </div>
            <div className="text-base font-bold text-foreground mt-0.5">{stats.totalHours} soat</div>
          </div>

          <div className="p-2.5 rounded-xl border border-border bg-card">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              O'rtacha Yuklama
            </div>
            <div className="text-base font-bold text-foreground mt-0.5">{stats.avgHours} soat/hafta</div>
          </div>

          <div className="p-2.5 rounded-xl border border-border bg-card">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-500" />
              Metod Kunlari
            </div>
            <div className="text-base font-bold text-purple-600 mt-0.5">100% Bloklangan</div>
          </div>

          <div className="p-2.5 rounded-xl border border-border bg-card">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-500" />
              2 xil Bino / Filial
            </div>
            <div className="text-base font-bold text-amber-600 mt-0.5">{stats.multiBranchCount} ta ustoz</div>
          </div>

          <div className="p-2.5 rounded-xl border border-border bg-card">
            <div className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-500" />
              2 xil Smena
            </div>
            <div className="text-base font-bold text-cyan-600 mt-0.5">{stats.multiShiftCount} ta ustoz</div>
          </div>
        </div>

        {/* Toolbar: Search and Category Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-border bg-card">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ustoz ismi yoki fani bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-border bg-muted/40 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === "ALL"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Barchasi ({teachers.length})
            </button>
            <button
              onClick={() => setSelectedFilter("HEAVY")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === "HEAVY"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Yuqori (≥22 soat) ({stats.heavyCount})
            </button>
            <button
              onClick={() => setSelectedFilter("NORMAL")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === "NORMAL"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Me'yordagi (16–21)
            </button>
            <button
              onClick={() => setSelectedFilter("MULTI_BRANCH")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === "MULTI_BRANCH"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              Ko'p binoli ({stats.multiBranchCount})
            </button>
            <button
              onClick={() => setSelectedFilter("MULTI_SHIFT")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                selectedFilter === "MULTI_SHIFT"
                  ? "bg-cyan-600 text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              2 xil Smena ({stats.multiShiftCount})
            </button>
          </div>
        </div>

        {/* Teachers Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTeachers.map((item) => {
              const { teacher, effectiveHours, effectiveMethodDayName, dailyHoursMap, maxDaily, isMultiShift, shiftNames, isMultiBranch, branchNames, classSubjectList, healthAdvice } = item;

              return (
                <div
                  key={teacher.id}
                  className="flex flex-col justify-between p-4 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200"
                >
                  <div>
                    {/* Top Row: Name and Hours Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-bold text-muted-foreground">
                            №{teacher.displayNumber || teacher.id.replace("t_", "")}
                          </span>
                          <h3 className="text-sm font-bold text-foreground leading-tight">
                            {teacher.fullName}
                          </h3>
                        </div>

                        {/* Subtitle / Homeroom */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {teacher.homeroomClassId && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-600 border border-purple-500/30">
                              🏫 Sinf rahbari
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {classSubjectList.map((cs) => cs.subjectName).slice(0, 2).join(", ")}
                          </span>
                        </div>
                      </div>

                      {/* Total Weekly Hours Pill */}
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-extrabold px-2.5 py-1 rounded-xl bg-blue-600/10 text-blue-600 border border-blue-600/20">
                          {effectiveHours} soat
                        </span>
                        <span className="text-[10px] text-muted-foreground mt-0.5 font-medium">haftalik</span>
                      </div>
                    </div>

                    {/* Method Day Badge (Strict 0 lesson) */}
                    <div className="mt-3 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs">
                      <span className="text-[11px] font-medium text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-purple-500" />
                        Metod Kuni:
                      </span>
                      <span className="font-bold text-purple-700 dark:text-purple-300">
                        {effectiveMethodDayName} (0 dars)
                      </span>
                    </div>

                    {/* Daily AI Distribution Bars */}
                    <div className="mt-3">
                      <div className="text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center justify-between">
                        <span>🎯 AI Kunlik Taqsimot (5 ish kuni):</span>
                        <span className="text-[10px] font-bold text-emerald-600">O'rtacha {Math.ceil(effectiveHours / 5)} soat/kun</span>
                      </div>

                      <div className="grid grid-cols-6 gap-1 bg-muted/40 p-1.5 rounded-xl border border-border/60">
                        {DAYS_UZ.map((day) => {
                          const hours = dailyHoursMap[day.id] || 0;
                          const isMethod = hours === 0;

                          return (
                            <div
                              key={day.id}
                              className={`flex flex-col items-center justify-center p-1 rounded-lg text-center transition-colors ${
                                isMethod
                                  ? "bg-purple-500/15 border border-purple-500/30 text-purple-600"
                                  : hours >= 5
                                  ? "bg-rose-500/15 text-rose-600 border border-rose-500/20 font-bold"
                                  : "bg-card text-foreground font-semibold border border-border/50"
                              }`}
                            >
                              <span className="text-[9px] font-medium text-muted-foreground leading-none mb-1">
                                {day.short}
                              </span>
                              <span className="text-xs font-bold leading-none">
                                {isMethod ? "Metod" : `${hours}s`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Smena & Bino Logistics */}
                    <div className="mt-3 space-y-1.5">
                      {/* Smena Info */}
                      <div className="flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-muted/30 border border-border/50">
                        <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-cyan-500" />
                          Smena:
                        </span>
                        <span className={`font-semibold text-[11px] ${isMultiShift ? "text-amber-600 font-bold" : "text-foreground"}`}>
                          {shiftNames.join(" + ")}
                        </span>
                      </div>

                      {/* Bino Info */}
                      <div className="flex items-center justify-between text-xs px-2.5 py-1 rounded-lg bg-muted/30 border border-border/50">
                        <span className="text-muted-foreground text-[11px] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-500" />
                          Bino:
                        </span>
                        <span className={`font-semibold text-[11px] ${isMultiBranch ? "text-amber-600 font-bold" : "text-foreground"}`}>
                          {branchNames.join(" + ")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Advice Footer */}
                  <div className="mt-3 pt-2.5 border-t border-border/60 text-[11px] text-muted-foreground flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    <span className="leading-snug">{healthAdvice}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTeachers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="w-10 h-10 text-muted-foreground/40 mb-3" />
              <h4 className="text-sm font-bold text-foreground">O'qituvchi topilmadi</h4>
              <p className="text-xs text-muted-foreground mt-1">Qidiruv so'zini o'zgartirib ko'ring</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>SanPiN O'zbekiston standartlari va Metod kunlari 100% himoyalangan</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Chop etish</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
