import { useCallback } from "react";
import { SchoolClass, ClassSubject } from "@/types";
import { sortClassesByName } from "@/lib/utils";
import {
  upsertClassAction,
  deleteClassAction,
  setHomeroomTeacherAction,
  saveClassTarifficationAction,
  saveTeacherWorkloadAction,
  syncFullSchoolDataAction,
} from "@/lib/actions/school.actions";
import { isHomeroomPrimarySubject, isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";
import { storeState, updateStore, addAuditLog } from "../store-core";
import { triggerBackgroundAutoScheduler } from "./useLessonActions";

export function useClassActions() {
  const addClass = useCallback((cls: SchoolClass) => {
    updateStore((prev) => {
      let updatedTeachers = prev.teachers;
      const finalCls = { ...cls };

      if (cls.homeroomTeacherId) {
        updatedTeachers = prev.teachers.map((t) => {
          if (t.id === cls.homeroomTeacherId) return { ...t, homeroomClassId: cls.id };
          if (t.homeroomClassId === cls.id) return { ...t, homeroomClassId: undefined };
          return t;
        });

        let hasClassHour = false;
        const hrId = cls.homeroomTeacherId || "";
        const isPrimary = (cls.grade || 1) <= 4;
        const updatedSubs: ClassSubject[] = (cls.subjects || []).map((s) => {
          const sub = prev.subjects.find((subItem) => subItem.id === s.subjectId);
          if (isKelajakOrSinfSoatiSubject(s.subjectId, sub?.name)) {
            hasClassHour = true;
            return { ...s, teacherId: hrId };
          }
          if (isPrimary && sub && isHomeroomPrimarySubject(sub, cls.grade)) {
            return { ...s, teacherId: hrId };
          }
          return s;
        });

        if (!hasClassHour) {
          const sinfSoatiSub = prev.subjects.find((subItem) =>
            isKelajakOrSinfSoatiSubject(subItem.id, subItem.name)
          );
          const finalSubId = sinfSoatiSub?.id || "sub_sinf_soati";
          updatedSubs.push({
            classId: cls.id,
            subjectId: finalSubId,
            weeklyHours: 1,
            teacherId: hrId,
            groupType: "WHOLE",
          });
        }
        finalCls.subjects = updatedSubs;
      }

      return {
        ...prev,
        classes: sortClassesByName([...prev.classes, finalCls]),
        teachers: updatedTeachers,
        syncStatus: "syncing",
      };
    });
    addAuditLog("Sinf qo'shildi", `${cls.name} sinfi yaratildi`);

    upsertClassAction(cls.schoolId || storeState.currentSchoolId, cls).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  const updateClass = useCallback((cls: SchoolClass) => {
    updateStore((prev) => {
      const finalCls = { ...cls };
      if (cls.homeroomTeacherId) {
        let hasClassHour = false;
        const hrId = cls.homeroomTeacherId || "";
        const isPrimary = (cls.grade || 1) <= 4;
        const updatedSubs: ClassSubject[] = (cls.subjects || []).map((s) => {
          const sub = prev.subjects.find((subItem) => subItem.id === s.subjectId);
          if (isKelajakOrSinfSoatiSubject(s.subjectId, sub?.name)) {
            hasClassHour = true;
            return { ...s, teacherId: hrId };
          }
          if (isPrimary && sub && isHomeroomPrimarySubject(sub, cls.grade)) {
            return { ...s, teacherId: hrId };
          }
          return s;
        });

        if (!hasClassHour) {
          const sinfSoatiSub = prev.subjects.find((subItem) =>
            isKelajakOrSinfSoatiSubject(subItem.id, subItem.name)
          );
          const finalSubId = sinfSoatiSub?.id || "sub_sinf_soati";
          updatedSubs.push({
            classId: cls.id,
            subjectId: finalSubId,
            weeklyHours: 1,
            teacherId: hrId,
            groupType: "WHOLE",
          });
        }
        finalCls.subjects = updatedSubs;
      }

      const updatedClasses = prev.classes.map((c) => (c.id === finalCls.id ? finalCls : c));
      const updatedTeachers = prev.teachers.map((t) => {
        if (cls.homeroomTeacherId && t.id === cls.homeroomTeacherId) {
          return { ...t, homeroomClassId: cls.id };
        }
        if (t.homeroomClassId === cls.id && t.id !== cls.homeroomTeacherId) {
          return { ...t, homeroomClassId: undefined };
        }
        return t;
      });

      return {
        ...prev,
        classes: sortClassesByName(updatedClasses),
        teachers: updatedTeachers,
        syncStatus: "syncing",
      };
    });
    addAuditLog("Sinf tahrirlandi", `${cls.name} ma'lumotlari yangilandi`);

    upsertClassAction(cls.schoolId || storeState.currentSchoolId, cls).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  const deleteClass = useCallback((classId: string) => {
    const target = storeState.classes.find((c) => c.id === classId);
    updateStore((prev) => ({
      ...prev,
      classes: prev.classes.filter((c) => c.id !== classId),
      teachers: prev.teachers.map((t) =>
        t.homeroomClassId === classId ? { ...t, homeroomClassId: undefined } : t
      ),
      lessons: prev.lessons.filter((l) => l.classId !== classId),
      syncStatus: "syncing",
    }));
    if (target) {
      addAuditLog("Sinf o'chirildi", `${target.name} sinfi o'chirildi`);
    }

    deleteClassAction(storeState.currentSchoolId, classId).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  const setHomeroomTeacher = useCallback((classId: string, teacherId?: string | null) => {
    const tid = teacherId && teacherId.trim() !== "" ? teacherId.trim() : null;

    updateStore((prev) => {
      const updatedClasses = prev.classes.map((c) => {
        if (c.id === classId) {
          let hasKelajak = false;
          const isPrimary = (c.grade || 1) <= 4;
          let updatedSubjects = (c.subjects || []).map((s) => {
            const sub = prev.subjects.find((subItem) => subItem.id === s.subjectId);
            const isKelajak = isKelajakOrSinfSoatiSubject(s.subjectId, sub?.name);

            if (isKelajak) {
              hasKelajak = true;
              return tid ? { ...s, teacherId: tid } : { ...s, teacherId: "" };
            }

            // Boshlang'ich sinfda Ona tili, O'qish, Matematika (va 1-sinfda Alifbe) ni sinf rahbariga biriktirish
            if (isPrimary && sub && isHomeroomPrimarySubject(sub, c.grade)) {
              return tid ? { ...s, teacherId: tid } : s;
            }

            return s;
          });

          // Agar sinfda hali "Kelajak soati" o'quv rejasida bo'lmasa, uni avtomatik qo'shamiz
          if (!hasKelajak && tid) {
            const sinfSoatiSub = prev.subjects.find((subItem) =>
              isKelajakOrSinfSoatiSubject(subItem.id, subItem.name)
            );
            const finalSubId = sinfSoatiSub?.id || "sub_sinf_soati";
            updatedSubjects = [
              ...updatedSubjects,
              {
                classId: c.id,
                subjectId: finalSubId,
                hoursPerWeek: 1,
                weeklyHours: 1,
                teacherId: tid,
                canSplit: false,
                isMandatory: true,
                groupType: "WHOLE",
              } as any,
            ];
          }

          return { ...c, homeroomTeacherId: tid || undefined, subjects: updatedSubjects };
        }
        if (tid && c.homeroomTeacherId === tid && c.id !== classId) {
          return { ...c, homeroomTeacherId: undefined };
        }
        return c;
      });

      const updatedTeachers = prev.teachers.map((t) => {
        if (tid && t.id === tid) {
          return { ...t, homeroomClassId: classId };
        }
        if (t.homeroomClassId === classId && (!tid || t.id !== tid)) {
          return { ...t, homeroomClassId: undefined };
        }
        return t;
      });

      let updatedLessons = [...prev.lessons];
      if (tid) {
        let hasMondayLesson = false;
        updatedLessons = updatedLessons.map((l) => {
          if (
            l.classId === classId &&
            (l.subjectId === "sub_sinf_soati" ||
              l.subjectId === "sub_kelajak" ||
              (l.dayOfWeek === 1 && l.periodNumber === 1))
          ) {
            hasMondayLesson = true;
            return { ...l, teacherId: tid, subjectId: "sub_sinf_soati" };
          }
          return l;
        });

        // Agar bu sinf dars jadvali mavjud bo'lib, lekin Dushanba 1-soat darsi hali qo'yilmagan bo'lsa
        const classHasLessons = prev.lessons.some((l) => l.classId === classId);
        if (classHasLessons && !hasMondayLesson) {
          updatedLessons.push({
            id: `les_${classId}_kelajak_${Date.now()}`,
            schoolId: prev.currentSchoolId,
            classId,
            subjectId: "sub_sinf_soati",
            teacherId: tid,
            dayOfWeek: 1,
            periodNumber: 1,
            isLocked: true,
          } as any);
        }
      }

      return {
        ...prev,
        classes: updatedClasses,
        teachers: updatedTeachers,
        lessons: updatedLessons,
        syncStatus: "syncing",
      };
    });

    addAuditLog(
      "Sinf rahbari o'zgartirildi",
      tid
        ? `Sinfga yangi rahbar tayinlandi va Dushanba 1-soatdagi Kelajak soati sinxronlashtirildi`
        : `Sinf rahbarligi bekor qilindi`
    );

    setHomeroomTeacherAction(storeState.currentSchoolId, classId, tid).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  const setTeacherHomeroomClass = useCallback((teacherId: string, classId?: string | null) => {
    const targetTeacher = storeState.teachers.find((t) => t.id === teacherId);
    if (!targetTeacher) return;

    if (classId && classId.trim() !== "") {
      setHomeroomTeacher(classId.trim(), teacherId);
    } else if (targetTeacher.homeroomClassId) {
      setHomeroomTeacher(targetTeacher.homeroomClassId, null);
    }
  }, [setHomeroomTeacher]);

  const saveCurriculum = useCallback((classId: string, subjects: ClassSubject[]) => {
    updateStore((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === classId ? { ...c, subjects } : c)),
      syncStatus: "syncing",
    }));
    addAuditLog("Fanlar taqsimoti saqlandi", `Sinf ID: ${classId} bo'yicha ${subjects.length} ta fan yuklamasi yangilandi`);

    saveClassTarifficationAction(
      storeState.currentSchoolId,
      classId,
      subjects.map((s) => ({ subjectId: s.subjectId, teacherId: s.teacherId, weeklyHours: s.weeklyHours }))
    ).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });

    triggerBackgroundAutoScheduler();
  }, []);

  const saveTeacherWorkload = useCallback(
    (
      teacherId: string,
      assignments: Array<{ classId: string; subjectId: string; weeklyHours: number }>
    ) => {
      updateStore((prev) => {
        const updatedClasses = prev.classes.map((c) => {
          const remainingSubjects = (c.subjects || []).filter((s) => s.teacherId !== teacherId);
          const classAssignments = assignments.filter((a) => a.classId === c.id);

          const addedSubjects: ClassSubject[] = classAssignments.map((a) => ({
            classId: c.id,
            subjectId: a.subjectId,
            teacherId,
            weeklyHours: a.weeklyHours,
            groupType: "WHOLE",
          }));

          const deduped: ClassSubject[] = [
            ...remainingSubjects.filter(
              (rs) => !addedSubjects.some((as) => as.subjectId === rs.subjectId)
            ),
            ...addedSubjects,
          ];

          return { ...c, subjects: deduped };
        });

        return {
          ...prev,
          classes: updatedClasses,
          syncStatus: "syncing",
        };
      });

      const teacher = storeState.teachers.find((t) => t.id === teacherId);
      addAuditLog(
        "O'qituvchi dars yuklamasi yangilandi",
        `${teacher?.fullName || teacherId} uchun ${assignments.length} ta dars taqsimoti saqlandi`
      );

      saveTeacherWorkloadAction(storeState.currentSchoolId, teacherId, assignments).then((res) => {
        updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
      });

      triggerBackgroundAutoScheduler();
    },
    []
  );

  const updateClasses = useCallback((updatedClasses: SchoolClass[]) => {
    const sorted = sortClassesByName(updatedClasses);
    updateStore((prev) => ({
      ...prev,
      classes: sorted,
      syncStatus: "syncing",
    }));
    addAuditLog("Tarifikatsiya yangilandi", "Barcha sinflar bo'yicha o'quv yuklamasi va o'qituvchilar taqsimoti saqlandi");

    syncFullSchoolDataAction(storeState.currentSchoolId, {
      classes: sorted,
    }).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });

    triggerBackgroundAutoScheduler();
  }, []);

  return {
    addClass,
    updateClass,
    deleteClass,
    setHomeroomTeacher,
    setTeacherHomeroomClass,
    saveCurriculum,
    saveTeacherWorkload,
    updateClasses,
  };
}
