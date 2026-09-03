import { useCallback, useEffect } from "react";
import { getSchoolFullData, syncFullSchoolDataAction } from "@/lib/actions/school.actions";
import { sortClassesByName } from "@/lib/utils";
import {
  storeState,
  updateStore,
  saveLocalStorageState,
  getLocalStorageState,
  hasHydrated,
  setHasHydrated,
  syncChannel,
  addAuditLog,
} from "./store-core";

export function useStoreSync() {
  const fetchServerData = useCallback(async (schoolIdToFetch?: string, silent = false) => {
    const targetId = schoolIdToFetch || storeState.currentSchoolId;
    if (!silent) {
      updateStore((prev) => ({ ...prev, syncStatus: "syncing" }), false);
    }
    try {
      const res = await getSchoolFullData(targetId);
      if (res.success && res.data) {
        const {
          schoolInfo,
          branches,
          shifts,
          subjects,
          rooms,
          teachers,
          classes,
          lessons,
          bellPeriods,
        } = res.data;

        updateStore(
          (prev) => {
            const newState = {
              ...prev,
              currentSchoolId: schoolInfo.id,
              schools: [
                schoolInfo,
                ...prev.schools.filter((s) => s.id !== schoolInfo.id && s.id !== "school_39"),
              ],
              branches,
              shifts,
              subjects,
              rooms,
              teachers,
              classes: sortClassesByName(classes),
              lessons,
              bellPeriods: bellPeriods.length > 0 ? bellPeriods : prev.bellPeriods,
              syncStatus: "synced" as const,
            };
            saveLocalStorageState(newState);
            return newState;
          },
          false
        );
      } else {
        if (!silent) {
          updateStore((prev) => ({ ...prev, syncStatus: "synced" }), false);
        }
      }
    } catch (err) {
      console.error("fetchServerData xatosi:", err);
      if (!silent) {
        updateStore((prev) => ({ ...prev, syncStatus: "offline" }), false);
      }
    }
  }, []);

  const setCurrentSchoolId = useCallback(
    (id: string) => {
      updateStore((prev) => ({ ...prev, currentSchoolId: id }));
      fetchServerData(id);
    },
    [fetchServerData]
  );

  const syncToCloud = useCallback(async () => {
    updateStore((prev) => ({ ...prev, syncStatus: "syncing" }));
    try {
      const cur = storeState;
      const currentSchool = cur.schools.find((s) => s.id === cur.currentSchoolId) || cur.schools[0];
      const res = await syncFullSchoolDataAction(cur.currentSchoolId, {
        schoolInfo: currentSchool,
        branches: cur.branches.filter((b) => b.schoolId === cur.currentSchoolId),
        shifts: cur.shifts.filter((s) => s.schoolId === cur.currentSchoolId),
        subjects: cur.subjects.filter((s) => s.schoolId === cur.currentSchoolId),
        rooms: cur.rooms.filter((r) => r.schoolId === cur.currentSchoolId),
        teachers: cur.teachers.filter((t) => t.schoolId === cur.currentSchoolId),
        classes: cur.classes.filter((c) => c.schoolId === cur.currentSchoolId),
        lessons: cur.lessons.filter((l) => l.schoolId === cur.currentSchoolId),
      });

      if (res.success && res.schoolId) {
        updateStore((prev) => ({
          ...prev,
          currentSchoolId: res.schoolId,
          syncStatus: "synced",
        }));
        addAuditLog("Bulutga sinxronlandi", "Barcha ma'lumotlar Neon PostgreSQL bulutiga to'liq saqlandi");
        return { success: true };
      } else {
        updateStore((prev) => ({ ...prev, syncStatus: "error" }));
        return { success: false, error: res.error };
      }
    } catch (err: any) {
      console.error("syncToCloud xatosi:", err);
      updateStore((prev) => ({ ...prev, syncStatus: "error" }));
      return { success: false, error: err?.message };
    }
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      setHasHydrated(true);
      const saved = getLocalStorageState();
      if (saved) {
        updateStore((prev) => ({ ...prev, ...saved, isGenerating: false }), false);
      }
      fetchServerData();
    }

    const handleWindowFocus = () => {
      fetchServerData(undefined, true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchServerData(undefined, true);
      }
    };

    const handleBroadcastMessage = (e: MessageEvent) => {
      if (e.data?.type === "LIVE_STORE_MUTATION") {
        fetchServerData(undefined, true);
      }
    };

    if (syncChannel) {
      syncChannel.addEventListener("message", handleBroadcastMessage);
    }

    window.addEventListener("focus", handleWindowFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const heartbeatInterval = setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        !storeState.isGenerating &&
        storeState.syncStatus !== "syncing"
      ) {
        fetchServerData(undefined, true);
      }
    }, 30000);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (syncChannel) {
        syncChannel.removeEventListener("message", handleBroadcastMessage);
      }
      clearInterval(heartbeatInterval);
    };
  }, [fetchServerData]);

  return {
    fetchServerData,
    setCurrentSchoolId,
    syncToCloud,
  };
}
