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
import {
  isHomeroomPrimarySubject,
  isKelajakOrSinfSoatiSubject,
  generateStandardCurriculumForClass,
} from "@/lib/curriculum-templates";
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
          const sinfSoatiSubId =
            prev.subjects.find((subItem) => isKelajakOrSinfSoatiSubject(subItem.id, subItem.name))?.id ||
            "sub_sinf_soati";
          const newSubIds = Array.from(new Set([...(t.subjectIds || []), sinfSoatiSubId]));
          return { ...t, homeroomClassId: classId, subjectIds: newSubIds };
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
      subjects.map((s) => ({
        subjectId: s.subjectId,
        teacherId: s.teacherId,
        weeklyHours: s.weeklyHours,
        groupType: s.groupType || "WHOLE",
      }))
    ).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });

    triggerBackgroundAutoScheduler();
  }, []);

  const saveTeacherWorkload = useCallback(
    (
      teacherId: string,
      assignments: Array<{
        classId: string;
        subjectId: string;
        weeklyHours: number;
        isSplit?: boolean;
        groupType?: "WHOLE" | "GROUP_1" | "GROUP_2";
        secondTeacherId?: string;
      }>
    ) => {
      updateStore((prev) => {
        const updatedClasses = prev.classes.map((c) => {
          let remainingSubjects = (c.subjects || []).filter((s) => s.teacherId !== teacherId);
          const classAssignments = assignments.filter((a) => a.classId === c.id);

          const addedSubjects: ClassSubject[] = [];

          classAssignments.forEach((a) => {
            if (a.isSplit && a.secondTeacherId) {
              // 1-guruh darsi (hozirgi o'qituvchi)
              addedSubjects.push({
                classId: c.id,
                subjectId: a.subjectId,
                teacherId: teacherId,
                weeklyHours: a.weeklyHours,
                groupType: "GROUP_1",
              });
              // 2-guruh darsi (biriktirilgan 2-o'qituvchi)
              addedSubjects.push({
                classId: c.id,
                subjectId: a.subjectId,
                teacherId: a.secondTeacherId,
                weeklyHours: a.weeklyHours,
                groupType: "GROUP_2",
              });

              // Ushbu fanning eski split qismlarini tozalash
              remainingSubjects = remainingSubjects.filter(
                (rs) =>
                  !(
                    rs.subjectId === a.subjectId &&
                    (rs.groupType === "GROUP_1" || rs.groupType === "GROUP_2")
                  )
              );
            } else {
              addedSubjects.push({
                classId: c.id,
                subjectId: a.subjectId,
                teacherId: teacherId,
                weeklyHours: a.weeklyHours,
                groupType: "WHOLE",
              });

              // Agar avval split bo'lgan bo'lsa, eskisini tozalash
              remainingSubjects = remainingSubjects.filter(
                (rs) =>
                  !(
                    rs.subjectId === a.subjectId &&
                    (rs.groupType === "GROUP_1" || rs.groupType === "GROUP_2")
                  )
              );
            }
          });

          // KAFOLAT: Agar bu o'qituvchi shu sinfda sinf rahbari bo'lsa, 1 soatlik Sinf soati har doim saqlanadi!
          const subMap = new Map(prev.subjects.map((s) => [s.id, s]));
          if (c.homeroomTeacherId === teacherId) {
            const hasSinfSoatiInAssignments = addedSubjects.some((as) =>
              isKelajakOrSinfSoatiSubject(as.subjectId, subMap.get(as.subjectId)?.name)
            );
            if (!hasSinfSoatiInAssignments) {
              const sinfSoatiSub =
                prev.subjects.find((subItem) => isKelajakOrSinfSoatiSubject(subItem.id, subItem.name)) ||
                prev.subjects.find((subItem) => subItem.id === "sub_sinf_soati");
              const finalSubId = sinfSoatiSub?.id || "sub_sinf_soati";
              addedSubjects.unshift({
                classId: c.id,
                subjectId: finalSubId,
                teacherId: teacherId,
                weeklyHours: 1,
                groupType: "WHOLE",
              });
            }
          }

          const deduped: ClassSubject[] = [
            ...remainingSubjects.filter(
              (rs) =>
                !addedSubjects.some(
                  (as) => as.subjectId === rs.subjectId && as.teacherId === rs.teacherId
                )
            ),
            ...addedSubjects,
          ];

          // KAFOLAT: Har bir sinfda Sinf soati FAQAT VA FAQAT 1 DONA bo'lishi shart!
          // Va hech bir fandan ayni bir sinfda 2 xil satr (dublikat) bo'lmasligi kafolatlanadi
          let seenSinfSoatiInClass = false;
          const seenSubIdsInClass = new Set<string>();
          const strictlyUniqueSubjects: ClassSubject[] = [];

          for (const s of deduped) {
            const isSinf = isKelajakOrSinfSoatiSubject(s.subjectId, subMap.get(s.subjectId)?.name);
            if (isSinf) {
              if (seenSinfSoatiInClass) continue;
              seenSinfSoatiInClass = true;
              s.weeklyHours = 1;
              strictlyUniqueSubjects.push(s);
              continue;
            }

            if (seenSubIdsInClass.has(s.subjectId)) continue;
            seenSubIdsInClass.add(s.subjectId);
            strictlyUniqueSubjects.push(s);
          }

          return { ...c, subjects: strictlyUniqueSubjects };
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

  /**
   * ⚡ Barcha sinflarga O'zbekiston Respublikasi Davlat Standart O'quv Rejasini 1-bosishda tatbiq etish
   * (1-sinf: 22s, 2-4: 25s, 5: 30s, 6: 31s, 7: 36s, 8: 34s, 9: 35s, 10-11: 32s)
   */
  const applyStandardCurriculumToAllClasses = useCallback(() => {
    let affectedCount = 0;
    updateStore((prev) => {
      const workloadTracker = new Map<string, number>();

      const updatedClasses = prev.classes.map((cls) => {
        const grade = cls.grade || 5;
        const standardList = generateStandardCurriculumForClass(
          grade,
          cls.id,
          cls.homeroomTeacherId,
          prev.subjects,
          prev.teachers,
          workloadTracker
        );

        // Agar foydalanuvchi allaqachon biriktirgan o'qituvchilar bo'lsa, ularni saqlab qolamiz!
        const existingSubjectMap = new Map<string, ClassSubject>();
        (cls.subjects || []).forEach((cs) => {
          if (cs.teacherId) {
            existingSubjectMap.set(cs.subjectId, cs);
          }
        });

        const mergedSubjects: ClassSubject[] = standardList.map((stItem) => {
          const existing = existingSubjectMap.get(stItem.subjectId);
          if (existing && existing.teacherId) {
            return {
              ...stItem,
              teacherId: existing.teacherId,
              groupType: existing.groupType || stItem.groupType || "WHOLE",
            };
          }
          return stItem;
        });

        affectedCount++;
        return {
          ...cls,
          subjects: mergedSubjects,
        };
      });

      const sorted = sortClassesByName(updatedClasses);
      return {
        ...prev,
        classes: sorted,
        syncStatus: "syncing",
      };
    });

    addAuditLog(
      "Davlat Standart Rejasi Tatbiq Etildi",
      `Barcha ${affectedCount} ta sinfga 2026-2027-o'quv yili uchun Rasmiy Davlat O'quv Rejasi to'liq tatbiq etildi`
    );

    syncFullSchoolDataAction(storeState.currentSchoolId, {
      classes: storeState.classes,
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
    applyStandardCurriculumToAllClasses,
  };
}
