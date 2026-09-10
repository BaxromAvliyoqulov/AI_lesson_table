import React from "react";
import { Activity, Users, GraduationCap } from "lucide-react";

interface TeachersStatusDashboardProps {
  globalWorkloadPercentage: number;
  totalAssignedHours: number;
  totalCapacityHours: number;
  teachersCount: number;
  optimalCount: number;
  underloadedCount: number;
  overloadedCount: number;
  homeroomCount: number;
  classesCount: number;
  homeroomPercentage: number;
}

export const TeachersStatusDashboard: React.FC<TeachersStatusDashboardProps> = ({
  globalWorkloadPercentage,
  totalAssignedHours,
  totalCapacityHours,
  teachersCount,
  optimalCount,
  underloadedCount,
  overloadedCount,
  homeroomCount,
  classesCount,
  homeroomPercentage,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
      {/* Status Bar 1: Jami Stavka Yuklamasi */}
      <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Umumiy Dars Yuklamasi</span>
          </span>
          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20">
            {globalWorkloadPercentage}%
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-lg font-black text-foreground">
              {totalAssignedHours}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {totalCapacityHours} soat
              </span>
            </span>
            <span className="text-[11px] text-muted-foreground">
              {teachersCount} ta o&apos;qituvchi
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-2.5 rounded-full bg-muted/60 overflow-hidden p-0.5 border border-border/40">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                globalWorkloadPercentage >= 80 && globalWorkloadPercentage <= 100
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                  : globalWorkloadPercentage > 100
                  ? "bg-gradient-to-r from-amber-500 to-rose-500"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500"
              }`}
              style={{ width: `${Math.min(100, (totalAssignedHours / (totalCapacityHours || 1)) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status Bar 2: O'qituvchilar Taqsimot Holati */}
      <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600" />
            <span>Stavka Taqsimoti</span>
          </span>
          <span className="text-xs text-muted-foreground font-semibold">
            Jami: {teachersCount} nafar
          </span>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-1.5 text-center">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-1.5">
              <div className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                {optimalCount}
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                🟢 To&apos;liq (80-100%)
              </div>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-1.5">
              <div className="text-sm font-black text-amber-700 dark:text-amber-300">
                {underloadedCount}
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                🟡 Bo&apos;sh (&lt;80%)
              </div>
            </div>
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-1.5">
              <div className="text-sm font-black text-rose-700 dark:text-rose-300">
                {overloadedCount}
              </div>
              <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                🔴 Ortiqcha (&gt;100%)
              </div>
            </div>
          </div>

          {/* Segmented Progress Bar */}
          <div className="w-full h-2 rounded-full bg-muted/60 overflow-hidden flex">
            <div
              style={{ width: `${teachersCount ? (optimalCount / teachersCount) * 100 : 0}%` }}
              className="bg-emerald-500 h-full transition-all duration-300"
              title={`To'liq stavka: ${optimalCount} nafar`}
            />
            <div
              style={{ width: `${teachersCount ? (underloadedCount / teachersCount) * 100 : 0}%` }}
              className="bg-amber-400 h-full transition-all duration-300"
              title={`Bo'sh soatli: ${underloadedCount} nafar`}
            />
            <div
              style={{ width: `${teachersCount ? (overloadedCount / teachersCount) * 100 : 0}%` }}
              className="bg-rose-500 h-full transition-all duration-300"
              title={`Ortiqcha yuklama: ${overloadedCount} nafar`}
            />
          </div>
        </div>
      </div>

      {/* Status Bar 3: Sinf Rahbarligi Qamrovi */}
      <div className="p-4 rounded-3xl bg-card border border-border shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Sinf Rahbarligi Qamrovi</span>
          </span>
          <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20">
            {homeroomPercentage}%
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-lg font-black text-foreground">
              {homeroomCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                / {classesCount} ta sinfga biriktirilgan
              </span>
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              {classesCount - homeroomCount > 0 ? (
                <span className="text-rose-500 font-bold">
                  {classesCount - homeroomCount} ta bo&apos;sh
                </span>
              ) : (
                <span className="text-emerald-600 font-bold">Hammasi to&apos;liq</span>
              )}
            </span>
          </div>

          {/* Progress Track */}
          <div className="w-full h-2.5 rounded-full bg-muted/60 overflow-hidden p-0.5 border border-border/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
              style={{ width: `${homeroomPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
