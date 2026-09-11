import { PrismaClient } from "@prisma/client";
import { CSPSolver } from "../src/lib/solver/csp-solver";
import { SchoolClass, Teacher, Subject, Room, Branch, Shift, Lesson } from "../src/types";

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
      subjects: true,
      rooms: true,
      branches: true,
      shifts: true,
    },
  });

  if (!school) {
    console.error("School not found!");
    return;
  }

  console.log(`=== RUNNING COMPLETE SOLVER FOR ${school.name} ===`);
  console.log(`Classes: ${school.classes.length}, Teachers: ${school.teachers.length}, Subjects: ${school.subjects.length}`);

  // Calculate total curriculum hours
  let totalCurriculumHours = 0;
  for (const c of school.classes) {
    for (const s of c.subjects || []) {
      totalCurriculumHours += Number(s.weeklyHours) || 0;
    }
  }
  console.log(`Total Curriculum Hours Required: ${totalCurriculumHours}`);

  // Format classes, teachers, subjects for solver
  const solverClasses: SchoolClass[] = school.classes.map(c => ({
    id: c.id,
    schoolId: c.schoolId,
    name: c.name,
    grade: c.grade,
    section: c.section,
    shiftId: c.shiftId || "s39_1",
    branchId: c.branchId || "b39_1",
    isPrimary: c.grade <= 4,
    studentCount: c.studentCount || 25,
    homeroomTeacherId: c.homeroomTeacherId || undefined,
    subjects: c.subjects.map(s => ({
      classId: c.id,
      subjectId: s.subjectId,
      teacherId: s.teacherId || "",
      weeklyHours: Number(s.weeklyHours) || 1,
      groupType: (s.groupType as any) || "WHOLE",
    })),
  }));

  const solverTeachers: Teacher[] = school.teachers.map(t => ({
    id: t.id,
    schoolId: t.schoolId,
    fullName: t.fullName,
    shortName: t.shortName || undefined,
    subjectIds: t.subjectIds || [],
    methodDay: t.methodDay || undefined,
    homeroomClassId: t.homeroomClassId || undefined,
    teachingStages: (t.teachingStages as any) || "HIGH",
    weeklyHourCapacity: t.weeklyHourCapacity || 20,
    shiftIds: t.shiftIds || undefined,
    travelPolicy: t.travelPolicy || undefined,
  }));

  const solverSubjects: Subject[] = school.subjects.map(s => ({
    id: s.id,
    schoolId: s.schoolId,
    name: s.name,
    shortName: s.shortName || undefined,
    code: s.code || undefined,
    colorTag: s.colorTag || "#3B82F6",
    difficultyScore: s.difficultyScore || 5,
    allowDoubleLesson: s.allowDoubleLesson || false,
    requiresLab: s.requiresLab || false,
    isActive: s.isActive,
  }));

  const solver = new CSPSolver({
    classes: solverClasses,
    teachers: solverTeachers,
    subjects: solverSubjects,
    rooms: school.rooms as any,
    branches: school.branches as any,
    shifts: school.shifts as any,
    daysCount: 6,
    maxPeriodsPerDay: 7,
  });

  const solution = solver.solve();
  console.log(`Solver result: success=${solution.success}, conflicts=${solution.stats.conflictsCount}`);
  console.log(`Placed: ${solution.stats.placedHours} / ${solution.stats.totalRequiredHours} (${solution.lessons.length} lessons)`);

  // Analyze the generated schedule
  const dayNames = ["", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
  let totalGaps = 0;

  for (const cls of solverClasses.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
    const classLessons = solution.lessons.filter(l => l.classId === cls.id);
    const dayMap = new Map<number, number[]>();
    for (let d = 1; d <= 6; d++) dayMap.set(d, []);
    for (const l of classLessons) {
      dayMap.get(l.dayOfWeek)!.push(l.periodNumber);
    }

    const dailyCounts: number[] = [];
    const classGaps: string[] = [];

    for (let d = 1; d <= 6; d++) {
      const periods = Array.from(new Set(dayMap.get(d) || [])).sort((a, b) => a - b);
      dailyCounts.push(periods.length);

      if (periods.length > 0) {
        if (periods[0] > 1) {
          classGaps.push(`${dayNames[d]}: 1-darsdan boshlanmagan (${periods[0]}-dars)`);
        }
        for (let p = periods[0]; p <= periods[periods.length - 1]; p++) {
          if (!periods.includes(p)) {
            classGaps.push(`${dayNames[d]}: ${p}-dars tushib qolgan`);
          }
        }
      }
    }

    totalGaps += classGaps.length;
    console.log(`Sinf: ${cls.name.padEnd(5)} | Taqsimot: [${dailyCounts.join(", ")}] | Darchalar: ${classGaps.length === 0 ? "0 (MUKAMMAL)" : classGaps.join("; ")}`);
  }

  console.log(`\nJami sinf darchalari: ${totalGaps} ta`);

  await prisma.$disconnect();
}

main().catch(console.error);
