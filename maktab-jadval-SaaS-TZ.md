# TEXNIK TOPSHIRIQ (TZ) — v2.0 Enterprise Edition
## AI-quvvatli maktab dars jadvali SaaS platformasi (Multi-Tenant & High-Performance)

**Hujjat maqsadi:** Ushbu TZ Antigravity LLM agentlar (NOVA Orchestrator → PM → Dev subagentlar → QA → Team-lead) uchun to'liq avtonom ishga tushirish uchun mo'ljallangan. Hujjat biznes mantiqi, ma'lumotlar modellari, CSP generatsiya algoritmi, Master Grid UI/UX va O'zbekiston maktab ta'limi xususiyatlarini 100% qamrab olgan.

---

## 0. Loyiha mohiyati — bir jumlada

Ko'p filialli va ko'p smenali maktablar uchun o'qituvchi, sinf, smena, xona (sport zal/laboratoriya) va SanPiN aqliy yuklama cheklovlarini hisobga olib, **deterministik CSP algoritm va AI yordamida ziddiyatsiz dars jadvalini avtomatik generatsiya qiladigan**, **katta Master Grid doskasida drag-and-drop / swap bilan xavfsiz tahrirlanadigan**, ko'p tenantli (multi-tenant) B2B SaaS platformasi.

---

## 1. Arxitektura tamoyillari — Oltin Qoidalar (majburiy)

1. **PostgreSQL — yagona haqiqat manbai.** Barcha biznes ma'lumotlari (jadval, o'qituvchi, sinf, ziddiyat holati, versiyalar) faqat bazada saqlanadi.
2. **localStorage/sessionStorage biznes ma'lumotlari uchun qat'iy taqiqlanadi.** Faqat UI-darajasidagi vaqtinchalik parametrlar (masalan, zoom darajasi, oxirgi tanlangan filial filteri) uchun ruxsat.
3. **Socket.io — real-time sinxronizatsiya.** Bir maktab ichida bir nechta admin/zavuch bir vaqtda Master Grid jadvalini ko'rayotganda, birov dars ko'chirsa yoki swap qilsa — boshqalarning ekranida darhol yangilanishi shart (optimistic UI + server confirm).
4. **Multi-tenant izolyatsiya — 100% qat'iy.** Har bir so'rovda `schoolId` session/token'dan olinadi. Barcha Prisma modellari va bog'lovchilarda (`TeacherSubject`, `ClassSubject`, `TeacherAvailability` va h.k.) `schoolId` filtri va indekslari bo'lishi shart.
5. **Jadval versiyalash (Draft vs Published).** Amaldagi tasdiqlangan jadval buzilmaydi. Yangi generatsiya qilingan yoki tahrirlanayotgan jadval `DRAFT` holatida bo'ladi va admin tasdiqlagach `PUBLISHED`ga aylanadi.
6. **Har bir yozuv — audit qilinadi.** Kim, qachon, nimani o'zgartirdi (drag-and-drop, swap, generatsiya) — `AuditLog` jadvalida to'liq payload bilan saqlanadi.
7. **Deterministik CSP Solver + LLM izohi.** Asosiy taqsimot 100% kod darajasidagi deterministik CSP algoritm (Greedy + Min-Conflicts) orqali hisoblanadi. LLM esa faqat yechim topilmagan holatlarni inson tilida tushuntirish va taklif berish uchun ishlatiladi.

---

## 2. Texnologik stack

| Qatlam | Texnologiya |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui, Lucide Icons |
| Drag & Drop & Swap | `@dnd-kit/core` + `@dnd-kit/sortable` (yuqori unumdorlik va Master Grid uchun) |
| Backend | Next.js Server Actions + Route Handlers (REST API) |
| ORM | Prisma ORM |
| DB | PostgreSQL (asosiy), Redis (generatsiya navbati va real-time holatlar uchun) |
| Real-time | Socket.io |
| Auth | NextAuth / Auth.js — email+parol, keyinchalik Telegram / SMS login |
| Excel import/export | `exceljs` — O'qituvchilar, Fanlar va Tarifikatsiyani 1-click import qilish va formatlangan chiroyli Export |
| AI qatlam | Anthropic API (Claude) / OpenAI — generatsiya izohi, ziddiyatlarni bartaraf etish bo'yicha maslahatchi |
| Deploy | Docker Compose (App + Postgres + Redis + Socket server) |

---

## 3. Foydalanuvchi rollari va ruxsatlar

| Rol | Qamrov | Huquqlar |
|---|---|---|
| **Super Admin** | Butun platforma | Maktablarni yaratish/bloklash, obuna holatini boshqarish (`trial`, `active`, `suspended`), maktabga "support sifatida kirish" (impersonation + audit), global statistika |
| **Maktab Admin / Zavuch** | Faqat o'z maktabi | Setup Wizard, Excel import, o'qituvchilar, sinflar, fanlar, SanPiN ballari, xonalar boshqaruvi, generatsiya, Master Grid tahrirlash (drag & drop, swap), zamena (o'rinbosar), Excel export |
| **O'qituvchi (read-only)** *(v2)* | Faqat o'z darslari | Shaxsiy jadvalini ko'rish, Telegram-bot orqali jadval o'zgarishlarini olish |

---

## 4. Kengaytirilgan Ma'lumotlar Modeli (Prisma)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model School {
  id                 String    @id @default(cuid())
  name               String
  slug               String    @unique
  subscriptionPlan   String    @default("trial") // trial | standard | pro
  subscriptionStatus String    @default("trial") // active | suspended | trial
  trialEndsAt        DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt

  branches     Branch[]
  shifts       Shift[]
  subjects     Subject[]
  teachers     Teacher[]
  classes      Class[]
  rooms        Room[]
  schedules    Schedule[]
  users        User[]
  auditLogs    AuditLog[]
}

model Branch {
  id        String   @id @default(cuid())
  schoolId  String
  name      String
  address   String?
  isMain    Boolean  @default(false)

  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  classes   Class[]
  rooms     Room[]
  lessons   Lesson[]

  @@index([schoolId])
}

model Shift {
  id        String   @id @default(cuid())
  schoolId  String
  name      String   // "1-smena", "2-smena"
  startTime String   // "08:00"
  endTime   String   // "13:00"
  periodsCount Int   @default(6) // kunlik darslar soni

  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  classes   Class[]

  @@index([schoolId])
}

model Subject {
  id                 String   @id @default(cuid())
  schoolId           String
  name               String
  shortName          String?  // "Mat", "Ona tili"
  colorTag           String   // Masalan "#3B82F6"
  difficultyScore    Int      @default(5) // SanPiN bo'yicha 1-13 ball (Zavuch o'zgartira oladi)
  allowDoubleLesson  Boolean  @default(false) // 2 soat ketma-ket qo'yishga ruxsat
  requiresRoomType   String?  // "GYM", "LAB", "COMP_LAB" yoki null (oddiy xona)

  school             School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  classSubjects      ClassSubject[]
  teacherSubjects    TeacherSubject[]
  lessons            Lesson[]

  @@index([schoolId])
}

model Teacher {
  id                 String   @id @default(cuid())
  schoolId           String
  fullName           String
  phone              String?
  weeklyHourCapacity Int      @default(20)
  maxConsecutiveHours Int     @default(4) // ketma-ket maksimal darslar soni
  homeroomClassId    String?  @unique

  school             School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  subjects           TeacherSubject[]
  branches           TeacherBranch[]
  availabilities     TeacherAvailability[]
  classSubjects      ClassSubject[]
  lessons            Lesson[]
  replacements       LessonReplacement[]

  @@index([schoolId])
}

model TeacherAvailability {
  id        String   @id @default(cuid())
  schoolId  String
  teacherId String
  dayOfWeek Int      // 1-6 (Dushanba-Shanba)
  period    Int      // 1-8 (dars raqami)
  isAvailable Boolean @default(true) // false bo'lsa - bu vaqtda dars qo'yilmaydi (metod kuni yoki bandlik)

  teacher   Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@unique([teacherId, dayOfWeek, period])
  @@index([schoolId])
}

model TeacherSubject {
  schoolId  String
  teacherId String
  subjectId String

  teacher   Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  subject   Subject @relation(fields: [subjectId], references: [id], onDelete: Cascade)

  @@id([teacherId, subjectId])
  @@index([schoolId])
}

model TeacherBranch {
  schoolId  String
  teacherId String
  branchId  String

  teacher   Teacher @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@id([teacherId, branchId])
  @@index([schoolId])
}

model Room {
  id          String   @id @default(cuid())
  schoolId    String
  branchId    String
  name        String   // "Sport zal", "104-xona", "Fizika lab"
  roomType    String   @default("GENERAL") // "GENERAL", "GYM", "LAB", "COMP_LAB", "OUTDOOR_PITCH"
  capacity    Int      @default(35) // sig'imi

  school      School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  branch      Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  lessons     Lesson[]

  @@index([schoolId, branchId])
}

model Class {
  id                String   @id @default(cuid())
  schoolId          String
  branchId          String
  shiftId           String
  name              String   // "1-A", "10-B"
  grade             Int      // 1..11 (1-4 boshlang'ich, 5-11 yuqori)
  isPrimary         Boolean  @default(false) // Boshlang'ich sinf belgisi

  school            School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  branch            Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  shift             Shift    @relation(fields: [shiftId], references: [id], onDelete: Cascade)
  subjects          ClassSubject[]
  lessons           Lesson[]

  @@index([schoolId, branchId, shiftId])
}

model ClassSubject {
  id          String   @id @default(cuid())
  schoolId    String
  classId     String
  subjectId   String
  teacherId   String
  weeklyHours Int      // haftalik soat

  class       Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  subject     Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  teacher     Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)

  @@unique([classId, subjectId, teacherId])
  @@index([schoolId, classId])
}

model Schedule {
  id           String   @id @default(cuid())
  schoolId     String
  name         String   // "2025-2026 1-Chorak Asosiy Jadval"
  academicYear String   // "2025-2026"
  term         Int      @default(1) // 1, 2, 3, 4-chorak
  status       String   @default("DRAFT") // "DRAFT", "PUBLISHED", "ARCHIVED"
  isActive     Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  school       School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  lessons      Lesson[]

  @@index([schoolId, isActive])
}

model Lesson {
  id           String   @id @default(cuid())
  scheduleId   String
  schoolId     String
  classId      String
  subjectId    String
  teacherId    String
  roomId       String?
  branchId     String
  dayOfWeek    Int      // 1-6 (Dushanba-Shanba)
  periodNumber Int      // 1..8
  isLocked     Boolean  @default(false) // Qo'lda qulflangan dars

  schedule     Schedule @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  class        Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  subject      Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  teacher      Teacher  @relation(fields: [teacherId], references: [id], onDelete: Cascade)
  room         Room?    @relation(fields: [roomId], references: [id], onDelete: SetNull)
  branch       Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)
  replacements LessonReplacement[]

  @@unique([scheduleId, classId, dayOfWeek, periodNumber])
  @@index([scheduleId, teacherId, dayOfWeek, periodNumber])
  @@index([scheduleId, roomId, dayOfWeek, periodNumber])
}

model LessonReplacement {
  id                 String   @id @default(cuid())
  lessonId           String
  date               DateTime // Aniq sana
  originalTeacherId  String
  replacementTeacherId String
  reason             String?
  createdAt          DateTime @default(now())

  lesson             Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  replacementTeacher Teacher  @relation(fields: [replacementTeacherId], references: [id], onDelete: Cascade)

  @@index([date, originalTeacherId])
}

model AuditLog {
  id        String   @id @default(cuid())
  schoolId  String
  userId    String
  action    String   // "lesson.moved", "lesson.swapped", "schedule.generated"...
  payload   Json
  createdAt DateTime @default(now())

  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)

  @@index([schoolId, createdAt])
}

model User {
  id           String   @id @default(cuid())
  schoolId     String?  // null bo'lsa Super Admin
  role         String   // "SUPER_ADMIN" | "SCHOOL_ADMIN"
  fullName     String
  email        String   @unique
  phone        String?
  passwordHash String
  createdAt    DateTime @default(now())

  school       School?  @relation(fields: [schoolId], references: [id], onDelete: Cascade)
}
```

---

## 5. Onboarding va 1-Click Excel Import (Bulk Onboarding)

Maktab ma'muriyati uchun tizimga kirish 2 xil usulda bo'ladi:
1. **Interactive Setup Wizard (5 qadam):**
   * 1-qadam: Filiallar va Smenalar
   * 2-qadam: Fanlar katalogi va SanPiN ballari
   * 3-qadam: Xonalar va Maydonlar (Sport zal, Stadion, Kompyuter xonasi)
   * 4-qadam: O'qituvchilar va ularning ish vaqti / cheklovlari
   * 5-qadam: Sinflar va Tarifikatsiya (Fan-soat-o'qituvchi bog'lanishi) + "Sinfdan nusxa olish" (Bulk duplicate)
2. **1-Click Excel Import (Tezkor usul):**
   * Zavuch `Andoza_Maktab_Jadval.xlsx` shablonini yuklab oladi (3 ta varaq: O'qituvchilar, Fanlar, Tarifikatsiya).
   * Shablonni to'ldirib tizimga yuklaydi (`Upload & Validate`).
   * Tizim xatolarni (mavjud bo'lmagan fan, ortiqcha soat, format xatosi) tekshiradi va 5 soniyada barcha ma'lumotlarni bazaga yozadi.

---

## 6. CSP Generatsiya Dvigateli (Solver Engine)

### 6.1 Hard Constraints (Qat'iy qoidalar — 100% buzilmasligi shart)
1. **O'qituvchi to'qnashuvi yo'qligi:** Bitta o'qituvchi bitta periodda faqat bitta sinfda dars bera oladi.
2. **Sinf to'qnashuvi yo'qligi:** Bitta sinf bitta periodda faqat bitta fanga ega bo'ladi.
3. **Smena mosligi:** Dars faqat sinfning smena soatlari doirasida bo'ladi.
4. **O'qituvchi ish grafigi (Availability):** O'qituvchi `isAvailable: false` (metod kuni yoki band vaqti) bo'lgan soatlarga dars belgilanmaydi.
5. **Xona cheklovi (Room Constraint):** Agar fan maxsus xona talab qilsa (`GYM`, `COMP_LAB`), maktabdagi mavjud xonalar sonidan ortiq dars bir vaqtda qo'yilmaydi (masalan, 1 ta sport zal bo'lsa, bir vaqtda faqat 1 ta sinfga sport qo'yiladi; agar ochiq stadion ham bo'lsa — boshlang'ich va yuqori sinflar taqsimlanadi).
6. **Haftalik soatlar to'liqligi:** Har bir fan uchun belgilangan haftalik soatlar to'liq taqsimlanadi.
7. **Juftlik dars qoidasi:** Faqat `allowDoubleLesson = true` bo'lgan fanlar bir kunda ketma-ket 2 soat qo'yilishi mumkin, boshqa fanlar bir kunda 1 martadan oshmaydi.

### 6.2 Soft Constraints (Moslashuvchan qoidalar — Score bo'yicha optimallashtirish)
1. **SanPiN Aqliy Yuklama Balansi:**
   * Og'ir fanlar (qiyinlik balli ≥ 8) kunning 2-3 periodlariga va haftaning Seshanba-Chorshanba kunlariga to'g'ri kelishi rag'batlantiriladi.
   * Dushanba va Juma/Shanba kunlari aqliy yuklama o'rtacha yoki yengilroq bo'lishi ta'minlanadi.
   * Zavuch SanPiN ballarini o'zi xohlaganicha sozlashi mumkin.
2. **O'qituvchining "Dars oralig'idagi oyna" (Gaps/Windows) minimumi:** O'qituvchining darslari bir kunda zich (ketma-ket) joylashishi.
3. **Filiallararo bufer vaqti:** O'qituvchi bir kunda 2 ta filialda dars o'tadigan bo'lsa, ular orasida minimal 30-40 daqiqa yo'l vaqti qoldirilishi.

### 6.3 Algoritm arxitekturasi:
* **1-bosqich: Greedy Heuristic (Most Constrained First).** Eng ko'p cheklovga ega o'qituvchilar va maxsus xonali fanlar birinchi joylashtiriladi.
* **2-bosqich: Min-Conflicts Local Search.** Qolgan darslar va ziddiyatlar tezkor almashtirish orqali global optimumga keltiriladi.
* **3-bosqich: LLM Advisor.** Agar 100% joylashtirish imkoni bo'lmasa (masalan, soatlar haddan tashqari ko'p yoki o'qituvchilar yetishmasa), Claude API nima uchun bunday bo'lganini va qanday tuzatish mumkinligini (masalan: *"5-A sinfida matematika soatini boshqa kunga suring yoki falon o'qituvchiga yuklang"*) o'zbek tilida aniq tavsiya qiladi.

---

## 7. Master Grid View va Interaktiv Dars Jadvali Doskasi

Zavuch va maktab rahbariyati uchun asosiy ish maydoni — **Master Grid View**:

1. **Barcha sinflar umumiy doskasi:**
   * Ustunlar: Barcha sinflar (1-A, 1-B, 2-A... 11-B) yonma-yon.
   * Qatorlar: Kunlar (Dushanba-Shanba) va har bir kun ichida Periodlar (1-8 darslar).
   * **Sticky Headers:** Sinf nomlari tepada, kun/soatlar chap tomonda har doim qotirilgan (sticky) bo'ladi.
   * **Zoom boshqaruvi:** 75%, 90%, 100%, 125% ko'rinishida doskani kichraytirish/kattalashtirish.
2. **Drag & Drop va SWAP (O'rin almashtirish):**
   * Dars ushlanganda butun grid bo'yicha yashil (xavfsiz), sariq (ogohlantirishli) va qizil (mumkin emas) kataklar yonadi.
   * **Swap xususiyati:** Darsni boshqa dars ustiga tashlaganda, ikkita darsning o'rni xavfsiz almashadi (agar ikkala tomonda ham ziddiyat bo'lmasa).
3. **Undo / Redo (Oxirgi 15 ta harakat):** Har qanday noto'g'ri ko'chirish Ctrl+Z bilan darhol orqaga qaytariladi.
4. **Zamena (Vaqtinchalik o'rinbosar) rejimi:**
   * Aniq bir kun uchun dars ustiga bosib "O'rinbosar tayinlash" (Zamena) oynasi ochiladi.
   * Tizim shu soatda bo'sh bo'lgan va shu fandan dars bera oladigan o'qituvchilar ro'yxatini avtomatik tavsiya qiladi.

---

## 8. Excel va PDF Export

1. **Sinflar kesimida Export:** Har bir sinf alohida varaqda (sheet) yoki bitta umumiy rangli jadval ko'rinishida.
2. **O'qituvchilar kesimida Export:** Har bir o'qituvchining shaxsiy dars jadvali (devorga osish va tarqatish uchun qulay).
3. **Xonalar kesimida Export:** Sport zal, kompyuter xonasi va laboratoriyalarning haftalik bandlik jadvali.
4. Format: `exceljs` bilan yuqori sifatli, fan ranglari bilan bo'yalgan va sarlavhalari freeze qilingan fayl.

---

## 9. Xavfsizlik va Multi-tenant RLS

- Barcha so'rovlarda `schoolId` session'dan olinadi.
- Super Admin maktab ichiga kirganda (Impersonation) bu harakat `AuditLog`da qayd etiladi va ekranda shaffof bildirishnoma ko'rinadi.
- Rollar va ruxsatlar (RBAC) middleware darajasida qat'iy tekshiriladi.
