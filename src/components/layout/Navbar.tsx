"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Calendar,
  Sparkles,
  Download,
  Upload,
  Settings2,
  Moon,
  Sun,
  School as SchoolIcon,
  RefreshCw,
  Undo2,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Building2,
  Plus,
  Shield,
  LogOut,
  User,
} from "lucide-react";
import { SchoolInfo } from "@/types";

interface NavbarProps {
  schools: SchoolInfo[];
  currentSchoolId: string;
  onSelectSchool: (schoolId: string) => void;
  onAddSchool: () => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  onGenerate: () => void;
  onExport: () => void;
  onOpenWizard: () => void;
  onOpenImport: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isGenerating: boolean;
  selectedBranch: string;
  onBranchChange: (branchId: string) => void;
  branches: { id: string; name: string }[];
}

export const Navbar: React.FC<NavbarProps> = ({
  schools = [],
  currentSchoolId = "school_39",
  onSelectSchool,
  onAddSchool,
  zoomLevel = 100,
  onZoomChange,
  onGenerate,
  onExport,
  onOpenWizard,
  onOpenImport,
  onUndo,
  canUndo = false,
  isGenerating = false,
  selectedBranch = "ALL",
  onBranchChange,
  branches = [],
}) => {
  const [isDark, setIsDark] = useState(false);
  const [isSchoolMenuOpen, setIsSchoolMenuOpen] = useState(false);

  const safeSchools = schools || [];
  const currentSchool =
    safeSchools.find((s) => s.id === currentSchoolId) ||
    safeSchools[0] || {
      id: "school_39",
      name: "39-Umumiy o'rta ta'lim maktabi",
      slug: "maktab-39",
    };

  const { data: session } = useSession();

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (!isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/95 backdrop-blur-md transition-colors">
      {/* Super Admin Notice Bar if viewing as Super Admin */}
      {session?.user?.role === "SUPER_ADMIN" && (
        <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>Siz Super Admin huquqi bilan maktab jadvalini ko'rmoqdasiz</span>
          </div>
          <a
            href="/super-admin"
            className="text-amber-700 dark:text-amber-300 hover:underline font-bold text-[11px] flex items-center gap-1"
          >
            ← Super Admin Paneliga qaytish
          </a>
        </div>
      )}

      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo & Maktab Tanlash (Multi-tenant) */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20 text-white">
            <Calendar className="h-5 w-5" />
          </div>

          <div className="relative">
            <button
              onClick={() => setIsSchoolMenuOpen(!isSchoolMenuOpen)}
              className="flex items-center gap-2 rounded-xl p-1 hover:bg-muted transition-colors text-left group"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Jadval.AI
                  </span>
                  <span className="rounded-full bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 text-[9px] font-bold text-blue-700 dark:text-blue-300">
                    v2.0
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-foreground">
                  <Building2 className="h-3 w-3 text-blue-600" />
                  <span>{currentSchool?.name || "Maktabni tanlang"}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                </div>
              </div>
            </button>

            {/* Maktablar Ro'yxati Dropdown */}
            {isSchoolMenuOpen && (
              <div className="absolute left-0 top-14 z-50 w-72 rounded-2xl border border-border bg-card p-2 shadow-2xl animate-in fade-in slide-in-from-top-2">
                <div className="px-3 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Faol Maktablar (Multi-Tenant)
                </div>
                <div className="space-y-1">
                  {schools.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        onSelectSchool(s.id);
                        setIsSchoolMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                        s.id === currentSchoolId
                          ? "bg-blue-600 text-white"
                          : "hover:bg-muted text-foreground"
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {s.id === currentSchoolId && (
                        <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">
                          Tanlangan
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="mt-2 pt-2 border-t border-border">
                  <button
                    onClick={() => {
                      onAddSchool();
                      setIsSchoolMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Yangi maktab qo&apos;shish</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filial va Zoom filterlari */}
        <div className="flex items-center gap-2">
          {/* Filial Tanlash */}
          {branches.length > 0 && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs shadow-sm">
              <SchoolIcon className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={selectedBranch}
                onChange={(e) => onBranchChange(e.target.value)}
                className="bg-transparent font-medium focus:outline-none cursor-pointer"
              >
                <option value="ALL">Barcha Filiallar</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Zoom Boshqaruvi */}
          <div className="hidden lg:flex items-center rounded-lg border border-border bg-card p-1 shadow-sm" suppressHydrationWarning>
            <button
              onClick={() => onZoomChange(Math.max(50, zoomLevel - 10))}
              disabled={zoomLevel <= 50}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
              title="Kichraytirish (-10%)"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onZoomChange(100)}
              className="px-2 text-xs font-semibold tabular-nums text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
              title="100% ga qaytarish"
              suppressHydrationWarning
            >
              {zoomLevel}%
            </button>
            <button
              onClick={() => onZoomChange(Math.min(150, zoomLevel + 10))}
              disabled={zoomLevel >= 150}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors cursor-pointer"
              title="Kattalashtirish (+10%)"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Undo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-40 transition-colors shadow-sm"
            title="Oxirgi amalni bekor qilish (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bekor qilish</span>
          </button>
        </div>

        {/* Action Tugmalar (Generatsiya, Excel, Wizard) */}
        <div className="flex items-center gap-2">
          {/* Excel Import */}
          <button
            onClick={onOpenImport}
            className="hidden md:flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shadow-sm"
          >
            <Upload className="h-3.5 w-3.5 text-emerald-600" />
            <span>Excel Import</span>
          </button>

          {/* Maktab Sozlamalari (Alohida Sahifa) */}
          <a
            href="/sozlamalar"
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold hover:bg-muted transition-colors shadow-sm text-foreground"
          >
            <Settings2 className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Maktabni Sozlash (CRUD)</span>
          </a>

          {/* Excel Export */}
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Eksport</span>
          </button>

          {/* AI Generatsiya */}
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-md shadow-blue-600/20 disabled:opacity-60 transition-all cursor-pointer"
          >
            {isGenerating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            )}
            <span>{isGenerating ? "Tuzilmoqda..." : "AI Generatsiya"}</span>
          </button>

          {/* Dark / Light */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Mavzuni almashtirish"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Chiqish (Logout) */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded-lg border border-border bg-card hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors"
            title="Tizimdan chiqish (Logout)"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
