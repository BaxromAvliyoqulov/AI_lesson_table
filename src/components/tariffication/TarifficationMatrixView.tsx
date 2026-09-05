"use client";

import React, { useState, useMemo } from "react";
import { SchoolClass, Subject, Teacher } from "@/types";
import { isPrimarySubject, isHighSchoolSubject } from "@/lib/curriculum-templates";
import { Search, Filter, BookOpen, GraduationCap, Eye, EyeOff } from "lucide-react";

interface TarifficationMatrixViewProps {
  filteredClasses: SchoolClass[];
  subjects: Subject[];
  sortedTeachers: Teacher[];
  onUpdateSubject: (
    classId: string,
    subjectId: string,
    teacherId: string,
    weeklyHours: number
  ) => void;
}

type SubjectCategory = "ALL" | "PRIMARY" | "HIGH";

export const TarifficationMatrixView: React.FC<TarifficationMatrixViewProps> = ({
  filteredClasses,
  subjects,
  sortedTeachers,
  onUpdateSubject,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SubjectCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [hideEmptyRows, setHideEmptyRows] = useState(false);

  // Har bir fanning berilgan sinflarda jami dars soatini hisoblash
  const subjectTotalHoursMap = useMemo(() => {
    const map = new Map<string, number>();
    subjects.forEach((sub) => {
      let total = 0;
      filteredClasses.forEach((cls) => {
        const cs = (cls.subjects || []).find((item) => item.subjectId === sub.id);
        if (cs) total += cs.weeklyHours;
      });
      map.set(sub.id, total);
    });
    return map;
  }, [subjects, filteredClasses]);

  // Fanlarni boshlang'ich va yuqori guruhlarga ajratish
  const { primarySubjects, highSubjects } = useMemo(() => {
    const prim: Subject[] = [];
    const high: Subject[] = [];

    subjects.forEach((sub) => {
      if (isPrimarySubject(sub)) prim.push(sub);
      if (isHighSchoolSubject(sub)) high.push(sub);
    });

    return { primarySubjects: prim, highSubjects: high };
  }, [subjects]);

  // Filtrlangan fanlar ro'yxati
  const displayedSubjectGroups = useMemo(() => {
    const filterFn = (sub: Subject) => {
      if (hideEmptyRows && (subjectTotalHoursMap.get(sub.id) || 0) === 0) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return sub.name.toLowerCase().includes(q);
      }
      return true;
    };

    if (selectedCategory === "PRIMARY") {
      return [
        {
          title: "👦 Boshlang'ich Sinf Fanlari (1-4 sinf)",
          colorBadge: "bg-blue-100 text-blue-800 border-blue-200",
          items: primarySubjects.filter(filterFn),
        },
      ];
    }

    if (selectedCategory === "HIGH") {
      return [
        {
          title: "🧑 Asosiy va Yuqori Sinf Fanlari (5-11 sinf)",
          colorBadge: "bg-indigo-100 text-indigo-800 border-indigo-200",
          items: highSubjects.filter(filterFn),
        },
      ];
    }

    // "ALL" holatida ikkita aniq guruhga bo'lib ko'rsatamiz:
    return [
      {
        title: "👦 Boshlang'ich Sinf Fanlari (1-4 sinf)",
        colorBadge: "bg-blue-100 text-blue-800 border-blue-200",
        items: primarySubjects.filter(filterFn),
      },
      {
        title: "🧑 Asosiy va Yuqori Sinf Fanlari (5-11 sinf)",
        colorBadge: "bg-indigo-100 text-indigo-800 border-indigo-200",
        items: highSubjects.filter((s) => !primarySubjects.includes(s)).filter(filterFn),
      },
    ];
  }, [selectedCategory, primarySubjects, highSubjects, hideEmptyRows, searchQuery, subjectTotalHoursMap]);

  return (
    <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Yuqori boshqaruv paneli: Guruhlash, Qidiruv va 0 soatliklarni yashirish */}
      <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        {/* Fanlar Guruh Pillari */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-black uppercase tracking-wider text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Guruh:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            🌟 Barcha Fanlar ({subjects.length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("PRIMARY")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "PRIMARY"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700 border border-slate-200"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>👦 Boshlang&apos;ich Fanlari (1-4 sinf) ({primarySubjects.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCategory("HIGH")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "HIGH"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>🧑 Yuqori Sinf Fanlari (5-11 sinf) ({highSubjects.length})</span>
          </button>
        </div>

        {/* Qidiruv va Bo'sh qatorlarni yashirish */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Qidiruv */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Fan nomini qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44 sm:w-56"
            />
          </div>

          {/* 0 soatlik qatorlarni yashirish toggle */}
          <button
            type="button"
            onClick={() => setHideEmptyRows(!hideEmptyRows)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              hideEmptyRows
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
            }`}
            title="Sinflarda birorta ham darsi bo'lmagan fan qatorlarini yashirish"
          >
            {hideEmptyRows ? <EyeOff className="w-3.5 h-3.5 text-emerald-600" /> : <Eye className="w-3.5 h-3.5" />}
            <span>Bo&apos;sh qatorlarni yashirish</span>
          </button>
        </div>
      </div>

      {/* Matritsa Jadvali */}
      <div className="flex-1 overflow-auto max-h-[calc(100vh-270px)]">
        <table className="border-collapse border border-slate-300 w-full text-xs">
          <thead className="sticky top-0 z-20 shadow-xs">
            <tr className="bg-slate-100 border-b border-slate-300">
              <th className="border border-slate-300 px-3 py-2.5 text-left font-black text-slate-800 min-w-[200px] sticky left-0 bg-slate-100 z-30 shadow-xs">
                Fan Nomi
              </th>
              {filteredClasses.map((cls) => {
                const totalH = (cls.subjects || []).reduce((sum, s) => sum + (s.groupType === "GROUP_2" ? 0 : s.weeklyHours), 0);
                return (
                  <th
                    key={cls.id}
                    className={`border border-slate-300 px-2 py-1.5 text-center min-w-[135px] ${
                      cls.isPrimary ? "bg-blue-50/60" : "bg-slate-100"
                    }`}
                  >
                    <div className="font-extrabold text-slate-900 text-xs">{cls.name}</div>
                    <div className="text-[10px] font-bold text-blue-700 font-mono">
                      {totalH} soat
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {displayedSubjectGroups.map((group, gIdx) => (
              <React.Fragment key={gIdx}>
                {/* Guruh Sarlavhasi Qatori */}
                {selectedCategory === "ALL" && (
                  <tr className="bg-slate-200/90 border-y-2 border-slate-400">
                    <td
                      colSpan={filteredClasses.length + 1}
                      className="px-3 py-1.5 font-black text-xs text-slate-800 uppercase tracking-wider sticky left-0 z-10"
                    >
                      <span className={`inline-block px-2.5 py-0.5 rounded-md border text-[11px] font-black ${group.colorBadge}`}>
                        {group.title} ({group.items.length} ta fan)
                      </span>
                    </td>
                  </tr>
                )}

                {/* Guruhga tegishli fanlar */}
                {group.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={filteredClasses.length + 1}
                      className="p-4 text-center text-xs text-slate-400 italic"
                    >
                      Ushbu guruhda fan topilmadi
                    </td>
                  </tr>
                ) : (
                  group.items.map((sub) => {
                    const totalSubjectHours = subjectTotalHoursMap.get(sub.id) || 0;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/90 transition-colors">
                        {/* Fan nomi ustuni (Sticky) */}
                        <td className="border border-slate-300 px-3 py-2 font-bold text-slate-900 sticky left-0 bg-white z-10 shadow-xs">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 truncate">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: sub.colorTag || "#3B82F6" }}
                              />
                              <span className="truncate">{sub.name}</span>
                            </div>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded shrink-0 font-bold ${
                                totalSubjectHours > 0
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-slate-100 text-slate-400"
                              }`}
                              title="Maktab bo'yicha jami dars soati"
                            >
                              {totalSubjectHours} s
                            </span>
                          </div>
                        </td>

                        {/* Har bir sinf katakchasi */}
                        {filteredClasses.map((cls) => {
                          const cs = (cls.subjects || []).find((item) => item.subjectId === sub.id);
                          const curTeacherId = cs?.teacherId || "";
                          const curHours = cs?.weeklyHours || 0;
                          const hasLesson = curHours > 0;

                          // Sinf o'qituvchilari
                          const eligibleTeachers = sortedTeachers.filter((t) =>
                            (t.subjectIds || []).includes(sub.id)
                          );

                          return (
                            <td
                              key={`${cls.id}_${sub.id}`}
                              className={`border border-slate-300 p-1 text-center align-middle transition-colors ${
                                hasLesson ? "bg-blue-50/30" : ""
                              }`}
                            >
                              <div
                                className={`flex items-center gap-1 rounded p-1 border transition-all ${
                                  hasLesson
                                    ? "bg-white border-blue-300 shadow-2xs ring-1 ring-blue-100"
                                    : "bg-slate-50 border-slate-200 opacity-60 hover:opacity-100 hover:bg-white"
                                }`}
                              >
                                <select
                                  value={curTeacherId}
                                  onChange={(e) =>
                                    onUpdateSubject(
                                      cls.id,
                                      sub.id,
                                      e.target.value,
                                      curHours || (e.target.value ? 2 : 0)
                                    )
                                  }
                                  className={`flex-1 text-[11px] font-semibold bg-transparent border-0 p-0 truncate cursor-pointer ${
                                    curTeacherId ? "text-slate-900 font-bold" : "text-slate-400 font-normal"
                                  }`}
                                  title={
                                    curTeacherId
                                      ? sortedTeachers.find((t) => t.id === curTeacherId)?.fullName
                                      : "O'qituvchi tanlanmagan"
                                  }
                                >
                                  <option value="">— Yo&apos;q —</option>
                                  {(eligibleTeachers.length > 0 ? eligibleTeachers : sortedTeachers).map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.fullName}
                                    </option>
                                  ))}
                                </select>

                                <input
                                  type="number"
                                  min="0"
                                  max="15"
                                  value={curHours}
                                  onChange={(e) =>
                                    onUpdateSubject(
                                      cls.id,
                                      sub.id,
                                      curTeacherId,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className={`w-7 text-center font-mono font-black text-xs rounded border py-0.5 ${
                                    hasLesson
                                      ? "bg-blue-100 text-blue-900 border-blue-300"
                                      : "bg-slate-100 text-slate-400 border-slate-200"
                                  }`}
                                  title="Haftalik dars soati"
                                />
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
