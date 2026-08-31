# TEXNIK TOPSHIRIQ (TZ)
## AI-quvvatli maktab dars jadvali SaaS platformasi

**Hujjat maqsadi:** Ushbu TZ Antigravity LLM agentlar (PM → Dev subagentlar → QA → Team-lead) uchun to'liq avtonom ishga tushirish uchun mo'ljallangan. Agent bu hujjatni o'qib, texnik qarorlarni (nomlash, branding, aniq API route'lar, komponent tuzilmasi) mustaqil qabul qilishi kerak — bu yerda faqat arxitektura, mantiq va UX qat'iy belgilangan, qolgani ijodiy erkinlik.

---

## 0. Loyiha mohiyati — bir jumlada

Ko'p filialli maktablar uchun o'qituvchi, sinf, smena va filial cheklovlarini hisobga olib, **AI yordamida ziddiyatsiz dars jadvalini avtomatik generatsiya qiladigan**, keyin esa **drag-and-drop bilan xavfsiz tahrirlanadigan** ko'p-tenantli (multi-tenant) SaaS platforma. Bitta Super Admin ko'plab maktablarni boshqaradi; har bir maktab o'z ma'lumotlari ichida to'liq mustaqil.

---

## 1. Arxitektura tamoyillari — Oltin Qoidalar (majburiy, muzokara qilinmaydi)

1. **PostgreSQL — yagona haqiqat manbai.** Barcha biznes ma'lumotlari (jadval, o'qituvchi, sinf, ziddiyat holati) faqat bazada saqlanadi.
2. **localStorage/sessionStorage biznes ma'lumotlari uchun qat'iy taqiqlanadi.** Faqat UI-darajasidagi vaqtinchalik holat (masalan, "oxirgi tanlangan filial" kabi cosmetic preference) uchun ruxsat.
3. **Socket.io — real-time sinxronizatsiya.** Bir maktab ichida bir nechta admin bir vaqtda jadvalni ko'rayotganda, birov drag-and-drop qilganda — boshqalarning ekranida darhol yangilanishi shart (optimistic UI + server confirm).
4. **Multi-tenant izolyatsiya — qat'iy.** Har bir so'rovda `schoolId` filtri majburiy (query-level yoki Postgres RLS orqali). Bitta maktab boshqa maktab ma'lumotini hech qanday holatda ko'rmasligi kerak.
5. **Har bir yozuv — audit qilinadi.** Kim, qachon, nimani o'zgartirdi — `AuditLog` jadvalida saqlanadi (ayniqsa drag-and-drop orqali qilingan o'zgarishlar).
6. **AI generatsiya — deterministik + izohli.** Constraint-solver (qat'iy mantiq) natijani hisoblaydi, LLM qatlami esa natijani foydalanuvchiga inson tilida tushuntiradi va yechilmagan holatlarni taklif qiladi. LLM hech qachon constraint tekshiruvini "taxmin bilan" bajarmaydi — bu har doim kod darajasidagi validatordan o'tadi.

---

## 2. Texnologik stack (tavsiya, agent moslashtirishi mumkin)

| Qatlam | Texnologiya |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui |
| Drag & Drop | `@dnd-kit/core` (performance va accessibility uchun react-beautiful-dnd'dan yaxshiroq) |
| Backend | Next.js Server Actions + Route Handlers (API alohida servisga ажратиш shart emas, monolit yetarli) |
| ORM | Prisma |
| DB | PostgreSQL (asosiy), Redis (generatsiya job-queue va real-time presence uchun, ixtiyoriy) |
| Real-time | Socket.io (alohida Node process yoki Next custom server) |
| Auth | NextAuth / Auth.js — email+parol, keyinchalik Telegram login (O'zbekiston bozori uchun qulay) |
| Excel export | `exceljs` (formatlash, ranglash, merge-cell imkoniyati borligi uchun `xlsx` paketidan afzal) |
| AI qatlam | Anthropic API (Claude) — generatsiya izohi, conflict-tushuntirish, tabiiy tilda hisobot |
| Deploy | O'zining VPS'i (foydalanuvchi standart amaliyoti) — Docker Compose: app + postgres + redis + socket server |

Aniq papka tuzilmasi, komponent arxitekturasi va nomlash konvensiyalarini agent o'zining global skill-larida (component-architecture, icon-standards, dark/light theming) belgilangan qoidalar bo'yicha mustaqil qo'llaydi.

---

## 3. Foydalanuvchi rollari va ruxsatlar

| Rol | Qamrov | Huquqlar |
|---|---|---|
| **Super Admin** | Butun platforma | Maktablarni yaratish/bloklash, obuna holatini boshqarish, har qanday maktabga "support sifatida kirish" (impersonation, audit-log bilan), global statistikani ko'rish |
| **Maktab Admin** | Faqat o'z maktabi | O'qituvchi/fan/smena/filial/sinf sozlash, jadval generatsiya qilish, drag-and-drop tahrirlash, Excel export, boshqa admin qo'shish (agar ko'p administratorli maktab bo'lsa) |
| **Filial Admin** *(v2, ixtiyoriy)* | Faqat belgilangan filial | Faqat o'z filiali doirasida ko'rish/tahrirlash — MVP'da Maktab Admin roliga qisqartirilgan holda qo'yiladi, keyin kengaytiriladi |
| **O'qituvchi (read-only)** *(v2)* | Faqat o'ziga tegishli darslar | Faqat o'z jadvalini ko'radi, Telegram-bot orqali bildirishnoma oladi |

MVP uchun majburiy: **Super Admin** va **Maktab Admin**. Qolgan ikkitasi roadmap'da (15-bo'lim).

---

## 4. Auth va onboarding oqimi

- **Ikkita alohida login sahifasi:** `/super-admin/login` va `/[maktab-subdomain]/login` (yoki `app.domain.uz/login` + tanlov ekrani — subdomain yo'q bo'lsa ham ishlashi kerak, chunki O'zbekiston bozorida ko'p maktab domen sozlay olmaydi).
- Super Admin yangi maktab yaratganda: maktab nomi, birinchi Admin foydalanuvchi (email/telefon + parol), obuna holati (`trial` / `active` / `suspended`) — yaratiladi va Admin'ga login ma'lumotlari yuboriladi (email yoki Telegram orqali, keyingi bosqichda).
- Login qilganda **obuna holati tekshiriladi** — agar `suspended` bo'lsa, Maktab Admin faqat "obuna tugagan" xabarini ko'radi, ma'lumotlariga kira olmaydi lekin ma'lumotlar o'chirilmaydi.
- Birinchi marta kirganda **Setup Wizard** avtomatik ochiladi (7-bo'limdagi bosqichlar bo'yicha, progress-bar bilan: "3/5 bosqich tugallandi").

---

## 5. Ma'lumotlar modeli (asosiy entitylar, Prisma uslubida)

```prisma
model School {
  id                String   @id @default(cuid())
  name              String
  region            String?   // "Muzrabot tumani" kabi — rasmiy hujjat sarlavhasida ishlatiladi
  subdomain         String?  @unique
  subscriptionPlan  String   // trial | standard | pro
  subscriptionStatus String  // active | suspended | trial
  trialEndsAt       DateTime?
  createdAt         DateTime @default(now())

  // Rasmiy Excel-export sarlavha/footer uchun (real hujjat andozasi, 9.1-bo'limga qarang)
  directorFullName          String?   // "M. Ramazonov" — TASDIQLAYMAN qatoriga chiqadi
  academicVicePrincipalName String?   // "O'quv ishlar bo'yicha direktor o'rinbosari" — footer imzosi
  psychologistName          String?   // "Ruhshunos" — footer imzosi

  branches   Branch[]
  shifts     Shift[]
  subjects   Subject[]
  teachers   Teacher[]
  classes    Class[]
  admins     User[]
  terms      Term[]
}

model Term {
  id         String   @id @default(cuid())
  schoolId   String
  name       String    // "1-chorak", "4-chorak"
  academicYear String  // "2024-2025"
  startDate  DateTime?
  endDate    DateTime?
  isActive   Boolean  @default(false)   // hozir amaldagi chorak — yangi generatsiya shu term'ga yoziladi

  lessons    Lesson[]  // har bir Lesson ma'lum bir chorakka tegishli — chorak almashganda eski jadval tarix sifatida saqlanadi
}

model Branch {
  id        String  @id @default(cuid())
  schoolId  String
  name      String
  isMain    Boolean @default(false)   // asosiy bino yoki filial
}

model Shift {
  id        String  @id @default(cuid())
  schoolId  String
  name      String   // "1-smena", "2-smena"
  startTime String   // "08:00"
  endTime   String   // "13:00"
  order     Int
}

model Subject {
  id       String @id @default(cuid())
  schoolId String
  name     String
  colorTag String  // jadvalda vizual ажратиш учун (brand palette'dan emas, alohida "fan ranglari" to'plami)
}

model Teacher {
  id                String  @id @default(cuid())
  schoolId          String
  displayNumber     Int      // maktab ichida avtomatik ketma-ket ID (1,2,3...) — real jadvalda F.I.Sh o'rniga shu raqam yoziladi, 9.1-bo'limga qarang. @@unique([schoolId, displayNumber])
  fullName          String
  phone             String?
  methodDay         Int?     // 0-6, "metod kuni" — bu kunda dars belgilanmaydi (hard constraint)
  weeklyHourCapacity Int     // haftalik maksimal dars soati
  homeroomClassId   String? @unique   // agar biror sinfga sinf rahbari bo'lsa

  subjects  TeacherSubject[]
  branches  TeacherBranch[]   // bitta o'qituvchi bir nechta filialda ishlashi mumkin
}

model TeacherSubject {
  teacherId String
  subjectId String
  @@id([teacherId, subjectId])
}

model TeacherBranch {
  teacherId String
  branchId  String
  @@id([teacherId, branchId])
}

model Class {
  id                String  @id @default(cuid())
  schoolId          String
  branchId          String
  shiftId           String
  name              String   // "1-A"
  grade             Int      // 1..11
  homeroomTeacherId String? @unique

  subjects ClassSubject[]
  lessons  Lesson[]
}

model ClassSubject {
  id          String @id @default(cuid())
  classId     String
  subjectId   String
  teacherId   String
  weeklyHours Int      // shu fan haftasiga necha soat o'tilishi kerak
}

model Lesson {
  id          String  @id @default(cuid())
  termId      String   // qaysi chorakka tegishli — chorak yangilanganda avvalgi Lesson'lar tegilmaydi, tarix bo'lib qoladi
  classId     String
  subjectId   String
  teacherId   String
  branchId    String
  dayOfWeek   Int      // 1-6 (dushanba-shanba)
  periodNumber Int     // 1,2,3...
  isLocked    Boolean @default(false)  // admin qo'lda "tegilmasin" deb belgilagan darslar

  createdBy   String
  updatedAt   DateTime @updatedAt
}

model AuditLog {
  id        String   @id @default(cuid())
  schoolId  String
  userId    String
  action    String    // "lesson.moved", "class.duplicated", "schedule.generated"...
  payload   Json
  createdAt DateTime @default(now())
}

model User {
  id       String @id @default(cuid())
  schoolId String?   // null bo'lsa — Super Admin
  role     String    // super_admin | school_admin
  email    String @unique
  passwordHash String
}
```

Aniq migratsiya fayllari va qo'shimcha indekslar (`@@index([schoolId, dayOfWeek, teacherId])` kabi conflict-tekshiruvni tezlashtiruvchi indekslar) agent tomonidan development jarayonida qo'shiladi.

---

## 6. Setup Wizard — foydalanuvchi jarayoni (bosqichma-bosqich)

UI: chap tomonda vertikal step-indikator (6 ta bosqich), har bir bosqich tugallanmaguncha keyingisiga o'tish mumkin, lekin **orqaga qaytib tahrirlash har doim ochiq** (bu — real hayotda ma'lumot doim o'zgarib turishini hisobga olgan qaror).

### 6.0-bosqich — Maktab profili (rasmiy hujjat rekvizitlari)
Eng birinchi, hamma narsadan oldin: maktab nomi, tuman/viloyat, joriy o'quv yili (masalan "2024-2025"), joriy chorak (`Term`), **direktor F.I.Sh**, **o'quv ishlar bo'yicha direktor o'rinbosari F.I.Sh**, **ruhshunos F.I.Sh**. Bu maydonlar keyinchalik har bir Excel export'ida sarlavha/footer imzo qatorlariga avtomatik chiqadi (9.1-bo'limga qarang) — shuning uchun eng boshida so'raladi, keyin qayta-qayta kiritilmaydi. Har biri keyinroq Sozlamalar bo'limidan o'zgartirilishi mumkin.

### 6.1-bosqich — Fanlar katalogi
Avval fanlar ro'yxati kiritiladi (Matematika, Ona tili...), har biriga vizual rang belgilanadi (jadval katakchalarida fanni tez ajratish uchun). Standart O'zbekiston maktab fanlari ro'yxati oldindan taklif qilinadi (tezkor tanlash uchun checkbox ro'yxat — quyidagi to'liq ro'yxatga qarang), admin xohlagan fanini qo'shishi/o'chirishi mumkin.

**Qat'iy qoida — erkin matn kiritish TAQIQLANADI.** Dars belgilashda (ClassSubject, Lesson) fan har doim shu katalogdan **tanlanadi**, hech qachon qo'lda yozilmaydi. Sabab — real hujjatlar tahlili shuni ko'rsatdiki, qo'lda Excel'da yozilganda bitta fan bir nechta xil nomda paydo bo'ladi ("Ingliz tili" / "Ingli tili", "Jis. Tarbiya" / "Jis/ tarbiya" / "Jis. Tarbita", "O'zb. Tarixi" / "O'zb tarixi") — bu haqiqiy maktab jadvalida uchragan xatolar bo'lib, tizimda BUNDAY XATO PRINSIPIAL RAVISHDA IMKONSIZ bo'lishi kerak. Bu — qo'lda Excel'ga nisbatan platformaning eng katta amaliy ustunligi sifatida qayd etiladi.

**Standart katalog namunasi (Setup Wizard'da oldindan tayyor holda taklif qilinadi):** Matematika, Algebra, Geometriya, Ona tili, Adabiyot, Rus tili, Ingliz tili, Tarix, Jahon tarixi, O'zbekiston tarixi, Geografiya, Biologiya, Fizika, Kimyo, Informatika, Tabiiy fan, Texnologiya, Tasviriy san'at (Rasm), Musiqa, Jismoniy tarbiya, Chizmachilik, Huquq, Iqtisod, Tadbirkorlik asoslari, Astronomiya, Tarbiya (odob-axloq), Chaqiriqqacha harbiy-jismoniy tayyorgarlik (CHQBT). Bulardan tashqari ikkita **maxsus tizim fani** — bular oddiy fandan farqli maxsus mantiqqa ega (7.2-bo'limga qarang):
- **"Sinf soati"** — barcha sinflarda bir vaqtda (odatda juma, 1-period) o'tadigan tarbiyaviy soat.
- **"Sinf rahbar soati"** *(agar alohida ajratilsa)* — Sinf soati bilan bir xil mantiqda.

### 6.2-bosqich — O'qituvchilar
Har bir o'qituvchi uchun forma:
- F.I.Sh, telefon
- **Fan(lar)** — bir nechta tanlash mumkin (multi-select)
- **Metod kuni** — haftaning qaysi kuni dars yo'q (dropdown, ixtiyoriy)
- **Haftalik dars soati sig'imi** — maksimal necha soat dars bera oladi
- **Filial(lar)** — qaysi filial(lar)da ishlaydi (bir nechtasi belgilansa, 7.4-bo'limdagi "filiallararo harakat" mantig'i ishga tushadi)
- **Sinf rahbarligi** — "Yo'q" yoki aniq sinf tanlash (bitta o'qituvchi faqat bitta sinfga rahbar bo'la oladi — bazada `@unique` bilan qat'iy)

O'qituvchi yaratilgan zahoti tizim unga **avtomatik tartib raqami** (`displayNumber`: 1, 2, 3...) beradi — bu raqam qo'lda tahrirlanmaydi, o'qituvchi o'chirilsa ham qolganlarniki qayta raqamlanmaydi (tarixiy jadvallar buzilmasligi uchun). Bu raqam — real maktab jadvallarida qabul qilingan andoza: jadval katakchasida F.I.Sh to'liq yozish o'rniga shu raqam ko'rsatiladi, to'liq ism esa jadvalning yon tomonidagi "O'qituvchilar ro'yxati" legendasida beriladi (9.1-bo'limga qarang). UI'da bu ikki ko'rinish o'rtasida almashtirish (toggle: "Raqam bilan" / "To'liq ism bilan") bo'ladi.

Ro'yxat jadval ko'rinishida, tez qidiruv/filter (fan bo'yicha, filial bo'yicha) bilan, `#[raqam] F.I.Sh` formatida.

### 6.3-bosqich — Smenalar
"+ Smena qo'shish" — nomi, boshlanish/tugash vaqti. Odatda 1-smena va 2-smena, lekin admin xohlasa 3-smena ham qo'sha oladi. Har bir smenaga necha "dars soati" sig'ishini (period sonini) tizim avtomatik hisoblaydi (masalan 45 daqiqalik darslar + tanaffuslar asosida) — lekin admin qo'lda ham period sonini belgilay olishi kerak.

**Ish haftasi uzunligi** — 5 kunlik yoki 6 kunlik (Dushanba-Juma / Dushanba-Shanba), tanlov Setup Wizard'ning shu bosqichida beriladi (O'zbekiston davlat maktablarida 6 kunlik andoza ko'proq tarqalgan, shuning uchun **default — 6 kun**, lekin har bir maktab o'zgartira oladi).

**Standart period-vaqt shabloni (real hujjat andozasi bo'yicha, smena yaratilganda oldindan to'ldirilgan holda taklif qilinadi, admin xohlagan daqiqaga o'zgartira oladi):**

| Period | Vaqt | Tanaffus (keyingisigacha) |
|---|---|---|
| 1 | 08:00–08:45 | 5 daqiqa |
| 2 | 08:50–09:35 | 5 daqiqa |
| 3 | 09:40–10:25 | **10 daqiqa (katta tanaffus)** |
| 4 | 10:35–11:20 | 5 daqiqa |
| 5 | 11:25–12:10 | 5 daqiqa |
| 6 | 12:15–13:00 | — |

Bu shablon faqat 1-smenaga standart taklif — admin dars davomiyligini (45 daq.), tanaffus davomiyligini va "katta tanaffus" qaysi period'dan keyin bo'lishini alohida sozlashi mumkin, shunda qolgan periodlar **avtomatik qayta hisoblanadi** (qo'lda har birini kiritish shart emas). 2-smena boshlanish vaqti kiritilsa, xuddi shu mantiq bilan avtomatik hisoblanadi.

### 6.4-bosqich — Filiallar
"Filial bormi?" — Ha/Yo'q toggle. Ha bo'lsa: filial nomi, manzili qo'shiladi. Har bir filial keyinchalik sinf va smena bilan bog'lanadi ("bu filialda 1-2-smena ishlaydi", "bu filialda quyidagi sinflar o'qiydi").

### 6.5-bosqich — Sinflar + Duplicate mexanizmi
Bu — eng ko'p vaqt oladigan bosqich, shuning uchun **Duplicate (nusxalash)** markaziy UX qarori:

1. Birinchi sinf (masalan 1-A) to'liq sozlanadi: filial, smena, har bir fan uchun haftalik soat va mas'ul o'qituvchi tanlanadi (fan-o'qituvchi juftligi — faqat o'sha fanni o'qitadigan deb belgilangan o'qituvchilar ro'yxatidan tanlanadi, xato tanlashning oldi olinadi).
2. Sinf kartasida **"Nusxa olish"** tugmasi paydo bo'ladi. Bosilganda: "Nechta yangi sinfga nusxalansin?" — masalan 1-B, 1-C, 1-D belgilanadi (bulk-create, bitta amalda bir nechta sinf).
3. Yangi sinflar 1-A'ning **to'liq nusxasi** sifatida yaratiladi (bir xil fan-soat tuzilmasi, bir xil o'qituvchilar).
4. Admin faqat farqlarni tahrirlaydi — masalan 1-B'da matematikani boshqa o'qituvchi o'tsa, faqat o'sha bitta qatorni almashtiradi. Qolgan hamma narsa tegilmagan qoladi.
5. Bu tamoyil grade darajasida ham ishlaydi: "Shu tuzilmani 2-sinflar uchun ham andoza qilib olish" imkoniyati (fan-soat tuzilmasi ko'chiriladi, o'qituvchilar bo'sh qoladi — chunki 2-sinf o'qituvchilari boshqacha bo'lishi tabiiy).

---

## 7. AI / Constraint-based generatsiya dvigateli

### 7.1 Kirish parametrlari
Barcha yuqoridagi ma'lumotlar (o'qituvchi, sinf, fan-soat, smena, filial, metod kuni, cheklovlar) generatsiya funksiyasiga uzatiladi.

### 7.2 Hard constraint'lar (buzilishi mumkin emas — generator bunday yechim taklif qilmaydi)
1. Bitta o'qituvchi bir vaqtning o'zida ikkita sinfda bo'la olmaydi.
2. Bitta sinf bir vaqtning o'zida ikkita fanga ega bo'la olmaydi.
3. Dars faqat o'sha sinfning smenasiga tegishli period oralig'ida joylashadi.
4. O'qituvchining "metod kuni"ga hech qanday dars qo'yilmaydi.
5. Har bir fan uchun belgilangan haftalik soat **aniq** bajarilishi kerak (kam ham, ko'p ham emas).
6. O'qituvchining haftalik umumiy yuklamasi `weeklyHourCapacity`dan oshmaydi.
7. Bitta sinfga bitta kunda bitta fandan ikkita dars ketma-ket bo'lmasa (agar fan uchun 2 soat sblokli dars talab qilinmagan bo'lsa) qo'yilmaydi.
8. **"Sinf soati" (yoki shunga o'xshash "barcha-sinf-birga" deb belgilangan maxsus fan) — har doim BARCHA sinflarda bir xil kun va bir xil period'da joylashadi** (real hujjatda — barcha sinflarda juma, 1-period). Bu kun/period maktab darajasida bitta marta sozlanadi (masalan School sozlamalarida "Umumiy sinf soati: Juma, 1-period"), generator uni har doim shu joyga avtomatik qo'yadi va drag-and-drop orqali faqat **hammasi birga** ko'chiriladi, alohida bitta sinf uchun emas (aks holda real hayotdagi ma'no yo'qoladi).

### 7.3 Soft constraint'lar (buzilsa mumkin, lekin generator birinchi navbatda buzmaslikka harakat qiladi, imkonsiz bo'lsa — yashil emas, sariq holatda belgilaydi)
1. O'qituvchi kunining "teshik"siz (bo'sh period orasida darssiz vaqt) bo'lishi — yuklama zich joylashtiriladi.
2. Bir xil fan sinfga hafta davomida bir tekis taqsimlanadi (masalan dushanba va payshanba, ikkalasi ham juma emas).
3. Og'ir fanlar (matematika, ona tili) — birinchi 2-3 period ichiga joylashtiriladi, oxirgi periodlarga emas.

### 7.4 Filiallararo o'qituvchi harakati — maxsus mantiq (sizning misolingiz asosida)
Agar o'qituvchi bir nechta filialda ishlasa:
- Generator bir kun ichida o'sha o'qituvchining darslarini **bitta filialga blok qilib** joylashtirishga harakat qiladi (masalan dushanba — faqat asosiy maktab, seshanba — faqat filial), **"sarson qilmaslik"** tamoyili asosiy strategiya.
- Agar bir kunda ikkala filialda ham dars berishga to'g'ri kelsa (masalan 1 soat asosiy maktabda + 2 soat filialda), ular orasida **minimal yo'l-safar buferi** (standart: 30-40 daqiqa, admin sozlashi mumkin) qat'iy talab qilinadi va bu ikki blok kun ichida imkon qadar bir-biriga yaqin (masalan kun boshi — asosiy, kun oxiri — filial) emas, aksincha **ketma-ket** joylashtiriladi, oralaridagi bo'sh vaqt yo'l uchun ishlatiladigan qilib.
- Bu qoida buzilishi mumkin bo'lsa (masalan yetarli bufer topilmasa) — bu holat **sariq** status bilan belgilanadi va tushuntiriladi: "O'qituvchi [X] seshanba kuni 3-period asosiy maktabda, 4-period filialda — orada atigi 10 daqiqa bor, yetib borish qiyin bo'lishi mumkin."

### 7.5 Algoritm arxitekturasi (ikki bosqich)
**1-bosqich — Deterministik solver (kod, LLM emas).** Constraint Satisfaction Problem sifatida modellashtiriladi: backtracking + heuristic ranking (eng ko'p cheklovga ega o'qituvchi/sinf birinchi joylashtiriladi — "most constrained first" strategiyasi). Har bir joylashtirish soft constraint'lar bo'yicha ball (score) oladi, eng yuqori ballli variant tanlanadi. Bu qatlam 100% deterministik, testlanadigan, va tez (bir maktab uchun soniyalar ichida ishlashi kerak).

**2-bosqich — LLM izohlovchi va tekshiruvchi qatlam.** Solver natijasi tugagach, agar ba'zi darslar joylashtirilmay qolgan bo'lsa (imkonsiz combo) yoki ko'p sariq status hosil bo'lgan bo'lsa — Claude API'ga natija yuboriladi, u:
- Nima uchun bu darslar joylasha olmaganini **oddiy o'zbek tilida** tushuntiradi.
- Yechim variantlarini taklif qiladi ("O'qituvchi X'ning metod kunini payshanbadan seshanbaga o'zgartirsangiz, bu muammo hal bo'ladi").
- Bu faqat **tavsiya** — hech qachon avtomatik ravishda ma'lumotlarni o'zgartirmaydi, admin tasdiqlashi shart.

### 7.6 Natija va hisobot
Generatsiya tugagach: "✅ 142 ta dars muvaffaqiyatli joylashtirildi, ⚠️ 3 ta dars ogohlantirish bilan, ❌ 2 ta dars joylashtirilmadi — qo'lda joylashtiring" — degan xulosaviy karta ko'rsatiladi, joylashtirilmagan darslar ro'yxati pastda, ularni qo'lda drag-and-drop bilan joylashtirish uchun.

---

## 8. Dars jadvali ko'rinishi va filterlar

Asosiy jadval — grid ko'rinishi (kunlar — ustunlar, periodlar — qatorlar), har bir katakchada: fan nomi (rangli tag), o'qituvchi ismi (qisqa), sinf/filial belgisi.

**Filter panel (jadval yuqorisida, doim ko'rinadi):**
- `Barchasi` — asosiy maktab + barcha filiallar birga
- `Filial bilan birga` — asosiy + tanlangan filial(lar) yonma-yon
- `Faqat asosiy maktab`
- `Faqat filial` (bir nechta filial bo'lsa — filial tanlash dropdown qo'shimcha chiqadi)

Qo'shimcha filterlar: sinf bo'yicha (bitta sinfning haftalik jadvalini ko'rish), o'qituvchi bo'yicha (bitta o'qituvchining haftalik jadvalini ko'rish — bu ayniqsa muhim, chunki o'qituvchilar ko'pincha "mening jadvalim qanday" deb so'raydi).

---

## 9. Excel export

"Export" tugmasi joriy faol filterni hisobga oladi (masalan admin "Faqat filial" filterida bo'lsa, faqat filial jadvali export bo'ladi — lekin export oynasida filterni export vaqtida ham o'zgartirish imkoniyati beriladi).

Texnik talablar:
- `exceljs` bilan — har bir sinf uchun alohida sheet (yoki bitta umumiy sheet, admin tanlaydi), fan ranglari saqlanadi, sarlavha qatori freeze qilinadi, hujayralar avtomatik kenglikda.
- Fayl nomi: `[Maktab nomi]_jadval_[filter]_[sana].xlsx`.
- O'qituvchilar uchun alohida export rejimi: "O'qituvchi jadvali" — har bir o'qituvchi alohida sheet'da, faqat o'ziga tegishli darslar bilan (bosma qilib devorga osish uchun qulay format).

### 9.1 REAL HUJJAT ANDOZASI — majburiy, aniq namunaga asoslangan qat'iy format

Bu bo'lim foydalanuvchining **haqiqiy maktabi (39-maktab, Muzrabot tumani) tomonidan hozir qo'lda Excel'da yuritilayotgan rasmiy dars jadvali faylini** satr-satr tahlil qilish natijasida yozilgan. Excel export **shu andozani aniq takrorlashi shart** — bu tumandagi ta'lim bo'limiga topshiriladigan, direktor tomonidan tasdiqlanadigan **rasmiy hujjat** bo'lgani uchun, formatdan hech qanday og'ish bo'lmasligi kerak. Quyidagi har bir band — qat'iy talab, ixtiyoriy emas.

**A) Ikki alohida varaq (sheet) — asosiy maktab va filial.**
Real faylda ikkita sheet bor: filial jadvali va asosiy maktab jadvali, alohida-alohida. Export logikasi shunga mos:
- Filter = `Barchasi` → export faylida **ikkita sheet** bo'ladi: birinchisi asosiy maktab, ikkinchisi filial (nomlari: maktab nomi va filial nomi bo'yicha).
- Filter = `Faqat asosiy maktab` yoki `Faqat filial` → faylda **bitta sheet**.
- Filter = `Filial bilan birga` → ikkita sheet, lekin faqat tanlangan filial(lar) uchun.
- Agar maktabda filial umuman bo'lmasa — filial bilan bog'liq filter va sheet variantlari UI'da ko'rsatilmaydi.

**B) Sarlavha bloki (har bir sheet'ning yuqorisida, aynan shu tartibda):**
```
                                                    TASDIQLAYMAN
                                                    Maktab direktori: __________ [School.directorFullName]
                                                    "____"____________20___ yil

              [Filial nomi bo'lsa shu yerda]        D A R S   J A D V A L I
                                                    [Tuman nomi] tumani [Maktab raqami/nomi] - umumiy o'rta
                                                    ta'lim maktabining [Term.academicYear] o'quv yili,
                                                    [Term.name] uchun tuzilgan
```
Bu maydonlar School va Term modellaridan avtomatik to'ldiriladi — admin ularni faqat bir marta (School sozlamalarida) kiritadi, keyin har bir export'da avtomatik chiqadi. `directorFullName` bo'sh bo'lsa, export oldidan tizim "Direktor ismini kiriting" deb ogohlantiradi (rasmiy hujjat imzosiz chiqib ketmasligi uchun).

**C) Asosiy jadval grid tuzilishi — ustunlar ketma-ketligi:**
`Kun | t/r | Vaqt | [Sinf-1 nomi] | [Sinf-1 fan-o'qituvchisi] | [Sinf-2 nomi] | [Sinf-2 fan-o'qituvchisi] | ... | (bo'sh ustun) | t/r | O'qituvchilarning I.F.Sh`

- **"Kun" ustuni** — har kun uchun 6 (yoki period soniga qarab N ta) qatorga **vertikal merge** qilinadi (masalan "DUSHANBA" bitta katakda, 6 qatorni egallab turadi) — bu Excel export'da `worksheet.mergeCells()` bilan aniq bajarilishi shart, matn kun boshida faqat bir marta yozilib qolmasligi kerak.
- **Har bir sinf uchun IKKITA ustun**, bitta emas: birinchisida **fan nomi** (masalan "Matematika"), ikkinchisida **o'qituvchining `displayNumber` raqami** (masalan "35") — F.I.Sh emas, faqat raqam. Bu — joy tejash uchun real maktablarda qabul qilingan andoza va tizim buni aynan takrorlaydi.
- Har bir kun blokidan keyin **bitta bo'sh qator** qoldiriladi (vizual ajratish uchun) — real faylda ham shunday.
- Har bir sinf-ustun juftligi ustida sinf nomi sarlavhasi (masalan "5A", "6D") turadi.

**D) O'ng tomondagi o'qituvchilar reestri (legend jadvali):**
Sheet'ning eng o'ng chetida, asosiy grid bilan yonma-yon, alohida ikki ustunli jadval: `t/r | O'qituvchilarning I.F.Sh` — bu yerda **shu maktabning barcha o'qituvchilari** `displayNumber` tartibida, to'liq F.I.Sh bilan sanab o'tiladi (1 dan boshlab, masalan 41 tagacha). **Bu reestr — filial va asosiy maktab sheet'lari uchun UMUMIY va BIR XIL raqamlash** (chunki bitta o'qituvchi ikkala joyda ham ishlashi mumkin, raqami hamma joyda bir xil bo'lishi shart — 5-bo'limdagi `Teacher.displayNumber` shu sababdan School darajasida yagona).

**E) "Dars soati" qatori (jadval tagida, har bir sinf ustuni ostida):**
Har bir sinfning shu haftalik JAMI dars soati ko'rsatiladi — bu qiymat **qo'lda kiritilmaydi**, `ClassSubject.weeklyHours` yig'indisidan **avtomatik hisoblanadi** (Excel formulasi sifatida yozilishi ham mumkin, lekin export vaqtida qiymat allaqachon backend'da hisoblab qo'yilgani uchun oddiy raqam sifatida ham yozilishi mumkin). Tizim bu yig'indini sinf darajasi (grade) uchun O'zbekiston davlat ta'lim standartidagi me'yoriy soat bilan solishtiradi va agar farq bo'lsa, Setup Wizard bosqichida (jadval generatsiyasidan oldin) ogohlantiradi — masalan "5-sinf uchun standart 29 soat, siz 27 soat belgilagansiz, tekshiring."

**F) "Sinf rahbar" qatori (undan keyin, jadval eng tagida):**
Har bir sinf ustuni ostida o'sha sinfning sinf rahbari F.I.Sh (qisqartirilgan, masalan "Sagirayev R.") ko'rsatiladi — `Class.homeroomTeacherId` orqali avtomatik to'ldiriladi.

**G) Footer — ikkinchi imzo bloki:**
Jadval tagida, "Sinf rahbar" qatoridan keyin, ikkita alohida imzo qatori:
```
O'quv ishlar bo'yicha direktor o'rinbosari: ________________  [School.academicVicePrincipalName]
Ruhshunos: ________________  [School.psychologistName]
```
Bu ham School modelidan avtomatik to'ldiriladi.

**H) Vizual formatlash talablari:**
- Sarlavha qatorlari (Kun/t/r/Vaqt/Sinf nomlari) — qalin (bold), fon rangi bilan ajratilgan, freeze qilingan (scroll qilganda ko'rinib turadi).
- Har bir fan-katakchasi ixtiyoriy ravishda o'sha fanning `Subject.colorTag` rangida yengil fon bilan bo'yalishi mumkin (admin sozlamada "Export'da fan ranglarini ko'rsatish" — yoqilgan/o'chirilgan qilib tanlaydi, chunki rasmiy hujjat sifatida ba'zi maktablar oddiy oq-qora ko'rinishni afzal ko'radi).
- Barcha chegaralar (border) — yupqa qora chiziqlar, print qilishga tayyor holatda (A3 gorizontal formatga moslashtirilgan sahifa sozlamalari — real jadval kенг bo'lgani uchun bosma uchun A3 standart).
- Shrift — Times New Roman yoki Arial, rasmiy hujjatlarga mos (9-bo'lim boshidagi "Professional font" qoidasi bilan mos).

**I) Chorak (Term) bilan bog'liqlik:**
Fayl nomi va sarlavha ichida chorak nomi ham aks etadi (masalan foydalanuvchi yuklagan faylning o'zi nomida "4-CHORAK" bor). Har chorak boshida admin xohlasa yangi Term yaratib, avvalgi chorakning jadvalini asos qilib "nusxalab" tahrirlashi mumkin (odatda chorakdan-chorakka jadval unchalik ko'p o'zgarmaydi — faqat kichik tuzatishlar bo'ladi), yoki generatsiyani noldan qayta ishga tushirishi mumkin.

### 9.2 Nazorat ro'yxati — hech nima tushib qolmasligi uchun
Agent Excel export modulini yakunlashdan oldin quyidagilarning barchasi bajarilganini o'zi tekshiradi:
- [ ] Ikki-ustunli sinf bloklari (fan + o'qituvchi raqami), F.I.Sh emas
- [ ] "Kun" ustunining vertikal merge'i
- [ ] O'ng tomondagi umumiy o'qituvchilar reestri (t/r + F.I.Sh), filial/asosiy sheet'lar orasida bir xil raqamlash
- [ ] TASDIQLAYMAN + direktor imzo qatori (yuqorida)
- [ ] "D A R S J A D V A L I" sarlavhasi + maktab/tuman/o'quv yili/chorak matni
- [ ] "Dars soati" (jami soat) qatori — avtomatik hisoblangan
- [ ] "Sinf rahbar" qatori
- [ ] O'quv ishlar bo'yicha direktor o'rinbosari + Ruhshunos imzo qatorlari (pastda)
- [ ] Kunlar orasida bo'sh ajratuvchi qator
- [ ] Filial va asosiy maktab uchun alohida sheet mantiqi (filterga bog'liq)
- [ ] Fan nomlari faqat katalogdan — erkin matn yo'q, demak yozuv xatolari (real faylda uchragan "Ingli tili" kabi) tizimda tamomila imkonsiz

---

## 10. Drag & Drop tahrirlash tizimi (batafsil)

### 10.1 Rang-status tizimi — ishlash mantig'i
Admin biror darsni **ushlab olgan zahoti** (drag boshlanganda), butun jadval grid'i darhol qayta-render bo'lib, **har bir bo'sh/band katakcha uchta holatdan birida bo'yaladi:**

| Rang | Ma'no | Xatti-harakat |
|---|---|---|
| 🟢 **Yashil** | To'liq xavfsiz — hech qanday cheklov buzilmaydi | Tashlash (drop) darhol bajariladi, bazaga yoziladi, Socket.io orqali boshqa foydalanuvchilarga tarqatiladi |
| 🟡 **Sariq** | Soft constraint buziladi, lekin texnik jihatdan mumkin | Tashlaganda **tasdiqlash modali** chiqadi: aniq sabab matni + "Baribir joylashtirish" / "Bekor qilish" tugmalari |
| 🔴 **Qizil** | Hard constraint buziladi — mumkin emas | Tashlab bo'lmaydi (drop qabul qilinmaydi, dars avtomatik joyiga qaytadi), ustiga hover qilinganda yoki tashlashga urinilganda **sabab tooltip/toast** ko'rsatiladi |

### 10.2 Sabab xabarlari — matn namunalari (agent shu ohangda yozishi kerak: aniq, ayblamaydigan, hal qiluvchi tilda)

**Qizil holat uchun:**
> "Bu joyga qo'yib bo'lmaydi — [O'qituvchi ismi] shu vaqtda [Sinf nomi]da band."

> "Bu joyga qo'yib bo'lmaydi — [Sinf nomi]da bu vaqtda allaqachon [Fan nomi] darsi bor."

> "Bu joyga qo'yib bo'lmaydi — bu [O'qituvchi ismi]ning metod kuni."

**Sariq holat uchun:**
> "Diqqat: bu holatda [O'qituvchi ismi]ning shu kungi yuklamasi [N] soatdan [N+1] soatga ko'tariladi. Baribir joylashtirilsinmi?"

> "Diqqat: [Sinf nomi] uchun [Fan nomi] darsi bugun ikkinchi marta bo'ladi. Baribir joylashtirilsinmi?"

> "Diqqat: [O'qituvchi ismi]ga [Filial A]dan [Filial B]ga o'tish uchun atigi [N] daqiqa qoladi. Baribir joylashtirilsinmi?"

Xabarlar **har doim sababni aniq ko'rsatadi** — hech qachon "bu mumkin emas" kabi tushunarsiz umumiy xabar berilmaydi (bu — sizning talabingiz: "nega sariq/qizil ekanini aytsin").

### 10.3 Real-time ko'p foydalanuvchili tahrirlash
Ikki admin bir vaqtda jadvalni ochsa: birov dars ko'chirganda, ikkinchisining ekranida **animatsiyali** ravishda (200-300ms transition) yangilanadi + "[Ism] tomonidan hozir o'zgartirildi" degan qisqa toast chiqadi. Agar ikkalasi ham bir vaqtda bir xil katakchaga tashlashga urinsa — server-side "oxirgi yozuv g'olib" (last-write-wins) qoidasi, lekin yutqazgan foydalanuvchiga darhol xabar ko'rsatiladi va uning ekrani avtomatik to'g'irlanadi.

### 10.4 Tarix / Undo-Redo / Audit
- Har bir drag-and-drop harakati `AuditLog`ga yoziladi.
- Jadval sahifasida **Undo tugmasi** (Ctrl+Z ham) — oxirgi 10 ta harakatni bekor qilish imkoni.
- "O'zgarishlar tarixi" paneli — kim, qachon, qaysi darsni qayerdan qayerga ko'chirgani ro'yxati (filtr: sana, foydalanuvchi bo'yicha).
- `isLocked` bayrog'i bilan belgilangan darslar drag-and-drop'dan **himoyalangan** — admin ayrim muhim darslarni (masalan direktor amaliyoti) "qulflab qo'yishi" mumkin, ular tasodifan ko'chirilmaydi.

---

## 11. Super Admin paneli

- **Maktablar ro'yxati** — nomi, obuna holati, ro'yxatdan o'tgan sana, oxirgi faollik, o'qituvchi/sinf soni (umumiy hajm ko'rsatkichi sifatida).
- **Maktab yaratish** — yangi maktab + birinchi admin login ma'lumotlarini generatsiya qilish.
- **Obuna boshqaruvi** — trial/active/suspended holatlarini qo'lda o'zgartirish (MVP'da to'lov integratsiyasi yo'q, Super Admin qo'lda faollashtiradi — O'zbekiston SMB bozorida odatiy amaliyot).
- **"Support sifatida kirish"** — Super Admin muammo hal qilish uchun istalgan maktab ichiga kira oladi, lekin bu harakat **doim audit-log'ga yoziladi va maktab admin ekranida "Support tomonidan ko'rilmoqda" degan bildirishnoma ko'rinadi** (shaffoflik uchun).
- **Global statistika** — jami maktablar, jami o'qituvchilar/o'quvchilar (agregat), eng faol maktablar.

---

## 12. UI/UX dizayn yo'nalishi

Mavzu — jadval, davriylik, aniqlik. Umumiy "AI mahsulot" shabloniga (issiq krem fon + terracotta aksent, yoki qora fon + acid-green) tushib qolmaslik uchun quyidagi yo'nalish beriladi:

**Palitra:** Chuqur ko'k-indigo (`#1E2A4A` atrofida) — ishonch va tartib beruvchi asosiy chrome rang (sidebar, header). Fon — deyarli oq emas, iliq bo'z-kulrang (`#F7F6F3`), toza qog'oz emas, real "jurnal daftar"ga yaqinroq. Aksent — issiq amber/asal rangi (`#E8A33D` atrofida) — faqat interaktiv elementlar (tugmalar, faol tab) uchun, hech qachon status ranglari bilan aralashtirilmaydi. **Status ranglari (yashil/sariq/qizil) — brend palitrasidan mutlaqo mustaqil**, funksional semantik rang sifatida alohida saqlanadi (masalan `#3FA34D` / `#E8A33D`... status uchun boshqa, aniqroq sariq — brend ambери bilan chalkashmasin, shuning uchun status-yellow sal boshqacharoq issiq-sariq soyada bo'ladi, brend-amber esa muloyimroq).

**Tipografika:** Sarlavhalar uchun tor-geometrik grotesk (masalan Space Grotesk yoki shunga o'xshash xarakterli, lekin haddan tashqari "AI-default" bo'lmagan shrift) — o'z tartibliligi bilan "jadval" mavzusiga mos keladi. Matn uchun neytral humanist sans (Inter yoki Manrope). Jadval katakchalarining ichidagi raqamlar (period, vaqt) — **tabular figures** bilan, hech qachon jilmayib turmaydi, ustun-ustunga aniq tekislanadi — bu funksional talab, jadval noto'g'ri tekislansa professional ko'rinmaydi.

**Layout va imzo elementi:** Bosh sahifa/dashboard'ning markaziy qahramoni — **jonli, kichik animatsiyali dars jadvali grid namoyishi** (haqiqiy drag-and-drop harakatini o'zi ko'rsatib turadigan mini-demo), katta sarlavha yoki statistik raqamlar emas. Bu mahsulotning o'zi nima qilishini birinchi soniyada ko'rsatadi — "bu jadval quruvchi" deb aytishning hojati qolmaydi.

**Signature element:** Dars katakchasi (lesson chip) komponenti — yumaloq burchakli, chap chetida fan-rangi ingichka chiziq (border-left accent), ichida fan nomi + o'qituvchi qisqa ismi + (agar filial bo'lsa) filial belgisi. Bu komponent butun mahsulot davomida takrorlanadi (jadvalda, export preview'da, o'qituvchi kartochkasida) va mahsulotning "vizual imzosi"ga aylanadi.

**Harakat (motion):** Drag-and-drop paytidagi rang o'tishlari yumshoq (150-200ms ease), ortiqcha animatsiya yo'q — funksional aniqlik ko'ngil ochar effektlardan ustun. Generatsiya tugagach — natija kartasi bitta qisqa "reveal" animatsiyasi bilan chiqadi, boshqa joyda ortiqcha harakat yo'q.

**Dark/light mode:** Ikkalasi ham to'liq qo'llab-quvvatlanadi (mavjud global skill-dagi qoida bo'yicha), status ranglari ikkala rejimda ham bir xil tushunarli darajada kontrastli qoladi (dark mode'da to'yinganlik biroz pasaytiriladi, ko'zni charchatmaslik uchun).

**Mobil moslashuvchanlik:** Setup Wizard va jadval ko'rish planshet/mobil'da ham ishlaydi (o'qituvchilar ko'pincha telefondan jadval tekshiradi), lekin **drag-and-drop tahrirlash — desktop-first** funksiya (bu — admin ish stoli vazifasi, mobilda faqat ko'rish rejimi yetarli).

---

## 13. Xavfsizlik

- Parollar — bcrypt/argon2 hash.
- Har bir API so'rovda `schoolId` session'dan olinadi, hech qachon client'dan yuborilgan `schoolId`ga ishonilmaydi.
- Rate limiting — login endpoint'larida (brute-force himoyasi).
- Super Admin impersonation — vaqtinchalik token (masalan 30 daqiqa), avtomatik tugaydi.
- SQL injection — Prisma parametrized query orqali avtomatik himoyalangan, xom SQL yozishdan qochiladi.

---

## 14. Fazalar (Roadmap)

**MVP (V1):**
Super Admin + Maktab Admin rollari, to'liq Setup Wizard, Constraint-solver generatsiya (LLM izoh qatlami bilan), drag-and-drop + rang-status tizimi, Excel export, filial/smena/filter tizimi, Socket.io real-time sync, audit-log.

**V2:**
Filial Admin roli, O'qituvchi (read-only) portali + Telegram bot bildirishnomalari, to'lov integratsiyasi (Payme/Click — O'zbekiston bozori standarti), xona/kabinet (`Room`) modeli va xona-band-bo'lish constraint'i, PDF export, ota-ona/o'quvchi ko'rish rejimi.

**V3:**
Ko'p tilli interfeys (o'zbek/rus/ingliz), maktab o'rtasida shablon almashish (bir maktab tuzgan fan-soat andozasini boshqa maktab import qilishi), analytics dashboard (o'qituvchi yuklama balansi, filial samaradorligi).

---

## 15. Branding vazifasi — agent uchun ijodiy topshiriq

Quyidagilarni agent **mustaqil ravishda** yakunlaydi (foydalanuvchi ular bilan shug'ullanmaydi):

- **Mahsulot nomi.** Yo'nalish sifatida: "jadval", "taqsim", "smart" so'zlari asosida o'zbekcha yoki lotin-o'zbekcha ohangdor nom (masalan uslub sifatida — *Jadvalo, Taqsimo, SinfAI, Darslik.AI* kabi yo'nalishlar bor, lekin agent yakuniy nomni logotip bilan birga o'zi tanlaydi va bu TZ'dagi ohangga — aniqlik, ishonch, tartib — mos kelishini tekshiradi).
- **Logotip va favicon** — 12-bo'limdagi palitra va tipografika yo'nalishiga asoslanib, SVG formatda, dark/light versiyalari bilan.
- **Domen/subdomain strategiyasi** — agar mumkin bo'lsa taklif qiladi, aks holda oddiy `app.domain.uz/[maktab-slug]` yondashuvida qoladi.

---

## 16. Antigravity agentlarga ishga tushirish ko'rsatmasi

Bu TZ **to'liq mustaqil ishlash uchun yetarli**. Agent quyidagi tartibda harakat qilishi tavsiya etiladi:

1. PM-subagent: ushbu hujjatdan foydalanib to'liq feature-breakdown va development-plan tuzadi (fazalarga bo'lib — avval DB schema + auth, keyin Setup Wizard, keyin generatsiya dvigateli, keyin drag-and-drop, oxirida export/Super Admin).
2. Har bir modul uchun mavjud global skill-lar (component-architecture, input-validation — O'zbek telefon formati, dark/light theming, icon-standards, git-workflow) avtomatik qo'llaniladi.
3. **"Oltin Qoidalar" (1-bo'lim) — har qanday texnik qaror ustidan ustuvor**, agar boshqa qulayroq yechim shu qoidalarga zid bo'lsa, qoida yutadi.
4. Generatsiya dvigateli (7-bo'lim) — alohida, yaxshi test qilinadigan modul sifatida ishlab chiqiladi (unit-testlar bilan: har bir hard constraint uchun alohida test-case).
5. QA-subagent yakunda: rang-status tizimini haqiqiy ziddiyatli senariylar bilan (bir xil o'qituvchi ikki sinfga, metod kuniga urinish, filiallararo bufer yetishmasligi) qo'lda tekshiradi — bu TZ'ning yuragi bo'lgani uchun eng ko'p e'tibor shu yerga qaratiladi.

---

*Hujjat oxiri. Savollar yoki noaniqliklar bo'lsa — agent taxmin qilmasdan, TZ'dagi eng yaqin tamoyilga (masalan "Oltin Qoidalar" yoki "soft constraint mantiq"i) tayanib qaror qabul qiladi va bu qarorni commit-message yoki PR-tavsifida qisqacha izohlaydi.*
