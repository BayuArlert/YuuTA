import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { callGemini, parseJsonFromLLM } from "@/lib/ai/llm-client";
import { buildAiFeedbackPrompt } from "@/lib/ai/writing-prompt";
import { AiFeedback, GeneratedOutline } from "@/types";

interface Params {
  params: Promise<{ sectionId: string }>;
}

// POST /api/sections/[sectionId]/feedback — minta feedback AI untuk draf
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sectionId } = await params;
  const { content } = await req.json();

  if (!content || content.trim().length < 50) {
    return NextResponse.json(
      { error: "Draf minimal 50 karakter untuk dianalisis" },
      { status: 400 }
    );
  }

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

  // Ambil outline points untuk section ini
  const latestOutline = section.document.outlines[0];
  let outlinePoints: string[] = [];

  if (latestOutline) {
    const generatedOutline = latestOutline.generatedOutline as unknown as GeneratedOutline;
    const matchedSection = generatedOutline.sections.find(
      (s) => s.key === section.sectionKey
    );
    outlinePoints = matchedSection?.points ?? [];
  }

  const prompt = buildAiFeedbackPrompt(
    section.sectionKey,
    content,
    section.document.title,
    section.document.topic,
    outlinePoints
  );

  try {
    const rawResponse = await callGemini(prompt);
    const feedback = parseJsonFromLLM<AiFeedback>(rawResponse);

    // Simpan feedback ke draft terbaru
    const latestDraft = await prisma.sectionDraft.findFirst({
      where: { sectionId },
      orderBy: { version: "desc" },
    });

    if (latestDraft) {
      await prisma.sectionDraft.update({
        where: { id: latestDraft.id },
        data: { aiFeedback: JSON.stringify(feedback) },
      });
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error("[AI_FEEDBACK]", error);
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "AI gagal memformat respons feedback" }, { status: 502 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
