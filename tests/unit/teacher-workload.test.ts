import { describe, it, expect } from "vitest";
import { initialTeachers, initialClasses } from "@/lib/mock-data";

describe("Teacher Workload & Capacity Validation Engine", () => {
  it("should verify that each teacher has a non-negative weekly capacity and valid consecutive hours", () => {
    for (const teacher of initialTeachers) {
      expect(teacher.weeklyHourCapacity).toBeGreaterThan(0);
      expect(teacher.maxConsecutiveHours).toBeGreaterThanOrEqual(2);
      expect(teacher.maxConsecutiveHours).toBeLessThanOrEqual(6);

      if (teacher.methodDayOfWeek !== undefined) {
        expect(teacher.methodDayOfWeek).toBeGreaterThanOrEqual(1);
        expect(teacher.methodDayOfWeek).toBeLessThanOrEqual(6);
      }
    }
  });

  it("should calculate total assigned curriculum hours across all classes for each teacher", () => {
    const teacherHoursMap = new Map<string, number>();

    for (const cls of initialClasses) {
      for (const cs of cls.subjects) {
        const current = teacherHoursMap.get(cs.teacherId) || 0;
        teacherHoursMap.set(cs.teacherId, current + (cs.weeklyHours || 0));
      }
    }

    // Top teachers should have realistic hours
    const totalTeachersWithHours = Array.from(teacherHoursMap.values()).filter((h) => h > 0);
    expect(totalTeachersWithHours.length).toBeGreaterThan(30);

    for (const [teacherId, hours] of teacherHoursMap.entries()) {
      const teacher = initialTeachers.find((t) => t.id === teacherId);
      if (teacher) {
        const loadRatio = hours / teacher.weeklyHourCapacity;
        // Load ratio should be reasonable (under 150% max)
        expect(loadRatio).toBeLessThanOrEqual(1.5);
      }
    }
  });
});
