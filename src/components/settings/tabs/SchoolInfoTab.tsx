"use client";

import React, { useState, useEffect } from "react";
import { SchoolInfo, Branch, Shift, SchoolClass, Teacher, Subject, Room } from "@/types";
import {
  School as SchoolIcon,
  Building2,
  Clock,
  Save,
  CheckCircle2,
  Layers,
  GraduationCap,
  Users,
  BookOpen,
  DoorOpen,
  FileSpreadsheet,
  Award,
} from "lucide-react";

interface SchoolInfoTabProps {
  school: SchoolInfo;
  branches: Branch[];
  shifts: Shift[];
  classes: SchoolClass[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  onUpdateSchoolInfo?: (schoolId: string, updates: Partial<SchoolInfo>) => void;
}

export const SchoolInfoTab: React.FC<SchoolInfoTabProps> = ({
  school,
  branches,
  shifts,
  classes,
  teachers,
  subjects,
  rooms,
  onUpdateSchoolInfo,
}) => {
  const [formData, setFormData] = useState({
    name: school?.name || "39-Umumiy o'rta ta'lim maktabi",
    region: school?.region || "Muzrabot tumani",
    directorName: school?.directorName || "M. Ramazonov",
    vicePrincipalName: school?.vicePrincipalName || "N. Narziqulov",
    psychologistName: school?.psychologistName || "F.I.Sh",
    academicYear: school?.academicYear || "2025 - 2026",
    approvalDate: school?.approvalDate || "2026-yil 28-mart",
  });

  useEffect(() => {
    if (school) {
      setFormData({
        name: school.name || "39-Umumiy o'rta ta'lim maktabi",
        region: school.region || "Muzrabot tumani",
        directorName: school.directorName || "M. Ramazonov",
        vicePrincipalName: school.vicePrincipalName || "N. Narziqulov",
        psychologistName: school.psychologistName || "F.I.Sh",
        academicYear: school.academicYear || "2025 - 2026",
        approvalDate: school.approvalDate || "2026-yil 28-mart",
      });
    }
  }, [school]);

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateSchoolInfo && school?.id) {
      onUpdateSchoolInfo(school.id, formData);
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
            <h3 className="text-base font-bold text-foreground">Maktab Profili va Rasmiy Rekvizitlari</h3>
            <p className="text-xs text-muted-foreground">
              Dars jadvali hujjati bosh va quyi qismida chiqadigan barcha rasmiy imzolar, direktor va zauch rekvizitlari
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5 max-w-2xl">
          {/* Maktab nomi & Hudud */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Ta'lim muassasasi to'liq nomi *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="39-Umumiy o'rta ta'lim maktabi"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Hudud / Tuman *
              </label>
              <input
                type="text"
                required
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Muzrabot tumani"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>
          </div>

          {/* O'quv yili & Tasdiqlash sanasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                O'quv yili *
              </label>
              <input
                type="text"
                required
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                placeholder="2025 - 2026"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Tasdiqlash sanasi (Hujjat yuqorisida) *
              </label>
              <input
                type="text"
                required
                value={formData.approvalDate}
                onChange={(e) => setFormData({ ...formData, approvalDate: e.target.value })}
                placeholder="2026-yil 28-mart"
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-semibold"
              />
            </div>
          </div>

          {/* Rasmiy Shaxslar (Direktor, Zauch, Ruhshunos) */}
          <div className="p-4 rounded-2xl bg-muted/30 border border-border space-y-4">
            <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Hujjatni Tasdiqlovchi va Imzolovchi Mas'ul Shaxslar</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Maktab Direktori F.I.Sh *
                </label>
                <input
                  type="text"
                  required
                  value={formData.directorName}
                  onChange={(e) => setFormData({ ...formData, directorName: e.target.value })}
                  placeholder="M. Ramazonov"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  O'quv ishlari bo'yicha zauch *
                </label>
                <input
                  type="text"
                  required
                  value={formData.vicePrincipalName}
                  onChange={(e) => setFormData({ ...formData, vicePrincipalName: e.target.value })}
                  placeholder="N. Narziqulov"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                  Maktab Ruhshunosi / Psixolog
                </label>
                <input
                  type="text"
                  value={formData.psychologistName}
                  onChange={(e) => setFormData({ ...formData, psychologistName: e.target.value })}
                  placeholder="F.I.Sh"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
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
                SaaS Litsenziya holati
              </label>
              <div className="px-4 py-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 font-bold text-xs flex items-center justify-between">
                <span>Enterprise AI Pro</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">Faol</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? "Muvaffaqiyatli saqlandi!" : "Barcha rekvizitlarni saqlash"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Quick Statistics Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Binolar / Filial</p>
            <p className="text-sm font-bold text-foreground">{branches.length} ta</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Smenalar</p>
            <p className="text-sm font-bold text-foreground">{shifts.length} ta</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Jami Sinflar</p>
            <p className="text-sm font-bold text-foreground">{classes.length} ta</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">O'qituvchilar</p>
            <p className="text-sm font-bold text-foreground">{teachers.length} nafar</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-bold">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Fanlar</p>
            <p className="text-sm font-bold text-foreground">{subjects.length} ta</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <DoorOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground">Auditoriyalar</p>
            <p className="text-sm font-bold text-foreground">{rooms.length} ta</p>
          </div>
        </div>
      </div>
    </div>
  );
};
