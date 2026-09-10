import React from "react";
import { Sparkles } from "lucide-react";

interface TeacherScheduleInsightsProps {
  dailyStats: Map<number, { total: number; shift1: number; shift2: number; gaps: number }>;
  shift1Count: number;
  shift2Count: number;
  totalGapsCount: number;
}

export const TeacherScheduleInsights: React.FC<TeacherScheduleInsightsProps> = ({
  dailyStats,
  shift1Count,
  shift2Count,
  totalGapsCount,
}) => {
  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-500/5 via-primary/5 to-purple-500/5 border border-primary/20 space-y-3 print:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs sm:text-sm font-black text-foreground">
            AI Pedagogik Tahlil & Mukammallashtirish Takliflari
          </h4>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          Smart Advisor
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {/* Taklif 1: Yuklama balansi */}
        <div className="p-3 rounded-2xl bg-card border border-border/60 space-y-1 shadow-2xs">
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <span>⚖️ Kunlik Yuklama Balansi</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {dailyStats.get(2)?.total === 8 || dailyStats.get(6)?.total === 8 ? (
              <span>
                Seshanba va Shanba kunlarida darslar soni 8 soatga yetgan. Bu 1-smena va 2-smena
                orasida tushlik tanaffusi hisobiga joylashgan. Chorshanba kuni esa 5 soat. Yuklamani
                yanada tenglashtirish mumkin.
              </span>
            ) : (
              <span>
                Hafta kunlari bo&apos;yicha darslar optimal taqsimlangan. Kunlik me&apos;yor SanPiN talablariga mos.
              </span>
            )}
          </p>
        </div>

        {/* Taklif 2: Smenalararo harakat */}
        <div className="p-3 rounded-2xl bg-card border border-border/60 space-y-1 shadow-2xs">
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <span>🔄 Smenalararo Harakat</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {shift1Count > 0 && shift2Count > 0 ? (
              <span>
                O&apos;qituvchi ikkala smenada ham ({shift1Count} st ertalab, {shift2Count} st
                tushdan keyin) dars beradi. 13:00–13:15 tushlik tanaffusida dam olish uchun sharoit
                yaratilgan.
              </span>
            ) : shift1Count > 0 ? (
              <span>O&apos;qituvchining barcha darslari 1-smenaga (Abetgacha) to&apos;plangan.</span>
            ) : (
              <span>O&apos;qituvchining barcha darslari 2-smenaga (Abetdan keyin) to&apos;plangan.</span>
            )}
          </p>
        </div>

        {/* Taklif 3: Darcha va Oynalar */}
        <div className="p-3 rounded-2xl bg-card border border-border/60 space-y-1 shadow-2xs">
          <div className="font-bold text-foreground flex items-center gap-1.5">
            <span>🎯 Jadval Kompaktligi</span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {totalGapsCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                Jadvalda 0 ta darcha (oyna) mavjud! O&apos;qituvchi har bir smenada ketma-ket
                uzluksiz dars o&apos;tadi, vaqt behuda sarflanmaydi.
              </span>
            ) : (
              <span>
                Hafta davomida {totalGapsCount} ta darcha aniqlandi. Drag & Drop orqali ularni
                oldingi yoki keyingi soatlarga siljitish tavsiya etiladi.
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};
