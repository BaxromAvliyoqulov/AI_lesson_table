import React from "react";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="absolute w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-extrabold text-primary text-xs">
          AI
        </div>
      </div>
      <h3 className="mt-4 text-sm font-bold text-foreground animate-pulse">
        Dars Jadval AI yuklanmoqda...
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Maktab sinflari va dars jadvallari tayyorlanmoqda
      </p>
    </div>
  );
}
