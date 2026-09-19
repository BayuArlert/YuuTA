import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OutlineView from "@/components/document/OutlineView";
import Link from "next/link";
import type { Metadata } from "next";
import { GeneratedOutline } from "@/types";
import { ChevronRight, Sparkles, BookOpen, GraduationCap, ArrowRight, ArrowLeft, Download } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const doc = await prisma.document.findUnique({ where: { id }, select: { title: true } });
  return { title: doc ? `Outline: ${doc.title}` : "Outline Riset — YuuTA" };
}

export default async function OutlinePage({ params }: Props) {
  const session = await auth();
  const { id } = await params;

  const document = await prisma.document.findUnique({
    where: { id, userId: session!.user!.id as string },
    include: {
      sections: { orderBy: { orderIndex: "asc" } },
      outlines: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!document) notFound();

  const latestOutline = document.outlines[0];
  const isSkripsi = document.documentType === "SKRIPSI";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/dashboard" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/documents" className="hover:text-sky-600 dark:hover:text-sky-400 transition-colors">
          Dokumen
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-slate-900 dark:text-white font-medium truncate max-w-xs">
          Outline: {document.title}
        </span>
      </div>

      {/* Header Card */}
      <div className="yuuta-card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold tracking-wide ${
              document.documentType === "PROPOSAL"
                ? "bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60"
                : isSkripsi
                ? "bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60"
                : "bg-cyan-100 dark:bg-cyan-950/70 text-cyan-800 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60"
            }`}
          >
            {document.documentType === "PROPOSAL"
              ? "📘 PROPOSAL PENELITIAN (STEKOM)"
              : isSkripsi
              ? "🎓 SKRIPSI (BAB I-V)"
              : "📊 JURNAL ILMIAH"}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono font-medium">
            Pedoman Sitasi: {document.citationStyle}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
          {document.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl">
          {document.topic}
        </p>

        {/* Section Chips */}
        <div className="flex items-center gap-2 mt-5 flex-wrap pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
            Daftar Bab:
          </span>
          {document.sections.map((section) => (
            <div
              key={section.id}
              className={`text-xs px-3 py-1.5 rounded-xl font-medium border transition-colors ${
                section.status === "DONE"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  : section.status === "DRAFT"
                  ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  : "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
              }`}
            >
              {section.title.replace("BAB ", "").split("—")[0].trim()}
              {section.status === "DONE" ? " ✓" : section.status === "DRAFT" ? " ✍" : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Outline View Component */}
      <OutlineView
        documentId={document.id}
        initialOutline={latestOutline ? (latestOutline.generatedOutline as unknown as GeneratedOutline) : null}
        outlineId={latestOutline?.id}
      />

      {/* Next Step Banner */}
      {latestOutline && (
        <div className="yuuta-card p-5 sm:p-6 bg-gradient-to-r from-sky-50 dark:from-sky-950/30 to-white dark:to-slate-900 border border-sky-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Kerangka Outline Siap Digunakan!</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Lanjutkan ke fase penulisan draf terstruktur dengan panduan pertanyaan pemandu AI per bab.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            <a
              href={`/api/documents/${document.id}/export`}
              download
              className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span>Unduh Word (.docx)</span>
            </a>

            <Link
              href={`/documents/${document.id}/write`}
              id="btn-start-writing"
              className="btn-primary-sky px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-md shrink-0"
            >
              <span>Mulai Menulis Bab</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
