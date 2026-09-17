import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateDocumentWordBuffer, ExportDocumentData } from "@/lib/export/word-exporter";
import { DocumentTypeValue, CitationStyleValue } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/documents/[id]/export — Unduh dokumen lengkap dalam format Word (.docx)
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Ambil dokumen beserta semua section dan draft terbarunya
  const document = await prisma.document.findFirst({
    where: {
      id,
      userId: session.user.id as string,
    },
    include: {
      user: { select: { name: true, email: true } },
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          drafts: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!document) {
    return NextResponse.json({ error: "Dokumen tidak ditemukan" }, { status: 404 });
  }

  const exportData: ExportDocumentData = {
    title: document.title,
    topic: document.topic,
    documentType: document.documentType as DocumentTypeValue,
    citationStyle: document.citationStyle as CitationStyleValue,
    authorName: document.user.name || "Mahasiswa / Peneliti",
    sections: document.sections.map((s) => ({
      sectionKey: s.sectionKey,
      title: s.title,
      orderIndex: s.orderIndex,
      content: s.drafts[0]?.content || "",
    })),
  };

  try {
    const buffer = await generateDocumentWordBuffer(exportData);

    // Bersihkan nama file agar aman di semua OS
    const sanitizedTitle = document.title
      .replace(/[^a-zA-Z0-9_\-\s]/g, "")
      .trim()
      .replace(/\s+/g, "_")
      .slice(0, 50);
    const fileName = `${sanitizedTitle || "Dokumen_Skripsi"}.docx`;

    return new Response(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[WORD_EXPORT_ERROR]", error);
    return NextResponse.json(
      { error: "Gagal membuat file Word (.docx). Silakan coba lagi." },
      { status: 500 }
    );
  }
}
