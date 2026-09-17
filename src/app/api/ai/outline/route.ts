import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildOutlinePrompt } from "@/lib/ai/outline-prompt";
import {
  callGemini,
  parseJsonFromLLM,
  isQuotaOrRateLimitError,
  isAuthError,
} from "@/lib/ai/llm-client";
import { GeneratedOutline } from "@/types";
import { DocumentType } from "@prisma/client";

// POST /api/ai/outline
// Body: { documentId: string }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId wajib diisi" },
        { status: 400 }
      );
    }

    // Ambil dokumen dan pastikan milik user
    const document = await prisma.document.findUnique({
      where: { id: documentId, userId: session.user.id as string },
    });

    if (!document) {
      return NextResponse.json(
        { error: "Dokumen tidak ditemukan" },
        { status: 404 }
      );
    }

    // Bangun prompt sesuai template
    const prompt = buildOutlinePrompt(
      document.topic,
      document.title,
      document.documentType as DocumentType
    );

    // Panggil Gemini
    const rawResponse = await callGemini(prompt);

    // Parse JSON dari respons LLM
    const generatedOutline = parseJsonFromLLM<GeneratedOutline>(rawResponse);

    // Validasi struktur minimal
    if (!generatedOutline.sections || !Array.isArray(generatedOutline.sections)) {
      return NextResponse.json(
        { error: "Format respons AI tidak valid, coba lagi" },
        { status: 502 }
      );
    }

    // Simpan atau update outline di DB (upsert per dokumen)
    const existingOutline = await prisma.outline.findFirst({
      where: { documentId },
    });

    const outline = existingOutline
      ? await prisma.outline.update({
          where: { id: existingOutline.id },
          data: { generatedOutline: generatedOutline as never, isEdited: false },
        })
      : await prisma.outline.create({
          data: {
            documentId,
            generatedOutline: generatedOutline as never,
          },
        });

    return NextResponse.json({ outline, generatedOutline });
  } catch (error) {
    console.error("[GENERATE_OUTLINE]", error);

    if (isQuotaOrRateLimitError(error)) {
      return NextResponse.json(
        {
          error:
            "Batas kuota token atau rate limit Gemini API telah tercapai (Rate Limit). Silakan tunggu 1–2 menit sebelum mencoba kembali, atau periksa kuota API Key di Google AI Studio.",
          isRateLimit: true,
        },
        { status: 429 }
      );
    }

    if (isAuthError(error)) {
      return NextResponse.json(
        {
          error:
            "API Key Gemini tidak valid atau dinonaktifkan. Silakan periksa GEMINI_API_KEY di file konfigurasi .env.local.",
          isAuthError: true,
        },
        { status: 403 }
      );
    }

    // Handle JSON parse error dari LLM
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "AI memberikan respons yang tidak bisa diparse, coba lagi" },
        { status: 502 }
      );
    }

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PATCH /api/ai/outline
// Body: { outlineId: string, generatedOutline: GeneratedOutline }
// Update outline yang sudah diedit user
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { outlineId, generatedOutline } = await req.json();

    const outline = await prisma.outline.findUnique({
      where: { id: outlineId },
      include: { document: true },
    });

    if (!outline || outline.document.userId !== session.user.id) {
      return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.outline.update({
      where: { id: outlineId },
      data: { generatedOutline: generatedOutline as never, isEdited: true },
    });

    return NextResponse.json({ outline: updated });
  } catch (error) {
    console.error("[UPDATE_OUTLINE]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
