# 📜 GOLDEN RULES — Dars Jadval AI (SaaS Platform)

## 1. 🎯 Loyiha Maqsadi & Arxitekturaviy Pozitsiya
Ko'p filialli va ko'p smenali maktablar uchun deterministik CSP algoritm va AI izohlari yordamida ziddiyatsiz dars jadvalini avtomatik tuzuvchi, Master Grid doskasida drag-and-drop va swap orqali tahrirlanuvchi, 1-Click Excel import/export qo'llab-quvvatlovchi ko'p-tenantli (multi-tenant) B2B SaaS platformasi.

---

## 2. 🛡️ Muzokara Qilinmaydigan Qoidalar (Ironclad Rules)
1. **PostgreSQL — Yagona haqiqat manbai:** Barcha jadvallar, o'qituvchilar, sinflar, fanlar va cheklovlar faqat bazada saqlanadi. `localStorage` faqat UI preference (zoom, oxirgi filter) uchun ruxsat etiladi.
2. **Multi-Tenant Izolyatsiya:** Har bir SQL/Prisma so'rovida `schoolId` majburiy. Barcha relatsiyalarda (`TeacherSubject`, `ClassSubject`, `TeacherAvailability`, `Room`, `Schedule`) `schoolId` filtri va indekslari saqlanadi.
3. **Jadval Versiyalash:** Amaldagi jadval buzilmaydi. Yangi jadval `DRAFT` holatda ishlanadi, admin tasdiqlagach `PUBLISHED` bo'ladi.
4. **Deterministik Solver + AI Izohi:** Generatsiya 100% kod darajasidagi deterministik CSP (Greedy + Min-Conflicts) orqali soniyalar ichida yechiladi. AI (LLM) esa yechilmagan holatlarni o'zbek tilida tushuntiradi.
5. **Real-time Sinxronizatsiya:** Socket.io orqali bir vaqtda ishlayotgan adminlar uchun optimistic UI + server confirm ta'minlanadi.
6. **Audit Trail:** Barcha dars ko'chirishlar, swaplar va generatsiyalar `AuditLog`da yozib boriladi.
7. **Undo/Redo:** Master Grid'da oxirgi 15 ta harakatni Ctrl+Z orqali bekor qilish imkoniyati bo'ladi.

---

## 3. 🗺️ Texnologik Stack
* **Framework:** Next.js 15 (App Router), React 19, TypeScript
* **Styling & UI:** TailwindCSS, shadcn/ui, Lucide Icons
* **Drag & Drop:** `@dnd-kit/core` + `@dnd-kit/sortable`
* **Database & ORM:** PostgreSQL + Prisma ORM
* **Cache & Real-time:** Redis, Socket.io
* **Excel Engine:** `exceljs` (1-Click Import & Multi-sheet Export)
* **AI Provider:** Anthropic Claude API / OpenAI

---

## 4. 📊 Joriy Holat & Roadmap
- [x] **0-Faza:** Texnik Topshiriq (TZ v2.0 Enterprise) to'liq tasdiqlandi va yangilandi.
- [ ] **1-Faza:** Next.js 15 loyiha poydevori, Tailwind, shadcn/ui va Design System integratsiyasi.
- [ ] **2-Faza:** Prisma Database Schema, Migratsiyalar, Seed ma'lumotlari va Multi-tenant Auth.
- [ ] **3-Faza:** Onboarding moduli (5 qadamli Setup Wizard + 1-Click Excel Bulk Import).
- [ ] **4-Faza:** CSP Generatsiya Dvigateli (Greedy + Min-Conflicts + SanPiN yuklama shkalasi).
- [ ] **5-Faza:** Master Grid View (Drag & Drop, Swap, Zoom in/out, Sticky headers, Undo/Redo).
- [ ] **6-Faza:** Zamena (O'rinbosar tayinlash) va Real-time Socket.io sinxronizatsiyasi.
- [ ] **7-Faza:** Excel & PDF Multi-sheet Eksport dvigateli.
- [ ] **8-Faza:** Super Admin boshqaruv paneli va Audit Log.
- [ ] **9-Faza:** QA Zero-Defect Testing va Production Deployment.
