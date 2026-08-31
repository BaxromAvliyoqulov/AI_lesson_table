import { Lesson, Teacher, Subject, SchoolClass, SolverResult } from "@/types";

export interface AIConflictAdvice {
  summary: string;
  recommendations: string[];
  suggestedSwaps?: {
    lessonIdA: string;
    lessonIdB: string;
    reason: string;
  }[];
}

export interface SmartZamenaRecommendation {
  teacherId: string;
  teacherName: string;
  confidenceScore: number; // 0-100%
  reasons: string[];
  currentWeeklyLoad: number;
}

export class AIAssistant {
  /**
   * CSP generatsiya natijasida yuzaga kelgan ziddiyatlarni o'zbek tilida tahlil qilib maslahat berish
   */
  public static analyzeConflicts(
    result: SolverResult,
    classes: SchoolClass[],
    teachers: Teacher[],
    subjects: Subject[]
  ): AIConflictAdvice {
    if (result.success || result.unassignedLessons.length === 0) {
      return {
        summary: "Dars jadvalida hech qanday ziddiyat aniqlanmadi. Barcha SanPiN va pedagogik talablar 100% bajarildi.",
        recommendations: [
          "Jadvalni tasdiqlash (PUBLISHED) holatiga o'tkazishingiz mumkin.",
          "O'qituvchilarga shaxsiy dars jadvallarini yuborish uchun PDF/Excel eksport qiling.",
        ],
      };
    }

    const teacherMap = new Map(teachers.map((t) => [t.id, t]));
    const subjectMap = new Map(subjects.map((s) => [s.id, s]));
    const classMap = new Map(classes.map((c) => [c.id, c]));

    const recommendations: string[] = [];

    // Guruhiy tahlil
    const overloadedTeachers = new Set<string>();
    result.unassignedLessons.forEach((item) => {
      const teacher = teacherMap.get(item.teacherId);
      const subject = subjectMap.get(item.subjectId);
      const cls = classMap.get(item.classId);

      if (teacher && subject && cls) {
        overloadedTeachers.add(teacher.fullName);
        if (teacher.methodDayOfWeek) {
          recommendations.push(
            `${teacher.fullName} uchun ${cls.name} sinfidagi ${subject.name} darsi joylashmadi. Sababi: O'qituvchining metod kuni va boshqa sinflar bilan to'qnashuv mavjud.`
          );
        } else {
          recommendations.push(
            `${cls.name} sinfi uchun ${teacher.fullName} (${subject.name}) bo'sh soat topa olmadi. O'qituvchiga qo'shimcha bo'sh vaqt ochishni tavsiya qilamiz.`
          );
        }
      }
    });

    recommendations.push(
      "Maslahat: Sozlamalar -> O'qituvchilar bo'limida stavka soatlarini yoki metod kunini qayta ko'rib chiqing."
    );

    return {
      summary: `Jadvalda ${result.unassignedLessons.length} ta dars bo'yicha ziddiyat aniqlandi.`,
      recommendations: recommendations.slice(0, 5),
    };
  }

  /**
   * Darsga kelmagan o'qituvchi o'rniga eng munosib o'rinbosarni aniqlash
   */
  public static recommendSubstitutes(
    targetLesson: Lesson,
    targetSubject: Subject | undefined,
    allTeachers: Teacher[],
    allLessons: Lesson[]
  ): SmartZamenaRecommendation[] {
    const candidates: SmartZamenaRecommendation[] = [];

    const busyTeacherIds = new Set(
      allLessons
        .filter(
          (l) =>
            l.dayOfWeek === targetLesson.dayOfWeek &&
            l.periodNumber === targetLesson.periodNumber &&
            l.id !== targetLesson.id
        )
        .map((l) => l.teacherId)
    );

    allTeachers.forEach((teacher) => {
      // O'zi bo'lmasligi kerak
      if (teacher.id === targetLesson.teacherId) return;

      // Shu soatda boshqa darsi bo'lmasligi kerak
      if (busyTeacherIds.has(teacher.id)) return;

      // Metod kuni bo'lmasligi kerak
      if (teacher.methodDayOfWeek === targetLesson.dayOfWeek) return;

      let score = 50;
      const reasons: string[] = ["Ushbu soatda darsi yo'q (Bo'sh)"];

      // Aynan shu fandan dars beradimi?
      if (targetSubject && teacher.subjectIds.includes(targetSubject.id)) {
        score += 40;
        reasons.push(`${targetSubject.name} fani bo'yicha mutaxassis`);
      } else {
        score += 10;
        reasons.push("Turmush/umumiy fan o'qituvchisi sifatida o'ta oladi");
      }

      // Haftalik yuklamasi me'yordan oshmaganmi?
      const currentTeacherLessons = allLessons.filter((l) => l.teacherId === teacher.id).length;
      if (currentTeacherLessons < teacher.weeklyHourCapacity) {
        score += 10;
        reasons.push(`Haftalik yuklama zaxirasi mavjud (${currentTeacherLessons}/${teacher.weeklyHourCapacity} st)`);
      }

      candidates.push({
        teacherId: teacher.id,
        teacherName: teacher.fullName,
        confidenceScore: Math.min(score, 100),
        reasons,
        currentWeeklyLoad: currentTeacherLessons,
      });
    });

    return candidates.sort((a, b) => b.confidenceScore - a.confidenceScore);
  }
}
