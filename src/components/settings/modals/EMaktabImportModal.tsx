"use client";

import React, { useState, useRef } from "react";
import { Teacher, SchoolClass, Subject } from "@/types";
import { X, FileSpreadsheet, CheckCircle2, AlertCircle, Users, GraduationCap, ArrowRight, Loader2 } from "lucide-react";
import ExcelJS from "exceljs";

interface EMaktabImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTeachers: (teachers: Teacher[]) => void;
  onImportClasses: (classes: SchoolClass[]) => void;
  existingTeachers: Teacher[];
  existingClasses: SchoolClass[];
  existingSubjects: Subject[];
  schoolId: string;
}

export const EMaktabImportModal: React.FC<EMaktabImportModalProps> = ({
  isOpen,
  onClose,
  onImportTeachers,
  onImportClasses,
  existingTeachers,
  existingClasses,
  existingSubjects,
  schoolId,
}) => {
  const [activeTab, setActiveTab] = useState<"TEACHERS" | "CLASSES">("TEACHERS");
  const [parsedTeachers, setParsedTeachers] = useState<Teacher[]>([]);
  const [parsedClasses, setParsedClasses] = useState<SchoolClass[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet || worksheet.rowCount < 2) {
        setErrorMsg("Faylda ma'lumot topilmadi yoki jadval bo'sh");
        setIsProcessing(false);
        return;
      }

      // Read headers from row 1
      const headers: string[] = [];
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber - 1] = String(cell.value || "").trim().toLowerCase();
      });

      if (activeTab === "TEACHERS") {
        const nameCol = headers.findIndex((h) => h && (h.includes("ism") || h.includes("familiya") || h.includes("f.i.sh") || h.includes("nomi")));
        const subCol = headers.findIndex((h) => h && (h.includes("fan") || h.includes("mutaxassislik") || h.includes("predmet")));
        const phoneCol = headers.findIndex((h) => h && (h.includes("telefon") || h.includes("tel") || h.includes("raqam")));

        const teachersList: Teacher[] = [];

        for (let rowIdx = 2; rowIdx <= worksheet.rowCount; rowIdx++) {
          const row = worksheet.getRow(rowIdx);
          const rawName = nameCol !== -1 ? String(row.getCell(nameCol + 1).value || "").trim() : String(row.getCell(1).value || "").trim();
          if (!rawName) continue;

          const rawSub = subCol !== -1 ? String(row.getCell(subCol + 1).value || "").trim() : "";
          const rawPhone = phoneCol !== -1 ? String(row.getCell(phoneCol + 1).value || "").trim() : "";

          const matchedSub = existingSubjects.find((s) =>
            rawSub.toLowerCase().includes(s.name.toLowerCase()) ||
            s.name.toLowerCase().includes(rawSub.toLowerCase())
          );

          teachersList.push({
            id: `t_import_${Date.now()}_${rowIdx}`,
            schoolId,
            fullName: rawName,
            phone: rawPhone || "+998",
            weeklyHourCapacity: 20,
            maxConsecutiveHours: 4,
            methodDayOfWeek: null,
            homeroomClassId: null,
            subjectIds: matchedSub ? [matchedSub.id] : [],
            branchIds: ["b39_1"],
          });
        }

        setParsedTeachers(teachersList);
      } else {
        const nameCol = headers.findIndex((h) => h && (h.includes("sinf") || h.includes("nomi") || h.includes("guruh")));

        const classesList: SchoolClass[] = [];

        for (let rowIdx = 2; rowIdx <= worksheet.rowCount; rowIdx++) {
          const row = worksheet.getRow(rowIdx);
          const rawName = nameCol !== -1 ? String(row.getCell(nameCol + 1).value || "").trim() : String(row.getCell(1).value || "").trim();
          if (!rawName) continue;

          const gradeMatch = rawName.match(/\d+/);
          const grade = gradeMatch ? parseInt(gradeMatch[0], 10) : 1;
          const isPrimary = grade <= 4;
          const isBranch = rawName.toLowerCase().includes("d") || rawName.toLowerCase().includes("filial");

          classesList.push({
            id: `c_import_${Date.now()}_${rowIdx}`,
            schoolId,
            branchId: isBranch ? "b39_2" : "b39_1",
            shiftId: "s39_1",
            name: rawName,
            grade,
            isPrimary,
            isClosed: false,
            subjects: [],
          });
        }

        setParsedClasses(classesList);
      }
    } catch (err: any) {
      console.error("eMaktab fayl o'qish xatosi:", err);
      setErrorMsg("Faylni o'qishda xatolik yuz berdi. Iltimos, to'g'ri .xlsx formatdagi fayl yuklang.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmImport = () => {
    if (activeTab === "TEACHERS") {
      if (parsedTeachers.length === 0) return;
      onImportTeachers(parsedTeachers);
      onClose();
    } else {
      if (parsedClasses.length === 0) return;
      onImportClasses(parsedClasses);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden text-foreground font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold">
              📥
            </div>
            <div>
              <h2 className="text-base font-bold">eMaktab (Kundalik.com) Excel Import</h2>
              <p className="text-xs text-blue-100">
                O'qituvchilar va sinflar ro'yxatini Excel jadvaldan 1-bosishda avtomatik yuklash
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-muted/40 px-6 pt-3 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab("TEACHERS");
              setParsedTeachers([]);
              setFileName("");
              setErrorMsg(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "TEACHERS"
                ? "border-blue-600 text-blue-600 bg-card rounded-t-xl shadow-sm"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>O'qituvchilar Ro'yxati</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("CLASSES");
              setParsedClasses([]);
              setFileName("");
              setErrorMsg(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "CLASSES"
                ? "border-blue-600 text-blue-600 bg-card rounded-t-xl shadow-sm"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Sinflar Ro'yxati</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-blue-500 bg-muted/20 hover:bg-blue-50/20 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls"
              className="hidden"
            />
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs font-bold text-muted-foreground">Fayl o'qilmoqda...</p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {fileName ? fileName : "eMaktab / Kundalik Excel faylini tanlang yoki shu yerga tashlang"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qo'llab-quvvatlanadigan format: .xlsx (Excel)
                  </p>
                </div>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table for Teachers */}
          {activeTab === "TEACHERS" && parsedTeachers.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>Topilgan O'qituvchilar: {parsedTeachers.length} ta</span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tayyor
                </span>
              </div>
              <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground font-semibold sticky top-0">
                    <tr>
                      <th className="p-2">№</th>
                      <th className="p-2">F.I.Sh</th>
                      <th className="p-2">Telefon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {parsedTeachers.map((t, idx) => (
                      <tr key={idx} className="hover:bg-muted/40">
                        <td className="p-2 font-mono">{idx + 1}</td>
                        <td className="p-2 font-bold">{t.fullName}</td>
                        <td className="p-2 font-mono text-muted-foreground">{t.phone || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview Table for Classes */}
          {activeTab === "CLASSES" && parsedClasses.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>Topilgan Sinflar: {parsedClasses.length} ta</span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tayyor
                </span>
              </div>
              <div className="border border-border rounded-xl overflow-hidden max-h-48 overflow-y-auto text-xs">
                <table className="w-full text-left">
                  <thead className="bg-muted text-muted-foreground font-semibold sticky top-0">
                    <tr>
                      <th className="p-2">№</th>
                      <th className="p-2">Sinf</th>
                      <th className="p-2">Bosqich</th>
                      <th className="p-2">Bino</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {parsedClasses.map((c, idx) => (
                      <tr key={idx} className="hover:bg-muted/40">
                        <td className="p-2 font-mono">{idx + 1}</td>
                        <td className="p-2 font-bold text-blue-600">{c.name}</td>
                        <td className="p-2">{c.isPrimary ? "1-4 Boshlang'ich" : "5-11 Yuqori"}</td>
                        <td className="p-2">{c.branchId === "b39_2" ? "Filial" : "Asosiy"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-muted/40 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Bekor qilish
          </button>

          <button
            type="button"
            disabled={
              (activeTab === "TEACHERS" && parsedTeachers.length === 0) ||
              (activeTab === "CLASSES" && parsedClasses.length === 0)
            }
            onClick={handleConfirmImport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
          >
            <span>
              {activeTab === "TEACHERS"
                ? `O'qituvchilarni Yuklash (${parsedTeachers.length})`
                : `Sinflarni Yuklash (${parsedClasses.length})`}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
