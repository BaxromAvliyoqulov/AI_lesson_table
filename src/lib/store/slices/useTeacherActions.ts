import { useCallback } from "react";
import { Teacher, TeacherAvailability } from "@/types";
import { upsertTeacherAction, deleteTeacherAction } from "@/lib/actions/school.actions";
import { isKelajakOrSinfSoatiSubject, isHomeroomPrimarySubject } from "@/lib/curriculum-templates";
import { storeState, updateStore, addAuditLog } from "../store-core";

export function useTeacherActions() {
  const addTeacher = useCallback((teacher: Teacher) => {
    updateStore((prev) => {
      let updatedClasses = prev.classes;
      let updatedTeachers = [...prev.teachers, teacher];

      if (teacher.homeroomClassId) {
        const cId = teacher.homeroomClassId;
        updatedClasses = prev.classes.map((c) => {
          if (c.id === cId) {
            let hasClassHour = false;
            const isPrimary = (c.grade || 1) <= 4;
            let updatedSubs = (c.subjects || []).map((s) => {
              const sub = prev.subjects.find((subItem) => subItem.id === s.subjectId);
              if (isKelajakOrSinfSoatiSubject(s.subjectId, sub?.name)) {
                hasClassHour = true;
                return { ...s, teacherId: teacher.id };
              }
              if (isPrimary && sub && isHomeroomPrimarySubject(sub, c.grade)) {
                return { ...s, teacherId: teacher.id };
              }
              return s;
            });

            if (!hasClassHour) {
              const sinfSoatiSub = prev.subjects.find((subItem) =>
                isKelajakOrSinfSoatiSubject(subItem.id, subItem.name)
              );
              const finalSubId = sinfSoatiSub?.id || "sub_sinf_soati";
              updatedSubs = [
                ...updatedSubs,
                {
                  classId: c.id,
                  subjectId: finalSubId,
                  weeklyHours: 1,
                  hoursPerWeek: 1,
                  teacherId: teacher.id,
                  canSplit: false,
                  isMandatory: true,
                  groupType: "WHOLE",
                } as any,
              ];
            }

            return { ...c, homeroomTeacherId: teacher.id, subjects: updatedSubs };
          }
          return c;
        });
        updatedTeachers = updatedTeachers.map((t) =>
          t.id !== teacher.id && t.homeroomClassId === cId
            ? { ...t, homeroomClassId: undefined }
            : t
        );
      }

      return {
        ...prev,
        teachers: updatedTeachers,
        classes: updatedClasses,
        syncStatus: "syncing",
      };
    });
    addAuditLog("O'qituvchi qo'shildi", `${teacher.fullName} ro'yxatga kiritildi`);

    upsertTeacherAction(teacher.schoolId || storeState.currentSchoolId, teacher).then((res) => {
      if (res.success && res.teacher) {
        const savedTeacher = res.teacher;
        updateStore((prev) => ({
          ...prev,
          teachers: prev.teachers.map((t) =>
            t.id === teacher.id ? { ...t, ...savedTeacher, id: savedTeacher.id } : t
          ),
          syncStatus: "synced",
        }));
      } else {
        updateStore((prev) => ({ ...prev, syncStatus: "error" }));
      }
    });
  }, []);

  const updateTeacher = useCallback((teacher: Teacher) => {
    updateStore((prev) => {
      const cId = teacher.homeroomClassId;

      const updatedTeachers = prev.teachers.map((t) => {
        if (t.id === teacher.id) return teacher;
        if (cId && t.homeroomClassId === cId) return { ...t, homeroomClassId: undefined };
        return t;
      });

      const updatedClasses = prev.classes.map((c) => {
        if (cId && c.id === cId) {
          let hasClassHour = false;
          const isPrimary = (c.grade || 1) <= 4;
          let updatedSubs = (c.subjects || []).map((s) => {
            const sub = prev.subjects.find((subItem) => subItem.id === s.subjectId);
            if (isKelajakOrSinfSoatiSubject(s.subjectId, sub?.name)) {
              hasClassHour = true;
              return { ...s, teacherId: teacher.id };
            }
            if (isPrimary && sub && isHomeroomPrimarySubject(sub, c.grade)) {
              return { ...s, teacherId: teacher.id };
            }
            return s;
          });

          if (!hasClassHour) {
            const sinfSoatiSub = prev.subjects.find((subItem) =>
              isKelajakOrSinfSoatiSubject(subItem.id, subItem.name)
            );
            const finalSubId = sinfSoatiSub?.id || "sub_sinf_soati";
            updatedSubs = [
              ...updatedSubs,
              {
                classId: c.id,
                subjectId: finalSubId,
                weeklyHours: 1,
                hoursPerWeek: 1,
                teacherId: teacher.id,
                canSplit: false,
                isMandatory: true,
                groupType: "WHOLE",
              } as any,
            ];
          }

          return { ...c, homeroomTeacherId: teacher.id, subjects: updatedSubs };
        }
        if (c.homeroomTeacherId === teacher.id && c.id !== cId) {
          const updatedSubs = (c.subjects || []).map((s) => {
            const sub = prev.subjects.find((subItem) => subItem.id === s.subjectId);
            if (isKelajakOrSinfSoatiSubject(s.subjectId, sub?.name)) {
              return { ...s, teacherId: "" };
            }
            return s;
          });
          return { ...c, homeroomTeacherId: undefined, subjects: updatedSubs };
        }
        return c;
      });

      const updatedLessons = prev.lessons.map((l) => {
        if (
          cId &&
          l.classId === cId &&
          (isKelajakOrSinfSoatiSubject(l.subjectId) ||
            (l.dayOfWeek === 1 && l.periodNumber === 1))
        ) {
          return { ...l, teacherId: teacher.id };
        }
        return l;
      });

      return {
        ...prev,
        teachers: updatedTeachers,
        classes: updatedClasses,
        lessons: updatedLessons,
        syncStatus: "syncing",
      };
    });
    addAuditLog("O'qituvchi yangilandi", `${teacher.fullName} ma'lumotlari tahrirlandi`);

    upsertTeacherAction(teacher.schoolId || storeState.currentSchoolId, teacher).then((res) => {
      if (res.success && res.teacher) {
        const savedTeacher = res.teacher;
        updateStore((prev) => ({
          ...prev,
          teachers: prev.teachers.map((t) =>
            t.id === teacher.id ? { ...t, ...savedTeacher, id: savedTeacher.id } : t
          ),
          syncStatus: "synced",
        }));
      } else {
        updateStore((prev) => ({ ...prev, syncStatus: "error" }));
      }
    });
  }, []);

  const deleteTeacher = useCallback((teacherId: string) => {
    const target = storeState.teachers.find((t) => t.id === teacherId);
    updateStore((prev) => ({
      ...prev,
      teachers: prev.teachers.filter((t) => t.id !== teacherId),
      lessons: prev.lessons.filter((l) => l.teacherId !== teacherId),
      classes: prev.classes.map((c) => ({
        ...c,
        homeroomTeacherId: c.homeroomTeacherId === teacherId ? null : c.homeroomTeacherId,
        subjects: (c.subjects || []).map((cs) =>
          cs.teacherId === teacherId ? { ...cs, teacherId: "" } : cs
        ),
      })),
      syncStatus: "syncing",
    }));
    if (target) {
      addAuditLog("O'qituvchi o'chirildi", `${target.fullName} tizimdan o'chirildi`);
    }

    deleteTeacherAction(storeState.currentSchoolId, teacherId).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  const updateTeacherAvailability = useCallback((teacherId: string, availabilities: TeacherAvailability[]) => {
    updateStore((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === teacherId ? { ...t, availabilities } : t)),
    }));
    addAuditLog("O'qituvchi bo'sh vaqti yangilandi", `O'qituvchi ID: ${teacherId} matrisasi saqlandi`);
  }, []);

  const setTeacherMethodDay = useCallback((teacherId: string, methodDayOfWeek: number | null) => {
    const target = storeState.teachers.find((t) => t.id === teacherId);
    if (!target) return;
    const updated: Teacher = {
      ...target,
      methodDayOfWeek: methodDayOfWeek === null ? undefined : methodDayOfWeek,
    };
    updateStore((prev) => ({
      ...prev,
      teachers: prev.teachers.map((t) => (t.id === teacherId ? updated : t)),
      syncStatus: "syncing",
    }));
    addAuditLog(
      "O'qituvchi metod kuni yangilandi",
      `${target.fullName} uchun metod kuni: ${methodDayOfWeek ? `${methodDayOfWeek}-kun` : "Bekor qilindi"}`
    );
    upsertTeacherAction(target.schoolId || storeState.currentSchoolId, updated).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  return {
    addTeacher,
    updateTeacher,
    deleteTeacher,
    updateTeacherAvailability,
    setTeacherMethodDay,
  };
}
