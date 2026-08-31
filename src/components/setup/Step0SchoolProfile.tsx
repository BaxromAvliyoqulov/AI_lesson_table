"use client";

import React from "react";
import type { SetupData } from "@/app/setup/page";
import { StepLayout } from "./StepLayout";
import { School, MapPin, User, Calendar } from "lucide-react";

type Props = { data: SetupData; updateData: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void; onNext: () => void; onBack: () => void };

const ACADEMIC_YEARS = ["2025-2026", "2026-2027", "2027-2028"];
const TERMS = ["1-chorak", "2-chorak", "3-chorak", "4-chorak"];

export function Step0SchoolProfile({ data, updateData, onNext }: Props) {
  const s = data.school;
  const set = (field: string, val: string) => updateData("school", { ...s, [field]: val });

  const isValid = s.name.trim() && s.directorFullName.trim();

  return (
    <StepLayout
      title="Maktab profili"
      subtitle="Rasmiy hujjatlar uchun rekvizitlar. Bu ma'lumotlar Excel export sarlavha va imzo qatorlarida avtomatik chiqadi."
      icon={<School className="w-6 h-6" />}
      onNext={onNext}
      canNext={!!isValid}
      isFirst
    >
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-2">Maktab nomi *</label>
          <input id="school-name" value={s.name} onChange={(e) => set("name", e.target.value)}
            placeholder="39-umumiy o'rta ta'lim maktabi"
            className="input-field w-full" />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            <MapPin className="w-4 h-4 inline mr-1" />Tuman/Viloyat
          </label>
          <input id="school-region" value={s.region} onChange={(e) => set("region", e.target.value)}
            placeholder="Muzrabot tumani"
            className="input-field w-full" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">O'quv yili *</label>
          <select id="school-year" value={s.academicYear} onChange={(e) => set("academicYear", e.target.value)}
            className="input-field w-full">
            {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Joriy chorak</label>
          <select id="school-term" value={s.term} onChange={(e) => set("term", e.target.value)}
            className="input-field w-full">
            {TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
        <p className="text-xs text-indigo-300 font-semibold mb-4 uppercase tracking-wider">
          Rasmiy imzo rekvizitlari (Excel export uchun)
        </p>
        <div className="space-y-4">
          {[
            { id: "director", field: "directorFullName", label: "Direktor F.I.Sh *", placeholder: "M. Ramazonov" },
            { id: "vp", field: "academicVicePrincipalName", label: "O'quv ishlar bo'yicha direktor o'rinbosari", placeholder: "N. Narziqulov" },
            { id: "psychologist", field: "psychologistName", label: "Ruhshunos", placeholder: "F.I.Sh" },
          ].map(({ id, field, label, placeholder }) => (
            <div key={field}>
              <label className="block text-sm text-slate-400 mb-1.5">{label}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input id={`school-${id}`} value={(s as any)[field]} onChange={(e) => set(field, e.target.value)}
                  placeholder={placeholder}
                  className="input-field w-full pl-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </StepLayout>
  );
}
