import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// MMTV 133-sonli buyruq bo'yicha Tayanch o'quv rejadagi rasmiy dars soatlari (Dars jadvalida o'quvchi o'tiradigan haftalik soat):
// 1-sinf: 22 soat (21 fan + 1 Kelajak)
// 2-sinf: 25 soat (24 fan + 1 Kelajak)
// 3-sinf: 25 soat (24 fan + 1 Kelajak)
// 4-sinf: 25 soat (24 fan + 1 Kelajak)
// 5-sinf: 30 soat (29 fan + 1 Kelajak)
// 6-sinf: 31 soat (30 fan + 1 Kelajak)
// 7-sinf: 36 soat (35 fan + 1 Kelajak)
// 8-sinf: 34 soat (33 fan + 1 Kelajak)
// 9-sinf: 35 soat (34 fan + 1 Kelajak)
// 10-sinf: 32 soat (31 fan + 1 Kelajak)
// 11-sinf: 31-33 soat (O'zbek maktablarida 31 yoki 32 soat)
const OFFICIAL_MMTV_STANDARDS: Record<number, number> = {
  1: 22,
  2: 25,
  3: 25,
  4: 25,
  5: 30,
  6: 31,
  7: 36,
  8: 34,
  9: 35,
  10: 32,
  11: 31,
};

async function main() {
  const schoolId = 'cmthn422g0001uff8vhccbxmz';
  const classes = await prisma.class.findMany({
    where: { schoolId },
    include: { subjects: true },
    orderBy: { name: 'asc' },
  });

  const subjects = await prisma.subject.findMany();
  const subMap = new Map(subjects.map((s) => [s.id, s.name]));

  const results = [];

  for (const c of classes) {
    const grade = c.grade || parseInt(c.name.match(/^(\d+)/)?.[1] || '1', 10);
    const mmtvNorm = OFFICIAL_MMTV_STANDARDS[grade] || 30;

    const bySubject = new Map<string, any[]>();
    for (const s of c.subjects) {
      const arr = bySubject.get(s.subjectId) || [];
      arr.push(s);
      bySubject.set(s.subjectId, arr);
    }

    let tarifHours = 0;
    let timetableHours = 0;

    for (const [subId, list] of bySubject.entries()) {
      const hoursList = list.map((item) => item.weeklyHours);
      const sumH = hoursList.reduce((a, b) => a + b, 0);
      tarifHours += sumH;

      const isSplit = list.length > 1 && list.some((item) => item.groupType && item.groupType !== 'WHOLE');
      const slotH = isSplit ? Math.max(...hoursList) : sumH;
      timetableHours += slotH;
    }

    const diff = timetableHours - mmtvNorm;

    results.push({
      classObj: c,
      name: c.name,
      grade,
      shift: c.shift || 1,
      timetableHours,
      tarifHours,
      mmtvNorm,
      diff,
      bySubject,
    });
  }

  results.sort((a, b) => a.grade - b.grade || a.name.localeCompare(b.name));

  console.log(`\n========================================================================================`);
  console.log(`                  BARCHA 30 TA SINFNING MMTV 133-ME'YORIGA MOSLIGI                      `);
  console.log(`========================================================================================\n`);

  console.table(
    results.map((r) => ({
      Sinf: r.name,
      Smena: r.shift,
      'Jadval soati': `${r.timetableHours} soat`,
      'Tarifikatsiya soati': `${r.tarifHours} soat`,
      "MMTV Me'yori": `${r.mmtvNorm} soat`,
      Farq: r.diff === 0 ? '✅ 0 (To\'liq)' : r.diff > 0 ? `🔴 +${r.diff}s (Ortiqcha)` : `🟡 ${r.diff}s (Kam)`,
    }))
  );

  const kam = results.filter((r) => r.diff < 0);
  const kop = results.filter((r) => r.diff > 0);
  const teng = results.filter((r) => r.diff === 0);

  console.log(`\n----------------------------------------------------------------------------------------`);
  console.log(`✅ To'liq me'yorda (${teng.length} ta sinf): ${teng.map((r) => r.name).join(', ')}`);
  console.log(`🟡 Me'yordan KAM (${kam.length} ta sinf): ${kam.map((r) => `${r.name} (${r.timetableHours}/${r.mmtvNorm})`).join(', ')}`);
  console.log(`🔴 Me'yordan ORTIQCHA (${kop.length} ta sinf): ${kop.map((r) => `${r.name} (${r.timetableHours}/${r.mmtvNorm})`).join(', ')}`);
  console.log(`----------------------------------------------------------------------------------------\n`);

  if (kam.length > 0) {
    console.log(`\n=== 🟡 ME'YORDAN KAM BO'LGAN SINFLAR TAHLILI ===`);
    for (const r of kam) {
      console.log(`\nSinf: ${r.name} (${r.timetableHours}/${r.mmtvNorm} soat, ${r.diff} soat yetishmayapti)`);
      for (const [subId, list] of r.bySubject.entries()) {
        console.log(`  • ${subMap.get(subId)}: ${list.map((i) => i.weeklyHours).join('+')} soat`);
      }
    }
  }

  if (kop.length > 0) {
    console.log(`\n=== 🔴 ME'YORDAN ORTIQCHA BO'LGAN SINFLAR TAHLILI ===`);
    for (const r of kop) {
      console.log(`\nSinf: ${r.name} (${r.timetableHours}/${r.mmtvNorm} soat, +${r.diff} soat ortiqcha)`);
      for (const [subId, list] of r.bySubject.entries()) {
        console.log(`  • ${subMap.get(subId)}: ${list.map((i) => i.weeklyHours).join('+')} soat`);
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
