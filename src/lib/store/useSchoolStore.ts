"use client";

import { useSyncExternalStore } from "react";
import {
  storeState,
  serverInitialState,
  listeners,
  addAuditLog,
} from "./store-core";
import { useStoreSync } from "./store-sync";
import { useClassActions } from "./slices/useClassActions";
import { useTeacherActions } from "./slices/useTeacherActions";
import { useSubjectActions } from "./slices/useSubjectActions";
import { useLessonActions, triggerBackgroundAutoScheduler } from "./slices/useLessonActions";
import { useMetaAndUIActions } from "./slices/useMetaAndUIActions";

// Store turlari va yordamchi funksiyalarni qayta eksport qilish
export * from "./types";
export { triggerBackgroundAutoScheduler } from "./slices/useLessonActions";

/**
 * 🌟 Universal Modular School Store (useSchoolStore)
 * Arxitektura: 6 ta mustaqil action slicelarga va singleton state'ga ajratilgan.
 */
export function useSchoolStore() {
  const state = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => storeState,
    () => serverInitialState
  );

  const sync = useStoreSync();
  const classActions = useClassActions();
  const teacherActions = useTeacherActions();
  const subjectActions = useSubjectActions();
  const lessonActions = useLessonActions();
  const metaAndUIActions = useMetaAndUIActions();

  return {
    ...state,
    ...sync,
    ...classActions,
    ...teacherActions,
    ...subjectActions,
    ...lessonActions,
    ...metaAndUIActions,
    addAudit: addAuditLog,
  };
}
