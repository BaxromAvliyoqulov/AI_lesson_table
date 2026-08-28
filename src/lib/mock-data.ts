import { SchoolInfo, Branch, Shift, Subject, Teacher, Room, SchoolClass } from "@/types";

export const initialSchools: SchoolInfo[] = [
  { id: "school_39", name: "39-Umumiy o'rta ta'lim maktabi", slug: "maktab-39", branchesCount: 1, classesCount: 22, teachersCount: 25 },
  { id: "school_21", name: "21-Umumiy o'rta ta'lim maktabi", slug: "maktab-21", branchesCount: 2, classesCount: 22, teachersCount: 25 },
];

export const initialBranches: Branch[] = [
  { id: "b39_1", schoolId: "school_39", name: "39-Maktab Asosiy Bino", address: "Toshkent sh., Mirzo Ulug'bek", isMain: true },
  { id: "b21_1", schoolId: "school_21", name: "21-Maktab Bosh Korpus", address: "Toshkent sh., Chilonzor 9", isMain: true },
  { id: "b21_2", schoolId: "school_21", name: "21-Maktab 1-Filial (Boshlang'ich)", address: "Toshkent sh., Chilonzor 10", isMain: false },
];

export const initialShifts: Shift[] = [
  { id: "s39_1", schoolId: "school_39", name: "1-Smena (Ertalabki)", startTime: "08:00", endTime: "13:00", periodsCount: 6 },
  { id: "s39_2", schoolId: "school_39", name: "2-Smena (Tushdan keyin)", startTime: "13:15", endTime: "18:00", periodsCount: 6 },
  { id: "s21_1", schoolId: "school_21", name: "1-Smena", startTime: "08:00", endTime: "13:00", periodsCount: 6 },
];

export const initialRooms: Room[] = [
  { id: "r39_gym1", schoolId: "school_39", branchId: "b39_1", name: "Katta Sport Zali", roomType: "GYM", capacity: 45 },
  { id: "r39_pitch", schoolId: "school_39", branchId: "b39_1", name: "Ochiq Stadion / Maydon", roomType: "OUTDOOR_PITCH", capacity: 60 },
  { id: "r39_comp1", schoolId: "school_39", branchId: "b39_1", name: "1-Informatika Xonasi", roomType: "COMP_LAB", capacity: 30 },
  { id: "r39_comp2", schoolId: "school_39", branchId: "b39_1", name: "2-Informatika Xonasi", roomType: "COMP_LAB", capacity: 30 },
  { id: "r39_lab1", schoolId: "school_39", branchId: "b39_1", name: "Fizika-Kimyo Laboratoriyasi", roomType: "LAB", capacity: 35 },
];

export const initialSubjects: Subject[] = [
  { id: "sub_mat", schoolId: "school_39", name: "Matematika / Algebra", shortName: "Mat", colorTag: "#3B82F6", difficultyScore: 11, allowDoubleLesson: true },
  { id: "sub_geom", schoolId: "school_39", name: "Geometriya", shortName: "Geom", colorTag: "#2563EB", difficultyScore: 10, allowDoubleLesson: false },
  { id: "sub_ona", schoolId: "school_39", name: "Ona tili va Adabiyot", shortName: "Ona tili", colorTag: "#EC4899", difficultyScore: 9, allowDoubleLesson: false },
  { id: "sub_ing", schoolId: "school_39", name: "Ingliz tili (Chet tili)", shortName: "Ingliz", colorTag: "#8B5CF6", difficultyScore: 8, allowDoubleLesson: false },
  { id: "sub_rus", schoolId: "school_39", name: "Rus tili", shortName: "Rus tili", colorTag: "#A855F7", difficultyScore: 8, allowDoubleLesson: false },
  { id: "sub_fiz", schoolId: "school_39", name: "Fizika / Astronomiya", shortName: "Fizika", colorTag: "#06B6D4", difficultyScore: 10, allowDoubleLesson: true, requiresRoomType: "LAB" },
  { id: "sub_kim", schoolId: "school_39", name: "Kimyo", shortName: "Kimyo", colorTag: "#10B981", difficultyScore: 10, allowDoubleLesson: true, requiresRoomType: "LAB" },
  { id: "sub_bio", schoolId: "school_39", name: "Biologiya", shortName: "Bio", colorTag: "#84CC16", difficultyScore: 7, allowDoubleLesson: false },
  { id: "sub_tar", schoolId: "school_39", name: "Tarix (O'zbekiston / Jahon)", shortName: "Tarix", colorTag: "#F59E0B", difficultyScore: 7, allowDoubleLesson: false },
  { id: "sub_geo", schoolId: "school_39", name: "Geografiya", shortName: "Geo", colorTag: "#14B8A6", difficultyScore: 6, allowDoubleLesson: false },
  { id: "sub_inf", schoolId: "school_39", name: "Informatika va AT", shortName: "Info", colorTag: "#6366F1", difficultyScore: 8, allowDoubleLesson: false, requiresRoomType: "COMP_LAB" },
  { id: "sub_jism", schoolId: "school_39", name: "Jismoniy tarbiya", shortName: "Jismoniy", colorTag: "#EF4444", difficultyScore: 2, allowDoubleLesson: false, requiresRoomType: "GYM" },
  { id: "sub_sanat", schoolId: "school_39", name: "Tasviriy san'at / Chizmachilik", shortName: "San'at", colorTag: "#D946EF", difficultyScore: 1, allowDoubleLesson: false },
  { id: "sub_musiqa", schoolId: "school_39", name: "Musiqa madaniyati", shortName: "Musiqa", colorTag: "#F43F5E", difficultyScore: 1, allowDoubleLesson: false },
  { id: "sub_texno", schoolId: "school_39", name: "Texnologiya (Mehnat)", shortName: "Texno", colorTag: "#EA580C", difficultyScore: 3, allowDoubleLesson: true },
  { id: "sub_tarbiya", schoolId: "school_39", name: "Tarbiya", shortName: "Tarbiya", colorTag: "#F97316", difficultyScore: 3, allowDoubleLesson: false },
  { id: "sub_oqish", schoolId: "school_39", name: "O'qish savodxonligi", shortName: "O'qish", colorTag: "#FB7185", difficultyScore: 7, allowDoubleLesson: false },
];

export const initialTeachers: Teacher[] = [
  // Matematika o'qituvchilari
  { id: "t_baxrom", schoolId: "school_39", fullName: "Baxrom Avliyoqulov (Matematika & IT)", phone: "+998 90 000 39 39", weeklyHourCapacity: 26, maxConsecutiveHours: 4, subjectIds: ["sub_mat", "sub_geom", "sub_inf"], branchIds: ["b39_1"] },
  { id: "t_mat2", schoolId: "school_39", fullName: "Qodirova Mahliyo (Matematika)", phone: "+998 91 111 22 33", weeklyHourCapacity: 24, maxConsecutiveHours: 4, subjectIds: ["sub_mat", "sub_geom"], branchIds: ["b39_1"] },
  { id: "t_mat3", schoolId: "school_39", fullName: "Rahmonov Alisher (Matematika)", phone: "+998 93 222 33 44", weeklyHourCapacity: 22, maxConsecutiveHours: 4, subjectIds: ["sub_mat"], branchIds: ["b39_1"] },

  // Ona tili va Adabiyot
  { id: "t_ona1", schoolId: "school_39", fullName: "Sobirova Dilnoza (Ona tili)", phone: "+998 91 390 11 22", weeklyHourCapacity: 24, maxConsecutiveHours: 4, subjectIds: ["sub_ona"], branchIds: ["b39_1"] },
  { id: "t_ona2", schoolId: "school_39", fullName: "Karimova Zilola (Ona tili)", phone: "+998 97 444 55 66", weeklyHourCapacity: 22, maxConsecutiveHours: 4, subjectIds: ["sub_ona"], branchIds: ["b39_1"] },

  // Chet tillari
  { id: "t_ing1", schoolId: "school_39", fullName: "Xudoyberdiyeva Shahnoza (Ingliz)", phone: "+998 97 390 55 66", weeklyHourCapacity: 22, maxConsecutiveHours: 4, subjectIds: ["sub_ing"], branchIds: ["b39_1"] },
  { id: "t_ing2", schoolId: "school_39", fullName: "Azizov Sardor (Ingliz tili)", phone: "+998 94 555 66 77", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_ing"], branchIds: ["b39_1"] },
  { id: "t_rus1", schoolId: "school_39", fullName: "Ivanova Olga (Rus tili)", phone: "+998 90 666 77 88", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_rus"], branchIds: ["b39_1"] },

  // Tabiiy fanlar (Fizika, Kimyo, Bio, Geo)
  { id: "t_fiz1", schoolId: "school_39", fullName: "Rustamov Elyor (Fizika)", phone: "+998 93 390 33 44", weeklyHourCapacity: 22, maxConsecutiveHours: 4, subjectIds: ["sub_fiz"], branchIds: ["b39_1"] },
  { id: "t_kim1", schoolId: "school_39", fullName: "Qodirov Anvar (Kimyo)", phone: "+998 99 390 77 88", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_kim"], branchIds: ["b39_1"] },
  { id: "t_bio1", schoolId: "school_39", fullName: "Rasulova Malika (Biologiya)", phone: "+998 91 777 88 99", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_bio"], branchIds: ["b39_1"] },
  { id: "t_geo1", schoolId: "school_39", fullName: "Yo'ldoshev Otabek (Geografiya)", phone: "+998 93 888 99 00", weeklyHourCapacity: 18, maxConsecutiveHours: 4, subjectIds: ["sub_geo"], branchIds: ["b39_1"] },

  // Ijtimoiy fanlar (Tarix, Tarbiya)
  { id: "t_tar1", schoolId: "school_39", fullName: "Yoqubov Dilshod (Tarix)", phone: "+998 90 390 99 00", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_tar", "sub_tarbiya"], branchIds: ["b39_1"] },

  // Informatika
  { id: "t_inf1", schoolId: "school_39", fullName: "Xolmatov Ilhom (Informatika)", phone: "+998 90 999 00 11", weeklyHourCapacity: 22, maxConsecutiveHours: 4, subjectIds: ["sub_inf"], branchIds: ["b39_1"] },

  // Jismoniy tarbiya & Mehnat
  { id: "t_jism1", schoolId: "school_39", fullName: "Nazarov Sherzod (Jismoniy)", phone: "+998 94 390 12 34", weeklyHourCapacity: 26, maxConsecutiveHours: 5, subjectIds: ["sub_jism"], branchIds: ["b39_1"] },
  { id: "t_jism2", schoolId: "school_39", fullName: "Qurbonov Jasur (Jismoniy)", phone: "+998 93 123 45 67", weeklyHourCapacity: 24, maxConsecutiveHours: 5, subjectIds: ["sub_jism"], branchIds: ["b39_1"] },
  { id: "t_texno1", schoolId: "school_39", fullName: "Hakimov Rustam (Texnologiya/Mehnat)", phone: "+998 97 234 56 78", weeklyHourCapacity: 18, maxConsecutiveHours: 4, subjectIds: ["sub_texno", "sub_sanat"], branchIds: ["b39_1"] },
  { id: "t_musiqa1", schoolId: "school_39", fullName: "Shamsiyeva Gulbahor (Musiqa)", phone: "+998 90 345 67 89", weeklyHourCapacity: 16, maxConsecutiveHours: 4, subjectIds: ["sub_musiqa", "sub_sanat"], branchIds: ["b39_1"] },

  // Boshlang'ich sinf ustozlari (1-4 sinflar)
  { id: "t_bosh1", schoolId: "school_39", fullName: "Mirzayeva Gulnoza (1-A rahbari)", phone: "+998 90 777 11 22", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_mat", "sub_ona", "sub_oqish", "sub_tarbiya"], branchIds: ["b39_1"] },
  { id: "t_bosh2", schoolId: "school_39", fullName: "Usmonova Munira (1-B rahbari)", phone: "+998 91 888 22 33", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_mat", "sub_ona", "sub_oqish", "sub_tarbiya"], branchIds: ["b39_1"] },
  { id: "t_bosh3", schoolId: "school_39", fullName: "Ergasheva Dilfuza (2-A rahbari)", phone: "+998 93 999 33 44", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_mat", "sub_ona", "sub_oqish", "sub_tarbiya"], branchIds: ["b39_1"] },
  { id: "t_bosh4", schoolId: "school_39", fullName: "Tolipova Nodira (2-B rahbari)", phone: "+998 94 000 44 55", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_mat", "sub_ona", "sub_oqish", "sub_tarbiya"], branchIds: ["b39_1"] },
  { id: "t_bosh5", schoolId: "school_39", fullName: "Ahmedova Shahida (3-A rahbari)", phone: "+998 97 111 55 66", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_mat", "sub_ona", "sub_oqish", "sub_tarbiya"], branchIds: ["b39_1"] },
  { id: "t_bosh6", schoolId: "school_39", fullName: "Zokirova Nargiza (3-B rahbari)", phone: "+998 99 222 66 77", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_mat", "sub_ona", "sub_oqish", "sub_tarbiya"], branchIds: ["b39_1"] },
  { id: "t_bosh7", schoolId: "school_39", fullName: "Boboyeva Kamola (4-A rahbari)", phone: "+998 90 333 77 88", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_mat", "sub_ona", "sub_oqish", "sub_tarbiya"], branchIds: ["b39_1"] },
  { id: "t_bosh8", schoolId: "school_39", fullName: "Davlatova Feruza (4-B rahbari)", phone: "+998 91 444 88 99", weeklyHourCapacity: 20, maxConsecutiveHours: 4, subjectIds: ["sub_mat", "sub_ona", "sub_oqish", "sub_tarbiya"], branchIds: ["b39_1"] },
];

// Helper: 1-A dan 11-B gacha 22 ta sinfni to'liq tarifikatsiya bilan shakllantirish
const generateFull22Classes = (schoolId: string, branchId: string, shiftId: string): SchoolClass[] => {
  const classesList: SchoolClass[] = [];

  const GRADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const LETTERS = ["A", "B"];

  for (const grade of GRADES) {
    for (const letter of LETTERS) {
      const name = `${grade}-${letter}`;
      const id = `c_${schoolId}_${grade}${letter.toLowerCase()}`;
      const isPrimary = grade <= 4;

      let subjectsList: { subjectId: string; teacherId: string; weeklyHours: number }[] = [];

      if (grade === 1) {
        const teacherId = letter === "A" ? "t_bosh1" : "t_bosh2";
        subjectsList = [
          { subjectId: "sub_mat", teacherId, weeklyHours: 4 },
          { subjectId: "sub_ona", teacherId, weeklyHours: 4 },
          { subjectId: "sub_oqish", teacherId, weeklyHours: 3 },
          { subjectId: "sub_tarbiya", teacherId, weeklyHours: 1 },
          { subjectId: "sub_ing", teacherId: letter === "A" ? "t_ing1" : "t_ing2", weeklyHours: 2 },
          { subjectId: "sub_jism", teacherId: "t_jism1", weeklyHours: 2 },
        ];
      } else if (grade === 2) {
        const teacherId = letter === "A" ? "t_bosh3" : "t_bosh4";
        subjectsList = [
          { subjectId: "sub_mat", teacherId, weeklyHours: 4 },
          { subjectId: "sub_ona", teacherId, weeklyHours: 4 },
          { subjectId: "sub_oqish", teacherId, weeklyHours: 3 },
          { subjectId: "sub_tarbiya", teacherId, weeklyHours: 1 },
          { subjectId: "sub_ing", teacherId: letter === "A" ? "t_ing1" : "t_ing2", weeklyHours: 2 },
          { subjectId: "sub_jism", teacherId: "t_jism2", weeklyHours: 2 },
        ];
      } else if (grade === 3) {
        const teacherId = letter === "A" ? "t_bosh5" : "t_bosh6";
        subjectsList = [
          { subjectId: "sub_mat", teacherId, weeklyHours: 5 },
          { subjectId: "sub_ona", teacherId, weeklyHours: 4 },
          { subjectId: "sub_oqish", teacherId, weeklyHours: 3 },
          { subjectId: "sub_tarbiya", teacherId, weeklyHours: 1 },
          { subjectId: "sub_ing", teacherId: letter === "A" ? "t_ing1" : "t_ing2", weeklyHours: 2 },
          { subjectId: "sub_jism", teacherId: "t_jism1", weeklyHours: 2 },
          { subjectId: "sub_musiqa", teacherId: "t_musiqa1", weeklyHours: 1 },
        ];
      } else if (grade === 4) {
        const teacherId = letter === "A" ? "t_bosh7" : "t_bosh8";
        subjectsList = [
          { subjectId: "sub_mat", teacherId, weeklyHours: 5 },
          { subjectId: "sub_ona", teacherId, weeklyHours: 4 },
          { subjectId: "sub_oqish", teacherId, weeklyHours: 3 },
          { subjectId: "sub_tarbiya", teacherId, weeklyHours: 1 },
          { subjectId: "sub_ing", teacherId: letter === "A" ? "t_ing1" : "t_ing2", weeklyHours: 2 },
          { subjectId: "sub_inf", teacherId: "t_inf1", weeklyHours: 1 },
          { subjectId: "sub_jism", teacherId: "t_jism2", weeklyHours: 2 },
        ];
      } else if (grade === 5 || grade === 6) {
        subjectsList = [
          { subjectId: "sub_mat", teacherId: letter === "A" ? "t_mat2" : "t_mat3", weeklyHours: 5 },
          { subjectId: "sub_ona", teacherId: letter === "A" ? "t_ona1" : "t_ona2", weeklyHours: 4 },
          { subjectId: "sub_ing", teacherId: letter === "A" ? "t_ing1" : "t_ing2", weeklyHours: 3 },
          { subjectId: "sub_tar", teacherId: "t_tar1", weeklyHours: 2 },
          { subjectId: "sub_inf", teacherId: "t_inf1", weeklyHours: 1 },
          { subjectId: "sub_bio", teacherId: "t_bio1", weeklyHours: 2 },
          { subjectId: "sub_geo", teacherId: "t_geo1", weeklyHours: 1 },
          { subjectId: "sub_jism", teacherId: letter === "A" ? "t_jism1" : "t_jism2", weeklyHours: 2 },
          { subjectId: "sub_texno", teacherId: "t_texno1", weeklyHours: 1 },
        ];
      } else if (grade === 7 || grade === 8) {
        subjectsList = [
          { subjectId: "sub_mat", teacherId: letter === "A" ? "t_baxrom" : "t_mat2", weeklyHours: 5 },
          { subjectId: "sub_fiz", teacherId: "t_fiz1", weeklyHours: 2 },
          { subjectId: "sub_kim", teacherId: "t_kim1", weeklyHours: 2 },
          { subjectId: "sub_bio", teacherId: "t_bio1", weeklyHours: 2 },
          { subjectId: "sub_ona", teacherId: letter === "A" ? "t_ona1" : "t_ona2", weeklyHours: 4 },
          { subjectId: "sub_ing", teacherId: letter === "A" ? "t_ing1" : "t_ing2", weeklyHours: 3 },
          { subjectId: "sub_tar", teacherId: "t_tar1", weeklyHours: 2 },
          { subjectId: "sub_inf", teacherId: letter === "A" ? "t_baxrom" : "t_inf1", weeklyHours: 1 },
          { subjectId: "sub_jism", teacherId: letter === "A" ? "t_jism1" : "t_jism2", weeklyHours: 2 },
        ];
      } else {
        // 9, 10, 11-sinflar (Yuqori)
        subjectsList = [
          { subjectId: "sub_mat", teacherId: letter === "A" ? "t_baxrom" : "t_mat3", weeklyHours: 5 },
          { subjectId: "sub_fiz", teacherId: "t_fiz1", weeklyHours: 3 },
          { subjectId: "sub_kim", teacherId: "t_kim1", weeklyHours: 2 },
          { subjectId: "sub_bio", teacherId: "t_bio1", weeklyHours: 2 },
          { subjectId: "sub_ona", teacherId: letter === "A" ? "t_ona1" : "t_ona2", weeklyHours: 3 },
          { subjectId: "sub_ing", teacherId: letter === "A" ? "t_ing1" : "t_ing2", weeklyHours: 3 },
          { subjectId: "sub_tar", teacherId: "t_tar1", weeklyHours: 2 },
          { subjectId: "sub_inf", teacherId: letter === "A" ? "t_baxrom" : "t_inf1", weeklyHours: 2 },
          { subjectId: "sub_jism", teacherId: letter === "A" ? "t_jism1" : "t_jism2", weeklyHours: 2 },
        ];
      }

      classesList.push({
        id,
        schoolId,
        branchId,
        shiftId,
        name,
        grade,
        isPrimary,
        subjects: subjectsList.map((s) => ({ ...s, classId: id })),
      });
    }
  }

  return classesList;
};

export const initialClasses: SchoolClass[] = [
  ...generateFull22Classes("school_39", "b39_1", "s39_1"),
  ...generateFull22Classes("school_21", "b21_1", "s21_1"),
];
