import ExcelJS from "exceljs";
import { MMTV133Row, MMTV_133_UZBEK_MEDIUM, MMTV_133_RUSSIAN_MEDIUM } from "@/lib/curriculum-templates";

export async function exportMMTV133ToExcel(language: "UZBEK" | "RUSSIAN" = "UZBEK") {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Dars Jadval AI";
  workbook.created = new Date();

  const isUzbek = language === "UZBEK";
  const rows = isUzbek ? MMTV_133_UZBEK_MEDIUM : MMTV_133_RUSSIAN_MEDIUM;
  const sheetTitle = isUzbek ? "1-Ilova (O'zbek tili)" : "2-Ilova (Rus tili)";
  const sheet = workbook.addWorksheet(sheetTitle, {
    views: [{ state: "frozen", xSplit: 2, ySplit: 4 }],
  });

  // 1. Sarlavha
  sheet.mergeCells("A1:N1");
  const titleRow = sheet.getCell("A1");
  titleRow.value = isUzbek
    ? "O'ZBEKISTON RESPUBLIKASI MAKTABGACHA VA MAKTAB TA'LIMI VAZIRLIGI"
    : "МИНИСТЕРСТВО ДОШКОЛЬНОГО И ШКОЛЬНОГО ОБРАЗОВАНИЯ РЕСПУБЛИКИ УЗБЕКИСТАН";
  titleRow.font = { name: "Times New Roman", size: 13, bold: true, color: { argb: "FF1E3A8A" } };
  titleRow.alignment = { horizontal: "center", vertical: "middle" };

  sheet.mergeCells("A2:N2");
  const subtitleRow = sheet.getCell("A2");
  subtitleRow.value = isUzbek
    ? "2026-2027-o'quv yili uchun Tayanch O'quv Rejasi (133-sonli buyruq 1-Ilova: O'zbek tili ta'limi)"
    : "Базисный учебный план на 2026-2027 учебный год (Приказ №133, Приложение 2: Обучение на русском языке)";
  subtitleRow.font = { name: "Times New Roman", size: 11, italic: true };
  subtitleRow.alignment = { horizontal: "center", vertical: "middle" };

  // 2. Ustunlar sarlavhasi (Header)
  const headerRow = sheet.getRow(4);
  headerRow.values = [
    "№",
    "Fan nomi",
    "Yo'nalishi",
    "1-sinf",
    "2-sinf",
    "3-sinf",
    "4-sinf",
    "5-sinf",
    "6-sinf",
    "7-sinf",
    "8-sinf",
    "9-sinf",
    "10-sinf",
    "11-sinf",
  ];
  headerRow.font = { name: "Times New Roman", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E40AF" },
  };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };
  headerRow.height = 26;

  sheet.getColumn(1).width = 6;
  sheet.getColumn(2).width = 34;
  sheet.getColumn(3).width = 18;
  for (let c = 4; c <= 14; c++) {
    sheet.getColumn(c).width = 9;
  }

  // 3. Qatorlar (Data)
  let rowIdx = 5;
  rows.forEach((r, idx) => {
    const dataRow = sheet.getRow(rowIdx);
    const rowValues: any[] = [
      idx + 1,
      r.subjectName,
      r.direction,
      ...r.hoursByGrade.map((h) => (h > 0 ? h : "-")),
    ];
    dataRow.values = rowValues;
    dataRow.font = { name: "Times New Roman", size: 10 };
    dataRow.height = 20;

    dataRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
    dataRow.getCell(2).alignment = { horizontal: "left", vertical: "middle" };
    dataRow.getCell(3).alignment = { horizontal: "left", vertical: "middle" };

    for (let c = 4; c <= 14; c++) {
      const cell = dataRow.getCell(c);
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (cell.value !== "-") {
        cell.font = { name: "Times New Roman", size: 10, bold: true };
      }
    }

    // Border
    for (let c = 1; c <= 14; c++) {
      dataRow.getCell(c).border = {
        top: { style: "thin", color: { argb: "FFCBD5E1" } },
        bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    }
    rowIdx++;
  });

  // 4. Jami soatlar qatori (Footer Totals)
  const totalRow = sheet.getRow(rowIdx);
  const totals: any[] = ["", "JAMI HAFTALIK SOAT (Me'yor)", ""];
  for (let g = 0; g < 11; g++) {
    const gradeTotal = rows.reduce((sum, r) => sum + (r.hoursByGrade[g] || 0), 0);
    totals.push(gradeTotal);
  }
  totalRow.values = totals;
  totalRow.font = { name: "Times New Roman", size: 10, bold: true, color: { argb: "FF0F172A" } };
  totalRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFEF08A" },
  };
  totalRow.height = 24;

  for (let c = 1; c <= 14; c++) {
    const cell = totalRow.getCell(c);
    cell.alignment = { horizontal: c <= 2 ? "left" : "center", vertical: "middle" };
    cell.border = {
      top: { style: "medium", color: { argb: "FF475569" } },
      bottom: { style: "double", color: { argb: "FF475569" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  }

  // Faylni yuklab olish
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `MMTV_133_Tayanch_Oquv_Rejasi_${isUzbek ? "Ozbek" : "Rus"}_2026-2027.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
