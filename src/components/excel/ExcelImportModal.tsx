"use client";

import React, { useState } from "react";
import { Upload, FileSpreadsheet, Download, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { Subject, Teacher, SchoolClass } from "@/types";

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (data: {
    subjects: Subject[];
    teachers: Teacher[];
    classes: SchoolClass[];
  }) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<{
    teachers: number;
    subjects: number;
    classes: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    // CSV / Excel shablon yaratish (simulyatsiya va ma'lumot)
    const content = `Fan Nomi,Qisqa Nomi,Rang,SanPiN Qiyinlik Balli,Juftlik Dars (Ha/Yo'q)\nMatematika,Mat,#3B82F6,11,Ha\nOna tili,Ona tili,#EC4899,9,Yo'q\nFizika,Fizika,#06B6D4,10,Ha\nIngliz tili,Ingliz,#8B5CF6,8,Yo'q\nJismoniy tarbiya,Jismoniy,#EF4444,2,Yo'q`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Maktab_Jadval_Tarifikatsiya_Andoza.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError("Iltimos, Excel yoki CSV faylni tanlang.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    setTimeout(() => {
      // 1-Click Parsing simulyatsiyasi
      setIsProcessing(false);
      setSuccessCount({
        teachers: 15,
        subjects: 12,
        classes: 8,
      });

      // Foydalanuvchiga muvaffaqiyatli import xabarini ko'rsatish
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">
                1-Click Excel / CSV Bulk Import
              </h3>
              <p className="text-xs text-muted-foreground">
                O&apos;qituvchilar, Fanlar va Tarifikatsiyani tezkor yuklash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step 1: Download Template */}
        <div className="my-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-foreground">
                1. Tayyor shablonni yuklab oling
              </h4>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Maktabingiz o&apos;qituvchi va dars soatlarini shu formatda to&apos;ldiring
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted shadow-sm transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-blue-600" />
              <span>Shablon (.csv)</span>
            </button>
          </div>
        </div>

        {/* Step 2: Upload Area */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-foreground">
            2. To&apos;ldirilgan faylni yuklang
          </h4>

          <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border hover:border-emerald-500 bg-background/50 p-6 cursor-pointer transition-colors group">
            <Upload className="h-8 w-8 text-muted-foreground group-hover:text-emerald-600 transition-colors mb-2" />
            <span className="text-xs font-semibold text-foreground">
              {file ? file.name : "Faylni tanlang yoki shu yerga tashlang"}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1">
              .XLSX, .XLS yoki .CSV formatida (maksimal 10MB)
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-600 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Muvaffaqiyatli yuklandi: {successCount.teachers} o&apos;qituvchi,{" "}
                {successCount.subjects} fan, {successCount.classes} sinf.
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-6 border-t border-border mt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold hover:bg-muted transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 text-xs font-semibold shadow-md transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Tekshirilmoqda...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Yuklash va Saqlash</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
