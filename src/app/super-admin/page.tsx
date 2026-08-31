"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface SchoolRecord {
  id: string;
  name: string;
  slug: string;
  region: string;
  directorFullName: string;
  plan: "trial" | "standard" | "pro";
  status: "active" | "suspended" | "trial";
  branchesCount: number;
  classesCount: number;
  teachersCount: number;
  createdAt: string;
}

const INITIAL_SCHOOLS: SchoolRecord[] = [
  {
    id: "school_39",
    name: "39-umumiy o'rta ta'lim maktabi",
    slug: "demo-maktab",
    region: "Muzrabot tumani",
    directorFullName: "M. Ramazonov",
    plan: "pro",
    status: "active",
    branchesCount: 1,
    classesCount: 22,
    teachersCount: 25,
    createdAt: "2026-01-15",
  },
  {
    id: "school_21",
    name: "21-umumiy o'rta ta'lim maktabi",
    slug: "maktab-21",
    region: "Chilonzor tumani",
    directorFullName: "A. Karimova",
    plan: "standard",
    status: "active",
    branchesCount: 2,
    classesCount: 22,
    teachersCount: 25,
    createdAt: "2026-02-10",
  },
  {
    id: "school_5",
    name: "5-sonli ixtisoslashtirilgan maktab",
    slug: "maktab-5",
    region: "Mirzo Ulug'bek tumani",
    directorFullName: "S. Valiyev",
    plan: "trial",
    status: "trial",
    branchesCount: 1,
    classesCount: 14,
    teachersCount: 18,
    createdAt: "2026-02-28",
  },
];

export default function SuperAdminPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [schools, setSchools] = useState<SchoolRecord[]>(INITIAL_SCHOOLS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newSchool, setNewSchool] = useState({
    name: "",
    region: "",
    directorFullName: "",
    plan: "pro" as const,
  });

  const filteredSchools = schools.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.region.toLowerCase().includes(search.toLowerCase()) ||
      s.directorFullName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleStatus = (id: string) => {
    setSchools((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const nextStatus = s.status === "active" ? "suspended" : "active";
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const handleAddSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchool.name.trim()) return;

    const id = `school_${Date.now()}`;
    const slug = newSchool.name.toLowerCase().replace(/\s+/g, "-").slice(0, 20);

    setSchools([
      ...schools,
      {
        id,
        name: newSchool.name.trim(),
        slug,
        region: newSchool.region.trim() || "Toshkent sh.",
        directorFullName: newSchool.directorFullName.trim() || "Direktor",
        plan: newSchool.plan,
        status: "active",
        branchesCount: 1,
        classesCount: 0,
        teachersCount: 0,
        createdAt: "2026-08-31",
      },
    ]);

    setNewSchool({ name: "", region: "", directorFullName: "", plan: "pro" });
    setIsAddModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-white">JadvalAI</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Platforma boshqaruv markazi</p>
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

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Jami Maktablar</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">{schools.length}</p>
            <p className="text-[11px] text-emerald-400 mt-1">100% Onlayn faol</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Faol Obunalar</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {schools.filter((s) => s.status === "active").length}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {schools.filter((s) => s.status === "trial").length} ta sinov rejimida
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Jami O'qituvchilar</span>
              <Users className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {schools.reduce((sum, s) => sum + s.teachersCount, 0)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Bazadagi barcha ustozlar</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Jami Sinflar</span>
              <Calendar className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-white mt-2">
              {schools.reduce((sum, s) => sum + s.classesCount, 0)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Barcha filiallar bo'yicha</p>
          </div>
        </div>

        {/* Schools Table Section */}
        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 shadow-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Ulangan Maktablar Ro'yxati</h2>
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
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Maktab Nomi</th>
                  <th className="py-3 px-3">Hudud / Tuman</th>
                  <th className="py-3 px-3">Direktor</th>
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
                          onClick={() => toggleStatus(school.id)}
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

                        <a
                          href="/"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Maktab paneliga o'tish (Kirish)"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add School Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
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
              <div>
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
                  <option value="trial">Trial (14 kunlik sinov)</option>
                  <option value="standard">Standard (Bitta bino)</option>
                  <option value="pro">Pro (Ko'p filialli + AI)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
                >
                  Maktabni Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-600">
        © 2026 JadvalAI — Super Administrator Paneli
      </footer>
    </div>
  );
}
