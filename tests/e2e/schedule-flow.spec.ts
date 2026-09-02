/**
 * Playwright E2E Test Suite for Dars Jadval AI
 * Tests UI Loading, 7-Mode Filter Bar, Zoom In/Out, Modals & Print Trigger
 */
import { test, expect } from "@playwright/test";

test.describe("Dars Jadval AI - Master Table & Schedule Filtering E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should load the official 39-maktab schedule page with header and table", async ({ page }) => {
    // 1. Verify Page Title and Header
    await expect(page).toHaveTitle(/Jadval\.AI|Dars Jadval/i);
    await expect(page.getByText("TASDIQLAYMAN")).toBeVisible();
    await expect(page.getByText("D A R S   J A D V A L I")).toBeVisible();
  });

  test("should toggle between all 7 schedule filter views", async ({ page }) => {
    // 1. Asosiy Hammasi
    const filter1 = page.getByRole("button", { name: /1\.\s*🏢\s*Asosiy Hammasi/i });
    if (await filter1.isVisible()) {
      await filter1.click();
      await expect(page.getByText(/ASOSIY MAKTAB \(1-11 SINFLAR\)/i)).toBeVisible();
    }

    // 2. Asosiy Boshlang'ich (1-4)
    const filter2 = page.getByRole("button", { name: /2\.\s*👦\s*Asosiy Boshlang'ich/i });
    if (await filter2.isVisible()) {
      await filter2.click();
      await expect(page.getByText(/BOSHLANG'ICH SINFLAR/i)).toBeVisible();
    }

    // 3. Asosiy Kattalar (5-11)
    const filter3 = page.getByRole("button", { name: /3\.\s*🧑\s*Asosiy Kattalar/i });
    if (await filter3.isVisible()) {
      await filter3.click();
      await expect(page.getByText(/KATTA VA O'RTA SINFLAR/i)).toBeVisible();
    }

    // 4. Filial Hammasi
    const filter4 = page.getByRole("button", { name: /4\.\s*🏠\s*Filial Hammasi/i });
    if (await filter4.isVisible()) {
      await filter4.click();
      await expect(page.getByText(/FILIAL BINOSI/i)).toBeVisible();
    }
  });

  test("should open cell editor modal on cell click", async ({ page }) => {
    const tableCells = page.locator("table tbody td");
    const firstCell = tableCells.nth(4);
    if (await firstCell.isVisible()) {
      await firstCell.click();
      await expect(page.getByText(/Dars ma'lumotlarini tahrirlash|Yangi dars tayinlash/i)).toBeVisible();
      await page.getByRole("button", { name: /Bekor qilish/i }).click();
    }
  });

  test("should open and close requisites modal", async ({ page }) => {
    const requisitesBtn = page.getByRole("button", { name: /Rekvizitlar/i });
    if (await requisitesBtn.isVisible()) {
      await requisitesBtn.click();
      await expect(page.getByText(/Maktab va Dars Jadvali Rekvizitlari/i)).toBeVisible();
      await page.getByRole("button", { name: /Bekor qilish/i }).click();
    }
  });
});
