import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Uzbekiston telefon raqamini formatlash (+998 (90) 123-45-67)
 */
export function formatUzPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  let localDigits = digits;
  if (digits.startsWith("998")) {
    localDigits = digits.slice(3);
  }
  localDigits = localDigits.slice(0, 9);

  if (localDigits.length === 0) return "+998 ";
  if (localDigits.length <= 2) return `+998 (${localDigits}`;
  if (localDigits.length <= 5) return `+998 (${localDigits.slice(0, 2)}) ${localDigits.slice(2)}`;
  if (localDigits.length <= 7)
    return `+998 (${localDigits.slice(0, 2)}) ${localDigits.slice(2, 5)}-${localDigits.slice(5)}`;
  return `+998 (${localDigits.slice(0, 2)}) ${localDigits.slice(2, 5)}-${localDigits.slice(5, 7)}-${localDigits.slice(7, 9)}`;
}

/**
 * Ism-familiyani tozalash va birinchi harflarni katta qilish
 */
export function sanitizeFullName(val: string): string {
  return val
    .trim()
    .replace(/[^a-zA-Zа-яА-ЯёЁoʻOʻgʻGʻshShchCh\s'-]/g, "")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ""))
    .join(" ");
}

/**
 * SanPiN qiyinlik darajasiga qarab rang badge qaytarish
 */
export function getSanPiNBadge(score: number): {
  label: string;
  badgeClass: string;
  bgClass: string;
} {
  if (score >= 9) {
    return {
      label: "Yuqori yuklama",
      badgeClass: "bg-rose-500/15 text-rose-600 border-rose-500/30",
      bgClass: "bg-rose-500",
    };
  }
  if (score >= 5) {
    return {
      label: "O'rta yuklama",
      badgeClass: "bg-amber-500/15 text-amber-600 border-amber-500/30",
      bgClass: "bg-amber-500",
    };
  }
  return {
    label: "Yengil yuklama",
    badgeClass: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    bgClass: "bg-emerald-500",
  };
}

/**
 * O'zbekiston maktablari uchun sinf harflari tartibi (Lotin va Kirill alifbosini birlashtirgan)
 */
const SECTION_LETTER_RANKS: Record<string, number> = {
  // A
  a: 1,
  а: 1,
  // B
  b: 2,
  б: 2,
  // C / S
  c: 3,
  с: 3,
  // V / W
  v: 4,
  в: 4,
  w: 4,
  // G
  g: 5,
  г: 5,
  // D
  d: 6,
  д: 6,
  // E / Ye
  e: 7,
  е: 7,
  // Yo
  yo: 8,
  ё: 8,
  // J / Zh
  j: 9,
  ж: 9,
  // Z
  z: 10,
  з: 10,
  // I
  i: 11,
  и: 11,
  // Y / J
  y: 12,
  й: 12,
  // K
  k: 13,
  к: 13,
  // L
  l: 14,
  л: 14,
  // M
  m: 15,
  м: 15,
  // N
  n: 16,
  н: 16,
  // O
  o: 17,
  о: 17,
  // P
  p: 18,
  п: 18,
  // R
  r: 19,
  р: 19,
  // S
  s: 20,
  // T
  t: 21,
  т: 21,
  // U
  u: 22,
  у: 22,
  // F
  f: 23,
  ф: 23,
  // X / Kh
  x: 24,
  х: 24,
  // Ts
  ts: 25,
  ц: 25,
  // Ch
  ch: 26,
  ч: 26,
  // Sh
  sh: 27,
  ш: 27,
  // Q
  q: 28,
  қ: 28,
  // G'
  "g'": 29,
  "gʻ": 29,
  ғ: 29,
  // H
  h: 30,
  ҳ: 30,
};

function getClassSortKey(
  name: string,
  grade?: number
): { gradeNum: number; sectionRank: number; rawSection: string } {
  const cleanName = (name || "").trim();
  const match = cleanName.match(/^(\d+)\s*[-_/\s.]*\s*(.*)$/);

  let gradeNum = grade || 0;
  let rawSection = "";

  if (match) {
    gradeNum = parseInt(match[1], 10) || gradeNum;
    rawSection = (match[2] || "").trim().toLowerCase();
  } else {
    rawSection = cleanName.toLowerCase();
  }

  // Section letter rank
  let sectionRank = 999;
  if (rawSection) {
    if (SECTION_LETTER_RANKS[rawSection]) {
      sectionRank = SECTION_LETTER_RANKS[rawSection];
    } else {
      const firstChar = rawSection.charAt(0);
      if (SECTION_LETTER_RANKS[firstChar]) {
        sectionRank = SECTION_LETTER_RANKS[firstChar];
      }
    }
  }

  return { gradeNum, sectionRank, rawSection };
}

/**
 * Sinflarni navbat bilan to'g'ri tartiblash (1-A, 1-B, 1-D ... 8-A, 8-B, 8-D ... 11-B)
 */
export function sortClassesByName<T extends { name: string; grade?: number }>(classes: T[]): T[] {
  return [...classes].sort((a, b) => {
    const keyA = getClassSortKey(a.name, a.grade);
    const keyB = getClassSortKey(b.name, b.grade);

    // 1. Sinf raqami bo'yicha (1, 2, ... 8, 9, 10, 11)
    if (keyA.gradeNum !== keyB.gradeNum) {
      return keyA.gradeNum - keyB.gradeNum;
    }

    // 2. Harf darajasi bo'yicha (A < B < V < G < D < E ...)
    if (keyA.sectionRank !== keyB.sectionRank) {
      return keyA.sectionRank - keyB.sectionRank;
    }

    // 3. String fallback
    return keyA.rawSection.localeCompare(keyB.rawSection);
  });
}

/**
 * O'qituvchilarni butun maktab bo'yicha qat'iy va yagona tartiblash va raqamlash:
 * 1. Avval sinf rahbarlari: 1-A, 1-B, 1-D, 2-A, 2-B, 2-D ... 11-sinfgacha ketma-ketlikda (№1, №2, №3...)
 * 2. Keyin qolgan fan o'qituvchilari: Alifbo tartibida (A-Z)
 * Bu raqamlar butun maktab uchun yagona bo'lib, filtrlar yoki bo'limlar almashganda aslo o'zgarmaydi!
 */
export function getCanonicalOrderedTeachers<
  T extends { id: string; fullName: string },
  C extends { id: string; name: string; grade?: number; homeroomTeacherId?: string | null; subjects?: { subjectId: string; teacherId: string }[] }
>(
  classes: C[],
  teachers: T[],
  isKelajakOrSinfSoatiFn?: (subjectId: string, subjectName?: string) => boolean
): { orderedTeachers: T[]; teacherNumberMap: Map<string, number> } {
  const teacherMap = new Map(teachers.map((t) => [t.id, t]));
  const sortedClasses = sortClassesByName(classes);

  const orderedTeachers: T[] = [];
  const seenIds = new Set<string>();

  // 1-bosqich: Sinf rahbarlari (1-A, 1-B, 1-D ... ketma-ketligida)
  for (const cls of sortedClasses) {
    let homeroomTid = cls.homeroomTeacherId;
    if (!homeroomTid && cls.subjects && isKelajakOrSinfSoatiFn) {
      const ss = cls.subjects.find((s) => isKelajakOrSinfSoatiFn(s.subjectId));
      if (ss?.teacherId) homeroomTid = ss.teacherId;
    }

    if (homeroomTid && !seenIds.has(homeroomTid)) {
      const t = teacherMap.get(homeroomTid);
      if (t) {
        orderedTeachers.push(t);
        seenIds.add(t.id);
      }
    }
  }

  // 2-bosqich: Qolgan o'qituvchilar (Alifbo tartibida)
  const remainingTeachers = teachers
    .filter((t) => !seenIds.has(t.id))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "uz"));

  for (const t of remainingTeachers) {
    orderedTeachers.push(t);
    seenIds.add(t.id);
  }

  // 3-bosqich: Butun maktab uchun yagona va qat'iy raqamlar xaritasi (№1, №2, №3...)
  const teacherNumberMap = new Map<string, number>();
  orderedTeachers.forEach((t, index) => {
    teacherNumberMap.set(t.id, index + 1);
  });

  return { orderedTeachers, teacherNumberMap };
}

/**
 * Sinf 2-smenada (Abetdan keyin / Tushdan keyin) o'qiydimi yoki 1-smenadami (Abetgacha)
 */
export function isClassSecondShift(
  cls?: { shiftId?: string; name?: string; grade?: number } | null,
  shifts?: Array<{ id: string; name: string; order?: number }>
): boolean {
  if (!cls) return false;

  if (shifts && shifts.length > 0 && cls.shiftId) {
    const s = shifts.find((sh) => sh.id === cls.shiftId);
    if (s) {
      if (s.order === 2) return true;
      if (s.order === 1) return false;
      const sName = s.name.toLowerCase();
      if (
        sName.includes("2") ||
        sName.includes("tush") ||
        sName.includes("abetdan") ||
        sName.includes("ikkinchi") ||
        sName.includes("keyin")
      ) {
        return true;
      }
      if (
        sName.includes("1") ||
        sName.includes("ertalab") ||
        sName.includes("abetgacha") ||
        sName.includes("birinchi")
      ) {
        return false;
      }
    }
  }

  // 39-maktab qoidasi: D sinflari (filial) tushdan keyin (2-smena) o'qiydi
  if (cls.name) {
    const trimmed = cls.name.trim().toUpperCase();
    if (trimmed.endsWith("D")) return true;
  }

  if (cls.shiftId) {
    const sId = cls.shiftId.toLowerCase();
    return (
      sId === "s39_2" ||
      sId.includes("shift_2") ||
      sId.includes("shift2") ||
      sId.includes("smena_2") ||
      sId.includes("smena2") ||
      sId.includes("2") ||
      sId.includes("tush") ||
      sId.includes("ikkinchi") ||
      sId.includes("abetdan")
    );
  }

  return false;
}

/**
 * DB Branch ID Resolver: "b39_2", "b39_1", "filial", "asosiy" yoki CUID ni aniq DB Branch ID siga bog'lash
 */
export function resolveDbBranchId(
  branches: Array<{ id: string; name: string; isMain?: boolean }>,
  targetBranchIdOrName?: string
): string {
  if (!branches || branches.length === 0) return "";
  if (!targetBranchIdOrName) {
    return (branches.find((b) => b.isMain) || branches[0]).id;
  }

  // 1. Direct ID match
  const byId = branches.find((b) => b.id === targetBranchIdOrName);
  if (byId) return byId.id;

  const lower = targetBranchIdOrName.toLowerCase();
  const isBranchFilial =
    lower.includes("filial") ||
    lower.includes("branch_2") ||
    lower.includes("b39_2") ||
    lower.includes("b_2");

  if (isBranchFilial) {
    const filial = branches.find(
      (b) => !b.isMain || b.name.toLowerCase().includes("filial")
    );
    if (filial) return filial.id;
  } else {
    const main = branches.find(
      (b) => b.isMain || b.name.toLowerCase().includes("asosiy")
    );
    if (main) return main.id;
  }

  return branches[0].id;
}

/**
 * DB Shift ID Resolver: "s39_2", "s39_1", "2-smena", "1-smena" yoki CUID ni aniq DB Shift ID siga bog'lash
 */
export function resolveDbShiftId(
  shifts: Array<{ id: string; name: string; order?: number }>,
  targetShiftIdOrName?: string
): string {
  if (!shifts || shifts.length === 0) return "";
  if (!targetShiftIdOrName) {
    return (shifts.find((s) => s.order === 1) || shifts[0]).id;
  }

  // 1. Direct ID match
  const byId = shifts.find((s) => s.id === targetShiftIdOrName);
  if (byId) return byId.id;

  const lower = targetShiftIdOrName.toLowerCase();
  const isSecond =
    lower.includes("2") ||
    lower.includes("tush") ||
    lower.includes("keyin") ||
    lower.includes("s39_2") ||
    lower.includes("shift_2");

  if (isSecond) {
    const s2 = shifts.find(
      (s) =>
        s.order === 2 ||
        s.name.toLowerCase().includes("2") ||
        s.name.toLowerCase().includes("tush") ||
        s.name.toLowerCase().includes("keyin")
    );
    if (s2) return s2.id;
  } else {
    const s1 = shifts.find(
      (s) =>
        s.order === 1 ||
        s.name.toLowerCase().includes("1") ||
        s.name.toLowerCase().includes("ertalab") ||
        s.name.toLowerCase().includes("abetgacha")
    );
    if (s1) return s1.id;
  }

  return shifts[0].id;
}

/**
 * Kirill harflarini lotinga almashtirish xaritasi
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  А: "A",
  Б: "B",
  В: "V",
  Г: "G",
  Д: "D",
  Е: "E",
  Ж: "J",
  З: "Z",
  И: "I",
  К: "K",
  Л: "L",
  М: "M",
  Н: "N",
  О: "O",
  П: "P",
  Р: "R",
  С: "S",
  Т: "T",
  У: "U",
  Ф: "F",
  Х: "X",
  Ц: "S",
  Ч: "CH",
  Ш: "SH",
  Қ: "Q",
  Ғ: "G",
  Ҳ: "H",
};

/**
 * Sinf nomini qat'iy standart formatga keltiradi:
 * Masalan: "1a" -> "1-A", "1 A" -> "1-A", "1-a" -> "1-A", "5B" -> "5-B", "10b" -> "10-B"
 * Har doim KATTA HARF va CHIZIQCHA bilan.
 */
export function normalizeClassName(name: string): string {
  if (!name) return "";
  const clean = name.trim();

  // Grade (1..11) va Letter/suffix ajratish
  // Masalan: "1a", "1-A", "5B", "8-D", "10A", "11-b", "9 А"
  const match = clean.match(
    /^([1-9]|1[0-1])\s*[-_/\s.]*\s*([A-Za-zА-Яа-яЎўҚқҒғҲҳ]+.*)$/i
  );
  if (match) {
    const grade = match[1];
    let letterPart = match[2].trim().toUpperCase();

    // Harflarni lotinlashtirish
    letterPart = letterPart
      .split("")
      .map((char) => CYRILLIC_TO_LATIN[char] || char)
      .join("");

    return `${grade}-${letterPart}`;
  }

  return clean.toUpperCase();
}
