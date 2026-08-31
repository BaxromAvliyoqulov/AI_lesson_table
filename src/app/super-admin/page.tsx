"use client";

import React, { useState, useEffect, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield,
  Building2,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  ExternalLink,
  Power,
  Sparkles,
  School,
  LogOut,
  Trash2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  getSuperAdminDataAction,
  createSchoolAction,
  updateSchoolStatusAction,
  deleteSchoolAction,
  SuperAdminSchoolRecord,
  SuperAdminStats,
} from "@/lib/actions/superadmin.actions";
import { Logo } from "@/components/brand/Logo";
import { useSchoolStore } from "@/lib/store/useSchoolStore";

export default function SuperAdminPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const store = useSchoolStore();

  const [schools, setSchools] = useState<SuperAdminSchoolRecord[]>([]);
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [newSchool, setNewSchool] = useState({
    name: "",
    slug: "",
    region: "",
    directorFullName: "",
    plan: "pro" as "trial" | "standard" | "pro",
    adminFullName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getSuperAdminDataAction();
      if (res.success && res.data) {
        setSchools(res.data.schools);
        setStats(res.data.stats);
      } else {
        showToast(res.error || "Ma'lumotlarni yuklab bo'lmadi", "error");
      }
    } catch (err: any) {
      showToast("Server xatosi", "error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user && session.user.role !== "SUPER_ADMIN") {
      router.push("/super-admin/login");
    }
  }, [session, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredSchools = schools.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.region.toLowerCase().includes(search.toLowerCase()) ||
      s.directorFullName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleStatus = async (id: string, currentStatus: "active" | "suspended" | "trial") => {
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    // Optimistic UI
    setSchools((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: nextStatus } : s))
    );

    const res = await updateSchoolStatusAction(id, nextStatus);
    if (res.success) {
      showToast(`Maktab holati "${nextStatus}" ga o'zgartirildi`, "success");
    } else {
      showToast(res.error || "Holatni o'zgartirishda xato", "error");
      loadData();
    }
  };

  const handleDeleteSchool = async (id: string, name: string) => {
    if (!confirm(`Haqiqatan ham "${name}" maktabini va uning barcha jadvallarini butunlay o'chirmoqchimisiz?`)) {
      return;
    }

    setSchools((prev) => prev.filter((s) => s.id !== id));
    const res = await deleteSchoolAction(id);
    if (res.success) {
      showToast(`"${name}" muvaffaqiyatli o'chirildi`, "success");
      loadData();
    } else {
      showToast(res.error || "O'chirishda xato", "error");
      loadData();
    }
  };

  const handleImpersonate = (schoolId: string, schoolName: string) => {
    store.setCurrentSchoolId(schoolId);
    showToast(`"${schoolName}" maktabi jadvaliga o'tildi`, "success");
    router.push("/");
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name.trim() || !newSchool.adminEmail.trim()) {
      showToast("Maktab nomi va Admin emailini kiriting", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedSlug =
        newSchool.slug.trim() ||
        newSchool.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .slice(0, 30);

      const res = await createSchoolAction({
        name: newSchool.name.trim(),
        slug: generatedSlug,
        region: newSchool.region.trim() || "Toshkent shahri",
        directorFullName: newSchool.directorFullName.trim() || "Direktor",
        plan: newSchool.plan,
        adminFullName: newSchool.adminFullName.trim() || `${newSchool.name} Admin`,
        adminEmail: newSchool.adminEmail.trim(),
        adminPassword: newSchool.adminPassword.trim() || "admin123",
      });

      if (res.success) {
        showToast(`"${newSchool.name}" muvaffaqiyatli yaratildi!`, "success");
        setNewSchool({
          name: "",
          slug: "",
          region: "",
          directorFullName: "",
          plan: "pro",
          adminFullName: "",
          adminEmail: "",
          adminPassword: "",
        });
        setIsAddModalOpen(false);
        loadData();
      } else {
        showToast(res.error || "Maktab yaratishda xatolik yuz berdi", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Server xatosi", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="md" variant="gold" />
            <div className="hidden sm:block">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Super Admin
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">Platforma boshqaruv markazi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-500/10 transition-colors flex items-center gap-1.5"
            >
              <School className="w-3.5 h-3.5" />
              <span>Maktab Paneli (Jadval)</span>
            </a>

            <button
              onClick={() => signOut({ callbackUrl: "/super-admin/login" })}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Chiqish</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2 border animate-in slide-in-from-bottom-2 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 text-emerald-300 border-emerald-800"
              : "bg-rose-950/90 text-rose-300 border-rose-800"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Jami Maktablar</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{stats?.totalSchools ?? schools.length}</p>
            <p className="text-[11px] text-emerald-400 mt-1">Neon PostgreSQL Bulutida</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Faol Obunalar</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {stats?.activeSubscriptions ?? schools.filter((s) => s.status === "active").length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats?.trialCount ?? schools.filter((s) => s.status === "trial").length} ta sinov rejimida
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Jami O'qituvchilar</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {stats?.totalTeachers ?? schools.reduce((sum, s) => sum + s.teachersCount, 0)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Bazadagi barcha ustozlar</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Jami Sinflar</span>
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {stats?.totalClasses ?? schools.reduce((sum, s) => sum + s.classesCount, 0)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Barcha filiallar bo'yicha</p>
          </div>
        </div>

        {/* Schools Table Section */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">Ulangan Maktablar Ro'yxati</h2>
                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Yangilash"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Maktablar obunasini boshqarish, yangi maktab qo'shish va sozlash
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Maktab yoki tuman qidirish..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ALL">Barcha statuslar</option>
                <option value="active">Faol (Active)</option>
                <option value="trial">Sinov (Trial)</option>
                <option value="suspended">To'xtatilgan</option>
              </select>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Maktab</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {isLoading && schools.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
                <span className="text-xs">PostgreSQL bazasidan maktablar yuklanmoqda...</span>
              </div>
            ) : filteredSchools.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                Maktablar topilmadi.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Maktab Nomi</th>
                    <th className="py-3 px-3">Hudud / Tuman</th>
                    <th className="py-3 px-3">Direktor</th>
                    <th className="py-3 px-3">Admin Email</th>
                    <th className="py-3 px-3">Tarif</th>
                    <th className="py-3 px-3">Holat</th>
                    <th className="py-3 px-3">Hajm</th>
                    <th className="py-3 px-3 text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSchools.map((school) => (
                    <tr key={school.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                            {school.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-white text-xs">{school.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">slug: {school.slug}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-300">{school.region}</td>

                      <td className="py-3.5 px-3 text-slate-300">{school.directorFullName}</td>

                      <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">
                        {school.adminEmail || "—"}
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/20">
                          {school.plan}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            school.status === "active"
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : school.status === "trial"
                              ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                              : "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              school.status === "active"
                                ? "bg-emerald-400"
                                : school.status === "trial"
                                ? "bg-blue-400"
                                : "bg-rose-400"
                            }`}
                          />
                          <span>
                            {school.status === "active"
                              ? "Faol"
                              : school.status === "trial"
                              ? "Sinov (Trial)"
                              : "To'xtatilgan"}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-400 text-[11px]">
                        <span>{school.classesCount} sinf</span> &bull;{" "}
                        <span>{school.teachersCount} o'qituvchi</span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleStatus(school.id, school.status)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                              school.status === "active"
                                ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
                                : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
                            }`}
                            title={
                              school.status === "active"
                                ? "Obunani to'xtatish"
                                : "Obunani faollashtirish"
                            }
                          >
                            {school.status === "active" ? "To'xtatish" : "Faollashtirish"}
                          </button>

                          <button
                            onClick={() => handleImpersonate(school.id, school.name)}
                            className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 hover:text-white transition-colors cursor-pointer"
                            title="Maktab paneliga o'tish (Impersonation)"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteSchool(school.id, school.name)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                            title="Maktabni o'chirish"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* Add School Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Yangi Maktab Qo'shish</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSchool} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Maktab nomi *</label>
                  <input
                    type="text"
                    required
                    placeholder="39-umumiy o'rta ta'lim maktabi"
                    value={newSchool.name}
                    onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Slug / Identifikator</label>
                  <input
                    type="text"
                    placeholder="maktab-39"
                    value={newSchool.slug}
                    onChange={(e) => setNewSchool({ ...newSchool, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tuman / Viloyat</label>
                  <input
                    type="text"
                    placeholder="Muzrabot tumani"
                    value={newSchool.region}
                    onChange={(e) => setNewSchool({ ...newSchool, region: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Direktor F.I.Sh</label>
                  <input
                    type="text"
                    placeholder="M. Ramazonov"
                    value={newSchool.directorFullName}
                    onChange={(e) => setNewSchool({ ...newSchool, directorFullName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tarif rejasi</label>
                  <select
                    value={newSchool.plan}
                    onChange={(e) => setNewSchool({ ...newSchool, plan: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="trial">Trial (Sinov)</option>
                    <option value="standard">Standard (1 bino)</option>
                    <option value="pro">Pro (Ko'p filial + AI)</option>
                  </select>
                </div>
              </div>

              {/* Admin Akkaunt Rekvizitlari */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <p className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Maktab Administratori Akkaunti
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Admin F.I.Sh</label>
                    <input
                      type="text"
                      placeholder="Admin F.I.Sh"
                      value={newSchool.adminFullName}
                      onChange={(e) => setNewSchool({ ...newSchool, adminFullName: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Admin Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@maktab39.uz"
                      value={newSchool.adminEmail}
                      onChange={(e) => setNewSchool({ ...newSchool, adminEmail: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">Boshlang'ich Parol</label>
                    <input
                      type="password"
                      placeholder="admin123"
                      value={newSchool.adminPassword}
                      onChange={(e) => setNewSchool({ ...newSchool, adminPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 text-xs focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 disabled:opacity-60 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Yaratilmoqda...</span>
                    </>
                  ) : (
                    <span>Maktabni Yaratish</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        © 2026 JadvalAI — Super Administrator Paneli (Neon PostgreSQL Connected)
      </footer>
    </div>
  );
}
