import { describe, it, expect } from "vitest";
import { validateDropSlot } from "@/lib/solver/drag-validator";
import { Lesson, SchoolClass, Subject, Teacher } from "@/types";

describe("Real-Time Drag & Drop Conflict Radar Engine", () => {
  const mockClass: SchoolClass = {
    id: "c_8a",
    schoolId: "school_39",
    branchId: "b39_1",
    shiftId: "s39_1",
    name: "8-A",
    grade: 8,
    isPrimary: false,
    subjects: [],
  };

  const mockPrimaryClass: SchoolClass = {
    id: "c_2a",
    schoolId: "school_39",
    branchId: "b39_1",
    shiftId: "s39_1",
    name: "2-A",
    grade: 2,
    isPrimary: true,
    subjects: [],
  };

  const mockTeacher: Teacher = {
    id: "t_10",
    schoolId: "school_39",
    fullName: "Sobirov Alisher",
    weeklyHourCapacity: 20,
    maxConsecutiveHours: 4,
    methodDayOfWeek: 3, // Wednesday is Method Day
    subjectIds: ["sub_fiz"],
    branchIds: ["b39_1"],
  };

  const mockSubject: Subject = {
    id: "sub_fiz",
    schoolId: "school_39",
    name: "Fizika",
    colorTag: "#3B82F6",
    difficultyScore: 11,
    allowDoubleLesson: true,
  };

  const draggedLesson: Lesson = {
    id: "l_dragged",
    scheduleId: "s1",
    schoolId: "school_39",
    classId: "c_8a",
    subjectId: "sub_fiz",
    teacherId: "t_10",
    branchId: "b39_1",
    dayOfWeek: 1,
    periodNumber: 1,
  };

  it("should return SAFE status for a valid empty slot with no conflicts", () => {
    const validation = validateDropSlot({
      draggedLesson,
      targetClass: mockClass,
      targetDay: 1, // Monday
      targetPeriod: 3,
      allLessons: [draggedLesson],
      teachers: [mockTeacher],
      subjects: [mockSubject],
      rooms: [],
    });

    expect(validation.status).toBe("safe");
    expect(validation.conflicts).toHaveLength(0);
  });

  it("should detect CONFLICT when teacher has another lesson at the same day & period", () => {
    const existingLesson: Lesson = {
      id: "l_other",
      scheduleId: "s1",
      schoolId: "school_39",
      classId: "c_9a",
      subjectId: "sub_fiz",
      teacherId: "t_10",
      branchId: "b39_1",
      dayOfWeek: 2,
      periodNumber: 2,
    };

    const validation = validateDropSlot({
      draggedLesson,
      targetClass: mockClass,
      targetDay: 2,
      targetPeriod: 2,
      allLessons: [draggedLesson, existingLesson],
      teachers: [mockTeacher],
      subjects: [mockSubject],
      rooms: [],
    });

    expect(validation.status).toBe("conflict");
    expect(validation.badge).toContain("Ziddiyat");
    expect(validation.conflicts.length).toBeGreaterThan(0);
  });

  it("should detect CONFLICT when dropping onto teacher's Method Day", () => {
    const validation = validateDropSlot({
      draggedLesson,
      targetClass: mockClass,
      targetDay: 3, // Wednesday is Method Day
      targetPeriod: 1,
      allLessons: [draggedLesson],
      teachers: [mockTeacher],
      subjects: [mockSubject],
      rooms: [],
    });

    expect(validation.status).toBe("conflict");
    expect(validation.reason).toContain("Metod kuni");
  });

  it("should detect CONFLICT when dropping on Saturday for primary classes", () => {
    const validation = validateDropSlot({
      draggedLesson,
      targetClass: mockPrimaryClass,
      targetDay: 6, // Saturday
      targetPeriod: 1,
      allLessons: [draggedLesson],
      teachers: [mockTeacher],
      subjects: [mockSubject],
      rooms: [],
    });

    expect(validation.status).toBe("conflict");
    expect(validation.reason).toContain("Shanba dam olish kuni");
  });
});
