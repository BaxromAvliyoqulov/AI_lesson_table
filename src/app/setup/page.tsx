"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  School, BookOpen, Users, Clock, Building2, GraduationCap, CheckCircle2, ChevronRight,
} from "lucide-react";
import { Step0SchoolProfile } from "@/components/setup/Step0SchoolProfile";
import { Step1Subjects } from "@/components/setup/Step1Subjects";
import { Step2Teachers } from "@/components/setup/Step2Teachers";
import { Step3Shifts } from "@/components/setup/Step3Shifts";
import { Step4Branches } from "@/components/setup/Step4Branches";
import { Step5Classes } from "@/components/setup/Step5Classes";
import { completeSetup } from "@/lib/actions/setup.actions";

export type SetupData = {
  school: { name: string; region: string; directorFullName: string; academicVicePrincipalName: string; psychologistName: string; academicYear: string; term: string };
  subjects: Array<{ name: string; colorTag: string; difficultyScore: number; allowDoubleLesson: boolean; requiresRoomType: string | null }>;
  teachers: Array<{ fullName: string; phone: string; methodDay: number | null; weeklyHourCapacity: number; subjectNames: string[]; branchNames: string[] }>;
  shifts: Array<{ name: string; startTime: string; endTime: string; periodsCount: number; bellPeriods: Array<{ period: number; start: string; end: string; breakMin: number }> }>;
  branches: Array<{ name: string; address: string; isMain: boolean }>;
  classes: Array<{ name: string; grade: number; branchName: string; shiftName: string; subjects: Array<{ subjectName: string; teacherFullName: string; weeklyHours: number }> }>;
};

const STEPS = [
  { id: 0, label: "Maktab profili", icon: School },
  { id: 1, label: "Fanlar", icon: BookOpen },
  { id: 2, label: "O'qituvchilar", icon: Users },
  { id: 3, label: "Smenalar", icon: Clock },
  { id: 4, label: "Filiallar", icon: Building2 },
  { id: 5, label: "Sinflar", icon: GraduationCap },
];

const defaultData: SetupData = {
  school: { name: "", region: "", directorFullName: "", academicVicePrincipalName: "", psychologistName: "", academicYear: "2024-2025", term: "1-chorak" },
  subjects: [],
  teachers: [],
  shifts: [],
  branches: [{ name: "Asosiy bino", address: "", isMain: true }],
  classes: [],
};

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<SetupData>(defaultData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateData = <K extends keyof SetupData>(key: K, value: SetupData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      await completeSetup(data);
      router.push("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  const stepProps = { data, updateData, onNext: () => setStep((s) => s + 1), onBack: () => setStep((s) => s - 1) };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex">
      {/* Sol — Step Indikator */}
      <aside className="w-72 shrink-0 p-8 flex flex-col border-r border-white/10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-amber-400 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">JadvalAI</span>
        </div>

        <div className="space-y-2">
          {STEPS.map((s) => {
            const Icon = s.icon;
            const isDone = s.id < step;
            const isActive = s.id === step;
            return (
              <button
                key={s.id}
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id > step}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                  isActive
                    ? "bg-indigo-600/30 border border-indigo-500/40 text-white"
                    : isDone
                    ? "text-indigo-300 hover:bg-white/5 cursor-pointer"
                    : "text-slate-600 cursor-not-allowed"
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  isActive ? "bg-indigo-500" : isDone ? "bg-green-500/20" : "bg-white/5"
                }`}>
                  {isDone ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className="text-sm font-medium">{s.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-indigo-400" />}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-8">
          <div className="text-xs text-slate-500 mb-2">Umumiy progress</div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-indigo-500 to-amber-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
          <div className="text-xs text-slate-400 mt-2">{step + 1} / {STEPS.length} bosqich</div>
        </div>
      </aside>

      {/* O'ng — Step Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {step === 0 && <Step0SchoolProfile {...stepProps} />}
          {step === 1 && <Step1Subjects {...stepProps} />}
          {step === 2 && <Step2Teachers {...stepProps} />}
          {step === 3 && <Step3Shifts {...stepProps} />}
          {step === 4 && <Step4Branches {...stepProps} />}
          {step === 5 && (
            <Step5Classes {...stepProps} onFinish={handleFinish} isSubmitting={isSubmitting} />
          )}
        </div>
      </main>
    </div>
  );
}
