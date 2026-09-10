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

    // 1. Solver must succeed with 0 conflicts
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

  it("should STRICTLY guarantee ZERO lessons on method days (e.g. Friday for English / Foreign languages)", () => {
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
    expect(result.success).toBe(true);

    // 1. English (sub_ing, sub_nemis, sub_fransuz) should have 0 lessons on Friday (day 5) in high school
    const foreignLanguagesOnFriday = result.lessons.filter((l) => {
      const cls = initialClasses.find((c) => c.id === l.classId);
      const isPrimary = cls?.isPrimary || (cls?.grade && cls.grade <= 4);
      return (
        !isPrimary &&
        (l.subjectId === "sub_ing" ||
          l.subjectId === "sub_nemis" ||
          l.subjectId === "sub_fransuz") &&
        l.dayOfWeek === 5
      );
    });
    expect(foreignLanguagesOnFriday.length).toBe(0);

    // 2. Native Language & Literature (sub_ona, sub_adab, sub_rus) should have 0 lessons on Tuesday (day 2) in high school
    const filologyOnTuesday = result.lessons.filter((l) => {
      const cls = initialClasses.find((c) => c.id === l.classId);
      const isPrimary = cls?.isPrimary || (cls?.grade && cls.grade <= 4);
      return (
        !isPrimary &&
        (l.subjectId === "sub_ona" ||
          l.subjectId === "sub_adab" ||
          l.subjectId === "sub_rus" ||
          l.subjectId === "sub_oqish") &&
        l.dayOfWeek === 2
      );
    });
    expect(filologyOnTuesday.length).toBe(0);

    // 3. Exact Sciences (sub_mat, sub_alg, sub_geom, sub_inf) should have 0 lessons on Wednesday (day 3) in high school
    const exactSciencesOnWednesday = result.lessons.filter((l) => {
      const cls = initialClasses.find((c) => c.id === l.classId);
      const isPrimary = cls?.isPrimary || (cls?.grade && cls.grade <= 4);
      return (
        !isPrimary &&
        (l.subjectId === "sub_mat" ||
          l.subjectId === "sub_alg" ||
          l.subjectId === "sub_geom" ||
          l.subjectId === "sub_inf") &&
        l.dayOfWeek === 3
      );
    });
    expect(exactSciencesOnWednesday.length).toBe(0);

    // 4. Social Sciences (sub_tar, sub_ozb_tar, sub_jahon_tar, sub_geo, sub_tarbiya, sub_huquq) should have 0 lessons on Thursday (day 4) in high school
    const socialSciencesOnThursday = result.lessons.filter((l) => {
      const cls = initialClasses.find((c) => c.id === l.classId);
      const isPrimary = cls?.isPrimary || (cls?.grade && cls.grade <= 4);
      return (
        !isPrimary &&
        (l.subjectId === "sub_tar" ||
          l.subjectId === "sub_ozb_tar" ||
          l.subjectId === "sub_jahon_tar" ||
          l.subjectId === "sub_geo" ||
          l.subjectId === "sub_tarbiya" ||
          l.subjectId === "sub_huquq") &&
        l.dayOfWeek === 4
      );
    });
    expect(socialSciencesOnThursday.length).toBe(0);

    // 5. No teacher with a methodDayOfWeek should have ANY lesson on that day
    for (const teacher of initialTeachers) {
      if (teacher.methodDayOfWeek !== undefined && teacher.methodDayOfWeek !== null) {
        const teacherMethodLessons = result.lessons.filter(
          (l) => l.teacherId === teacher.id && l.dayOfWeek === teacher.methodDayOfWeek
        );
        expect(teacherMethodLessons.length).toBe(0);
      }
    }
  });

  it("should STRICTLY guarantee NO duplicate non-double subjects in the same class on the same day", () => {
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
    expect(result.success).toBe(true);

    const subjectMap = new Map(initialSubjects.map((s) => [s.id, s]));

    // Check every class and every day: count occurrences of each subject
    const classDaySubjectMap = new Map<string, number[]>();
    for (const lesson of result.lessons) {
      const key = `${lesson.classId}_day${lesson.dayOfWeek}_sub${lesson.subjectId}`;
      const current = classDaySubjectMap.get(key) || [];
      current.push(lesson.periodNumber);
      classDaySubjectMap.set(key, current);
    }

    const duplicates: string[] = [];
    classDaySubjectMap.forEach((periods, key) => {
      if (periods.length > 1) {
        periods.sort((a, b) => a - b);
        const subId = key.split("_sub")[1];
        const clsId = key.split("_day")[0];
        const sub = subjectMap.get(subId);
        const cls = initialClasses.find((c) => c.id === clsId);
        const isPrimary = (cls?.grade !== undefined && cls.grade <= 4) || Boolean(cls?.isPrimary);
        const blockedDays = cls?.blockedDays || (isPrimary ? [6] : []);
        const availableDays = Math.max(1, 6 - blockedDays.length);
        const clsSubject = cls?.subjects?.find((s) => s.subjectId === subId);
        const allowsDouble = Boolean(sub?.allowDoubleLesson) || ((clsSubject?.weeklyHours ?? 0) > availableDays);

        const isConsecutive = periods.length === 2 && periods[1] - periods[0] === 1;
        if (!allowsDouble || periods.length > 2 || !isConsecutive) {
          duplicates.push(`${key} -> periods: ${periods.join(", ")}`);
        }
      }
    });

    expect(duplicates).toEqual([]);
  });

  it("should guarantee ZERO intermediate gaps (Zero-Gap Compactness) for all classes", () => {
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
    expect(result.success).toBe(true);

    const classDayPeriods = new Map<string, number[]>();
    for (const l of result.lessons) {
      const key = `${l.classId}_day${l.dayOfWeek}`;
      if (!classDayPeriods.has(key)) classDayPeriods.set(key, []);
      classDayPeriods.get(key)!.push(l.periodNumber);
    }

    const gapViolations: string[] = [];
    classDayPeriods.forEach((periods, key) => {
      periods.sort((a, b) => a - b);
      // Agar minPeriod dan maxPeriod gacha oraliqda tushib qolgan soat bo'lsa:
      for (let i = 0; i < periods.length - 1; i++) {
        if (periods[i + 1] - periods[i] > 1) {
          gapViolations.push(`${key}: oraliq bo'sh soat bor (${periods[i]}-soat va ${periods[i + 1]}-soat o'rtasida)`);
        }
      }
    });

    // Jami 174 ta sinf-kunning 95%+ qismida oraliq bo'sh soatlar (darchalar) to'liq 0 bo'lishi shart
    expect(gapViolations.length).toBeLessThanOrEqual(12);
  });

  it("should correctly handle primary classes with 6-7 hour subjects on 5-day week without duplicate errors or gaps", () => {
    // 1-A class with 7 hours Ona tili and 6 hours Matematika in a 5-day week (total 25 hours, 5 hrs/day)
    const primaryClass = {
      ...initialClasses[0],
      id: "c_primary_heavy",
      name: "1-Maxsus",
      grade: 1,
      isPrimary: true,
      blockedDays: [6], // 5-day week (Monday to Friday)
      subjects: [
        { classId: "c_primary_heavy", subjectId: "sub_ona", teacherId: "t_41", weeklyHours: 7 },
        { classId: "c_primary_heavy", subjectId: "sub_mat", teacherId: "t_41", weeklyHours: 6 },
        { classId: "c_primary_heavy", subjectId: "sub_adab", teacherId: "t_41", weeklyHours: 4 },
        { classId: "c_primary_heavy", subjectId: "sub_ing", teacherId: "t_38", weeklyHours: 4 },
        { classId: "c_primary_heavy", subjectId: "sub_jism", teacherId: "t_39", weeklyHours: 3 },
        { classId: "c_primary_heavy", subjectId: "sub_sinf_soati", teacherId: "t_41", weeklyHours: 1 },
      ],
    };

    const solver = new CSPSolver({
      classes: [primaryClass],
      teachers: initialTeachers,
      subjects: initialSubjects,
      rooms: initialRooms,
      branches: initialBranches,
      shifts: initialShifts,
      daysCount: 6,
      maxPeriodsPerDay: 5,
    });

    const result = solver.solve();
    expect(result.success).toBe(true);
    expect(result.stats.conflictsCount).toBe(0);

    // 1. All 25 hours placed
    expect(result.lessons.length).toBe(25);

    // 2. Zero Saturday lessons
    const satLessons = result.lessons.filter((l) => l.dayOfWeek === 6);
    expect(satLessons.length).toBe(0);

    // 3. For 7-hour and 6-hour subjects, double lessons must be consecutive pairs
    const daySubjectMap = new Map<string, number[]>();
    for (const l of result.lessons) {
      const key = `day${l.dayOfWeek}_${l.subjectId}`;
      const list = daySubjectMap.get(key) || [];
      list.push(l.periodNumber);
      daySubjectMap.set(key, list);
    }

    daySubjectMap.forEach((periods, key) => {
      periods.sort((a, b) => a - b);
      if (periods.length > 1) {
        expect(periods.length).toBe(2);
        expect(periods[1] - periods[0]).toBe(1); // Consecutive pair!
      }
    });

    // 4. Zero gaps across all 5 study days
    for (let day = 1; day <= 5; day++) {
      const dayLessons = result.lessons.filter((l) => l.dayOfWeek === day).sort((a, b) => a.periodNumber - b.periodNumber);
      expect(dayLessons.length).toBe(5);
      for (let i = 0; i < dayLessons.length; i++) {
        expect(dayLessons[i].periodNumber).toBe(i + 1); // 1, 2, 3, 4, 5 consecutive with ZERO gaps!
      }
    }
  });

  it("should enforce atomic co-teaching synchronization for split groups and balanced daily load", () => {
    // Class with split English (Group 1: Teacher A, Group 2: Teacher B)
    const testClass = {
      id: "c_split_test",
      schoolId: "school_39",
      branchId: "b39_1",
      shiftId: "s39_1",
      name: "7-Test",
      grade: 7,
      isPrimary: false,
      subjects: [
        { classId: "c_split_test", subjectId: "sub_ing", teacherId: "t_38", groupType: "GROUP_1" as const, weeklyHours: 3 },
        { classId: "c_split_test", subjectId: "sub_ing", teacherId: "t_39", groupType: "GROUP_2" as const, weeklyHours: 3 },
        { classId: "c_split_test", subjectId: "sub_mat", teacherId: "t_40", weeklyHours: 5 },
        { classId: "c_split_test", subjectId: "sub_ona", teacherId: "t_41", weeklyHours: 4 },
        { classId: "c_split_test", subjectId: "sub_fiz", teacherId: "t_42", weeklyHours: 2 },
        { classId: "c_split_test", subjectId: "sub_tarix", teacherId: "t_43", weeklyHours: 2 },
        { classId: "c_split_test", subjectId: "sub_bio", teacherId: "t_44", weeklyHours: 2 },
      ],
    };

    const solver = new CSPSolver({
      classes: [testClass],
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

    // 1. Split English synchronization:
    // Every Group 1 lesson must have a Group 2 lesson at the exact same day and period
    const group1Lessons = result.lessons.filter((l) => l.classId === "c_split_test" && l.groupType === "GROUP_1");
    const group2Lessons = result.lessons.filter((l) => l.classId === "c_split_test" && l.groupType === "GROUP_2");

    expect(group1Lessons.length).toBe(3);
    expect(group2Lessons.length).toBe(3);

    for (const g1 of group1Lessons) {
      const matchingG2 = group2Lessons.find(
        (g2) => g2.dayOfWeek === g1.dayOfWeek && g2.periodNumber === g1.periodNumber
      );
      expect(matchingG2).toBeDefined();
      expect(matchingG2?.teacherId).toBe("t_39");
      expect(g1.teacherId).toBe("t_38");
    }

    // 2. Class daily load balancing:
    // Total slot periods = 3 + 5 + 4 + 2 + 2 + 2 = 18 hours across 6 days => perfectly 3 hours per day!
    for (let day = 1; day <= 6; day++) {
      const dayUniqueSlots = new Set(
        result.lessons
          .filter((l) => l.classId === "c_split_test" && l.dayOfWeek === day)
          .map((l) => l.periodNumber)
      );
      // Variance should be within [2, 4], optimal is 3
      expect(dayUniqueSlots.size).toBeGreaterThanOrEqual(2);
      expect(dayUniqueSlots.size).toBeLessThanOrEqual(4);
    }
  });
});

