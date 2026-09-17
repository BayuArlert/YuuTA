import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { FileText, Plus, BookOpen, GraduationCap, ArrowRight, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Daftar Dokumen — YuuTA" };

export default async function DocumentsPage() {
  const session = await auth();
  const userId = session!.user!.id as string;

  const documents = await prisma.document.findMany({
    where: { userId },
    include: {
      sections: true,
      outlines: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Dokumen Riset Saya
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kelola draf, outline, dan progres penulisan skripsi & artikel ilmiah Anda.
          </p>
        </div>

        <Link
          href="/documents/new"
          className="btn-primary-sky px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer shadow-md self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Dokumen Baru</span>
        </Link>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="yuuta-card p-12 text-center bg-white dark:bg-slate-900 border border-dashed border-sky-200 dark:border-slate-800">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            Belum ada dokumen yang dibuat
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
            Mulai proyek penulisan akademik pertama Anda dengan template Skripsi atau Jurnal Ilmiah.
          </p>
          <Link
            href="/documents/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm btn-primary-sky shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Mulai Dokumen Baru</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {documents.map((doc) => {
            const done = doc.sections.filter((s) => s.status === "DONE").length;
            const total = doc.sections.length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const hasOutline = doc.outlines.length > 0;
            const isSkripsi = doc.documentType === "SKRIPSI";

            return (
              <Link
                key={doc.id}
                href={hasOutline ? `/documents/${doc.id}/outline` : `/documents/${doc.id}`}
                className="yuuta-card p-5 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700/60 hover:-translate-y-1 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-md font-semibold tracking-wide ${
                        isSkripsi
                          ? "bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60"
                          : "bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60"
                      }`}
                    >
                      {isSkripsi ? "🎓 SKRIPSI" : "📊 JURNAL"}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 uppercase">
                      {doc.citationStyle}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors line-clamp-1 mb-1.5">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
                    {doc.topic || "Belum ada deskripsi topik riset."}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <span>Progres Penulisan</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <span className="text-sky-600 dark:text-sky-400 font-medium group-hover:underline flex items-center gap-1">
                      {hasOutline ? "Buka Outline" : "Lihat Dokumen"}
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(doc.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
