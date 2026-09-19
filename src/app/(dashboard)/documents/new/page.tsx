"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, BookOpen, Sparkles, ArrowRight, ArrowLeft, Check, FileText, Quote, Building2, User, Hash } from "lucide-react";

const DOC_TYPES = [
  {
    value: "PROPOSAL",
    label: "Proposal Penelitian",
    desc: "Format resmi proposal skripsi/tugas akhir terstruktur 14 bagian: Latar Belakang, Identifikasi, Spesifikasi Produk R&D, Kajian Relevan, hingga Jadwal & Daftar Pustaka.",
    icon: BookOpen,
    tag: "Format Resmi Kampus",
  },
  {
    value: "SKRIPSI",
    label: "Skripsi Lengkap (BAB I - V)",
    desc: "BAB I s/d BAB V: Pendahuluan, Tinjauan Pustaka, Metodologi Penelitian, Hasil & Pembahasan, serta Kesimpulan & Saran.",
    icon: GraduationCap,
    tag: "BAB I - BAB V",
  },
];

const UNIVERSITY_TEMPLATES = [
  {
    key: "STEKOM",
    name: "Universitas STEKOM (Sains & Teknologi Komputer)",
    faculty: "Program Studi S1 (Teknik Informatika, Sistem Informasi, Bisnis, Desain)",
    desc: "Standar resmi: Margin 4-3-3-3 cm, Font Times New Roman 12pt, Cover Resmi STEKOM, Sistematika 14 Bagian Tanpa BAB Kaku, dan Tabel Kajian Relevan.",
    recommended: true,
  },
];

const STUDY_PROGRAMS = [
  "Teknik Informatika",
  "Sistem Informasi",
  "Sistem Komputer",
  "Bisnis Digital",
  "Manajemen",
  "Desain Komunikasi Visual",
  "Komputerisasi Akuntansi",
];

const CITATION_STYLES = [
  {
    value: "APA",
    label: "APA (7th Edition)",
    system: "Sistem Nama-Tahun",
    example: "(Sugiyono, 2021) / (Pressman & Maxim, 2020)",
    desc: "Format standar akademik paling umum untuk rumpun teknologi informasi, bisnis, manajemen, dan sosial.",
  },
  {
    value: "IEEE",
    label: "IEEE Style",
    system: "Sistem Numerik Kurung Siku",
    example: "[1] / [1, 2]",
    desc: "Format standar untuk publikasi teknik, ilmu komputer murni, dan rekayasa elektronika.",
  },
  {
    value: "VANCOUVER",
    label: "Vancouver Style",
    system: "Sistem Numerik Berurutan",
    example: "(1) / 1",
    desc: "Format referensi numerik berbasis urutan kemunculan untuk bidang biomedis dan kesehatan.",
  },
];

export default function NewDocumentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [docType, setDocType] = useState("PROPOSAL");
  const [templateKey, setTemplateKey] = useState("STEKOM");
  const [citation, setCitation] = useState("APA");

  // Form Fields
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [studentNim, setStudentNim] = useState("");
  const [studyProgram, setStudyProgram] = useState("Teknik Informatika");

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
          templateKey,
          citationStyle: citation,
          authorName: authorName.trim() || undefined,
          studentNim: studentNim.trim() || undefined,
          studyProgram: studyProgram || "Teknik Informatika",
          institution: "Universitas STEKOM",
          academicYear: new Date().getFullYear().toString(),
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
          Pilih template standar kampus dan masukkan ide penelitian. YuuTA akan menyiapkan struktur outline & format dokumen Word resmi secara otomatis.
        </p>
      </div>

      {/* Steps Bar */}
      <div className="yuuta-card p-4 bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 flex items-center justify-between sm:justify-start gap-4 sm:gap-8">
        {[
          { num: 1, title: "Template & Kampus" },
          { num: 2, title: "Gaya Sitasi" },
          { num: 3, title: "Detail Riset & Cover" },
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
        {/* Step 1: Document Type & University Template */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Pilih Format Penulisan</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pilih format sesuai tujuan tugas akhir atau proposal Anda.
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

            {/* Template Universitas Selector (Hanya muncul jika PROPOSAL dipilih) */}
            {docType === "PROPOSAL" && (
              <div className="pt-2 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Pilih Template Pedoman Kampus
                  </h3>
                </div>

                <div className="space-y-3">
                  {UNIVERSITY_TEMPLATES.map((tpl) => {
                    const isSelected = templateKey === tpl.key;

                    return (
                      <div
                        key={tpl.key}
                        onClick={() => setTemplateKey(tpl.key)}
                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-sky-50/80 dark:bg-sky-950/40 border-sky-500 dark:border-sky-400 shadow-sm"
                            : "bg-slate-50/40 dark:bg-slate-800/20 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                                {tpl.name}
                              </h4>
                              {tpl.recommended && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  Template Aktif
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-medium text-sky-700 dark:text-sky-400 mt-0.5">
                              {tpl.faculty}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                              {tpl.desc}
                            </p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? "border-sky-600 bg-sky-600 text-white" : "border-slate-300 dark:border-slate-600"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
                Format sitasi akan digunakan oleh AI untuk menyusun daftar pustaka dan sitasi dalam teks secara konsisten.
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
                    className={`w-full p-4 rounded-2xl text-left border-2 transition-all flex items-start justify-between gap-4 cursor-pointer ${
                      isSelected
                        ? "bg-sky-50/80 dark:bg-sky-950/50 border-sky-500 dark:border-sky-400 shadow-md shadow-sky-500/10"
                        : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700/80 hover:border-sky-300 dark:hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "bg-sky-600 text-white shadow-xs shadow-sky-600/30"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        <Quote className="w-5 h-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                            {cs.label}
                          </h3>
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                              isSelected
                                ? "bg-sky-100 dark:bg-sky-900/70 text-sky-800 dark:text-sky-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {cs.system}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          {cs.desc}
                        </p>

                        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          <span className="font-sans font-medium text-slate-500 dark:text-slate-400">Contoh format:</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                            {cs.example}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                        isSelected
                          ? "border-sky-600 bg-sky-600 text-white"
                          : "border-slate-300 dark:border-slate-600 bg-transparent"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
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

        {/* Step 3: Title, Topic & Cover Details */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Detail Penelitian & Halaman Sampul</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Masukkan judul dan deskripsi riset, serta data mahasiswa untuk dicetak langsung pada cover Word (.docx).
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
                  Judul Rencana Dokumen <span className="text-rose-500">*</span>
                </label>
                <input
                  id="doc-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pengembangan Sistem Reservasi dan Antrian Barbershop Berbasis Web Menggunakan Laravel"
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Deskripsi Singkat / Masalah & Objek Riset <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="doc-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  rows={3}
                  placeholder="Jelaskan objek studi kasus (misal: Barbershop Rapioo Semarang), kendala antrian manual, serta metode atau algoritma yang diusulkan (misal: Algoritma FCFS dan framework Laravel)."
                  className="w-full px-4 py-2.5 rounded-xl text-sm bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 transition-all resize-y"
                />
              </div>

              {/* Data Identitas Mahasiswa untuk Cover Word */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/70 space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-200/80 dark:border-slate-700/60">
                  <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Data Identitas Mahasiswa (Halaman Sampul Resmi)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Nama Mahasiswa
                    </label>
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Contoh: DWI PURNOMO"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      <span>NIM</span>
                    </label>
                    <input
                      type="text"
                      value={studentNim}
                      onChange={(e) => setStudentNim(e.target.value)}
                      placeholder="Contoh: 1122100154"
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Program Studi
                    </label>
                    <select
                      value={studyProgram}
                      onChange={(e) => setStudyProgram(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/40 cursor-pointer"
                    >
                      {STUDY_PROGRAMS.map((sp) => (
                        <option key={sp} value={sp}>
                          {sp}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary Pill */}
              <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-slate-800/40 border border-sky-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex flex-wrap items-center gap-2 text-slate-600 dark:text-slate-400">
                  <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Format: <strong className="text-slate-900 dark:text-white">{docType === "PROPOSAL" ? "Proposal Penelitian (STEKOM)" : "Skripsi (BAB I-V)"}</strong></span>
                  <span>•</span>
                  <span>Prodi: <strong className="text-slate-900 dark:text-white">{studyProgram}</strong></span>
                  <span>•</span>
                  <span>Sitasi: <strong className="text-slate-900 dark:text-white">{citation}</strong></span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sky-600 dark:text-sky-400 hover:underline font-semibold text-xs"
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
