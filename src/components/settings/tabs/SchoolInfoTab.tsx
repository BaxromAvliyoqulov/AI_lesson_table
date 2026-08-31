"use client";

import React, { useState } from "react";
import { SchoolInfo, Branch, Shift, SchoolClass, Teacher, Subject, Room } from "@/types";
import {
  School as SchoolIcon,
  Building2,
  Clock,
  Plus,
  Trash2,
  Edit2,
  Save,
  CheckCircle2,
  Layers,
  GraduationCap,
  Users,
  BookOpen,
  DoorOpen,
} from "lucide-react";

interface SchoolInfoTabProps {
  school: SchoolInfo;
  branches: Branch[];
  shifts: Shift[];
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  onUpdateSchoolName?: (name: string) => void;
}

export const SchoolInfoTab: React.FC<SchoolInfoTabProps> = ({
  school,
  branches,
  shifts,
  classes,
  teachers,
  subjects,
  rooms,
  onUpdateSchoolName,
}) => {
  const [schoolName, setSchoolName] = useState(school?.name || "39-Umumiy o'rta ta'lim maktabi");
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSchoolName) {
      onUpdateSchoolName(schoolName);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* School profile card */}
      <div className="p-6 rounded-3xl bg-card border border-border shadow-sm">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/80">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <SchoolIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Maktab Profili va Ma'lumotlari</h3>
            <p className="text-xs text-muted-foreground">
              Muassasa nomi, litsenziya holati va boshqaruv parametrlari
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Ta'lim muassasasi to'liq nomi *
            </label>
            <input
              type="text"
              required
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Tizim identifikatori (Slug)
              </label>
              <input
                type="text"
                disabled
                value={school?.slug || "maktab-39"}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-muted-foreground text-xs font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                SaaS Tarif rejasi
              </label>
              <div className="px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold text-xs flex items-center justify-between">
                <span>Enterprise Pro</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white">Faol</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? "Saqlandi!" : "O'zgarishlarni saqlash"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-card border border-border flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-foreground">{classes.length}</div>
            <div className="text-xs text-muted-foreground">Jami sinflar</div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-foreground">{teachers.length}</div>
            <div className="text-xs text-muted-foreground">O'qituvchilar</div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-foreground">{subjects.length}</div>
            <div className="text-xs text-muted-foreground">O'quv fanlari</div>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-foreground">{rooms.length}</div>
            <div className="text-xs text-muted-foreground">Sinf xonalari</div>
          </div>
        </div>
      </div>

      {/* Buildings and Shifts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Buildings (Branches) */}
        <div className="p-6 rounded-3xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/80">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm text-foreground">O'quv binolari (Filiallar)</h4>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{branches.length} ta bino</span>
          </div>

          <div className="space-y-2">
            {branches.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-muted/20"
              >
                <div>
                  <div className="text-xs font-bold text-foreground flex items-center gap-2">
                    <span>{b.name}</span>
                    {b.isMain && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary font-bold">
                        Asosiy
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">{b.address || "Manzil kiritilmagan"}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shifts */}
        <div className="p-6 rounded-3xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/80">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <h4 className="font-bold text-sm text-foreground">O'quv smenalari</h4>
            </div>
            <span className="text-xs font-semibold text-muted-foreground">{shifts.length} ta smena</span>
          </div>

          <div className="space-y-2">
            {shifts.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-3 rounded-2xl border border-border/60 bg-muted/20"
              >
                <div>
                  <div className="text-xs font-bold text-foreground">{s.name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    Vaqti: {s.startTime} — {s.endTime} • Kunlik {s.periodsCount} soat
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
