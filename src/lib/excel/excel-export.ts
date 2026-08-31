import ExcelJS from "exceljs";
import { Lesson, SchoolClass, Subject, Teacher, Room, Branch, Shift } from "@/types";

export interface ExcelExportOptions {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  branches?: Branch[];
  shifts?: Shift[];
  schoolName?: string;
  region?: string;
  directorFullName?: string;
  academicVicePrincipalName?: string;
  psychologistName?: string;
  academicYear?: string;
  termName?: string;
}

const DAYS = [
  { id: 1, name: "DUSHANBA" },
  { id: 2, name: "SESHANBA" },
  { id: 3, name: "CHORSHANBA" },
  { id: 4, name: "PAYSHANBA" },
  { id: 5, name: "JUMA" },
  { id: 6, name: "SHANBA" },
];

const PERIOD_TIMES_DEFAULT: Record<number, string> = {
  1: "08:00-08:45",
  2: "08:50-09:35",
  3: "09:40-10:25",
  4: "10:35-11:20",
  5: "11:25-12:10",
  6: "12:15-13:00",
  7: "13:05-13:50",
};

export async function exportScheduleToExcel(options: ExcelExportOptions) {
  const {
    classes,
    subjects,
    teachers,
    lessons,
    branches = [],
    schoolName = "39-umumiy o'rta ta'lim maktabi",
    region = "Muzrabot tumani",
    directorFullName = "M. Ramazonov",
    academicVicePrincipalName = "N. Narziqulov",
    psychologistName = "F.I.Sh",
    academicYear = "2025-2026",
    termName = "1-chorak",
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JadvalAI SaaS";
  workbook.created = new Date();

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // O'qituvchilarning t/r tartib raqami (displayNumber)
  const teacherNumberMap = new Map<string, number>();
  teachers.forEach((t, i) => {
    teacherNumberMap.set(t.id, i + 1);
  });

  // Filiallar bo'yicha guruhlash
  const branchList = branches.length > 0 ? branches : [{ id: "main", schoolId: "", name: "Asosiy bino", isMain: true }];

  for (const branch of branchList) {
    const branchClasses = classes.filter((c) => (branches.length > 0 ? c.branchId === branch.id : true));
    if (branchClasses.length === 0) continue;

    const sheetName = branch.isMain ? "Asosiy bino" : branch.name.slice(0, 25);
    const ws = workbook.addWorksheet(sheetName, {
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
    });

    // ── 1. SARLAVHA BLOKI (TASDIQLAYMAN + MAKTAB REKVIZITLARI) ───────────────
    // A1: "TASDIQLAYMAN"
    const totalClassCols = branchClasses.length * 2;
    const rightColLetter = String.fromCharCode(65 + Math.min(totalClassCols + 5, 25));

    ws.mergeCells("A1:D1");
    ws.getCell("A1").value = "";

    // O'ng tomonda TASDIQLAYMAN
    const approveStartCol = Math.max(totalClassCols - 1, 6);
    ws.getCell(1, approveStartCol).value = "TASDIQLAYMAN";
    ws.getCell(1, approveStartCol).font = { bold: true, size: 10, name: "Times New Roman" };

    ws.getCell(2, approveStartCol).value = `Maktab direktori: __________ ${directorFullName}`;
    ws.getCell(2, approveStartCol).font = { size: 9, name: "Times New Roman" };

    ws.getCell(3, approveStartCol).value = `"____"____________2026 yil`;
    ws.getCell(3, approveStartCol).font = { size: 9, name: "Times New Roman" };

    // Markazda sarlavha
    ws.mergeCells(4, 1, 4, totalClassCols + 5);
    const titleCell = ws.getCell(4, 1);
    titleCell.value = `D A R S   J A D V A L I`;
    titleCell.font = { bold: true, size: 13, name: "Times New Roman" };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    ws.mergeCells(5, 1, 5, totalClassCols + 5);
    const subTitleCell = ws.getCell(5, 1);
    subTitleCell.value = `${region} ${schoolName}${branch.isMain ? "" : ` (${branch.name})`} ning ${academicYear} o'quv yili, ${termName} uchun tuzilgan`;
    subTitleCell.font = { bold: true, size: 10, name: "Times New Roman" };
    subTitleCell.alignment = { horizontal: "center", vertical: "middle" };

    ws.addRow([]); // Qator 6 — bo'sh

    // ── 2. TABLE HEADERS (Qator 7 & 8) ────────────────────────────────────────
    // Qator 7: Sinf nomlari
    const row7Values: (string | number)[] = ["Kun", "t/r", "Vaqt"];
    branchClasses.forEach((cls) => {
      row7Values.push(cls.name, ""); // Har bir sinf 2 ta katak (Fan + O'qituvchi raqami)
    });
    row7Values.push("", "t/r", "O'qituvchilarning I.F.Sh");

    const row7 = ws.addRow(row7Values);
    row7.height = 24;

    // Qator 7 dizayni & Sinf merge
    let colIdx = 4;
    branchClasses.forEach(() => {
      ws.mergeCells(7, colIdx, 7, colIdx + 1);
      colIdx += 2;
    });

    row7.eachCell((cell) => {
      cell.font = { bold: true, size: 10, name: "Times New Roman", color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E2A4A" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // ── 3. DATA ROWS (KUNLAR VA PERIODLAR) ────────────────────────────────────
    let currentExcelRow = 8;
    const PERIODS = [1, 2, 3, 4, 5, 6, 7];

    DAYS.forEach((day) => {
      const dayStartRow = currentExcelRow;
      const isPrimaryWeekend = day.id === 6; // Shanba kuni 1-4 sinflar dam oladi

      PERIODS.forEach((period) => {
        const rowData: (string | number)[] = [
          day.name,
          period,
          PERIOD_TIMES_DEFAULT[period] || "",
        ];

        branchClasses.forEach((cls) => {
          const isPrimary = cls.isPrimary || cls.grade <= 4;
          if (isPrimaryWeekend && isPrimary) {
            rowData.push("—", "—");
            return;
          }

          const lesson = lessons.find(
            (l) => l.classId === cls.id && l.dayOfWeek === day.id && l.periodNumber === period
          );

          if (lesson) {
            const sub = subjectMap.get(lesson.subjectId);
            const teacherNum = teacherNumberMap.get(lesson.teacherId) || "";
            rowData.push(sub?.shortName || sub?.name || "Fan", teacherNum);
          } else {
            rowData.push("", "");
          }
        });

        // O'ng tomondagi O'qituvchilar reestri
        const teacherIdx = currentExcelRow - 8;
        if (teacherIdx < teachers.length) {
          const t = teachers[teacherIdx];
          rowData.push("", teacherIdx + 1, t.fullName);
        } else {
          rowData.push("", "", "");
        }

        const dataRow = ws.addRow(rowData);
        dataRow.height = 20;

        dataRow.eachCell((cell, cNum) => {
          cell.font = { size: 9, name: "Times New Roman" };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin", color: { argb: "FFD1D5DB" } },
            bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
            left: { style: "thin", color: { argb: "FFD1D5DB" } },
            right: { style: "thin", color: { argb: "FFD1D5DB" } },
          };
        });

        // O'qituvchi ismi ustuni — chapdan tekislash
        const teacherNameCol = totalClassCols + 6;
        dataRow.getCell(teacherNameCol).alignment = { horizontal: "left", vertical: "middle" };

        currentExcelRow++;
      });

      // Kun ustunini vertikal merge qilish
      ws.mergeCells(dayStartRow, 1, currentExcelRow - 1, 1);
      const dayCell = ws.getCell(dayStartRow, 1);
      dayCell.alignment = { horizontal: "center", vertical: "middle", textRotation: 90 };
      dayCell.font = { bold: true, size: 9, name: "Times New Roman" };
      dayCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } };

      // Kunlar orasidagi ajratuvchi qator
      const separatorRow = ws.addRow([]);
      separatorRow.height = 6;
      currentExcelRow++;
    });

    // ── 4. JAMI DARS SOATLARI QATORI ──────────────────────────────────────────
    const totalRowValues: (string | number)[] = ["Jami soat", "", ""];
    branchClasses.forEach((cls) => {
      const count = lessons.filter((l) => l.classId === cls.id).length;
      totalRowValues.push(`${count} soat`, "");
    });
    totalRowValues.push("", "", "");

    const totalRow = ws.addRow(totalRowValues);
    totalRow.height = 22;

    let totCol = 4;
    branchClasses.forEach(() => {
      ws.mergeCells(currentExcelRow, totCol, currentExcelRow, totCol + 1);
      totCol += 2;
    });

    totalRow.eachCell((cell) => {
      cell.font = { bold: true, size: 9, name: "Times New Roman" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: { style: "medium" }, bottom: { style: "medium" } };
    });

    // ── 5. IMZO QATORLARI (FOOTER) ────────────────────────────────────────────
    ws.addRow([]); // bo'sh
    ws.addRow([]); // bo'sh

    const signRow1 = ws.addRow([
      "",
      `O'quv ishlari bo'yicha direktor o'rinbosari: ____________________ ${academicVicePrincipalName}`,
    ]);
    signRow1.font = { bold: true, size: 10, name: "Times New Roman" };

    const signRow2 = ws.addRow([
      "",
      `Ruhshunos: ____________________ ${psychologistName}`,
    ]);
    signRow2.font = { bold: true, size: 10, name: "Times New Roman" };

    // ── 6. USTUNLAR KENGLIGI ──────────────────────────────────────────────────
    const colWidths: { width: number }[] = [
      { width: 5 },  // Kun
      { width: 5 },  // t/r
      { width: 12 }, // Vaqt
    ];

    branchClasses.forEach(() => {
      colWidths.push({ width: 13 }); // Fan nomi
      colWidths.push({ width: 5 });  // O'qituvchi raqami
    });

    colWidths.push({ width: 3 });  // Bo'sh separator
    colWidths.push({ width: 5 });  // O'qituvchi t/r
    colWidths.push({ width: 28 }); // O'qituvchi to'liq F.I.Sh

    ws.columns = colWidths;

    // Freeze header
    ws.views = [{ state: "frozen", ySplit: 7, xSplit: 3 }];
  }

  // Faylni yuklab olish
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const sanitizedName = (schoolName || "Maktab").replace(/\s+/g, "_");
  a.download = `${sanitizedName}_Dars_Jadvali_${academicYear}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(anchorOrFallback(a));
  URL.revokeObjectURL(url);
}

function anchorOrFallback(a: HTMLAnchorElement): HTMLElement {
  return a;
}
