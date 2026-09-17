import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { FileText, CheckCircle2, Clock, Plus, GraduationCap, ArrowRight, Sparkles, BookOpen } from "lucide-react";

export const metadata: Metadata = { title: "Dashboard — YuuTA" };

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id as string;

  const [totalDocs, recentDocs] = await Promise.all([
    prisma.document.count({ where: { userId } }),
    prisma.document.findMany({
      where: { userId },
      include: {
        sections: true,
        outlines: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
    }),
  ]);

  const doneCount = recentDocs.flatMap((d) => d.sections).filter((s) => s.status === "DONE").length;
  const inProgressCount = totalDocs - doneCount > 0 ? totalDocs - doneCount : 0;
  const firstName = session?.user?.name?.split(" ")[0] || "Peneliti";

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden yuuta-card p-6 sm:p-8 bg-gradient-to-r from-sky-500/10 via-cyan-500/5 to-transparent dark:from-sky-950/40 dark:via-slate-900/40 dark:to-slate-900/20 border border-sky-200/80 dark:border-slate-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 mb-3 border border-sky-200 dark:border-sky-800">
              <Sparkles className="w-3 h-3 text-sky-600 dark:text-sky-400" />
              <span>Ruang Kerja Akademik</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Selamat datang kembali, <span className="gradient-text-sky">{firstName}</span> 👋
            </h1>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Susun dan sempurnakan dokumen skripsi atau jurnal ilmiah Anda dengan bimbingan terstruktur langkah demi langkah.
            </p>
          </div>

          <Link
            href="/documents/new"
            id="dashboard-banner-new-doc"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm btn-primary-sky shrink-0 cursor-pointer shadow-lg shadow-sky-500/25"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Dokumen Baru</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <div className="yuuta-card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Dokumen
            </span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-100 dark:border-sky-900/50">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
            {totalDocs}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jurnal & Skripsi yang sedang dikelola
          </p>
        </div>

        <div className="yuuta-card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Bagian Selesai
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
            {doneCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bab yang telah selesai ditulis
          </p>
        </div>

        <div className="yuuta-card p-5 sm:p-6 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Sedang Berjalan
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-100 dark:border-cyan-900/50">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400 mb-1">
            {inProgressCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tahap draf & pengembangan outline
          </p>
        </div>
      </div>

      {/* Recent Documents Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Dokumen Terbaru</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Lanjutkan pengerjaan dokumen yang terakhir diakses</p>
          </div>
          <Link
            href="/documents/new"
            id="dashboard-new-doc"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors"
          >
            <span>+ Tambah Dokumen</span>
          </Link>
        </div>

        {recentDocs.length === 0 ? (
          <div className="yuuta-card p-10 sm:p-14 text-center bg-white dark:bg-slate-900 border border-dashed border-sky-200 dark:border-slate-800">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-900 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <BookOpen className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Belum ada dokumen yang dibuat
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              Mulai penelitian Anda sekarang. Pilih antara format Skripsi lengkap (BAB I-V) atau Jurnal Ilmiah (IMRaD).
            </p>
            <Link
              href="/documents/new"
              id="dashboard-first-doc"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm btn-primary-sky shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Dokumen Pertama</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentDocs.map((doc) => {
              const done = doc.sections.filter((s) => s.status === "DONE").length;
              const total = doc.sections.length;
              const pct = total > 0 ? Math.round((done / total) * 100) : 0;
              const hasOutline = doc.outlines.length > 0;
              const isSkripsi = doc.documentType === "SKRIPSI";

              return (
                <Link
                  key={doc.id}
                  href={hasOutline ? `/documents/${doc.id}/outline` : `/documents/${doc.id}`}
                  className="yuuta-card p-5 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 hover:border-sky-300 dark:hover:border-sky-700/60 hover:-translate-y-0.5 transition-all group flex flex-col justify-between"
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
                        {isSkripsi ? "🎓 SKRIPSI (BAB I-V)" : "📊 JURNAL (IMRaD)"}
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
                      <span>Progres Bab</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{pct}% ({done}/{total})</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <span className="text-sky-600 dark:text-sky-400 font-medium group-hover:underline flex items-center gap-1">
                        {hasOutline ? "Buka Outline AI" : "Detail Dokumen"}
                        <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(doc.updatedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
