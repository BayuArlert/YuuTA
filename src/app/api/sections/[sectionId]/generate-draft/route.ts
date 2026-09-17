import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  callGemini,
  cleanHtmlOrMarkdownFromLLM,
  isQuotaOrRateLimitError,
  isAuthError,
} from "@/lib/ai/llm-client";
import { buildDraftGeneratorPrompt } from "@/lib/ai/writing-prompt";
import { GeneratedOutline } from "@/types";

interface Params {
  params: Promise<{ sectionId: string }>;
}

// POST /api/sections/[sectionId]/generate-draft — AI auto-generate isi draf bab lengkap per poin
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
    return NextResponse.json({ error: "Bagian tidak ditemukan" }, { status: 404 });
  }

  // Ambil poin-poin outline untuk section ini
  const latestOutline = section.document.outlines[0];
  let outlinePoints: string[] = [];

  if (latestOutline) {
    const generatedOutline = latestOutline.generatedOutline as unknown as GeneratedOutline;
    const matchedSection = generatedOutline.sections?.find(
      (s) => s.key === section.sectionKey
    );
    outlinePoints = matchedSection?.points ?? [];
  }

  if (outlinePoints.length === 0) {
    // Fallback poin jika tidak ada outline spesifik
    outlinePoints = [
      `Pengantar dan latar belakang ${section.title}`,
      `Analisis dan elaborasi utama mengenai ${section.document.topic}`,
      `Korelasi dengan tujuan penelitian dan tinjauan teoritis`,
      `Sintesis dan implikasi akademis`,
    ];
  }

  const prompt = buildDraftGeneratorPrompt(
    section.sectionKey,
    section.title,
    section.document.title,
    section.document.topic,
    outlinePoints,
    section.document.citationStyle
  );

  try {
    const rawResponse = await callGemini(prompt, { maxOutputTokens: 8192 });
    let htmlContent = cleanHtmlOrMarkdownFromLLM(rawResponse);

    // Antisipasi jika LLM membungkus dalam JSON { "htmlContent": "..." }
    if (htmlContent.startsWith("{")) {
      try {
        const parsed = JSON.parse(htmlContent);
        if (parsed.htmlContent) htmlContent = parsed.htmlContent;
      } catch {
        const match = htmlContent.match(/"htmlContent"\s*:\s*"([\s\S]*)/);
        if (match) {
          htmlContent = match[1]
            .replace(/"\s*}\s*$/, "")
            .replace(/\\n/g, "\n")
            .replace(/\\"/g, '"');
        }
      }
    }

    if (!htmlContent || htmlContent.trim().length === 0) {
      return NextResponse.json(
        { error: "AI tidak dapat menghasilkan konten yang valid" },
        { status: 502 }
      );
    }

    return NextResponse.json({ htmlContent });
  } catch (error) {
    console.error("[GENERATE_DRAFT_ERROR]", error);

    if (isQuotaOrRateLimitError(error)) {
      return NextResponse.json(
        {
          error:
            "Batas kuota token atau rate limit Gemini API telah tercapai (Rate Limit / Quota Exceeded). Silakan tunggu 1–2 menit sebelum mencoba kembali, atau periksa kuota API Key di Google AI Studio.",
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

    return NextResponse.json(
      { error: "Gagal menghasilkan draf melalui AI. Silakan coba lagi beberapa saat lagi." },
      { status: 500 }
    );
  }
}
