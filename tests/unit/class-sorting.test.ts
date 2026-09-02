import { describe, it, expect } from "vitest";
import { sortClassesByName, formatUzPhone, sanitizeFullName, getSanPiNBadge } from "@/lib/utils";

describe("Utility Functions & Uzbek Class Sorting Engine", () => {
  it("should sort classes naturally by grade and section (8-A, 8-B, 8-D, 9-A, 9-D)", () => {
    const unsorted = [
      { name: "9-D", grade: 9 },
      { name: "8-B", grade: 8 },
      { name: "1-A", grade: 1 },
      { name: "11-B", grade: 11 },
      { name: "8-A", grade: 8 },
      { name: "8-D", grade: 8 },
      { name: "9-A", grade: 9 },
      { name: "1-B", grade: 1 },
      { name: "10-A", grade: 10 },
    ];

    const sorted = sortClassesByName(unsorted);
    const names = sorted.map((c) => c.name);

    expect(names).toEqual([
      "1-A",
      "1-B",
      "8-A",
      "8-B",
      "8-D",
      "9-A",
      "9-D",
      "10-A",
      "11-B",
    ]);
  });

  it("should format Uzbekistan phone numbers correctly", () => {
    expect(formatUzPhone("901234567")).toBe("+998 (90) 123-45-67");
    expect(formatUzPhone("998901234567")).toBe("+998 (90) 123-45-67");
    expect(formatUzPhone("935556677")).toBe("+998 (93) 555-66-77");
  });

  it("should sanitize full names with title capitalization", () => {
    expect(sanitizeFullName("baxrom avliyoqulov")).toBe("Baxrom Avliyoqulov");
    expect(sanitizeFullName("  dilnoza    xoliqova  ")).toBe("Dilnoza Xoliqova");
  });

  it("should return correct SanPiN badges based on difficulty score", () => {
    expect(getSanPiNBadge(10).label).toBe("Yuqori yuklama");
    expect(getSanPiNBadge(6).label).toBe("O'rta yuklama");
    expect(getSanPiNBadge(3).label).toBe("Yengil yuklama");
  });
});
