import { NextResponse } from "next/server";
import { AIAssistant } from "@/lib/ai/ai-assistant";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    if (action === "RECOMMEND_ZAMENA") {
      const { targetLesson, targetSubject, allTeachers, allLessons } = payload;
      const recommendations = AIAssistant.recommendSubstitutes(
        targetLesson,
        targetSubject,
        allTeachers,
        allLessons
      );
      return NextResponse.json({ success: true, recommendations });
    }

    if (action === "ANALYZE_CONFLICTS") {
      const { result, classes, teachers, subjects } = payload;
      const advice = AIAssistant.analyzeConflicts(result, classes, teachers, subjects);
      return NextResponse.json({ success: true, advice });
    }

    return NextResponse.json({ error: "Noma'lum amal (action)" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "AI xizmati xatosi" },
      { status: 500 }
    );
  }
}
