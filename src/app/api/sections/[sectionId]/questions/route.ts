import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callGemini, parseJsonFromLLM } from "@/lib/ai/llm-client";
import { buildGuidedQuestionsPrompt } from "@/lib/ai/writing-prompt";
import { GuidedQuestions, GeneratedOutline } from "@/types";

interface Params {
  params: Promise<{ sectionId: string }>;
}

// POST /api/sections/[sectionId]/questions — generate pertanyaan pemandu AI
export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sectionId } = await params;

  // Ambil section + dokumen + outline
  const section = await prisma.section.findFirst({
    where: {
      id: sectionId,
      document: { userId: session.user.id as string },
    },
    include: {
      document: {
        include: {
          outlines: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      },
    },
  });

  if (!section) {
    return NextResponse.json({ error: "Section tidak ditemukan" }, { status: 404 });
  }

  // Ambil poin outline untuk section ini
  const latestOutline = section.document.outlines[0];
  let outlinePoints: string[] = [];

  if (latestOutline) {
    const generatedOutline = latestOutline.generatedOutline as unknown as GeneratedOutline;
    const matchedSection = generatedOutline.sections.find(
      (s) => s.key === section.sectionKey
    );
    outlinePoints = matchedSection?.points ?? [];
  }

  // Build prompt dan panggil Gemini
  const prompt = buildGuidedQuestionsPrompt(
    section.sectionKey,
    section.document.title,
    section.document.topic,
    outlinePoints
  );

  try {
    const rawResponse = await callGemini(prompt);
    const result = parseJsonFromLLM<GuidedQuestions>(rawResponse);

    if (!result.questions || !Array.isArray(result.questions)) {
      return NextResponse.json(
        { error: "Format respons AI tidak valid" },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions: result.questions });
  } catch (error) {
    console.error("[GUIDED_QUESTIONS]", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI gagal memformat respons" }, { status: 502 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
