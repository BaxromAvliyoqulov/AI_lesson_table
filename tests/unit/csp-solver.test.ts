import { describe, it, expect } from "vitest";
import { CSPSolver } from "@/lib/solver/csp-solver";
import {
  initialClasses,
  initialTeachers,
  initialSubjects,
  initialRooms,
  initialBranches,
  initialShifts,
} from "@/lib/mock-data";

describe("CSP Constraint Satisfaction Solver (Dars Jadval AI Generator)", () => {
  it("should generate a complete schedule for 55 teachers and 29 classes with 0 conflicts", () => {
    const solver = new CSPSolver({
      classes: initialClasses,
      teachers: initialTeachers,
      subjects: initialSubjects,
      rooms: initialRooms,
      branches: initialBranches,
      shifts: initialShifts,
      daysCount: 6,
      maxPeriodsPerDay: 6,
    });

    const result = solver.solve();

    // 1. Solver must succeed
    expect(result.success).toBe(true);
    expect(result.lessons.length).toBeGreaterThan(600);
    expect(result.stats.conflictsCount).toBe(0);

    // 2. Strict Zero Conflict Verification across all teachers
    // No teacher should have 2 lessons at the same day and period
    const teacherSlotMap = new Map<string, string[]>();
    for (const lesson of result.lessons) {
      const key = `${lesson.teacherId}_day${lesson.dayOfWeek}_p${lesson.periodNumber}`;
      const existing = teacherSlotMap.get(key) || [];
      existing.push(lesson.classId);
      teacherSlotMap.set(key, existing);
    }

    const collidingTeacherSlots: string[] = [];
    teacherSlotMap.forEach((classes, key) => {
      if (classes.length > 1) {
        collidingTeacherSlots.push(`${key} -> classes: ${classes.join(", ")}`);
      }
    });

    expect(collidingTeacherSlots).toEqual([]);

    // 3. Strict Primary Classes 5-day week verification
    // 1-4 classes should not have lessons on Saturday (day 6)
    const primarySaturdayLessons = result.lessons.filter((l) => {
      const cls = initialClasses.find((c) => c.id === l.classId);
      const isPrimary = cls?.isPrimary || (cls?.grade && cls.grade <= 4);
      return isPrimary && l.dayOfWeek === 6;
    });

    expect(primarySaturdayLessons.length).toBe(0);
  });

  it("should respect homeroom teacher 'Kelajak soati' on Monday period 1", () => {
    const solver = new CSPSolver({
      classes: initialClasses,
      teachers: initialTeachers,
      subjects: initialSubjects,
      rooms: initialRooms,
      branches: initialBranches,
      shifts: initialShifts,
      daysCount: 6,
      maxPeriodsPerDay: 6,
    });

    const result = solver.solve();

    // Classes with homeroom teacher should have lesson on Monday period 1
    for (const cls of initialClasses) {
      if (cls.homeroomTeacherId && !cls.isClosed) {
        const mondayP1 = result.lessons.find(
          (l) => l.classId === cls.id && l.dayOfWeek === 1 && l.periodNumber === 1
        );
        expect(mondayP1).toBeDefined();
        if (mondayP1) {
          expect(mondayP1.teacherId).toBe(cls.homeroomTeacherId);
        }
      }
    }
  });

  it("should handle classes with empty curriculum using auto-standard fallback", () => {
    const customClasses = [
      {
        id: "c_test_empty",
        schoolId: "school_39",
        branchId: "b39_1",
        shiftId: "s39_1",
        name: "5-Test",
        grade: 5,
        isPrimary: false,
        subjects: [], // Empty subjects
      },
    ];

    const solver = new CSPSolver({
      classes: customClasses,
      teachers: initialTeachers,
      subjects: initialSubjects,
      rooms: initialRooms,
      branches: initialBranches,
      shifts: initialShifts,
      daysCount: 6,
      maxPeriodsPerDay: 6,
    });

    const result = solver.solve();
    expect(result.success).toBe(true);
    expect(result.lessons.length).toBeGreaterThanOrEqual(25);
  });
});
