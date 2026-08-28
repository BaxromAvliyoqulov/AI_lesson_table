"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  BookOpen,
  DoorOpen,
  School as SchoolIcon,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Search,
  Check,
  ArrowLeft,
  Sliders,
  Calendar,
  Sparkles,
  Building2,
  X,
} from "lucide-react";
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
  ClassSubject,
} from "@/types";

type SettingTab = "CLASSES" | "TEACHERS" | "SUBJECTS" | "ROOMS" | "BRANCHES";

export default function SettingsPage() {
  const [currentSchoolId, setCurrentSchoolId] = useState<string>("school_39");
  const [activeTab, setActiveTab] = useState<SettingTab>("CLASSES");

  // Multi-tenant States
  const [schools, setSchools] = useState<SchoolInfo[]>(initialSchools);
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses);

  // Filters & Search
  const [classGradeFilter, setClassGradeFilter] = useState<string>("ALL");
  const [teacherSearch, setTeacherSearch] = useState<string>("");
  const [subjectSearch, setSubjectSearch] = useState<string>("");

  // Modals for CRUD
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Current School Data
  const currentSchool = useMemo(
    () => schools.find((s) => s.id === currentSchoolId) || schools[0],
    [schools, currentSchoolId]
  );

  const schoolBranches = useMemo(
    () => branches.filter((b) => b.schoolId === currentSchoolId),
    [branches, currentSchoolId]
  );

  const schoolShifts = useMemo(
    () => shifts.filter((s) => s.schoolId === currentSchoolId),
    [shifts, currentSchoolId]
  );

  const schoolSubjects = useMemo(
    () => subjects.filter((s) => s.schoolId === currentSchoolId),
    [subjects, currentSchoolId]
  );

  const schoolTeachers = useMemo(
    () => teachers.filter((t) => t.schoolId === currentSchoolId),
    [teachers, currentSchoolId]
  );

  const schoolRooms = useMemo(
    () => rooms.filter((r) => r.schoolId === currentSchoolId),
    [rooms, currentSchoolId]
  );

  const schoolClasses = useMemo(
    () => classes.filter((c) => c.schoolId === currentSchoolId),
    [classes, currentSchoolId]
  );

  // Filtered Classes by Grade
  const filteredClasses = useMemo(() => {
    if (classGradeFilter === "PRIMARY") {
      return schoolClasses.filter((c) => c.grade <= 4);
    }
    if (classGradeFilter === "MIDDLE") {
      return schoolClasses.filter((c) => c.grade >= 5 && c.grade <= 9);
    }
    if (classGradeFilter === "HIGH") {
      return schoolClasses.filter((c) => c.grade >= 10);
    }
    return schoolClasses;
  }, [schoolClasses, classGradeFilter]);

  // Lookup maps
  const subjectMap = useMemo(() => new Map(schoolSubjects.map((s) => [s.id, s])), [schoolSubjects]);
  const teacherMap = useMemo(() => new Map(schoolTeachers.map((t) => [t.id, t])), [schoolTeachers]);

  // ----------------- CRUD OPERATSIYALARI -----------------

  // 1. SINF CRUD
  const handleSaveClass = (cls: SchoolClass) => {
    if (editingClass) {
      setClasses(classes.map((c) => (c.id === cls.id ? cls : c)));
    } else {
      setClasses([...classes, { ...cls, id: `c_${Date.now()}`, schoolId: currentSchoolId }]);
    }
    setIsClassModalOpen(false);
    setEditingClass(null);
  };

  const handleDeleteClass = (id: string) => {
    if (confirm("Ushbu sinfni o'chirmoqchimisiz?")) {
      setClasses(classes.filter((c) => c.id !== id));
    }
  };

  const handleDuplicateClass = (source: SchoolClass) => {
    const nextChar = String.fromCharCode(source.name.charCodeAt(source.name.length - 1) + 1);
    const newName = `${source.grade}-${nextChar || "C"}`;
    const newId = `c_${Date.now()}`;
    const cloned: SchoolClass = {
      ...source,
      id: newId,
      name: newName,
      subjects: source.subjects.map((s) => ({ ...s, classId: newId })),
    };
    setClasses([...classes, cloned]);
  };

  // 2. O'QITUVCHI CRUD
  const handleSaveTeacher = (t: Teacher) => {
    if (editingTeacher) {
      setTeachers(teachers.map((item) => (item.id === t.id ? t : item)));
    } else {
      setTeachers([...teachers, { ...t, id: `t_${Date.now()}`, schoolId: currentSchoolId }]);
    }
    setIsTeacherModalOpen(false);
    setEditingTeacher(null);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("O'qituvchini o'chirmoqchimisiz?")) {
      setTeachers(teachers.filter((t) => t.id !== id));
    }
  };

  // 3. FAN CRUD
  const handleSaveSubject = (sub: Subject) => {
    if (editingSubject) {
      setSubjects(subjects.map((s) => (s.id === sub.id ? sub : s)));
    } else {
      setSubjects([...subjects, { ...sub, id: `sub_${Date.now()}`, schoolId: currentSchoolId }]);
    }
    setIsSubjectModalOpen(false);
    setEditingSubject(null);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm("Fanni o'chirmoqchimisiz?")) {
      setSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  // 4. XONA CRUD
  const handleSaveRoom = (room: Room) => {
    if (editingRoom) {
      setRooms(rooms.map((r) => (r.id === room.id ? room : r)));
    } else {
      setRooms([...rooms, { ...room, id: `r_${Date.now()}`, schoolId: currentSchoolId }]);
    }
    setIsRoomModalOpen(false);
    setEditingRoom(null);
  };

  const handleDeleteRoom = (id: string) => {
    if (confirm("Xonani o'chirmoqchimisiz?")) {
      setRooms(rooms.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-card/95 backdrop-blur-md px-4 md:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors shadow-sm"
          >
            <ArrowLeft className="h-4 w-4 text-blue-600" />
            <span>Dars Jadvaliga Qaytish</span>
          </Link>
          <div className="h-5 w-px bg-border hidden sm:block" />
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-blue-600" />
            <h1 className="font-extrabold text-sm sm:text-base tracking-tight">
              {currentSchool?.name} &bull; Maktab Sozlamalari (CRUD)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Jadvalni Ko&apos;rish</span>
          </Link>
        </div>
      </header>

      {/* Main Layout (Sidebar + Content) */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Vertical Navigation Tabs */}
        <aside className="w-full md:w-64 border-r border-border bg-muted/20 p-4 space-y-1">
          <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Bo&apos;limlar
          </div>

          <button
            onClick={() => setActiveTab("CLASSES")}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
              activeTab === "CLASSES"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap className="h-4 w-4" />
              <span>Sinflar & Tarifikatsiya</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "CLASSES" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {schoolClasses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("TEACHERS")}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
              activeTab === "TEACHERS"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="h-4 w-4" />
              <span>O&apos;qituvchilar</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "TEACHERS" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {schoolTeachers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("SUBJECTS")}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
              activeTab === "SUBJECTS"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <BookOpen className="h-4 w-4" />
              <span>Fanlar & SanPiN</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "SUBJECTS" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {schoolSubjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ROOMS")}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
              activeTab === "ROOMS"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <DoorOpen className="h-4 w-4" />
              <span>Xonalar & Maydonlar</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "ROOMS" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {schoolRooms.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("BRANCHES")}
            className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
              activeTab === "BRANCHES"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "text-foreground hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <SchoolIcon className="h-4 w-4" />
              <span>Filiallar & Smenalar</span>
            </div>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                activeTab === "BRANCHES" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              {schoolBranches.length}
            </span>
          </button>
        </aside>

        {/* Right Dynamic Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto max-h-[calc(100vh-4rem)]">
          {/* ================= TAB 1: SINFLAR & TARIFIKATSIYA ================= */}
          {activeTab === "CLASSES" && (
            <div className="space-y-6">
              {/* Header & Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">
                    Sinflar va Dars Soatlari (Tarifikatsiya)
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Jami {schoolClasses.length} ta sinf (1-A dan 11-B gacha to&apos;liq shakllantirilgan)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingClass(null);
                      setIsClassModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Yangi Sinf Qo&apos;shish</span>
                  </button>
                </div>
              </div>

              {/* Grade Filters */}
              <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
                <button
                  onClick={() => setClassGradeFilter("ALL")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    classGradeFilter === "ALL"
                      ? "bg-foreground text-background"
                      : "bg-card border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  Barchasi ({schoolClasses.length})
                </button>
                <button
                  onClick={() => setClassGradeFilter("PRIMARY")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    classGradeFilter === "PRIMARY"
                      ? "bg-foreground text-background"
                      : "bg-card border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  👶 Boshlang&apos;ich (1-4 sinflar)
                </button>
                <button
                  onClick={() => setClassGradeFilter("MIDDLE")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    classGradeFilter === "MIDDLE"
                      ? "bg-foreground text-background"
                      : "bg-card border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  👦 O&apos;rta (5-9 sinflar)
                </button>
                <button
                  onClick={() => setClassGradeFilter("HIGH")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                    classGradeFilter === "HIGH"
                      ? "bg-foreground text-background"
                      : "bg-card border border-border text-foreground hover:bg-muted"
                  }`}
                >
                  🎓 Yuqori (10-11 sinflar)
                </button>
              </div>

              {/* Classes Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredClasses.map((cls) => {
                  const totalHours = cls.subjects.reduce((sum, s) => sum + s.weeklyHours, 0);
                  return (
                    <div
                      key={cls.id}
                      className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div>
                        {/* Class Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-sm">
                              {cls.name}
                            </span>
                            <div>
                              <h3 className="font-bold text-xs text-foreground">
                                {cls.grade}-sinf ({cls.isPrimary ? "Boshlang'ich" : "Yuqori"})
                              </h3>
                              <span className="text-[11px] font-semibold text-blue-600">
                                {totalHours} soat / hafta
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              onClick={() => handleDuplicateClass(cls)}
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-blue-600 transition-colors"
                              title="Sinfdan nusxa olish (Duplicate)"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingClass(cls);
                                setIsClassModalOpen(true);
                              }}
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                              title="Tahrirlash"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(cls.id)}
                              className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-muted-foreground hover:text-rose-600 transition-colors"
                              title="O'chirish"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Subjects mini list */}
                        <div className="mt-3 space-y-1 max-h-36 overflow-y-auto pr-1 text-xs">
                          {cls.subjects.map((cs, idx) => {
                            const sub = subjectMap.get(cs.subjectId);
                            const teacher = teacherMap.get(cs.teacherId);
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between rounded-lg bg-muted/30 px-2 py-1 text-[11px]"
                              >
                                <span className="font-semibold text-foreground truncate flex items-center gap-1.5">
                                  <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: sub?.colorTag || "#3B82F6" }}
                                  />
                                  {sub?.name || "Fan"}
                                </span>
                                <span className="text-muted-foreground font-medium shrink-0">
                                  {cs.weeklyHours} soat
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{cls.subjects.length} ta fan biriktirilgan</span>
                        <button
                          onClick={() => {
                            setEditingClass(cls);
                            setIsClassModalOpen(true);
                          }}
                          className="font-bold text-blue-600 hover:underline"
                        >
                          Fanlarni tahrirlash &rarr;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= TAB 2: O'QITUVCHILAR ================= */}
          {activeTab === "TEACHERS" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">
                    O&apos;qituvchilar Ro&apos;yxati
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Jami {schoolTeachers.length} nafar o&apos;qituvchi
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="O'qituvchini qidirish..."
                      value={teacherSearch}
                      onChange={(e) => setTeacherSearch(e.target.value)}
                      className="rounded-xl border border-border bg-card pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setEditingTeacher(null);
                      setIsTeacherModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    <span>O&apos;qituvchi Qo&apos;shish</span>
                  </button>
                </div>
              </div>

              {/* Teachers Table */}
              <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border">
                      <th className="p-3 font-bold text-muted-foreground uppercase">F.I.Sh</th>
                      <th className="p-3 font-bold text-muted-foreground uppercase">Telefon</th>
                      <th className="p-3 font-bold text-muted-foreground uppercase">O&apos;qitadigan Fanlari</th>
                      <th className="p-3 font-bold text-muted-foreground uppercase text-center">
                        Haftalik Sig&apos;im
                      </th>
                      <th className="p-3 font-bold text-muted-foreground uppercase text-right">
                        Amallar
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schoolTeachers
                      .filter((t) =>
                        t.fullName.toLowerCase().includes(teacherSearch.toLowerCase())
                      )
                      .map((t) => (
                        <tr key={t.id} className="border-b border-border/60 hover:bg-muted/10">
                          <td className="p-3 font-bold text-foreground">{t.fullName}</td>
                          <td className="p-3 text-muted-foreground">{t.phone || "-"}</td>
                          <td className="p-3">
                            <div className="flex flex-wrap gap-1">
                              {t.subjectIds.map((sid) => {
                                const sub = subjectMap.get(sid);
                                return (
                                  <span
                                    key={sid}
                                    className="rounded-lg px-2 py-0.5 text-[10px] font-bold text-white"
                                    style={{ backgroundColor: sub?.colorTag || "#3B82F6" }}
                                  >
                                    {sub?.shortName || sub?.name || "Fan"}
                                  </span>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-3 text-center font-bold text-blue-600">
                            {t.weeklyHourCapacity} soat
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingTeacher(t);
                                  setIsTeacherModalOpen(true);
                                }}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTeacher(t.id)}
                                className="p-1 rounded-lg hover:bg-rose-100 text-muted-foreground hover:text-rose-600"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ================= TAB 3: FANLAR & SANPIN ================= */}
          {activeTab === "SUBJECTS" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">
                    Fanlar va SanPiN Qiyinlik Ballari
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    SanPiN aqliy yuklama shkalasi (1-13 ball). Zavuch ballarni o&apos;zgartira oladi.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingSubject(null);
                    setIsSubjectModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Fan Qo&apos;shish</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schoolSubjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-6 w-6 rounded-lg shadow-sm"
                            style={{ backgroundColor: sub.colorTag }}
                          />
                          <h3 className="font-bold text-xs text-foreground">{sub.name}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingSubject(sub);
                              setIsSubjectModalOpen(true);
                            }}
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sub.id)}
                            className="p-1 rounded-lg hover:bg-rose-100 text-muted-foreground hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>SanPiN Aqliy Balli:</span>
                          <span className="font-extrabold text-blue-600">
                            {sub.difficultyScore} ball
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>2 soatlik Juftlik:</span>
                          <span className="font-semibold text-foreground">
                            {sub.allowDoubleLesson ? "✅ Ruxsat" : "❌ Yo'q"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Maxsus Xona:</span>
                          <span className="font-semibold text-foreground">
                            {sub.requiresRoomType || "Oddiy sinfxona"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 4: XONALAR & MAYDONLAR ================= */}
          {activeTab === "ROOMS" && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-foreground">
                    Xonalar, Laboratoriyalar va Maydonlar
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Sport zal, stadion va laboratoriyalar cheklovlari
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingRoom(null);
                    setIsRoomModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Xona Qo&apos;shish</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {schoolRooms.map((room) => (
                  <div
                    key={room.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-xs text-foreground">{room.name}</h3>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingRoom(room);
                              setIsRoomModalOpen(true);
                            }}
                            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-1 rounded-lg hover:bg-rose-100 text-muted-foreground hover:text-rose-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                        <div className="flex items-center justify-between">
                          <span>Xona turi:</span>
                          <span className="font-bold text-blue-600">{room.roomType}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Sig&apos;imi:</span>
                          <span className="font-semibold text-foreground">
                            {room.capacity} o&apos;quvchi
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TAB 5: FILIALLAR & SMENALAR ================= */}
          {activeTab === "BRANCHES" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-foreground">
                  Maktab Filiallari va Smenalar
                </h2>
                <p className="text-xs text-muted-foreground">
                  Maktab binolari va o&apos;qish smenalari parametrlari
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                    Binolar & Filiallar
                  </h3>
                  {schoolBranches.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between rounded-xl border border-border p-3 bg-muted/20 text-xs"
                    >
                      <span className="font-bold text-foreground">{b.name}</span>
                      <span className="text-muted-foreground">
                        {b.isMain ? "(Asosiy korpus)" : "(Filial)"}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">
                    O&apos;qish Smenalari
                  </h3>
                  {schoolShifts.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-border p-3 bg-muted/20 text-xs"
                    >
                      <span className="font-bold text-foreground">{s.name}</span>
                      <span className="text-blue-600 font-semibold">
                        {s.startTime} - {s.endTime} ({s.periodsCount} dars)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ================= MODAL: SINF TAHRIRLASH & QO'SHISH ================= */}
      {isClassModalOpen && (
        <ClassEditModal
          isOpen={isClassModalOpen}
          onClose={() => {
            setIsClassModalOpen(false);
            setEditingClass(null);
          }}
          classObj={editingClass}
          subjects={schoolSubjects}
          teachers={schoolTeachers}
          branches={schoolBranches}
          shifts={schoolShifts}
          onSave={handleSaveClass}
        />
      )}

      {/* ================= MODAL: O'QITUVCHI TAHRIRLASH ================= */}
      {isTeacherModalOpen && (
        <TeacherEditModal
          isOpen={isTeacherModalOpen}
          onClose={() => {
            setIsTeacherModalOpen(false);
            setEditingTeacher(null);
          }}
          teacherObj={editingTeacher}
          subjects={schoolSubjects}
          onSave={handleSaveTeacher}
        />
      )}

      {/* ================= MODAL: FAN TAHRIRLASH ================= */}
      {isSubjectModalOpen && (
        <SubjectEditModal
          isOpen={isSubjectModalOpen}
          onClose={() => {
            setIsSubjectModalOpen(false);
            setEditingSubject(null);
          }}
          subjectObj={editingSubject}
          onSave={handleSaveSubject}
        />
      )}

      {/* ================= MODAL: XONA TAHRIRLASH ================= */}
      {isRoomModalOpen && (
        <RoomEditModal
          isOpen={isRoomModalOpen}
          onClose={() => {
            setIsRoomModalOpen(false);
            setEditingRoom(null);
          }}
          roomObj={editingRoom}
          branches={schoolBranches}
          onSave={handleSaveRoom}
        />
      )}
    </div>
  );
}

// ----------------- MODALLAR KOMPONENTLARI -----------------

// 1. Sinf Tahrirlash Modali
function ClassEditModal({
  isOpen,
  onClose,
  classObj,
  subjects,
  teachers,
  branches,
  shifts,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  classObj: SchoolClass | null;
  subjects: Subject[];
  teachers: Teacher[];
  branches: Branch[];
  shifts: Shift[];
  onSave: (cls: SchoolClass) => void;
}) {
  const [name, setName] = useState(classObj?.name || "1-A");
  const [grade, setGrade] = useState(classObj?.grade || 1);
  const [isPrimary, setIsPrimary] = useState(classObj?.isPrimary || false);
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>(
    classObj?.subjects || []
  );

  const addSubjectRow = () => {
    setClassSubjects([
      ...classSubjects,
      {
        subjectId: subjects[0]?.id || "",
        teacherId: teachers[0]?.id || "",
        weeklyHours: 4,
        classId: classObj?.id || "",
      },
    ]);
  };

  const removeSubjectRow = (index: number) => {
    setClassSubjects(classSubjects.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: classObj?.id || `c_${Date.now()}`,
      schoolId: classObj?.schoolId || "school_39",
      branchId: branches[0]?.id || "b39_1",
      shiftId: shifts[0]?.id || "s39_1",
      name,
      grade: Number(grade),
      isPrimary: Number(grade) <= 4,
      subjects: classSubjects,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <h3 className="font-extrabold text-sm text-foreground">
            {classObj ? `${classObj.name} Sinfini Tahrirlash` : "Yangi Sinf Qo'shish"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Sinf Nomi:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Sinf Bosqichi (Grade):</label>
              <input
                type="number"
                min="1"
                max="11"
                value={grade}
                onChange={(e) => {
                  const g = Number(e.target.value);
                  setGrade(g);
                  setIsPrimary(g <= 4);
                }}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Subjects and hours */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Fanlar va Dars Soatlari:</span>
              <button
                type="button"
                onClick={addSubjectRow}
                className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
              >
                <Plus className="h-3 w-3" />
                <span>Fan qo&apos;shish</span>
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {classSubjects.map((cs, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 p-2 text-xs"
                >
                  <select
                    value={cs.subjectId}
                    onChange={(e) => {
                      const updated = [...classSubjects];
                      updated[idx].subjectId = e.target.value;
                      setClassSubjects(updated);
                    }}
                    className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={cs.teacherId}
                    onChange={(e) => {
                      const updated = [...classSubjects];
                      updated[idx].teacherId = e.target.value;
                      setClassSubjects(updated);
                    }}
                    className="flex-1 rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold focus:outline-none"
                  >
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cs.weeklyHours}
                    onChange={(e) => {
                      const updated = [...classSubjects];
                      updated[idx].weeklyHours = Number(e.target.value);
                      setClassSubjects(updated);
                    }}
                    className="w-14 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-center font-bold focus:outline-none"
                  />
                  <span className="text-[11px] text-muted-foreground">soat</span>

                  <button
                    type="button"
                    onClick={() => removeSubjectRow(idx)}
                    className="p-1 rounded hover:bg-rose-100 text-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md"
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. O'qituvchi Modali
function TeacherEditModal({
  isOpen,
  onClose,
  teacherObj,
  subjects,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  teacherObj: Teacher | null;
  subjects: Subject[];
  onSave: (t: Teacher) => void;
}) {
  const [fullName, setFullName] = useState(teacherObj?.fullName || "");
  const [phone, setPhone] = useState(teacherObj?.phone || "+998 ");
  const [capacity, setCapacity] = useState(teacherObj?.weeklyHourCapacity || 20);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    teacherObj?.subjectIds || []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: teacherObj?.id || `t_${Date.now()}`,
      schoolId: teacherObj?.schoolId || "school_39",
      fullName,
      phone,
      weeklyHourCapacity: Number(capacity),
      maxConsecutiveHours: 4,
      subjectIds: selectedSubjects,
      branchIds: ["b39_1"],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <h3 className="font-extrabold text-sm text-foreground">
            {teacherObj ? "O'qituvchini Tahrirlash" : "Yangi O'qituvchi Qo'shish"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">F.I.Sh:</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Masalan: Alimov Jamshid Qodirovich"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Telefon:</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Haftalik Maksimal Soat:</label>
            <input
              type="number"
              min="4"
              max="40"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">O&apos;qitadigan Fanlari:</label>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 border border-border rounded-xl">
              {subjects.map((s) => {
                const checked = selectedSubjects.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-1.5 p-1.5 rounded-lg text-[11px] font-semibold cursor-pointer select-none transition-colors ${
                      checked ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300" : "hover:bg-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSubjects([...selectedSubjects, s.id]);
                        } else {
                          setSelectedSubjects(selectedSubjects.filter((id) => id !== s.id));
                        }
                      }}
                      className="rounded"
                    />
                    <span className="truncate">{s.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md"
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 3. Fan Modali
function SubjectEditModal({
  isOpen,
  onClose,
  subjectObj,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  subjectObj: Subject | null;
  onSave: (s: Subject) => void;
}) {
  const [name, setName] = useState(subjectObj?.name || "");
  const [shortName, setShortName] = useState(subjectObj?.shortName || "");
  const [colorTag, setColorTag] = useState(subjectObj?.colorTag || "#3B82F6");
  const [score, setScore] = useState(subjectObj?.difficultyScore || 5);
  const [allowDouble, setAllowDouble] = useState(subjectObj?.allowDoubleLesson || false);
  const [roomType, setRoomType] = useState<string>(subjectObj?.requiresRoomType || "GENERAL");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: subjectObj?.id || `sub_${Date.now()}`,
      schoolId: subjectObj?.schoolId || "school_39",
      name,
      shortName,
      colorTag,
      difficultyScore: Number(score),
      allowDoubleLesson: allowDouble,
      requiresRoomType: roomType === "GENERAL" ? null : (roomType as any),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <h3 className="font-extrabold text-sm text-foreground">
            {subjectObj ? "Fanni Tahrirlash" : "Yangi Fan Qo'shish"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Fan Nomi:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Qisqa Nomi:</label>
              <input
                type="text"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Fan Rangi:</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorTag}
                  onChange={(e) => setColorTag(e.target.value)}
                  className="h-8 w-12 rounded border border-border cursor-pointer"
                />
                <span className="text-xs font-mono text-muted-foreground">{colorTag}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">
              SanPiN Qiyinlik Balli (1-13):
            </label>
            <input
              type="number"
              min="1"
              max="13"
              value={score}
              onChange={(e) => setScore(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Maxsus Xona Talabi:</label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="GENERAL">Oddiy Sinfxona</option>
              <option value="GYM">Sport Zali</option>
              <option value="COMP_LAB">Informatika Lab</option>
              <option value="LAB">Fizika/Kimyo Lab</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={allowDouble}
              onChange={(e) => setAllowDouble(e.target.checked)}
              className="rounded"
            />
            <span>2 soat ketma-ket (Juftlik) darsga ruxsat</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md"
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// 4. Xona Modali
function RoomEditModal({
  isOpen,
  onClose,
  roomObj,
  branches,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  roomObj: Room | null;
  branches: Branch[];
  onSave: (r: Room) => void;
}) {
  const [name, setName] = useState(roomObj?.name || "");
  const [roomType, setRoomType] = useState<string>(roomObj?.roomType || "GENERAL");
  const [capacity, setCapacity] = useState(roomObj?.capacity || 35);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: roomObj?.id || `r_${Date.now()}`,
      schoolId: roomObj?.schoolId || "school_39",
      branchId: branches[0]?.id || "b39_1",
      name,
      roomType: roomType as any,
      capacity: Number(capacity),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
          <h3 className="font-extrabold text-sm text-foreground">
            {roomObj ? "Xonani Tahrirlash" : "Yangi Xona Qo'shish"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Xona Nomi:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Masalan: Katta Sport Zali, 102-xona"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Xona Turi:</label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              <option value="GENERAL">Oddiy Sinfxona</option>
              <option value="GYM">Sport Zali</option>
              <option value="OUTDOOR_PITCH">Ochiq Stadion/Maydon</option>
              <option value="COMP_LAB">Informatika Lab</option>
              <option value="LAB">Fizika/Kimyo Lab</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Sig&apos;imi (O&apos;quvchi):</label>
            <input
              type="number"
              min="10"
              max="100"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md"
            >
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
