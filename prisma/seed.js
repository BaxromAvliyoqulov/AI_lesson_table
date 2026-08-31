const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seed boshlandi...");

  // Super Admin
  const superAdminHash = await bcrypt.hash("admin123", 10);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@jadvalai.uz" },
    update: {
      passwordHash: superAdminHash,
      isActive: true,
    },
    create: {
      email: "superadmin@jadvalai.uz",
      fullName: "Super Administrator",
      role: "SUPER_ADMIN",
      passwordHash: superAdminHash,
      setupDone: true,
      isActive: true,
    },
  });
  console.log("✅ Super Admin:", superAdmin.email);

  // Demo Maktab
  const school = await prisma.school.upsert({
    where: { slug: "demo-maktab" },
    update: {
      name: "39-umumiy o'rta ta'lim maktabi",
      region: "Muzrabot tumani",
      directorFullName: "M. Ramazonov",
      academicVicePrincipalName: "N. Narziqulov",
      psychologistName: "F.I.Sh",
      subscriptionPlan: "pro",
      subscriptionStatus: "active",
    },
    create: {
      name: "39-umumiy o'rta ta'lim maktabi",
      slug: "demo-maktab",
      region: "Muzrabot tumani",
      directorFullName: "M. Ramazonov",
      academicVicePrincipalName: "N. Narziqulov",
      psychologistName: "F.I.Sh",
      subscriptionPlan: "pro",
      subscriptionStatus: "active",
    },
  });
  console.log("✅ Demo maktab:", school.name);

  // Maktab Admin
  const adminHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@demo-maktab.uz" },
    update: {
      passwordHash: adminHash,
      schoolId: school.id,
      isActive: true,
    },
    create: {
      email: "admin@demo-maktab.uz",
      fullName: "Maktab Administratori",
      role: "SCHOOL_ADMIN",
      passwordHash: adminHash,
      schoolId: school.id,
      setupDone: true,
      isActive: true,
    },
  });
  console.log("✅ Maktab Admin:", admin.email);

  console.log("\n🎉 Seed muvaffaqiyatli tugadi!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("👑 Super Admin:");
  console.log("   Email   : superadmin@jadvalai.uz");
  console.log("   Parol   : admin123");
  console.log("   URL     : http://localhost:3000/super-admin/login");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🏫 Maktab Admin:");
  console.log("   Email   : admin@demo-maktab.uz");
  console.log("   Parol   : admin123");
  console.log("   URL     : http://localhost:3000/login");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => {
    console.error("❌ Seed xatosi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
