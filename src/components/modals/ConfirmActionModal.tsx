"use client";

import React, { useEffect } from "react";
import { AlertTriangle, Trash2, HelpCircle, X, Loader2 } from "lucide-react";

interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Ha, tasdiqlayman",
  cancelText = "Bekor qilish",
  variant = "danger",
  isLoading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={() => {
          if (!isLoading) onClose();
        }}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border/80 shadow-2xl p-6 text-foreground animate-in zoom-in-95 fade-in duration-200 z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Content */}
        <div className="flex flex-col items-center text-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-inner ${
              variant === "danger"
                ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                : variant === "warning"
                ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
            }`}
          >
            {variant === "danger" ? (
              <Trash2 className="w-7 h-7" />
            ) : variant === "warning" ? (
              <AlertTriangle className="w-7 h-7" />
            ) : (
              <HelpCircle className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mb-6">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
              }}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                variant === "danger"
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                  : variant === "warning"
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
              } disabled:opacity-60`}
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
