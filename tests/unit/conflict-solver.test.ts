import { describe, it, expect } from "vitest";
import { generateConflictResolutionPlan } from "@/lib/solver/conflict-solver-engine";
import { Lesson, SchoolClass, Subject, Teacher } from "@/types";

describe("conflict-solver-engine", () => {
  const mockClass: SchoolClass = {
    id: "cls_1",
    name: "5-A",
    grade: 5,
    schoolId: "sch_1",
    branchId: "b_1",
    shiftId: "s_1",
    isPrimary: false,
    subjects: [],
  };

  const mockTeacher1: Teacher = {
    id: "t_1",
    fullName: "Aliyev Vali",
    schoolId: "sch_1",
    branchIds: ["b_1"],
    maxConsecutiveHours: 4,
    subjectIds: ["sub_math"],
    weeklyHourCapacity: 18,
    methodDayOfWeek: 2, // Seshanba metod kuni
  };

  const mockTeacher2: Teacher = {
    id: "t_2",
    fullName: "Karimov Sherzod",
    schoolId: "sch_1",
    branchIds: ["b_1"],
    maxConsecutiveHours: 4,
    subjectIds: ["sub_math"],
    weeklyHourCapacity: 18,
    methodDayOfWeek: 4, // Payshanba metod kuni
  };

  const mockSubject: Subject = {
    id: "sub_math",
    name: "Matematika",
    shortName: "Mat",
    schoolId: "sch_1",
    colorTag: "#3B82F6",
    allowDoubleLesson: true,
    difficultyScore: 8,
  };

  it("should accurately detect teacher collision and suggest safe relocation and substitution", () => {
    // 2 ta sinfda bir vaqtda t_1 ga dars qo'yilgan
    const lesson1: Lesson = {
      id: "l_1",
      scheduleId: "sch",
      schoolId: "sch_1",
      branchId: "b_1",
      classId: "cls_1",
      subjectId: "sub_math",
      teacherId: "t_1",
      dayOfWeek: 1, // Dushanba
      periodNumber: 2,
    };

    const lesson2: Lesson = {
      id: "l_2",
      scheduleId: "sch",
      schoolId: "sch_1",
      branchId: "b_1",
      classId: "cls_2",
      subjectId: "sub_math",
      teacherId: "t_1",
      dayOfWeek: 1, // Dushanba
      periodNumber: 2,
    };

    const mockClass2: SchoolClass = {
      id: "cls_2",
      name: "6-A",
      grade: 6,
      schoolId: "sch_1",
      branchId: "b_1",
      shiftId: "s_1",
      isPrimary: false,
      subjects: [],
    };

    const plan = generateConflictResolutionPlan({
      targetLesson: lesson1,
      classes: [mockClass, mockClass2],
      teachers: [mockTeacher1, mockTeacher2],
      subjects: [mockSubject],
      allLessons: [lesson1, lesson2],
    });

    expect(plan.cause.type).toBe("TEACHER_COLLISION");
    expect(plan.solutions.length).toBeGreaterThan(0);
    // Yechimlardan biri boshqa bo'sh o'qituvchi (t_2) ga topshirish yoki boshqa soatga ko'chirish bo'lishi kerak
    expect(plan.solutions.some((s) => s.type === "SUBSTITUTE_TEACHER" || s.type === "RELOCATE")).toBe(true);
  });
});
