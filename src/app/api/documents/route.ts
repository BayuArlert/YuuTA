import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TEMPLATE_SECTIONS } from "@/lib/ai/outline-prompt";
import { DocumentType, CitationStyle } from "@prisma/client";

// GET /api/documents — ambil semua dokumen milik user yang login
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    include: {
      sections: { orderBy: { orderIndex: "asc" } },
      outlines: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ documents });
}

// POST /api/documents — buat dokumen baru + sections template
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      title,
      topic,
      documentType,
      citationStyle,
      templateKey,
      authorName,
      studentNim,
      studyProgram,
      institution,
      academicYear,
    } = await req.json();

    if (!title || !topic || !documentType) {
      return NextResponse.json(
        { error: "title, topic, dan documentType wajib diisi" },
        { status: 400 }
      );
    }

    const templateSections = TEMPLATE_SECTIONS[documentType as DocumentType];
    if (!templateSections) {
      return NextResponse.json(
        { error: "documentType tidak valid" },
        { status: 400 }
      );
    }

    // Buat dokumen + sections sekaligus dengan nested write (aman untuk Supabase PgBouncer pooler)
    const fullDoc = await prisma.document.create({
      data: {
        userId: session.user!.id as string,
        title,
        topic,
        documentType: documentType as DocumentType,
        templateKey: templateKey || "STEKOM",
        authorName: authorName || session.user!.name || null,
        studentNim: studentNim || null,
        studyProgram: studyProgram || "Teknik Informatika",
        institution: institution || "Universitas STEKOM",
        academicYear: academicYear || new Date().getFullYear().toString(),
        citationStyle: (citationStyle as CitationStyle) ?? "APA",
        sections: {
          create: templateSections.map((s) => ({
            sectionKey: s.key as never,
            title: s.title,
            orderIndex: s.order,
            status: "EMPTY" as const,
          })),
        },
      },
      include: {
        sections: { orderBy: { orderIndex: "asc" } },
        outlines: true,
      },
    });

    return NextResponse.json({ document: fullDoc }, { status: 201 });
  } catch (error) {
    console.error("[CREATE_DOCUMENT]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
