import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import WritingEditor from "@/components/document/WritingEditor";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import { GeneratedOutline, SectionWithDraft } from "@/types";

interface Props {
  params: Promise<{ id: string; sectionId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sectionId } = await params;
  const section = await prisma.section.findUnique({ where: { id: sectionId }, select: { title: true } });
  return { title: section ? `Menulis: ${section.title}` : "Editor — YuuTA" };
}

export default async function WriteSectionPage({ params }: Props) {
  const session = await auth();
  const { id, sectionId } = await params;

  // Ambil dokumen + semua sections
  const document = await prisma.document.findUnique({
    where: { id, userId: session!.user!.id as string },
    include: {
      sections: {
        orderBy: { orderIndex: "asc" },
        include: {
          drafts: { orderBy: { version: "desc" }, take: 1 },
        },
      },
      outlines: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!document) notFound();

  // Verifikasi section milik dokumen ini
  const currentSection = document.sections.find((s) => s.id === sectionId);
  if (!currentSection) notFound();

  // Map sections ke SectionWithDraft
  const sectionsWithDraft: SectionWithDraft[] = document.sections.map((s) => ({
    id: s.id,
    documentId: s.documentId,
    sectionKey: s.sectionKey,
    title: s.title,
    orderIndex: s.orderIndex,
    status: s.status as "EMPTY" | "DRAFT" | "DONE",
    draft: s.drafts[0]
      ? {
          id: s.drafts[0].id,
          sectionId: s.drafts[0].sectionId,
          content: s.drafts[0].content,
          aiFeedback: s.drafts[0].aiFeedback,
          guidedAnswers: s.drafts[0].guidedAnswers as Record<string, string> | null,
          version: s.drafts[0].version,
          createdAt: s.drafts[0].createdAt.toISOString(),
          updatedAt: s.drafts[0].updatedAt.toISOString(),
        }
      : null,
  }));

  // Ambil poin outline untuk section ini
  const latestOutline = document.outlines[0];
  let outlinePoints: string[] = [];
  if (latestOutline) {
    const generatedOutline = latestOutline.generatedOutline as unknown as GeneratedOutline;
    const matchedSection = generatedOutline.sections.find(
      (s) => s.key === currentSection.sectionKey
    );
    outlinePoints = matchedSection?.points ?? [];
  }

  // Cari next & prev section
  const currentIdx = document.sections.findIndex((s) => s.id === sectionId);
  const prevSection = currentIdx > 0 ? document.sections[currentIdx - 1] : null;
  const nextSection = currentIdx < document.sections.length - 1 ? document.sections[currentIdx + 1] : null;

  const currentDraft = currentSection.drafts[0];

  return (
    <div className="space-y-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-5">
        <Link href="/dashboard" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/documents" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
          Dokumen
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link
          href={`/documents/${id}/outline`}
          className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors truncate max-w-[120px]"
        >
          {document.title}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-white font-medium truncate max-w-[140px]">
          {currentSection.title.split("—")[0].trim()}
        </span>
      </div>

      {/* Writing Editor (Client Component) */}
      <WritingEditor
        documentId={id}
        documentTitle={document.title}
        documentTopic={document.topic}
        sections={sectionsWithDraft}
        currentSection={{
          id: currentSection.id,
          sectionKey: currentSection.sectionKey,
          title: currentSection.title,
          status: currentSection.status as "EMPTY" | "DRAFT" | "DONE",
        }}
        outlinePoints={outlinePoints}
        initialContent={currentDraft?.content ?? ""}
        prevSectionId={prevSection?.id ?? null}
        nextSectionId={nextSection?.id ?? null}
      />
    </div>
  );
}
