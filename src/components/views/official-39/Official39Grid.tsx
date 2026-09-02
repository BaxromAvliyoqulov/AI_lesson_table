import React from "react";
import {
  SchoolClass,
  Subject,
  Teacher,
  Room,
  Lesson,
} from "@/types";
import { OfficialTableCell } from "./Official39Cell";
import { Official39TeacherSidebar } from "./Official39TeacherSidebar";

interface Official39GridProps {
  displayClasses: SchoolClass[];
  displayDays: Array<{ id: number; name: string }>;
  displayPeriods: Array<{ period: number; time: string }>;
  displayTeachers: Teacher[];
  lessons: Lesson[];
  teachers: Teacher[];
  subjects: Subject[];
  rooms: Room[];
  subjectMap: Map<string, Subject>;
  teacherMap: Map<string, Teacher>;
  teacherNumberMap: Map<string, number>;
  teacherSubjectsMap: Map<string, string>;
  classTotalHours: Map<string, number>;
  cellLessonMap: Map<string, Lesson[]>;
  teacherConflictsSet: Set<string>;
  hoveredTeacherId: string | null;
  activeDragLesson: Lesson | null;
  onHoverTeacher: (teacherId: string | null) => void;
  onCellClick: (cls: SchoolClass, day: number, period: number, lesson?: Lesson) => void;
  getHomeroomTeacher: (cls: SchoolClass) => Teacher | undefined;
  onOpenHomeroomModal: (cls: SchoolClass, currentTeacherId?: string) => void;
}

export const Official39Grid: React.FC<Official39GridProps> = ({
  displayClasses,
  displayDays,
  displayPeriods,
  displayTeachers,
  lessons,
  teachers,
  subjects,
  rooms,
  subjectMap,
  teacherMap,
  teacherNumberMap,
  teacherSubjectsMap,
  classTotalHours,
  cellLessonMap,
  teacherConflictsSet,
  hoveredTeacherId,
  activeDragLesson,
  onHoverTeacher,
  onCellClick,
  getHomeroomTeacher,
  onOpenHomeroomModal,
}) => {
  return (
    <div className="w-full overflow-x-auto border-t-2 border-b-2 border-black pb-2">
      <div className="flex items-start">
        {/* Asosiy Dars Jadvali */}
        <table className="border-collapse border border-black text-center text-[10px] sm:text-[11px] leading-tight font-sans">
          <thead>
            {/* 1-qator: Sarlavhalar va Sinf nomlari */}
            <tr className="border-b border-black">
              <th rowSpan={2} className="border border-black px-1.5 py-1.5 w-6 text-center text-xs font-black text-slate-900 bg-slate-200">
                Kun
              </th>
              <th rowSpan={2} className="border border-black px-1 py-1.5 w-5 text-center text-xs font-black text-slate-900 bg-slate-200">
                Dars
              </th>
              <th rowSpan={2} className="border border-black px-1.5 py-1.5 w-16 text-center font-black text-[10px] text-slate-900 bg-slate-200">
                Vaqti
              </th>

              {displayClasses.map((cls) => {
                const homeroomTeacher = getHomeroomTeacher(cls);

                return (
                  <th
                    key={cls.id}
                    colSpan={2}
                    onClick={() => onOpenHomeroomModal(cls, homeroomTeacher?.id)}
                    className={`border border-black px-1.5 py-1 text-center font-black text-xs min-w-[92px] cursor-pointer hover:opacity-90 transition-opacity select-none ${
                      cls.branchId === "b39_2"
                        ? "bg-amber-100 text-amber-950"
                        : "bg-slate-100 text-slate-900"
                    }`}
                    title={`${cls.name} sinfi — Sinf rahbari: ${homeroomTeacher?.fullName || "Tayinlanmagan"} (O'zgartirish uchun bosing)`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="tracking-wide font-black text-xs">{cls.name}</span>
                      {homeroomTeacher ? (
                        <span className="text-[8px] font-semibold text-slate-600 truncate max-w-[85px]">
                          {homeroomTeacher.fullName.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="text-[7.5px] font-bold text-rose-600/80">
                          + Rahbar
                        </span>
                      )}
                      {cls.branchId === "b39_2" && (
                        <span className="text-[7.5px] font-bold text-amber-900">(Filial)</span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>

            {/* 2-qator: Har bir sinf tagida Fan | № ustunlari */}
            <tr className="border-b-2 border-black">
              {displayClasses.map((cls) => (
                <React.Fragment key={`sub_${cls.id}`}>
                  <th className="border border-black px-1 py-1 text-center w-16 font-bold text-[9px] text-slate-800 bg-slate-200/80">Fan</th>
                  <th className="border border-black px-1 py-1 text-center w-6 bg-slate-300 font-black text-[9.5px] text-slate-950">
                    №
                  </th>
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody>
            {displayDays.map((day) => (
              <React.Fragment key={day.id}>
                {displayPeriods.map((periodInfo, pIndex) => {
                  const isLastPeriod = pIndex === displayPeriods.length - 1;
                  const isEven = periodInfo.period % 2 === 0;

                  return (
                    <tr
                      key={`${day.id}_${periodInfo.period}`}
                      className={`transition-colors ${
                        isLastPeriod
                          ? "border-b-[3.5px] border-b-black"
                          : isEven
                          ? "bg-slate-50/50"
                          : "bg-white"
                      }`}
                    >
                      {/* Kun nomi ustuni (Faqat 1-darsda rowSpan bilan chiqadi) */}
                      {pIndex === 0 && (
                        <td
                          rowSpan={displayPeriods.length}
                          className="border border-black font-black text-[11px] uppercase tracking-[0.2em] [writing-mode:vertical-lr] rotate-180 text-center bg-slate-200 text-slate-950 px-1 select-none border-b-[3.5px] border-b-black"
                        >
                          {day.name}
                        </td>
                      )}

                      {/* Dars Tartib Raqami */}
                      <td
                        className={`border border-black font-black text-center font-mono text-xs w-5 select-none bg-slate-100 text-slate-950 ${
                          isLastPeriod ? "border-b-[3.5px] border-b-black" : ""
                        }`}
                      >
                        {periodInfo.period}
                      </td>

                      {/* Dars Vaqti */}
                      <td
                        className={`border border-black font-mono font-bold text-[9px] text-center w-16 px-0.5 select-none bg-slate-50 text-slate-800 ${
                          isLastPeriod ? "border-b-[3.5px] border-b-black" : ""
                        }`}
                      >
                        {periodInfo.time}
                      </td>

                      {/* Barcha Sinflar uchun Katakchalar */}
                      {displayClasses.map((cls) => {
                        const cellLessons = cellLessonMap.get(`${cls.id}_${day.id}_${periodInfo.period}`) || [];
                        const lesson = cellLessons[0];
                        const subject = lesson ? subjectMap.get(lesson.subjectId) : undefined;
                        const teacher = lesson ? teacherMap.get(lesson.teacherId) : undefined;
                        const teacherNum = lesson ? teacherNumberMap.get(lesson.teacherId) : undefined;
                        const isPrimarySaturday = day.id === 6 && (cls.isPrimary || cls.grade <= 4);
                        const isHoveredTeacher = !!(lesson && hoveredTeacherId === lesson.teacherId);

                        return (
                          <OfficialTableCell
                            key={`cell_${cls.id}_${day.id}_${periodInfo.period}`}
                            cls={cls}
                            day={day.id}
                            period={periodInfo.period}
                            lesson={lesson}
                            subject={subject}
                            teacher={teacher}
                            teacherNumber={teacherNum}
                            isHoveredTeacher={isHoveredTeacher}
                            isPrimarySaturday={isPrimarySaturday}
                            isLastPeriodOfDay={isLastPeriod}
                            activeDragLesson={activeDragLesson}
                            allLessons={lessons}
                            teachers={teachers}
                            subjects={subjects}
                            rooms={rooms}
                            cellLessons={cellLessons}
                            teacherNumberMap={teacherNumberMap}
                            onHoverTeacher={onHoverTeacher}
                            hasConflict={lesson ? teacherConflictsSet.has(lesson.id) : false}
                            onCellClick={onCellClick}
                          />
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}

            {/* ── 3. PASTDAGI STATISTIKA QATORLARI ───────────────────────── */}
            {/* Dars soati jami */}
            <tr className="bg-slate-200 font-black border-t-2 border-b border-black text-xs text-slate-900">
              <td colSpan={3} className="border border-black px-2 py-1 text-right">
                Dars soati
              </td>
              {displayClasses.map((cls) => (
                <td
                  key={`hours_${cls.id}`}
                  colSpan={2}
                  className="border border-black px-1 py-1 text-center font-mono font-black text-xs bg-slate-100 text-slate-950"
                >
                  {classTotalHours.get(cls.id) || 0}
                </td>
              ))}
            </tr>

            {/* Sinf rahbar F.I.Sh */}
            <tr className="bg-white font-bold border-b-2 border-black text-[10px] text-slate-900">
              <td colSpan={3} className="border border-black px-2 py-1 text-right font-black">
                Sinf rahbar
              </td>
              {displayClasses.map((cls) => {
                const homeroomTeacher = getHomeroomTeacher(cls);
                const shortName = homeroomTeacher
                  ? homeroomTeacher.fullName.split(" ").slice(0, 2).join(" ")
                  : "—";

                return (
                  <td
                    key={`homeroom_${cls.id}`}
                    colSpan={2}
                    onClick={() => onOpenHomeroomModal(cls, homeroomTeacher?.id)}
                    className="border border-black px-1 py-1 text-center truncate max-w-[85px] text-[9.5px] cursor-pointer hover:bg-amber-100 hover:text-amber-950 font-bold transition-colors select-none"
                    title={`${cls.name} sinf rahbari: ${homeroomTeacher?.fullName || "Tayinlanmagan"} (O'zgartirish uchun bosing)`}
                  >
                    {shortName}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        {/* O'ng tomondagi O'qituvchilarning I.F.O va Fanlari Reestri */}
        <Official39TeacherSidebar
          teachers={displayTeachers}
          teacherNumberMap={teacherNumberMap}
          teacherSubjectsMap={teacherSubjectsMap}
          hoveredTeacherId={hoveredTeacherId}
          onHoverTeacher={onHoverTeacher}
        />
      </div>
    </div>
  );
};
