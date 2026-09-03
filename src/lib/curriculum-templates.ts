import { Subject, Teacher, ClassSubject } from "@/types";

export interface GradeCurriculumItem {
  subjectName: string;
  searchAliases: string[];
  defaultHours: number;
  prioritySubjectId?: string;
}

/**
 * O'zbekiston Respublikasi Maktabgacha va maktab ta'limi vazirligi
 * 2026-2027-o'quv yili uchun tasdiqlangan rasmiy Tayanch O'quv Rejasi
 * (Ta'lim o'zbek tilida olib boriladigan umumiy o'rta ta'lim muassasalari uchun)
 */
export const UZBEKISTAN_STANDARD_CURRICULUM: Record<number, GradeCurriculumItem[]> = {
  // 1-sinf: Jami 21 soat (+ 1 soat Kelajak soati)
  1: [
    { subjectName: "Ona tili", searchAliases: ["ona tili", "grammatika"], defaultHours: 4, prioritySubjectId: "sub_ona" },
    { subjectName: "O'qish savodxonligi", searchAliases: ["o'qish savodxonligi", "o'qish", "savodxonlik"], defaultHours: 4, prioritySubjectId: "sub_oqish" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz", "english"], defaultHours: 1, prioritySubjectId: "sub_ing" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya", "odobnoma"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Matematika", searchAliases: ["matematika", "hisob"], defaultHours: 5, prioritySubjectId: "sub_mat" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika", "it", "kompyuter"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Tabiiy fan (Science)", searchAliases: ["tabiiy fan", "science", "tabiiy"], defaultHours: 1, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Musiqa madaniyati", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy san'at", "tasviriy", "rasm"], defaultHours: 1, prioritySubjectId: "sub_sanat" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya", "mehnat"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy", "sport", "fizkultura"], defaultHours: 1, prioritySubjectId: "sub_jism" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 2-sinf: Jami 24 soat (+ 1 soat Kelajak soati)
  2: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 4, prioritySubjectId: "sub_ona" },
    { subjectName: "O'qish savodxonligi", searchAliases: ["o'qish savodxonligi", "o'qish"], defaultHours: 3, prioritySubjectId: "sub_oqish" },
    { subjectName: "Rus tili", searchAliases: ["rus tili", "rus"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz"], defaultHours: 2, prioritySubjectId: "sub_ing" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Matematika", searchAliases: ["matematika"], defaultHours: 5, prioritySubjectId: "sub_mat" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Tabiiy fan (Science)", searchAliases: ["tabiiy fan", "science"], defaultHours: 1, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Musiqa madaniyati", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy san'at", "tasviriy"], defaultHours: 1, prioritySubjectId: "sub_sanat" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 3-sinf: Jami 24 soat (+ 1 soat Kelajak soati)
  3: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 4, prioritySubjectId: "sub_ona" },
    { subjectName: "O'qish savodxonligi", searchAliases: ["o'qish savodxonligi", "o'qish"], defaultHours: 3, prioritySubjectId: "sub_oqish" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz"], defaultHours: 2, prioritySubjectId: "sub_ing" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Matematika", searchAliases: ["matematika"], defaultHours: 5, prioritySubjectId: "sub_mat" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Tabiiy fan (Science)", searchAliases: ["tabiiy fan", "science"], defaultHours: 1, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Musiqa madaniyati", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy san'at"], defaultHours: 1, prioritySubjectId: "sub_sanat" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 4-sinf: Jami 24 soat (+ 1 soat Kelajak soati)
  4: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 4, prioritySubjectId: "sub_ona" },
    { subjectName: "O'qish savodxonligi", searchAliases: ["o'qish savodxonligi", "o'qish"], defaultHours: 3, prioritySubjectId: "sub_oqish" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz"], defaultHours: 2, prioritySubjectId: "sub_ing" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Matematika", searchAliases: ["matematika"], defaultHours: 5, prioritySubjectId: "sub_mat" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Tabiiy fan (Science)", searchAliases: ["tabiiy fan", "science"], defaultHours: 1, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Musiqa madaniyati", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy san'at"], defaultHours: 1, prioritySubjectId: "sub_sanat" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 5-sinf: Jami 29 soat (+ 1 soat Kelajak soati)
  5: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 4, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz"], defaultHours: 4, prioritySubjectId: "sub_ing" },
    { subjectName: "Tarixdan hikoyalar", searchAliases: ["tarixdan hikoyalar", "tarix"], defaultHours: 2, prioritySubjectId: "sub_tarixdan_hikoyalar" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Matematika", searchAliases: ["matematika"], defaultHours: 5, prioritySubjectId: "sub_mat" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Tabiiy fan (Science)", searchAliases: ["tabiiy fan", "science"], defaultHours: 2, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Musiqa madaniyati", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy san'at"], defaultHours: 1, prioritySubjectId: "sub_sanat" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 2, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 6-sinf: Jami 30 soat (+ 1 soat Kelajak soati)
  6: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 4, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz"], defaultHours: 4, prioritySubjectId: "sub_ing" },
    { subjectName: "Qadimgi dunyo tarixi", searchAliases: ["qadimgi dunyo tarixi", "tarix"], defaultHours: 2, prioritySubjectId: "sub_qadimgi_dunyo" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Matematika", searchAliases: ["matematika"], defaultHours: 5, prioritySubjectId: "sub_mat" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Tabiiy fan (Science)", searchAliases: ["tabiiy fan", "science"], defaultHours: 3, prioritySubjectId: "sub_tabiiy" },
    { subjectName: "Musiqa madaniyati", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy san'at"], defaultHours: 1, prioritySubjectId: "sub_sanat" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 2, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 7-sinf: Jami 35 soat (+ 1 soat Kelajak soati)
  7: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 3, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz"], defaultHours: 4, prioritySubjectId: "sub_ing" },
    { subjectName: "O'zbekiston tarixi", searchAliases: ["o'zbekiston tarixi", "o'zb. tarixi"], defaultHours: 2, prioritySubjectId: "sub_ozb_tar" },
    { subjectName: "Jahon tarixi", searchAliases: ["jahon tarixi"], defaultHours: 1, prioritySubjectId: "sub_jahon_tar" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Matematika", searchAliases: ["matematika"], defaultHours: 5, prioritySubjectId: "sub_mat" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika"], defaultHours: 1, prioritySubjectId: "sub_inf" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 2, prioritySubjectId: "sub_fiz" },
    { subjectName: "Kimyo", searchAliases: ["kimyo"], defaultHours: 2, prioritySubjectId: "sub_kim" },
    { subjectName: "Biologiya", searchAliases: ["biologiya"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Geografiya", searchAliases: ["geografiya"], defaultHours: 2, prioritySubjectId: "sub_geo" },
    { subjectName: "Musiqa madaniyati", searchAliases: ["musiqa"], defaultHours: 1, prioritySubjectId: "sub_musiqa" },
    { subjectName: "Tasviriy san'at", searchAliases: ["tasviriy san'at"], defaultHours: 1, prioritySubjectId: "sub_sanat" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 2, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 8-sinf: Jami 33 soat (+ 1 soat Kelajak soati)
  8: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 3, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz"], defaultHours: 3, prioritySubjectId: "sub_ing" },
    { subjectName: "O'zbekiston tarixi", searchAliases: ["o'zbekiston tarixi", "o'zb. tarixi"], defaultHours: 2, prioritySubjectId: "sub_ozb_tar" },
    { subjectName: "Jahon tarixi", searchAliases: ["jahon tarixi"], defaultHours: 1, prioritySubjectId: "sub_jahon_tar" },
    { subjectName: "Davlat va huquq asoslari", searchAliases: ["davlat va huquq", "huquq"], defaultHours: 1, prioritySubjectId: "sub_huquq" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Algebra", searchAliases: ["algebra"], defaultHours: 3, prioritySubjectId: "sub_alg" },
    { subjectName: "Geometriya", searchAliases: ["geometriya"], defaultHours: 2, prioritySubjectId: "sub_geom" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika"], defaultHours: 2, prioritySubjectId: "sub_inf" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 2, prioritySubjectId: "sub_fiz" },
    { subjectName: "Kimyo", searchAliases: ["kimyo"], defaultHours: 2, prioritySubjectId: "sub_kim" },
    { subjectName: "Biologiya", searchAliases: ["biologiya"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Geografiya", searchAliases: ["geografiya"], defaultHours: 2, prioritySubjectId: "sub_geo" },
    { subjectName: "Chizmachilik", searchAliases: ["chizmachilik"], defaultHours: 1, prioritySubjectId: "sub_chiz" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 9-sinf: Jami 34 soat (+ 1 soat Kelajak soati)
  9: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 3, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz"], defaultHours: 3, prioritySubjectId: "sub_ing" },
    { subjectName: "O'zbekiston tarixi", searchAliases: ["o'zbekiston tarixi", "o'zb. tarixi"], defaultHours: 2, prioritySubjectId: "sub_ozb_tar" },
    { subjectName: "Jahon tarixi", searchAliases: ["jahon tarixi"], defaultHours: 1, prioritySubjectId: "sub_jahon_tar" },
    { subjectName: "Davlat va huquq asoslari", searchAliases: ["davlat va huquq", "huquq"], defaultHours: 1, prioritySubjectId: "sub_huquq" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Algebra", searchAliases: ["algebra"], defaultHours: 3, prioritySubjectId: "sub_alg" },
    { subjectName: "Geometriya", searchAliases: ["geometriya"], defaultHours: 2, prioritySubjectId: "sub_geom" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika"], defaultHours: 2, prioritySubjectId: "sub_inf" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 2, prioritySubjectId: "sub_fiz" },
    { subjectName: "Kimyo", searchAliases: ["kimyo"], defaultHours: 2, prioritySubjectId: "sub_kim" },
    { subjectName: "Biologiya", searchAliases: ["biologiya"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Geografiya", searchAliases: ["geografiya"], defaultHours: 2, prioritySubjectId: "sub_geo" },
    { subjectName: "Chizmachilik", searchAliases: ["chizmachilik"], defaultHours: 1, prioritySubjectId: "sub_chiz" },
    { subjectName: "Texnologiya", searchAliases: ["texnologiya"], defaultHours: 1, prioritySubjectId: "sub_texno" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 10-sinf: Jami 31 soat (+ 1 soat Kelajak soati)
  10: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 2, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz"], defaultHours: 2, prioritySubjectId: "sub_ing" },
    { subjectName: "O'zbekiston tarixi", searchAliases: ["o'zbekiston tarixi", "o'zb. tarixi"], defaultHours: 1, prioritySubjectId: "sub_ozb_tar" },
    { subjectName: "Jahon tarixi", searchAliases: ["jahon tarixi"], defaultHours: 1, prioritySubjectId: "sub_jahon_tar" },
    { subjectName: "Davlat va huquq asoslari", searchAliases: ["davlat va huquq", "huquq"], defaultHours: 1, prioritySubjectId: "sub_huquq" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Algebra", searchAliases: ["algebra"], defaultHours: 3, prioritySubjectId: "sub_alg" },
    { subjectName: "Geometriya", searchAliases: ["geometriya"], defaultHours: 2, prioritySubjectId: "sub_geom" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika"], defaultHours: 2, prioritySubjectId: "sub_inf" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 2, prioritySubjectId: "sub_fiz" },
    { subjectName: "Kimyo", searchAliases: ["kimyo"], defaultHours: 2, prioritySubjectId: "sub_kim" },
    { subjectName: "Biologiya", searchAliases: ["biologiya"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Geografiya", searchAliases: ["geografiya"], defaultHours: 2, prioritySubjectId: "sub_geo" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "CHQBT", searchAliases: ["chqbt", "chaqiruvga qadar", "harbiy"], defaultHours: 2, prioritySubjectId: "sub_chqbt" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
  ],

  // 11-sinf: Jami 31 soat (+ 1 soat Kelajak soati)
  11: [
    { subjectName: "Ona tili", searchAliases: ["ona tili"], defaultHours: 2, prioritySubjectId: "sub_ona" },
    { subjectName: "Adabiyot", searchAliases: ["adabiyot"], defaultHours: 2, prioritySubjectId: "sub_adab" },
    { subjectName: "Rus tili", searchAliases: ["rus tili"], defaultHours: 2, prioritySubjectId: "sub_rus" },
    { subjectName: "Chet tili", searchAliases: ["chet tili", "ingliz"], defaultHours: 2, prioritySubjectId: "sub_ing" },
    { subjectName: "O'zbekiston tarixi", searchAliases: ["o'zbekiston tarixi", "o'zb. tarixi"], defaultHours: 1, prioritySubjectId: "sub_ozb_tar" },
    { subjectName: "Jahon tarixi", searchAliases: ["jahon tarixi"], defaultHours: 1, prioritySubjectId: "sub_jahon_tar" },
    { subjectName: "Davlat va huquq asoslari", searchAliases: ["davlat va huquq", "huquq"], defaultHours: 1, prioritySubjectId: "sub_huquq" },
    { subjectName: "Tarbiya", searchAliases: ["tarbiya"], defaultHours: 1, prioritySubjectId: "sub_tarbiya" },
    { subjectName: "Algebra", searchAliases: ["algebra"], defaultHours: 3, prioritySubjectId: "sub_alg" },
    { subjectName: "Geometriya", searchAliases: ["geometriya"], defaultHours: 2, prioritySubjectId: "sub_geom" },
    { subjectName: "Informatika va axborot texnologiyalari", searchAliases: ["informatika"], defaultHours: 2, prioritySubjectId: "sub_inf" },
    { subjectName: "Fizika", searchAliases: ["fizika"], defaultHours: 2, prioritySubjectId: "sub_fiz" },
    { subjectName: "Astronomiya", searchAliases: ["astronomiya"], defaultHours: 1, prioritySubjectId: "sub_astronomiya" },
    { subjectName: "Kimyo", searchAliases: ["kimyo"], defaultHours: 2, prioritySubjectId: "sub_kim" },
    { subjectName: "Biologiya", searchAliases: ["biologiya"], defaultHours: 2, prioritySubjectId: "sub_bio" },
    { subjectName: "Tadbirkorlik asoslari", searchAliases: ["tadbirkorlik", "iqtisodiyot"], defaultHours: 1, prioritySubjectId: "sub_tadbirkor" },
    { subjectName: "Jismoniy tarbiya", searchAliases: ["jismoniy"], defaultHours: 2, prioritySubjectId: "sub_jism" },
    { subjectName: "CHQBT", searchAliases: ["chqbt", "chaqiruvga qadar", "harbiy"], defaultHours: 2, prioritySubjectId: "sub_chqbt" },
    { subjectName: "Kelajak soati", searchAliases: ["kelajak soati", "kelajak", "sinf soati"], defaultHours: 1, prioritySubjectId: "sub_sinf_soati" },
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
  allTeachers: Teacher[],
  workloadTracker?: Map<string, number>
): ClassSubject[] {
  const normalizedGrade = Math.max(1, Math.min(11, grade || 5));
  const template = UZBEKISTAN_STANDARD_CURRICULUM[normalizedGrade] || UZBEKISTAN_STANDARD_CURRICULUM[5];

  const result: ClassSubject[] = [];
  const localTracker = workloadTracker || new Map<string, number>();

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

    // Mos fanni o'tadigan o'qituvchini dinamik (Least-Loaded Dynamic Balancing) usulida topish
    if (!assignedTeacherId && allTeachers.length > 0) {
      // 1-navbatda: fanni o'tadigan mutaxassis ustozlar
      const suitableTeachers = allTeachers.filter((t) =>
        t.subjectIds?.includes(matchedSubject!.id)
      );

      const candidatePool = suitableTeachers.length > 0 ? suitableTeachers : allTeachers;

      // Eng kam yuklama olgan va stavkasidan (20 soat) oshmagan ustozni tanlash
      let bestTeacher = candidatePool[0];
      let minLoad = Infinity;

      for (const teacher of candidatePool) {
        const currentLoad = localTracker.get(teacher.id) || 0;
        const capacity = teacher.weeklyHourCapacity || 20;

        // Agar stavkadan oshmagan bo'lsa ustunlik beriladi
        const effectiveScore = currentLoad + (currentLoad >= capacity ? 1000 : 0);

        if (effectiveScore < minLoad) {
          minLoad = effectiveScore;
          bestTeacher = teacher;
        }
      }

      assignedTeacherId = bestTeacher.id;
    }

    // Tracker yuklamasini yangilash
    if (assignedTeacherId) {
      const cur = localTracker.get(assignedTeacherId) || 0;
      localTracker.set(assignedTeacherId, cur + item.defaultHours);
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
export function isPrimarySubject(subject: Subject): boolean {
  if (subject.isActive === false) return false;
  const name = subject.name.toLowerCase();
  const id = subject.id.toLowerCase();
  const isHighOnly = HIGH_SCHOOL_ONLY_KEYWORDS.some(
    (kw) => name.includes(kw) || id.includes(kw)
  );
  return !isHighOnly;
}

export function isHighSchoolSubject(subject: Subject): boolean {
  if (subject.isActive === false) return false;
  const name = subject.name.toLowerCase();
  if (
    name.includes("o'qish savodxonligi") ||
    name.includes("savodxonlik") ||
    name.includes("atrofimizdagi olam")
  ) {
    return false;
  }
  return true;
}

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

/**
 * =====================================================================
 * O'zbekiston Respublikasi MMTV 133-sonli Rasmiy Tayanch O'quv Rejasi
 * (2026-2027 o'quv yili standarti)
 * 1-Ilova: O'zbek tili ta'limi
 * 2-Ilova: Rus tili ta'limi
 * =====================================================================
 */
export interface MMTV133Row {
  direction: string; // Yo'nalish
  subjectName: string;
  hoursByGrade: number[]; // [1-sinf, 2-sinf, ..., 11-sinf]
  canSplit: boolean;
  splitMinGrade?: number;
  splitMaxGrade?: number;
}

export const MMTV_133_UZBEK_MEDIUM: MMTV133Row[] = [
  { direction: "Filologiya", subjectName: "Ona tili", hoursByGrade: [4, 4, 4, 4, 4, 4, 3, 3, 3, 2, 2], canSplit: false },
  { direction: "Filologiya", subjectName: "O'qish savodxonligi", hoursByGrade: [4, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0], canSplit: false },
  { direction: "Filologiya", subjectName: "Adabiyot", hoursByGrade: [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2], canSplit: false },
  { direction: "Filologiya", subjectName: "Rus tili", hoursByGrade: [0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], canSplit: true, splitMinGrade: 2, splitMaxGrade: 11 },
  { direction: "Filologiya", subjectName: "Chet tili (Ingliz tili)", hoursByGrade: [1, 2, 2, 2, 4, 4, 4, 3, 3, 2, 2], canSplit: true, splitMinGrade: 1, splitMaxGrade: 11 },
  { direction: "Ijtimoiy fanlar", subjectName: "Tarix", hoursByGrade: [0, 0, 0, 0, 2, 2, 3, 3, 3, 2, 2], canSplit: false },
  { direction: "Ijtimoiy fanlar", subjectName: "Davlat va huquq asoslari", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1], canSplit: false },
  { direction: "Ijtimoiy fanlar", subjectName: "Tarbiya", hoursByGrade: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], canSplit: false },
  { direction: "Aniq fanlar", subjectName: "Matematika", hoursByGrade: [5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0], canSplit: false },
  { direction: "Aniq fanlar", subjectName: "Algebra", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3], canSplit: false },
  { direction: "Aniq fanlar", subjectName: "Geometriya", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2], canSplit: false },
  { direction: "Aniq fanlar", subjectName: "Informatika va AT", hoursByGrade: [1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2], canSplit: true, splitMinGrade: 5, splitMaxGrade: 11 },
  { direction: "Tabiiy fanlar", subjectName: "Fizika", hoursByGrade: [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Astronomiya", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Kimyo", hoursByGrade: [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Biologiya", hoursByGrade: [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Geografiya", hoursByGrade: [0, 0, 0, 0, 0, 0, 2, 1.5, 1.5, 2, 0], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Iqtisodiy bilim asoslari", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0, 0], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Tadbirkorlik asoslari", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Tabiiy fan (Science)", hoursByGrade: [1, 1, 1, 1, 2, 3, 0, 0, 0, 0, 0], canSplit: false },
  { direction: "Amaliy fanlar", subjectName: "Musiqa madaniyati", hoursByGrade: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], canSplit: false },
  { direction: "Amaliy fanlar", subjectName: "Tasviriy san'at", hoursByGrade: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], canSplit: false },
  { direction: "Amaliy fanlar", subjectName: "Chizmachilik", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0], canSplit: false },
  { direction: "Amaliy fanlar", subjectName: "Texnologiya (Mehnat)", hoursByGrade: [1, 1, 1, 1, 2, 2, 2, 1, 1, 0, 0], canSplit: true, splitMinGrade: 5, splitMaxGrade: 9 },
  { direction: "Amaliy fanlar", subjectName: "Jismoniy tarbiya", hoursByGrade: [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], canSplit: false },
  { direction: "Amaliy fanlar", subjectName: "CHQBT", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2], canSplit: true, splitMinGrade: 10, splitMaxGrade: 11 },
  { direction: "Majburiy", subjectName: "Kelajak soati", hoursByGrade: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], canSplit: false },
];

export const MMTV_133_RUSSIAN_MEDIUM: MMTV133Row[] = [
  { direction: "Filologiya", subjectName: "Ona tili (Rus tili)", hoursByGrade: [4, 4, 4, 4, 3, 3, 2, 2, 2, 1, 1], canSplit: false },
  { direction: "Filologiya", subjectName: "O'qish savodxonligi", hoursByGrade: [4, 3, 3, 3, 0, 0, 0, 0, 0, 0, 0], canSplit: false },
  { direction: "Filologiya", subjectName: "Adabiyot", hoursByGrade: [0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2], canSplit: false },
  { direction: "Filologiya", subjectName: "Davlat tili (O'zbek tili)", hoursByGrade: [0, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3], canSplit: true, splitMinGrade: 2, splitMaxGrade: 11 },
  { direction: "Filologiya", subjectName: "Chet tili (Ingliz tili)", hoursByGrade: [1, 2, 2, 2, 4, 4, 4, 3, 3, 2, 2], canSplit: true, splitMinGrade: 1, splitMaxGrade: 11 },
  { direction: "Ijtimoiy fanlar", subjectName: "Tarix", hoursByGrade: [0, 0, 0, 0, 2, 2, 2, 3, 3, 2, 2], canSplit: false },
  { direction: "Ijtimoiy fanlar", subjectName: "Davlat va huquq asoslari", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1], canSplit: false },
  { direction: "Ijtimoiy fanlar", subjectName: "Tarbiya", hoursByGrade: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], canSplit: false },
  { direction: "Aniq fanlar", subjectName: "Matematika", hoursByGrade: [5, 5, 5, 5, 5, 5, 5, 0, 0, 0, 0], canSplit: false },
  { direction: "Aniq fanlar", subjectName: "Algebra", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3], canSplit: false },
  { direction: "Aniq fanlar", subjectName: "Geometriya", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2], canSplit: false },
  { direction: "Aniq fanlar", subjectName: "Informatika va AT", hoursByGrade: [1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2], canSplit: true, splitMinGrade: 5, splitMaxGrade: 11 },
  { direction: "Tabiiy fanlar", subjectName: "Fizika", hoursByGrade: [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Kimyo", hoursByGrade: [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Biologiya", hoursByGrade: [0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Geografiya", hoursByGrade: [0, 0, 0, 0, 0, 0, 2, 1.5, 1.5, 2, 0], canSplit: false },
  { direction: "Tabiiy fanlar", subjectName: "Tabiiy fan (Science)", hoursByGrade: [1, 1, 1, 1, 2, 3, 0, 0, 0, 0, 0], canSplit: false },
  { direction: "Amaliy fanlar", subjectName: "Musiqa madaniyati", hoursByGrade: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], canSplit: false },
  { direction: "Amaliy fanlar", subjectName: "Tasviriy san'at", hoursByGrade: [1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0], canSplit: false },
  { direction: "Amaliy fanlar", subjectName: "Texnologiya (Mehnat)", hoursByGrade: [1, 1, 1, 1, 2, 2, 2, 1, 1, 0, 0], canSplit: true, splitMinGrade: 5, splitMaxGrade: 9 },
  { direction: "Amaliy fanlar", subjectName: "Jismoniy tarbiya", hoursByGrade: [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2], canSplit: false },
  { direction: "Amaliy fanlar", subjectName: "CHQBT", hoursByGrade: [0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2], canSplit: true, splitMinGrade: 10, splitMaxGrade: 11 },
  { direction: "Majburiy", subjectName: "Kelajak soati", hoursByGrade: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], canSplit: false },
];

/**
 * Sinfdagi o'quvchilar soni 25 va undan ortiq bo'lganda
 * MMTV 133-sonli normativ bo'yicha guruhga bo'linish tavsiyasi
 */
export function checkMMTV133SplitEligibility(
  subjectName: string,
  grade: number,
  studentCount: number = 25
): { eligible: boolean; reason?: string } {
  if (studentCount < 25) {
    return { eligible: false, reason: "O'quvchilar soni 25 dan kam (Bo'linmaydi)" };
  }

  const sLower = subjectName.toLowerCase();

  if (sLower.includes("ingliz") || sLower.includes("chet tili")) {
    return { eligible: true, reason: "133-sonli MMTV: Chet tili 1-11 sinflarda 25+ o'quvchida 2 guruhga bo'linadi" };
  }
  if (sLower.includes("informatika") && grade >= 5) {
    return { eligible: true, reason: "133-sonli MMTV: Informatika 5-11 sinflarda 25+ o'quvchida 2 guruhga bo'linadi" };
  }
  if ((sLower.includes("texnologiya") || sLower.includes("mehnat")) && grade >= 5 && grade <= 9) {
    return { eligible: true, reason: "133-sonli MMTV: Texnologiya 5-9 sinflarda 25+ o'quvchida guruhlarga bo'linadi" };
  }
  if (sLower.includes("rus tili") && grade >= 2) {
    return { eligible: true, reason: "133-sonli MMTV: Rus tili 2-11 sinflarda 25+ o'quvchida guruhlarga bo'linadi" };
  }
  if (sLower.includes("chqbt") && grade >= 10) {
    return { eligible: true, reason: "133-sonli MMTV: CHQBT 10-11 sinflarda harbiy va tibbiy guruhlarga bo'linadi" };
  }

  return { eligible: false };
}

