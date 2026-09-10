import { SchoolClass, Subject, ClassSubject } from "@/types";
import { isKelajakOrSinfSoatiSubject } from "@/lib/curriculum-templates";
import { SubjectCategory } from "./types";

/**
 * Har qanday dublikat fanlarni (ayniqsa 2 ta Kelajak soati yoki ayni bir xil fanni)
 * 100% tozalab yagona qatorga keltiruvchi dvigatel
 */
export function deduplicateClassSubjects(
  list: ClassSubject[],
  subjectMap: Map<string, Subject>,
  allSubjects?: Subject[],
  homeroomTeacherId?: string | null
): ClassSubject[] {
  const result: ClassSubject[] = [];
  let seenSinfSoati = false;
  const seenSubjectGroupKeys = new Set<string>();

  for (const item of list) {
    if (!item || !item.subjectId) continue;
    const sub = subjectMap.get(item.subjectId) || allSubjects?.find((s) => s.id === item.subjectId);
    const subName = sub?.name || "";
    const isSinfSoati =
      item.subjectId === "sub_sinf_soati" ||
      item.subjectId === "sub_kelajak" ||
      isKelajakOrSinfSoatiSubject(item.subjectId, subName);

    if (isSinfSoati) {
      if (seenSinfSoati) continue;
      seenSinfSoati = true;
      result.push({
        ...item,
        weeklyHours: 1,
        groupType: "WHOLE",
        teacherId: item.teacherId || homeroomTeacherId || "",
      });
      continue;
    }

    const gType = item.groupType || "WHOLE";
    const groupKey = `${item.subjectId}_${gType}`;
    const normName = subName.trim().toLowerCase();
    const nameGroupKey = normName ? `${normName}_${gType}` : "";

    if (seenSubjectGroupKeys.has(groupKey) || (nameGroupKey && seenSubjectGroupKeys.has(nameGroupKey))) {
      const existingIdx = result.findIndex(
        (r) =>
          (r.groupType || "WHOLE") === gType &&
          (r.subjectId === item.subjectId ||
            (normName && (subjectMap.get(r.subjectId)?.name.trim().toLowerCase() === normName)))
      );
      if (existingIdx >= 0 && !result[existingIdx].teacherId && item.teacherId) {
        result[existingIdx].teacherId = item.teacherId;
      }
      continue;
    }

    seenSubjectGroupKeys.add(groupKey);
    if (nameGroupKey) seenSubjectGroupKeys.add(nameGroupKey);
    result.push({ ...item, groupType: gType });
  }

  return result;
}

export function getSubjectCategory(sub: Subject): SubjectCategory {
  const name = sub.name.toLowerCase();
  if (
    name.includes("matematika") ||
    name.includes("algebra") ||
    name.includes("geometriya") ||
    name.includes("informatika") ||
    name.includes("fizika")
  ) {
    return "EXACT_SCIENCE";
  }
  if (
    name.includes("ona tili") ||
    name.includes("adabiyot") ||
    name.includes("ingliz") ||
    name.includes("rus") ||
    name.includes("nemis") ||
    name.includes("fransuz") ||
    name.includes("chet tili")
  ) {
    return "LANGUAGES";
  }
  if (
    name.includes("biologiya") ||
    name.includes("kimyo") ||
    name.includes("geografiya") ||
    name.includes("tabiiy") ||
    name.includes("tabiat") ||
    name.includes("astronomiya")
  ) {
    return "NATURAL";
  }
  if (
    name.includes("tasviriy") ||
    name.includes("rasm") ||
    name.includes("musiqa") ||
    name.includes("texnologiya") ||
    name.includes("jismoniy") ||
    name.includes("sport") ||
    name.includes("chizmachilik")
  ) {
    return "ARTS_SPORTS";
  }
  if (
    name.includes("tarix") ||
    name.includes("tarbiya") ||
    name.includes("huquq") ||
    name.includes("iqtisod") ||
    name.includes("chqbt") ||
    name.includes("sinf soati") ||
    name.includes("kelajak")
  ) {
    return "SOCIAL";
  }
  return "EXACT_SCIENCE";
}
