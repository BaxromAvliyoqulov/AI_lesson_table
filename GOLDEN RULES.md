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
- [ ] **14-Faza:** Server Actions — localStorage → PostgreSQL (Oltin Qoida 2 bajarish)
- [ ] **15-Faza:** Super Admin Panel (maktablar, obuna, impersonation)
- [ ] **16-Faza:** Drag & Drop to'liq (qizil/sariq/yashil rang tizimi)
- [ ] **17-Faza:** Excel Export (real hujjat andozasi — A3, sarlavha, 39-maktab formati)
- [ ] **18-Faza:** Branding (JadvalAI logo, favicon)
- [ ] **19-Faza:** Socket.io real-time sinxronizatsiya
- [ ] **20-Faza:** CI/CD + E2E Tests (Playwright)
