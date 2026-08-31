import { NextResponse } from "next/server";
import ExcelJS from "exceljs";

const WEEKDAYS = ["Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

export async function POST(req: Request) {
  try {
    const { teachers, subjects, classes, schoolName } = await req.json();

    const subjectMap = new Map(subjects.map((s: any) => [s.id, s.name]));
    const classMap = new Map(classes.map((c: any) => [c.id, c.name]));

    const wb = new ExcelJS.Workbook();
    wb.creator = "JadvalAI";
    wb.created = new Date();

    const ws = wb.addWorksheet("O'qituvchilar ro'yxati", {
      pageSetup: { paperSize: 9, orientation: "landscape", fitToPage: true },
    });

    // ── SARLAVHA ─────────────────────────────────────────────────────────────
    ws.mergeCells("A1:I1");
    ws.getCell("A1").value = schoolName || "Maktab";
    ws.getCell("A1").font = { bold: true, size: 14, name: "Times New Roman" };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.mergeCells("A2:I2");
    ws.getCell("A2").value = `O'QITUVCHILAR RO'YXATI`;
    ws.getCell("A2").font = { bold: true, size: 13, name: "Times New Roman" };
    ws.getCell("A2").alignment = { horizontal: "center" };

    ws.mergeCells("A3:I3");
    ws.getCell("A3").value = `Sana: ${new Date().toLocaleDateString("uz-Latn-UZ")} | Jami: ${teachers.length} ta o'qituvchi`;
    ws.getCell("A3").font = { size: 10, italic: true, color: { argb: "FF6B7280" }, name: "Times New Roman" };
    ws.getCell("A3").alignment = { horizontal: "center" };

    ws.addRow([]);

    // ── HEADER ROW ────────────────────────────────────────────────────────────
    const headerRow = ws.addRow([
      "t/r",
      "F.I.Sh",
      "Telefon",
      "Fanlar",
      "Metod kuni",
      "Haftalik sig'im",
      "Maks ketma-ket",
      "Sinf rahbarligi",
      "Izoh",
    ]);

    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 10, name: "Times New Roman", color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E2A4A" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
    });
    headerRow.height = 28;

    // ── DATA ROWS ─────────────────────────────────────────────────────────────
    teachers.forEach((t: any, i: number) => {
      const fanlar = (t.subjectIds || [])
        .map((id: string) => subjectMap.get(id))
        .filter(Boolean)
        .join(", ") || "—";

      const methodDay = t.methodDayOfWeek
        ? WEEKDAYS[t.methodDayOfWeek - 1]
        : "—";

      const homeroomClass = t.homeroomClassId
        ? classMap.get(t.homeroomClassId) || "—"
        : "—";

      const row = ws.addRow([
        i + 1,
        t.fullName,
        t.phone || "—",
        fanlar,
        methodDay,
        `${t.weeklyHourCapacity} soat`,
        `${t.maxConsecutiveHours} soat`,
        homeroomClass,
        "",
      ]);

      const isEven = i % 2 === 0;
      row.eachCell((cell) => {
        cell.font = { size: 10, name: "Times New Roman" };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: isEven ? "FFF8F9FF" : "FFFFFFFF" },
        };
        cell.alignment = { vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "hair", color: { argb: "FFE5E7EB" } },
          bottom: { style: "hair", color: { argb: "FFE5E7EB" } },
          left: { style: "thin", color: { argb: "FFD1D5DB" } },
          right: { style: "thin", color: { argb: "FFD1D5DB" } },
        };
      });

      // t/r ustuni — markazda
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.height = 22;
    });

    // ── JAMI ROW ──────────────────────────────────────────────────────────────
    ws.addRow([]);
    const totalRow = ws.addRow([`Jami: ${teachers.length} ta o'qituvchi`, "", "", "", "", "", "", "", ""]);
    ws.mergeCells(`A${totalRow.number}:I${totalRow.number}`);
    totalRow.getCell(1).font = { bold: true, size: 10, italic: true, name: "Times New Roman" };

    // ── USTUN KENGLIKLARI ────────────────────────────────────────────────────
    ws.columns = [
      { width: 5 },  // t/r
      { width: 28 }, // F.I.Sh
      { width: 16 }, // Telefon
      { width: 35 }, // Fanlar
      { width: 13 }, // Metod kuni
      { width: 14 }, // Haftalik sig'im
      { width: 14 }, // Maks ketma-ket
      { width: 14 }, // Sinf rahbarligi
      { width: 16 }, // Izoh
    ];

    // Headerlar freeze
    ws.views = [{ state: "frozen", ySplit: 5 }];

    // ── BUFFER ──────────────────────────────────────────────────────────────
    const buffer = await wb.xlsx.writeBuffer();

    const date = new Date().toISOString().slice(0, 10);
    const filename = `${(schoolName || "maktab").replace(/\s+/g, "_")}_oquvchilar_${date}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
      },
    });
  } catch (err) {
    console.error("[EXPORT_TEACHERS]", err);
    return NextResponse.json({ error: "Export amalga oshmadi" }, { status: 500 });
  }
}
