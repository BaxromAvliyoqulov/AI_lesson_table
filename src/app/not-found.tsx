import React from "react";
import Link from "next/link";
import { Search, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center font-sans">
      <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-lg">
        <Search className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-foreground tracking-tight">404</h1>
      <h2 className="text-base font-bold text-foreground mt-2">
        Sahifa topilmadi
      </h2>
      <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-6">
        Siz qidirayotgan sahifa o'chirilgan yoki manzili noto'g'ri kiritilgan bo'lishi mumkin.
      </p>

      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
      >
        <Home className="w-4 h-4" />
        <span>Bosh sahifaga qaytish</span>
      </Link>
    </div>
  );
}
