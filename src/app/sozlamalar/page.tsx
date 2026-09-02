"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSchoolStore } from "@/lib/store/useSchoolStore";
import { SchoolClass, Teacher, Subject, Room, ClassSubject, TeacherAvailability, BellPeriod } from "@/types";
import { ClassesTab } from "@/components/settings/tabs/ClassesTab";
import { TeachersTab } from "@/components/settings/tabs/TeachersTab";
import { AvailabilityTab } from "@/components/settings/tabs/AvailabilityTab";
import { SubjectsTab } from "@/components/settings/tabs/SubjectsTab";
import { RoomsTab } from "@/components/settings/tabs/RoomsTab";
import { BellsTab } from "@/components/settings/tabs/BellsTab";
import { SchoolInfoTab } from "@/components/settings/tabs/SchoolInfoTab";
import { ClassModal } from "@/components/settings/modals/ClassModal";
import { TeacherModal } from "@/components/settings/modals/TeacherModal";
import { SubjectModal } from "@/components/settings/modals/SubjectModal";
import { RoomModal } from "@/components/settings/modals/RoomModal";
import { CurriculumModal } from "@/components/settings/modals/CurriculumModal";
import { TeacherWorkloadModal } from "@/components/settings/modals/TeacherWorkloadModal";
import { EMaktabImportModal } from "@/components/settings/modals/EMaktabImportModal";
import {
  GraduationCap,
  Users,
  Calendar,
  BookOpen,
  DoorOpen,
  Clock,
  School as SchoolIcon,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";

type SettingTab =
  | "CLASSES"
  | "TEACHERS"
  | "AVAILABILITY"
  | "SUBJECTS"
  | "ROOMS"
  | "BELLS"
  | "SCHOOL_INFO";

export default function SettingsPage() {
  const store = useSchoolStore();
  const [activeTab, setActiveTab] = useState<SettingTab>("CLASSES");

  // Modal states
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  const [isCurriculumModalOpen, setIsCurriculumModalOpen] = useState(false);
  const [curriculumClass, setCurriculumClass] = useState<SchoolClass | null>(null);

  const [isWorkloadModalOpen, setIsWorkloadModalOpen] = useState(false);
  const [workloadTeacher, setWorkloadTeacher] = useState<Teacher | null>(null);
  const [isEMaktabModalOpen, setIsEMaktabModalOpen] = useState(false);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Filter school data by current school ID
  const currentSchool =
    store.schools.find((s) => s.id === store.currentSchoolId) || store.schools[0];
  const schoolBranches = store.branches.filter((b) => b.schoolId === store.currentSchoolId).length > 0
    ? store.branches.filter((b) => b.schoolId === store.currentSchoolId)
    : store.branches;
  const schoolShifts = store.shifts.filter((s) => s.schoolId === store.currentSchoolId).length > 0
    ? store.shifts.filter((s) => s.schoolId === store.currentSchoolId)
    : store.shifts;
  const schoolClasses = store.classes.filter((c) => c.schoolId === store.currentSchoolId).length > 0
    ? store.classes.filter((c) => c.schoolId === store.currentSchoolId)
    : store.classes;
  const schoolTeachers = store.teachers.filter((t) => t.schoolId === store.currentSchoolId).length > 0
    ? store.teachers.filter((t) => t.schoolId === store.currentSchoolId)
    : store.teachers;
  const schoolSubjects = store.subjects.filter((s) => s.schoolId === store.currentSchoolId).length > 0
    ? store.subjects.filter((s) => s.schoolId === store.currentSchoolId)
    : store.subjects;
  const schoolRooms = store.rooms.filter((r) => r.schoolId === store.currentSchoolId).length > 0
    ? store.rooms.filter((r) => r.schoolId === store.currentSchoolId)
    : store.rooms;

  // Tab definitions
  const tabs = [
    { id: "CLASSES" as SettingTab, label: "Sinflar", icon: GraduationCap, count: schoolClasses.length },
    { id: "TEACHERS" as SettingTab, label: "O'qituvchilar", icon: Users, count: schoolTeachers.length },
    { id: "AVAILABILITY" as SettingTab, label: "Bo'sh vaqtlar", icon: Calendar },
    { id: "SUBJECTS" as SettingTab, label: "Fanlar", icon: BookOpen, count: schoolSubjects.length },
    { id: "ROOMS" as SettingTab, label: "Xonalar", icon: DoorOpen, count: schoolRooms.length },
    { id: "BELLS" as SettingTab, label: "Qo'ng'iroqlar", icon: Clock },
    { id: "SCHOOL_INFO" as SettingTab, label: "Maktab profili", icon: SchoolIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl animate-in slide-in-from-top-4 duration-200">
          {toast.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          )}
          <span className="text-xs font-semibold text-foreground">{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border border-border hover:bg-muted text-foreground transition-all cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-primary" />
                <span>Jadvalga qaytish</span>
              </Link>
              <div className="h-5 w-px bg-border/80 hidden sm:block" />
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="text-sm font-extrabold text-foreground">Maktab Sozlamalari</h1>
                  <p className="text-[11px] text-muted-foreground">{currentSchool?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {store.syncStatus === "syncing" && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await store.syncToCloud();
                    if (res.success) showToast("✅ Neon PostgreSQL bulutiga saqlandi!");
                  }}
                  className="text-xs px-3 py-1 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse flex items-center gap-1.5 cursor-pointer hover:bg-amber-100"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  Neon DB Saqlanmoqda...
                </button>
              )}
              {store.syncStatus === "synced" && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await store.syncToCloud();
                    if (res.success) showToast("✅ Neon PostgreSQL bulutiga to'liq sinxronlandi!");
                  }}
                  className="text-xs px-3 py-1 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 cursor-pointer hover:bg-emerald-100 hover:shadow-sm transition-all"
                  title="Qayta sinxronlash uchun bosing"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Neon Cloud Sync: Faol
                </button>
              )}
              {store.syncStatus === "offline" && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await store.syncToCloud();
                    if (res.success) showToast("✅ Neon PostgreSQL bulutiga ulandi va saqlandi!");
                  }}
                  className="text-xs px-3 py-1 rounded-full font-bold bg-zinc-100 text-zinc-700 border border-zinc-200 flex items-center gap-1.5 cursor-pointer hover:bg-zinc-200"
                  title="Bulutga ulash uchun bosing"
                >
                  <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
                  Lokal Kesh (Sinxronlash)
                </button>
              )}
              {store.syncStatus === "error" && (
                <button
                  type="button"
                  onClick={async () => {
                    const res = await store.syncToCloud();
                    if (res.success) showToast("✅ Qayta sinxronlandi!");
                    else showToast("Xatolik: " + res.error, "error");
                  }}
                  className="text-xs px-3 py-1 rounded-full font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5 cursor-pointer hover:bg-rose-100"
                  title="Qayta urinish uchun bosing"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Qayta sinxronlash
                </button>
              )}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 border-t border-border/60">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "CLASSES" && (
          <ClassesTab
            classes={schoolClasses}
            branches={schoolBranches}
            shifts={schoolShifts}
            teachers={schoolTeachers}
            subjects={schoolSubjects}
            onAddClass={() => {
              setEditingClass(null);
              setIsClassModalOpen(true);
            }}
            onEditClass={(cls) => {
              setEditingClass(cls);
              setIsClassModalOpen(true);
            }}
            onDeleteClass={(id) => {
              store.deleteClass(id);
              showToast("Sinf o'chirildi", "success");
            }}
            onOpenCurriculum={(cls) => {
              setCurriculumClass(cls);
              setIsCurriculumModalOpen(true);
            }}
            onSetHomeroomTeacher={(classId, teacherId) => {
              store.setHomeroomTeacher(classId, teacherId);
              showToast("Sinf rahbari yangilandi", "success");
            }}
            onOpenEMaktabImport={() => setIsEMaktabModalOpen(true)}
          />
        )}

        {activeTab === "TEACHERS" && (
          <TeachersTab
            teachers={schoolTeachers}
            subjects={schoolSubjects}
            classes={schoolClasses}
            schoolName={store.schools.find((s) => s.id === store.currentSchoolId)?.name}
            onAddTeacher={() => {
              setEditingTeacher(null);
              setIsTeacherModalOpen(true);
            }}
            onEditTeacher={(t) => {
              setEditingTeacher(t);
              setIsTeacherModalOpen(true);
            }}
            onDeleteTeacher={(id) => {
              store.deleteTeacher(id);
              showToast("O'qituvchi o'chirildi", "success");
            }}
            onSetTeacherHomeroomClass={(teacherId, classId) => {
              store.setTeacherHomeroomClass(teacherId, classId);
              showToast("O'qituvchi sinf rahbarligi yangilandi", "success");
            }}
            onOpenTeacherWorkload={(t) => {
              setWorkloadTeacher(t);
              setIsWorkloadModalOpen(true);
            }}
            onOpenEMaktabImport={() => setIsEMaktabModalOpen(true)}
          />
        )}

        {activeTab === "AVAILABILITY" && (
          <AvailabilityTab
            teachers={schoolTeachers}
            onSaveAvailability={(teacherId, availabilities) => {
              store.updateTeacherAvailability(teacherId, availabilities);
              showToast("O'qituvchi bo'sh vaqtlari muvaffaqiyatli saqlandi", "success");
            }}
          />
        )}

        {activeTab === "SUBJECTS" && (
          <SubjectsTab
            subjects={schoolSubjects}
            onAddSubject={() => {
              setEditingSubject(null);
              setIsSubjectModalOpen(true);
            }}
            onEditSubject={(s) => {
              setEditingSubject(s);
              setIsSubjectModalOpen(true);
            }}
            onDeleteSubject={(id) => {
              store.deleteSubject(id);
              showToast("Fan o'chirildi", "success");
            }}
            onToggleActive={(id, newState) => {
              store.toggleSubjectStatus(id, newState);
              showToast(newState ? "Fan faollashtirildi" : "Fan nofaol qilindi", "success");
            }}
            onAddPresetSubject={(preset) => {
              const newSub: Subject = {
                id: preset.id || `sub_${Date.now()}`,
                schoolId: store.currentSchoolId,
                name: preset.name || "Yangi fan",
                shortName: preset.shortName || preset.name || "Fan",
                colorTag: preset.colorTag || "#3B82F6",
                difficultyScore: preset.difficultyScore || 5,
                allowDoubleLesson: preset.allowDoubleLesson || false,
                requiresRoomType: preset.requiresRoomType || null,
                methodDayOfWeek: preset.methodDayOfWeek ?? null,
                isActive: true,
              };
              store.addSubject(newSub);
              showToast(`${newSub.name} fani qo'shildi`, "success");
            }}
          />
        )}

        {activeTab === "ROOMS" && (
          <RoomsTab
            rooms={schoolRooms}
            branches={schoolBranches}
            onAddRoom={() => {
              setEditingRoom(null);
              setIsRoomModalOpen(true);
            }}
            onEditRoom={(r) => {
              setEditingRoom(r);
              setIsRoomModalOpen(true);
            }}
            onDeleteRoom={(id) => {
              store.deleteRoom(id);
              showToast("Xona o'chirildi", "success");
            }}
          />
        )}

        {activeTab === "BELLS" && (
          <BellsTab
            bellPeriods={store.bellPeriods}
            onSaveBells={(bells) => {
              store.updateBellPeriods(bells);
              showToast("Qo'ng'iroqlar jadvali yangilandi", "success");
            }}
          />
        )}

        {activeTab === "SCHOOL_INFO" && (
          <SchoolInfoTab
            school={currentSchool}
            branches={schoolBranches}
            shifts={schoolShifts}
            classes={schoolClasses}
            teachers={schoolTeachers}
            subjects={schoolSubjects}
            rooms={schoolRooms}
            onUpdateSchoolInfo={(schoolId, updates) => {
              store.updateSchoolInfo(schoolId, updates);
              showToast("Maktab rekvizitlari muvaffaqiyatli saqlandi", "success");
            }}
          />
        )}
      </main>

      {/* Modals */}
      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        editingClass={editingClass}
        currentSchoolId={store.currentSchoolId}
        branches={schoolBranches}
        shifts={schoolShifts}
        teachers={schoolTeachers}
        onSave={(classData) => {
          if (editingClass) {
            store.updateClass(classData);
            showToast(`${classData.name} sinfi tahrirlandi`, "success");
          } else {
            store.addClass(classData);
            showToast(`${classData.name} sinfi qo'shildi`, "success");
          }
        }}
      />

      <TeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        editingTeacher={editingTeacher}
        currentSchoolId={store.currentSchoolId}
        subjects={schoolSubjects}
        branches={schoolBranches}
        shifts={schoolShifts}
        classes={schoolClasses}
        allTeachers={schoolTeachers}
        onSave={(teacherData) => {
          if (editingTeacher) {
            store.updateTeacher(teacherData);
            showToast(`${teacherData.fullName} tahrirlandi`, "success");
          } else {
            store.addTeacher(teacherData);
            showToast(`${teacherData.fullName} qo'shildi`, "success");
          }
        }}
      />

      <SubjectModal
        isOpen={isSubjectModalOpen}
        onClose={() => setIsSubjectModalOpen(false)}
        editingSubject={editingSubject}
        currentSchoolId={store.currentSchoolId}
        onSave={(subjectData) => {
          if (editingSubject) {
            store.updateSubject(subjectData);
            showToast(`${subjectData.name} fani tahrirlandi`, "success");
          } else {
            store.addSubject(subjectData);
            showToast(`${subjectData.name} fani qo'shildi`, "success");
          }
        }}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        editingRoom={editingRoom}
        currentSchoolId={store.currentSchoolId}
        branches={schoolBranches}
        onSave={(roomData) => {
          if (editingRoom) {
            store.updateRoom(roomData);
            showToast(`${roomData.name} xonasi tahrirlandi`, "success");
          } else {
            store.addRoom(roomData);
            showToast(`${roomData.name} xonasi qo'shildi`, "success");
          }
        }}
      />

      <CurriculumModal
        isOpen={isCurriculumModalOpen}
        onClose={() => setIsCurriculumModalOpen(false)}
        targetClass={curriculumClass}
        allSubjects={schoolSubjects}
        allTeachers={schoolTeachers}
        allClasses={schoolClasses}
        onSave={(classId, subjectsList) => {
          store.saveCurriculum(classId, subjectsList);
          showToast("Fanlar taqsimoti muvaffaqiyatli saqlandi", "success");
        }}
      />

      <TeacherWorkloadModal
        isOpen={isWorkloadModalOpen}
        onClose={() => {
          setIsWorkloadModalOpen(false);
          setWorkloadTeacher(null);
        }}
        teacher={workloadTeacher}
        classes={schoolClasses}
        subjects={schoolSubjects}
        onSave={(teacherId, assignments) => {
          store.saveTeacherWorkload(teacherId, assignments);
          showToast("O'qituvchi dars yuklamasi muvaffaqiyatli saqlandi", "success");
        }}
      />

      <EMaktabImportModal
        isOpen={isEMaktabModalOpen}
        onClose={() => setIsEMaktabModalOpen(false)}
        existingTeachers={schoolTeachers}
        existingClasses={schoolClasses}
        existingSubjects={schoolSubjects}
        schoolId={store.currentSchoolId}
        onImportTeachers={(imported) => {
          imported.forEach((t) => store.addTeacher(t));
          showToast(`✅ ${imported.length} nafar o'qituvchi muvaffaqiyatli yuklandi!`, "success");
        }}
        onImportClasses={(imported) => {
          imported.forEach((c) => store.addClass(c));
          showToast(`✅ ${imported.length} ta sinf muvaffaqiyatli yuklandi!`, "success");
        }}
      />
    </div>
  );
}
