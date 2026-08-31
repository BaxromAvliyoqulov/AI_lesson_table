"use client";

import React, { useState, useMemo } from "react";
import { useSchoolStore } from "@/lib/store/useSchoolStore";
import { Navbar } from "@/components/layout/Navbar";
import { MasterGrid } from "@/components/master-grid/MasterGrid";
import { SingleClassView } from "@/components/views/SingleClassView";
import { TeacherScheduleView } from "@/components/views/TeacherScheduleView";
import { SetupWizard } from "@/components/wizard/SetupWizard";
import { ZamenaModal } from "@/components/zamena/ZamenaModal";
import { ExcelImportModal } from "@/components/excel/ExcelImportModal";
import { exportScheduleToExcel } from "@/lib/excel/excel-export";
import { CSPSolver } from "@/lib/solver/csp-solver";
import { Lesson, SolverResult } from "@/types";
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
} from "lucide-react";

export default function HomePage() {
  const store = useSchoolStore();

  // Local UI modal states
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState("");
  const [selectedZamenaLesson, setSelectedZamenaLesson] = useState<Lesson | null>(null);
  const [generationResult, setGenerationResult] = useState<SolverResult | null>(null);

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
  const schoolBranches = store.branches.filter((b) => b.schoolId === store.currentSchoolId);
  const schoolShifts = store.shifts.filter((s) => s.schoolId === store.currentSchoolId);
  const schoolSubjects = store.subjects.filter((s) => s.schoolId === store.currentSchoolId);
  const schoolTeachers = store.teachers.filter((t) => t.schoolId === store.currentSchoolId);
  const schoolRooms = store.rooms.filter((r) => r.schoolId === store.currentSchoolId);
  const schoolClasses = store.classes.filter((c) => c.schoolId === store.currentSchoolId);
  const schoolLessons = store.lessons.filter((l) => l.schoolId === store.currentSchoolId);

  // AI & CSP Generator
  const handleGenerate = () => {
    if (schoolClasses.length === 0 || schoolTeachers.length === 0) {
      showToast("Avval maktab o'qituvchilari va sinflarini sozlang!", "error");
      setIsWizardOpen(true);
      return;
    }

    store.setIsGenerating(true);
    setGenerationResult(null);

    setTimeout(() => {
      const solver = new CSPSolver({
        classes: schoolClasses,
        teachers: schoolTeachers,
        subjects: schoolSubjects,
        rooms: schoolRooms,
        shifts: schoolShifts,
        branches: schoolBranches,
      });

      const result = solver.solve();
      store.setLessons(result.lessons);
      setGenerationResult(result);
      store.setIsGenerating(false);
      showToast(`✅ Dars jadvali muvaffaqiyatli generatsiya qilindi! (${result.lessons.length} ta dars)`);
    }, 400);
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
      region: "Muzrabot tumani",
      directorFullName: "M. Ramazonov",
      academicVicePrincipalName: "N. Narziqulov",
      psychologistName: "F.I.Sh",
      academicYear: "2025-2026",
      termName: "1-chorak",
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
        onUndo={store.undo}
        canUndo={store.history.length > 0}
        isGenerating={store.isGenerating}
        selectedBranch={store.selectedBranch}
        onBranchChange={store.setSelectedBranch}
        branches={schoolBranches}
      />

      {/* View Mode Switcher Sub-Header */}
      <div className="border-b border-border/80 bg-card/60 px-4 md:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-xl border border-border/60">
          <button
            onClick={() => store.setViewMode("CLASS")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              store.viewMode === "CLASS"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Sinf Bo'yicha Jadval</span>
          </button>

          <button
            onClick={() => store.setViewMode("TEACHER")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              store.viewMode === "TEACHER"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>O'qituvchi Jadvali</span>
          </button>

          <button
            onClick={() => store.setViewMode("MASTER")}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              store.viewMode === "MASTER"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>Umumiy Master Doska</span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>
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
                      <span className="text-amber-600 font-semibold">
                        ⚠️ {generationResult.stats.conflictsCount} ta dars bo'yicha ogohlantirish
                      </span>
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

      {/* Setup Wizard */}
      <SetupWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        branches={schoolBranches}
        shifts={schoolShifts}
        subjects={schoolSubjects}
        teachers={schoolTeachers}
        rooms={schoolRooms}
        classes={schoolClasses}
        onSave={(data) => {
          data.classes.forEach((c) => store.addClass({ ...c, schoolId: store.currentSchoolId }));
          data.teachers.forEach((t) => store.addTeacher({ ...t, schoolId: store.currentSchoolId }));
          data.subjects.forEach((s) => store.addSubject({ ...s, schoolId: store.currentSchoolId }));
          data.rooms.forEach((r) => store.addRoom({ ...r, schoolId: store.currentSchoolId }));
          showToast("Maktab ma'lumotlari muvaffaqiyatli saqlandi!");
        }}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={(data) => {
          data.classes.forEach((c) => store.addClass({ ...c, schoolId: store.currentSchoolId }));
          data.teachers.forEach((t) => store.addTeacher({ ...t, schoolId: store.currentSchoolId }));
          data.subjects.forEach((s) => store.addSubject({ ...s, schoolId: store.currentSchoolId }));
          showToast("Excel ma'lumotlari muvaffaqiyatli yuklandi!");
        }}
      />

      {/* Zamena Modal */}
      <ZamenaModal
        isOpen={!!selectedZamenaLesson}
        onClose={() => setSelectedZamenaLesson(null)}
        lesson={selectedZamenaLesson}
        subject={schoolSubjects.find((s) => s.id === selectedZamenaLesson?.subjectId)}
        originalTeacher={schoolTeachers.find((t) => t.id === selectedZamenaLesson?.teacherId)}
        classObj={schoolClasses.find((c) => c.id === selectedZamenaLesson?.classId)}
        allTeachers={schoolTeachers}
        allLessons={schoolLessons}
        onAssignReplacement={handleAssignReplacement}
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
