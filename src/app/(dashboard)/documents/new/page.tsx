"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen, Sparkles, ArrowRight, ArrowLeft, Check, FileText } from "lucide-react";

const DOC_TYPES = [
  {
    value: "SKRIPSI",
    label: "Skripsi (Standar Indonesia)",
    desc: "BAB I s/d BAB V: Pendahuluan, Tinjauan Pustaka, Metodologi Penelitian, Hasil & Pembahasan, serta Kesimpulan & Saran.",
    icon: GraduationCap,
    tag: "BAB I - BAB V",
  },
  {
    value: "JURNAL",
    label: "Jurnal Ilmiah (IMRaD)",
    desc: "Format internasional: Introduction, Methods, Results, and Discussion. Ideal untuk publikasi konferensi & jurnal.",
    icon: BookOpen,
    tag: "Format IMRaD",
  },
];

const CITATION_STYLES = [
  { value: "APA", label: "APA (7th Edition)", desc: "Umum digunakan pada rumpun ilmu sosial, psikologi, pendidikan, dan humaniora." },
  { value: "IEEE", label: "IEEE Style", desc: "Format standar untuk ilmu komputer, teknik elektro, informatika, dan teknologi." },
  { value: "VANCOUVER", label: "Vancouver (Numeric)", desc: "Format referensi numerik untuk rumpun kedokteran, farmasi, dan kesehatan." },
];

export default function NewDocumentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState("SKRIPSI");
  const [citation, setCitation] = useState("APA");
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCreate() {
    if (!title.trim() || !topic.trim()) {
      setError("Judul dokumen dan topik riset wajib diisi.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          topic: topic.trim(),
          documentType: docType,
          citationStyle: citation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/documents/${data.document.id}/outline`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal membuat dokumen baru");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
          Inisiasi Dokumen Akademik
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Pilih template standar dan masukkan ide penelitian. YuuTA akan menyiapkan struktur outline secara otomatis.
        </p>
      </div>

      {/* Steps Bar */}
      <div className="yuuta-card p-4 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 flex items-center justify-between sm:justify-start gap-4 sm:gap-8">
        {[
          { num: 1, title: "Template" },
          { num: 2, title: "Gaya Sitasi" },
          { num: 3, title: "Detail Riset" },
        ].map((s) => {
          const isDone = step > s.num;
          const isCurrent = step === s.num;

          return (
            <div key={s.num} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-emerald-500 text-white shadow-xs"
                    : isCurrent
                    ? "bg-sky-600 text-white shadow-md shadow-sky-500/25"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                }`}
              >
                {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
              </div>
              <span
                className={`text-xs sm:text-sm font-semibold hidden sm:inline ${
                  isCurrent
                    ? "text-sky-700 dark:text-sky-300"
                    : isDone
                    ? "text-slate-700 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Main Content Card */}
      <div className="yuuta-card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 shadow-xl shadow-sky-900/5">
        {/* Step 1: Document Type */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pilih Format Penulisan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih format sesuai dengan tujuan publikasi atau tugas akhir Anda.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {DOC_TYPES.map((dt) => {
                const Icon = dt.icon;
                const isSelected = docType === dt.value;

                return (
                  <button
                    key={dt.value}
                    type="button"
                    onClick={() => setDocType(dt.value)}
                    className={`p-5 rounded-2xl text-left border-2 transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "bg-sky-50/80 dark:bg-sky-950/50 border-sky-500 dark:border-sky-400 shadow-md shadow-sky-500/10"
                        : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? "bg-sky-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/70 text-sky-800 dark:text-sky-300">
                          {dt.tag}
                        </span>
                      </div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1.5">
                        {dt.label}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {dt.desc}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs font-medium">
                      <span className={isSelected ? "text-sky-600 dark:text-sky-400" : "text-slate-400"}>
                        {isSelected ? "Terpilih" : "Klik untuk memilih"}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary-sky px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Citation Style */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pilih Pedoman Sitasi & Referensi</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Format sitasi akan digunakan oleh AI untuk menyusun rekomendasi referensi akademik.
              </p>
            </div>

            <div className="space-y-3">
              {CITATION_STYLES.map((cs) => {
                const isSelected = citation === cs.value;

                return (
                  <button
                    key={cs.value}
                    type="button"
                    onClick={() => setCitation(cs.value)}
                    className={`w-full p-4 rounded-xl text-left border-2 transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "bg-sky-50/80 dark:bg-sky-950/50 border-sky-500 dark:border-sky-400 shadow-xs"
                        : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                        isSelected
                          ? "bg-sky-600 text-white"
                          : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      }`}>
                        {cs.value}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
                          {cs.label}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {cs.desc}
                        </p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                className="btn-primary-sky px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer shadow-md"
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Title & Topic Details */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detail Topik & Judul Penelitian</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Berikan gambaran topik yang jelas agar AI dapat menyusun outline dan pertanyaan pemandu yang presisi.
              </p>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Judul Rencana Dokumen
                </label>
                <input
                  id="doc-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Analisis Kinerja Algoritma Klasifikasi Machine Learning pada Deteksi Hoaks"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi Singkat / Batasan Masalah
                </label>
                <textarea
                  id="doc-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={4}
                  placeholder="Jelaskan objek riset, metode yang direncanakan, atau masalah utama yang ingin dijawab. Contoh: Penelitian ini membandingkan akurasi antara algoritma Random Forest dan SVM untuk klasifikasi sentimen opini publik di Twitter."
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all resize-y"
                />
              </div>

              {/* Summary Pill */}
              <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-slate-800/40 border border-sky-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Template: <strong className="text-slate-900 dark:text-white">{docType}</strong></span>
                  <span>•</span>
                  <span>Gaya Sitasi: <strong className="text-slate-900 dark:text-white">{citation}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                >
                  Ubah
                </button>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali</span>
              </button>

              <button
                id="btn-create-doc"
                type="button"
                onClick={handleCreate}
                disabled={loading}
                className="btn-primary-sky px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Menyiapkan Dokumen & AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Buat & Generate Outline</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
