"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { SchoolClass, Teacher } from "@/types";
import { sortClassesByName } from "@/lib/utils";
import { Search, ChevronDown, Check, GraduationCap, X } from "lucide-react";

interface ClassSelectComboboxProps {
  value: string; // classId or ""
  onChange: (classId: string) => void;
  classes: SchoolClass[];
  teachers?: Teacher[];
  placeholder?: string;
  disabled?: boolean;
}

export const ClassSelectCombobox: React.FC<ClassSelectComboboxProps> = ({
  value,
  onChange,
  classes,
  teachers = [],
  placeholder = "Sinfni tanlang...",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const teacherMap = useMemo(
    () => new Map(teachers.map((t) => [t.id, t])),
    [teachers]
  );

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === value),
    [classes, value]
  );

  const sortedClasses = useMemo(() => sortClassesByName(classes), [classes]);

  const filteredClasses = useMemo(() => {
    if (!search.trim()) return sortedClasses;
    const q = search.toLowerCase();
    return sortedClasses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        `${c.grade}`.includes(q) ||
        (c.grade <= 4 && "boshlang'ich".includes(q)) ||
        (c.grade >= 5 && "yuqori".includes(q))
    );
  }, [sortedClasses, search]);

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
            ? "bg-muted/40 text-muted-foreground border-border cursor-not-allowed"
            : isOpen
            ? "border-primary ring-2 ring-primary/20 bg-card shadow-sm"
            : "border-border bg-card/80 hover:bg-card hover:border-slate-300 dark:hover:border-slate-700"
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
              selectedClass
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {selectedClass ? (
              selectedClass.name
            ) : (
              <GraduationCap className="w-4 h-4" />
            )}
          </div>
          <div className="truncate">
            <span
              className={`font-semibold ${
                selectedClass ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {selectedClass ? `${selectedClass.name}-sinf` : placeholder}
            </span>
            {selectedClass && (
              <span className="text-[11px] text-muted-foreground ml-2">
                ({selectedClass.grade <= 4 ? "Boshlang'ich" : "Yuqori"})
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-muted-foreground">
          {selectedClass && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
              title="Biriktirishni bekor qilish"
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
                placeholder="Sinf nomini qidiring (masalan: 5-A, 9)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-background border border-border/80 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
            {/* Unassign option */}
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-muted-foreground hover:bg-muted transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span>Sinf rahbari emas (Biriktirilmagan)</span>
              </div>
              {!value && <Check className="w-3.5 h-3.5 text-primary font-bold" />}
            </button>

            {filteredClasses.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Sinf topilmadi
              </div>
            ) : (
              filteredClasses.map((cls) => {
                const isSelected = cls.id === value;
                const currentTeacher = cls.homeroomTeacherId
                  ? teacherMap.get(cls.homeroomTeacherId)
                  : null;

                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      onChange(cls.id);
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
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {cls.name}
                      </div>
                      <div className="truncate">
                        <p className="truncate font-semibold text-foreground">
                          {cls.name}-sinf
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {currentTeacher ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Hozirgi rahbar: {currentTeacher.fullName}
                            </span>
                          ) : (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Rahbari yo'q (Bo'sh)
                            </span>
                          )}
                        </p>
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
