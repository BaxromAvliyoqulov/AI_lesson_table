"use client";

import React, { useState, useMemo } from "react";
import { Subject } from "@/types";
import { getSanPiNBadge } from "@/lib/utils";
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  DoorOpen,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";

interface SubjectsTabProps {
  subjects: Subject[];
  onAddSubject: () => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subjectId: string) => void;
}

const WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

const ROOM_TYPE_LABELS: Record<string, string> = {
  GENERAL: "Oddiy xona",
  GYM: "Sport zal",
  COMP_LAB: "Informatika xonasi",
  LAB: "Laboratoriya",
  OUTDOOR_PITCH: "Ochiq maydon",
};

export const SubjectsTab: React.FC<SubjectsTabProps> = ({
  subjects,
  onAddSubject,
  onEditSubject,
  onDeleteSubject,
}) => {
  const [search, setSearch] = useState("");

  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return subjects;
    const q = search.toLowerCase();
    return subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.shortName && s.shortName.toLowerCase().includes(q))
    );
  }, [subjects, search]);

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border">
        <div className="relative flex-1 sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Fan nomi bo'yicha qidiring..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60"
          />
        </div>

        <button
          onClick={onAddSubject}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi fan qo'shish</span>
        </button>
      </div>

      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="py-16 text-center rounded-3xl border border-dashed border-border bg-card/40">
          <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Fan topilmadi</p>
          <p className="text-xs text-muted-foreground mt-1">
            Qidiruv so'zini o'zgartiring yoki yangi fan qo'shing
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredSubjects.map((subject) => {
            const sanpin = getSanPiNBadge(subject.difficultyScore);

            return (
              <div
                key={subject.id}
                className="flex flex-col justify-between p-4 rounded-3xl border border-border/80 bg-card/80 hover:bg-card hover:border-primary/40 hover:shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-extrabold text-xs shadow-md shrink-0"
                        style={{ backgroundColor: subject.colorTag }}
                      >
                        {subject.shortName || subject.name.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-foreground text-sm truncate" title={subject.name}>
                          {subject.name}
                        </h4>
                        <p className="text-[11px] text-muted-foreground">
                          Qisqartmasi: <span className="font-semibold">{subject.shortName || "-"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onEditSubject(subject)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`${subject.name} fanini o'chirishni tasdiqlaysizmi?`)) {
                            onDeleteSubject(subject.id);
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
                  <div className="space-y-1.5 text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-2xl border border-border/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>SanPiN yuklama:</span>
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${sanpin.badgeClass}`}>
                        {subject.difficultyScore} ball • {sanpin.label}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1">
                        <DoorOpen className="w-3 h-3" />
                        <span>Xona talabi:</span>
                      </span>
                      <span className="font-semibold text-foreground">
                        {subject.requiresRoomType
                          ? ROOM_TYPE_LABELS[subject.requiresRoomType] || subject.requiresRoomType
                          : "Oddiy xona"}
                      </span>
                    </div>

                    {subject.methodDayOfWeek && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>Metod kuni:</span>
                        </span>
                        <span className="font-bold text-amber-600">
                          {WEEKDAYS[subject.methodDayOfWeek - 1]}
                        </span>
                      </div>
                    )}

                    {subject.allowDoubleLesson && (
                      <div className="text-[10px] text-primary font-bold pt-1 border-t border-border/40">
                        ✓ 2 soat ketma-ket (para) ruxsat etilgan
                      </div>
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
