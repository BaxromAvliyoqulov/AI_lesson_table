import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "JadvalAI — Maktab Dars Jadvali Platformasi",
  description:
    "AI va CSP orqali ziddiyatsiz maktab dars jadvalini tuzish va Master Grid doskasida boshqarish — ko'p filialli maktablar uchun SaaS platforma.",
  keywords: ["dars jadval", "maktab jadval", "AI jadval", "JadvalAI"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-background text-foreground antialiased selection:bg-indigo-500/20"
      >
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
