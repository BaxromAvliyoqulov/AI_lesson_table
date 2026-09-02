import { prisma } from "../src/lib/prisma";

async function main() {
  const school = await prisma.school.findFirst();
  const teachers = await prisma.teacher.findMany({
    orderBy: { displayNumber: "asc" },
  });
  console.log("=== BAZADAGI MAKTAB ID ===", school?.id, school?.name);
  console.log("=== JAMI O'QITUVCHILAR SONI: " + teachers.length + " ===");
  if (teachers.length > 0) {
    console.log("Birinchi o'qituvchi:", teachers[0].fullName, "schoolId:", teachers[0].schoolId);
  }
}

main().finally(() => prisma.$disconnect());
