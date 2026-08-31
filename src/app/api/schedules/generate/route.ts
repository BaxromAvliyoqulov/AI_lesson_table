import { NextResponse } from "next/server";
import { CSPSolver } from "@/lib/solver/csp-solver";
import { AIAssistant } from "@/lib/ai/ai-assistant";
import { SolverInput } from "@/types";

export async function POST(request: Request) {
  try {
    const input: SolverInput = await request.json();

    if (!input.classes || !input.teachers || !input.subjects) {
      return NextResponse.json(
        { error: "classes, teachers va subjects ma'lumotlari to'liq emas" },
        { status: 400 }
      );
    }

    const solver = new CSPSolver(input);
    const result = solver.solve();

    const aiAdvice = AIAssistant.analyzeConflicts(
      result,
      input.classes,
      input.teachers,
      input.subjects
    );

    return NextResponse.json({
      success: true,
      result,
      aiAdvice,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Generatsiya xatosi" },
      { status: 500 }
    );
  }
}
