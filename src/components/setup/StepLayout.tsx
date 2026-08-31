"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onNext?: () => void;
  onBack?: () => void;
  onFinish?: () => void;
  canNext?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  isSubmitting?: boolean;
};

export function StepLayout({ title, subtitle, icon, children, onNext, onBack, onFinish, canNext = true, isFirst, isLast, isSubmitting }: Props) {
  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          {icon}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">{children}</div>

      {/* Nav Buttons */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/10">
        {!isFirst ? (
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/15 text-slate-400 hover:text-white hover:border-white/30 transition-all text-sm"
          >
            <ChevronLeft className="w-4 h-4" /> Orqaga
          </button>
        ) : (
          <div />
        )}

        {isLast ? (
          <button
            id="setup-finish"
            onClick={onFinish}
            disabled={isSubmitting || !canNext}
            className="flex items-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Saqlanmoqda...</>
            ) : (
              <>Boshlash ✓</>
            )}
          </button>
        ) : (
          <button
            id="setup-next"
            onClick={onNext}
            disabled={!canNext}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-all disabled:opacity-40"
          >
            Davom etish <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
