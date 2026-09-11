import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const schoolId = "cmthn422g0001uff8vhccbxmz";

  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: {
      classes: {
        include: {
          subjects: true,
        },
      },
      teachers: true,
    },
  });

  if (!school) {
    console.log("School not found!");
    return;
  }

  const allLessons = await prisma.lesson.findMany({
    where: { schoolId },
  });

  console.log(`=== SCHOOL: ${school.name} (${school.classes.length} classes, ${allLessons.length} lessons) ===\n`);

  const dayNames = ["", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

  // Analyze each class
  for (const cls of school.classes.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
    const classLessons = allLessons.filter((l) => l.classId === cls.id);
    const curriculumTotal = (cls.subjects || []).reduce((sum, s) => sum + (s.weeklyHours || 0), 0);
    
    // Check daily distribution
    const dayMap = new Map<number, number[]>();
    for (let d = 1; d <= 6; d++) dayMap.set(d, []);
    
    for (const l of classLessons) {
      const periods = dayMap.get(l.dayOfWeek) || [];
      periods.push(l.periodNumber);
      dayMap.set(l.dayOfWeek, periods);
    }

    const dailyCounts: number[] = [];
    const gaps: string[] = [];

    for (let d = 1; d <= 6; d++) {
      const periods = (dayMap.get(d) || []).sort((a, b) => a - b);
      dailyCounts.push(periods.length);

      if (periods.length > 0) {
        const minP = periods[0];
        const maxP = periods[periods.length - 1];
        // Check if starts after period 1
        if (minP > 1) {
          gaps.push(`${dayNames[d]}: 1-darsdan boshlanmagan (birinchi dars: ${minP}-dars!)`);
        }
        // Check if internal gap
        for (let p = minP; p <= maxP; p++) {
          if (!periods.includes(p)) {
            gaps.push(`${dayNames[d]}: ${p}-dars tushib qolgan (oraliq darcha/okno)`);
          }
        }
      } else {
        // Only 1-4th grades might have 5 days, 5-11 grades have 6 days
        if (cls.grade >= 5) {
          gaps.push(`${dayNames[d]}: 0 ta dars (bo'sh kun)`);
        }
      }
    }

    const minDaily = Math.min(...dailyCounts.filter(c => c > 0));
    const maxDaily = Math.max(...dailyCounts);
    const totalScheduled = classLessons.length;

    const hasIssue = gaps.length > 0 || totalScheduled !== curriculumTotal || (maxDaily - minDaily >= 2);

    if (hasIssue) {
      console.log(`🚨 SINF: ${cls.name} (Grade ${cls.grade}) | Reja: ${curriculumTotal}s | Jadvalda: ${totalScheduled}s`);
      console.log(`   Kunlik taqsimot (Dush-Shanba): [${dailyCounts.join(", ")}] (Min: ${minDaily}, Max: ${maxDaily})`);
      if (gaps.length > 0) {
        console.log(`   Xatolar/Darchalar:`);
        gaps.forEach(g => console.log(`     - ${g}`));
      }
    }
  }

  // Check teachers with gaps (oknos)
  console.log("\n=== O'QITUVCHILAR DARCHALARI (OKNOLARI) ===");
  let totalTeacherGaps = 0;
  for (const teacher of school.teachers) {
    const tLessons = allLessons.filter(l => l.teacherId === teacher.id);
    if (tLessons.length === 0) continue;

    const dayLessons = new Map<number, number[]>();
    for (const l of tLessons) {
      const arr = dayLessons.get(l.dayOfWeek) || [];
      arr.push(l.periodNumber);
      dayLessons.set(l.dayOfWeek, arr);
    }

    const tGaps: string[] = [];
    for (const [day, periods] of dayLessons.entries()) {
      const sorted = Array.from(new Set(periods)).sort((a, b) => a - b);
      if (sorted.length > 1) {
        for (let p = sorted[0]; p <= sorted[sorted.length - 1]; p++) {
          if (!sorted.includes(p)) {
            tGaps.push(`${dayNames[day]} ${p}-dars`);
          }
        }
      }
    }

    if (tGaps.length > 0) {
      totalTeacherGaps += tGaps.length;
      console.log(`⚠️ ${teacher.fullName}: ${tGaps.length} ta darcha -> ${tGaps.join(", ")}`);
    }
  }
  console.log(`\nJami o'qituvchilar darchalari: ${totalTeacherGaps} ta`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
