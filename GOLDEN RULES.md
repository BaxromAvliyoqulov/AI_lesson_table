# 📜 GOLDEN RULES — Dars Jadval AI (SaaS Platform)

## 1. 🎯 Loyiha Maqsadi & Arxitekturaviy Pozitsiya
Ko'p filialli va ko'p smenali maktablar uchun deterministik CSP algoritm va AI izohlari yordamida ziddiyatsiz dars jadvalini avtomatik tuzuvchi, Master Grid doskasida drag-and-drop va swap orqali tahrirlanuvchi, 1-Click Excel import/export qo'llab-quvvatlovchi ko'p-tenantli (multi-tenant) B2B SaaS platformasi.

---

## 2. 🛡️ Muzokara Qilinmaydigan Qoidalar (Ironclad Rules)
1. **Clean Code & Modular Architecture:** Hech bir fayl hajmi 500 qatordan oshmasligi shart. Barcha sahifalar va modullar `tabs/`, `modals/`, `shared/` va `store/` papkalariga ajratiladi.
2. **PostgreSQL & Prisma — Yagona haqiqat manbai:** Barcha jadvallar, o'qituvchilar, sinflar, fanlar va cheklovlar `src/lib/prisma.ts` orqali boshqariladi.
3. **Global State Sinxronizatsiyasi:** `/sozlamalar` va `/` (Master Grid) sahifalari `useSchoolStore` orqali bog'langan bo'lib, o'zgarishlar darhol barcha sahifalarda aks etadi.
4. **Multi-Tenant Izolyatsiya:** Har bir SQL/Prisma so'rovida `schoolId` majburiy.
5. **Jadval Versiyalash:** Amaldagi jadval buzilmaydi. Yangi jadval `DRAFT` holatda ishlanadi, admin tasdiqlagach `PUBLISHED` bo'ladi.
6. **Deterministik Solver + AI Izohi:** Generatsiya deterministik CSP orqali soniyalar ichida yechiladi. `AIAssistant` (LLM) esa yechilmagan holatlarni o'zbek tilida tushuntiradi.
7. **Audit Trail:** Barcha dars ko'chirishlar, swaplar va generatsiyalar `AuditLog`da yozib boriladi.
8. **Undo/Redo:** Master Grid'da oxirgi 15 ta harakatni Ctrl+Z orqali bekor qilish imkoniyati saqlanadi.

---

## 3. 🗺️ Texnologik Stack
* **Framework:** Next.js 15 (App Router), React 19, TypeScript
* **State Management:** Custom Unified Store (`useSchoolStore`) + LocalStorage Cache
* **Styling & UI:** TailwindCSS, Lucide Icons, Glassmorphism
* **Drag & Drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
* **Database & ORM:** PostgreSQL + Prisma ORM (Singleton)
* **REST APIs:** Next.js Route Handlers (`/api/schedules`, `/api/zamena`, `/api/ai/explain`)
* **Excel Engine:** `exceljs` (1-Click Import & Multi-sheet Export)
* **AI Provider:** `AIAssistant` (Conflict explanation & Smart Zamena)
* **Deployment:** Dockerfile, Docker Compose (PostgreSQL, Redis, Next.js)

---

## 4. 📊 Joriy Holat & Roadmap
- [x] **0-Faza:** Texnik Topshiriq (TZ v2.0 Enterprise) to'liq tasdiqlandi.
- [x] **1-Faza:** Next.js 15 loyiha poydevori, Tailwind, Glassmorphism va Design System integratsiyasi.
- [x] **2-Faza:** Prisma Database Schema (Multi-tenant) va TypeScript modellar to'liq shakllantirildi.
- [x] **3-Faza:** Onboarding moduli (5 qadamli Setup Wizard + 1-Click Excel Bulk Import).
- [x] **4-Faza:** CSP Generatsiya Dvigateli (Greedy + Min-Conflicts + SanPiN yuklama shkalasi + Double Lessons + Room constraints).
- [x] **5-Faza:** Master Grid View (Drag & Drop, SWAP, Zoom in/out 75%-125%, Sticky headers, Undo/Redo).
- [x] **6-Faza:** Zamena (O'rinbosar tayinlash) va Excel Multi-sheet Eksport dvigateli.
- [x] **7-Faza:** Monolit refaktoring: 2,898 qatorli sozlamalar sahifasi 13 ta toza modular komponentga ajratildi (Hech qayerda 1000+ kod yo'q).
- [x] **8-Faza:** Global Store (`useSchoolStore`) orqali sahifalararo ma'lumot uzilishi bartaraf qilindi.
- [x] **9-Faza:** Prisma DB singleton, Backend REST API routelar va AI yordamchi integratsiyasi.
- [x] **10-Faza:** Production & Scaling poydevori (Dockerfile, Docker Compose, Error/Loading boundaries, Security Headers).
- [x] **11-Faza:** Production build verifikatsiyasi (100% Green / Zero-Error).
- [x] **12-Faza:** Auth + NextAuth v5 Beta — Login sahifalari (Maktab Admin + Super Admin), middleware route guard, session JWT, TypeScript type extensions, AUTH_SECRET env.
- [x] **13-Faza:** Setup Wizard (6 bosqich) — SchoolProfile, Subjects (28 fan katalogi), Teachers, Shifts+Bells, Branches, Classes+Duplicate. `completeSetup()` Prisma transaction Server Action.
- [x] **14-Faza:** Server Actions — localStorage → Neon PostgreSQL to'liq sinxronizatsiya qilindi (Oltin Qoida 2 bajarildi, 55 o'qituvchi, 29 sinf, 734 dars Neon bulutida, live cloud sync badge).
- [x] **15-Faza:** Super Admin Paneli (`/super-admin`) — Neon PostgreSQL ga ulandi: CRUD maktablar, obuna holatini boshqarish, yangi maktab + admin yaratish, Impersonation (maktabga kirish).
- [x] **16-Faza:** Drag & Drop Jonli Ziddiyat Tizimi — `drag-validator.ts` SanPiN yuklama, o'qituvchi kolliziyasi, metod kuni, xona bandligi bo'yicha 🟢 Yashil / 🟡 Sariq / 🔴 Qizil real-time radar tizimi ishga tushirildi.
- [x] **17-Faza:** Excel Export — 39-maktab andozasidagi rasmiy A3 albom formati (`paperSize: 8`, Times New Roman, direktor "TASDIQLAYMAN" muhri, Zauch va Ruhshunos rasmiy imzolari, o'qituvchilar reestri bilan 1-click eksport dvigateli).
- [x] **19-Faza:** Multi-Device & Cloud Auto-Resolver — Har qanday kompyuter/brauzerdan (Zauch, Admin) kiritilgan o'zgarishlar ID aliaslaridan qat'i nazar Neon PostgreSQL ga to'liq sinxronlanadi, Two-Way Cloud Push/Pull va interaktiv sinxronlash badge ishga tushirildi.
- [x] **20-Faza:** Two-Way Sinf Rahbarligi Tizimi (Homeroom Teacher Engine) — O'qituvchilar va Sinflar o'rtasida 2 tomonlama atomik sinxronizatsiya, `TeacherModal` va `ClassModal`da sinf/ustoz tanlash, `TeachersTab` va `ClassesTab`da tezkor 1-bosishda rahbar biriktirish/o'zgartirish, `ClassSelectCombobox`, "Faqat sinf rahbarlari" va "Rahbari yo'qlar" filtrlari, Master Grid va A3 Excel reestrida avtomatik "Sinf soati" (Juma 1-soat) bog'lash to'liq ishga tushirildi.
- [x] **21-Faza:** Dars Soatlarini Belgilash va O'qituvchi Yuklamasi Tizimi (Tarifikatsiya UI/UX Engine) — 1-sinfdan 11-sinfgacha O'zbekiston Davlat Standarti bo'yicha 1-Click "⚡ Standart Rejani Yuklash" shablon dvigateli (`curriculum-templates.ts`), har bir fan uchun `[-] soat [+]` tezkor stepperlari, sinfdan sinfga nusxalash (`CurriculumModal`), o'qituvchi tomondan sinflarga soat taqsimlash modali (`TeacherWorkloadModal`), jonli stavka to'lish indikatori va 2 tomonlama PostgreSQL atomik sinxronizatsiyasi (`saveTeacherWorkloadAction`) to'liq ishga tushirildi.
- [x] **22-Faza:** Qat'iy Dushanba 1-soat "Kelajak Soati" & Tabiiy Sinf Tartiblash Dvigateli — 1) Qat'iyan Dushanba 1-darsga "Kelajak soati" (Sinf soati) bog'landi, sinf rahbari o'zgarganda dushanba 1-dars avtomatik sinxronlashadi. 2) O'zbekiston lotin/kirill alifbosi asosida tabiiy sinf tartiblash algoritmi (`sortClassesByName`) yaratildi (8-D endi 8-A va 8-B dan keyin, 9-D esa 9-sinflar orasida joylashadi, dars jadvali oxiriga surilib ketmaydi).
- [x] **23-Faza:** Fanlarni Faol/Nofaol Boshqarish Tizimi (Active/Inactive Subjects Engine) — Maktablar o'zlarida o'tilmaydigan fanlarni (masalan Nemis, Fransuz, Astronomiya) o'chirib yubormasdan 1-bosishda ⚪ Nofaol qilib qo'yish imkoniyati; `SubjectsTab`da 🟢 Faol / ⚪ Nofaol toggle switchlari va status filtrlari, `SubjectModal`da faollik belgilash, `CurriculumModal` va `TeacherModal`da faqat faol fanlarni ko'rsatish filtrlari to'liq ishga tushirildi.
- [x] **24-Faza:** O'qituvchilar Sahifasi Status Barlari va Jonli Stavka Radar Tizimi (Teacher Status Bars Engine) — 1) Yuqori KPI Dashboard Status Bar (Umumiy dars yuklamasi progress bari, stavka taqsimoti segmentlari, sinf rahbarligi qamrovi). 2) Har bir o'qituvchi kartochkasida real-time dars yuklamasi progress bari (🟢 80-100% Optimal, 🟡 &lt;80% Bo'sh soatli, 🔴 &gt;100% Ortiqcha). 3) Status filtrlari ("To'liq", "Bo'sh", "Ortiqcha"). 4) `TeacherScheduleView` o'qituvchi jadvalida jonli soat to'lish indikatori va kunlik dars taqsimot pillari.
- [x] **25-Faza:** Boshlang'ich Sinflar uchun Fanlarni Avtomatik Moslash Tizimi (Grade-Level Subject Filter Engine) — 1-4 boshlang'ich sinf tanlanganda faqat boshlang'ichga mos fanlar (Ona tili, Matematika, Tabiiy fan, Tarbiya, Rasm, Musiqa, Texnologiya, Jismoniy tarbiya, Chet tili, Informatika, Kelajak soati) birinchi guruhda ko'rsatiladi; yuqori sinf fanlari (Fizika, Kimyo, Biologiya, Algebra, Geometriya, Geografiya, Tarix, Huquq, CHQBT, Astronomiya) boshlang'ich sinflarga xatolik bilan qo'shilib ketmasligi uchun `CurriculumModal` va `TeacherWorkloadModal`da `isSubjectSuitableForGrade` filtrlari to'liq joriy qilindi.
- [x] **26-Faza:** 7 xil Aniq Dars Jadvali Ko'rinishlari Tizimi (7-Mode Unified Schedule Filtering Engine) — Dars jadvali va Master Grid doskasida aniq 7 xil tartiblangan ko'rinish filtrlari to'liq ishga tushirildi: 1. Asosiy Hammasi, 2. Asosiy Boshlang'ich (1-4), 3. Asosiy Kattalar (5-11), 4. Filial Hammasi, 5. Filial Boshlang'ich (1-4 D), 6. Filial Kattalar (5-7 D), 7. Hammasi (Butun maktab).
- [x] **27-Faza:** 5 ta "Juda Muhim" Korporativ Imkoniyatlar Dvigateli (Split Groups, A3 Print, Teacher Timetable Cards, AI Zamena, eMaktab Excel Import) — 1) Split Groups (1-guruh/2-guruh parallel darslar). 2) Rasmiy A3 devoriy dars jadvalini brauzerdan to'g'ridan-to'g'ri chop etish (`OfficialSchedulePrintModal`). 3) 55 ta o'qituvchining haftalik shaxsiy dars jadvali varaqalari va ommaviy chop etish (`TeacherTimetableCardsModal`). 4) AI Aqlli Zamena Tavsiyasi (`ZamenaModal`). 5) eMaktab (Kundalik.com) Excel import dvigateli (`EMaktabImportModal`).
- [x] **28-Faza:** eMaktab Universal Excel Import & Toza Real Data Arxitekturasi — 1) SheetJS (`xlsx`) orqali har qanday `.xls`, `.xlsx`, `.csv` va eMaktab (Kundalik.com) matritsa eksportlarini 100% xatosiz o'qish va AI skanerlash tizimi joriy etildi. 2) Loyihadagi barcha Mock Data, Demo versiyalar va avto-seedlar butunlay olib tashlandi; 58 nafar haqiqiy o'qituvchi o'zbek alifbosi bo'yicha to'liq tartiblangan holda bazaga kiritildi.

- [x] **29-Faza:** Zero-Defect Avtomatlashtirilgan Testlar Tizimi (Vitest & Playwright QA Suite) — 17 ta unit va algoritm testlari (CSP 0-conflict solver, O'zR SanPiN o'quv reja shablonlari, tabiiy sinf tartiblash, o'qituvchi yuklamasi, real-time drag-drop radar), 100% Green PASS va Playwright E2E testlar poydevori to'liq o'rnatildi.
- [x] **30-Faza:** Monolit Fayllarni Modullashtirish (Clean Modular Refactoring) — `Official39TableView.tsx` (1,901 qatordan ~360 qatorga, 5 ta modular subkomponentga) va `school.actions.ts` (1,591 qatordan ~80 qatorga, `teacher.actions.ts`, `class.actions.ts`, `subject.actions.ts`, `schedule.actions.ts`, `school-core.actions.ts` modullariga) to'liq ajratildi. Oltin Qoida 1 (maksimal 500 qator) 100% tiklandi.
- [x] **31-Faza:** O'zbekiston Qonunchiligi Asosida Rasmiy Metodik Kunlar va Bir Kunda Bir Xil Fan Takrorlanishini Qat'iy Taqiqlash (Strict Method Days & Zero-Duplicate Lesson Engine) — 1) O'zR MMTV va SanPiN standarti bo'yicha 6 kunlik metodik kunlar tizimi (`method-days.ts`) joriy qilindi (Dushanba: Boshlang'ich, Seshanba: Ona tili/Adabiyot/Rus tili, Chorshanba: Matematika/Informatika, Payshanba: Tarix/Huquq/Ijtimoiy, Juma: Chet tillari, Shanba: Tabiiy-amaliy va Sport). 2) Bir kunda bitta sinfga bir xil fan 2 marta tushishi QAT'IYAN TAQIQLANDI (CSP Solver, Drag & Drop validator, Cell Modal va Real-time jadval radari 100% himoyalandi).
- [x] **32-Faza:** Kombinatorik Ommaviy Sinf Yaratish Generatori & Sinf Dam Kunlari / Band Soatlar Matritsasi — 1) `ClassesTab.tsx` da sinf raqamlari (1..11) va parallellar (A, B, D..) ni kombinatsiya qilib 1-bosishda o'nlab sinflarni yaratuvchi jonli previewli Bulk Generator. 2) `ClassModal.tsx` da 5 kunlik/6 kunlik dam kunlari (masalan Shanba dam kuni) va aniq dars soatlarini darsdan yopib qo'yuvchi interaktiv soatlar matritsasi joriy etildi (CSP Solver to'liq ushbu cheklovlar asosida dars qo'yadi).
- [x] **33-Faza:** Global Store Monolitini To'liq Modullashtirish (Clean Modular Store Architecture) — 1,099 qatorli `useSchoolStore.ts` monolit fayli 6 ta toza va ixcham modulga ajratildi: `store-core.ts`, `store-sync.ts`, `useClassActions.ts`, `useTeacherActions.ts`, `useSubjectActions.ts`, `useLessonActions.ts`, `useMetaAndUIActions.ts`. Asosiy `useSchoolStore.ts` endi atigi ~40 qator bo'lib, Oltin Qoida 1 (maksimal 500 qator) 100% tiklandi.


- [x] **32-Faza:** To'liq Ekranli Mustaqil Tarifikatsiya & O'quv Rejasi Konsoli (`/tarifikatsiya` Dedicated Workspace) — Modal o'rniga to'liq mustaqil ultra-qulay sahifa ishga tushirildi; 1) Sinf bo'yicha o'quv rejasi boshqaruvi (1-click standart reja, soat stepperlari, ustoz tanlash), 2) O'qituvchi bo'yicha yuklama taqsimoti (fan filtri, stavka progress bari), 3) Katta ekranli keng matritsa rejimi (Excel uslubida).
- [ ] **28-Faza:** Socket.io real-time sinxronizatsiya



