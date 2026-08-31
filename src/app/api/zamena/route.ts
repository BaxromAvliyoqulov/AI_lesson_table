import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AIAssistant } from "@/lib/ai/ai-assistant";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      lessonId,
      date,
      originalTeacherId,
      replacementTeacherId,
      reason,
      schoolId,
    } = body;

    if (!lessonId || !originalTeacherId || !replacementTeacherId) {
      return NextResponse.json(
        { error: "Majburiy maydonlar to'ldirilmagan" },
        { status: 400 }
      );
    }

    const replacement = await prisma.lessonReplacement.create({
      data: {
        lessonId,
        date: date ? new Date(date) : new Date(),
        originalTeacherId,
        replacementTeacherId,
        reason: reason || "Sababli almashtirish",
      },
    });

    if (schoolId) {
      await prisma.auditLog.create({
        data: {
          schoolId,
          userId: "system",
          action: "ZAMENA_ASSIGNED",
          payload: {
            lessonId,
            originalTeacherId,
            replacementTeacherId,
            reason,
          },
        },
      });
    }

    return NextResponse.json({ success: true, data: replacement }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Zamena saqlashda xatolik" },
      { status: 500 }
    );
  }
}
