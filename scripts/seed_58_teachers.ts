import { prisma } from "../src/lib/prisma";

const rawTeachers = [
  "AMIROVA JAMILA BOTIRBEKOVNA",
  "AVLIYOQULOV BAXROM MAXMARAXIM O'G'LI",
  "BOBOYEV ABDUMALIK MAXAMADINOVICH",
  "BOLTAYEVA MAVJUDA TO'RAYEVNA",
  "BOYQOBILOV ASATILLO OROMOVICH",
  "CHORIYEVA GULDONA DAVLATOVNA",
  "DJO'RAYEVA SHAXLO DAVRONOVNA",
  "EGAMOV NAZIRBEK NURULLAYEVICH",
  "EGAMOV NODIRBEK NURULLA O'G'LI",
  "EGAMSHUKUROV XOLMUXAMMAD XXX",
  "ESHBAYEVA AZIZA TOJIYEVNA",
  "ESHQURBONOV BOZOR XUDOYOROVICH",
  "G'ABBOROVA SHAHODAT SHAMSIDDINOVNA",
  "GUL'MURATOV SHUXRAT XXX",
  "HABIYEVA MAVLUDA ISMAILOVNA",
  "ISKANDAROVA SEVARA BAXTIYOR QIZI",
  "ISLAMOV SAYFULLA BERDIQULOVICH",
  "ISMOILOVA UMIDA BURANOVNA",
  "JO'RAYEVA IQBOL PARDABOY QIZI",
  "JUMAYEVA GULSARA JO'RAYEVNA",
  "KARIMOVA LOBAR MUROTOVNA",
  "KUYUKOVA SAYYORA SATTOROVNA",
  "MAMAYUSUPOVA DILFUZA RUSTAMOVNA",
  "MUHAMMADIYEVA ZEBINISO ASADULLAYEVNA",
  "NABIYEV SIROJIDDIN KULFIDDINOVICH",
  "NABIYEVA AMINA MUSURMANQULOVNA",
  "NARZIQULOV NODIRJON NARZULLAYEVICH",
  "NORAKOV FARXOD JO'RAMUHAMMADOVICH",
  "O'RAZOVA DILOROM ABDUVAITOVNA",
  "OHINAYEVA SAFARMOX MIRZAMIDDINOVNA",
  "ORTIQOV MUZAFAR CHORIYEVICH",
  "QURBONALIYEVA NIGORA ABDUJALILOVNA",
  "QURBONNAZAROVA SAYYORA YULDOSHEVNA",
  "RAHIMOV QAHRAMON QUDRATULLAYEVICH",
  "RAIMOV ALIYOR NORMAMATOVICH",
  "RAMAZONOV MUZAFFAR XOLMIRZAYEVICH",
  "ABDUSHUKUROV ELDORBEK",
  "RUSTAMOVA XAYRINISO NORMUXAMMADDOVNA",
  "SAFAROV OTABEK SHOHMOVICH",
  "SAGIRAYEV RUSTAM XAMROQULOVICH",
  "SALMONOVA RUSHANA BAXRIDDIN QIZI",
  "SAYQONOV ABDUMALIK ABDULLAYEVICH",
  "SURABOV AXMED AVLIYAQULOVICH",
  "SUXROBOV ALISHER AVLIYOQULOVICH",
  "TO'LAYEVA O'G'ILSHOD ASADULLAYEVNA",
  "TOSHBOYEV OYBEK RASHIDOVICH",
  "TOSHBOYEV QAHRAMON JUMANAZAROVICH",
  "TOSHBOYEVA ZULFIYA NURIDDINOVNA",
  "TURSUNOVA OYSHA TURDIYEVNA",
  "XAYITOVA MUXLISA RUSTAM QIZI",
  "XOLIYOROVA MATLUBA JO'RAYEVNA",
  "RO'ZIBOYEVA GULRUXSOR NURULLO QIZI",
  "NAZAROV ABDULLA",
  "SADULLAYEVA XURSHIDA",
  "XUDOYOROV SABRIDDIN BOZOR O'G'LI",
  "MAHMATQULOVA SABOHAT",
  "QOSIMOVA SABRINA",
  "OROMOVA SUBHIYA",
];

async function main() {
  console.log("🔄 O'qituvchilarni noldan tozalash va 58 nafarni alifbo tartibida kiritish boshlandi...");

  // Maktabni topish
  let school = await prisma.school.findFirst();
  if (!school) {
    school = await prisma.school.create({
      data: {
        name: "39-umumiy o'rta ta'lim maktabi",
        slug: "maktab-39",
        region: "Muzrabot tumani",
        directorFullName: "M. Ramazonov",
        academicVicePrincipalName: "N. Narziqulov",
        subscriptionPlan: "pro",
        subscriptionStatus: "active",
      },
    });
  }

  // Filial mavjudligini ta'minlash
  let mainBranch = await prisma.branch.findFirst({ where: { schoolId: school.id } });
  if (!mainBranch) {
    mainBranch = await prisma.branch.create({
      data: {
        schoolId: school.id,
        name: "Asosiy bino",
        isMain: true,
      },
    });
  }

  // 1. Bazadagi barcha eski o'qituvchilar va ularga bog'liq ma'lumotlarni 0 qilish
  console.log("🧹 Eski o'qituvchilar tozalanmoqda...");
  await prisma.lesson.deleteMany({ where: { schoolId: school.id } });
  await prisma.classSubject.deleteMany({ where: { schoolId: school.id } });
  await prisma.teacherAvailability.deleteMany({ where: { schoolId: school.id } });
  await prisma.teacherSubject.deleteMany({ where: { schoolId: school.id } });
  await prisma.teacherBranch.deleteMany({ where: { schoolId: school.id } });
  await prisma.teacher.deleteMany({ where: { schoolId: school.id } });
  console.log("✅ Barcha eski o'qituvchilar 0 qilindi.");

  // 2. Alifbo tartibida saralash (O'zbek alifbosi bo'yicha)
  const sortedNames = [...rawTeachers].sort((a, b) => a.localeCompare(b, "uz"));

  console.log(`\n📝 58 nafar o'qituvchi alifbo tartibida kiritilmoqda...`);

  for (let i = 0; i < sortedNames.length; i++) {
    const fullName = sortedNames[i];
    const displayNumber = i + 1;

    const teacher = await prisma.teacher.create({
      data: {
        id: `t_39_${displayNumber}`,
        schoolId: school.id,
        displayNumber: displayNumber,
        fullName: fullName,
        phone: "+998",
        weeklyHourCapacity: 20,
        maxConsecutiveHours: 4,
      },
    });

    // Filialga biriktirish
    await prisma.teacherBranch.create({
      data: {
        schoolId: school.id,
        teacherId: teacher.id,
        branchId: mainBranch.id,
      },
    });

    console.log(`${displayNumber}. ${fullName}`);
  }

  console.log(`\n🎉 Barcha 58 nafar o'qituvchi muvaffaqiyatli kiritildi!`);
}

main()
  .catch((e) => {
    console.error("Xatolik:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
