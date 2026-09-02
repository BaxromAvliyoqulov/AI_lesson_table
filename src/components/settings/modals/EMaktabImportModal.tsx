"use client";

import React, { useState, useRef } from "react";
import { Teacher, SchoolClass, Subject } from "@/types";
import { X, FileSpreadsheet, CheckCircle2, AlertCircle, Users, GraduationCap, ArrowRight, Loader2, Sparkles, BookOpen } from "lucide-react";
import * as XLSX from "xlsx";

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

  // Ism formatini tekshirish uchun yordamchi regexlar
  const isLikelyPersonName = (text: string): boolean => {
    const clean = text.trim();
    if (!clean || clean.length < 3 || clean.length > 50) return false;
    // Raqamlar yoki maxsus simvollar bo'lsa ism emas
    if (/\d/.test(clean) && !/[I|V|X]/.test(clean)) return false;
    // Masalan: "Karimov A.", "Karimov A.B.", "Karimov Alisher", "Karimova Nodira O'ktam qizi"
    // Ruscha/O'zbekcha familiya ism shablonlari
    const hasInitials = /[A-ZА-ЯЁЎҚҒҲ][a-zа-яёўқғҳ'`’ʼ]*\s+[A-ZА-ЯЁЎҚҒҲ]\.(\s*[A-ZА-ЯЁЎҚҒҲ]\.)?/.test(clean);
    const hasMultipleNames = /^[A-ZА-ЯЁЎҚҒҲ][a-zа-яёўқғҳ'`’ʼ]+\s+[A-ZА-ЯЁЎҚҒҲ][a-zа-яёўқғҳ'`’ʼ]+(\s+[A-ZА-ЯЁЎҚҒҲa-zа-яёўқғҳ'`’ʼ]+)*$/.test(clean);
    const hasOgliQizi = /(o['`’ʼ]g['`’ʼ]li|qizi|вич|вна|o'g'li|qizi)/i.test(clean);

    return hasInitials || hasMultipleNames || hasOgliQizi;
  };

  // Sinf formatini tekshirish uchun yordamchi regex
  const extractClassName = (text: string): string | null => {
    const clean = text.trim();
    if (!clean || clean.length > 25) return null;

    // Masalan: "1-A", "1 A", "5-B", "10-"A"", "11-V", "4-A (filial)", "3-D filial", "9 Б", "10-A sinf"
    const match = clean.match(/^([1-9]|1[0-1])\s*[-–—\s]?\s*["'«»]?([A-Za-zА-Яа-яЎўҚқҒғҲҳ])["'«»]?(\s*[-–—(]?\s*(filial|f|d|bino\s*2)[\)]?)?/i);
    if (match) {
      const grade = match[1];
      let letter = match[2].toUpperCase();
      // Ruscha harflarni lotinga moslash
      const cyrillicToLatin: Record<string, string> = {
        'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'J', 'З': 'Z', 'И': 'I', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'X', 'Ц': 'S', 'Ч': 'CH', 'Ш': 'SH', 'Қ': 'Q', 'Ғ': 'G', 'Ҳ': 'H'
      };
      if (cyrillicToLatin[letter]) {
        letter = cyrillicToLatin[letter];
      }
      const isBranch = /filial|f\b|d\b|bino/i.test(clean);
      return `${grade}-${letter}${isBranch ? " (Filial)" : ""}`;
    }
    return null;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg(null);
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      // XLSX orqali barcha .xls, .xlsx, .csv, HTML jadvallarni o'qish
      const workbook = XLSX.read(data, {
        type: "array",
        cellDates: true,
        cellText: true,
      });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        setErrorMsg("Excel faylda varaqlar (sheet) topilmadi.");
        setIsProcessing(false);
        return;
      }

      const teachersMap = new Map<string, { fullName: string; phone: string; subjectName?: string }>();
      const classesMap = new Map<string, { name: string; grade: number; isBranch: boolean }>();

      // Barcha varaqlarni skanerlash
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        // Jadvalni qatorlar massivi shaklida olish
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        if (!rows || rows.length === 0) continue;

        // 1. Sarlavha qatorini (Header Row) topishga harakat qilamiz
        let headerRowIdx = -1;
        let nameColIdx = -1;
        let subColIdx = -1;
        let phoneColIdx = -1;
        let classColIdx = -1;

        for (let r = 0; r < Math.min(rows.length, 15); r++) {
          const row = rows[r];
          if (!Array.isArray(row)) continue;

          for (let c = 0; c < row.length; c++) {
            const cellVal = String(row[c] || "").trim().toLowerCase();
            if (!cellVal) continue;

            if (nameColIdx === -1 && (cellVal.includes("ism") || cellVal.includes("familiya") || cellVal.includes("f.i.sh") || cellVal.includes("o'qituvchi") || cellVal.includes("pedagog") || cellVal.includes("учитель") || cellVal.includes("фио"))) {
              nameColIdx = c;
              headerRowIdx = r;
            }
            if (subColIdx === -1 && (cellVal.includes("fan") || cellVal.includes("mutaxassislik") || cellVal.includes("predmet") || cellVal.includes("предмет"))) {
              subColIdx = c;
              headerRowIdx = r;
            }
            if (phoneColIdx === -1 && (cellVal.includes("telefon") || cellVal.includes("tel") || cellVal.includes("raqam") || cellVal.includes("телефон"))) {
              phoneColIdx = c;
            }
            if (classColIdx === -1 && (cellVal.includes("sinf") || cellVal.includes("guruh") || cellVal.includes("класс"))) {
              classColIdx = c;
              headerRowIdx = r;
            }
          }

          if (headerRowIdx !== -1 && (nameColIdx !== -1 || classColIdx !== -1)) {
            break;
          }
        }

        // Agar aniq ustunli ro'yxat bo'lsa (Standart Ro'yxat):
        if (headerRowIdx !== -1 && nameColIdx !== -1) {
          for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const row = rows[r];
            if (!Array.isArray(row)) continue;

            const rawName = String(row[nameColIdx] || "").trim();
            if (!rawName || rawName.length < 3 || /^(jami|itogo|umumiy|№|nomer)/i.test(rawName)) continue;

            const rawSub = subColIdx !== -1 ? String(row[subColIdx] || "").trim() : "";
            const rawPhone = phoneColIdx !== -1 ? String(row[phoneColIdx] || "").trim() : "";

            const key = rawName.toLowerCase();
            if (!teachersMap.has(key)) {
              teachersMap.set(key, {
                fullName: rawName,
                phone: rawPhone,
                subjectName: rawSub,
              });
            }
          }
        }

        if (headerRowIdx !== -1 && classColIdx !== -1) {
          for (let r = headerRowIdx + 1; r < rows.length; r++) {
            const row = rows[r];
            if (!Array.isArray(row)) continue;

            const rawClass = String(row[classColIdx] || "").trim();
            const parsedName = extractClassName(rawClass);
            if (parsedName) {
              const gradeMatch = parsedName.match(/\d+/);
              const grade = gradeMatch ? parseInt(gradeMatch[0], 10) : 1;
              const isBranch = parsedName.toLowerCase().includes("filial");
              classesMap.set(parsedName, { name: parsedName, grade, isBranch });
            }
          }
        }

        // 2. UNIVERSAL SCANNER: eMaktab Dars Jadvali matritsasi / erkin shakldagi kataklarni skanerlash
        // Har bir katakni chuqur tahlil qilamiz (chunki eMaktab jadvalida o'qituvchilar va sinflar matritsa ichida bo'ladi)
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          if (!Array.isArray(row)) continue;

          for (let c = 0; c < row.length; c++) {
            const cellVal = String(row[c] || "").trim();
            if (!cellVal) continue;

            // A) Sinf nomini tekshirish
            const detectedClass = extractClassName(cellVal);
            if (detectedClass) {
              const gradeMatch = detectedClass.match(/\d+/);
              const grade = gradeMatch ? parseInt(gradeMatch[0], 10) : 1;
              const isBranch = detectedClass.toLowerCase().includes("filial");
              classesMap.set(detectedClass, { name: detectedClass, grade, isBranch });
            }

            // B) Katak ichida o'qituvchi ism-familiyasi va fanini ajratish
            // eMaktab jadvalida katak ko'pincha: "Matematika\nKarimov A." yoki "Ona tili / Aliyeva N." ko'rinishida bo'ladi
            const lines = cellVal.split(/[\n\r\/,]+/).map(s => s.trim()).filter(Boolean);
            
            for (const line of lines) {
              // Qavslardan tozalash: "Matematika (Karimov A.)" -> "Karimov A."
              const bracketMatch = line.match(/\(([^)]+)\)/);
              const candidate = bracketMatch ? bracketMatch[1].trim() : line;

              if (isLikelyPersonName(candidate)) {
                const key = candidate.toLowerCase();
                if (!teachersMap.has(key)) {
                  // Shu katakdagi fanni aniqlash
                  const possibleSubject = lines.find(l => l !== candidate && !isLikelyPersonName(l) && !extractClassName(l));
                  teachersMap.set(key, {
                    fullName: candidate,
                    phone: "",
                    subjectName: possibleSubject,
                  });
                }
              }
            }
          }
        }
      }

      // Natijalarni shakllantirish
      const generatedTeachers: Teacher[] = [];
      let teacherIndex = 1;
      teachersMap.forEach((t) => {
        // Mavjud fanlar bilan moslashtirish
        const matchedSub = t.subjectName
          ? existingSubjects.find(
              (s) =>
                t.subjectName!.toLowerCase().includes(s.name.toLowerCase()) ||
                s.name.toLowerCase().includes(t.subjectName!.toLowerCase())
            )
          : undefined;

        generatedTeachers.push({
          id: `t_emaktab_${Date.now()}_${teacherIndex++}`,
          schoolId,
          fullName: t.fullName,
          phone: t.phone || "+998",
          weeklyHourCapacity: 20,
          maxConsecutiveHours: 4,
          methodDayOfWeek: null,
          homeroomClassId: null,
          subjectIds: matchedSub ? [matchedSub.id] : [],
          branchIds: ["b39_1"],
        });
      });

      const generatedClasses: SchoolClass[] = [];
      let classIndex = 1;
      // Sinflarni sinf raqami va harfi bo'yicha saralash
      const sortedClasses = Array.from(classesMap.values()).sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        return a.name.localeCompare(b.name);
      });

      sortedClasses.forEach((c) => {
        generatedClasses.push({
          id: `c_emaktab_${Date.now()}_${classIndex++}`,
          schoolId,
          branchId: c.isBranch ? "b39_2" : "b39_1",
          shiftId: "s39_1",
          name: c.name,
          grade: c.grade,
          isPrimary: c.grade <= 4,
          isClosed: false,
          subjects: [],
        });
      });

      if (generatedTeachers.length === 0 && generatedClasses.length === 0) {
        setErrorMsg(
          "Fayldan o'qituvchilar yoki sinflar ma'lumoti aniqlanmadi. Iltimos, eMaktab dars jadvali yoki ro'yxat faylini yuklaganingizga ishonch hosil qiling."
        );
        setIsProcessing(false);
        return;
      }

      setParsedTeachers(generatedTeachers);
      setParsedClasses(generatedClasses);

      // Agar o'qituvchilar topilmasa lekin sinflar topilsa, sinflar tabiga avtomatik o'tish
      if (generatedTeachers.length === 0 && generatedClasses.length > 0) {
        setActiveTab("CLASSES");
      }
    } catch (err: any) {
      console.error("eMaktab fayl o'qish xatosi:", err);
      setErrorMsg(`Faylni o'qishda xatolik yuz berdi: ${err?.message || "Noma'lum xato"}`);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden text-foreground font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl font-bold shadow-inner">
              📥
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">eMaktab (Kundalik.com) Excel Import</h2>
                <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI Smart Parser
                </span>
              </div>
              <p className="text-xs text-blue-100">
                .xls, .xlsx va barcha dars jadvali / ro&apos;yxat formatlarini 1-bosishda avtomatik yuklash
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
            onClick={() => setActiveTab("TEACHERS")}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "TEACHERS"
                ? "border-blue-600 text-blue-600 bg-card rounded-t-xl shadow-sm"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>O&apos;qituvchilar Ro&apos;yxati</span>
            {parsedTeachers.length > 0 && (
              <span className="px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-full text-[10px] font-mono">
                {parsedTeachers.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CLASSES")}
            className={`flex items-center gap-2 px-4 py-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === "CLASSES"
                ? "border-blue-600 text-blue-600 bg-card rounded-t-xl shadow-sm"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Sinflar Ro&apos;yxati</span>
            {parsedClasses.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-full text-[10px] font-mono">
                {parsedClasses.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
              fileName
                ? "border-blue-500/50 bg-blue-50/10 hover:bg-blue-50/20"
                : "border-border hover:border-blue-500 bg-muted/20 hover:bg-blue-50/20"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-xs font-bold text-muted-foreground">
                  eMaktab fayli AI skaner orqali tahlil qilinmoqda...
                </p>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center shadow-sm">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {fileName ? fileName : "eMaktab / Kundalik Excel faylini tanlang yoki shu yerga tashlang"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Qo&apos;llab-quvvatlanadigan formatlar: .xls (Kundalik), .xlsx (Excel), .csv
                  </p>
                </div>
                {fileName && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Fayl muvaffaqiyatli tahlil qilindi</span>
                  </div>
                )}
              </>
            )}
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Xatolik:</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Preview Table for Teachers */}
          {activeTab === "TEACHERS" && parsedTeachers.length > 0 && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  Topilgan O&apos;qituvchilar: <span className="font-mono text-blue-600">{parsedTeachers.length}</span> ta
                </span>
                <span className="text-emerald-600 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Yuklashga tayyor
                </span>
              </div>
              <div className="border border-border rounded-xl overflow-hidden max-h-52 overflow-y-auto text-xs shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/80 backdrop-blur text-muted-foreground font-semibold sticky top-0 border-b border-border">
                    <tr>
                      <th className="p-2.5 w-12 text-center">№</th>
                      <th className="p-2.5">O&apos;qituvchi (F.I.Sh)</th>
                      <th className="p-2.5">Bog&apos;langan Fan</th>
                      <th className="p-2.5">Telefon</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {parsedTeachers.map((t, idx) => {
                      const matchedSub = existingSubjects.find(s => t.subjectIds.includes(s.id));
                      return (
                        <tr key={idx} className="hover:bg-muted/40 transition-colors">
                          <td className="p-2.5 text-center font-mono text-muted-foreground">{idx + 1}</td>
                          <td className="p-2.5 font-bold text-foreground">{t.fullName}</td>
                          <td className="p-2.5">
                            {matchedSub ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold text-[11px]">
                                <BookOpen className="w-3 h-3" />
                                {matchedSub.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">—</span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-muted-foreground">{t.phone && t.phone !== "+998" ? t.phone : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview Table for Classes */}
          {activeTab === "CLASSES" && parsedClasses.length > 0 && (
            <div className="space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Topilgan Sinflar: <span className="font-mono text-indigo-600">{parsedClasses.length}</span> ta
                </span>
                <span className="text-emerald-600 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Yuklashga tayyor
                </span>
              </div>
              <div className="border border-border rounded-xl overflow-hidden max-h-52 overflow-y-auto text-xs shadow-inner">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-muted/80 backdrop-blur text-muted-foreground font-semibold sticky top-0 border-b border-border">
                    <tr>
                      <th className="p-2.5 w-12 text-center">№</th>
                      <th className="p-2.5">Sinf Nomi</th>
                      <th className="p-2.5">Bosqich</th>
                      <th className="p-2.5">Bino / Filial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border font-medium">
                    {parsedClasses.map((c, idx) => (
                      <tr key={idx} className="hover:bg-muted/40 transition-colors">
                        <td className="p-2.5 text-center font-mono text-muted-foreground">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-indigo-600 dark:text-indigo-400">{c.name}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.isPrimary ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400" : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                          }`}>
                            {c.isPrimary ? "1-4 Boshlang'ich" : "5-11 Yuqori"}
                          </span>
                        </td>
                        <td className="p-2.5 text-muted-foreground">{c.branchId === "b39_2" ? "Filial" : "Asosiy Bino"}</td>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-all cursor-pointer active:scale-95"
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

