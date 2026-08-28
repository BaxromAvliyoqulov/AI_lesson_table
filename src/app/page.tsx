"use client";

import React, { useState, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { MasterGrid } from "@/components/master-grid/MasterGrid";
import { SetupWizard } from "@/components/wizard/SetupWizard";
import { ZamenaModal } from "@/components/zamena/ZamenaModal";
import { ExcelImportModal } from "@/components/excel/ExcelImportModal";
import { exportScheduleToExcel } from "@/lib/excel/excel-export";
import { CSPSolver } from "@/lib/solver/csp-solver";
import {
  initialBranches,
  initialShifts,
  initialRooms,
  initialSubjects,
  initialTeachers,
  initialClasses,
} from "@/lib/mock-data";
import {
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
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Users,
  School as SchoolIcon,
  X,
} from "lucide-react";

export default function HomePage() {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [history, setHistory] = useState<Lesson[][]>([]);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationResult, setGenerationResult] = useState<SolverResult | null>(null);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [isImportOpen, setIsImportOpen] = useState<boolean>(false);
  const [selectedZamenaLesson, setSelectedZamenaLesson] = useState<Lesson | null>(null);

  // Darslar o'zgarganda (Drag, Drop, Swap) — Tarixni saqlash (Undo uchun)
  const handleLessonsChange = useCallback(
    (newLessons: Lesson[]) => {
      setHistory((prev) => [...prev.slice(-15), lessons]);
      setLessons(newLessons);
    },
    [lessons]
  );

  // Undo (Ctrl+Z)
  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setLessons(previous);
  }, [history]);

  // AI & CSP Dvigateli orqali generatsiya qilish
  const handleGenerate = () => {
    setIsGenerating(true);
    setGenerationResult(null);

    setTimeout(() => {
      const solver = new CSPSolver({
        classes,
        teachers,
        subjects,
        rooms,
        shifts,
        branches,
      });

      const result = solver.solve();
      setLessons(result.lessons);
      setGenerationResult(result);
      setIsGenerating(false);
    }, 400);
  };

  // Excel Export
  const handleExport = () => {
    if (lessons.length === 0) {
      alert("Avval dars jadvalini generatsiya qiling!");
      return;
    }
    exportScheduleToExcel({
      classes: selectedBranch === "ALL" ? classes : classes.filter((c) => c.branchId === selectedBranch),
      subjects,
      teachers,
      rooms,
      lessons,
      schoolName: "21-Maktab",
    });
  };

  // Zamena tayinlash
  const handleAssignReplacement = (
    lessonId: string,
    replacementTeacherId: string,
    reason: string
  ) => {
    const updated = lessons.map((l) =>
      l.id === lessonId ? { ...l, teacherId: replacementTeacherId } : l
    );
    handleLessonsChange(updated);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navbar */}
      <Navbar
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
        branches={branches}
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
                    <span>AI & CSP Solver Natijasi:</span>
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
          {lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 mb-4 shadow-lg shadow-blue-500/10">
                <Layers className="h-8 w-8" />
              </div>
              <h2 className="text-lg font-bold text-foreground">
                Dars Jadvali Hali Yaratilmagan
              </h2>
              <p className="text-xs text-muted-foreground max-w-md mt-1 mb-6">
                Tizimdagi barcha o&apos;qituvchilar, filiallar va SanPiN talablari asosida
                avtomatik dars jadvalini hisoblash uchun tugmani bosing yoki Exceldan yuklang.
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
              classes={classes}
              subjects={subjects}
              teachers={teachers}
              rooms={rooms}
              lessons={lessons}
              onLessonsChange={handleLessonsChange}
              onOpenZamena={(l) => setSelectedZamenaLesson(l)}
              zoomLevel={zoomLevel}
              selectedBranch={selectedBranch}
            />
          )}
        </div>
      </main>

      {/* Modallar */}
      <SetupWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        branches={branches}
        shifts={shifts}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        classes={classes}
        onSave={(data) => {
          setBranches(data.branches);
          setShifts(data.shifts);
          setSubjects(data.subjects);
          setTeachers(data.teachers);
          setRooms(data.rooms);
          setClasses(data.classes);
        }}
      />

      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={(data) => {
          setSubjects(data.subjects);
          setTeachers(data.teachers);
          setClasses(data.classes);
        }}
      />

      <ZamenaModal
        isOpen={!!selectedZamenaLesson}
        onClose={() => setSelectedZamenaLesson(null)}
        lesson={selectedZamenaLesson}
        subject={subjects.find((s) => s.id === selectedZamenaLesson?.subjectId)}
        originalTeacher={teachers.find((t) => t.id === selectedZamenaLesson?.teacherId)}
        classObj={classes.find((c) => c.id === selectedZamenaLesson?.classId)}
        allTeachers={teachers}
        allLessons={lessons}
        onAssignReplacement={handleAssignReplacement}
      />
    </div>
  );
}
