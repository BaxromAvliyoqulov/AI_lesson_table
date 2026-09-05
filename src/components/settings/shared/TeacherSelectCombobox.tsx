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

  const homeroomTeacher = useMemo(
    () => (homeroomTeacherId ? teachers.find((t) => t.id === homeroomTeacherId) : undefined),
    [teachers, homeroomTeacherId]
  );

  // Position calculation
  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 340;
    const spaceBelow = window.innerHeight - rect.bottom;
    const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const minWidth = Math.max(rect.width, 320);
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
      // If scroll inside popover, ignore
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

  const candidateIdSet = useMemo(
    () => new Set(candidates.map((c) => c.id)),
    [candidates]
  );

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
        className={`w-full flex items-center justify-between rounded-xl border text-left transition-all ${
          isSmall ? "px-2.5 py-1.5 text-xs font-semibold" : "px-3 py-2 text-xs font-semibold"
        } ${getButtonBorderStyles()}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0">
          {selectedTeacher ? (
            <>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                  candidateIdSet.has(selectedTeacher.id)
                    ? "bg-amber-500 text-white shadow-xs"
                    : theme === "sky"
                    ? "bg-sky-500 text-white"
                    : theme === "purple"
                    ? "bg-purple-500 text-white"
                    : "bg-primary/15 text-primary"
                }`}
              >
                {candidateIdSet.has(selectedTeacher.id) ? "★" : selectedTeacher.fullName.charAt(0)}
              </div>
              <span className="truncate font-bold text-foreground">
                {selectedTeacher.fullName}
              </span>
              {selectedTeacher.weeklyHourCapacity !== undefined && (
                <span className="text-[10px] font-medium text-muted-foreground shrink-0 bg-muted px-1.5 py-0.5 rounded-md">
                  {selectedTeacher.weeklyHourCapacity} st
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold truncate">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{placeholder}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1 text-muted-foreground">
          {selectedTeacher && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-0.5 rounded-md hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors"
              title="O'qituvchini olib tashlash"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-200 ${
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
            className="bg-popover/98 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[360px]"
          >
            {/* Search Bar Header */}
            <div className="p-2 border-b border-border/60 bg-muted/40 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="O'qituvchi ismini qidiring..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60 text-foreground font-medium"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Scrollable Teacher List */}
            <div className="overflow-y-auto p-1.5 space-y-1 custom-scrollbar flex-1">
              {/* Unassign option */}
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left font-medium ${
                  !value
                    ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold"
                    : "hover:bg-muted text-muted-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>⚠️ Biriktirilmagan (Bo'sh qoldirish)</span>
                </div>
                {!value && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 font-bold" />}
              </button>

              {/* Homeroom teacher option if applicable */}
              {homeroomTeacher && (!q || homeroomTeacher.fullName.toLowerCase().includes(q)) && (
                <div className="pt-1 pb-0.5">
                  <div className="px-2 py-0.5 text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                    <UserCheck className="w-3 h-3" />
                    <span>Sinf rahbari</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(homeroomTeacher.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left mt-0.5 ${
                      value === homeroomTeacher.id
                        ? "bg-indigo-600 text-white font-bold"
                        : "hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-amber-400 text-xs">⭐</span>
                      <span className="truncate font-semibold">{homeroomTeacher.fullName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                        value === homeroomTeacher.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      }`}>
                        {homeroomTeacher.weeklyHourCapacity} st
                      </span>
                    </div>
                    {value === homeroomTeacher.id && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                  </button>
                </div>
              )}

              {/* Recommended Specialists */}
              {filteredCandidates.length > 0 && (
                <div className="pt-1 pb-0.5">
                  <div className="px-2 py-0.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
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
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left mt-0.5 ${
                          isSelected
                            ? "bg-emerald-600 text-white font-bold shadow-xs"
                            : "hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-amber-400 text-xs">★</span>
                          <span className="truncate font-semibold">{t.fullName}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {t.weeklyHourCapacity} st
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* All other teachers */}
              {filteredOtherTeachers.length > 0 && (
                <div className="pt-1 pb-0.5">
                  <div className="px-2 py-0.5 text-[10px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <GraduationCap className="w-3 h-3" />
                    <span>Barcha o'qituvchilar ({filteredOtherTeachers.length})</span>
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
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors text-left mt-0.5 ${
                          isSelected
                            ? "bg-primary text-white font-bold"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div
                            className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold shrink-0 ${
                              isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {t.fullName.charAt(0)}
                          </div>
                          <span className="truncate font-medium">{t.fullName}</span>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {t.weeklyHourCapacity} st
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Empty state */}
              {filteredCandidates.length === 0 && filteredOtherTeachers.length === 0 && (
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
