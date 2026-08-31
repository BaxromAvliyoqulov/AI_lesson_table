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
 * Sinflarni navbat bilan tartiblash (1-A, 1-B, 2-A ... 11-B)
 */
export function sortClassesByName<T extends { name: string; grade?: number }>(classes: T[]): T[] {
  return [...classes].sort((a, b) => {
    const numA = parseInt(a.name) || a.grade || 0;
    const numB = parseInt(b.name) || b.grade || 0;
    if (numA !== numB) return numA - numB;
    return a.name.localeCompare(b.name);
  });
}
