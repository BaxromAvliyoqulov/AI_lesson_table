import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId");

    if (!schoolId) {
      return NextResponse.json({ error: "schoolId talab qilinadi" }, { status: 400 });
    }

    const schedules = await prisma.schedule.findMany({
      where: { schoolId },
      include: {
        lessons: {
          include: {
            class: true,
            subject: true,
            teacher: true,
            room: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: schedules });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Server xatosi" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { schoolId, name, academicYear, term, status, lessons } = body;

    if (!schoolId || !name) {
      return NextResponse.json(
        { error: "schoolId va name talab qilinadi" },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.create({
      data: {
        schoolId,
        name,
        academicYear: academicYear || "2025-2026",
        term: term || 1,
        status: status || "DRAFT",
        isActive: status === "PUBLISHED",
        lessons: {
          create: (lessons || []).map((l: any) => ({
            schoolId,
            classId: l.classId,
            subjectId: l.subjectId,
            teacherId: l.teacherId,
            roomId: l.roomId || null,
            branchId: l.branchId,
            dayOfWeek: l.dayOfWeek,
            periodNumber: l.periodNumber,
            isLocked: l.isLocked || false,
          })),
        },
      },
      include: { lessons: true },
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Saqlashda xatolik" },
      { status: 500 }
    );
  }
}
