import ExcelJS from "exceljs";
import { Lesson, SchoolClass, Subject, Teacher, Room } from "@/types";

export async function exportScheduleToExcel({
  classes,
  subjects,
  teachers,
  rooms,
  lessons,
  schoolName = "21-Maktab",
}: {
  classes: SchoolClass[];
  subjects: Subject[];
  teachers: Teacher[];
  rooms: Room[];
  lessons: Lesson[];
  schoolName?: string;
}) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Jadval.AI SaaS";
  workbook.created = new Date();

  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));

  const DAYS = [
    { id: 1, name: "Dushanba" },
    { id: 2, name: "Seshanba" },
    { id: 3, name: "Chorshanba" },
    { id: 4, name: "Payshanba" },
    { id: 5, name: "Juma" },
    { id: 6, name: "Shanba" },
  ];

  const PERIODS = [1, 2, 3, 4, 5, 6, 7];

  // 1. UMUMIY MASTER JADVAL VARAG'I (Master Grid Sheet)
  const masterSheet = workbook.addWorksheet("Umumiy Master Jadval", {
    views: [{ state: "frozen", xSplit: 2, ySplit: 2 }],
  });

  // Sarlavha qatori
  const headerRow = ["Kun", "Dars", ...classes.map((c) => `${c.name} (${c.grade}-sinf)`)];
  const header = masterSheet.addRow(headerRow);
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E2A4A" }, // Navy
  };
  header.alignment = { vertical: "middle", horizontal: "center" };

  // Har bir kun va dars uchun qatorlar
  DAYS.forEach((day) => {
    PERIODS.forEach((period) => {
      const rowData = [
        period === 1 ? day.name : "",
        `${period}-dars`,
        ...classes.map((cls) => {
          const lesson = lessons.find(
            (l) => l.classId === cls.id && l.dayOfWeek === day.id && l.periodNumber === period
          );
          if (!lesson) return "-";
          const sub = subjectMap.get(lesson.subjectId);
          const t = teacherMap.get(lesson.teacherId);
          const tShort = t ? t.fullName.split(" ").slice(0, 2).join(" ") : "";
          return `${sub?.name || "Fan"}\n(${tShort})`;
        }),
      ];

      const row = masterSheet.addRow(rowData);
      row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      row.height = 36;
    });
  });

  // Ustunlar kengligini moslash
  masterSheet.columns = [
    { width: 14 },
    { width: 10 },
    ...classes.map(() => ({ width: 22 })),
  ];

  // 2. SINFLAR KESIMIDA ALOHIDA VARAQLAR (Per-Class Sheets)
  classes.forEach((cls) => {
    const sheet = workbook.addWorksheet(`${cls.name}-sinf`, {
      views: [{ state: "frozen", xSplit: 1, ySplit: 1 }],
    });

    const clsHeader = ["Dars", ...DAYS.map((d) => d.name)];
    const hRow = sheet.addRow(clsHeader);
    hRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
    hRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" }, // Blue
    };

    PERIODS.forEach((period) => {
      const rData = [
        `${period}-dars`,
        ...DAYS.map((day) => {
          const l = lessons.find(
            (item) => item.classId === cls.id && item.dayOfWeek === day.id && item.periodNumber === period
          );
          if (!l) return "-";
          const sub = subjectMap.get(l.subjectId);
          const t = teacherMap.get(l.teacherId);
          const tShort = t ? t.fullName.split(" ").slice(0, 2).join(" ") : "";
          return `${sub?.name || "Fan"}\n${tShort}`;
        }),
      ];
      const r = sheet.addRow(rData);
      r.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      r.height = 32;
    });

    sheet.columns = [{ width: 12 }, ...DAYS.map(() => ({ width: 20 }))];
  });

  // Excel faylni generatsiya qilib browserga yuklab berish
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${schoolName}_Dars_Jadvali_${new Date().toISOString().slice(0, 10)}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
