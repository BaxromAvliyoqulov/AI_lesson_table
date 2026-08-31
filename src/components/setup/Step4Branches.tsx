"use client";

import React, { useState } from "react";
import type { SetupData } from "@/app/setup/page";
import { StepLayout } from "./StepLayout";
import { Building2, Plus, Trash2, Star } from "lucide-react";

type Props = { data: SetupData; updateData: <K extends keyof SetupData>(k: K, v: SetupData[K]) => void; onNext: () => void; onBack: () => void };
type Branch = SetupData["branches"][0];

export function Step4Branches({ data, updateData, onNext, onBack }: Props) {
  const branches = data.branches;
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const set = (b: Branch[]) => updateData("branches", b);

  const add = () => {
    if (!name.trim()) return;
    set([...branches, { name: name.trim(), address: address.trim(), isMain: false }]);
    setName(""); setAddress("");
  };

  const remove = (i: number) => {
    if (branches[i].isMain) return; // Asosiy binoni o'chirib bo'lmaydi
    set(branches.filter((_, idx) => idx !== i));
  };

  const setMain = (i: number) => set(branches.map((b, idx) => ({ ...b, isMain: idx === i })));

  return (
    <StepLayout
      title="Filiallar"
      subtitle="Maktabingizda filial(lar) bormi? Asosiy binoni va filiallarni kiriting."
      icon={<Building2 className="w-6 h-6" />}
      onNext={onNext}
      onBack={onBack}
      canNext={branches.length > 0}
    >
      {/* Joriy filiallar */}
      <div className="space-y-2">
        {branches.map((b, i) => (
          <div key={i} className="flex items-center gap-3 p-4 rounded-xl border transition-all bg-white/5 border-white/10">
            <Building2 className={`w-5 h-5 shrink-0 ${b.isMain ? "text-amber-400" : "text-slate-500"}`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-white">{b.name}</span>
                {b.isMain && (
                  <span className="text-xs bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Asosiy
                  </span>
                )}
              </div>
              {b.address && <div className="text-xs text-slate-500 mt-0.5">{b.address}</div>}
            </div>
            {!b.isMain && (
              <div className="flex gap-2">
                <button onClick={() => setMain(i)} className="text-xs text-slate-500 hover:text-amber-400 transition-colors px-2 py-1 rounded-lg hover:bg-amber-500/10">
                  Asosiy qilib belgilash
                </button>
                <button onClick={() => remove(i)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Yangi filial qo'shish */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
        <h3 className="text-sm font-medium text-slate-300">Yangi filial qo'shish</h3>
        <div className="grid grid-cols-2 gap-3">
          <input id="branch-name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Filial nomi" className="input-field" />
          <input id="branch-address" value={address} onChange={(e) => setAddress(e.target.value)}
            placeholder="Manzil (ixtiyoriy)" className="input-field" />
        </div>
        <button onClick={add} disabled={!name.trim()}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all disabled:opacity-40 flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> Filial qo'shish
        </button>
      </div>

      {branches.length === 1 && (
        <div className="text-center py-4 text-sm text-slate-500">
          Faqat asosiy bino — filial yo'q. Davom etish mumkin.
        </div>
      )}
    </StepLayout>
  );
}
