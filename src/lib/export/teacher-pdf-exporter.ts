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
 * Generates an official, high-resolution A4 Landscape PDF for a teacher's schedule.
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

  // Map of key `${day}_${shift}_${period}` => Lesson[]
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

  // Unique subjects taught
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

  // Determine which shifts have lessons
  const hasShift1 = shift1Lessons.length > 0;
  const hasShift2 = shift2Lessons.length > 0;

  // Create an off-screen container for crisp rendering
  const container = document.createElement("div");
  container.id = "pdf-render-container";
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "1180px"; // standard A4 landscape proportions
  container.style.backgroundColor = "#ffffff";
  container.style.color = "#0f172a";
  container.style.fontFamily = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  container.style.padding = "24px 32px";
  container.style.boxSizing = "border-box";

  // Build HTML string
  let html = `
    <div style="width: 100%; background: #ffffff; color: #0f172a;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 14px;">
        <div>
          <div style="font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 1px;">
            O'zbekiston Respublikasi Maktabgacha va Maktab Ta'limi Vazirligi
          </div>
          <h1 style="font-size: 18px; font-weight: 900; color: #0f172a; margin: 2px 0 0 0; text-transform: uppercase; letter-spacing: 0.5px;">
            ${schoolName}
          </h1>
          <div style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 2px;">
            O'qituvchining Rasmiy Haftalik Dars Jadvali • ${academicYear} O'quv Yili
          </div>
        </div>

        <div style="text-align: right;">
          <div style="display: inline-block; background: #ecfdf5; border: 1.5px solid #10b981; color: #065f46; font-size: 10px; font-weight: 800; padding: 4px 10px; rounded: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
            ✓ TASDIQLANGAN
          </div>
          <div style="font-size: 10px; font-weight: 600; color: #64748b; margin-top: 4px;">
            Hujjat ID: JADVAL-${teacher.displayNumber || "T"}-${new Date().getFullYear()}
          </div>
        </div>
      </div>

      <!-- Teacher Info Banner -->
      <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 10px 16px; margin-bottom: 14px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 10px; background: #4f46e5; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 900;">
            ${(teacher.fullName || "O").charAt(0)}
          </div>
          <div>
            <div style="font-size: 15px; font-weight: 900; color: #0f172a; line-height: 1.2;">
              ${teacher.fullName}
            </div>
            <div style="font-size: 11px; color: #475569; font-weight: 600; margin-top: 2px;">
              ${taughtSubjectNames ? `Fan(lar)i: <strong style="color: #0f172a;">${taughtSubjectNames}</strong>` : ""}
              ${homeroomClass ? ` &bull; <span style="color: #b45309; font-weight: 700;">★ ${homeroomClass.name} sinf rahbari</span>` : ""}
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; text-align: center;">
            <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Jami Yuklama</div>
            <div style="font-size: 15px; font-weight: 900; color: #4f46e5;">${totalHours} <span style="font-size: 10px; font-weight: 600; color: #64748b;">soat</span></div>
          </div>

          <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 6px 12px; text-align: center;">
            <div style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase;">Smenalar</div>
            <div style="font-size: 11px; font-weight: 800; color: #0f172a;">
              <span style="color: #d97706;">☀️ ${shift1Lessons.length} st</span> &bull; <span style="color: #4f46e5;">🌤️ ${shift2Lessons.length} st</span>
            </div>
          </div>

          ${
            methodDayName
              ? `
            <div style="background: #ecfdf5; border: 1.5px solid #6ee7b7; border-radius: 8px; padding: 6px 12px; text-align: center;">
              <div style="font-size: 9px; font-weight: 800; color: #065f46; text-transform: uppercase;">Metod Kuni</div>
              <div style="font-size: 12px; font-weight: 900; color: #047857;">${methodDayName.toUpperCase()}</div>
            </div>
          `
              : ""
          }
        </div>
      </div>

      <!-- Main Timetable Table -->
      <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 10px; border: 1.5px solid #0f172a; table-layout: fixed;">
        <thead>
          <tr style="background: #f1f5f9; border-bottom: 1.5px solid #0f172a;">
            <th style="width: 90px; padding: 6px 4px; border-right: 1.5px solid #0f172a; font-weight: 900; font-size: 10px; color: #0f172a; text-transform: uppercase;">
              Dars / Vaqt
            </th>
            ${DAYS.map((d) => {
              const isMethod = teacher.methodDayOfWeek === d.id;
              return `
                <th style="padding: 6px 4px; border-right: 1px solid #cbd5e1; font-weight: 900; font-size: 11px; color: ${
                  isMethod ? "#065f46" : "#0f172a"
                }; background: ${isMethod ? "#d1fae5" : "#f1f5f9"};">
                  ${d.name}
                  ${
                    isMethod
                      ? `<div style="font-size: 8px; font-weight: 800; color: #047857; text-transform: uppercase;">(Metod kuni)</div>`
                      : `<div style="font-size: 8.5px; font-weight: 600; color: #64748b;">${dailyTotals.get(d.id) || 0} soat dars</div>`
                  }
                </th>
              `;
            }).join("")}
          </tr>
        </thead>
        <tbody>
  `;

  // Render 1-Smena section
  if (hasShift1 || !hasShift2) {
    html += `
      <tr style="background: #fef3c7; border-top: 1.5px solid #0f172a; border-bottom: 1px solid #f59e0b;">
        <td colspan="7" style="padding: 4px 10px; text-align: left; font-size: 9.5px; font-weight: 900; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
          ☀️ 1-SMENA — ERTALABKI DARSLAR (ABETGACHA: 08:00 — 13:00) &bull; Haftalik: ${shift1Lessons.length} soat
        </td>
      </tr>
    `;

    // Only render periods up to max period present (or at least periods 1..5)
    const p1Indices = [1, 2, 3, 4, 5, 6];
    p1Indices.forEach((pt) => {
      const pInfo = SHIFT_1_PERIODS[pt - 1];
      html += `
        <tr style="border-bottom: 1px solid #e2e8f0; height: 38px;">
          <td style="padding: 4px; background: #f8fafc; border-right: 1.5px solid #0f172a; font-weight: 800; font-size: 9.5px; color: #1e293b;">
            <div style="font-weight: 900; font-size: 10px;">${pInfo.period}-dars</div>
            <div style="font-size: 8.5px; color: #64748b; font-family: monospace;">${pInfo.time}</div>
          </td>
          ${DAYS.map((d) => {
            const isMethod = teacher.methodDayOfWeek === d.id;
            const key = `${d.id}_1_${pt}`;
            const lessonsInCell = cellMap.get(key) || [];

            if (lessonsInCell.length === 0) {
              if (isMethod) {
                return `<td style="border-right: 1px solid #e2e8f0; background: #ecfdf5; color: #059669; font-size: 8.5px; font-weight: 700;">Metod kuni</td>`;
              }
              return `<td style="border-right: 1px solid #e2e8f0; color: #cbd5e1; font-size: 11px;">—</td>`;
            }

            return `
              <td style="padding: 3px 4px; border-right: 1px solid #e2e8f0; background: #ffffff; vertical-align: middle;">
                ${lessonsInCell
                  .map((l) => {
                    const subj = subjectMap.get(l.subjectId)?.name || "Fan";
                    const cls = classMap.get(l.classId)?.name || "Sinf";
                    const room = l.roomId ? roomMap.get(l.roomId)?.name : null;
                    const group = l.groupType === "GROUP_1" ? "1-gr" : l.groupType === "GROUP_2" ? "2-gr" : null;

                    return `
                    <div style="background: #f8fafc; border: 1.5px solid #3b82f6; border-radius: 6px; padding: 2px 4px; margin: 1px 0; text-align: center;">
                      <div style="display: flex; justify-content: center; align-items: center; gap: 4px;">
                        <span style="font-weight: 900; font-size: 10.5px; color: #1e3a8a;">${cls}</span>
                        ${group ? `<span style="font-size: 8px; font-weight: 800; background: #dbeafe; color: #1d4ed8; padding: 0 3px; border-radius: 3px;">${group}</span>` : ""}
                        ${room ? `<span style="font-size: 8px; font-weight: 700; color: #64748b;">[${room}]</span>` : ""}
                      </div>
                      <div style="font-size: 9px; font-weight: 700; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; margin-top: 1px;">
                        ${subj}
                      </div>
                    </div>
                  `;
                  })
                  .join("")}
              </td>
            `;
          }).join("")}
        </tr>
      `;
    });
  }

  // Divider between shifts if both exist
  if (hasShift1 && hasShift2) {
    html += `
      <tr style="background: #f1f5f9; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a;">
        <td colspan="7" style="padding: 2px 8px; text-align: center; font-size: 8.5px; font-weight: 700; color: #64748b;">
          🥪 13:00 — 13:15 &bull; Tushlik va Smenalar almashinuvi tanaffusi
        </td>
      </tr>
    `;
  }

  // Render 2-Smena section
  if (hasShift2 || !hasShift1) {
    html += `
      <tr style="background: #e0e7ff; border-top: 1.5px solid #0f172a; border-bottom: 1px solid #6366f1;">
        <td colspan="7" style="padding: 4px 10px; text-align: left; font-size: 9.5px; font-weight: 900; color: #3730a3; text-transform: uppercase; letter-spacing: 0.5px;">
          🌤️ 2-SMENA — TUSHDAN KEYINGI DARSLAR (ABETDAN KEYIN: 13:00 — 18:00) &bull; Haftalik: ${shift2Lessons.length} soat
        </td>
      </tr>
    `;

    const p2Indices = [1, 2, 3, 4, 5, 6];
    p2Indices.forEach((pt) => {
      const pInfo = SHIFT_2_PERIODS[pt - 1];
      html += `
        <tr style="border-bottom: 1px solid #e2e8f0; height: 38px;">
          <td style="padding: 4px; background: #f8fafc; border-right: 1.5px solid #0f172a; font-weight: 800; font-size: 9.5px; color: #1e293b;">
            <div style="font-weight: 900; font-size: 10px;">${pInfo.period}-dars</div>
            <div style="font-size: 8.5px; color: #64748b; font-family: monospace;">${pInfo.time}</div>
          </td>
          ${DAYS.map((d) => {
            const isMethod = teacher.methodDayOfWeek === d.id;
            const key = `${d.id}_2_${pt}`;
            const lessonsInCell = cellMap.get(key) || [];

            if (lessonsInCell.length === 0) {
              if (isMethod) {
                return `<td style="border-right: 1px solid #e2e8f0; background: #ecfdf5; color: #059669; font-size: 8.5px; font-weight: 700;">Metod kuni</td>`;
              }
              return `<td style="border-right: 1px solid #e2e8f0; color: #cbd5e1; font-size: 11px;">—</td>`;
            }

            return `
              <td style="padding: 3px 4px; border-right: 1px solid #e2e8f0; background: #ffffff; vertical-align: middle;">
                ${lessonsInCell
                  .map((l) => {
                    const subj = subjectMap.get(l.subjectId)?.name || "Fan";
                    const cls = classMap.get(l.classId)?.name || "Sinf";
                    const room = l.roomId ? roomMap.get(l.roomId)?.name : null;
                    const group = l.groupType === "GROUP_1" ? "1-gr" : l.groupType === "GROUP_2" ? "2-gr" : null;

                    return `
                    <div style="background: #fdf4ff; border: 1.5px solid #a855f7; border-radius: 6px; padding: 2px 4px; margin: 1px 0; text-align: center;">
                      <div style="display: flex; justify-content: center; align-items: center; gap: 4px;">
                        <span style="font-weight: 900; font-size: 10.5px; color: #581c87;">${cls}</span>
                        ${group ? `<span style="font-size: 8px; font-weight: 800; background: #f3e8ff; color: #7e22ce; padding: 0 3px; border-radius: 3px;">${group}</span>` : ""}
                        ${room ? `<span style="font-size: 8px; font-weight: 700; color: #64748b;">[${room}]</span>` : ""}
                      </div>
                      <div style="font-size: 9px; font-weight: 700; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 140px; margin-top: 1px;">
                        ${subj}
                      </div>
                    </div>
                  `;
                  })
                  .join("")}
              </td>
            `;
          }).join("")}
        </tr>
      `;
    });
  }

  // Footer summary row
  html += `
        <tr style="background: #f8fafc; border-top: 1.5px solid #0f172a; font-weight: 900; font-size: 10px;">
          <td style="padding: 5px; border-right: 1.5px solid #0f172a; text-transform: uppercase; color: #0f172a;">
            Kunlik Soat
          </td>
          ${DAYS.map((d) => {
            const count = dailyTotals.get(d.id) || 0;
            return `
              <td style="padding: 5px; border-right: 1px solid #cbd5e1; font-weight: 900; color: ${count > 0 ? "#4f46e5" : "#94a3b8"};">
                ${count > 0 ? `${count} soat` : "0"}
              </td>
            `;
          }).join("")}
        </tr>
      </tbody>
    </table>

    <!-- Official Signatures Footer -->
    <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 18px; padding-top: 12px; border-top: 1.5px dashed #94a3b8; font-size: 10px; color: #334155;">
      <div>
        <div style="font-weight: 800; color: #0f172a;">Tasdiqlayman:</div>
        <div style="margin-top: 3px;">Maktab direktori: _____________________ (M. Ramazonov)</div>
      </div>

      <div style="text-align: center;">
        <div style="font-weight: 800; color: #0f172a;">Kelishildi:</div>
        <div style="margin-top: 3px;">O'quv ishlari bo'yicha direktor o'rinbosari: _____________________</div>
      </div>

      <div style="text-align: right;">
        <div style="font-weight: 800; color: #0f172a;">Dars jadvali bilan tanishdim:</div>
        <div style="margin-top: 3px;">O'qituvchi: _____________________ (${teacher.fullName})</div>
      </div>
    </div>
  </div>
  `;

  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2, // High resolution (300 DPI)
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth(); // 297 mm
    const pageHeight = pdf.internal.pageSize.getHeight(); // 210 mm

    const margin = 8; // 8mm margin
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;

    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight <= availableHeight) {
      // Perfectly fits on 1 landscape page
      const yOffset = margin + (availableHeight - imgHeight) / 2;
      pdf.addImage(imgData, "PNG", margin, yOffset, imgWidth, imgHeight);
    } else {
      // Slightly scale down to fit on 1 page if only slightly larger
      const scaleFactor = availableHeight / imgHeight;
      if (scaleFactor >= 0.8) {
        const scaledWidth = imgWidth * scaleFactor;
        const xOffset = margin + (availableWidth - scaledWidth) / 2;
        pdf.addImage(imgData, "PNG", xOffset, margin, scaledWidth, availableHeight);
      } else {
        // Multi-page
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= availableHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight);
          heightLeft -= availableHeight;
        }
      }
    }

    const cleanName = (teacher.fullName || "Oqituvchi")
      .replace(/[^a-zA-Z0-9\u0400-\u04FF_]/g, "_")
      .replace(/_+/g, "_");

    pdf.save(`${cleanName}_Dars_Jadvali.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}
