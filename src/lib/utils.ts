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
