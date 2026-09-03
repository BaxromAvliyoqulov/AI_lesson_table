import { SchoolInfo, Branch, Shift, Subject, Teacher, Room, SchoolClass } from "@/types";

export const initialSchools: SchoolInfo[] = [
  {
    "id": "school_39",
    "name": "39-Umumiy o'rta ta'lim maktabi",
    "slug": "maktab-39",
    "region": "Muzrabot tumani",
    "directorName": "M. Ramazonov",
    "vicePrincipalName": "N. Narziqulov",
    "psychologistName": "F.I.Sh",
    "academicYear": "2025 - 2026",
    "approvalDate": "2026-yil 28-mart",
    "branchesCount": 2,
    "classesCount": 25,
    "teachersCount": 48
  },
  {
    "id": "school_21",
    "name": "21-Umumiy o'rta ta'lim maktabi",
    "slug": "maktab-21",
    "region": "Toshkent sh., Chilonzor tumani",
    "directorName": "A. Xoliqov",
    "vicePrincipalName": "S. Rahimov",
    "psychologistName": "N. Karimova",
    "academicYear": "2025 - 2026",
    "approvalDate": "2026-yil 1-sentyabr",
    "branchesCount": 2,
    "classesCount": 22,
    "teachersCount": 25
  }
];

export const initialBranches: Branch[] = [
  {
    "id": "b39_1",
    "schoolId": "school_39",
    "name": "Asosiy Maktab",
    "address": "Muzrabot tumani",
    "isMain": true
  },
  {
    "id": "b39_2",
    "schoolId": "school_39",
    "name": "Filial",
    "address": "Muzrabot tumani",
    "isMain": false
  },
  {
    "id": "b21_1",
    "schoolId": "school_21",
    "name": "21-Maktab Bosh Korpus",
    "address": "Toshkent sh., Chilonzor 9",
    "isMain": true
  }
];

export const initialShifts: Shift[] = [
  {
    "id": "s39_1",
    "schoolId": "school_39",
    "name": "1-Smena (Ertalabki)",
    "startTime": "08:00",
    "endTime": "13:00",
    "periodsCount": 6
  },
  {
    "id": "s39_2",
    "schoolId": "school_39",
    "name": "2-Smena (Tushdan keyin)",
    "startTime": "13:15",
    "endTime": "18:00",
    "periodsCount": 6
  }
];

export const initialRooms: Room[] = [
  {
    "id": "r39_gym1",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "name": "Katta Sport Zali",
    "roomType": "GYM",
    "capacity": 45
  },
  {
    "id": "r39_pitch",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "name": "Ochiq Maydon",
    "roomType": "OUTDOOR_PITCH",
    "capacity": 60
  },
  {
    "id": "r39_comp1",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "name": "Informatika Xonasi",
    "roomType": "COMP_LAB",
    "capacity": 30
  },
  {
    "id": "r39_lab1",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "name": "Kimyo-Biologiya Laboratoriyasi",
    "roomType": "LAB",
    "capacity": 35
  },
  {
    "id": "r39_lab2",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "name": "Fizika Laboratoriyasi",
    "roomType": "LAB",
    "capacity": 35
  }
];

export const initialSubjects: Subject[] = [
  {
    "id": "sub_mat",
    "schoolId": "school_39",
    "name": "Matematika",
    "shortName": "Matematika",
    "colorTag": "#3B82F6",
    "difficultyScore": 11,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 3
  },
  {
    "id": "sub_alg",
    "schoolId": "school_39",
    "name": "Algebra",
    "shortName": "Algebra",
    "colorTag": "#2563EB",
    "difficultyScore": 12,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 3
  },
  {
    "id": "sub_geom",
    "schoolId": "school_39",
    "name": "Geometriya",
    "shortName": "Geometriya",
    "colorTag": "#1D4ED8",
    "difficultyScore": 10,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 3
  },
  {
    "id": "sub_ona",
    "schoolId": "school_39",
    "name": "Ona tili",
    "shortName": "Ona tili",
    "colorTag": "#EC4899",
    "difficultyScore": 9,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 2
  },
  {
    "id": "sub_adab",
    "schoolId": "school_39",
    "name": "Adabiyot",
    "shortName": "Adabiyot",
    "colorTag": "#DB2777",
    "difficultyScore": 8,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 2
  },
  {
    "id": "sub_ing",
    "schoolId": "school_39",
    "name": "Ingliz tili",
    "shortName": "Ingliz tili",
    "colorTag": "#8B5CF6",
    "difficultyScore": 8,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 5
  },
  {
    "id": "sub_rus",
    "schoolId": "school_39",
    "name": "Rus tili",
    "shortName": "Rus tili",
    "colorTag": "#A855F7",
    "difficultyScore": 8,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 2
  },
  {
    "id": "sub_nemis",
    "schoolId": "school_39",
    "name": "Nemis tili",
    "shortName": "Nemis tili",
    "colorTag": "#9333EA",
    "difficultyScore": 8,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 5
  },
  {
    "id": "sub_fransuz",
    "schoolId": "school_39",
    "name": "Fransuz tili",
    "shortName": "Fransuz tili",
    "colorTag": "#7C3AED",
    "difficultyScore": 8,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 5
  },
  {
    "id": "sub_oqish",
    "schoolId": "school_39",
    "name": "O'qish savodxonligi",
    "shortName": "O'qish",
    "colorTag": "#F43F5E",
    "difficultyScore": 7,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 2
  },
  {
    "id": "sub_tabiiy",
    "schoolId": "school_39",
    "name": "Tabiiy fan",
    "shortName": "Tabiiy fan",
    "colorTag": "#059669",
    "difficultyScore": 7,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_fiz",
    "schoolId": "school_39",
    "name": "Fizika",
    "shortName": "Fizika",
    "colorTag": "#06B6D4",
    "difficultyScore": 10,
    "allowDoubleLesson": false,
    "requiresRoomType": "LAB",
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_kim",
    "schoolId": "school_39",
    "name": "Kimyo",
    "shortName": "Kimyo",
    "colorTag": "#10B981",
    "difficultyScore": 10,
    "allowDoubleLesson": false,
    "requiresRoomType": "LAB",
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_bio",
    "schoolId": "school_39",
    "name": "Biologiya",
    "shortName": "Biologiya",
    "colorTag": "#84CC16",
    "difficultyScore": 7,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_geo",
    "schoolId": "school_39",
    "name": "Geografiya",
    "shortName": "Geografiya",
    "colorTag": "#14B8A6",
    "difficultyScore": 6,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 4
  },
  {
    "id": "sub_tar",
    "schoolId": "school_39",
    "name": "Tarix",
    "shortName": "Tarix",
    "colorTag": "#F59E0B",
    "difficultyScore": 7,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 4
  },
  {
    "id": "sub_ozb_tar",
    "schoolId": "school_39",
    "name": "O'zb. Tarixi",
    "shortName": "O'zb. Tarixi",
    "colorTag": "#D97706",
    "difficultyScore": 7,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 4
  },
  {
    "id": "sub_jahon_tar",
    "schoolId": "school_39",
    "name": "Jahon tarixi",
    "shortName": "Jahon tarixi",
    "colorTag": "#B45309",
    "difficultyScore": 7,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 4
  },
  {
    "id": "sub_inf",
    "schoolId": "school_39",
    "name": "Informatika",
    "shortName": "Informatika",
    "colorTag": "#6366F1",
    "difficultyScore": 8,
    "allowDoubleLesson": false,
    "requiresRoomType": "COMP_LAB",
    "methodDayOfWeek": 3
  },
  {
    "id": "sub_jism",
    "schoolId": "school_39",
    "name": "Jismoniy tarbiya",
    "shortName": "Jismoniy",
    "colorTag": "#EF4444",
    "difficultyScore": 2,
    "allowDoubleLesson": false,
    "requiresRoomType": "GYM",
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_sanat",
    "schoolId": "school_39",
    "name": "Tasviriy san'at",
    "shortName": "Tasviriy san'at",
    "colorTag": "#D946EF",
    "difficultyScore": 1,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_chiz",
    "schoolId": "school_39",
    "name": "Chizmachilik",
    "shortName": "Chizmachilik",
    "colorTag": "#C026D3",
    "difficultyScore": 3,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_musiqa",
    "schoolId": "school_39",
    "name": "Musiqa",
    "shortName": "Musiqa",
    "colorTag": "#F43F5E",
    "difficultyScore": 1,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_texno",
    "schoolId": "school_39",
    "name": "Texnologiya",
    "shortName": "Texnologiya",
    "colorTag": "#EA580C",
    "difficultyScore": 3,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_tarbiya",
    "schoolId": "school_39",
    "name": "Tarbiya",
    "shortName": "Tarbiya",
    "colorTag": "#F97316",
    "difficultyScore": 3,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 4
  },
  {
    "id": "sub_iqtisod",
    "schoolId": "school_39",
    "name": "Iqtisod",
    "shortName": "Iqtisod",
    "colorTag": "#10B981",
    "difficultyScore": 4,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 4
  },
  {
    "id": "sub_huquq",
    "schoolId": "school_39",
    "name": "Huquq",
    "shortName": "Huquq",
    "colorTag": "#64748B",
    "difficultyScore": 5,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 4
  },
  {
    "id": "sub_tadbirkor",
    "schoolId": "school_39",
    "name": "Tadbirkorlik",
    "shortName": "Tadbirkorlik",
    "colorTag": "#0D9488",
    "difficultyScore": 4,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 4
  },
  {
    "id": "sub_chqbt",
    "schoolId": "school_39",
    "name": "CHQBT",
    "shortName": "CHQBT",
    "colorTag": "#475569",
    "difficultyScore": 3,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_astronomiya",
    "schoolId": "school_39",
    "name": "Astronomiya",
    "shortName": "Astronomiya",
    "colorTag": "#0284C7",
    "difficultyScore": 6,
    "allowDoubleLesson": false,
    "methodDayOfWeek": 6
  },
  {
    "id": "sub_sinf_soati",
    "schoolId": "school_39",
    "name": "Kelajak soati",
    "shortName": "Kelajak s.",
    "colorTag": "#8B5CF6",
    "difficultyScore": 1,
    "allowDoubleLesson": false
  }
];

export const initialTeachers: Teacher[] = [
  {
    "id": "t_1",
    "schoolId": "school_39",
    "fullName": "Suroyev Axmad",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_alg",
      "sub_geom"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_2",
    "schoolId": "school_39",
    "fullName": "Egamshukurov Xolmexmor",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_bio",
      "sub_kim"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_3",
    "schoolId": "school_39",
    "fullName": "Sayqonov Abdumalik",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_alg",
      "sub_geom"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_4",
    "schoolId": "school_39",
    "fullName": "Ortig'ov Muzaffar",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_rus"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_5",
    "schoolId": "school_39",
    "fullName": "Abdurahimova Sevinch",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_ona",
      "sub_adab"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_6",
    "schoolId": "school_39",
    "fullName": "Achurov Shamsiddin",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_tar"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_7",
    "schoolId": "school_39",
    "fullName": "Bo'riyeva Oyqul",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_7a",
    "subjectIds": [
      "sub_jism",
      "sub_tar",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_8",
    "schoolId": "school_39",
    "fullName": "Muhammadiyeva Zebiniso",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_6a",
    "subjectIds": [
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_9",
    "schoolId": "school_39",
    "fullName": "Normatov Toshmuhammad",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_chqbt"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_10",
    "schoolId": "school_39",
    "fullName": "Eshqurbonov Bozor",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_kim"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_11",
    "schoolId": "school_39",
    "fullName": "Suxrobov Alisher",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_alg",
      "sub_geom"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_12",
    "schoolId": "school_39",
    "fullName": "Nabiyev Sirojiddin",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_mat"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_13",
    "schoolId": "school_39",
    "fullName": "Mo'minov Safar",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_5b",
    "subjectIds": [
      "sub_sanat",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_14",
    "schoolId": "school_39",
    "fullName": "Tursunova Oytul",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_11a",
    "subjectIds": [
      "sub_tabiiy",
      "sub_bio",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_15",
    "schoolId": "school_39",
    "fullName": "Rustamova Xavriniso",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_6b",
    "subjectIds": [
      "sub_tabiiy",
      "sub_geo",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_16",
    "schoolId": "school_39",
    "fullName": "Salomov Nuom",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_8a",
    "subjectIds": [
      "sub_ona",
      "sub_adab",
      "sub_tar",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_17",
    "schoolId": "school_39",
    "fullName": "Azizova Nilufar",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_ona",
      "sub_adab"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_18",
    "schoolId": "school_39",
    "fullName": "Mamayusupova Dilfura",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_8b",
    "subjectIds": [
      "sub_fiz",
      "sub_ona",
      "sub_astronomiya",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_19",
    "schoolId": "school_39",
    "fullName": "Gulmurodov Shuxrat",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_inf",
      "sub_texno",
      "sub_ona"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_20",
    "schoolId": "school_39",
    "fullName": "Toshboyev Oybek",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_inf"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_21",
    "schoolId": "school_39",
    "fullName": "Safarov Otabek",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_7b",
    "subjectIds": [
      "sub_jism",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_22",
    "schoolId": "school_39",
    "fullName": "Egamov Nodir",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_9a",
    "subjectIds": [
      "sub_ozb_tar",
      "sub_jahon_tar",
      "sub_tarbiya",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_23",
    "schoolId": "school_39",
    "fullName": "Boyqobilov Asatillo",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_ozb_tar",
      "sub_jahon_tar"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_24",
    "schoolId": "school_39",
    "fullName": "Narziqov Farxod",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_ozb_tar",
      "sub_jahon_tar",
      "sub_huquq"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_25",
    "schoolId": "school_39",
    "fullName": "Xolyorova Matluba",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_10b",
    "subjectIds": [
      "sub_tar",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_26",
    "schoolId": "school_39",
    "fullName": "Islomov Sayfiddin",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_mat"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_27",
    "schoolId": "school_39",
    "fullName": "Qurbonaliyeva Nigora",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_6d",
    "subjectIds": [
      "sub_musiqa",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_28",
    "schoolId": "school_39",
    "fullName": "Raximov Jo'rabek",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_10a",
    "subjectIds": [
      "sub_sanat",
      "sub_chiz",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_29",
    "schoolId": "school_39",
    "fullName": "Sagirov Rustam",
    "weeklyHourCapacity": 26,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_5a",
    "subjectIds": [
      "sub_ona",
      "sub_adab",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_30",
    "schoolId": "school_39",
    "fullName": "Muxammadiyev Baxtiyor",
    "weeklyHourCapacity": 26,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_11b",
    "subjectIds": [
      "sub_mat",
      "sub_alg",
      "sub_geom",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_31",
    "schoolId": "school_39",
    "fullName": "Raximov Qaxramon",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_tar",
      "sub_tarbiya"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_32",
    "schoolId": "school_39",
    "fullName": "To'layeva O'g'ilshod",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_9b",
    "subjectIds": [
      "sub_geo",
      "sub_iqtisod",
      "sub_tadbirkor",
      "sub_ing",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_33",
    "schoolId": "school_39",
    "fullName": "Islomov Botir",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_ing"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_34",
    "schoolId": "school_39",
    "fullName": "Sayfullayeva Qizlarbas",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_fiz"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_35",
    "schoolId": "school_39",
    "fullName": "Xudoyorov Sadriddin",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_7d",
    "subjectIds": [
      "sub_mat",
      "sub_alg",
      "sub_geom",
      "sub_geo",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_36",
    "schoolId": "school_39",
    "fullName": "Boboyev Abdumalik",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_rus"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_37",
    "schoolId": "school_39",
    "fullName": "Avliyoqulov Baxrom",
    "weeklyHourCapacity": 26,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_alg",
      "sub_geom",
      "sub_ing"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_38",
    "schoolId": "school_39",
    "fullName": "Toshboyev Daler",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_ing"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_39",
    "schoolId": "school_39",
    "fullName": "Ergashov Shahzod",
    "weeklyHourCapacity": 22,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_jism"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_40",
    "schoolId": "school_39",
    "fullName": "Hamdamova Umida",
    "weeklyHourCapacity": 24,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_5d",
    "subjectIds": [
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_1"
    ]
  },
  {
    "id": "t_41",
    "schoolId": "school_39",
    "fullName": "Mirzayeva Gulnoza",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_1a",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_42",
    "schoolId": "school_39",
    "fullName": "Usmonova Munira",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_1b",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_43",
    "schoolId": "school_39",
    "fullName": "Ergasheva Dilfuza",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_2a",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_44",
    "schoolId": "school_39",
    "fullName": "Tolipova Nodira",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_2b",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_45",
    "schoolId": "school_39",
    "fullName": "Ahmedova Shahida",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_3a",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_46",
    "schoolId": "school_39",
    "fullName": "Zokirova Nargiza",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_3b",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_47",
    "schoolId": "school_39",
    "fullName": "Boboyeva Kamola",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_4a",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_48",
    "schoolId": "school_39",
    "fullName": "Davlatova Feruza",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_4b",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_49",
    "schoolId": "school_39",
    "fullName": "Xamidova Shahnoza",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_1d",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_50",
    "schoolId": "school_39",
    "fullName": "Karimova Nilufar",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_2d",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_51",
    "schoolId": "school_39",
    "fullName": "Yo'ldosheva Go'zal",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_3d",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_52",
    "schoolId": "school_39",
    "fullName": "Saidova Dilnoza",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "homeroomClassId": "c_39_4d",
    "subjectIds": [
      "sub_mat",
      "sub_ona",
      "sub_sinf_soati"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_53",
    "schoolId": "school_39",
    "fullName": "Qodirov Sardor",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_ing"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_54",
    "schoolId": "school_39",
    "fullName": "Mamatov Sherzod",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_jism"
    ],
    "branchIds": [
      "b39_2"
    ]
  },
  {
    "id": "t_55",
    "schoolId": "school_39",
    "fullName": "Norboyev Javlon",
    "weeklyHourCapacity": 20,
    "maxConsecutiveHours": 4,
    "subjectIds": [
      "sub_ing"
    ],
    "branchIds": [
      "b39_1"
    ]
  }
];

export const initialClasses: SchoolClass[] = [
  {
    "id": "c_39_1a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "1-A",
    "grade": 1,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_41",
    "subjects": [
      {
        "classId": "c_39_1a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_41",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_1a",
        "subjectId": "sub_mat",
        "teacherId": "t_41",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_1a",
        "subjectId": "sub_ona",
        "teacherId": "t_41",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_1a",
        "subjectId": "sub_adab",
        "teacherId": "t_41",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_1a",
        "subjectId": "sub_ing",
        "teacherId": "t_38",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_1a",
        "subjectId": "sub_jism",
        "teacherId": "t_39",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_1a",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_41",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_1b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "1-B",
    "grade": 1,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_42",
    "subjects": [
      {
        "classId": "c_39_1b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_42",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_1b",
        "subjectId": "sub_mat",
        "teacherId": "t_42",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_1b",
        "subjectId": "sub_ona",
        "teacherId": "t_42",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_1b",
        "subjectId": "sub_adab",
        "teacherId": "t_42",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_1b",
        "subjectId": "sub_ing",
        "teacherId": "t_38",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_1b",
        "subjectId": "sub_jism",
        "teacherId": "t_39",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_1b",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_42",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_2a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "2-A",
    "grade": 2,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_43",
    "subjects": [
      {
        "classId": "c_39_2a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_43",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_2a",
        "subjectId": "sub_mat",
        "teacherId": "t_43",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_2a",
        "subjectId": "sub_ona",
        "teacherId": "t_43",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_2a",
        "subjectId": "sub_adab",
        "teacherId": "t_43",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_2a",
        "subjectId": "sub_ing",
        "teacherId": "t_38",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_2a",
        "subjectId": "sub_jism",
        "teacherId": "t_39",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_2a",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_43",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_2b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "2-B",
    "grade": 2,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_44",
    "subjects": [
      {
        "classId": "c_39_2b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_44",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_2b",
        "subjectId": "sub_mat",
        "teacherId": "t_44",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_2b",
        "subjectId": "sub_ona",
        "teacherId": "t_44",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_2b",
        "subjectId": "sub_adab",
        "teacherId": "t_44",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_2b",
        "subjectId": "sub_ing",
        "teacherId": "t_38",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_2b",
        "subjectId": "sub_jism",
        "teacherId": "t_39",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_2b",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_44",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_3a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "3-A",
    "grade": 3,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_45",
    "subjects": [
      {
        "classId": "c_39_3a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_45",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_3a",
        "subjectId": "sub_mat",
        "teacherId": "t_45",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_3a",
        "subjectId": "sub_ona",
        "teacherId": "t_45",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_3a",
        "subjectId": "sub_adab",
        "teacherId": "t_45",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_3a",
        "subjectId": "sub_ing",
        "teacherId": "t_38",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_3a",
        "subjectId": "sub_jism",
        "teacherId": "t_39",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_3a",
        "subjectId": "sub_musiqa",
        "teacherId": "t_27",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_3a",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_45",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_3b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "3-B",
    "grade": 3,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_46",
    "subjects": [
      {
        "classId": "c_39_3b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_46",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_3b",
        "subjectId": "sub_mat",
        "teacherId": "t_46",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_3b",
        "subjectId": "sub_ona",
        "teacherId": "t_46",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_3b",
        "subjectId": "sub_adab",
        "teacherId": "t_46",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_3b",
        "subjectId": "sub_ing",
        "teacherId": "t_38",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_3b",
        "subjectId": "sub_jism",
        "teacherId": "t_39",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_3b",
        "subjectId": "sub_musiqa",
        "teacherId": "t_27",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_3b",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_46",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_4a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "4-A",
    "grade": 4,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_47",
    "subjects": [
      {
        "classId": "c_39_4a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_47",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_4a",
        "subjectId": "sub_mat",
        "teacherId": "t_47",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_4a",
        "subjectId": "sub_ona",
        "teacherId": "t_47",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_4a",
        "subjectId": "sub_adab",
        "teacherId": "t_47",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_4a",
        "subjectId": "sub_ing",
        "teacherId": "t_38",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_4a",
        "subjectId": "sub_inf",
        "teacherId": "t_19",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_4a",
        "subjectId": "sub_jism",
        "teacherId": "t_39",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_4a",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_47",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_4b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "4-B",
    "grade": 4,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_48",
    "subjects": [
      {
        "classId": "c_39_4b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_48",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_4b",
        "subjectId": "sub_mat",
        "teacherId": "t_48",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_4b",
        "subjectId": "sub_ona",
        "teacherId": "t_48",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_4b",
        "subjectId": "sub_adab",
        "teacherId": "t_48",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_4b",
        "subjectId": "sub_ing",
        "teacherId": "t_38",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_4b",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_4b",
        "subjectId": "sub_jism",
        "teacherId": "t_39",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_4b",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_48",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_1d",
    "schoolId": "school_39",
    "branchId": "b39_2",
    "shiftId": "s39_1",
    "name": "1-D",
    "grade": 1,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_49",
    "subjects": [
      {
        "classId": "c_39_1d",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_49",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_1d",
        "subjectId": "sub_mat",
        "teacherId": "t_49",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_1d",
        "subjectId": "sub_ona",
        "teacherId": "t_49",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_1d",
        "subjectId": "sub_adab",
        "teacherId": "t_49",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_1d",
        "subjectId": "sub_ing",
        "teacherId": "t_53",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_1d",
        "subjectId": "sub_jism",
        "teacherId": "t_54",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_1d",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_49",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_2d",
    "schoolId": "school_39",
    "branchId": "b39_2",
    "shiftId": "s39_1",
    "name": "2-D",
    "grade": 2,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_50",
    "subjects": [
      {
        "classId": "c_39_2d",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_50",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_2d",
        "subjectId": "sub_mat",
        "teacherId": "t_50",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_2d",
        "subjectId": "sub_ona",
        "teacherId": "t_50",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_2d",
        "subjectId": "sub_adab",
        "teacherId": "t_50",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_2d",
        "subjectId": "sub_ing",
        "teacherId": "t_53",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_2d",
        "subjectId": "sub_jism",
        "teacherId": "t_54",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_2d",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_50",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_3d",
    "schoolId": "school_39",
    "branchId": "b39_2",
    "shiftId": "s39_1",
    "name": "3-D",
    "grade": 3,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_51",
    "subjects": [
      {
        "classId": "c_39_3d",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_51",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_3d",
        "subjectId": "sub_mat",
        "teacherId": "t_51",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_3d",
        "subjectId": "sub_ona",
        "teacherId": "t_51",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_3d",
        "subjectId": "sub_adab",
        "teacherId": "t_51",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_3d",
        "subjectId": "sub_ing",
        "teacherId": "t_53",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_3d",
        "subjectId": "sub_jism",
        "teacherId": "t_54",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_3d",
        "subjectId": "sub_musiqa",
        "teacherId": "t_27",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_3d",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_51",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_4d",
    "schoolId": "school_39",
    "branchId": "b39_2",
    "shiftId": "s39_1",
    "name": "4-D",
    "grade": 4,
    "isPrimary": true,
    "isClosed": false,
    "homeroomTeacherId": "t_52",
    "subjects": [
      {
        "classId": "c_39_4d",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_52",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_4d",
        "subjectId": "sub_mat",
        "teacherId": "t_52",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_4d",
        "subjectId": "sub_ona",
        "teacherId": "t_52",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_4d",
        "subjectId": "sub_adab",
        "teacherId": "t_52",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_4d",
        "subjectId": "sub_ing",
        "teacherId": "t_53",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_4d",
        "subjectId": "sub_inf",
        "teacherId": "t_19",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_4d",
        "subjectId": "sub_jism",
        "teacherId": "t_54",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_4d",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_52",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_5a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "5A",
    "grade": 5,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_29",
    "subjects": [
      {
        "classId": "c_39_5a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_29",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_ona",
        "teacherId": "t_5",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_adab",
        "teacherId": "t_5",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_mat",
        "teacherId": "t_30",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_tabiiy",
        "teacherId": "t_14",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_ing",
        "teacherId": "t_33",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_rus",
        "teacherId": "t_36",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_tar",
        "teacherId": "t_31",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_inf",
        "teacherId": "t_19",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_jism",
        "teacherId": "t_21",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_texno",
        "teacherId": "t_19",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_musiqa",
        "teacherId": "t_27",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_5a",
        "subjectId": "sub_sanat",
        "teacherId": "t_28",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_5b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "5B",
    "grade": 5,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_13",
    "subjects": [
      {
        "classId": "c_39_5b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_13",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_tabiiy",
        "teacherId": "t_14",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_ona",
        "teacherId": "t_5",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_adab",
        "teacherId": "t_5",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_mat",
        "teacherId": "t_30",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_ing",
        "teacherId": "t_33",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_rus",
        "teacherId": "t_36",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_tar",
        "teacherId": "t_16",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_jism",
        "teacherId": "t_21",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_texno",
        "teacherId": "t_19",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_musiqa",
        "teacherId": "t_27",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_5b",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_22",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_5d",
    "schoolId": "school_39",
    "branchId": "b39_2",
    "shiftId": "s39_1",
    "name": "5D",
    "grade": 5,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_40",
    "subjects": [
      {
        "classId": "c_39_5d",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_40",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_mat",
        "teacherId": "t_35",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_ona",
        "teacherId": "t_17",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_adab",
        "teacherId": "t_17",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_tabiiy",
        "teacherId": "t_14",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_ing",
        "teacherId": "t_53",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_rus",
        "teacherId": "t_4",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_tar",
        "teacherId": "t_25",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_jism",
        "teacherId": "t_54",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_texno",
        "teacherId": "t_19",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_5d",
        "subjectId": "sub_musiqa",
        "teacherId": "t_27",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_6a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "6A",
    "grade": 6,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_8",
    "subjects": [
      {
        "classId": "c_39_6a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_8",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_mat",
        "teacherId": "t_30",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_ona",
        "teacherId": "t_5",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_adab",
        "teacherId": "t_5",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_tabiiy",
        "teacherId": "t_15",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_ing",
        "teacherId": "t_33",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_tar",
        "teacherId": "t_31",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_31",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_jism",
        "teacherId": "t_21",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_texno",
        "teacherId": "t_19",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_sanat",
        "teacherId": "t_13",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_6a",
        "subjectId": "sub_musiqa",
        "teacherId": "t_27",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_6b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "6B",
    "grade": 6,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_15",
    "subjects": [
      {
        "classId": "c_39_6b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_15",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_ona",
        "teacherId": "t_5",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_adab",
        "teacherId": "t_5",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_mat",
        "teacherId": "t_35",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_tabiiy",
        "teacherId": "t_15",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_ing",
        "teacherId": "t_33",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_tar",
        "teacherId": "t_7",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_tarbiya",
        "teacherId": "t_7",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_inf",
        "teacherId": "t_19",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_jism",
        "teacherId": "t_21",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_texno",
        "teacherId": "t_19",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6b",
        "subjectId": "sub_musiqa",
        "teacherId": "t_27",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_6d",
    "schoolId": "school_39",
    "branchId": "b39_2",
    "shiftId": "s39_1",
    "name": "6D",
    "grade": 6,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_27",
    "subjects": [
      {
        "classId": "c_39_6d",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_27",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_6d",
        "subjectId": "sub_ona",
        "teacherId": "t_17",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_6d",
        "subjectId": "sub_adab",
        "teacherId": "t_17",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6d",
        "subjectId": "sub_mat",
        "teacherId": "t_35",
        "weeklyHours": 5
      },
      {
        "classId": "c_39_6d",
        "subjectId": "sub_tabiiy",
        "teacherId": "t_15",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_6d",
        "subjectId": "sub_ing",
        "teacherId": "t_53",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_6d",
        "subjectId": "sub_tar",
        "teacherId": "t_25",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6d",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_6d",
        "subjectId": "sub_jism",
        "teacherId": "t_54",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6d",
        "subjectId": "sub_texno",
        "teacherId": "t_19",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_6d",
        "subjectId": "sub_musiqa",
        "teacherId": "t_27",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_7a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "7A",
    "grade": 7,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_7",
    "subjects": [
      {
        "classId": "c_39_7a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_7",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_alg",
        "teacherId": "t_30",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_geom",
        "teacherId": "t_30",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_ona",
        "teacherId": "t_16",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_adab",
        "teacherId": "t_16",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_fiz",
        "teacherId": "t_34",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_kim",
        "teacherId": "t_10",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_bio",
        "teacherId": "t_14",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_geo",
        "teacherId": "t_35",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_ing",
        "teacherId": "t_33",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_rus",
        "teacherId": "t_36",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_7a",
        "subjectId": "sub_jism",
        "teacherId": "t_21",
        "weeklyHours": 2
      }
    ]
  },
  {
    "id": "c_39_7b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "7B",
    "grade": 7,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_21",
    "subjects": [
      {
        "classId": "c_39_7b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_21",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_alg",
        "teacherId": "t_11",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_geom",
        "teacherId": "t_11",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_ona",
        "teacherId": "t_16",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_adab",
        "teacherId": "t_16",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_fiz",
        "teacherId": "t_34",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_kim",
        "teacherId": "t_10",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_bio",
        "teacherId": "t_14",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_geo",
        "teacherId": "t_15",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_ing",
        "teacherId": "t_33",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_rus",
        "teacherId": "t_36",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_7b",
        "subjectId": "sub_jism",
        "teacherId": "t_21",
        "weeklyHours": 2
      }
    ]
  },
  {
    "id": "c_39_7d",
    "schoolId": "school_39",
    "branchId": "b39_2",
    "shiftId": "s39_1",
    "name": "7D",
    "grade": 7,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_35",
    "subjects": [
      {
        "classId": "c_39_7d",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_35",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_alg",
        "teacherId": "t_35",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_geom",
        "teacherId": "t_35",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_ona",
        "teacherId": "t_16",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_adab",
        "teacherId": "t_16",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_fiz",
        "teacherId": "t_34",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_kim",
        "teacherId": "t_10",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_bio",
        "teacherId": "t_14",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_geo",
        "teacherId": "t_35",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_ing",
        "teacherId": "t_53",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_rus",
        "teacherId": "t_4",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_24",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_24",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_inf",
        "teacherId": "t_19",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_7d",
        "subjectId": "sub_jism",
        "teacherId": "t_54",
        "weeklyHours": 2
      }
    ]
  },
  {
    "id": "c_39_8a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "8A",
    "grade": 8,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_16",
    "subjects": [
      {
        "classId": "c_39_8a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_16",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_alg",
        "teacherId": "t_3",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_geom",
        "teacherId": "t_3",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_ona",
        "teacherId": "t_18",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_adab",
        "teacherId": "t_18",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_fiz",
        "teacherId": "t_34",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_kim",
        "teacherId": "t_10",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_bio",
        "teacherId": "t_14",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_geo",
        "teacherId": "t_15",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_ing",
        "teacherId": "t_32",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_rus",
        "teacherId": "t_36",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_23",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_23",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_jism",
        "teacherId": "t_21",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8a",
        "subjectId": "sub_chiz",
        "teacherId": "t_28",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_8b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "8B",
    "grade": 8,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_18",
    "subjects": [
      {
        "classId": "c_39_8b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_18",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_alg",
        "teacherId": "t_3",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_geom",
        "teacherId": "t_3",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_ona",
        "teacherId": "t_18",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_adab",
        "teacherId": "t_18",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_fiz",
        "teacherId": "t_34",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_kim",
        "teacherId": "t_10",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_bio",
        "teacherId": "t_14",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_geo",
        "teacherId": "t_32",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_ing",
        "teacherId": "t_32",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_rus",
        "teacherId": "t_4",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_23",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_23",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_inf",
        "teacherId": "t_19",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_jism",
        "teacherId": "t_21",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_8b",
        "subjectId": "sub_chiz",
        "teacherId": "t_28",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_9a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "9A",
    "grade": 9,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_22",
    "subjects": [
      {
        "classId": "c_39_9a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_22",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_alg",
        "teacherId": "t_37",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_geom",
        "teacherId": "t_37",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_ona",
        "teacherId": "t_19",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_adab",
        "teacherId": "t_19",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_fiz",
        "teacherId": "t_18",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_kim",
        "teacherId": "t_10",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_bio",
        "teacherId": "t_2",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_geo",
        "teacherId": "t_32",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_ing",
        "teacherId": "t_32",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_rus",
        "teacherId": "t_36",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_23",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_23",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_jism",
        "teacherId": "t_7",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_huquq",
        "teacherId": "t_24",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_9a",
        "subjectId": "sub_iqtisod",
        "teacherId": "t_32",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_9b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "9B",
    "grade": 9,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_32",
    "subjects": [
      {
        "classId": "c_39_9b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_32",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_alg",
        "teacherId": "t_37",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_geom",
        "teacherId": "t_37",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_ona",
        "teacherId": "t_19",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_adab",
        "teacherId": "t_19",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_fiz",
        "teacherId": "t_18",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_kim",
        "teacherId": "t_10",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_bio",
        "teacherId": "t_2",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_geo",
        "teacherId": "t_32",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_ing",
        "teacherId": "t_32",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_rus",
        "teacherId": "t_4",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_23",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_23",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_jism",
        "teacherId": "t_7",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_huquq",
        "teacherId": "t_24",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_9b",
        "subjectId": "sub_iqtisod",
        "teacherId": "t_32",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_10a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "10A",
    "grade": 10,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_28",
    "subjects": [
      {
        "classId": "c_39_10a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_28",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_alg",
        "teacherId": "t_1",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_geom",
        "teacherId": "t_1",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_ona",
        "teacherId": "t_29",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_adab",
        "teacherId": "t_29",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_fiz",
        "teacherId": "t_34",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_kim",
        "teacherId": "t_10",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_bio",
        "teacherId": "t_2",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_geo",
        "teacherId": "t_15",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_ing",
        "teacherId": "t_55",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_rus",
        "teacherId": "t_4",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_jism",
        "teacherId": "t_7",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10a",
        "subjectId": "sub_huquq",
        "teacherId": "t_24",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_10b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "10B",
    "grade": 10,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_25",
    "subjects": [
      {
        "classId": "c_39_10b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_25",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_alg",
        "teacherId": "t_1",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_geom",
        "teacherId": "t_1",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_ona",
        "teacherId": "t_29",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_adab",
        "teacherId": "t_29",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_fiz",
        "teacherId": "t_34",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_kim",
        "teacherId": "t_10",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_bio",
        "teacherId": "t_2",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_geo",
        "teacherId": "t_15",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_ing",
        "teacherId": "t_55",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_rus",
        "teacherId": "t_4",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_jism",
        "teacherId": "t_7",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_10b",
        "subjectId": "sub_huquq",
        "teacherId": "t_24",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_11a",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "11A",
    "grade": 11,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_14",
    "subjects": [
      {
        "classId": "c_39_11a",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_14",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_alg",
        "teacherId": "t_37",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_geom",
        "teacherId": "t_37",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_ona",
        "teacherId": "t_29",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_adab",
        "teacherId": "t_29",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_fiz",
        "teacherId": "t_18",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_kim",
        "teacherId": "t_2",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_bio",
        "teacherId": "t_2",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_ing",
        "teacherId": "t_55",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_jism",
        "teacherId": "t_7",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_tadbirkor",
        "teacherId": "t_32",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_chqbt",
        "teacherId": "t_9",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_11a",
        "subjectId": "sub_astronomiya",
        "teacherId": "t_18",
        "weeklyHours": 1
      }
    ]
  },
  {
    "id": "c_39_11b",
    "schoolId": "school_39",
    "branchId": "b39_1",
    "shiftId": "s39_1",
    "name": "11B",
    "grade": 11,
    "isPrimary": false,
    "isClosed": false,
    "homeroomTeacherId": "t_30",
    "subjects": [
      {
        "classId": "c_39_11b",
        "subjectId": "sub_sinf_soati",
        "teacherId": "t_30",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_alg",
        "teacherId": "t_37",
        "weeklyHours": 4
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_geom",
        "teacherId": "t_37",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_ona",
        "teacherId": "t_29",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_adab",
        "teacherId": "t_29",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_fiz",
        "teacherId": "t_18",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_kim",
        "teacherId": "t_2",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_bio",
        "teacherId": "t_2",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_ing",
        "teacherId": "t_55",
        "weeklyHours": 3
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_ozb_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_jahon_tar",
        "teacherId": "t_22",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_inf",
        "teacherId": "t_20",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_jism",
        "teacherId": "t_7",
        "weeklyHours": 2
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_tadbirkor",
        "teacherId": "t_32",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_chqbt",
        "teacherId": "t_9",
        "weeklyHours": 1
      },
      {
        "classId": "c_39_11b",
        "subjectId": "sub_astronomiya",
        "teacherId": "t_18",
        "weeklyHours": 1
      }
    ]
  }
];
