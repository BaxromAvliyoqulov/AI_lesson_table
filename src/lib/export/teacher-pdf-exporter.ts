import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { SchoolClass, Subject, Teacher, Room, Lesson, Shift } from "@/types";
import { isClassSecondShift } from "@/lib/utils";

interface ExportTeacherPdfOptions {
  teacher: Teacher;
  lessons: Lesson[];
  classes: SchoolClass[];
  subjects: Subject[];
  rooms: Room[];
  shifts?: Shift[];
  schoolName?: string;
  academicYear?: string;
}

const DAYS = [
  { id: 1, name: "Dushanba", shortName: "Dush" },
  { id: 2, name: "Seshanba", shortName: "Sesh" },
  { id: 3, name: "Chorshanba", shortName: "Chor" },
  { id: 4, name: "Payshanba", shortName: "Pay" },
  { id: 5, name: "Juma", shortName: "Jum" },
  { id: 6, name: "Shanba", shortName: "Shan" },
];

const SHIFT_1_PERIODS = [
  { period: 1, time: "08:00 - 08:45" },
  { period: 2, time: "08:50 - 09:35" },
  { period: 3, time: "09:40 - 10:25" },
  { period: 4, time: "10:35 - 11:20" },
  { period: 5, time: "11:25 - 12:10" },
  { period: 6, time: "12:15 - 13:00" },
];

const SHIFT_2_PERIODS = [
  { period: 1, time: "13:00 - 13:45" },
  { period: 2, time: "13:50 - 14:35" },
  { period: 3, time: "14:40 - 15:25" },
  { period: 4, time: "15:35 - 16:20" },
  { period: 5, time: "16:25 - 17:10" },
  { period: 6, time: "17:15 - 18:00" },
];

/**
 * Generates an official, perfectly fitted A4 Landscape PDF for a teacher's schedule.
 * Guarantees zero overflow, crisp typography, and 100% fit on a single landscape sheet.
 */
export async function exportTeacherScheduleToPDF({
  teacher,
  lessons,
  classes,
  subjects,
  rooms,
  shifts = [],
  schoolName = "39-UMUMIY O'RTA TA'LIM MAKTABI",
  academicYear = "2025 - 2026",
}: ExportTeacherPdfOptions): Promise<void> {
  const classMap = new Map(classes.map((c) => [c.id, c]));
  const subjectMap = new Map(subjects.map((s) => [s.id, s]));
  const roomMap = new Map(rooms.map((r) => [r.id, r]));

  const teacherLessons = lessons.filter((l) => l.teacherId === teacher.id);
  const totalHours = teacherLessons.length;

  // Split into shift 1 and shift 2
  const shift1Lessons = teacherLessons.filter((l) => {
    const cls = classMap.get(l.classId);
    return !isClassSecondShift(cls, shifts);
  });
  const shift2Lessons = teacherLessons.filter((l) => {
    const cls = classMap.get(l.classId);
    return isClassSecondShift(cls, shifts);
  });

  // Cell map: `${day}_${shift}_${period}` => Lesson[]
  const cellMap = new Map<string, Lesson[]>();
  teacherLessons.forEach((l) => {
    const cls = classMap.get(l.classId);
    const shiftNum = isClassSecondShift(cls, shifts) ? 2 : 1;
    const key = `${l.dayOfWeek}_${shiftNum}_${l.periodNumber}`;
    const existing = cellMap.get(key) || [];
    existing.push(l);
    cellMap.set(key, existing);
  });

  // Daily totals
  const dailyTotals = new Map<number, number>();
  DAYS.forEach((d) => {
    const count = teacherLessons.filter((l) => l.dayOfWeek === d.id).length;
    dailyTotals.set(d.id, count);
  });

  // Subjects taught
  const taughtSubjectNames = Array.from(
    new Set(teacherLessons.map((l) => subjectMap.get(l.subjectId)?.name).filter(Boolean))
  ).join(", ");

  // Homeroom class if any
  const homeroomClass = classes.find(
    (c) => c.homeroomTeacherId === teacher.id || teacher.homeroomClassId === c.id
  );

  const methodDayName = teacher.methodDayOfWeek
    ? DAYS.find((d) => d.id === teacher.methodDayOfWeek)?.name
    : null;

  const hasShift1 = shift1Lessons.length > 0;
  const hasShift2 = shift2Lessons.length > 0;

  // Determine max periods to display in each shift (at least up to highest period with lessons, min 5)
  const maxShift1Period = Math.max(5, ...shift1Lessons.map((l) => l.periodNumber));
  const maxShift2Period = Math.max(3, ...shift2Lessons.map((l) => l.periodNumber));

  const p1Indices = Array.from({ length: Math.min(6, maxShift1Period) }, (_, i) => i + 1);
  const p2Indices = Array.from({ length: Math.min(6, maxShift2Period) }, (_, i) => i + 1);

  // Off-screen container optimized for A4 Landscape aspect ratio (297x210 => 1.414)
  const container = document.createElement("div");
  container.id = "pdf-render-container";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "1120px";
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#0f172a";
  container.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.padding = "14px 20px";
  container.style.boxSizing = "border-box";

  let html = `
    <div style="width: 100%; background: #ffffff; color: #0f172a; line-height: 1.2;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 8px;">
        <div>
          <div style="font-size: 8.5px; font-weight: 800; color: #4338ca; text-transform: uppercase; letter-spacing: 0.8px;">
            O'zbekiston Respublikasi Maktabgacha va Maktab Ta'limi Vazirligi
          </div>
          <h1 style="font-size: 15px; font-weight: 900; color: #0f172a; margin: 1px 0 0 0; text-transform: uppercase; letter-spacing: 0.3px;">
            ${schoolName}
          </h1>
          <div style="font-size: 9.5px; font-weight: 600; color: #64748b; margin-top: 1px;">
            O'qituvchining Rasmiy Haftalik Dars Jadvali • ${academicYear} O'quv Yili
          </div>
        </div>

        <div style="text-align: right; display: flex; align-items: center; gap: 10px;">
          <div style="background: #ecfdf5; border: 1.5px solid #10b981; color: #065f46; font-size: 9px; font-weight: 800; padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">
            ✓ TASDIQLANGAN
          </div>
          <div style="font-size: 8.5px; font-weight: 600; color: #64748b;">
            Hujjat ID: JADVAL-${teacher.displayNumber || "T"}-${new Date().getFullYear()}
          </div>
        </div>
      </div>

      <!-- Teacher Info Card -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 34px; height: 34px; border-radius: 8px; background: #4f46e5; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900;">
            ${(teacher.fullName || "O").charAt(0)}
          </div>
          <div>
            <div style="font-size: 13px; font-weight: 900; color: #0f172a;">
              ${teacher.fullName}
            </div>
            <div style="font-size: 9.5px; color: #475569; font-weight: 600;">
              ${taughtSubjectNames ? `Fan(lar)i: <strong style="color: #0f172a;">${taughtSubjectNames}</strong>` : ""}
              ${homeroomClass ? ` &bull; <span style="color: #b45309; font-weight: 700;">★ ${homeroomClass.name} sinf rahbari</span>` : ""}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 8px; text-align: center;">
            <span style="font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase;">Jami Yuklama: </span>
            <span style="font-size: 12px; font-weight: 900; color: #4f46e5;">${totalHours} soat</span>
          </div>

          <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px; padding: 3px 8px; text-align: center;">
            <span style="font-size: 8px; font-weight: 700; color: #64748b; text-transform: uppercase;">Smenalar: </span>
            <span style="font-size: 10px; font-weight: 800;">
              <span style="color: #d97706;">☀️ ${shift1Lessons.length} st</span> &bull; <span style="color: #4f46e5;">🌤️ ${shift2Lessons.length} st</span>
            </span>
          </div>

          ${
            methodDayName
              ? `
            <div style="background: #ecfdf5; border: 1px solid #6ee7b7; border-radius: 6px; padding: 3px 8px; text-align: center;">
              <span style="font-size: 8px; font-weight: 800; color: #065f46; text-transform: uppercase;">Metod kuni: </span>
              <span style="font-size: 10px; font-weight: 900; color: #047857;">${methodDayName.toUpperCase()}</span>
            </div>
          `
              : ""
          }
        </div>
      </div>

      <!-- Main Timetable Table -->
      <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 9px; border: 1.5px solid #0f172a; table-layout: fixed;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 1.5px solid #0f172a;">
            <th style="width: 82px; padding: 4px; border-right: 1.5px solid #0f172a; font-weight: 900; font-size: 9.5px; color: #0f172a; text-transform: uppercase;">
              Dars / Vaqt
            </th>
            ${DAYS.map((d) => {
              const isMethod = teacher.methodDayOfWeek === d.id;
              return `
                <th style="padding: 4px; border-right: 1px solid #cbd5e1; font-weight: 900; font-size: 10px; color: ${
                  isMethod ? "#065f46" : "#0f172a"
                }; background: ${isMethod ? "#d1fae5" : "#f1f5f9"};">
                  ${d.name}
                  ${
                    isMethod
                      ? `<div style="font-size: 7.5px; font-weight: 800; color: #047857; text-transform: uppercase;">(Metod kuni)</div>`
                      : `<div style="font-size: 8px; font-weight: 600; color: #64748b;">${dailyTotals.get(d.id) || 0} soat</div>`
                  }
                </th>
              `;
            }).join("")}
          </tr>
        </thead>
        <tbody>
  `;

  // Helper to render lesson cells
  const renderCellContent = (lessonsInCell: Lesson[], isMethod: boolean) => {
    if (lessonsInCell.length === 0) {
      if (isMethod) {
        return `<span style="color: #059669; font-size: 8px; font-weight: 700;">Metod kuni</span>`;
      }
      return `<span style="color: #cbd5e1; font-size: 10px;">—</span>`;
    }

    const isMultiple = lessonsInCell.length > 1;

    return `
      <div style="display: flex; flex-direction: ${isMultiple ? "row" : "column"}; gap: 3px; justify-content: center; align-items: stretch; width: 100%;">
        ${lessonsInCell
          .map((l) => {
            const subj = subjectMap.get(l.subjectId)?.name || "Fan";
            const cls = classMap.get(l.classId)?.name || "Sinf";
            const room = l.roomId ? roomMap.get(l.roomId)?.name : null;
            const group = l.groupType === "GROUP_1" ? "1-gr" : l.groupType === "GROUP_2" ? "2-gr" : null;

            return `
            <div style="flex: 1; background: #ffffff; border: 1px solid #3b82f6; border-radius: 4px; padding: 2px 3px; text-align: center; box-shadow: 0 0.5px 1px rgba(0,0,0,0.05); min-width: 0;">
              <div style="display: flex; justify-content: center; align-items: center; gap: 2px; white-space: nowrap;">
                <span style="font-weight: 900; font-size: 9.5px; color: #1e3a8a;">${cls}</span>
                ${group ? `<span style="font-size: 7.5px; font-weight: 800; background: #dbeafe; color: #1d4ed8; padding: 0 2px; border-radius: 2px;">${group}</span>` : ""}
                ${room ? `<span style="font-size: 7.5px; color: #64748b;">[${room}]</span>` : ""}
              </div>
              <div style="font-size: 8px; font-weight: 600; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px;">
                ${subj}
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;
  };

  // Render 1-Smena section
  if (hasShift1 || !hasShift2) {
    html += `
      <tr style="background: #fef3c7; border-top: 1.5px solid #0f172a; border-bottom: 1px solid #f59e0b;">
        <td colspan="7" style="padding: 3px 8px; text-align: left; font-size: 8.5px; font-weight: 900; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
          ☀️ 1-SMENA — ERTALABKI DARSLAR (08:00 — 13:00) &bull; Haftalik: ${shift1Lessons.length} soat
        </td>
      </tr>
    `;

    p1Indices.forEach((pt) => {
      const pInfo = SHIFT_1_PERIODS[pt - 1];
      html += `
        <tr style="border-bottom: 1px solid #e2e8f0; height: 26px;">
          <td style="padding: 2px 4px; background: #f8fafc; border-right: 1.5px solid #0f172a; font-weight: 800; font-size: 8.5px; color: #1e293b;">
            <span style="font-weight: 900;">${pInfo.period}-dars</span>
            <span style="font-size: 7.5px; color: #64748b; margin-left: 2px;">${pInfo.time}</span>
          </td>
          ${DAYS.map((d) => {
            const isMethod = teacher.methodDayOfWeek === d.id;
            const key = `${d.id}_1_${pt}`;
            const lessonsInCell = cellMap.get(key) || [];
            const bg = isMethod ? "background: #ecfdf5;" : lessonsInCell.length > 0 ? "background: #f8fafc;" : "background: #ffffff;";

            return `
              <td style="padding: 2px; border-right: 1px solid #e2e8f0; ${bg} vertical-align: middle;">
                ${renderCellContent(lessonsInCell, isMethod)}
              </td>
            `;
          }).join("")}
        </tr>
      `;
    });
  }

  // Divider between shifts
  if (hasShift1 && hasShift2) {
    html += `
      <tr style="background: #f1f5f9; border-top: 1px solid #0f172a; border-bottom: 1px solid #0f172a;">
        <td colspan="7" style="padding: 2px 6px; text-align: center; font-size: 8px; font-weight: 700; color: #64748b;">
          🥪 13:00 — 13:15 &bull; Tushlik va Smenalar almashinuvi tanaffusi
        </td>
      </tr>
    `;
  }

  // Render 2-Smena section
  if (hasShift2 || !hasShift1) {
    html += `
      <tr style="background: #e0e7ff; border-top: 1px solid #0f172a; border-bottom: 1px solid #6366f1;">
        <td colspan="7" style="padding: 3px 8px; text-align: left; font-size: 8.5px; font-weight: 900; color: #3730a3; text-transform: uppercase; letter-spacing: 0.5px;">
          🌤️ 2-SMENA — TUSHDAN KEYINGI DARSLAR (13:00 — 18:00) &bull; Haftalik: ${shift2Lessons.length} soat
        </td>
      </tr>
    `;

    p2Indices.forEach((pt) => {
      const pInfo = SHIFT_2_PERIODS[pt - 1];
      html += `
        <tr style="border-bottom: 1px solid #e2e8f0; height: 26px;">
          <td style="padding: 2px 4px; background: #f8fafc; border-right: 1.5px solid #0f172a; font-weight: 800; font-size: 8.5px; color: #1e293b;">
            <span style="font-weight: 900;">${pInfo.period}-dars</span>
            <span style="font-size: 7.5px; color: #64748b; margin-left: 2px;">${pInfo.time}</span>
          </td>
          ${DAYS.map((d) => {
            const isMethod = teacher.methodDayOfWeek === d.id;
            const key = `${d.id}_2_${pt}`;
            const lessonsInCell = cellMap.get(key) || [];
            const bg = isMethod ? "background: #ecfdf5;" : lessonsInCell.length > 0 ? "background: #faf5ff;" : "background: #ffffff;";

            return `
              <td style="padding: 2px; border-right: 1px solid #e2e8f0; ${bg} vertical-align: middle;">
                ${renderCellContent(lessonsInCell, isMethod)}
              </td>
            `;
          }).join("")}
        </tr>
      `;
    });
  }

  // Summary Row
  html += `
        <tr style="background: #f8fafc; border-top: 1.5px solid #0f172a; font-weight: 900; font-size: 9px;">
          <td style="padding: 4px; border-right: 1.5px solid #0f172a; text-transform: uppercase; color: #0f172a;">
            Kunlik Soat
          </td>
          ${DAYS.map((d) => {
            const count = dailyTotals.get(d.id) || 0;
            return `
              <td style="padding: 4px; border-right: 1px solid #cbd5e1; font-weight: 900; color: ${count > 0 ? "#4f46e5" : "#94a3b8"};">
                ${count > 0 ? `${count} soat` : "0"}
              </td>
            `;
          }).join("")}
        </tr>
      </tbody>
    </table>

    <!-- Official Signatures Footer -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #94a3b8; font-size: 9px; color: #334155;">
      <div>
        <div style="font-weight: 800; color: #0f172a;">Tasdiqlayman:</div>
        <div style="margin-top: 2px;">Maktab direktori: _____________________ (M. Ramazonov)</div>
      </div>

      <div style="text-align: center;">
        <div style="font-weight: 800; color: #0f172a;">Kelishildi:</div>
        <div style="margin-top: 2px;">O'quv ishlari bo'yicha direktor o'rinbosari: _____________________</div>
      </div>

      <div style="text-align: right;">
        <div style="font-weight: 800; color: #0f172a;">Dars jadvali bilan tanishdim:</div>
        <div style="margin-top: 2px;">O'qituvchi: _____________________ (${teacher.fullName})</div>
      </div>
    </div>
  </div>
  `;

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2.5, // 300+ DPI crisp quality
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/jpeg", 0.98);
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 6; // 6mm margin all around
    const availableWidth = pageWidth - margin * 2; // 285 mm
    const availableHeight = pageHeight - margin * 2; // 198 mm

    const imgRatio = canvas.width / canvas.height;
    const pageRatio = availableWidth / availableHeight;

    let renderWidth: number;
    let renderHeight: number;
    let xOffset: number;
    let yOffset: number;

    // Guaranteed proportional fit onto 1 single page without any cutoff
    if (imgRatio > pageRatio) {
      renderWidth = availableWidth;
      renderHeight = availableWidth / imgRatio;
      xOffset = margin;
      yOffset = margin + (availableHeight - renderHeight) / 2;
    } else {
      renderHeight = availableHeight;
      renderWidth = availableHeight * imgRatio;
      xOffset = margin + (availableWidth - renderWidth) / 2;
      yOffset = margin;
    }

    pdf.addImage(imgData, "JPEG", xOffset, yOffset, renderWidth, renderHeight);

    const cleanName = (teacher.fullName || "Oqituvchi")
      .replace(/[^a-zA-Z0-9\u0400-\u04FF_]/g, "_")
      .replace(/_+/g, "_");

    pdf.save(`${cleanName}_Dars_Jadvali.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
