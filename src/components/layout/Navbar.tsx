"use client";

import React from "react";
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
} from "lucide-react";

interface NavbarProps {
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
  zoomLevel,
  onZoomChange,
  onGenerate,
  onExport,
  onOpenWizard,
  onOpenImport,
  onUndo,
  canUndo,
  isGenerating,
  selectedBranch,
  onBranchChange,
  branches,
}) => {
  const [isDark, setIsDark] = React.useState(false);

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
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-500/20 text-white">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 bg-clip-text text-transparent">
                Jadval.AI
              </span>
              <span className="rounded-full bg-blue-100 dark:bg-blue-950/80 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                v2.0 Enterprise
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              21-Umumiy o&apos;rta ta&apos;lim maktabi
            </p>
          </div>
        </div>

        {/* Filial va Ko'rinish filterlari */}
        <div className="flex items-center gap-2">
          {/* Filial Tanlash */}
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

          {/* Zoom Boshqaruvi */}
          <div className="hidden lg:flex items-center rounded-lg border border-border bg-card p-1 shadow-sm">
            <button
              onClick={() => onZoomChange(Math.max(75, zoomLevel - 10))}
              disabled={zoomLevel <= 75}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              title="Kichraytirish"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-xs font-semibold tabular-nums text-muted-foreground">
              {zoomLevel}%
            </span>
            <button
              onClick={() => onZoomChange(Math.min(125, zoomLevel + 10))}
              disabled={zoomLevel >= 125}
              className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              title="Kattalashtirish"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Undo Tugmasi */}
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

          {/* Setup Wizard */}
          <button
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors shadow-sm"
          >
            <Settings2 className="h-3.5 w-3.5 text-blue-600" />
            <span className="hidden sm:inline">Maktab Sozlamalari</span>
          </button>

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

          {/* Dark / Light Mode */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Mavzuni almashtirish"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
