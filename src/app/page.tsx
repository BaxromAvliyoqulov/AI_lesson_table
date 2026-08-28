"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MasterGrid } from "@/components/master-grid/MasterGrid";
import { SetupWizard } from "@/components/wizard/SetupWizard";
import { ZamenaModal } from "@/components/zamena/ZamenaModal";
import { ExcelImportModal } from "@/components/excel/ExcelImportModal";
import { exportScheduleToExcel } from "@/lib/excel/excel-export";
import { CSPSolver } from "@/lib/solver/csp-solver";
import {
  initialSchools,
  initialBranches,
  initialShifts,
  initialRooms,
  initialSubjects,
  initialTeachers,
  initialClasses,
} from "@/lib/mock-data";
import {
  SchoolInfo,
  Branch,
  Shift,
  Subject,
  Teacher,
  Room,
  SchoolClass,
  Lesson,
  SolverResult,
} from "@/types";
import {
  Sparkles,
  Layers,
  FileSpreadsheet,
  Settings2,
  Building2,
  X,
  Plus,
} from "lucide-react";

export default function HomePage() {
  const [schools, setSchools] = useState<SchoolInfo[]>(initialSchools);
  const [currentSchoolId, setCurrentSchoolId] = useState<string>("school_39"); // Default: 39-maktab

  const [allBranches, setAllBranches] = useState<Branch[]>(initialBranches);
  const [allShifts, setAllShifts] = useState<Shift[]>(initialShifts);
  const [allSubjects, setAllSubjects] = useState<Subject[]>(initialSubjects);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>(initialTeachers);
  const [allRooms, setAllRooms] = useState<Room[]>(initialRooms);
  const [allClasses, setAllClasses] = useState<SchoolClass[]>(initialClasses);

  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [history, setHistory] = useState<Lesson[][]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationResult, setGenerationResult] = useState<SolverResult | null>(null);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [isAddSchoolOpen, setIsAddSchoolOpen] = useState<boolean>(false);
  const [newSchoolName, setNewSchoolName] = useState<string>("");
  const [selectedZamenaLesson, setSelectedZamenaLesson] = useState<Lesson | null>(null);

  // Joriy tanlangan maktab ma'lumotlarini filtrlash (Multi-tenant)
  const currentSchool = useMemo(
    () => schools.find((s) => s.id === currentSchoolId) || schools[0],
    [schools, currentSchoolId]
  );

  const schoolBranches = useMemo(
    () => allBranches.filter((b) => b.schoolId === currentSchoolId),
    [allBranches, currentSchoolId]
  );

  const schoolShifts = useMemo(
    () => allShifts.filter((s) => s.schoolId === currentSchoolId),
    [allShifts, currentSchoolId]
  );

  const schoolSubjects = useMemo(
    () => allSubjects.filter((s) => s.schoolId === currentSchoolId),
    [allSubjects, currentSchoolId]
  );

  const schoolTeachers = useMemo(
    () => allTeachers.filter((t) => t.schoolId === currentSchoolId),
    [allTeachers, currentSchoolId]
  );

  const schoolRooms = useMemo(
    () => allRooms.filter((r) => r.schoolId === currentSchoolId),
    [allRooms, currentSchoolId]
  );

  const schoolClasses = useMemo(
    () => allClasses.filter((c) => c.schoolId === currentSchoolId),
    [allClasses, currentSchoolId]
  );

  const schoolLessons = useMemo(
    () => allLessons.filter((l) => l.schoolId === currentSchoolId),
    [allLessons, currentSchoolId]
  );

  // Darslar o'zgarganda (Drag, Drop, Swap)
  const handleSchoolLessonsChange = useCallback(
    (newLessons: Lesson[]) => {
      setHistory((prev) => [...prev.slice(-15), allLessons]);
      // Faqat boshqa maktablar darslarini saqlab, joriy maktab darslarini yangilash
      setAllLessons((prev) => [
        ...prev.filter((l) => l.schoolId !== currentSchoolId),
        ...newLessons,
      ]);
    },
    [allLessons, currentSchoolId]
  );

  // Undo (Ctrl+Z)
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setAllLessons(previous);
  }, [history]);

  // AI & CSP Dvigateli orqali generatsiya qilish
  const handleGenerate = () => {
    if (schoolClasses.length === 0 || schoolTeachers.length === 0) {
      alert("Avval maktab o'qituvchilari va sinflarini sozlang yoki Exceldan yuklang!");
      setIsWizardOpen(true);
      return;
    }

    setIsGenerating(true);
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
      handleSchoolLessonsChange(result.lessons);
      setGenerationResult(result);
      setIsGenerating(false);
    }, 400);
  };

  // Excel Export
  const handleExport = () => {
    if (schoolLessons.length === 0) {
      alert("Avval dars jadvalini generatsiya qiling!");
      return;
    }
    exportScheduleToExcel({
      classes:
        selectedBranch === "ALL"
          ? schoolClasses
          : schoolClasses.filter((c) => c.branchId === selectedBranch),
      subjects: schoolSubjects,
      teachers: schoolTeachers,
      rooms: schoolRooms,
      lessons: schoolLessons,
      schoolName: currentSchool?.name || "Maktab",
    });
  };

  // Yangi maktab qo'shish
  const handleCreateSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchoolName.trim()) return;

    const newId = `school_${Date.now()}`;
    const newSch: SchoolInfo = {
      id: newId,
      name: newSchoolName.trim(),
      slug: newSchoolName.toLowerCase().replace(/\s+/g, "-"),
      branchesCount: 1,
      classesCount: 0,
      teachersCount: 0,
    };

    setSchools([...schools, newSch]);
    setCurrentSchoolId(newId);

    // Yangi maktab uchun standart filial va smena yaratish
    const defaultBranch: Branch = {
      id: `b_${Date.now()}`,
      schoolId: newId,
      name: `${newSchoolName} Asosiy Bino`,
      isMain: true,
    };
    const defaultShift: Shift = {
      id: `s_${Date.now()}`,
      schoolId: newId,
      name: "1-Smena",
      startTime: "08:00",
      endTime: "13:00",
      periodsCount: 6,
    };

    setAllBranches([...allBranches, defaultBranch]);
    setAllShifts([...allShifts, defaultShift]);
    setNewSchoolName("");
    setIsAddSchoolOpen(false);

    // Darhol sozlash oynasini ochish
    setIsWizardOpen(true);
  };

  // Zamena tayinlash
  const handleAssignReplacement = (
    lessonId: string,
    replacementTeacherId: string,
    reason: string
  ) => {
    const updated = schoolLessons.map((l) =>
      l.id === lessonId ? { ...l, teacherId: replacementTeacherId } : l
    );
    handleSchoolLessonsChange(updated);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navbar */}
      <Navbar
        schools={schools}
        currentSchoolId={currentSchoolId}
        onSelectSchool={(id) => {
          setCurrentSchoolId(id);
          setSelectedBranch("ALL");
          setGenerationResult(null);
        }}
        onAddSchool={() => setIsAddSchoolOpen(true)}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
        onGenerate={handleGenerate}
        onExport={handleExport}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenImport={() => setIsImportOpen(true)}
        onUndo={handleUndo}
        canUndo={history.length > 0}
        isGenerating={isGenerating}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        branches={schoolBranches}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {/* Generatsiya Xulosasi Kartasi (Banner) */}
        {generationResult && (
          <div className="border-b border-border bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent p-4 animate-in fade-in">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>{currentSchool?.name} — AI & CSP Solver Natijasi:</span>
                    <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-extrabold">
                      {generationResult.stats.score}% Ziddiyatsiz
                    </span>
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    ✅ {generationResult.stats.placedHours} ta dars joylashtirildi &bull;{" "}
                    {generationResult.stats.conflictsCount > 0 ? (
                      <span className="text-amber-600 font-semibold">
                        ⚠️ {generationResult.stats.conflictsCount} ta dars bo&apos;yicha ogohlantirish
                      </span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">
                        0 ta ziddiyat (Ideal taqsimot)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGenerationResult(null)}
                  className="rounded-lg p-1 hover:bg-muted text-muted-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Master Grid Doskasi */}
        <div className="flex-1">
          {schoolLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[65vh] p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 mb-4 shadow-lg shadow-blue-500/10">
                <Building2 className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                {currentSchool?.name} Dars Jadvali
              </h2>
              <p className="text-xs text-muted-foreground max-w-md mt-1 mb-6">
                Maktab o&apos;qituvchilari ({schoolTeachers.length} nafar), sinflar (
                {schoolClasses.length} ta) va SanPiN talablari asosida avtomatik ziddiyatsiz
                jadvalni generatsiya qiling yoki ma&apos;lumotlarni tahrirlang.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={handleGenerate}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-xs font-semibold shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Avtomatik AI Generatsiya</span>
                </button>

                <button
                  onClick={() => setIsWizardOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground px-4 py-2.5 text-xs font-semibold shadow-sm transition-all"
                >
                  <Settings2 className="h-4 w-4 text-blue-600" />
                  <span>Maktabni Sozlash (Wizard)</span>
                </button>

                <button
                  onClick={() => setIsImportOpen(true)}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground px-4 py-2.5 text-xs font-semibold shadow-sm transition-all"
                >
                  <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                  <span>1-Click Excel Import</span>
                </button>
              </div>
            </div>
          ) : (
            <MasterGrid
              classes={schoolClasses}
              subjects={schoolSubjects}
              teachers={schoolTeachers}
              rooms={schoolRooms}
              lessons={schoolLessons}
              onLessonsChange={handleSchoolLessonsChange}
              onOpenZamena={(l) => setSelectedZamenaLesson(l)}
              zoomLevel={zoomLevel}
              selectedBranch={selectedBranch}
            />
          )}
        </div>
      </main>

      {/* Yangi Maktab Qo'shish Modali */}
      {isAddSchoolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-sm text-foreground">Yangi Maktab Qo&apos;shish</h3>
              </div>
              <button
                onClick={() => setIsAddSchoolOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground"
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
                  placeholder="Masalan: 39-Umumiy o'rta ta'lim maktabi"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddSchoolOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-semibold shadow-md flex items-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Qo&apos;shish va Sozlash</span>
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
          setAllBranches((prev) => [
            ...prev.filter((b) => b.schoolId !== currentSchoolId),
            ...data.branches.map((b) => ({ ...b, schoolId: currentSchoolId })),
          ]);
          setAllShifts((prev) => [
            ...prev.filter((s) => s.schoolId !== currentSchoolId),
            ...data.shifts.map((s) => ({ ...s, schoolId: currentSchoolId })),
          ]);
          setAllSubjects((prev) => [
            ...prev.filter((s) => s.schoolId !== currentSchoolId),
            ...data.subjects.map((s) => ({ ...s, schoolId: currentSchoolId })),
          ]);
          setAllTeachers((prev) => [
            ...prev.filter((t) => t.schoolId !== currentSchoolId),
            ...data.teachers.map((t) => ({ ...t, schoolId: currentSchoolId })),
          ]);
          setAllRooms((prev) => [
            ...prev.filter((r) => r.schoolId !== currentSchoolId),
            ...data.rooms.map((r) => ({ ...r, schoolId: currentSchoolId })),
          ]);
          setAllClasses((prev) => [
            ...prev.filter((c) => c.schoolId !== currentSchoolId),
            ...data.classes.map((c) => ({ ...c, schoolId: currentSchoolId })),
          ]);
        }}
      />

      {/* Excel Import */}
      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={(data) => {
          setAllSubjects((prev) => [
            ...prev.filter((s) => s.schoolId !== currentSchoolId),
            ...data.subjects.map((s) => ({ ...s, schoolId: currentSchoolId })),
          ]);
          setAllTeachers((prev) => [
            ...prev.filter((t) => t.schoolId !== currentSchoolId),
            ...data.teachers.map((t) => ({ ...t, schoolId: currentSchoolId })),
          ]);
          setAllClasses((prev) => [
            ...prev.filter((c) => c.schoolId !== currentSchoolId),
            ...data.classes.map((c) => ({ ...c, schoolId: currentSchoolId })),
          ]);
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
    </div>
  );
}
