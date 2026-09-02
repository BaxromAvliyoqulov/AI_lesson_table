/**
 * O'zbekiston Respublikasi Maktabgacha va maktab ta'limi vazirligi (MMTV)
 * Nizomi va SanPiN sanitariya qoidalari bo'yicha Rasmiy Metodik Kunlar Standarti
 */

export interface MethodDayDefinition {
  dayOfWeek: number; // 1: Dushanba, 2: Seshanba, 3: Chorshanba, 4: Payshanba, 5: Juma, 6: Shanba
  dayName: string;
  category: string;
  description: string;
  subjects: string[]; // Fan kalit so'zlari yoki identifikatorlari
}

export const UZBEKISTAN_OFFICIAL_METHOD_DAYS: MethodDayDefinition[] = [
  {
    dayOfWeek: 1,
    dayName: "Dushanba",
    category: "Boshlang'ich ta'lim",
    description: "1-4 sinf boshlang'ich ta'lim o'qituvchilari metod kuni (Kelajak soati barcha sinflarda 1-soatda o'tiladi)",
    subjects: ["boshlang'ich", "o'qish", "savodxonlik", "boshlangich"],
  },
  {
    dayOfWeek: 2,
    dayName: "Seshanba",
    category: "Filologiya fanlari (Ona tili va adabiyot)",
    description: "Ona tili, Adabiyot, Rus tili, Qoraqalpoq tili va milliy tillar o'qituvchilari metod kuni",
    subjects: ["ona tili", "adabiyot", "rus tili", "rus", "ona", "adab", "qoraqalpoq"],
  },
  {
    dayOfWeek: 3,
    dayName: "Chorshanba",
    category: "Aniq fanlar",
    description: "Matematika, Algebra, Geometriya, Informatika va IT o'qituvchilari metod kuni",
    subjects: ["matematika", "algebra", "geometriya", "informatika", "mat", "alg", "geom", "inf", "it"],
  },
  {
    dayOfWeek: 4,
    dayName: "Payshanba",
    category: "Ijtimoiy-gumanitar fanlar",
    description: "Tarix, O'zbekiston tarixi, Jahon tarixi, Huquq, Tarbiya, Geografiya, Iqtisodiyot o'qituvchilari metod kuni",
    subjects: [
      "tarix",
      "o'zbekiston tarixi",
      "jahon tarixi",
      "o'zb. tarixi",
      "huquq",
      "davlat va huquq",
      "tarbiya",
      "geografiya",
      "iqtisod",
      "iqtisodiyot",
      "tar",
      "geo",
    ],
  },
  {
    dayOfWeek: 5,
    dayName: "Juma",
    category: "Xorijiy tillar",
    description: "Ingliz tili, Nemis tili, Fransuz tili va boshqa chet tillari o'qituvchilari metod kuni",
    subjects: ["ingliz tili", "ingliz", "nemis tili", "nemis", "fransuz tili", "fransuz", "chet tili", "english", "ing"],
  },
  {
    dayOfWeek: 6,
    dayName: "Shanba",
    category: "Tabiiy, amaliy va jismoniy tarbiya fanlari",
    description: "Fizika, Kimyo, Biologiya, Tabiiy fan, Texnologiya, Musiqa, Tasviriy san'at, Chizmachilik, Jismoniy tarbiya, CHQBT, Astronomiya",
    subjects: [
      "fizika",
      "kimyo",
      "biologiya",
      "tabiiy fan",
      "tabiiy",
      "science",
      "texnologiya",
      "mehnat",
      "musiqa",
      "tasviriy san'at",
      "tasviriy",
      "rasm",
      "chizmachilik",
      "chiz",
      "jismoniy tarbiya",
      "jismoniy",
      "sport",
      "chqbt",
      "harbiy",
      "astronomiya",
      "fiz",
      "kim",
      "bio",
      "texno",
      "jism",
      "sanat",
    ],
  },
];

/**
 * Fan nomi yoki ID si bo'yicha O'zbekiston qonunchiligidagi rasmiy metod kunini aniqlash
 */
export function getOfficialMethodDayForSubject(subjectNameOrId: string): number | null {
  if (!subjectNameOrId) return null;
  const lower = subjectNameOrId.toLowerCase().trim();

  // Kelajak soati / Sinf soati istisno (Dushanba 1-soat majburiy)
  if (lower.includes("sinf soati") || lower.includes("kelajak") || lower === "sub_sinf_soati") {
    return null;
  }

  // 1. Filologiya (Seshanba = 2)
  if (
    lower.includes("ona tili") ||
    lower.includes("adabiyot") ||
    lower.includes("rus tili") ||
    lower.includes("rus") ||
    lower === "sub_ona" ||
    lower === "sub_adab" ||
    lower === "sub_rus" ||
    lower === "sub_oqish"
  ) {
    return 2;
  }

  // 2. Aniq fanlar (Chorshanba = 3)
  if (
    lower.includes("matematika") ||
    lower.includes("algebra") ||
    lower.includes("geometriya") ||
    lower.includes("informatika") ||
    lower === "sub_mat" ||
    lower === "sub_alg" ||
    lower === "sub_geom" ||
    lower === "sub_inf"
  ) {
    return 3;
  }

  // 3. Ijtimoiy fanlar (Payshanba = 4)
  if (
    lower.includes("tarix") ||
    lower.includes("huquq") ||
    lower.includes("tarbiya") ||
    lower.includes("geografiya") ||
    lower.includes("iqtisod") ||
    lower === "sub_tar" ||
    lower === "sub_ozb_tar" ||
    lower === "sub_jahon_tar" ||
    lower === "sub_geo" ||
    lower === "sub_huquq" ||
    lower === "sub_tarbiya" ||
    lower === "sub_iqtisod"
  ) {
    return 4;
  }

  // 4. Xorijiy tillar (Juma = 5)
  if (
    lower.includes("ingliz") ||
    lower.includes("nemis") ||
    lower.includes("fransuz") ||
    lower.includes("chet tili") ||
    lower === "sub_ing" ||
    lower === "sub_nemis" ||
    lower === "sub_fransuz"
  ) {
    return 5;
  }

  // 5. Tabiiy va amaliy fanlar (Shanba = 6)
  if (
    lower.includes("fizika") ||
    lower.includes("kimyo") ||
    lower.includes("biologiya") ||
    lower.includes("tabiiy") ||
    lower.includes("texnologiya") ||
    lower.includes("musiqa") ||
    lower.includes("tasviriy") ||
    lower.includes("chizmachilik") ||
    lower.includes("jismoniy") ||
    lower.includes("chqbt") ||
    lower.includes("astronomiya") ||
    lower === "sub_fiz" ||
    lower === "sub_kim" ||
    lower === "sub_bio" ||
    lower === "sub_tabiiy" ||
    lower === "sub_texno" ||
    lower === "sub_musiqa" ||
    lower === "sub_sanat" ||
    lower === "sub_chiz" ||
    lower === "sub_jism" ||
    lower === "sub_chqbt" ||
    lower === "sub_astronomiya"
  ) {
    return 6;
  }

  return null;
}

export const WEEKDAY_NAME_MAP: Record<number, string> = {
  1: "Dushanba",
  2: "Seshanba",
  3: "Chorshanba",
  4: "Payshanba",
  5: "Juma",
  6: "Shanba",
  7: "Yakshanba",
};
