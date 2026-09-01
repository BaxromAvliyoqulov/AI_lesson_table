import { Subject, Teacher, ClassSubject } from "@/types";

export interface GradeCurriculumItem {
  subjectName: string;
  searchAliases: string[];
  defaultHours: number;
  prioritySubjectId?: string;
}

/**
 * O'zbekiston Respublikasi Xalq Ta'limi Vazirligi Tasdiqlagan
 * Standart Haftalik Dars Soatlari Taqsimoti (1-sinfdan 11-sinfgacha)
 */
export const UZBEKISTAN_STANDARD_CURRICULUM: Record<number, GradeCurriculumItem[]> = {
  // 1-sinf: Jami ~21 soat
  1: [
    { subjectName: "Ona tili", searchAliases: ["ona tili", "o'qish", "savodxonlik"], defaultHours: 7, prioritySubjectId: "sub_ona" },
    { subjectName: "Matematika", searchAliases: ["matematika", "hisob"], defaultHours: 4, prioritySubjectId: "sub_mat" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz", "chet tili", "english"], defaultHours: 2, prioritySubjectId: "sub_ing" },
    { subjectName: "Tabiiy fan", searchAliases: ["tabiiy", "science", "atrofimiz"], defaultHours: 1, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy", "rasm", "chizmachilik"], defaultHours: 1, prioritySubjectId: "sub_tasviriy" },
    { subjectName: "Musiqa", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya", "mehnat"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy", "sport", "fizkultura"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya", "odobnoma"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati", "tarbiyaviy soat"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 2-sinf: Jami ~23 soat
  2: [
    { subjectName: "Ona tili", searchAliases: ["ona tili", "o'qish"], defaultHours: 7, prioritySubjectId: "sub_ona" },
    { subjectName: "Matematika", searchAliases: ["matematika"], defaultHours: 4, prioritySubjectId: "sub_mat" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz", "chet tili"], defaultHours: 2, prioritySubjectId: "sub_ing" },
    { subjectName: "Tabiiy fan", searchAliases: ["tabiiy", "science"], defaultHours: 2, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy", "rasm"], defaultHours: 1, prioritySubjectId: "sub_tasviriy" },
    { subjectName: "Musiqa", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya", "mehnat"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy", "sport"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Informatika", searchAliases: ["informatika", "it"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 3-sinf: Jami ~24 soat
  3: [
    { subjectName: "Ona tili", searchAliases: ["ona tili", "o'qish"], defaultHours: 6, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot", "o'qish"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Matematika", searchAliases: ["matematika"], defaultHours: 4, prioritySubjectId: "sub_mat" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz", "chet tili"], defaultHours: 2, prioritySubjectId: "sub_ing" },
    { subjectName: "Tabiiy fan", searchAliases: ["tabiiy", "science"], defaultHours: 2, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy", "rasm"], defaultHours: 1, prioritySubjectId: "sub_tasviriy" },
    { subjectName: "Musiqa", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy", "sport"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Informatika", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 4-sinf: Jami ~25 soat
  4: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 5, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot", "o'qish"], defaultHours: 3, prioritySubjectId: "sub_adab" },
    { subjectName: "Matematika", searchAliases: ["matematika"], defaultHours: 4, prioritySubjectId: "sub_mat" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz"], defaultHours: 2, prioritySubjectId: "sub_ing" },
    { subjectName: "Tabiiy fan", searchAliases: ["tabiiy", "science"], defaultHours: 2, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy"], defaultHours: 1, prioritySubjectId: "sub_tasviriy" },
    { subjectName: "Musiqa", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Informatika", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Tarix", searchAliases: ["tarix", "hikoyalar"], defaultHours: 1, prioritySubjectId: "sub_tar" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 5-sinf: Jami ~29 soat
  5: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 4, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Matematika", searchAliases: ["matematika", "algebra"], defaultHours: 5, prioritySubjectId: "sub_mat" },
    { subjectName: "Tarix", searchAliases: ["tarix"], defaultHours: 2, prioritySubjectId: "sub_tar" },
    { subjectName: "Tabiiy fan", searchAliases: ["tabiiy", "biologiya"], defaultHours: 2, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Geografiya", searchAliases: ["geografiya"], defaultHours: 1, prioritySubjectId: "sub_geogr" },
    { subjectName: "Informatika", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz"], defaultHours: 3, prioritySubjectId: "sub_ing" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy"], defaultHours: 1, prioritySubjectId: "sub_tasviriy" },
    { subjectName: "Musiqa", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 6-sinf: Jami ~30 soat
  6: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 4, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Matematika", searchAliases: ["matematika"], defaultHours: 5, prioritySubjectId: "sub_mat" },
    { subjectName: "Tarix", searchAliases: ["tarix"], defaultHours: 2, prioritySubjectId: "sub_tar" },
    { subjectName: "Biologiya", searchAliases: ["biologiya", "botanika"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 2, prioritySubjectId: "sub_fiz" },
    { subjectName: "Geografiya", searchAliases: ["geografiya"], defaultHours: 2, prioritySubjectId: "sub_geogr" },
    { subjectName: "Informatika", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz"], defaultHours: 3, prioritySubjectId: "sub_ing" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy"], defaultHours: 1, prioritySubjectId: "sub_tasviriy" },
    { subjectName: "Musiqa", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 7-sinf: Jami ~32 soat
  7: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 3, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Algebra", searchAliases: ["algebra", "matematika"], defaultHours: 3, prioritySubjectId: "sub_alg" },
    { subjectName: "Geometriya", searchAliases: ["geometriya"], defaultHours: 2, prioritySubjectId: "sub_geom" },
    { subjectName: "Tarix", searchAliases: ["tarix"], defaultHours: 2, prioritySubjectId: "sub_tar" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 2, prioritySubjectId: "sub_fiz" },
    { subjectName: "Kimyo", searchAliases: ["kimyo"], defaultHours: 2, prioritySubjectId: "sub_kim" },
    { subjectName: "Biologiya", searchAliases: ["biologiya"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Geografiya", searchAliases: ["geografiya"], defaultHours: 2, prioritySubjectId: "sub_geogr" },
    { subjectName: "Informatika", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz"], defaultHours: 3, prioritySubjectId: "sub_ing" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy"], defaultHours: 1, prioritySubjectId: "sub_tasviriy" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 8-sinf: Jami ~33 soat
  8: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 3, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Algebra", searchAliases: ["algebra"], defaultHours: 3, prioritySubjectId: "sub_alg" },
    { subjectName: "Geometriya", searchAliases: ["geometriya"], defaultHours: 2, prioritySubjectId: "sub_geom" },
    { subjectName: "Tarix", searchAliases: ["tarix"], defaultHours: 3, prioritySubjectId: "sub_tar" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 2, prioritySubjectId: "sub_fiz" },
    { subjectName: "Kimyo", searchAliases: ["kimyo"], defaultHours: 2, prioritySubjectId: "sub_kim" },
    { subjectName: "Biologiya", searchAliases: ["biologiya"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Geografiya", searchAliases: ["geografiya"], defaultHours: 2, prioritySubjectId: "sub_geogr" },
    { subjectName: "Informatika", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz"], defaultHours: 3, prioritySubjectId: "sub_ing" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Davlat va huquq", searchAliases: ["huquq"], defaultHours: 1, prioritySubjectId: "sub_huquq" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 9-sinf: Jami ~34 soat
  9: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 3, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 3, prioritySubjectId: "sub_adab" },
    { subjectName: "Algebra", searchAliases: ["algebra"], defaultHours: 3, prioritySubjectId: "sub_alg" },
    { subjectName: "Geometriya", searchAliases: ["geometriya"], defaultHours: 2, prioritySubjectId: "sub_geom" },
    { subjectName: "Tarix", searchAliases: ["tarix"], defaultHours: 3, prioritySubjectId: "sub_tar" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 2, prioritySubjectId: "sub_fiz" },
    { subjectName: "Kimyo", searchAliases: ["kimyo"], defaultHours: 2, prioritySubjectId: "sub_kim" },
    { subjectName: "Biologiya", searchAliases: ["biologiya"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Geografiya", searchAliases: ["geografiya"], defaultHours: 2, prioritySubjectId: "sub_geogr" },
    { subjectName: "Informatika", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz"], defaultHours: 3, prioritySubjectId: "sub_ing" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Iqtisodiyot", searchAliases: ["iqtisodiyot"], defaultHours: 1, prioritySubjectId: "sub_iqtisod" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 10-sinf: Jami ~34 soat
  10: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 3, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 3, prioritySubjectId: "sub_adab" },
    { subjectName: "Algebra", searchAliases: ["algebra"], defaultHours: 3, prioritySubjectId: "sub_alg" },
    { subjectName: "Geometriya", searchAliases: ["geometriya"], defaultHours: 2, prioritySubjectId: "sub_geom" },
    { subjectName: "Tarix", searchAliases: ["tarix"], defaultHours: 3, prioritySubjectId: "sub_tar" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 2, prioritySubjectId: "sub_fiz" },
    { subjectName: "Kimyo", searchAliases: ["kimyo"], defaultHours: 2, prioritySubjectId: "sub_kim" },
    { subjectName: "Biologiya", searchAliases: ["biologiya"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Geografiya", searchAliases: ["geografiya"], defaultHours: 2, prioritySubjectId: "sub_geogr" },
    { subjectName: "Informatika", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz"], defaultHours: 3, prioritySubjectId: "sub_ing" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "CHQBT", searchAliases: ["chqbt", "harbiy"], defaultHours: 1, prioritySubjectId: "sub_chqbt" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 11-sinf: Jami ~34 soat
  11: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 3, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 3, prioritySubjectId: "sub_adab" },
    { subjectName: "Algebra", searchAliases: ["algebra"], defaultHours: 3, prioritySubjectId: "sub_alg" },
    { subjectName: "Geometriya", searchAliases: ["geometriya"], defaultHours: 2, prioritySubjectId: "sub_geom" },
    { subjectName: "Tarix", searchAliases: ["tarix"], defaultHours: 3, prioritySubjectId: "sub_tar" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 3, prioritySubjectId: "sub_fiz" },
    { subjectName: "Kimyo", searchAliases: ["kimyo"], defaultHours: 2, prioritySubjectId: "sub_kim" },
    { subjectName: "Biologiya", searchAliases: ["biologiya"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Informatika", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Ingliz tili", searchAliases: ["ingliz"], defaultHours: 3, prioritySubjectId: "sub_ing" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Davlat va huquq", searchAliases: ["huquq"], defaultHours: 1, prioritySubjectId: "sub_huquq" },
    { subjectName: "CHQBT", searchAliases: ["chqbt", "harbiy"], defaultHours: 1, prioritySubjectId: "sub_chqbt" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Sinf soati", searchAliases: ["sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],
};

/**
 * Maktabdagi mavjud fanlar va o'qituvchilar asosida
 * berilgan sinf uchun standart o'quv rejasini (ClassSubject[]) shakllantiradi
 */
export function generateStandardCurriculumForClass(
  grade: number,
  classId: string,
  homeroomTeacherId: string | null | undefined,
  allSubjects: Subject[],
  allTeachers: Teacher[]
): ClassSubject[] {
  const normalizedGrade = Math.max(1, Math.min(11, grade || 5));
  const template = UZBEKISTAN_STANDARD_CURRICULUM[normalizedGrade] || UZBEKISTAN_STANDARD_CURRICULUM[5];

  const result: ClassSubject[] = [];

  for (const item of template) {
    // 1. Fanni topish
    let matchedSubject: Subject | undefined;

    // A) Priority ID bo'yicha
    if (item.prioritySubjectId) {
      matchedSubject = allSubjects.find((s) => s.id === item.prioritySubjectId && s.isActive !== false);
    }

    // B) Ism va qisqartmalar bo'yicha
    if (!matchedSubject) {
      matchedSubject = allSubjects.find((s) => {
        if (s.isActive === false) return false;
        const sName = s.name.toLowerCase();
        return item.searchAliases.some((alias) => sName.includes(alias.toLowerCase()));
      });
    }

    if (!matchedSubject) continue;

    // 2. O'qituvchini topish
    let assignedTeacherId = "";

    const isSpecialistSubject = (sub: Subject) => {
      const sName = sub.name.toLowerCase();
      const sId = sub.id.toLowerCase();
      return (
        sId.includes("ing") ||
        sId.includes("rus") ||
        sId.includes("jism") ||
        sId.includes("inf") ||
        sName.includes("ingliz") ||
        sName.includes("chet tili") ||
        sName.includes("rus tili") ||
        sName.includes("jismoniy") ||
        sName.includes("sport") ||
        sName.includes("informatika")
      );
    };

    // Boshlang'ich sinflarda (1-4) mutaxassis fanlardan (Chet tili, Rus tili, Jismoniy tarbiya, Informatika)
    // tashqari barcha asosiy fanlarni (Ona tili, Matematika, Tabiiy fan, Rasm, Musiqa, Texnologiya, Tarbiya, Kelajak soati)
    // sinf rahbarining o'zi o'tadi
    if (normalizedGrade <= 4 && homeroomTeacherId && !isSpecialistSubject(matchedSubject)) {
      assignedTeacherId = homeroomTeacherId;
    }

    // Agar bu "Kelajak soati" yoki "Sinf soati" bo'lsa (har qanday sinfda), sinf rahbarini biriktirish
    if (
      !assignedTeacherId &&
      (matchedSubject.id === "sub_sinf_soati" ||
        matchedSubject.id === "sub_kelajak" ||
        matchedSubject.name.toLowerCase().includes("sinf soati") ||
        matchedSubject.name.toLowerCase().includes("kelajak"))
    ) {
      if (homeroomTeacherId) {
        assignedTeacherId = homeroomTeacherId;
      }
    }

    // Mos fanni o'tadigan o'qituvchini topish
    if (!assignedTeacherId) {
      const suitableTeacher = allTeachers.find((t) =>
        t.subjectIds?.includes(matchedSubject!.id)
      );
      if (suitableTeacher) {
        assignedTeacherId = suitableTeacher.id;
      } else if (allTeachers.length > 0) {
        assignedTeacherId = allTeachers[0].id;
      }
    }

    result.push({
      classId,
      subjectId: matchedSubject.id,
      teacherId: assignedTeacherId,
      weeklyHours: item.defaultHours,
      groupType: "WHOLE",
    });
  }

  return result;
}

/**
 * Faqat yuqori sinflarda (5-11) o'tiladigan fanlar kalit so'zlari
 */
export const HIGH_SCHOOL_ONLY_KEYWORDS = [
  "fizika",
  "kimyo",
  "biologiya",
  "geometriya",
  "algebra",
  "geografiya",
  "tarix",
  "huquq",
  "chqbt",
  "chaqiriq",
  "astronomiya",
  "iqtisod",
  "iqtisodiy",
  "chizmachilik",
  "davlat va huquq",
  "jahon tarixi",
  "o'zbekiston tarixi",
];

/**
 * Fanning berilgan sinfga (1-4 boshlang'ich yoki 5-11 yuqori) mosligini tekshirish
 */
export function isSubjectSuitableForGrade(subject: Subject, grade: number): boolean {
  if (subject.isActive === false) return false;
  const name = subject.name.toLowerCase();
  const id = subject.id.toLowerCase();

  // Agar 1-4 boshlang'ich sinf bo'lsa:
  if (grade <= 4) {
    // 1. Yuqori sinf fanlari (Fizika, Kimyo, Biologiya, Algebra, Geometriya, Geografiya, Tarix, Huquq, Astronomiya, CHQBT) mutlaqo bo'lmasligi kerak
    const isHighOnly = HIGH_SCHOOL_ONLY_KEYWORDS.some(
      (kw) => name.includes(kw) || id.includes(kw)
    );
    if (isHighOnly) return false;

    return true;
  }

  // Agar 5-11 yuqori sinf bo'lsa:
  // Faqat sof boshlang'ichga tegishli fanlar (masalan: "O'qish savodxonligi" yoki "Atrofimizdagi olam")
  if (
    name.includes("o'qish savodxonligi") ||
    name.includes("savodxonlik") ||
    name.includes("atrofimizdagi olam")
  ) {
    return false;
  }

  return true;
}

/**
 * Berilgan sinf uchun tavsiya etilgan va mos keluvchi fanlar ro'yxatini qaytarish
 */
export function getAvailableSubjectsForGrade(allSubjects: Subject[], grade: number): Subject[] {
  return allSubjects.filter((s) => s.isActive !== false && isSubjectSuitableForGrade(s, grade));
}

