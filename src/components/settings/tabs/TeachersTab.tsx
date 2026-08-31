"use client";

import React, { useState, useMemo } from "react";
import { Teacher, Subject, SchoolClass } from "@/types";
import {
  Users,
  Plus,
  Search,
  Phone,
  Calendar,
  Clock,
  BookOpen,
  Edit2,
  Trash2,
  GraduationCap,
} from "lucide-react";

interface TeachersTabProps {
  teachers: Teacher[];
  subjects: Subject[];
  classes: SchoolClass[];
  onAddTeacher: () => void;
  onEditTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (teacherId: string) => void;
}

const WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export const TeachersTab: React.FC<TeachersTabProps> = ({
  teachers,
  subjects,
  classes,
  onAddTeacher,
  onEditTeacher,
  onDeleteTeacher,
}) => {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("ALL");

  const subjectMap = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const classMap = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);

  const filteredTeachers = useMemo(() => {
    let list = teachers;
    if (subjectFilter !== "ALL") {
      list = list.filter((t) => t.subjectIds.includes(subjectFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.fullName.toLowerCase().includes(q) ||
          (t.phone && t.phone.toLowerCase().includes(q))
      );
    }
    return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [teachers, subjectFilter, search]);

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Ism yoki telefon bo'yicha qidiring..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="ALL">Barcha fanlar ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onAddTeacher}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi o'qituvchi qo'shish</span>
        </button>
      </div>

      {/* Teachers Grid */}
      {filteredTeachers.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <Users className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">O'qituvchi topilmadi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Qidiruv so'zini o'zgartiring yoki yangi o'qituvchi qo'shing
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredTeachers.map((teacher) => {
            const homeroomClass = teacher.homeroomClassId ? classMap.get(teacher.homeroomClassId) : null;
            const teacherSubs = (teacher.subjectIds || [])
              .map((id) => subjectMap.get(id))
              .filter(Boolean) as Subject[];

            return (
              <div
                key={teacher.id}
                className="flex flex-col justify-between p-4 rounded-3xl border border-border/80 bg-card/80 hover:bg-card hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-extrabold text-sm shadow-inner shrink-0">
                        {teacher.fullName.charAt(0)}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-foreground text-sm truncate" title={teacher.fullName}>
                          {teacher.fullName}
                        </h4>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{teacher.phone || "Telefon yo'q"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditTeacher(teacher)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`${teacher.fullName} o'qituvchisini o'chirishni tasdiqlaysizmi?`)) {
                            onDeleteTeacher(teacher.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges & Meta */}
                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-2xl border border-border/60 mb-3">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Haftalik stavka:</span>
                      </span>
                      <span className="font-bold text-primary">{teacher.weeklyHourCapacity} soat</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Metod kuni:</span>
                      </span>
                      <span className="font-semibold text-foreground">
                        {teacher.methodDayOfWeek ? (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-600 font-bold">
                            {WEEKDAYS[teacher.methodDayOfWeek - 1]}
                          </span>
                        ) : (
                          "Belgilanmagan"
                        )}
                      </span>
                    </div>

                    {homeroomClass && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3 h-3" />
                          <span>Sinf rahbari:</span>
                        </span>
                        <span className="font-bold text-foreground">{homeroomClass.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subject tags */}
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Fanlari ({teacherSubs.length})
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto custom-scrollbar">
                    {teacherSubs.length === 0 ? (
                      <span className="text-[10px] text-muted-foreground italic">Fan biriktirilmagan</span>
                    ) : (
                      teacherSubs.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border"
                          style={{
                            backgroundColor: `${s.colorTag}15`,
                            color: s.colorTag,
                            borderColor: `${s.colorTag}30`,
                          }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.colorTag }} />
                          <span className="truncate max-w-[90px]">{s.name}</span>
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
