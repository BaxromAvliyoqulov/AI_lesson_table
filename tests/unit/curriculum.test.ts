import { describe, it, expect } from "vitest";
import {
  UZBEKISTAN_STANDARD_CURRICULUM,
  generateStandardCurriculumForClass,
  isSubjectSuitableForGrade,
  getAvailableSubjectsForGrade,
} from "@/lib/curriculum-templates";
import { initialSubjects, initialTeachers } from "@/lib/mock-data";
import { Subject } from "@/types";

describe("Uzbekistan Standard Curriculum & Subject Suitability Engine", () => {
  it("should have curriculum templates defined for all grades 1 through 11", () => {
    for (let grade = 1; grade <= 11; grade++) {
      const items = UZBEKISTAN_STANDARD_CURRICULUM[grade];
      expect(items).toBeDefined();
      expect(items.length).toBeGreaterThan(5);

      const totalHours = items.reduce((sum, item) => sum + item.defaultHours, 0);
      if (grade <= 4) {
        expect(totalHours).toBeGreaterThanOrEqual(20);
        expect(totalHours).toBeLessThanOrEqual(28);
      } else {
        expect(totalHours).toBeGreaterThanOrEqual(28);
        expect(totalHours).toBeLessThanOrEqual(36);
      }
    }
  });

  it("should generate standard curriculum with assigned teachers for a class", () => {
    const classId = "c_1a";
    const grade = 1;
    const homeroomTeacherId = "t_1";

    const generated = generateStandardCurriculumForClass(
      grade,
      classId,
      homeroomTeacherId,
      initialSubjects,
      initialTeachers
    );

    expect(generated.length).toBeGreaterThan(0);
    const totalWeeklyHours = generated.reduce((sum, item) => sum + item.weeklyHours, 0);
    expect(totalWeeklyHours).toBeGreaterThanOrEqual(20);

    // Every item must have valid classId, subjectId, teacherId, and weeklyHours
    for (const item of generated) {
      expect(item.classId).toBe(classId);
      expect(item.subjectId).toBeTruthy();
      expect(item.teacherId).toBeTruthy();
      expect(item.weeklyHours).toBeGreaterThan(0);
    }
  });

  it("should prevent high-school-only subjects (Fizika, Kimyo, Algebra) in primary grades (1-4)", () => {
    const fizika: Subject = {
      id: "sub_fizika",
      schoolId: "school_39",
      name: "Fizika",
      colorTag: "#3B82F6",
      difficultyScore: 11,
      allowDoubleLesson: true,
    };

    const kimyo: Subject = {
      id: "sub_kimyo",
      schoolId: "school_39",
      name: "Kimyo",
      colorTag: "#10B981",
      difficultyScore: 12,
      allowDoubleLesson: true,
    };

    const onaTili: Subject = {
      id: "sub_ona",
      schoolId: "school_39",
      name: "Ona tili",
      colorTag: "#F59E0B",
      difficultyScore: 7,
      allowDoubleLesson: false,
    };

    // Grade 1..4 (Primary)
    expect(isSubjectSuitableForGrade(fizika, 1)).toBe(false);
    expect(isSubjectSuitableForGrade(kimyo, 3)).toBe(false);
    expect(isSubjectSuitableForGrade(onaTili, 1)).toBe(true);

    // Grade 5..11 (High School)
    expect(isSubjectSuitableForGrade(fizika, 7)).toBe(true);
    expect(isSubjectSuitableForGrade(kimyo, 8)).toBe(true);
    expect(isSubjectSuitableForGrade(onaTili, 5)).toBe(true);
  });

  it("should filter available subjects correctly for a given grade", () => {
    const primaryAvailable = getAvailableSubjectsForGrade(initialSubjects, 2);
    const highAvailable = getAvailableSubjectsForGrade(initialSubjects, 9);

    const primaryNames = primaryAvailable.map((s) => s.name.toLowerCase());
    expect(primaryNames).not.toContain("fizika");
    expect(primaryNames).not.toContain("kimyo");
    expect(primaryNames).not.toContain("chqbt");

    const highNames = highAvailable.map((s) => s.name.toLowerCase());
    expect(highNames.some((n) => n.includes("fizika"))).toBe(true);
  });
});
