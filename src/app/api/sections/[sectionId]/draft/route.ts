import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionStatus } from "@prisma/client";

interface Params {
  params: Promise<{ sectionId: string }>;
}

/**
 * Helper untuk mencoba ulang query Prisma jika connection pool Supabase sedang sibuk (P2024)
 */
async function withPrismaRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    if (
      retries > 0 &&
      (errorObj?.code === "P2024" ||
        errorObj?.code === "P2028" ||
        errorObj?.message?.includes("connection pool"))
    ) {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return withPrismaRetry(fn, retries - 1);
    }
    throw err;
  }
}

// GET /api/sections/[sectionId]/draft — ambil draft terbaru
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sectionId } = await params;
  const userId = session.user.id as string;

  try {
    const section = await withPrismaRetry(() =>
      prisma.section.findFirst({
        where: {
          id: sectionId,
          document: { userId },
        },
        include: {
          drafts: {
            orderBy: { version: "desc" },
            take: 1,
          },
        },
      })
    );

    if (!section) {
      return NextResponse.json({ error: "Section tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      section: {
        id: section.id,
        sectionKey: section.sectionKey,
        title: section.title,
        status: section.status,
      },
      draft: section.drafts[0] ?? null,
    });
  } catch (error) {
    console.error("[GET_DRAFT_ERROR]", error);
    return NextResponse.json({ error: "Gagal memuat draf" }, { status: 500 });
  }
}

// POST /api/sections/[sectionId]/draft — simpan/update draft
export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sectionId } = await params;
  const userId = session.user.id as string;
  const { content, markAsDone } = await req.json();

  if (content === undefined || content === null) {
    return NextResponse.json({ error: "content wajib diisi" }, { status: 400 });
  }

  try {
    // Verifikasi kepemilikan dengan retry
    const section = await withPrismaRetry(() =>
      prisma.section.findFirst({
        where: {
          id: sectionId,
          document: { userId },
        },
        include: {
          drafts: { orderBy: { version: "desc" }, take: 1 },
        },
      })
    );

    if (!section) {
      return NextResponse.json({ error: "Section tidak ditemukan" }, { status: 404 });
    }

    const existingDraft = section.drafts[0];
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

    // Upsert draft: update jika sudah ada, create jika belum
    let draft;
    if (existingDraft) {
      draft = await withPrismaRetry(() =>
        prisma.sectionDraft.update({
          where: { id: existingDraft.id },
          data: { content, version: existingDraft.version + 1 },
        })
      );
    } else {
      draft = await withPrismaRetry(() =>
        prisma.sectionDraft.create({
          data: { sectionId, content, version: 1 },
        })
      );
    }

    // Update status section hanya jika status berubah
    let newStatus: SectionStatus = "EMPTY";
    if (markAsDone) {
      newStatus = "DONE";
    } else if (wordCount > 0) {
      newStatus = "DRAFT";
    }

    if (section.status !== newStatus) {
      await withPrismaRetry(() =>
        prisma.section.update({
          where: { id: sectionId },
          data: { status: newStatus },
        })
      );
    }

    return NextResponse.json({ draft, status: newStatus });
  } catch (error) {
    console.error("[SAVE_DRAFT_ERROR]", error);
    return NextResponse.json(
      { error: "Koneksi database sedang sibuk. Draf Anda tetap aman di editor." },
      { status: 500 }
    );
  }
}
