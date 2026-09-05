"use client";

import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Teacher } from "@/types";
import {
  Search,
  ChevronDown,
  Check,
  UserCheck,
  X,
  Sparkles,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";

export interface TeacherSelectComboboxProps {
  value: string;
  onChange: (teacherId: string) => void;
  teachers: Teacher[];
  candidates?: Teacher[];
  homeroomTeacherId?: string | null;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  theme?: "default" | "sky" | "purple" | "indigo";
}

export const TeacherSelectCombobox: React.FC<TeacherSelectComboboxProps> = ({
  value,
  onChange,
  teachers,
  candidates = [],
  homeroomTeacherId,
  placeholder = "O'qituvchini tanlang...",
  disabled = false,
  size = "md",
  theme = "default",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showOtherTeachers, setShowOtherTeachers] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{
    top: number;
    left: number;
    width: number;
    placeAbove: boolean;
  } | null>(null);

  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === value),
    [teachers, value]
  );

  const candidateIdSet = useMemo(
    () => new Set(candidates.map((c) => c.id)),
    [candidates]
  );

  const isCurrentTeacherNonSpecialist = useMemo(() => {
    if (!selectedTeacher || candidates.length === 0) return false;
    return !candidateIdSet.has(selectedTeacher.id);
  }, [selectedTeacher, candidates.length, candidateIdSet]);

  const homeroomTeacher = useMemo(
    () => (homeroomTeacherId ? teachers.find((t) => t.id === homeroomTeacherId) : undefined),
    [teachers, homeroomTeacherId]
  );

  // Position calculation
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 350;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const minWidth = Math.max(rect.width, 460);
    let left = rect.left;
    if (left + minWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - minWidth - 16);
    }

    setCoords({
      top: placeAbove ? rect.top - 6 : rect.bottom + 6,
      left,
      width: minWidth,
      placeAbove,
    });
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setSearch("");
      setShowOtherTeachers(false);
      setIsOpen(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = (e: Event) => {
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, updatePosition]);

  // Filter teachers
  const q = search.trim().toLowerCase();

  const filteredCandidates = useMemo(() => {
    if (!candidates || candidates.length === 0) return [];
    if (!q) return candidates;
    return candidates.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        (t.phone && t.phone.toLowerCase().includes(q))
    );
  }, [candidates, q]);

  const filteredOtherTeachers = useMemo(() => {
    const others = teachers.filter((t) => !candidateIdSet.has(t.id));
    if (!q) return others;
    return others.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        (t.phone && t.phone.toLowerCase().includes(q))
    );
  }, [teachers, candidateIdSet, q]);

  // Theme styling for trigger button
  const getButtonBorderStyles = () => {
    if (disabled) {
      return "bg-muted/40 text-muted-foreground border-border cursor-not-allowed";
    }
    if (!value) {
      return "border-amber-400/80 bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold hover:bg-amber-500/15";
    }
    if (isCurrentTeacherNonSpecialist) {
      return "border-amber-400 bg-amber-500/10 text-foreground hover:border-amber-500";
    }
    if (isOpen) {
      if (theme === "sky") return "border-sky-500 ring-2 ring-sky-500/20 bg-background shadow-xs";
      if (theme === "purple") return "border-purple-500 ring-2 ring-purple-500/20 bg-background shadow-xs";
      if (theme === "indigo") return "border-indigo-500 ring-2 ring-indigo-500/20 bg-background shadow-xs";
      return "border-primary ring-2 ring-primary/20 bg-background shadow-xs";
    }
    if (theme === "sky") return "border-sky-300/80 hover:border-sky-500 bg-background text-foreground";
    if (theme === "purple") return "border-purple-300/80 hover:border-purple-500 bg-background text-foreground";
    if (theme === "indigo") return "border-indigo-300/80 hover:border-indigo-500 bg-background text-foreground";
    return "border-border hover:border-primary/60 bg-background text-foreground";
  };

  const isSmall = size === "sm";

  return (
    <div className="relative w-full">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        className={`w-full flex items-center justify-between border text-left transition-all cursor-pointer ${
          isSmall
            ? "px-2.5 py-1.5 text-xs font-semibold rounded-xl"
            : "px-3.5 py-2.5 text-sm font-bold rounded-2xl shadow-xs"
        } ${getButtonBorderStyles()}`}
      >
        <div className="flex items-center gap-2.5 truncate min-w-0">
          {selectedTeacher ? (
            <>
              <div
                className={`${
                  isSmall ? "w-5 h-5 text-[10px] rounded-md" : "w-6 h-6 text-xs rounded-lg"
                } flex items-center justify-center font-black shrink-0 ${
                  candidateIdSet.has(selectedTeacher.id)
                    ? "bg-amber-500 text-white shadow-xs"
                    : isCurrentTeacherNonSpecialist
                    ? "bg-amber-600 text-white"
                    : theme === "sky"
                    ? "bg-sky-500 text-white"
                    : theme === "purple"
                    ? "bg-purple-500 text-white"
                    : "bg-primary/15 text-primary"
                }`}
              >
                {candidateIdSet.has(selectedTeacher.id) ? "★" : selectedTeacher.fullName.charAt(0)}
              </div>
              <span className={`truncate font-bold text-foreground ${isSmall ? "text-xs" : "text-[13.5px]"}`}>
                {selectedTeacher.fullName}
              </span>
              {isCurrentTeacherNonSpecialist && (
                <span className="text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-md border border-amber-400/40 shrink-0">
                  Mutaxassis emas
                </span>
              )}
              {selectedTeacher.weeklyHourCapacity !== undefined && !isCurrentTeacherNonSpecialist && (
                <span className={`font-bold text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-md ${
                  isSmall ? "text-[10px]" : "text-xs"
                }`}>
                  {selectedTeacher.weeklyHourCapacity} st
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold truncate">
              <AlertTriangle className={isSmall ? "w-3.5 h-3.5 shrink-0" : "w-4 h-4 shrink-0"} />
              <span className={`truncate ${isSmall ? "text-xs" : "text-sm"}`}>{placeholder}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-1.5 text-muted-foreground">
          {selectedTeacher && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
              title="O'qituvchini olib tashlash"
            >
              <X className={isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} />
            </span>
          )}
          <ChevronDown
            className={`${isSmall ? "w-3.5 h-3.5" : "w-4 h-4"} transition-transform duration-200 ${
              isOpen ? "rotate-180 text-primary" : ""
            }`}
          />
        </div>
      </button>

      {/* Portal Dropdown Popover */}
      {isOpen &&
        coords &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: coords.placeAbove ? undefined : coords.top,
              bottom: coords.placeAbove ? window.innerHeight - coords.top : undefined,
              left: coords.left,
              width: coords.width,
              maxWidth: "calc(100vw - 32px)",
              zIndex: 99999,
            }}
            className="bg-popover/98 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[440px]"
          >
            {/* Search Bar Header */}
            <div className="p-2.5 border-b border-border/60 bg-muted/40 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Mutaxassis o'qituvchini qidiring..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60 text-foreground font-medium"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-md cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Teacher List */}
            <div className="overflow-y-auto p-2 space-y-1 custom-scrollbar flex-1">
              {/* If current teacher is non-specialist, show clear warning banner */}
              {isCurrentTeacherNonSpecialist && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Hozirgi ustoz ushbu fan mutaxassisi emas!</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    «{selectedTeacher?.fullName}» boshqa fan o'qituvchisi. Quyidagi haqiqiy mutaxassislardan birini tanlang:
                  </p>
                </div>
              )}

              {/* Unassign option */}
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors text-left font-medium cursor-pointer ${
                  !value
                    ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></span>
                  <span className="font-semibold">⚠️ Biriktirilmagan (Bo'sh qoldirish)</span>
                </div>
                {!value && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400 font-bold" />}
              </button>

              {/* Homeroom teacher option if applicable */}
              {homeroomTeacher && (!q || homeroomTeacher.fullName.toLowerCase().includes(q)) && (
                <div className="pt-2 pb-1">
                  <div className="px-3 py-1 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Sinf rahbari</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(homeroomTeacher.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors text-left mt-1 cursor-pointer ${
                      value === homeroomTeacher.id
                        ? "bg-indigo-600 text-white font-bold"
                        : "hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-amber-400 text-sm">⭐</span>
                      <span className="truncate font-bold">{homeroomTeacher.fullName}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                          value === homeroomTeacher.id
                            ? "bg-white/20 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {homeroomTeacher.weeklyHourCapacity} st
                      </span>
                    </div>
                    {value === homeroomTeacher.id && <Check className="w-4 h-4 shrink-0 ml-2" />}
                  </button>
                </div>
              )}

              {/* Recommended Specialists (Always shown if available) */}
              {filteredCandidates.length > 0 && (
                <div className="pt-2 pb-1">
                  <div className="px-3 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⭐️ Mutaxassis o'qituvchilar ({filteredCandidates.length})</span>
                  </div>
                  {filteredCandidates.map((t) => {
                    const isSelected = t.id === value;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          onChange(t.id);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors text-left mt-1 cursor-pointer ${
                          isSelected
                            ? "bg-emerald-600 text-white font-bold shadow-xs"
                            : "hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-amber-400 text-sm">★</span>
                          <span className="truncate font-bold">{t.fullName}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                              isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {t.weeklyHourCapacity} st
                          </span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* If no candidates exist for this subject in the whole school */}
              {candidates.length === 0 && (
                <div className="py-2.5 px-3.5 text-center text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded-xl font-semibold">
                  ⚠️ Ushbu fanga maktabda biriktirilgan mutaxassis yo'q
                </div>
              )}

              {/* Toggle to view other non-specialist teachers */}
              {candidates.length > 0 && !q && (
                <button
                  type="button"
                  onClick={() => setShowOtherTeachers(!showOtherTeachers)}
                  className="w-full py-2 px-3 text-xs font-bold text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl transition-all text-center flex items-center justify-center gap-1.5 border border-dashed border-border mt-2 cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>
                    {showOtherTeachers
                      ? "▲ Faqat mutaxassislarni ko'rsatish"
                      : `➕ Boshqa fan o'qituvchilari (${filteredOtherTeachers.length})`}
                  </span>
                </button>
              )}

              {/* Non-specialist other teachers (ONLY shown when expanded or explicitly searched) */}
              {(showOtherTeachers || !!q || candidates.length === 0) &&
                filteredOtherTeachers.length > 0 && (
                  <div className="pt-2 pb-1">
                    <div className="px-3 py-1.5 text-xs font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span>Boshqa o'qituvchilar ({filteredOtherTeachers.length})</span>
                    </div>
                    {filteredOtherTeachers.map((t) => {
                      const isSelected = t.id === value;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onChange(t.id);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors text-left mt-1 cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-bold"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 ${
                                isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {t.fullName.charAt(0)}
                            </div>
                            <span className="truncate font-semibold">{t.fullName}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                                isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {t.weeklyHourCapacity} st
                            </span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* Empty state */}
              {filteredCandidates.length === 0 &&
                (showOtherTeachers || !!q || candidates.length === 0) &&
                filteredOtherTeachers.length === 0 && (
                  <div className="py-8 text-center px-4 space-y-1">
                    <p className="text-xs font-bold text-foreground">O'qituvchi topilmadi</p>
                    <p className="text-[11px] text-muted-foreground">
                      "{search}" so'rovi bo'yicha hech qanday o'qituvchi topilmadi.
                    </p>
                  </div>
                )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
