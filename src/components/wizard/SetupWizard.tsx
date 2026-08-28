"use client";

import React, { useState } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  School as SchoolIcon,
  BookOpen,
  DoorOpen,
  Users,
  GraduationCap,
  Plus,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import {
  Branch,
  Shift,
  Subject,
  Teacher,
  Room,
  SchoolClass,
} from "@/types";

interface SetupWizardProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  shifts: Shift[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  classes: SchoolClass[];
  onSave: (data: {
    branches: Branch[];
    shifts: Shift[];
    subjects: Subject[];
    teachers: Teacher[];
    rooms: Room[];
    classes: SchoolClass[];
  }) => void;
}

const STEPS = [
  { id: 1, name: "Filiallar & Smenalar", icon: SchoolIcon },
  { id: 2, name: "Fanlar & SanPiN", icon: BookOpen },
  { id: 3, name: "Xonalar & Maydonlar", icon: DoorOpen },
  { id: 4, name: "O'qituvchilar", icon: Users },
  { id: 5, name: "Sinflar & Tarifikatsiya", icon: GraduationCap },
];

export const SetupWizard: React.FC<SetupWizardProps> = ({
  isOpen,
  onClose,
  branches: initialBranches,
  shifts: initialShifts,
  subjects: initialSubjects,
  teachers: initialTeachers,
  rooms: initialRooms,
  classes: initialClasses,
  onSave,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects);
  const [teachers, setTeachers] = useState<Teacher[]>(initialTeachers);
  const [rooms, setRooms] = useState<Room[]>(initialRooms);
  const [classes, setClasses] = useState<SchoolClass[]>(initialClasses);

  if (!isOpen) return null;

  // 1-bosqich: Filial qo'shish
  const addBranch = () => {
    const newB: Branch = {
      id: `b_${Date.now()}`,
      schoolId: "school_1",
      name: `Yangi Filial ${branches.length + 1}`,
      isMain: false,
    };
    setBranches([...branches, newB]);
  };

  // 2-bosqich: Fan qo'shish
  const addSubject = () => {
    const newSub: Subject = {
      id: `sub_${Date.now()}`,
      schoolId: "school_1",
      name: "Yangi Fan",
      shortName: "Fan",
      colorTag: "#3B82F6",
      difficultyScore: 5,
      allowDoubleLesson: false,
    };
    setSubjects([...subjects, newSub]);
  };

  // 3-bosqich: Xona qo'shish
  const addRoom = () => {
    const newR: Room = {
      id: `r_${Date.now()}`,
      schoolId: "school_1",
      branchId: branches[0]?.id || "b1",
      name: "Yangi Xona",
      roomType: "GENERAL",
      capacity: 35,
    };
    setRooms([...rooms, newR]);
  };

  // 5-bosqich: Sinfdan nusxa olish (Duplicate)
  const duplicateClass = (sourceClass: SchoolClass) => {
    const nextChar = String.fromCharCode(sourceClass.name.charCodeAt(sourceClass.name.length - 1) + 1);
    const newClassName = `${sourceClass.grade}-${nextChar || "B"}`;
    const newCls: SchoolClass = {
      ...sourceClass,
      id: `c_${Date.now()}`,
      name: newClassName,
      subjects: sourceClass.subjects.map((s) => ({ ...s })),
    };
    setClasses([...classes, newCls]);
  };

  const handleFinish = () => {
    onSave({ branches, shifts, subjects, teachers, rooms, classes });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in">
      <div className="flex h-[85vh] w-full max-w-5xl flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-bold text-lg text-foreground">Maktab Setup Wizard</h2>
            <p className="text-xs text-muted-foreground">
              Bosqichma-bosqich maktab ma&apos;lumotlarini sozlash
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step Indicator & Content Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Step Sidebar */}
          <div className="w-64 border-r border-border bg-muted/20 p-4 space-y-1">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPassed = currentStep > step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                      : isPassed
                      ? "text-foreground hover:bg-muted font-medium"
                      : "text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-lg ${
                      isActive
                        ? "bg-white/20 text-white"
                        : isPassed
                        ? "bg-emerald-500/20 text-emerald-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isPassed ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span>{step.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Step 1: Filiallar & Smenalar */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">Maktab Filiallari</h3>
                  <button
                    onClick={addBranch}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Filial qo&apos;shish</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {branches.map((b, i) => (
                    <div
                      key={b.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 bg-card"
                    >
                      <input
                        type="text"
                        value={b.name}
                        onChange={(e) => {
                          const updated = [...branches];
                          updated[i].name = e.target.value;
                          setBranches(updated);
                        }}
                        className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs bg-background focus:outline-none"
                      />
                      <span className="text-xs text-muted-foreground">
                        {b.isMain ? "(Asosiy bino)" : "(Filial)"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Fanlar & SanPiN */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Fanlar va SanPiN Qiyinlik Ballari
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      SanPiN aqliy yuklama shkalasi (1-13 ball). Zavuch ballarni o&apos;zgartirishi mumkin.
                    </p>
                  </div>
                  <button
                    onClick={addSubject}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Fan qo&apos;shish</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
                  {subjects.map((sub, i) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 bg-card"
                    >
                      <input
                        type="color"
                        value={sub.colorTag}
                        onChange={(e) => {
                          const updated = [...subjects];
                          updated[i].colorTag = e.target.value;
                          setSubjects(updated);
                        }}
                        className="h-7 w-7 rounded border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => {
                          const updated = [...subjects];
                          updated[i].name = e.target.value;
                          setSubjects(updated);
                        }}
                        className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs bg-background focus:outline-none font-semibold"
                      />
                      {/* SanPiN Score */}
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-muted-foreground">SanPiN:</span>
                        <input
                          type="number"
                          min="1"
                          max="13"
                          value={sub.difficultyScore}
                          onChange={(e) => {
                            const updated = [...subjects];
                            updated[i].difficultyScore = Number(e.target.value);
                            setSubjects(updated);
                          }}
                          className="w-14 rounded-lg border border-border px-2 py-1 text-xs text-center bg-background focus:outline-none"
                        />
                      </div>
                      {/* Juftlik Dars */}
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer text-muted-foreground select-none">
                        <input
                          type="checkbox"
                          checked={sub.allowDoubleLesson}
                          onChange={(e) => {
                            const updated = [...subjects];
                            updated[i].allowDoubleLesson = e.target.checked;
                            setSubjects(updated);
                          }}
                          className="rounded"
                        />
                        <span>2 soat juftlik</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Xonalar */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">Xonalar va Maydonlar</h3>
                  <button
                    onClick={addRoom}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Xona qo&apos;shish</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {rooms.map((r, i) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 rounded-xl border border-border p-3 bg-card"
                    >
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => {
                          const updated = [...rooms];
                          updated[i].name = e.target.value;
                          setRooms(updated);
                        }}
                        className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs bg-background focus:outline-none"
                      />
                      <select
                        value={r.roomType}
                        onChange={(e) => {
                          const updated = [...rooms];
                          updated[i].roomType = e.target.value as any;
                          setRooms(updated);
                        }}
                        className="rounded-lg border border-border px-2 py-1.5 text-xs bg-background focus:outline-none"
                      >
                        <option value="GENERAL">Oddiy Sinfxona</option>
                        <option value="GYM">Sport Zali</option>
                        <option value="OUTDOOR_PITCH">Ochiq Maydon</option>
                        <option value="COMP_LAB">Informatika Lab</option>
                        <option value="LAB">Fizika/Kimyo Lab</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: O'qituvchilar */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-foreground">O&apos;qituvchilar Ro&apos;yxati</h3>
                </div>
                <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-2">
                  {teachers.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between rounded-xl border border-border p-3 bg-card"
                    >
                      <div>
                        <span className="font-semibold text-xs text-foreground block">
                          {t.fullName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{t.phone}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-blue-600">
                          {t.weeklyHourCapacity} soat
                        </span>
                        <span className="text-[10px] text-muted-foreground block">haftalik sig&apos;im</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Sinflar & Duplicate */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Sinflar va Tarifikatsiya</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Sinf fan-soat tuzilmasini boshqa sinflarga 1-click bilan nusxalash (Duplicate)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-2">
                  {classes.map((cls) => (
                    <div
                      key={cls.id}
                      className="rounded-xl border border-border p-3 bg-card space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-blue-600">{cls.name}</span>
                        <button
                          onClick={() => duplicateClass(cls)}
                          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-semibold hover:bg-muted transition-colors"
                          title="Shu sinf tuzilmasidan yangi sinf nusxalash"
                        >
                          <Copy className="h-3 w-3 text-blue-600" />
                          <span>Nusxa olish</span>
                        </button>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {cls.subjects.length} ta fan biriktirilgan (Jami:{" "}
                        {cls.subjects.reduce((a, b) => a + b.weeklyHours, 0)} soat)
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-border px-6 py-3.5 bg-muted/20">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Oldingisi</span>
          </button>

          {currentStep < STEPS.length ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-semibold shadow-md transition-colors"
            >
              <span>Keyingisi</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 text-xs font-semibold shadow-md transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>Saqlash va Yakunlash</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
