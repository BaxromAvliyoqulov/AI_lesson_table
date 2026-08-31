import ExcelJS from "exceljs";
import { Lesson, SchoolClass, Subject, Teacher, Room, Branch, Shift } from "@/types";

export interface ExcelExportOptions {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms?: Room[];
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
  approvalDate?: string;
}

const DAYS = [
  { id: 1, name: "DUSHANBA" },
  { id: 2, name: "SESHANBA" },
  { id: 3, name: "CHORSHANBA" },
  { id: 4, name: "PAYSHANBA" },
  { id: 5, name: "JUMA" },
  { id: 6, name: "SHANBA" },
];

const PERIOD_TIMES: Record<number, string> = {
  1: "08:00-08:45",
  2: "08:50-09:35",
  3: "09:40-10:25",
  4: "10:35-11:20",
  5: "11:25-12:10",
  6: "12:15-13:00",
  7: "13:05-13:50",
};

/**
 * 39-maktab va O'zbekiston xalq ta'limi standarti bo'yicha Rasmiy A3 Excel faylini generatsiya qilish
 */
export async function exportScheduleToExcel(options: ExcelExportOptions) {
  const {
    classes,
    subjects,
    teachers,
    lessons,
    branches = [],
    schoolName = "39 - umumiy o'rta ta'lim maktabi",
    region = "Muzrabot tumani",
    directorFullName = "M. Ramazonov",
    academicVicePrincipalName = "N. Narziqulov",
    psychologistName = "F.I.Sh",
    academicYear = "2025 - 2026",
    approvalDate = "2026-yil 28-mart",
  } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "JadvalAI Enterprise SaaS";
  workbook.created = new Date();

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));

  // O'qituvchilarning o'tadigan fanlari ro'yxati (Fan nomi / qisqartmasi)
  const teacherSubjectsMap = new Map<string, string>();
  for (const t of teachers) {
    const subjectNames = new Set<string>();
    if (t.subjectIds && t.subjectIds.length > 0) {
      t.subjectIds.forEach((sid) => {
        const s = subjectMap.get(sid);
        if (s && s.id !== "sub_sinf_soati") {
          subjectNames.add(s.shortName || s.name);
        }
      });
    }
    for (const cls of classes) {
      cls.subjects.forEach((cs) => {
        if (cs.teacherId === t.id && cs.subjectId !== "sub_sinf_soati") {
          const s = subjectMap.get(cs.subjectId);
          if (s) subjectNames.add(s.shortName || s.name);
        }
      });
    }
    for (const l of lessons) {
      if (l.teacherId === t.id && l.subjectId !== "sub_sinf_soati") {
        const s = subjectMap.get(l.subjectId);
        if (s) subjectNames.add(s.shortName || s.name);
      }
    }
    teacherSubjectsMap.set(
      t.id,
      subjectNames.size === 0 ? "—" : Array.from(subjectNames).join(", ")
    );
  }

  // Filiallar bo'yicha varaqlar (Sheets)
  const branchList =
    branches.length > 0
      ? branches
      : [{ id: "main", schoolId: "", name: "Asosiy bino", isMain: true }];

  for (const branch of branchList) {
    const branchClasses = classes.filter((c) =>
      branches.length > 0 ? c.branchId === branch.id : true
    );
    if (branchClasses.length === 0) continue;

    // Faol o'qituvchilar va 1..N ketma-ket raqamlash
    const activeTeacherIds = new Set<string>();
    for (const cls of branchClasses) {
      if (cls.homeroomTeacherId) activeTeacherIds.add(cls.homeroomTeacherId);
      cls.subjects.forEach((s) => activeTeacherIds.add(s.teacherId));
    }
    for (const l of lessons) {
      if (branchClasses.some((c) => c.id === l.classId)) {
        activeTeacherIds.add(l.teacherId);
      }
    }
    const branchTeachers = teachers.filter((t) => activeTeacherIds.has(t.id));
    const finalTeachers = branchTeachers.length > 0 ? branchTeachers : teachers;

    const teacherNumberMap = new Map<string, number>();
    finalTeachers.forEach((t, i) => {
      teacherNumberMap.set(t.id, i + 1);
    });

    const sheetTitle = branch.isMain ? "Asosiy maktab" : branch.name.slice(0, 25);
    
    // 📄 A3 ALBOM (LANDSCAPE) SAHIFA SOZLAMALARI
    const ws = workbook.addWorksheet(sheetTitle, {
      pageSetup: {
        paperSize: 8 as any, // A3 Formati (Excel Paper Size 8)
        orientation: "landscape",
        fitToPage: true,
        fitToWidth: 1, // Kengligi 1 varaqqa sig'dirish
        fitToHeight: 0, // Balandligi avtomatik
        margins: {
          left: 0.25,
          right: 0.25,
          top: 0.35,
          bottom: 0.35,
          header: 0.15,
          footer: 0.15,
        },
      },
    });

    const totalClassCols = branchClasses.length * 2; // Har bir sinf uchun 2 ta ustun (Fan, №)
    const lastClassColNum = 3 + totalClassCols;
    const reestrStartCol = lastClassColNum + 2; // 1 ta bo'sh oraliq ustun

    // ── 1. SARLAVHALAR VA TASDIQLASH SHTAMPI ──────────────────────────────────
    // TASDIQLAYMAN (Chap tomonda)
    ws.mergeCells(1, 1, 1, Math.min(6, lastClassColNum));
    const cellApprove = ws.getCell(1, 1);
    cellApprove.value = "TASDIQLAYMAN";
    cellApprove.font = { bold: true, size: 11, name: "Times New Roman" };
    cellApprove.alignment = { horizontal: "left" };

    ws.mergeCells(2, 1, 2, Math.min(6, lastClassColNum));
    const cellDir = ws.getCell(2, 1);
    cellDir.value = `Maktab direktori: __________ ${directorFullName}`;
    cellDir.font = { size: 10, name: "Times New Roman" };
    cellDir.alignment = { horizontal: "left" };

    ws.mergeCells(3, 1, 3, Math.min(6, lastClassColNum));
    const cellDate = ws.getCell(3, 1);
    cellDate.value = approvalDate;
    cellDate.font = { size: 9.5, name: "Times New Roman" };
    cellDate.alignment = { horizontal: "left" };

    // Sarlavha (Markazda)
    ws.mergeCells(4, 1, 4, lastClassColNum);
    const subTitle = ws.getCell(4, 1);
    subTitle.value = `${region} ${schoolName}${branch.isMain ? "" : ` (${branch.name})`} ning ${academicYear} o'quv yili uchun tuzilgan`;
    subTitle.font = { bold: true, size: 11, name: "Times New Roman" };
    subTitle.alignment = { horizontal: "center", vertical: "middle" };

    ws.mergeCells(5, 1, 5, lastClassColNum);
    const mainTitle = ws.getCell(5, 1);
    mainTitle.value = `D A R S   J A D V A L I`;
    mainTitle.font = { bold: true, size: 16, name: "Times New Roman" };
    mainTitle.alignment = { horizontal: "center", vertical: "middle" };

    ws.addRow([]); // Qator 6 — bo'sh oraliq
    ws.getRow(6).height = 8;

    // ── 2. JADVAL SARLAVHALARI (Qator 7 & 8) ──────────────────────────────────
    const row7Values: (string | number)[] = ["Kun", "Dars", "Vaqti"];
    branchClasses.forEach((cls) => {
      row7Values.push(cls.name, "");
    });
    // Bo'sh oraliq + Reestr sarlavhasi
    row7Values.push("", "O'QITUVCHILAR VA FANLAR REESTRI", "", "");

    const row7 = ws.addRow(row7Values);
    row7.height = 26;

    // Sinf nomlarini merge qilish
    let colIdx = 4;
    branchClasses.forEach(() => {
      ws.mergeCells(7, colIdx, 7, colIdx + 1);
      colIdx += 2;
    });

    // Reestr sarlavhasini merge qilish
    ws.mergeCells(7, reestrStartCol, 7, reestrStartCol + 2);

    // Qator 7 dizayni
    row7.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 10.5, name: "Times New Roman", color: { argb: "FF000000" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (colNumber <= lastClassColNum) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        cell.border = {
          top: { style: "medium", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      } else if (colNumber >= reestrStartCol) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFCBD5E1" } };
        cell.border = {
          top: { style: "medium", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      }
    });

    // Qator 8: Fan | № kichik sarlavhalari
    const row8Values: (string | number)[] = ["", "", ""];
    branchClasses.forEach(() => {
      row8Values.push("Fan", "№");
    });
    row8Values.push("", "№", "O'qituvchi F.I.Sh", "O'tadigan Fani / Fanlari");

    const row8 = ws.addRow(row8Values);
    row8.height = 20;

    // Kun, Dars, Vaqti ustunlarini vertikal merge qilish (Row 7 va 8)
    ws.mergeCells(7, 1, 8, 1);
    ws.mergeCells(7, 2, 8, 2);
    ws.mergeCells(7, 3, 8, 3);

    row8.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 9.5, name: "Times New Roman", color: { argb: "FF1E293B" } };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      if (colNumber <= lastClassColNum) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      } else if (colNumber >= reestrStartCol) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      }
    });

    // ── 3. DATA ROWS (Dushanba..Shanba, 1..6 Darslar) ────────────────────────
    let currentExcelRow = 9;
    const PERIOD_COUNT = 6;
    let teacherRowIdx = 0;

    DAYS.forEach((day) => {
      const dayStartRow = currentExcelRow;

      for (let period = 1; period <= PERIOD_COUNT; period++) {
        const isLastPeriodOfDay = period === PERIOD_COUNT;
        const rowData: (string | number)[] = [
          day.name,
          period,
          PERIOD_TIMES[period] || "",
        ];

        branchClasses.forEach((cls) => {
          const isPrimary = cls.isPrimary || cls.grade <= 4;
          if (day.id === 6 && isPrimary) {
            rowData.push("—", "—");
            return;
          }

          const lesson = lessons.find(
            (l) =>
              l.classId === cls.id &&
              l.dayOfWeek === day.id &&
              l.periodNumber === period
          );

          if (lesson) {
            const sub = subjectMap.get(lesson.subjectId);
            const teacherNum = teacherNumberMap.get(lesson.teacherId) || "";
            rowData.push(sub?.shortName || sub?.name || "Fan", teacherNum);
          } else {
            rowData.push("", "");
          }
        });

        // O'ng tomondagi O'qituvchilar Reestri qatorlari
        if (teacherRowIdx < finalTeachers.length) {
          const t = finalTeachers[teacherRowIdx];
          const tSubjects = teacherSubjectsMap.get(t.id) || "—";
          rowData.push("", teacherRowIdx + 1, t.fullName, tSubjects);
          teacherRowIdx++;
        } else {
          rowData.push("", "", "", "");
        }

        const dataRow = ws.addRow(rowData);
        dataRow.height = 22;

        const bottomStyle = isLastPeriodOfDay ? "medium" : "thin";

        dataRow.eachCell((cell, colNumber) => {
          cell.font = { size: 9.5, name: "Times New Roman" };
          cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };

          if (colNumber <= lastClassColNum) {
            cell.border = {
              top: { style: "thin", color: { argb: "FF000000" } },
              bottom: { style: bottomStyle, color: { argb: "FF000000" } },
              left: { style: "thin", color: { argb: "FF000000" } },
              right: { style: "thin", color: { argb: "FF000000" } },
            };

            // Dars vaqti va tartib raqamiga yengil fon
            if (colNumber === 2 || colNumber === 3) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAFAFA" } };
            }
          } else if (colNumber >= reestrStartCol && cell.value) {
            cell.border = {
              top: { style: "thin", color: { argb: "FF000000" } },
              bottom: { style: "thin", color: { argb: "FF000000" } },
              left: { style: "thin", color: { argb: "FF000000" } },
              right: { style: "thin", color: { argb: "FF000000" } },
            };

            if (colNumber === reestrStartCol + 1 || colNumber === reestrStartCol + 2) {
              cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
            }
          }
        });

        currentExcelRow++;
      }

      // Kun ustunini vertikal birlashtirish (DUSHANBA, SESHANBA...)
      ws.mergeCells(dayStartRow, 1, currentExcelRow - 1, 1);
      const dayCell = ws.getCell(dayStartRow, 1);
      dayCell.alignment = {
        horizontal: "center",
        vertical: "middle",
        textRotation: 90,
      };
      dayCell.font = { bold: true, size: 10, name: "Times New Roman" };
      dayCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1F5F9" },
      };
      dayCell.border = {
        top: { style: "medium", color: { argb: "FF000000" } },
        bottom: { style: "medium", color: { argb: "FF000000" } },
        left: { style: "medium", color: { argb: "FF000000" } },
        right: { style: "medium", color: { argb: "FF000000" } },
      };
    });

    // ── 4. JAMI DARS SOATLARI STATISTIKA QATORI ───────────────────────────────
    const totalRowValues: (string | number)[] = ["Dars soati", "", ""];
    branchClasses.forEach((cls) => {
      const count = lessons.filter((l) => l.classId === cls.id).length;
      totalRowValues.push(`${count}`, "");
    });
    totalRowValues.push("", "", "", "");

    const totalRow = ws.addRow(totalRowValues);
    totalRow.height = 22;

    // Dars soati sarlavhasini A..C merge
    ws.mergeCells(currentExcelRow, 1, currentExcelRow, 3);
    let totCol = 4;
    branchClasses.forEach(() => {
      ws.mergeCells(currentExcelRow, totCol, currentExcelRow, totCol + 1);
      totCol += 2;
    });

    totalRow.eachCell((cell, colNumber) => {
      if (colNumber <= lastClassColNum) {
        cell.font = { bold: true, size: 10, name: "Times New Roman" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "medium", color: { argb: "FF000000" } },
          bottom: { style: "thin", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      }
    });
    currentExcelRow++;

    // ── 5. SINF RAHBARLARI QATORI ─────────────────────────────────────────────
    const homeroomRowValues: (string | number)[] = ["Sinf rahbar", "", ""];
    branchClasses.forEach((cls) => {
      const homeroomTeacher =
        teachers.find((t) => t.id === cls.homeroomTeacherId) ||
        teachers.find((t) => t.homeroomClassId === cls.id);
      const shortName = homeroomTeacher
        ? homeroomTeacher.fullName.split(" ").slice(0, 2).join(" ")
        : "—";
      homeroomRowValues.push(shortName, "");
    });
    homeroomRowValues.push("", "", "", "");

    const homeroomRow = ws.addRow(homeroomRowValues);
    homeroomRow.height = 22;

    ws.mergeCells(currentExcelRow, 1, currentExcelRow, 3);
    let hrCol = 4;
    branchClasses.forEach(() => {
      ws.mergeCells(currentExcelRow, hrCol, currentExcelRow, hrCol + 1);
      hrCol += 2;
    });

    homeroomRow.eachCell((cell, colNumber) => {
      if (colNumber <= lastClassColNum) {
        cell.font = { bold: true, size: 9, name: "Times New Roman" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
          left: { style: "thin", color: { argb: "FF000000" } },
          right: { style: "thin", color: { argb: "FF000000" } },
        };
      }
    });
    currentExcelRow++;

    // ── 6. RASMIY IMZOLAR (FOOTER SIGNATURES) ─────────────────────────────────
    ws.addRow([]);
    ws.getRow(currentExcelRow).height = 14;
    currentExcelRow++;

    const signRow = ws.addRow([
      "",
      `O'quv ishlar bo'yicha direktor o'rinbosari: ____________________ ${academicVicePrincipalName}`,
    ]);
    signRow.height = 24;
    signRow.font = { bold: true, size: 10.5, name: "Times New Roman" };

    // Ruhshunos imzosi (Reestr tagiga)
    ws.getCell(currentExcelRow, reestrStartCol).value = `Ruhshunos: ____________________ ${psychologistName}`;
    ws.getCell(currentExcelRow, reestrStartCol).font = {
      bold: true,
      size: 10.5,
      name: "Times New Roman",
    };

    // ── 7. KENG KELTIRILGAN IDEAL USTUN KENGLIKLARI (Auto Zero-Adjustment) ───────
    const colWidths: { width: number }[] = [
      { width: 7 },   // Col A: Kun
      { width: 5.5 }, // Col B: Dars
      { width: 13.5 },// Col C: Vaqti
    ];

    branchClasses.forEach(() => {
      colWidths.push({ width: 15.5 }); // Fan nomi (Hech qachon qisilib qolmaydi)
      colWidths.push({ width: 5.5 });  // O'qituvchi tartib raqami (№)
    });

    colWidths.push({ width: 3.5 });  // Bo'sh oraliq ustun
    colWidths.push({ width: 5.5 });  // Reestr №
    colWidths.push({ width: 28 });   // Reestr O'qituvchi F.I.Sh
    colWidths.push({ width: 30 });   // Reestr O'tadigan Fanlari

    ws.columns = colWidths;

    // Freeze Panes (Header va chap ustunlar doim ko'rinib turishi uchun)
    ws.views = [{ state: "frozen", ySplit: 8, xSplit: 3 }];
  }

  // Excel faylni generatsiya qilish va yuklab olish
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const sanitizedName = (schoolName || "Maktab").replace(/[\s/\\?%*:|"<>]+/g, "_");
  a.download = `${sanitizedName}_Rasmiy_A3_Dars_Jadvali_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
