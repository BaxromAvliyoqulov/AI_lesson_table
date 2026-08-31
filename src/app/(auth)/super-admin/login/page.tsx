"use client";

import React, { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Shield, Loader2, AlertCircle, Sparkles, Calendar } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email yoki parol noto'g'ri",
  default: "Kirish amalga oshmadi. Qayta urinib ko'ring.",
};

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.default);
      } else {
        router.push("/super-admin");
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="relative w-full max-w-sm">
        {/* Glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl" />

        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center shadow-xl shadow-amber-500/20 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Super Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Platforma boshqaruv paneli</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                id="super-admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@jadvalai.uz"
                required
                disabled={isPending}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Parol</label>
              <div className="relative">
                <input
                  id="super-admin-password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              id="super-admin-submit"
              type="submit"
              disabled={isPending || !email || !password}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold transition-all shadow-lg shadow-amber-500/25 disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Kirilmoqda...</>
              ) : (
                "Kirish"
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/10 text-center">
            <a href="/login" className="text-xs text-slate-500 hover:text-slate-400 transition-colors">
              ← Maktab Admin loginiga qaytish
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          JadvalAI — Platform Administration
        </p>
      </div>
    </div>
  );
}
