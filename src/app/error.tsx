"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-4 shadow-lg shadow-rose-500/10">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h2 className="text-lg font-extrabold text-foreground">
        Kutilmagan xatolik yuz berdi
      </h2>
      <p className="text-xs text-muted-foreground max-w-md mt-1 mb-6">
        {error?.message || "Tizimda vaqtinchalik muammo aniqlandi. Sahifani qayta yuklab ko'ring."}
      </p>

      <div className="flex items-center gap-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Qayta urinish</span>
        </button>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border border-border hover:bg-muted text-foreground transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>Bosh sahifaga qaytish</span>
        </Link>
      </div>
    </div>
  );
}
