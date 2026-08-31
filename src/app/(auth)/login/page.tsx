"use client";

import React, { useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, GraduationCap, Loader2, AlertCircle, Calendar, Sparkles } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  CredentialsSignin: "Email yoki parol noto'g'ri",
  SUBSCRIPTION_SUSPENDED: "Obunangiz to'xtatilgan. Platforma administratori bilan bog'laning.",
  default: "Kirish amalga oshmadi. Qayta urinib ko'ring.",
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
          email,
          password,
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%234f46e5\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-amber-400 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-white tracking-tight">JadvalAI</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-xs text-indigo-300">Maktab Dars Jadvali Tizimi</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold text-white">Xush kelibsiz!</h1>
          <p className="text-indigo-300 text-sm mt-1">Maktab boshqaruv paneliga kirish</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
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
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>

            {/* Parol */}
            <div>
              <label className="block text-sm font-medium text-indigo-200 mb-2">
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
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
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

            {/* Xato */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isPending || !email || !password}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold transition-all duration-200 shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Kirilmoqda...
                </>
              ) : (
                "Kirish"
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <a
              href="/super-admin/login"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Super Admin sifatida kirish →
            </a>
          </div>
        </div>

        <p className="text-center text-xs text-indigo-500 mt-6">
          © 2025 JadvalAI — Ko'p filialli maktablar uchun
        </p>
      </div>
    </div>
  );
}
