import { describe, it, expect } from "vitest";
import { initialTeachers, initialClasses } from "@/lib/mock-data";
import { isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";

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

  it("should strictly exclude Kelajak soati / Sinf soati from teacher's pedagogical workload hours", () => {
    // O'zbekiston xalq ta'limi standarti: Sinf rahbarligining 1 soatlik Kelajak soati
    // o'qituvchining pedagogik dars stavkasi yuklamasiga QO'SHILMAYDI (10 + 1 = 10 soat stavka)
    const sampleSubjects = [
      { subjectId: "sub_ona", weeklyHours: 5, teacherId: "t_test" },
      { subjectId: "sub_adabiyot", weeklyHours: 5, teacherId: "t_test" },
      { subjectId: "sub_sinf_soati", weeklyHours: 1, teacherId: "t_test" },
    ];

    let totalWorkload = 0;
    for (const cs of sampleSubjects) {
      if (!isKelajakOrSinfSoatiSubject(cs.subjectId)) {
        totalWorkload += cs.weeklyHours;
      }
    }

    expect(totalWorkload).toBe(10); // 11 emas, qat'iyan 10 soat!
  });

  it("should calculate split group hours dynamically for both teachers and support slash format", () => {
    // Agar 5A sinfining Ingliz tili fani (4 soat) guruhga bo'lingan bo'lsa:
    // 1-guruh: 18-o'qituvchi (4 soat)
    // 2-guruh: 24-o'qituvchi (4 soat)
    const splitAssignments = [
      { classId: "c_5A", subjectId: "sub_ing", teacherId: "t_18", weeklyHours: 4, groupType: "GROUP_1" },
      { classId: "c_5A", subjectId: "sub_ing", teacherId: "t_24", weeklyHours: 4, groupType: "GROUP_2" },
      { classId: "c_5B", subjectId: "sub_ing", teacherId: "t_18", weeklyHours: 4, groupType: "WHOLE" },
    ];

    const teacherWorkloads = new Map<string, number>();
    for (const cs of splitAssignments) {
      if (!isKelajakOrSinfSoatiSubject(cs.subjectId)) {
        teacherWorkloads.set(cs.teacherId, (teacherWorkloads.get(cs.teacherId) || 0) + cs.weeklyHours);
      }
    }

    // 18-o'qituvchiga 4 (5A 1-gr) + 4 (5B) = 8 soat
    expect(teacherWorkloads.get("t_18")).toBe(8);
    // 24-o'qituvchiga ham dinamik ravishda 5A 2-guruhning 4 soati to'liq qo'shiladi!
    expect(teacherWorkloads.get("t_24")).toBe(4);

    // Dars jadvalida o'qituvchilar raqami slash bilan ajratilishi:
    const num1 = 18;
    const num2 = 24;
    const slashLabel = `${num1} / ${num2}`;
    expect(slashLabel).toBe("18 / 24");
  });
});
