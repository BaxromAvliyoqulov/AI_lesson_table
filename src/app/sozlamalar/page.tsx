"use client";

import React, { useState, useMemo, useEffect } from "react";
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
  MoreVertical,
  Lock,
  Unlock,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  Info,
} from "lucide-react";
import {
  initialSchools,
  initialBranches,
  initialShifts,
  initialRooms,
  initialSubjects,
  initialTeachers,
  initialClasses,
  generateFull22Classes,
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

type SettingTab =
  | "CLASSES"
  | "TEACHERS"
  | "AVAILABILITY"
  | "SUBJECTS"
  | "ROOMS"
  | "BELLS"
  | "SCHOOL_INFO";

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
  const [classSearch, setClassSearch] = useState<string>("");
  const [teacherSearch, setTeacherSearch] = useState<string>("");
  const [subjectSearch, setSubjectSearch] = useState<string>("");
  const [roomSearch, setRoomSearch] = useState<string>("");

  // Dropdown open state for class card "..."
  const [openDropdownClassId, setOpenDropdownClassId] = useState<string | null>(null);

  // Modals for CRUD
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolInfo | null>(null);
  const [schoolFormData, setSchoolFormData] = useState({ name: "", slug: "", createDefaultClasses: true });

  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [classFormData, setClassFormData] = useState<{
    name: string;
    grade: number;
    shiftId: string;
    branchId: string;
    homeroomTeacherId: string;
    isClosed: boolean;
  }>({
    name: "",
    grade: 1,
    shiftId: "",
    branchId: "",
    homeroomTeacherId: "",
    isClosed: false,
  });

  const [isClassSubjectsModalOpen, setIsClassSubjectsModalOpen] = useState(false);
  const [selectedClassForSubjects, setSelectedClassForSubjects] = useState<SchoolClass | null>(null);

  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [teacherFormData, setTeacherFormData] = useState<{
    fullName: string;
    phone: string;
    weeklyHourCapacity: number;
    maxConsecutiveHours: number;
    subjectIds: string[];
    branchIds: string[];
  }>({
    fullName: "",
    phone: "+998 ",
    weeklyHourCapacity: 22,
    maxConsecutiveHours: 4,
    subjectIds: [],
    branchIds: [],
  });

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [subjectFormData, setSubjectFormData] = useState<{
    name: string;
    shortName: string;
    colorTag: string;
    difficultyScore: number;
    allowDoubleLesson: boolean;
    requiresRoomType: string;
  }>({
    name: "",
    shortName: "",
    colorTag: "#3B82F6",
    difficultyScore: 5,
    allowDoubleLesson: false,
    requiresRoomType: "NONE",
  });

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomFormData, setRoomFormData] = useState<{
    name: string;
    branchId: string;
    roomType: string;
    capacity: number;
  }>({
    name: "",
    branchId: "",
    roomType: "GENERAL",
    capacity: 35,
  });

  // Close dropdown on outside click
  useEffect(() => {
    const handleGlobalClick = () => setOpenDropdownClassId(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

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

  // Lookup maps
  const subjectMap = useMemo(() => new Map(schoolSubjects.map((s) => [s.id, s])), [schoolSubjects]);
  const teacherMap = useMemo(() => new Map(schoolTeachers.map((t) => [t.id, t])), [schoolTeachers]);
  const branchMap = useMemo(() => new Map(schoolBranches.map((b) => [b.id, b])), [schoolBranches]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    let list = schoolClasses;

    if (classGradeFilter === "PRIMARY") {
      list = list.filter((c) => c.grade <= 4);
    } else if (classGradeFilter === "MIDDLE") {
      list = list.filter((c) => c.grade >= 5 && c.grade <= 9);
    } else if (classGradeFilter === "HIGH") {
      list = list.filter((c) => c.grade >= 10);
    } else if (classGradeFilter === "CLOSED") {
      list = list.filter((c) => c.isClosed);
    }

    if (classSearch.trim()) {
      const q = classSearch.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q));
    }

    return list.sort((a, b) => {
      if (a.grade !== b.grade) return a.grade - b.grade;
      return a.name.localeCompare(b.name);
    });
  }, [schoolClasses, classGradeFilter, classSearch]);

  // Filtered Teachers
  const filteredTeachers = useMemo(() => {
    if (!teacherSearch.trim()) return schoolTeachers;
    const q = teacherSearch.toLowerCase();
    return schoolTeachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        (t.phone && t.phone.toLowerCase().includes(q))
    );
  }, [schoolTeachers, teacherSearch]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return schoolSubjects;
    const q = subjectSearch.toLowerCase();
    return schoolSubjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.shortName && s.shortName.toLowerCase().includes(q))
    );
  }, [schoolSubjects, subjectSearch]);

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    if (!roomSearch.trim()) return schoolRooms;
    const q = roomSearch.toLowerCase();
    return schoolRooms.filter((r) => r.name.toLowerCase().includes(q));
  }, [schoolRooms, roomSearch]);

  // Total school hours
  const totalWeeklyHours = useMemo(() => {
    return schoolClasses.reduce((acc, c) => {
      if (c.isClosed) return acc;
      return acc + c.subjects.reduce((sum, s) => sum + s.weeklyHours, 0);
    }, 0);
  }, [schoolClasses]);

  // ----------------- CRUD HANDLERS -----------------

  // 1. MAKTAB CRUD
  const handleOpenSchoolModal = (sch?: SchoolInfo) => {
    if (sch) {
      setEditingSchool(sch);
      setSchoolFormData({ name: sch.name, slug: sch.slug, createDefaultClasses: false });
    } else {
      setEditingSchool(null);
      setSchoolFormData({ name: "", slug: "", createDefaultClasses: true });
    }
    setIsSchoolModalOpen(true);
  };

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolFormData.name.trim()) return;

    if (editingSchool) {
      setSchools(
        schools.map((s) =>
          s.id === editingSchool.id
            ? { ...s, name: schoolFormData.name, slug: schoolFormData.slug || s.slug }
            : s
        )
      );
    } else {
      const newId = `school_${Date.now()}`;
      const newBranchId = `b_${Date.now()}`;
      const newShiftId = `s_${Date.now()}`;

      const newSchool: SchoolInfo = {
        id: newId,
        name: schoolFormData.name,
        slug: schoolFormData.slug || `maktab-${schools.length + 1}`,
        branchesCount: 1,
        classesCount: schoolFormData.createDefaultClasses ? 22 : 0,
        teachersCount: 25,
      };

      const newBranch: Branch = {
        id: newBranchId,
        schoolId: newId,
        name: `${schoolFormData.name} Asosiy Bino`,
        address: "Toshkent shahri",
        isMain: true,
      };

      const newShift: Shift = {
        id: newShiftId,
        schoolId: newId,
        name: "1-Smena (Ertalabki)",
        startTime: "08:00",
        endTime: "13:00",
        periodsCount: 6,
      };

      let newClassesList: SchoolClass[] = [];
      if (schoolFormData.createDefaultClasses) {
        newClassesList = generateFull22Classes(newId, newBranchId, newShiftId);
      }

      setSchools([...schools, newSchool]);
      setBranches([...branches, newBranch]);
      setShifts([...shifts, newShift]);
      if (newClassesList.length > 0) {
        setClasses([...classes, ...newClassesList]);
      }
      setCurrentSchoolId(newId);
    }
    setIsSchoolModalOpen(false);
  };

  const handleDeleteSchool = (id: string) => {
    if (schools.length <= 1) {
      alert("Tizimda kamida 1 ta maktab qolishi shart!");
      return;
    }
    if (confirm("Ushbu maktab va unga tegishli barcha ma'lumotlarni o'chirmoqchimisiz?")) {
      const remaining = schools.filter((s) => s.id !== id);
      setSchools(remaining);
      setClasses(classes.filter((c) => c.schoolId !== id));
      setTeachers(teachers.filter((t) => t.schoolId !== id));
      setSubjects(subjects.filter((s) => s.schoolId !== id));
      setRooms(rooms.filter((r) => r.schoolId !== id));
      setBranches(branches.filter((b) => b.schoolId !== id));
      setShifts(shifts.filter((s) => s.schoolId !== id));
      setCurrentSchoolId(remaining[0].id);
    }
  };

  // 1-Click: Standart 1-A dan 11-B gacha 22 ta sinfni avtomatik tiklash / qayta yaratish
  const handleGenerateStandard22Classes = () => {
    const branchId = schoolBranches[0]?.id || `b_${Date.now()}`;
    const shiftId = schoolShifts[0]?.id || `s_${Date.now()}`;

    if (
      confirm(
        "Ushbu maktab uchun standart 1-A dan 11-B gacha 22 ta sinfni to'liq tarifikatsiyasi va Kelajak Soati bilan qayta yaratmoqchimisiz?"
      )
    ) {
      const new22 = generateFull22Classes(currentSchoolId, branchId, shiftId);
      setClasses((prev) => [
        ...prev.filter((c) => c.schoolId !== currentSchoolId),
        ...new22,
      ]);
      alert("✅ 22 ta sinf (1-A dan 11-B gacha) muvaffaqiyatli shakllantirildi!");
    }
  };

  // 2. SINF CRUD & CONTEXT ACTIONS
  const handleOpenClassModal = (cls?: SchoolClass) => {
    if (cls) {
      setEditingClass(cls);
      setClassFormData({
        name: cls.name,
        grade: cls.grade,
        shiftId: cls.shiftId || schoolShifts[0]?.id || "",
        branchId: cls.branchId || schoolBranches[0]?.id || "",
        homeroomTeacherId: cls.homeroomTeacherId || "",
        isClosed: !!cls.isClosed,
      });
    } else {
      setEditingClass(null);
      setClassFormData({
        name: "",
        grade: 1,
        shiftId: schoolShifts[0]?.id || "",
        branchId: schoolBranches[0]?.id || "",
        homeroomTeacherId: schoolTeachers[0]?.id || "",
        isClosed: false,
      });
    }
    setIsClassModalOpen(true);
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name.trim()) return;

    if (editingClass) {
      setClasses(
        classes.map((c) =>
          c.id === editingClass.id
            ? {
                ...c,
                name: classFormData.name,
                grade: Number(classFormData.grade),
                isPrimary: Number(classFormData.grade) <= 4,
                shiftId: classFormData.shiftId,
                branchId: classFormData.branchId,
                homeroomTeacherId: classFormData.homeroomTeacherId,
                isClosed: classFormData.isClosed,
              }
            : c
        )
      );
    } else {
      const newId = `c_${Date.now()}`;
      const newClass: SchoolClass = {
        id: newId,
        schoolId: currentSchoolId,
        name: classFormData.name,
        grade: Number(classFormData.grade),
        isPrimary: Number(classFormData.grade) <= 4,
        shiftId: classFormData.shiftId || schoolShifts[0]?.id || "s39_1",
        branchId: classFormData.branchId || schoolBranches[0]?.id || "b39_1",
        homeroomTeacherId: classFormData.homeroomTeacherId || null,
        isClosed: classFormData.isClosed,
        subjects: [
          {
            classId: newId,
            subjectId: "sub_kelajak",
            teacherId: classFormData.homeroomTeacherId || "t_baxrom",
            weeklyHours: 1,
          },
          {
            classId: newId,
            subjectId: "sub_mat",
            teacherId: classFormData.homeroomTeacherId || "t_baxrom",
            weeklyHours: 4,
          },
          {
            classId: newId,
            subjectId: "sub_ona",
            teacherId: classFormData.homeroomTeacherId || "t_baxrom",
            weeklyHours: 4,
          },
        ],
      };
      setClasses([...classes, newClass]);
    }
    setIsClassModalOpen(false);
  };

  // Sinfni yopish / ochish (Toggle Closed/Active)
  const handleToggleCloseClass = (cls: SchoolClass, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = !cls.isClosed;
    setClasses(
      classes.map((c) => (c.id === cls.id ? { ...c, isClosed: updated } : c))
    );
    setOpenDropdownClassId(null);
  };

  // Sinfni dublikat qilish (Duplicate)
  const handleDuplicateClass = (source: SchoolClass, e?: React.MouseEvent) => {
    e?.stopPropagation();
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
    setOpenDropdownClassId(null);
  };

  // Sinfni o'chirish
  const handleDeleteClass = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm("Haqiqatan ham bu sinfni o'chirmoqchimisiz?")) {
      setClasses(classes.filter((c) => c.id !== id));
    }
    setOpenDropdownClassId(null);
  };

  // Sinf fanlari modalini ochish
  const handleOpenClassSubjects = (cls: SchoolClass, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedClassForSubjects(cls);
    setIsClassSubjectsModalOpen(true);
    setOpenDropdownClassId(null);
  };

  // Sinfga fan qo'shish / o'zgartirish
  const handleSaveClassSubjects = (updatedSubjects: ClassSubject[]) => {
    if (!selectedClassForSubjects) return;
    setClasses(
      classes.map((c) =>
        c.id === selectedClassForSubjects.id
          ? { ...c, subjects: updatedSubjects }
          : c
      )
    );
    setIsClassSubjectsModalOpen(false);
  };

  // 3. O'QITUVCHI CRUD
  const handleOpenTeacherModal = (teacher?: Teacher) => {
    if (teacher) {
      setEditingTeacher(teacher);
      setTeacherFormData({
        fullName: teacher.fullName,
        phone: teacher.phone || "+998 ",
        weeklyHourCapacity: teacher.weeklyHourCapacity || 22,
        maxConsecutiveHours: teacher.maxConsecutiveHours || 4,
        subjectIds: teacher.subjectIds || [],
        branchIds: teacher.branchIds || [schoolBranches[0]?.id || ""],
      });
    } else {
      setEditingTeacher(null);
      setTeacherFormData({
        fullName: "",
        phone: "+998 ",
        weeklyHourCapacity: 22,
        maxConsecutiveHours: 4,
        subjectIds: schoolSubjects.slice(0, 1).map((s) => s.id),
        branchIds: [schoolBranches[0]?.id || ""],
      });
    }
    setIsTeacherModalOpen(true);
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFormData.fullName.trim()) return;

    if (editingTeacher) {
      setTeachers(
        teachers.map((t) =>
          t.id === editingTeacher.id
            ? {
                ...t,
                fullName: teacherFormData.fullName,
                phone: teacherFormData.phone,
                weeklyHourCapacity: Number(teacherFormData.weeklyHourCapacity),
                maxConsecutiveHours: Number(teacherFormData.maxConsecutiveHours),
                subjectIds: teacherFormData.subjectIds,
                branchIds: teacherFormData.branchIds,
              }
            : t
        )
      );
    } else {
      const newTeacher: Teacher = {
        id: `t_${Date.now()}`,
        schoolId: currentSchoolId,
        fullName: teacherFormData.fullName,
        phone: teacherFormData.phone,
        weeklyHourCapacity: Number(teacherFormData.weeklyHourCapacity),
        maxConsecutiveHours: Number(teacherFormData.maxConsecutiveHours),
        subjectIds: teacherFormData.subjectIds,
        branchIds: teacherFormData.branchIds.length > 0 ? teacherFormData.branchIds : [schoolBranches[0]?.id || "b39_1"],
      };
      setTeachers([...teachers, newTeacher]);
    }
    setIsTeacherModalOpen(false);
  };

  const handleDeleteTeacher = (id: string) => {
    if (confirm("O'qituvchini o'chirmoqchimisiz?")) {
      setTeachers(teachers.filter((t) => t.id !== id));
    }
  };

  // 4. FAN CRUD
  const handleOpenSubjectModal = (sub?: Subject) => {
    if (sub) {
      setEditingSubject(sub);
      setSubjectFormData({
        name: sub.name,
        shortName: sub.shortName || "",
        colorTag: sub.colorTag || "#3B82F6",
        difficultyScore: sub.difficultyScore || 5,
        allowDoubleLesson: !!sub.allowDoubleLesson,
        requiresRoomType: sub.requiresRoomType || "NONE",
      });
    } else {
      setEditingSubject(null);
      setSubjectFormData({
        name: "",
        shortName: "",
        colorTag: "#3B82F6",
        difficultyScore: 5,
        allowDoubleLesson: false,
        requiresRoomType: "NONE",
      });
    }
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectFormData.name.trim()) return;

    const roomType =
      subjectFormData.requiresRoomType === "NONE"
        ? null
        : (subjectFormData.requiresRoomType as any);

    if (editingSubject) {
      setSubjects(
        subjects.map((s) =>
          s.id === editingSubject.id
            ? {
                ...s,
                name: subjectFormData.name,
                shortName: subjectFormData.shortName,
                colorTag: subjectFormData.colorTag,
                difficultyScore: Number(subjectFormData.difficultyScore),
                allowDoubleLesson: subjectFormData.allowDoubleLesson,
                requiresRoomType: roomType,
              }
            : s
        )
      );
    } else {
      const newSubject: Subject = {
        id: `sub_${Date.now()}`,
        schoolId: currentSchoolId,
        name: subjectFormData.name,
        shortName: subjectFormData.shortName || subjectFormData.name.slice(0, 4),
        colorTag: subjectFormData.colorTag,
        difficultyScore: Number(subjectFormData.difficultyScore),
        allowDoubleLesson: subjectFormData.allowDoubleLesson,
        requiresRoomType: roomType,
      };
      setSubjects([...subjects, newSubject]);
    }
    setIsSubjectModalOpen(false);
  };

  const handleDeleteSubject = (id: string) => {
    if (confirm("Fanni o'chirmoqchimisiz?")) {
      setSubjects(subjects.filter((s) => s.id !== id));
    }
  };

  // 5. XONA CRUD
  const handleOpenRoomModal = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setRoomFormData({
        name: room.name,
        branchId: room.branchId,
        roomType: room.roomType,
        capacity: room.capacity || 35,
      });
    } else {
      setEditingRoom(null);
      setRoomFormData({
        name: "",
        branchId: schoolBranches[0]?.id || "",
        roomType: "GENERAL",
        capacity: 35,
      });
    }
    setIsRoomModalOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.name.trim()) return;

    if (editingRoom) {
      setRooms(
        rooms.map((r) =>
          r.id === editingRoom.id
            ? {
                ...r,
                name: roomFormData.name,
                branchId: roomFormData.branchId,
                roomType: roomFormData.roomType as any,
                capacity: Number(roomFormData.capacity),
              }
            : r
        )
      );
    } else {
      const newRoom: Room = {
        id: `r_${Date.now()}`,
        schoolId: currentSchoolId,
        branchId: roomFormData.branchId || schoolBranches[0]?.id || "b39_1",
        name: roomFormData.name,
        roomType: roomFormData.roomType as any,
        capacity: Number(roomFormData.capacity),
      };
      setRooms([...rooms, newRoom]);
    }
    setIsRoomModalOpen(false);
  };

  const handleDeleteRoom = (id: string) => {
    if (confirm("Xonani o'chirmoqchimisiz?")) {
      setRooms(rooms.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* 1. TOP HEADER & NAVIGATION BAR */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl px-4 md:px-8 h-18 flex items-center justify-between shadow-lg shadow-black/30">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-800/60 px-3.5 py-2 text-xs font-bold hover:bg-slate-700/60 text-slate-200 transition-all shadow-sm group"
          >
            <ArrowLeft className="h-4 w-4 text-blue-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Jadval Doskasiga Qaytish</span>
          </Link>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* School Selector Dropdown & Info */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <SchoolIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <select
                  value={currentSchoolId}
                  onChange={(e) => setCurrentSchoolId(e.target.value)}
                  className="bg-transparent font-extrabold text-sm sm:text-base text-white hover:text-blue-300 transition-colors focus:outline-none cursor-pointer pr-2"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleOpenSchoolModal(currentSchool)}
                  className="p-1 text-slate-400 hover:text-white transition-colors"
                  title="Maktab nomini tahrirlash"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[11px] font-medium text-slate-400 flex items-center gap-2">
                <span>{schoolClasses.length} ta sinf</span>
                <span>&bull;</span>
                <span>{schoolTeachers.length} ta o&apos;qituvchi</span>
                <span>&bull;</span>
                <span>{totalWeeklyHours} haftalik soat</span>
              </p>
            </div>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => handleOpenSchoolModal()}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3 py-2 text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="h-4 w-4 text-blue-400" />
            <span className="hidden sm:inline">Yangi Maktab</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="h-4 w-4 text-amber-300 animate-pulse" />
            <span>Jadvalni Tuzish & Ko&apos;rish</span>
          </Link>
        </div>
      </header>

      {/* 2. STATS & QUICK BANNER */}
      <div className="border-b border-slate-800/60 bg-gradient-to-r from-slate-900/50 via-slate-900/80 to-slate-900/50 px-4 md:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-slate-300 font-semibold">Tizim Faol:</span>
              <span className="text-emerald-400 font-bold">1-4 sinf 5 kunlik &bull; Dushanba 1-soat Kelajak Soati</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateStandard22Classes}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Standart 22 ta Sinfni Qayta Tiklash (1A-11B)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE WITH TABS */}
      <div className="flex-1 flex flex-col md:flex-row max-w-[1700px] w-full mx-auto p-4 md:p-8 gap-6">
        {/* Left Side Tab Navigation */}
        <aside className="w-full md:w-64 shrink-0 flex md:flex-col gap-1.5 bg-slate-900/60 backdrop-blur-md p-3 rounded-2xl border border-slate-800 self-start">
          <button
            onClick={() => setActiveTab("CLASSES")}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "CLASSES"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.01]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <GraduationCap className="h-4 w-4" />
              <span>Sinflar (1A - 11B)</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "CLASSES" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {schoolClasses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("TEACHERS")}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "TEACHERS"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.01]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <Users className="h-4 w-4" />
              <span>O&apos;qituvchilar</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "TEACHERS" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {schoolTeachers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("AVAILABILITY")}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "AVAILABILITY"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.01]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4" />
              <span>Metod Kuni & Grafiki</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "AVAILABILITY" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              Matrix
            </span>
          </button>

          <button
            onClick={() => setActiveTab("SUBJECTS")}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "SUBJECTS"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.01]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4" />
              <span>Fanlar & SanPiN</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "SUBJECTS" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {schoolSubjects.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("ROOMS")}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "ROOMS"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.01]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <DoorOpen className="h-4 w-4" />
              <span>Xonalar & Lab</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "ROOMS" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {schoolRooms.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("BELLS")}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "BELLS"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.01]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4" />
              <span>Qo&apos;ng&apos;iroqlar Vaqti</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "BELLS" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              7 dars
            </span>
          </button>

          <button
            onClick={() => setActiveTab("SCHOOL_INFO")}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === "SCHOOL_INFO"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.01]"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4" />
              <span>Filial & Smenalar</span>
            </div>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === "SCHOOL_INFO" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}
            >
              {schoolBranches.length}
            </span>
          </button>
        </aside>

        {/* Tab Content Body */}
        <main className="flex-1 min-w-0">
          {/* ======================= TAB 1: SINFLAR (1A-11B) ======================= */}
          {activeTab === "CLASSES" && (
            <div className="space-y-6">
              {/* Header bar for Classes */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Sinflar Boshqaruvi</span>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      Jami: {schoolClasses.length} ta sinf
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Har bir sinf kartasidagi <strong className="text-slate-300">&quot;...&quot;</strong> menyusi orqali sinfni yopish, dublikat qilish va tahrirlash mumkin.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleOpenClassModal()}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Yangi Sinf Qo&apos;shish</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    { id: "ALL", label: `Barchasi (${schoolClasses.length})` },
                    {
                      id: "PRIMARY",
                      label: `Boshlang'ich 1-4 (${schoolClasses.filter((c) => c.grade <= 4).length})`,
                    },
                    {
                      id: "MIDDLE",
                      label: `O'rta 5-9 (${schoolClasses.filter((c) => c.grade >= 5 && c.grade <= 9).length})`,
                    },
                    {
                      id: "HIGH",
                      label: `Yuqori 10-11 (${schoolClasses.filter((c) => c.grade >= 10).length})`,
                    },
                    {
                      id: "CLOSED",
                      label: `Yopiq (${schoolClasses.filter((c) => c.isClosed).length})`,
                    },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setClassGradeFilter(f.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        classGradeFilter === f.id
                          ? "bg-slate-700 text-white border border-slate-600"
                          : "text-slate-400 hover:text-white hover:bg-slate-800"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Sinf nomini qidirish (masalan: 7-A)..."
                    value={classSearch}
                    onChange={(e) => setClassSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Class Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredClasses.map((cls) => {
                  const homeroom = cls.homeroomTeacherId ? teacherMap.get(cls.homeroomTeacherId) : null;
                  const totalHours = cls.subjects.reduce((sum, s) => sum + s.weeklyHours, 0);
                  const isClosed = !!cls.isClosed;
                  const isPrimary = cls.grade <= 4;
                  const isDropdownOpen = openDropdownClassId === cls.id;

                  return (
                    <div
                      key={cls.id}
                      className={`relative group rounded-2xl border transition-all duration-200 p-4.5 flex flex-col justify-between ${
                        isClosed
                          ? "bg-slate-900/40 border-slate-800/60 opacity-60"
                          : "bg-slate-900/90 border-slate-800 hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-600/5"
                      }`}
                    >
                      {/* Top Row: Class Name, Badges & "..." Button */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xl font-black tracking-tight ${
                                isClosed ? "text-slate-400 line-through" : "text-white"
                              }`}
                            >
                              {cls.name}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-black rounded-md border ${
                                isPrimary
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              }`}
                            >
                              {isPrimary ? "5 Kunlik (1-4)" : "6 Kunlik (5-11)"}
                            </span>
                            {isClosed && (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                                <Lock className="h-3 w-3" /> Yopiq
                              </span>
                            )}
                          </div>

                          {/* "..." Dropdown Menu Trigger */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownClassId(isDropdownOpen ? null : cls.id);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60 cursor-pointer"
                              title="Sinf amallari (...)"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {/* Dropdown Menu Popup */}
                            {isDropdownOpen && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-8 z-50 w-52 rounded-xl bg-slate-800/95 backdrop-blur-xl border border-slate-700 shadow-2xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-100"
                              >
                                <button
                                  onClick={(e) => {
                                    handleOpenClassModal(cls);
                                    setOpenDropdownClassId(null);
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Edit2 className="h-3.5 w-3.5 text-blue-400" />
                                  <span>Tahrirlash</span>
                                </button>

                                <button
                                  onClick={(e) => handleOpenClassSubjects(cls, e)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
                                  <span>Fanlar & Yuklama</span>
                                </button>

                                <button
                                  onClick={(e) => handleDuplicateClass(cls, e)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Copy className="h-3.5 w-3.5 text-amber-400" />
                                  <span>Dublikat qilish</span>
                                </button>

                                <button
                                  onClick={(e) => handleToggleCloseClass(cls, e)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
                                >
                                  {isClosed ? (
                                    <>
                                      <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                                      <span>Sinfni Ochish (Faol)</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="h-3.5 w-3.5 text-rose-400" />
                                      <span>Sinfni Yopish (No-faol)</span>
                                    </>
                                  )}
                                </button>

                                <div className="h-px bg-slate-700/60 my-1" />

                                <button
                                  onClick={(e) => handleDeleteClass(cls.id, e)}
                                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Sinfni O&apos;chirish</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Homeroom Teacher */}
                        <div className="mb-3 text-xs flex items-center gap-2 text-slate-300">
                          <Users className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                          <span className="truncate font-medium">
                            {homeroom ? homeroom.fullName : "Sinf rahbari tayinlanmagan"}
                          </span>
                        </div>

                        {/* Subject Pills preview */}
                        <div className="flex flex-wrap gap-1 mb-4 max-h-24 overflow-hidden">
                          {cls.subjects.map((s, idx) => {
                            const sub = subjectMap.get(s.subjectId);
                            if (!sub) return null;
                            const isKelajak = sub.id === "sub_kelajak";
                            return (
                              <span
                                key={idx}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${
                                  isKelajak
                                    ? "bg-purple-500/20 text-purple-300 border-purple-500/30 font-black"
                                    : "bg-slate-800 text-slate-300 border-slate-700"
                                }`}
                              >
                                <span>{sub.shortName || sub.name}</span>
                                <span className="text-slate-400">({s.weeklyHours}s)</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {/* Bottom stats row & quick action */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                        <div>
                          <strong className="text-white font-extrabold">{totalHours}</strong> soat / hafta
                        </div>
                        <button
                          onClick={(e) => handleOpenClassSubjects(cls, e)}
                          className="text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>Yuklamani ko&apos;rish</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================= TAB 2: O'QITUVCHILAR ======================= */}
          {activeTab === "TEACHERS" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>O&apos;qituvchilar Fondi</span>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      Jami: {schoolTeachers.length} nafar
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    O&apos;qituvchilarning haftalik stavkasi, dars yuklamalari va mutaxassislik fanlari.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleOpenTeacherModal()}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Yangi O&apos;qituvchi</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="O'qituvchi F.I.O yoki telefon..."
                  value={teacherSearch}
                  onChange={(e) => setTeacherSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Teachers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTeachers.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="text-sm font-black text-white">{t.fullName}</h3>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{t.phone || "+998 -- --- -- --"}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenTeacherModal(t)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(t.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Subjects */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {t.subjectIds.map((sid) => {
                          const sub = subjectMap.get(sid);
                          if (!sub) return null;
                          return (
                            <span
                              key={sid}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              {sub.name}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <div>
                        Maks. haftalik: <strong className="text-white">{t.weeklyHourCapacity} soat</strong>
                      </div>
                      <div>
                        Ketma-ket: <strong className="text-white">{t.maxConsecutiveHours} dars</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================= TAB 3: FANLAR & SANPIN ======================= */}
          {activeTab === "SUBJECTS" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Fanlar Ro&apos;yxati va SanPiN Qiyinlik Shkalasi</span>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      Jami: {schoolSubjects.length} ta fan
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    SanPiN gigiyenik talablariga ko&apos;ra fanlar qiyinlik baliga qarab haftaning o&apos;rtasiga taqsimlanadi.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleOpenSubjectModal()}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Yangi Fan Qo&apos;shish</span>
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Fan nomini qidirish..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Subjects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSubjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.colorTag }}
                          />
                          <h3 className="text-sm font-black text-white">{sub.name}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenSubjectModal(sub)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sub.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          Qisqa: <strong>{sub.shortName || sub.name.slice(0, 4)}</strong>
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                          SanPiN: {sub.difficultyScore} ball
                        </span>
                        {sub.allowDoubleLesson && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                            Juft dars ruxsat
                          </span>
                        )}
                        {sub.requiresRoomType && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">
                            Xona: {sub.requiresRoomType}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================= TAB: METOD KUNI & O'QITUVCHILAR GRAFIKI (PRORECTOR MATRIX) ======================= */}
          {activeTab === "AVAILABILITY" && (
            <div className="space-y-6">
              <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-400" />
                      <span>O&apos;qituvchilar Bo&apos;sh Vaqti va Metodik Kunlari Matrisasi</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      O&apos;qituvchilarning haftalik dars berolmaydigan soatlarini qizil qiling. Algoritm bu soatlarga umuman dars qo&apos;ymaydi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Matrix view for all teachers */}
              <div className="space-y-4">
                {schoolTeachers.map((t) => {
                  const DAYS = ["Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"];
                  const PERIODS = [1, 2, 3, 4, 5, 6, 7];

                  return (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-xs">
                            {t.fullName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-extrabold text-white">{t.fullName}</h3>
                            <p className="text-[11px] text-slate-400 font-mono">
                              Stavka: {t.weeklyHourCapacity} soat &bull; Ketma-ket maks: {t.maxConsecutiveHours} dars
                            </p>
                          </div>
                        </div>

                        {/* Metod kuni selector */}
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 font-bold">Metod Kuni:</span>
                          <div className="flex items-center gap-1">
                            {DAYS.map((dName, dIdx) => {
                              const dayNum = dIdx + 1;
                              const isMethod = t.methodDayOfWeek === dayNum;
                              return (
                                <button
                                  key={dayNum}
                                  onClick={() => {
                                    setTeachers(
                                      teachers.map((item) =>
                                        item.id === t.id
                                          ? {
                                              ...item,
                                              methodDayOfWeek: isMethod ? null : dayNum,
                                            }
                                          : item
                                      )
                                    );
                                  }}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                                    isMethod
                                      ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 scale-105"
                                      : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                                  }`}
                                >
                                  {dName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* 6x7 Matrix Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                          <thead>
                            <tr>
                              <th className="p-1.5 text-[11px] font-bold text-slate-400 text-left w-16">Kun</th>
                              {PERIODS.map((p) => (
                                <th key={p} className="p-1.5 text-[11px] font-bold text-slate-400">
                                  {p}-dars
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {DAYS.map((dName, dIdx) => {
                              const dayNum = dIdx + 1;
                              const isMethodDay = t.methodDayOfWeek === dayNum;

                              return (
                                <tr key={dayNum} className="border-t border-slate-800/60">
                                  <td className="p-1.5 text-xs font-bold text-slate-300 text-left">
                                    <div className="flex items-center gap-1.5">
                                      <span>{dName}</span>
                                      {isMethodDay && (
                                        <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 text-[9px] font-black">
                                          METOD
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  {PERIODS.map((p) => {
                                    const av = t.availabilities?.find(
                                      (a) => a.dayOfWeek === dayNum && a.period === p
                                    );
                                    const isAvailable = isMethodDay ? false : av ? av.isAvailable : true;

                                    return (
                                      <td key={p} className="p-1">
                                        <button
                                          onClick={() => {
                                            if (isMethodDay) return;
                                            const existing = t.availabilities || [];
                                            const foundIdx = existing.findIndex(
                                              (a) => a.dayOfWeek === dayNum && a.period === p
                                            );
                                            let updatedAv = [...existing];
                                            if (foundIdx !== -1) {
                                              updatedAv[foundIdx] = {
                                                ...updatedAv[foundIdx],
                                                isAvailable: !updatedAv[foundIdx].isAvailable,
                                              };
                                            } else {
                                              updatedAv.push({
                                                teacherId: t.id,
                                                dayOfWeek: dayNum,
                                                period: p,
                                                isAvailable: false,
                                              });
                                            }
                                            setTeachers(
                                              teachers.map((item) =>
                                                item.id === t.id ? { ...item, availabilities: updatedAv } : item
                                              )
                                            );
                                          }}
                                          disabled={isMethodDay}
                                          className={`w-full py-1.5 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                                            isAvailable
                                              ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                                              : "bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30"
                                          }`}
                                        >
                                          {isAvailable ? "✓" : "✗"}
                                        </button>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ======================= TAB: QO'NG'IROQLAR JADVALI (BELL SCHEDULE) ======================= */}
          {activeTab === "BELLS" && (
            <div className="space-y-6">
              <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      <span>Qo&apos;ng&apos;iroqlar Jadvali & Tanaffuslar (Smena 1)</span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Darslarning boshlanish, tugash vaqtlari va katta tanaffus (ovqatlanish/dam olish).
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { p: 1, start: "08:00", end: "08:45", breakMin: 5, isBig: false },
                  { p: 2, start: "08:50", end: "09:35", breakMin: 10, isBig: false },
                  { p: 3, start: "09:45", end: "10:30", breakMin: 20, isBig: true },
                  { p: 4, start: "10:50", end: "11:35", breakMin: 10, isBig: false },
                  { p: 5, start: "11:45", end: "12:30", breakMin: 5, isBig: false },
                  { p: 6, start: "12:35", end: "13:20", breakMin: 10, isBig: false },
                  { p: 7, start: "13:30", end: "14:15", breakMin: 0, isBig: false },
                ].map((bell) => (
                  <div
                    key={bell.p}
                    className={`p-4 rounded-2xl border transition-all ${
                      bell.isBig
                        ? "bg-indigo-950/30 border-indigo-500/40"
                        : "bg-slate-900/90 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-black text-white">{bell.p}-DARS</span>
                      {bell.isBig && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/30">
                          Katta Tanaffus (20 daqiqa)
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs mt-3">
                      <div className="space-y-0.5">
                        <span className="text-slate-400">Boshlanishi:</span>
                        <p className="font-mono text-base font-extrabold text-emerald-400">{bell.start}</p>
                      </div>
                      <div className="h-6 w-px bg-slate-800" />
                      <div className="space-y-0.5">
                        <span className="text-slate-400">Tugashi:</span>
                        <p className="font-mono text-base font-extrabold text-blue-400">{bell.end}</p>
                      </div>
                      <div className="h-6 w-px bg-slate-800" />
                      <div className="space-y-0.5">
                        <span className="text-slate-400">Tanaffus:</span>
                        <p className="font-mono text-xs font-extrabold text-slate-300">{bell.breakMin} daq</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activeTab === "ROOMS" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h2 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Xonalar & Maxsus Laboratoriyalar</span>
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                      Jami: {schoolRooms.length} ta xona
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sport zallari, fizika-kimyo laboratoriyalari va informatika xonalari to&apos;qnashuvsiz boshqariladi.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => handleOpenRoomModal()}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Yangi Xona Qo&apos;shish</span>
                  </button>
                </div>
              </div>

              {/* Rooms Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRooms.map((room) => (
                  <div
                    key={room.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-between hover:border-slate-700 transition-all"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <DoorOpen className="h-5 w-5 text-blue-400" />
                          <div>
                            <h3 className="text-sm font-black text-white">{room.name}</h3>
                            <span className="text-[11px] font-bold text-slate-400">
                              {branchMap.get(room.branchId)?.name || "Asosiy Bino"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenRoomModal(room)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <span className="px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                          Turi: {room.roomType}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                          Sig&apos;imi: {room.capacity} o&apos;rin
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ======================= TAB 5: MAKTAB FILIALLARI & SMENALAR ======================= */}
          {activeTab === "SCHOOL_INFO" && (
            <div className="space-y-6">
              <div className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-400" />
                  <span>Maktab Umumiy Parametrlari</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <span className="text-slate-400">Maktab Nomi:</span>
                    <p className="text-base font-extrabold text-white">{currentSchool?.name}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-1">
                    <span className="text-slate-400">Tizimdagi identifikator (Slug):</span>
                    <p className="text-base font-extrabold text-blue-400 font-mono">{currentSchool?.slug}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenSchoolModal(currentSchool)}
                    className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-md cursor-pointer"
                  >
                    Maktab Nomini Tahrirlash
                  </button>

                  <button
                    onClick={() => handleDeleteSchool(currentSchoolId)}
                    className="px-4 py-2 text-xs font-bold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl transition-all cursor-pointer"
                  >
                    Ushbu Maktabni O&apos;chirish
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ======================= MODAL: MAKTAB QO'SHISH / TAHRIRLASH ======================= */}
      {isSchoolModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                {editingSchool ? "Maktabni Tahrirlash" : "Yangi Maktab Qo'shish"}
              </h3>
              <button onClick={() => setIsSchoolModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchool} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Maktab Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 45-Umumiy o'rta ta'lim maktabi"
                  value={schoolFormData.name}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Slug (Identifikator)</label>
                <input
                  type="text"
                  placeholder="maktab-45"
                  value={schoolFormData.slug}
                  onChange={(e) => setSchoolFormData({ ...schoolFormData, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {!editingSchool && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                  <label className="flex items-center gap-2 text-white font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schoolFormData.createDefaultClasses}
                      onChange={(e) =>
                        setSchoolFormData({ ...schoolFormData, createDefaultClasses: e.target.checked })
                      }
                      className="rounded border-slate-700 text-blue-600 focus:ring-0"
                    />
                    <span>Standart 1-A dan 11-B gacha 22 ta sinfni avtomatik yaratish</span>
                  </label>
                  <p className="text-[11px] text-slate-400 pl-5">
                    Har bir sinfga vazirlik o&apos;quv rejasi va Dushanba 1-soat Kelajak Soati avtomatik biriktiriladi.
                  </p>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSchoolModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: SINF QO'SHISH / TAHRIRLASH ======================= */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                {editingClass ? `${editingClass.name} Sinfini Tahrirlash` : "Yangi Sinf Qo'shish"}
              </h3>
              <button onClick={() => setIsClassModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Sinf Nomi</label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: 7-A"
                    value={classFormData.name}
                    onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Bosqich (Grade 1-11)</label>
                  <input
                    type="number"
                    min={1}
                    max={11}
                    required
                    value={classFormData.grade}
                    onChange={(e) => setClassFormData({ ...classFormData, grade: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Sinf Rahbari</label>
                <select
                  value={classFormData.homeroomTeacherId}
                  onChange={(e) => setClassFormData({ ...classFormData, homeroomTeacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Sinf rahbari tanlanmagan --</option>
                  {schoolTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-white font-bold cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={classFormData.isClosed}
                    onChange={(e) => setClassFormData({ ...classFormData, isClosed: e.target.checked })}
                    className="rounded border-slate-700 text-rose-600 focus:ring-0"
                  />
                  <span>Sinfni yopish (Dars jadvaliga kiritmaslik)</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: SINF FANLARI & YUKLAMA BOSHQARUVI ======================= */}
      {isClassSubjectsModalOpen && selectedClassForSubjects && (
        <ClassSubjectsManagerModal
          cls={selectedClassForSubjects}
          subjects={schoolSubjects}
          teachers={schoolTeachers}
          onClose={() => setIsClassSubjectsModalOpen(false)}
          onSave={handleSaveClassSubjects}
        />
      )}

      {/* ======================= MODAL: O'QITUVCHI CRUD ======================= */}
      {isTeacherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                {editingTeacher ? "O'qituvchini Tahrirlash" : "Yangi O'qituvchi Qo'shish"}
              </h3>
              <button onClick={() => setIsTeacherModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">F.I.O</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Qodirova Malika"
                  value={teacherFormData.fullName}
                  onChange={(e) => setTeacherFormData({ ...teacherFormData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Telefon</label>
                  <input
                    type="text"
                    placeholder="+998 90 123 45 67"
                    value={teacherFormData.phone}
                    onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Haftalik Stavka (Soat)</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={teacherFormData.weeklyHourCapacity}
                    onChange={(e) =>
                      setTeacherFormData({ ...teacherFormData, weeklyHourCapacity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Dars beradigan fanlari</label>
                <div className="max-h-36 overflow-y-auto p-2 bg-slate-800 rounded-xl border border-slate-700 space-y-1">
                  {schoolSubjects.map((sub) => {
                    const isChecked = teacherFormData.subjectIds.includes(sub.id);
                    return (
                      <label
                        key={sub.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-700 text-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setTeacherFormData({
                                ...teacherFormData,
                                subjectIds: [...teacherFormData.subjectIds, sub.id],
                              });
                            } else {
                              setTeacherFormData({
                                ...teacherFormData,
                                subjectIds: teacherFormData.subjectIds.filter((id) => id !== sub.id),
                              });
                            }
                          }}
                          className="rounded border-slate-600 text-blue-600 focus:ring-0"
                        />
                        <span>{sub.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTeacherModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: FAN CRUD ======================= */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                {editingSubject ? "Fanni Tahrirlash" : "Yangi Fan Qo'shish"}
              </h3>
              <button onClick={() => setIsSubjectModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Fan Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Matematika / Algebra"
                  value={subjectFormData.name}
                  onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Qisqa Nomi</label>
                  <input
                    type="text"
                    placeholder="Mat"
                    value={subjectFormData.shortName}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, shortName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">SanPiN Qiyinlik Bali (1-13)</label>
                  <input
                    type="number"
                    min={1}
                    max={13}
                    value={subjectFormData.difficultyScore}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, difficultyScore: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Xona Talabi</label>
                  <select
                    value={subjectFormData.requiresRoomType}
                    onChange={(e) => setSubjectFormData({ ...subjectFormData, requiresRoomType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="NONE">Oddiy Sinf Xonasi</option>
                    <option value="GYM">Sport Zali (GYM)</option>
                    <option value="LAB">Laboratoriya (LAB)</option>
                    <option value="COMP_LAB">Informatika Xonasi (COMP_LAB)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Rang Teg</label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={subjectFormData.colorTag}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, colorTag: e.target.value })}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <span className="font-mono text-slate-300">{subjectFormData.colorTag}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-1">
                <label className="flex items-center gap-2 text-white font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subjectFormData.allowDoubleLesson}
                    onChange={(e) =>
                      setSubjectFormData({ ...subjectFormData, allowDoubleLesson: e.target.checked })
                    }
                    className="rounded border-slate-700 text-blue-600 focus:ring-0"
                  />
                  <span>Juft dars (2 soat ketma-ket) o&apos;tishga ruxsat</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: XONA CRUD ======================= */}
      {isRoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                {editingRoom ? "Xonani Tahrirlash" : "Yangi Xona Qo'shish"}
              </h3>
              <button onClick={() => setIsRoomModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Xona Nomi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Fizika Laboratoriyasi"
                  value={roomFormData.name}
                  onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Xona Turi</label>
                  <select
                    value={roomFormData.roomType}
                    onChange={(e) => setRoomFormData({ ...roomFormData, roomType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="GENERAL">Umumiy Sinf Xonasi</option>
                    <option value="GYM">Sport Zali (GYM)</option>
                    <option value="LAB">Fizika/Kimyo Laboratoriyasi</option>
                    <option value="COMP_LAB">Informatika Xonasi</option>
                    <option value="OUTDOOR_PITCH">Ochiq Maydon / Stadion</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-bold">Sig&apos;imi (O&apos;rin)</label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={roomFormData.capacity}
                    onChange={(e) => setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold shadow-lg shadow-blue-600/30 cursor-pointer"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------- SUB-COMPONENT: SINF FANLARI & YUKLAMA MODAL -----------------
function ClassSubjectsManagerModal({
  cls,
  subjects,
  teachers,
  onClose,
  onSave,
}: {
  cls: SchoolClass;
  subjects: Subject[];
  teachers: Teacher[];
  onClose: () => void;
  onSave: (updated: ClassSubject[]) => void;
}) {
  const [currentSubjects, setCurrentSubjects] = useState<ClassSubject[]>(cls.subjects || []);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || "");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(teachers[0]?.id || "");
  const [hours, setHours] = useState<number>(2);

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const teacherMap = useMemo(() => new Map(teachers.map((t) => [t.id, t])), [teachers]);

  const totalHours = useMemo(() => {
    return currentSubjects.reduce((sum, s) => sum + s.weeklyHours, 0);
  }, [currentSubjects]);

  const handleAddSubject = () => {
    if (!selectedSubjectId || !selectedTeacherId || hours <= 0) return;

    const existingIndex = currentSubjects.findIndex((s) => s.subjectId === selectedSubjectId);
    if (existingIndex !== -1) {
      const updated = [...currentSubjects];
      updated[existingIndex] = {
        classId: cls.id,
        subjectId: selectedSubjectId,
        teacherId: selectedTeacherId,
        weeklyHours: hours,
      };
      setCurrentSubjects(updated);
    } else {
      setCurrentSubjects([
        ...currentSubjects,
        {
          classId: cls.id,
          subjectId: selectedSubjectId,
          teacherId: selectedTeacherId,
          weeklyHours: hours,
        },
      ]);
    }
  };

  const handleRemoveSubject = (subjectId: string) => {
    setCurrentSubjects(currentSubjects.filter((s) => s.subjectId !== subjectId));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <span>{cls.name} Sinfining Dars Yuklamalari & Tarifikatsiyasi</span>
            </h3>
            <p className="text-xs text-slate-400">
              Jami: <strong className="text-white font-extrabold">{totalHours} soat / hafta</strong> (SanPiN tavsiyasi: 20-30 soat)
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Add New Subject Row */}
        <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-wrap items-center gap-3 text-xs">
          <div className="flex-1 min-w-[140px]">
            <label className="text-slate-300 font-bold block mb-1">Fan</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.shortName || s.name})
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[160px]">
            <label className="text-slate-300 font-bold block mb-1">O&apos;qituvchi</label>
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="w-20">
            <label className="text-slate-300 font-bold block mb-1">Haftalik soat</label>
            <input
              type="number"
              min={1}
              max={10}
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none"
            />
          </div>

          <div className="self-end">
            <button
              onClick={handleAddSubject}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Biriktirish</span>
            </button>
          </div>
        </div>

        {/* Existing Subjects List */}
        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
          {currentSubjects.map((cs) => {
            const sub = subjectMap.get(cs.subjectId);
            const teacher = teacherMap.get(cs.teacherId);
            const isKelajak = cs.subjectId === "sub_kelajak";

            return (
              <div
                key={cs.subjectId}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                  isKelajak
                    ? "bg-purple-950/20 border-purple-800/40"
                    : "bg-slate-800/40 border-slate-700/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: sub?.colorTag || "#3B82F6" }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white">{sub?.name || cs.subjectId}</span>
                      {isKelajak && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-bold text-[10px]">
                          Dushanba 1-soat
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      O&apos;qituvchi: {teacher?.fullName || "Tayinlanmagan"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-200">
                    <strong className="text-white text-sm">{cs.weeklyHours}</strong> soat / hafta
                  </span>

                  <button
                    onClick={() => handleRemoveSubject(cs.subjectId)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                    title="Fanni o'chirish"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs cursor-pointer"
          >
            Bekor qilish
          </button>
          <button
            onClick={() => onSave(currentSubjects)}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold text-xs shadow-lg shadow-blue-600/30 cursor-pointer"
          >
            Yuklamani Saqlash
          </button>
        </div>
      </div>
    </div>
  );
}
