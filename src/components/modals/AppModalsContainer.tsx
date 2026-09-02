"use client";

import React from "react";
import { Lesson, SchoolClass, Subject, Teacher, Room, Shift, Branch, SchoolInfo, SolverResult } from "@/types";
import { SetupWizard } from "@/components/wizard/SetupWizard";
import { ExcelImportModal } from "@/components/excel/ExcelImportModal";
import { TarifficationMatrixModal } from "@/components/tariffication/TarifficationMatrixModal";
import { AITeacherWorkloadAdvisorModal } from "@/components/generator/AITeacherWorkloadAdvisorModal";
import { ScheduleVersionsModal } from "@/components/versioning/ScheduleVersionsModal";
import { OfficialSchedulePrintModal } from "@/components/print/OfficialSchedulePrintModal";
import { TeacherTimetableCardsModal } from "@/components/print/TeacherTimetableCardsModal";
import { AIGenerationProgressModal } from "@/components/generator/AIGenerationProgressModal";
import { ScheduleConflictAuditModal } from "@/components/audit/ScheduleConflictAuditModal";
import { ZamenaModal } from "@/components/zamena/ZamenaModal";

export interface AppModalsContainerProps {
  // Modal visibility states
  isWizardOpen: boolean;
  setIsWizardOpen: (open: boolean) => void;
  isImportOpen: boolean;
  setIsImportOpen: (open: boolean) => void;
  isTarifficationOpen: boolean;
  setIsTarifficationOpen: (open: boolean) => void;
  isTeacherAdvisorOpen: boolean;
  setIsTeacherAdvisorOpen: (open: boolean) => void;
  isVersionsModalOpen: boolean;
  setIsVersionsModalOpen: (open: boolean) => void;
  isConflictModalOpen: boolean;
  setIsConflictModalOpen: (open: boolean) => void;
  isGenModalOpen: boolean;
  setIsGenModalOpen: (open: boolean) => void;
  isA3PrintOpen: boolean;
  setIsA3PrintOpen: (open: boolean) => void;
  isTeacherCardsPrintOpen: boolean;
  setIsTeacherCardsPrintOpen: (open: boolean) => void;
  selectedZamenaLesson: Lesson | null;
  setSelectedZamenaLesson: (lesson: Lesson | null) => void;

  // School data
  currentSchool: SchoolInfo | null;
  currentSchoolId: string;
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  rooms: Room[];
  shifts: Shift[];
  branches: Branch[];
  lessons: Lesson[];

  // Generation result & state
  generationResult: SolverResult | null;
  isGenerating: boolean;

  // Action callbacks
  onGenerate: () => void;
  onSaveSetupWizard?: (data: any) => void;
  onImportSuccess?: (data: any) => void;
  onSaveClassSubjects?: (updated: SchoolClass[]) => void;
  onAssignReplacement?: (lessonId: string, replacementTeacherId: string, reason: string) => void;
  onVersionRestored: (lessons: Lesson[], scheduleName: string) => void;
  onSelectClass?: (classId: string) => void;
  onViewOfficialSchedule: () => void;
  showToast: (text: string, type?: "success" | "error" | "info") => void;
}

export const AppModalsContainer: React.FC<AppModalsContainerProps> = ({
  isWizardOpen,
  setIsWizardOpen,
  isImportOpen,
  setIsImportOpen,
  isTarifficationOpen,
  setIsTarifficationOpen,
  isTeacherAdvisorOpen,
  setIsTeacherAdvisorOpen,
  isVersionsModalOpen,
  setIsVersionsModalOpen,
  isConflictModalOpen,
  setIsConflictModalOpen,
  isGenModalOpen,
  setIsGenModalOpen,
  isA3PrintOpen,
  setIsA3PrintOpen,
  isTeacherCardsPrintOpen,
  setIsTeacherCardsPrintOpen,
  selectedZamenaLesson,
  setSelectedZamenaLesson,

  currentSchool,
  currentSchoolId,
  teachers,
  classes,
  subjects,
  rooms,
  shifts,
  branches,
  lessons,

  generationResult,
  isGenerating,

  onGenerate,
  onSaveSetupWizard,
  onImportSuccess,
  onSaveClassSubjects,
  onAssignReplacement,
  onVersionRestored,
  onSelectClass,
  onViewOfficialSchedule,
  showToast,
}) => {
  return (
    <>
      {/* 1. Setup Wizard */}
      <SetupWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        branches={branches}
        shifts={shifts}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        classes={classes}
        onSave={(data: any) => {
          if (onSaveSetupWizard) onSaveSetupWizard(data);
          setIsWizardOpen(false);
        }}
      />

      {/* 2. Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={(data: any) => {
          if (onImportSuccess) onImportSuccess(data);
          setIsImportOpen(false);
        }}
      />

      {/* 3. Tarifikatsiya Matritsasi Modali */}
      <TarifficationMatrixModal
        isOpen={isTarifficationOpen}
        onClose={() => setIsTarifficationOpen(false)}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        branches={branches}
        onSaveClassSubjects={onSaveClassSubjects || (() => {})}
        onGenerateAI={onGenerate}
        isGenerating={isGenerating}
      />

      {/* 4. Zamena (Dars Almashtirish) Modali */}
      {selectedZamenaLesson && (
        <ZamenaModal
          isOpen={!!selectedZamenaLesson}
          onClose={() => setSelectedZamenaLesson(null)}
          lesson={selectedZamenaLesson}
          subject={subjects.find((s) => s.id === selectedZamenaLesson.subjectId)}
          originalTeacher={teachers.find((t) => t.id === selectedZamenaLesson.teacherId)}
          classObj={classes.find((c) => c.id === selectedZamenaLesson.classId)}
          allTeachers={teachers}
          allLessons={lessons}
          onAssignReplacement={(lId, rTId, reason) => {
            if (onAssignReplacement) onAssignReplacement(lId, rTId, reason);
            setSelectedZamenaLesson(null);
          }}
        />
      )}

      {/* 5. Rasmiy A3 Formatda Chop Etish Modali */}
      <OfficialSchedulePrintModal
        isOpen={isA3PrintOpen}
        onClose={() => setIsA3PrintOpen(false)}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        rooms={rooms}
        lessons={lessons}
        schoolName={currentSchool?.name}
        region={currentSchool?.region}
        directorName={currentSchool?.directorName}
        vicePrincipalName={currentSchool?.vicePrincipalName}
        psychologistName={currentSchool?.psychologistName}
        academicYear={currentSchool?.academicYear}
        approvalDate={currentSchool?.approvalDate}
      />

      {/* 6. Ustozlar Shaxsiy Kartochkalari Chop Etish Modali */}
      <TeacherTimetableCardsModal
        isOpen={isTeacherCardsPrintOpen}
        onClose={() => setIsTeacherCardsPrintOpen(false)}
        teachers={teachers}
        classes={classes}
        subjects={subjects}
        rooms={rooms}
        lessons={lessons}
        schoolName={currentSchool?.name}
        academicYear={currentSchool?.academicYear}
      />

      {/* 7. AI Generatsiya Jarayoni & Natijasi Modali */}
      <AIGenerationProgressModal
        isOpen={isGenModalOpen}
        isGenerating={isGenerating}
        result={generationResult}
        onClose={() => setIsGenModalOpen(false)}
        onViewSchedule={() => {
          setIsGenModalOpen(false);
          onViewOfficialSchedule();
        }}
        onPrintA3={() => {
          setIsGenModalOpen(false);
          setIsA3PrintOpen(true);
        }}
      />

      {/* 8. AI Ustozlar Yuklamasi, Smena va Bino Maslahatchisi Modali */}
      <AITeacherWorkloadAdvisorModal
        isOpen={isTeacherAdvisorOpen}
        onClose={() => setIsTeacherAdvisorOpen(false)}
        teachers={teachers}
        classes={classes}
        subjects={subjects}
        branches={branches}
        shifts={shifts}
        lessons={lessons}
        onApplyAIConstraints={() => {
          onGenerate();
          showToast("✨ AI Ustoz me'yorlari va smena/bino logistikasi dars jadvaliga muvaffaqiyatli qo'llandi!");
        }}
      />

      {/* 9. Dars Jadvali Versiyalari va Arxiv Modali */}
      <ScheduleVersionsModal
        isOpen={isVersionsModalOpen}
        onClose={() => setIsVersionsModalOpen(false)}
        schoolId={currentSchoolId}
        currentLessons={lessons}
        academicYear={currentSchool?.academicYear}
        onVersionRestored={onVersionRestored}
        showToast={showToast}
        onPrintA3={() => {
          setIsVersionsModalOpen(false);
          setIsA3PrintOpen(true);
        }}
      />

      {/* 10. Dars Jadvali Ziddiyatlari va Tahlil Radari Modali */}
      <ScheduleConflictAuditModal
        isOpen={isConflictModalOpen}
        onClose={() => setIsConflictModalOpen(false)}
        lessons={lessons}
        classes={classes}
        subjects={subjects}
        teachers={teachers}
        onAutoFixAI={onGenerate}
        onSelectClass={onSelectClass}
      />
    </>
  );
};
