import { prisma } from "../src/lib/prisma";

// Rasmdagi 58 ta o'qituvchi
const photoTeachers = [
  { num: 1, name: "AMIROVA JAMILA BOTIRBEKOVNA" },
  { num: 2, name: "AVLIYOQULOV BAXROM MAXMARAXIM O'G'LI" },
  { num: 3, name: "BOBOYEV ABDUMALIK MAXAMADINOVICH" },
  { num: 4, name: "BOLTAYEVA MAVJUDA TO'RAYEVNA" },
  { num: 5, name: "BOYQOBILOV ASATILLO OROMOVICH" },
  { num: 6, name: "CHORIYEVA GULDONA DAVLATOVNA" },
  { num: 7, name: "DJO'RAYEVA SHAXLO DAVRONOVNA" },
  { num: 8, name: "EGAMOV NAZIRBEK NURULLAYEVICH" },
  { num: 9, name: "EGAMOV NODIRBEK NURULLA O'G'LI" },
  { num: 10, name: "EGAMSHUKUROV XOLMUXAMMAD XXX" },
  { num: 11, name: "ESHBAYEVA AZIZA TOJIYEVNA" },
  { num: 12, name: "ESHQURBONOV BOZOR XUDOYOROVICH" },
  { num: 13, name: "G'ABBOROVA SHAHODAT SHAMSIDDINOVNA" },
  { num: 14, name: "GUL'MURATOV SHUXRAT XXX" },
  { num: 15, name: "HABIYEVA MAVLUDA ISMAILOVNA" },
  { num: 16, name: "ISKANDAROVA SEVARA BAXTIYOR QIZI" },
  { num: 17, name: "ISLAMOV SAYFULLA BERDIQULOVICH" },
  { num: 18, name: "ISMOILOVA UMIDA BURANOVNA" },
  { num: 19, name: "JO'RAYEVA IQBOL PARDABOY QIZI" },
  { num: 20, name: "JUMAYEVA GULSARA JO'RAYEVNA" },
  { num: 21, name: "KARIMOVA LOBAR MUROTOVNA" },
  { num: 22, name: "KUYUKOVA SAYYORA SATTOROVNA" },
  { num: 23, name: "MAMAYUSUPOVA DILFUZA RUSTAMOVNA" },
  { num: 24, name: "MUHAMMADIYEVA ZEBINISO ASADULLAYEVNA" },
  { num: 25, name: "NABIYEV SIROJIDDIN KULFIDDINOVICH" },
  { num: 26, name: "NABIYEVA AMINA MUSURMANQULOVNA" },
  { num: 27, name: "NARZIQULOV NODIRJON NARZULLAYEVICH" },
  { num: 28, name: "NORAKOV FARXOD JO'RAMUHAMMADOVICH" },
  { num: 29, name: "O'RAZOVA DILOROM ABDUVAITOVNA" },
  { num: 30, name: "OHINAYEVA SAFARMOX MIRZAMIDDINOVNA" },
  { num: 31, name: "ORTIQOV MUZAFAR CHORIYEVICH" },
  { num: 32, name: "QURBONALIYEVA NIGORA ABDUJALILOVNA" },
  { num: 33, name: "QURBONNAZAROVA SAYYORA YULDOSHEVNA" },
  { num: 34, name: "RAHIMOV QAHRAMON QUDRATULLAYEVICH" },
  { num: 35, name: "RAIMOV ALIYOR NORMAMATOVICH" },
  { num: 36, name: "RAMAZONOV MUZAFFAR XOLMIRZAYEVICH" },
  { num: 37, name: "Abdushukurov Eldorbek" },
  { num: 38, name: "RUSTAMOVA XAYRINISO NORMUXAMMADDOVNA" },
  { num: 39, name: "SAFAROV OTABEK SHOHMOVICH" },
  { num: 40, name: "SAGIRAYEV RUSTAM XAMROQULOVICH" },
  { num: 41, name: "SALMONOVA RUSHANA BAXRIDDIN QIZI" },
  { num: 42, name: "SAYQONOV ABDUMALIK ABDULLAYEVICH" },
  { num: 43, name: "SURABOV AXMED AVLIYAQULOVICH" },
  { num: 44, name: "SUXROBOV ALISHER AVLIYOQULOVICH" },
  { num: 45, name: "TO'LAYEVA O'G'ILSHOD ASADULLAYEVNA" },
  { num: 46, name: "TOSHBOYEV OYBEK RASHIDOVICH" },
  { num: 47, name: "TOSHBOYEV QAHRAMON JUMANAZAROVICH" },
  { num: 48, name: "TOSHBOYEVA ZULFIYA NURIDDINOVNA" },
  { num: 49, name: "TURSUNOVA OYSHA TURDIYEVNA" },
  { num: 50, name: "XAYITOVA MUXLISA RUSTAM QIZI" },
  { num: 51, name: "XOLIYOROVA MATLUBA JO'RAYEVNA" },
  { num: 52, name: "Ro'ziboyeva Gulruxsor Nurullo qizi" },
  { num: 53, name: "Nazarov Abdulla" },
  { num: 54, name: "Sadullayeva Xurshida" },
  { num: 55, name: "XUDOYOROV SABRIDDIN BOZOR O'G'LI" },
  { num: 56, name: "Mahmatqulova Sabohat" },
  { num: 57, name: "Qosimova Sabrina" },
  { num: 58, name: "Oromova Subhiya" }
];

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/['`’ʼ"«»\-_]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchNames(n1: string, n2: string) {
  const norm1 = normalize(n1);
  const norm2 = normalize(n2);
  if (norm1 === norm2) return true;

  // Familiya va Ism bir xilligini tekshirish
  const words1 = norm1.split(" ");
  const words2 = norm2.split(" ");

  if (words1.length >= 2 && words2.length >= 2) {
    const lastNameMatch = words1[0].slice(0, 4) === words2[0].slice(0, 4);
    const firstNameMatch = words1[1].slice(0, 4) === words2[1].slice(0, 4);
    if (lastNameMatch && firstNameMatch) return true;
  }
  return false;
}

async function compare() {
  const dbTeachers = await prisma.teacher.findMany({
    orderBy: { displayNumber: "asc" },
  });

  console.log("\n==============================");
  console.log("RASMDA JAMI:", photoTeachers.length, "ta");
  console.log("BAZADA JAMI:", dbTeachers.length, "ta");
  console.log("==============================\n");

  const missingInDb: typeof photoTeachers = [];
  const matchedInDb: Array<{ photo: (typeof photoTeachers)[0]; db: any }> = [];

  for (const pt of photoTeachers) {
    const found = dbTeachers.find((dt) => matchNames(pt.name, dt.fullName));
    if (found) {
      matchedInDb.push({ photo: pt, db: found });
    } else {
      missingInDb.push(pt);
    }
  }

  const extraInDb = dbTeachers.filter(
    (dt) => !photoTeachers.some((pt) => matchNames(pt.name, dt.fullName))
  );

  console.log("--- 1. BAZADA MAVJUD BO'LGAN (MOS KELGAN) O'QITUVCHILAR (" + matchedInDb.length + " ta) ---");
  matchedInDb.forEach((m) => {
    console.log(`№${m.photo.num} [Rasm]: ${m.photo.name} <==> [Baza]: ${m.db.displayNumber}. ${m.db.fullName}`);
  });

  console.log("\n--- 2. BAZAGA KIRITILISHI KERAK BO'LGAN O'QITUVCHILAR (" + missingInDb.length + " ta) ---");
  missingInDb.forEach((m) => {
    console.log(`№${m.num}. ${m.name}`);
  });

  console.log("\n--- 3. BAZADA BOR, LEKIN RASMDA YO'Q BO'LGAN O'QITUVCHILAR (" + extraInDb.length + " ta) ---");
  extraInDb.forEach((e) => {
    console.log(`${e.displayNumber}. ${e.fullName}`);
  });
}

compare().finally(() => prisma.$disconnect());
