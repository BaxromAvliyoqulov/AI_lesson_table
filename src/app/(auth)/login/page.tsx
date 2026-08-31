"use client";

import React, { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle, KeyRound, Shield, School } from "lucide-react";
import { Logo } from "@/components/brand/Logo";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email yoki parol noto'g'ri",
  SUBSCRIPTION_SUSPENDED: "Obunangiz to'xtatilgan. Platforma administratori bilan bog'laning.",
  default: "Kirish amalga oshmadi. Qayta urinib ko'ring.",
};

const DEMO_ACCOUNTS = {
  schoolAdmin: {
    label: "Maktab Admin",
    email: "admin@demo-maktab.uz",
    password: "admin123",
  },
  superAdmin: {
    label: "Super Admin",
    email: "superadmin@jadvalai.uz",
    password: "admin123",
  },
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          email: email.trim(),
          password: password.trim(),
          redirect: false,
        });

        if (res?.error) {
          setError(ERROR_MESSAGES[res.error] ?? ERROR_MESSAGES.default);
        } else {
          router.push(callbackUrl);
          router.refresh();
        }
      } catch {
        setError(ERROR_MESSAGES.default);
      }
    });
  };

  const fillCredentials = (type: "schoolAdmin" | "superAdmin") => {
    const acc = DEMO_ACCOUNTS[type];
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(99,102,241,0.18) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <Logo size="lg" variant="white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Xush kelibsiz!</h1>
          <p className="text-indigo-300 text-sm mt-1">Maktab boshqaruv paneliga kirish</p>
        </div>

        {/* Demo Credentials Quick-Fill Card */}
        <div className="mb-5 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Sinov uchun login va parollar</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => fillCredentials("schoolAdmin")}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:border-indigo-400/40 group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-indigo-300">
                <School className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Maktab Admin</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">admin@demo-maktab.uz</p>
              <p className="text-[10px] text-amber-400/90 font-mono mt-0.5">Parol: admin123</p>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials("superAdmin")}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all hover:border-amber-400/40 group cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-white group-hover:text-amber-300">
                <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Super Admin</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">superadmin@jadvalai.uz</p>
              <p className="text-[10px] text-amber-400/90 font-mono mt-0.5">Parol: admin123</p>
            </button>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-indigo-200 uppercase tracking-wider mb-2">
                Email manzil
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@maktab.uz"
                required
                disabled={isPending}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 text-sm"
              />
            </div>

            {/* Parol */}
            <div>
              <label className="block text-xs font-medium text-indigo-200 uppercase tracking-wider mb-2">
                Parol
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPwd ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isPending}
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/70 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Xato xabari */}
            {error && (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
                <span className="text-xs leading-relaxed">{error}</span>
              </div>
            )}

            {/* Submit tugmasi */}
            <button
              id="login-submit"
              type="submit"
              disabled={isPending || !email || !password}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Kirilmoqda...
                </>
              ) : (
                "Tizimga kirish →"
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-between text-xs">
            <a
              href="/setup"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Yangi maktabni sozlash (Wizard)
            </a>
            <a
              href="/super-admin/login"
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Super Admin →
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-indigo-400/60 mt-6 font-medium">
          © 2026 JadvalAI — Maktab dars jadvalini avtomatlashtirish platformasi
        </p>
      </div>
    </div>
  );
}
