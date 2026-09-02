import { prisma } from "../src/lib/prisma";

async function main() {
  const teachers = await prisma.teacher.findMany({
    orderBy: { displayNumber: "asc" },
  });
  console.log("=== JAMI O'QITUVCHILAR SONI: " + teachers.length + " ===");
  teachers.forEach((t) => {
    console.log(`${t.displayNumber}. ${t.fullName}`);
  });
}

main().finally(() => prisma.$disconnect());
