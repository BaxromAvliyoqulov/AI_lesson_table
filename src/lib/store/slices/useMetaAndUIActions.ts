import { useCallback } from "react";
import { SchoolInfo, Room, BellPeriod, SubstitutionRecord } from "@/types";
import { updateSchoolDetailsAction, saveBellPeriodsAction } from "@/lib/actions/school.actions";
import { storeState, updateStore, addAuditLog } from "../store-core";

export function useMetaAndUIActions() {
  const addSchool = useCallback((name: string) => {
    const newId = `school_${Date.now()}`;
    const newSchool: SchoolInfo = {
      id: newId,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      branchesCount: 1,
      classesCount: 0,
      teachersCount: 0,
    };
    updateStore((prev) => ({
      ...prev,
      schools: [...prev.schools, newSchool],
      currentSchoolId: newId,
      branches: [
        ...prev.branches,
        { id: `branch_${Date.now()}`, schoolId: newId, name: "Asosiy bino", isMain: true },
      ],
      shifts: [
        ...prev.shifts,
        { id: `shift_${Date.now()}`, schoolId: newId, name: "1-smena", startTime: "08:00", endTime: "13:10", periodsCount: 6 },
      ],
    }));
  }, []);

  const updateSchoolInfo = useCallback((schoolId: string, updates: Partial<SchoolInfo>) => {
    updateStore((prev) => ({
      ...prev,
      schools: prev.schools.map((s) => (s.id === schoolId ? { ...s, ...updates } : s)),
      syncStatus: "syncing",
    }));
    addAuditLog("Maktab rekvizitlari yangilandi", `${updates.name || "Maktab"} ma'lumotlari yangilandi`);

    updateSchoolDetailsAction(schoolId, updates).then((res) => {
      updateStore((prev) => ({ ...prev, syncStatus: res.success ? "synced" : "error" }));
    });
  }, []);

  const addRoom = useCallback((room: Room) => {
    updateStore((prev) => ({
      ...prev,
      rooms: [...prev.rooms, room],
    }));
    addAuditLog("Xona qo'shildi", `${room.name} xonasi qo'shildi`);
  }, []);

  const updateRoom = useCallback((room: Room) => {
    updateStore((prev) => ({
      ...prev,
      rooms: prev.rooms.map((r) => (r.id === room.id ? room : r)),
    }));
    addAuditLog("Xona yangilandi", `${room.name} xonasi tahrirlandi`);
  }, []);

  const deleteRoom = useCallback((roomId: string) => {
    const target = storeState.rooms.find((r) => r.id === roomId);
    updateStore((prev) => ({
      ...prev,
      rooms: prev.rooms.filter((r) => r.id !== roomId),
    }));
    if (target) {
      addAuditLog("Xona o'chirildi", `${target.name} xonasi o'chirildi`);
    }
  }, []);

  const updateBellPeriods = useCallback((bellPeriods: BellPeriod[], shiftId?: string) => {
    updateStore((prev) => {
      const updatedShifts = prev.shifts.map((s) => {
        if (shiftId ? s.id === shiftId : s.order === 1 || prev.shifts[0]?.id === s.id) {
          const firstPeriod = bellPeriods[0];
          const lastPeriod = bellPeriods[bellPeriods.length - 1];
          return {
            ...s,
            bellPeriods,
            periodsCount: bellPeriods.length,
            startTime: firstPeriod?.startTime || s.startTime,
            endTime: lastPeriod?.endTime || s.endTime,
          };
        }
        return s;
      });

      const isFirstShift = !shiftId || shiftId === prev.shifts[0]?.id;
      return {
        ...prev,
        bellPeriods: isFirstShift ? bellPeriods : prev.bellPeriods,
        shifts: updatedShifts,
      };
    });
    addAuditLog("Qo'ng'iroqlar yangilandi", "Dars va tanaffus vaqtlari o'zgartirildi");
    saveBellPeriodsAction(storeState.currentSchoolId, bellPeriods, shiftId).catch(console.error);
  }, []);

  const addSubstitution = useCallback((sub: SubstitutionRecord) => {
    updateStore((prev) => ({
      ...prev,
      substitutions: [sub, ...prev.substitutions],
    }));
    addAuditLog("O'rinbosar tayinlandi", `Zamena: ${sub.reason} sababli biriktirildi`);
  }, []);

  const setZoomLevel = useCallback((zoomLevel: number) => {
    updateStore((prev) => ({ ...prev, zoomLevel }));
  }, []);

  const setSelectedBranch = useCallback((selectedBranch: string) => {
    updateStore((prev) => ({ ...prev, selectedBranch }));
  }, []);

  const setViewMode = useCallback((viewMode: "OFFICIAL_39" | "MASTER" | "CLASS" | "TEACHER") => {
    updateStore((prev) => ({ ...prev, viewMode }));
  }, []);

  const setSelectedClassId = useCallback((selectedClassId: string) => {
    updateStore((prev) => ({ ...prev, selectedClassId }));
  }, []);

  const setIsGenerating = useCallback((isGenerating: boolean) => {
    updateStore((prev) => ({ ...prev, isGenerating }));
  }, []);

  return {
    addSchool,
    updateSchoolInfo,
    addRoom,
    updateRoom,
    deleteRoom,
    updateBellPeriods,
    addSubstitution,
    setZoomLevel,
    setSelectedBranch,
    setViewMode,
    setSelectedClassId,
    setIsGenerating,
  };
}
