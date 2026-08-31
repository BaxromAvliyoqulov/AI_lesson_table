"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Teacher } from "@/types";
import { Search, ChevronDown, Check, UserCheck, X } from "lucide-react";

interface TeacherSelectComboboxProps {
  value: string;
  onChange: (teacherId: string) => void;
  teachers: Teacher[];
  placeholder?: string;
  disabled?: boolean;
}

export const TeacherSelectCombobox: React.FC<TeacherSelectComboboxProps> = ({
  value,
  onChange,
  teachers,
  placeholder = "O'qituvchini tanlang...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTeacher = useMemo(
    () => teachers.find((t) => t.id === value),
    [teachers, value]
  );

  const filteredTeachers = useMemo(() => {
    if (!search.trim()) return teachers;
    const q = search.toLowerCase();
    return teachers.filter(
      (t) =>
        t.fullName.toLowerCase().includes(q) ||
        (t.phone && t.phone.toLowerCase().includes(q))
    );
  }, [teachers, search]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm transition-all text-left ${
          disabled
            ? "bg-slate-100 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 cursor-not-allowed"
            : isOpen
            ? "border-primary ring-2 ring-primary/20 bg-card shadow-sm"
            : "border-border bg-card/80 hover:bg-card hover:border-slate-300 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              selectedTeacher
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {selectedTeacher ? selectedTeacher.fullName.charAt(0) : "?"}
          </div>
          <span
            className={`truncate font-medium ${
              selectedTeacher ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {selectedTeacher ? selectedTeacher.fullName : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
          {selectedTeacher && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-primary" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-popover/95 backdrop-blur-xl border border-border/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2 border-b border-border/60 bg-muted/30">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                autoFocus
                placeholder="Ism yoki telefon bo'yicha qidiring..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors text-left"
            >
              <span>Biriktirilmagan (Bo'sh)</span>
              {!value && <Check className="w-3.5 h-3.5 text-primary font-bold" />}
            </button>

            {filteredTeachers.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                O'qituvchi topilmadi
              </div>
            ) : (
              filteredTeachers.map((t) => {
                const isSelected = t.id === value;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onChange(t.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left ${
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                          isSelected
                            ? "bg-primary text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.fullName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <p className="truncate font-medium">{t.fullName}</p>
                        {t.phone && (
                          <p className="text-[10px] text-muted-foreground">
                            {t.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
