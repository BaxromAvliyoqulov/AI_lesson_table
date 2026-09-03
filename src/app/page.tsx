"use client";

import React, { useState, useMemo } from "react";
import { useSchoolStore } from "@/lib/store/useSchoolStore";
import { Navbar } from "@/components/layout/Navbar";
import { MasterGrid } from "@/components/master-grid/MasterGrid";
import { SingleClassView } from "@/components/views/SingleClassView";
import { TeacherScheduleView } from "@/components/views/TeacherScheduleView";
import { exportScheduleToExcel } from "@/lib/excel/excel-export";
import { CSPSolver } from "@/lib/solver/csp-solver";
import { Official39TableView } from "@/components/views/Official39TableView";
import { Lesson, SolverResult } from "@/types";
import { detectScheduleConflicts } from "@/lib/solver/schedule-conflict-detector";
import {
  Sparkles,
  Layers,
  FileSpreadsheet,
  Settings2,
  Building2,
  X,
  Plus,
  LayoutGrid,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  Printer,
  FileText,
} from "lucide-react";
import { AppModalsContainer } from "@/components/modals/AppModalsContainer";

export default function HomePage() {
  const store = useSchoolStore();

  // Local UI modal states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isTarifficationOpen, setIsTarifficationOpen] = useState(false);
  const [isTeacherAdvisorOpen, setIsTeacherAdvisorOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = useState(false);
  const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [selectedZamenaLesson, setSelectedZamenaLesson] = useState<Lesson | null>(null);
  const [generationResult, setGenerationResult] = useState<SolverResult | null>(null);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isA3PrintOpen, setIsA3PrintOpen] = useState(false);
  const [isTeacherCardsPrintOpen, setIsTeacherCardsPrintOpen] = useState(false);

  // Toast state
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error" | "info";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered entities for current school
  const currentSchool =
    store.schools.find((s) => s.id === store.currentSchoolId) || store.schools[0];
  const schoolBranches = store.branches.filter((b) => b.schoolId === store.currentSchoolId).length > 0
    ? store.branches.filter((b) => b.schoolId === store.currentSchoolId)
    : store.branches;
  const schoolShifts = store.shifts.filter((s) => s.schoolId === store.currentSchoolId).length > 0
    ? store.shifts.filter((s) => s.schoolId === store.currentSchoolId)
    : store.shifts;
  const schoolSubjects = store.subjects.filter((s) => s.schoolId === store.currentSchoolId).length > 0
    ? store.subjects.filter((s) => s.schoolId === store.currentSchoolId)
    : store.subjects;
  const schoolTeachers = store.teachers.filter((t) => t.schoolId === store.currentSchoolId).length > 0
    ? store.teachers.filter((t) => t.schoolId === store.currentSchoolId)
    : store.teachers;
  const schoolRooms = store.rooms.filter((r) => r.schoolId === store.currentSchoolId).length > 0
    ? store.rooms.filter((r) => r.schoolId === store.currentSchoolId)
    : store.rooms;
  const schoolClasses = store.classes.filter((c) => c.schoolId === store.currentSchoolId).length > 0
    ? store.classes.filter((c) => c.schoolId === store.currentSchoolId)
    : store.classes;
  const schoolLessons = store.lessons.filter((l) => l.schoolId === store.currentSchoolId).length > 0
    ? store.lessons.filter((l) => l.schoolId === store.currentSchoolId)
    : store.lessons;

  // Yagona Dvigatel orqali ziddiyatlarni hisoblash
  const conflictDetectionResult = useMemo(() => {
    return detectScheduleConflicts({
      lessons: schoolLessons,
      classes: schoolClasses,
      subjects: schoolSubjects,
      teachers: schoolTeachers,
    });
  }, [schoolLessons, schoolClasses, schoolSubjects, schoolTeachers]);

  // AI & CSP Generator (Interaktiv Progress Modal bilan)
  const handleGenerate = () => {
    if (schoolClasses.length === 0 || schoolTeachers.length === 0) {
      showToast("Avval maktab o'qituvchilari va sinflarini sozlang!", "error");
      setIsWizardOpen(true);
      return;
    }

    setIsGenModalOpen(true);
    store.setIsGenerating(true);
    setGenerationResult(null);

    // Katta maktablar uchun bosqichma-bosqich progress va non-blocking hisoblash
    setTimeout(() => {
      try {
        const solver = new CSPSolver({
          classes: schoolClasses,
          teachers: schoolTeachers,
          subjects: schoolSubjects,
          rooms: schoolRooms,
          shifts: schoolShifts,
          branches: schoolBranches,
          existingLessons: schoolLessons,
          lockedClassIds: store.lockedClassIds,
          lockedTeacherIds: store.lockedTeacherIds,
        });

        const result = solver.solve();
        store.setLessons(result.lessons);
        setGenerationResult(result);
        showToast(`✅ Dars jadvali muvaffaqiyatli generatsiya qilindi! (${result.lessons.length} ta dars)`);
      } catch (err: any) {
        console.error("Generatsiya xatosi:", err);
        showToast("Generatsiya jarayonida xatolik yuz berdi", "error");
      } finally {
        store.setIsGenerating(false);
      }
    }, 1200);
  };

  // Excel Export (39-maktab rasmiy andozasi)
  const handleExport = () => {
    if (schoolLessons.length === 0) {
      showToast("Avval dars jadvalini generatsiya qiling!", "error");
      return;
    }
    exportScheduleToExcel({
      classes:
        store.selectedBranch === "ALL"
          ? schoolClasses
          : schoolClasses.filter((c) => c.branchId === store.selectedBranch),
      subjects: schoolSubjects,
      teachers: schoolTeachers,
      rooms: schoolRooms,
      lessons: schoolLessons,
      branches: schoolBranches,
      shifts: schoolShifts,
      schoolName: currentSchool?.name || "39-umumiy o'rta ta'lim maktabi",
      region: currentSchool?.region || "Muzrabot tumani",
      directorFullName: currentSchool?.directorName || "M. Ramazonov",
      academicVicePrincipalName: currentSchool?.vicePrincipalName || "N. Narziqulov",
      psychologistName: currentSchool?.psychologistName || "F.I.Sh",
      academicYear: currentSchool?.academicYear || "2025-2026",
      termName: "1-yarim yillik",
    });
    showToast("✅ 39-maktab rasmiy Excel andozasi bo'yicha jadval yuklandi!");
  };

  // Create school
  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;
    store.addSchool(newSchoolName.trim());
    setNewSchoolName("");
    setIsAddSchoolOpen(false);
    setIsWizardOpen(true);
  };

  // Zamena assignment
  const handleAssignReplacement = (
    lessonId: string,
    replacementTeacherId: string,
    reason: string
  ) => {
    const updated = schoolLessons.map((l) =>
      l.id === lessonId ? { ...l, teacherId: replacementTeacherId } : l
    );
    store.setLessons(updated);
    store.addSubstitution({
      id: `sub_${Date.now()}`,
      schoolId: store.currentSchoolId,
      scheduleId: "active-schedule",
      date: new Date().toISOString(),
      dayOfWeek: 1,
      periodNumber: 1,
      classId: "",
      subjectId: "",
      originalTeacherId: "",
      substituteTeacherId: replacementTeacherId,
      reason,
      isApproved: true,
      createdAt: new Date().toISOString(),
    });
    showToast("O'rinbosar o'qituvchi muvaffaqiyatli biriktirildi!");
  };

  // F5 va sahifa yangilanishida dars jadvali rejimini saqlash (URL ?view=...)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlView = new URLSearchParams(window.location.search).get("view")?.toUpperCase();
      if (urlView && ["OFFICIAL_39", "MASTER", "CLASS", "TEACHER"].includes(urlView)) {
        store.setViewMode(urlView as any);
      }
    }
  }, []);

  const handleSwitchViewMode = (mode: "OFFICIAL_39" | "MASTER" | "CLASS" | "TEACHER") => {
    store.setViewMode(mode);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("view", mode.toLowerCase());
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans">
      {/* Top Navbar */}
      <Navbar
        schools={store.schools}
        currentSchoolId={store.currentSchoolId}
        onSelectSchool={(id) => {
          store.setCurrentSchoolId(id);
          store.setSelectedBranch("ALL");
          setGenerationResult(null);
        }}
        onAddSchool={() => setIsAddSchoolOpen(true)}
        zoomLevel={store.zoomLevel}
        onZoomChange={store.setZoomLevel}
        onGenerate={handleGenerate}
        onExport={handleExport}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenTariffication={() => setIsTarifficationOpen(true)}
        onOpenTeacherAdvisor={() => setIsTeacherAdvisorOpen(true)}
        onOpenVersions={() => setIsVersionsModalOpen(true)}
        onOpenA3Print={() => setIsA3PrintOpen(true)}
        onOpenTeacherCardsPrint={() => setIsTeacherCardsPrintOpen(true)}
        onOpenConflictModal={() => setIsConflictModalOpen(true)}
        conflictsCount={conflictDetectionResult.totalConflictsCount}
        onAutoFixConflicts={handleGenerate}
        onUndo={store.undo}
        canUndo={store.history.length > 0}
        isGenerating={store.isGenerating}
        selectedBranch={store.selectedBranch}
        onBranchChange={store.setSelectedBranch}
        branches={schoolBranches}
        syncStatus={store.syncStatus}
        onSyncCloud={async () => {
          const res = await store.syncToCloud();
          if (res.success) {
            showToast("✅ Barcha ma'lumotlar Neon PostgreSQL bulutiga to'liq sinxronlandi!");
          } else {
            showToast("Sinxronizatsiyada xatolik: " + (res.error || "Ulanish xatosi"), "error");
          }
        }}
      />

      {/* View Mode Switcher Sub-Header — Toza va Ixcham Rejimlar */}
      <div className="border-b border-border/80 bg-card/60 px-4 md:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* 4 ta Asosiy Dars Jadvali Ko'rinish Rejimi */}
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60">
          <button
            onClick={() => handleSwitchViewMode("OFFICIAL_39")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              store.viewMode === "OFFICIAL_39"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-1 ring-emerald-400/40"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-300" />
            <span>39-Maktab Rasmiy Jadvali (Excel)</span>
          </button>

          <button
            onClick={() => handleSwitchViewMode("MASTER")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              store.viewMode === "MASTER"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Master Doska (Interaktiv)</span>
          </button>

          <button
            onClick={() => handleSwitchViewMode("CLASS")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              store.viewMode === "CLASS"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Sinf Bo'yicha</span>
          </button>

          <button
            onClick={() => handleSwitchViewMode("TEACHER")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              store.viewMode === "TEACHER"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>O'qituvchi Bo'yicha</span>
          </button>
        </div>

        {/* O'ng tomon: Maktab statistikasi & Ziddiyatlar radari tugmasi */}
        <div className="flex items-center gap-2.5 text-xs">
          <button
            onClick={() => setIsConflictModalOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-all border shadow-sm cursor-pointer ${
              conflictDetectionResult.totalConflictsCount > 0
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 hover:bg-rose-500/20 border-rose-500/30"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30"
            }`}
            title="Dars jadvali ziddiyatlari radari"
          >
            {conflictDetectionResult.totalConflictsCount > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Radarni Ko'rish ({conflictDetectionResult.totalConflictsCount})</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Radar: 0 Ziddiyat</span>
              </>
            )}
          </button>

          <span className="text-muted-foreground hidden sm:inline">
            {currentSchool?.name}:{" "}
            <strong className="text-foreground">{schoolClasses.length} ta sinf</strong>,{" "}
            <strong className="text-foreground">{schoolTeachers.length} nafar o'qituvchi</strong>
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Generatsiya Xulosasi Kartasi (Banner) */}
        {generationResult && (
          <div className="border-b border-border bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent p-4 animate-in fade-in">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>{currentSchool?.name} — Darslar 1-darsdan boshlab tartiblandi:</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-extrabold">
                      {generationResult.stats.score}% Ziddiyatsiz
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ✅ {generationResult.stats.placedHours} ta dars to'liq joylashtirildi &bull;{" "}
                    {generationResult.stats.conflictsCount === 0 ? (
                      <span className="text-emerald-600 font-semibold">
                        0 ta ziddiyat (Oyna va bo'shliqlarsiz)
                      </span>
                    ) : (
                      <button
                        onClick={() => setIsConflictModalOpen(true)}
                        className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded-lg transition-all"
                        title="Ziddiyatlar tafsilotini ko'rish va AI bilan to'g'rilash"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>⚠️ {generationResult.stats.conflictsCount} ta dars bo'yicha ogohlantirish (Tafsilotlar)</span>
                      </button>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGenerationResult(null)}
                  className="rounded-lg p-1 hover:bg-muted text-muted-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic View Component */}
        <div className="flex-1">
          {schoolLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4 shadow-lg">
                <Building2 className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {currentSchool?.name} Dars Jadvali
              </h2>
              <p className="text-xs text-muted-foreground max-w-md mt-1 mb-6">
                Maktab sinflari ({schoolClasses.map((c) => c.name).join(", ") || "Hali kiritilmagan"}) va
                o'qituvchilari bo'yicha ziddiyatsiz tartibli jadvalni hisoblang.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 text-xs font-semibold shadow-md shadow-primary/20 cursor-pointer transition-all"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Avtomatik AI Generatsiya</span>
                </button>

                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground px-4 py-2.5 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <Settings2 className="h-4 w-4 text-primary" />
                  <span>Maktabni Sozlash (Wizard)</span>
                </button>

                <button
                  onClick={() => setIsImportOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground px-4 py-2.5 text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>1-Click Excel Import</span>
                </button>
              </div>
            </div>
          ) : store.viewMode === "OFFICIAL_39" ? (
            <Official39TableView
              classes={schoolClasses}
              subjects={schoolSubjects}
              teachers={schoolTeachers}
              rooms={schoolRooms}
              lessons={schoolLessons}
              branches={schoolBranches}
              shifts={schoolShifts}
              onLessonsChange={store.setLessons}
              onExportExcel={handleExport}
              onOpenZamena={(l) => setSelectedZamenaLesson(l)}
              zoomLevel={store.zoomLevel}
              onZoomChange={store.setZoomLevel}
              onUpdateSchoolInfo={(updates) => {
                const targetId = currentSchool?.id || store.currentSchoolId;
                if (targetId) {
                  store.updateSchoolInfo(targetId, updates);
                }
              }}
              onSetHomeroomTeacher={store.setHomeroomTeacher}
              schoolName={currentSchool?.name || "39 - umumiy o'rta ta'lim maktabi"}
              region={currentSchool?.region !== undefined ? currentSchool.region : "Muzrabot tumani"}
              directorName={currentSchool?.directorName !== undefined ? currentSchool.directorName : "M. Ramazonov"}
              vicePrincipalName={currentSchool?.vicePrincipalName !== undefined ? currentSchool.vicePrincipalName : "N. Narziqulov"}
              psychologistName={currentSchool?.psychologistName !== undefined ? currentSchool.psychologistName : "F.I.Sh"}
              academicYear={currentSchool?.academicYear !== undefined ? currentSchool.academicYear : "2025 - 2026"}
              approvalDate={currentSchool?.approvalDate !== undefined ? currentSchool.approvalDate : "2026-yil 28-mart"}
            />
          ) : store.viewMode === "CLASS" ? (
            <SingleClassView
              classes={schoolClasses}
              subjects={schoolSubjects}
              teachers={schoolTeachers}
              rooms={schoolRooms}
              lessons={schoolLessons}
              onOpenZamena={(l) => setSelectedZamenaLesson(l)}
            />
          ) : store.viewMode === "TEACHER" ? (
            <TeacherScheduleView
              classes={schoolClasses}
              subjects={schoolSubjects}
              teachers={schoolTeachers}
              rooms={schoolRooms}
              lessons={schoolLessons}
            />
          ) : (
            <MasterGrid
              classes={schoolClasses}
              subjects={schoolSubjects}
              teachers={schoolTeachers}
              rooms={schoolRooms}
              lessons={schoolLessons}
              branches={schoolBranches}
              shifts={schoolShifts}
              onLessonsChange={store.setLessons}
              onOpenZamena={(l) => setSelectedZamenaLesson(l)}
              zoomLevel={store.zoomLevel}
              selectedBranch={store.selectedBranch}
            />
          )}
        </div>
      </main>

      {/* Add School Modal */}
      {isAddSchoolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Yangi Maktab Qo'shish</h3>
              </div>
              <button
                onClick={() => setIsAddSchoolOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSchool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Maktab nomi:
                </label>
                <input
                  type="text"
                  required
                  value={newSchoolName}
                  onChange={(e) => setNewSchoolName(e.target.value)}
                  placeholder="Masalan: 45-Umumiy o'rta ta'lim maktabi"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddSchoolOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Qo'shish va Sozlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 Markazlashgan Modallar Hubi (Barcha 10 ta Modal Bitta Komponentda) */}
      <AppModalsContainer
        isWizardOpen={isWizardOpen}
        setIsWizardOpen={setIsWizardOpen}
        isImportOpen={isImportOpen}
        setIsImportOpen={setIsImportOpen}
        isTarifficationOpen={isTarifficationOpen}
        setIsTarifficationOpen={setIsTarifficationOpen}
        isTeacherAdvisorOpen={isTeacherAdvisorOpen}
        setIsTeacherAdvisorOpen={setIsTeacherAdvisorOpen}
        isVersionsModalOpen={isVersionsModalOpen}
        setIsVersionsModalOpen={setIsVersionsModalOpen}
        isConflictModalOpen={isConflictModalOpen}
        setIsConflictModalOpen={setIsConflictModalOpen}
        isGenModalOpen={isGenModalOpen}
        setIsGenModalOpen={setIsGenModalOpen}
        isA3PrintOpen={isA3PrintOpen}
        setIsA3PrintOpen={setIsA3PrintOpen}
        isTeacherCardsPrintOpen={isTeacherCardsPrintOpen}
        setIsTeacherCardsPrintOpen={setIsTeacherCardsPrintOpen}
        selectedZamenaLesson={selectedZamenaLesson}
        setSelectedZamenaLesson={setSelectedZamenaLesson}
        currentSchool={currentSchool}
        currentSchoolId={store.currentSchoolId}
        teachers={schoolTeachers}
        classes={schoolClasses}
        subjects={schoolSubjects}
        rooms={schoolRooms}
        shifts={schoolShifts}
        branches={schoolBranches}
        lessons={schoolLessons}
        generationResult={generationResult}
        isGenerating={store.isGenerating}
        onGenerate={handleGenerate}
        onSaveSetupWizard={(data) => {
          data.classes.forEach((c: any) => store.addClass({ ...c, schoolId: store.currentSchoolId }));
          data.teachers.forEach((t: any) => store.addTeacher({ ...t, schoolId: store.currentSchoolId }));
          data.subjects.forEach((s: any) => store.addSubject({ ...s, schoolId: store.currentSchoolId }));
          data.rooms.forEach((r: any) => store.addRoom({ ...r, schoolId: store.currentSchoolId }));
          showToast("Maktab ma'lumotlari muvaffaqiyatli saqlandi!");
        }}
        onImportSuccess={(data) => {
          data.classes.forEach((c: any) => store.addClass({ ...c, schoolId: store.currentSchoolId }));
          data.teachers.forEach((t: any) => store.addTeacher({ ...t, schoolId: store.currentSchoolId }));
          data.subjects.forEach((s: any) => store.addSubject({ ...s, schoolId: store.currentSchoolId }));
          showToast("Excel ma'lumotlari muvaffaqiyatli yuklandi!");
        }}
        onSaveClassSubjects={(updated) => {
          store.updateClasses(updated);
          showToast("Tarifikatsiya o'zgarishlari muvaffaqiyatli saqlandi!");
        }}
        onAssignReplacement={handleAssignReplacement}
        onVersionRestored={(restoredLessons, scheduleName) => {
          store.setLessons(restoredLessons);
          showToast(`✅ "${scheduleName}" versiyasi muvaffaqiyatli yuklandi va faollashtirildi!`);
        }}
        onSelectClass={(classId) => {
          store.setSelectedClassId(classId);
          store.setViewMode("CLASS");
        }}
        onViewOfficialSchedule={() => {
          store.setViewMode("OFFICIAL_39");
        }}
        showToast={showToast}
      />

      {/* Modern Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 right-6 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card/95 text-foreground px-4 py-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
              toastMessage.type === "error"
                ? "bg-rose-500/15 text-rose-600"
                : toastMessage.type === "info"
                ? "bg-primary/15 text-primary"
                : "bg-emerald-500/15 text-emerald-600"
            }`}
          >
            {toastMessage.type === "error" ? "✕" : "✓"}
          </div>
          <p className="text-xs font-bold">{toastMessage.text}</p>
        </div>
      )}
    </div>
  );
}
