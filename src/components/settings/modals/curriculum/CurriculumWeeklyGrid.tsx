import React from "react";
import { Subject, Teacher } from "@/types";
import { Calendar } from "lucide-react";

interface CurriculumWeeklyGridProps {
  daysCount: number;
  dayNames: string[];
  totalWeeklyHours: number;
  weeklyDistribution: Array<Array<{ subject: Subject; teacher?: Teacher; hoursCount: number }>>;
}

export const CurriculumWeeklyGrid: React.FC<CurriculumWeeklyGridProps> = ({
  daysCount,
  dayNames,
  totalWeeklyHours,
  weeklyDistribution,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-foreground">
              Haftalik Darslar Simulyatsiyasi ({daysCount} kunlik)
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Ushbu fanlar va soatlar haftaning kunlari bo'yicha namunaviy taqsimlanganda
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-xl border border-primary/20">
          Kuniga o'rtacha: {(totalWeeklyHours / daysCount).toFixed(1)} soat
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {dayNames.map((dayName, dIdx) => {
          const dayLessons = weeklyDistribution[dIdx] || [];
          const dayTotalHours = dayLessons.reduce((acc, cur) => acc + cur.hoursCount, 0);

          return (
            <div
              key={dayName}
              className="rounded-2xl border border-border/80 bg-card p-3 flex flex-col shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
                <span className="font-extrabold text-xs text-foreground">{dayName}</span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-lg bg-primary/10 text-primary">
                  {dayTotalHours} soat
                </span>
              </div>

              <div className="space-y-1.5 flex-1 overflow-y-auto max-h-56">
                {dayLessons.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted-foreground italic">
                    Dars yo'q
                  </div>
                ) : (
                  dayLessons.map((l, lIdx) => (
                    <div
                      key={lIdx}
                      className="p-2 rounded-xl border border-border/60 bg-muted/30 text-xs flex items-center justify-between gap-1.5"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: l.subject.colorTag || "#3B82F6" }}
                        />
                        <span className="font-bold text-foreground truncate text-[11px]">
                          {l.subject.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">
                        {l.teacher ? l.teacher.fullName.split(" ")[0] : "—"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
