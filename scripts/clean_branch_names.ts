import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany();
  console.log("Hozirgi barcha binolar:", branches.map((b) => ({ id: b.id, name: b.name })));

  // Nomida "Boshlang'ich" yoki "boshlangich" bo'lgan filial nomlarini tozalaymiz
  for (const b of branches) {
    if (/boshlang['`ʻ]?ich/i.test(b.name)) {
      const cleanName = b.name
        .replace(/\s*\(?boshlang['`ʻ]?ich\)?/gi, "")
        .replace(/\s+/g, " ")
        .trim();

      console.log(`Yangilanmoqda: "${b.name}" -> "${cleanName}"`);
      await prisma.branch.update({
        where: { id: b.id },
        data: { name: cleanName },
      });
    }
  }

  const updated = await prisma.branch.findMany();
  console.log("Yangilangandan keyingi binolar:", updated.map((b) => ({ id: b.id, name: b.name })));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
