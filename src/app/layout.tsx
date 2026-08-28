import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jadval.AI — Maktab Dars Jadvalini Avtomatlashtirish Platformasi",
  description: "AI va CSP orqali ziddiyatsiz maktab dars jadvalini tuzish va Master Grid doskasida boshqarish SaaS platformasi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-blue-500/20 selection:text-blue-600">
        {children}
      </body>
    </html>
  );
}
