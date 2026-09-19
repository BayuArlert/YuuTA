/**
 * Prompt builder untuk fitur Penulisan Bagian Dokumen / Bab:
 * 1. buildGuidedQuestionsPrompt — generate pertanyaan pemandu per bagian
 * 2. buildAiFeedbackPrompt — analisis & feedback draf dari AI
 * 3. buildDraftGeneratorPrompt — generate draf lengkap berkualitas tinggi, humanize & anti-AI-cliché
 */

const SECTION_CONTEXT: Record<string, string> = {
  // Proposal Penelitian (Sistematika STEKOM & Umum)
  JUDUL_PENELITIAN: "Judul Penelitian (Penyusunan judul yang representatif, fokus, dan mencerminkan variabel/metode penelitian)",
  LATAR_BELAKANG: "Latar Belakang (Fenomena riil lapangan, urgensi masalah, data awal kunjungan/transaksi faktual pada objek studi, dampak keterlambatan solusi, dan solusi teknologi/metode yang diajukan)",
  IDENTIFIKASI_MASALAH: "Identifikasi Masalah (Poin-poin spesifik kendala dan kelemahan faktual yang dihadapi di lapangan)",
  PEMBATASAN_MASALAH: "Pembatasan Masalah (Ruang lingkup sistem, teknologi, batasan fitur, dan batasan objek penelitian agar fokus)",
  RUMUSAN_MASALAH: "Rumusan Masalah (Pertanyaan-pertanyaan penelitian sistematis, operasional, dan terukur yang diawali kata tanya bagaimana)",
  TUJUAN_PENELITIAN: "Tujuan Penelitian (Tujuan pengembangan sistem/penelitian yang menjawab langsung setiap rumusan masalah)",
  MANFAAT_PENELITIAN: "Manfaat Penelitian (Manfaat Teoritis bagi pengembangan keilmuan dan Manfaat Praktis bagi objek studi/UMKM/pengguna)",
  SPESIFIKASI_PRODUK: "Spesifikasi Hasil Produk yang Dikembangkan (Identitas produk, tujuan pengembangan, pengguna sistem, fitur admin, fitur pelanggan, alur proses, data, antarmuka, keamanan, dan output)",
  DESKRIPSI_TEORITIK: "Deskripsi Teoritik (Kajian landasan teori komprehensif mengenai konsep sistem, algoritma, framework, dan teknologi yang relevan)",
  KAJIAN_RELEVAN: "Kajian yang Relevan (Matriks komparasi penelitian terdahulu yang relevan dalam bentuk tabel lengkap beserta research gap / novelty)",
  KERANGKA_BERPIKIR: "Kerangka Berpikir (Bagan alur logika pemecahan masalah dari kondisi awal, tindakan pengembangan sistem, hingga kondisi akhir yang diharapkan beserta deskripsi narasinya)",
  METODE_PENGEMBANGAN: "Metode Pengembangan Sistem (Pendekatan rekayasa perangkat lunak SDLC Waterfall/Agile: analisis kebutuhan, perancangan sistem visual UML, implementasi, dan pengujian Black Box)",
  JADWAL_PENELITIAN: "Jadwal Kegiatan Penelitian (Tabel matriks alokasi waktu dan tahapan penelitian dari persiapan, pengumpulan data, implementasi, hingga penulisan laporan)",
  DAFTAR_PUSTAKA: "Daftar Pustaka (Daftar referensi ilmiah mutakhir 5 tahun terakhir berstandar APA 7th Edition dari jurnal bereputasi)",

  // Skripsi
  BAB_I: "BAB I Pendahuluan (Latar Belakang, Rumusan Masalah, Tujuan, Manfaat, Batasan Penelitian)",
  BAB_II: "BAB II Tinjauan Pustaka (Kajian Teori, Penelitian Terdahulu, Kerangka Pikir, Hipotesis)",
  BAB_III: "BAB III Metodologi Penelitian (Jenis Penelitian, Populasi & Sampel, Instrumen, Teknik Analisis)",
  BAB_IV: "BAB IV Hasil dan Pembahasan (Deskripsi Data, Analisis, Interpretasi, Diskusi Temuan)",
  BAB_V: "BAB V Kesimpulan dan Saran (Simpulan sesuai rumusan masalah, Saran praktis dan akademik)",

  // Jurnal
  INTRODUCTION: "Introduction (Background, Research Gap, Objective, Significance)",
  METHODS: "Methods (Research Design, Participants, Instruments, Data Collection, Analysis Technique)",
  RESULTS: "Results (Descriptive Statistics, Main Findings, Tables/Figures)",
  DISCUSSION: "Discussion (Interpretation, Comparison with Prior Studies, Limitations, Implications)",
};

// ─── Guided Questions Prompt ──────────────────────────────────────────────────

export function buildGuidedQuestionsPrompt(
  sectionKey: string,
  documentTitle: string,
  topic: string,
  outlinePoints: string[]
): string {
  const sectionContext = SECTION_CONTEXT[sectionKey] ?? sectionKey;
  const pointsList = outlinePoints.map((p, i) => `${i + 1}. ${p}`).join("\n");

  return `Kamu adalah dosen pembimbing akademik senior yang membantu mahasiswa menyusun bagian: ${sectionContext}.

Judul penelitian: "${documentTitle}"
Topik & Objek Studi: ${topic}

Poin-poin outline yang sudah dibuat untuk bagian ini:
${pointsList}

Tugas kamu: Buat TEPAT 5 pertanyaan pemandu spesifik, berbobot, dan aplikatif yang memandu mahasiswa menulis draf berkualitas untuk bagian ini.

Kriteria pertanyaan:
- Sangat spesifik dan terikat langsung dengan objek penelitian dan teknologi/metode pada judul di atas.
- Mendorong mahasiswa menjabarkan fakta lapangan, logika proses, atau dasar teori secara konkret (bukan pertanyaan hafalan teoritis umum).
- Bersifat terstruktur dan berurutan secara logis.
- Menggunakan Bahasa Indonesia akademik yang santun dan jelas.

Format output HARUS berupa JSON valid persis seperti berikut (jangan tambahkan teks lain di luar JSON):
{
  "questions": [
    "Pertanyaan pemandu 1?",
    "Pertanyaan pemandu 2?",
    "Pertanyaan pemandu 3?",
    "Pertanyaan pemandu 4?",
    "Pertanyaan pemandu 5?"
  ]
}`;
}

// ─── AI Feedback Prompt ───────────────────────────────────────────────────────

export function buildAiFeedbackPrompt(
  sectionKey: string,
  draftContent: string,
  documentTitle: string,
  topic: string,
  outlinePoints: string[]
): string {
  const sectionContext = SECTION_CONTEXT[sectionKey] ?? sectionKey;
  const pointsList = outlinePoints.map((p, i) => `${i + 1}. ${p}`).join("\n");
  const wordCount = draftContent.trim().split(/\s+/).length;

  return `Kamu adalah reviewer akademik ahli yang memberikan umpan balik konstruktif untuk bagian: ${sectionContext}.

Judul penelitian: "${documentTitle}"
Topik: ${topic}

Poin-poin outline yang harus dicakup di bagian ini:
${pointsList}

Draf yang ditulis mahasiswa (${wordCount} kata):
---
${draftContent.substring(0, 3500)}${draftContent.length > 3500 ? "\n[... terpotong untuk efisiensi ...]" : ""}
---

Tugas kamu: Analisis draf di atas secara tajam terhadap:
1. Kelengkapan poin outline.
2. Kedalaman pembahasan dan kejelasan kontekstual dengan objek studi.
3. Struktur bahasa akademik (humanize, kohesi kalimat, ketiadaan repetisi).

Format output HARUS berupa JSON valid (jangan tambahkan teks lain di luar JSON):
{
  "score": 80,
  "summary": "Kalimat evaluasi ringkas 1-2 baris tentang kualitas draf.",
  "strengths": [
    "Kelebihan spesifik 1",
    "Kelebihan spesifik 2"
  ],
  "improvements": [
    "Saran perbaikan konkret 1",
    "Saran perbaikan konkret 2",
    "Saran perbaikan konkret 3"
  ],
  "missingPoints": [
    "Poin outline yang belum dibahas atau kurang mendalam"
  ],
  "consistency": "Komentar tentang konsistensi draf dengan judul dan topik penelitian."
}`;
}

// ─── Draft Generator Prompt (Humanized & Grounded) ─────────────────────────────

export function buildDraftGeneratorPrompt(
  sectionKey: string,
  sectionTitle: string,
  documentTitle: string,
  topic: string,
  outlinePoints: string[],
  citationStyle: string = "APA"
): string {
  const sectionContext = SECTION_CONTEXT[sectionKey] ?? `${sectionTitle} (${sectionKey})`;
  const pointsList = outlinePoints.map((p, i) => `${i + 1}. ${p}`).join("\n");

  return `Kamu adalah akademisi dan peneliti ahli tingkat master/doktor yang memiliki gaya penulisan ilmiah sangat natural, berbobot, dan mengalir layaknya ditulis oleh akademisi manusia berpengalaman.

Tugasmu: Tulis draf lengkap, mendalam, dan komprehensif untuk bagian:
>>> ${sectionContext} <<<

Informasi Penelitian:
- Judul: "${documentTitle}"
- Topik / Objek Riset: ${topic}
- Gaya Sitasi: ${citationStyle} (gunakan format sitasi natural, contoh: (Sugiyono, 2021) atau menurut Pressman & Maxim (2020))
- Bagian: ${sectionTitle}

Poin-Poin Outline yang HARUS Dikembangkan:
${pointsList}

=======================================================
PANDUAN PENULISAN HUMANISASI AKADEMIK (SANGAT PENTING):
=======================================================
1. POLA RITME KALIMAT (BURSTINESS ALAMI):
   - Jangan membuat panjang kalimat yang monoton. Padukan kalimat pendek yang lugas dengan kalimat majemuk bertingkat yang analitis.
   - Hindari gaya penerjemah mesin yang kaku. Bangun transisi paragraf yang kohesif (contoh: "Kondisi faktual tersebut menunjukkan...", "Implikasi langsung yang timbul adalah...", "Dari sudut pandang operasional...", "Persoalan ini berakar pada...").

2. ANTI-AI CLICHES (DILARANG KERAS MENGGUNAKAN FRASA INI):
   - JANGAN PERNAH gunakan kalimat klise AI seperti:
     x "Di era globalisasi/digital yang berkembang pesat ini..."
     x "Dalam dunia yang serba cepat ini..."
     x "Penting untuk dicatat bahwa..."
     x "Menyelami lebih dalam ke dalam..."
     x Pengulangan kata "Selain itu" di setiap awal paragraf.
   - Mulailah paragraf langsung pada substansi permasalahan atau fakta empiris di lapangan!

3. DETAIL KONTEKSTUAL & EMPIRIS NYATA:
   - Hubungkan setiap uraian dengan objek studi nyata "${documentTitle}".
   - Jika membahas latar belakang/masalah: sebutkan kendala nyata (antrian manual, risiko kehilangan nota/data, ketidakpastian waktu tunggu, keterbatasan evaluasi, dsb.).
   - Jika bagian adalah "SPESIFIKASI_PRODUK": bagi dengan jelas menjadi sub-bagian: 1. Identitas Produk, 2. Tujuan Pengembangan, 3. Pengguna Sistem, 4. Spesifikasi Fungsional (4.1 Fitur Admin, 4.2 Fitur Pelanggan/Pengguna), 5. Spesifikasi Proses, 6. Spesifikasi Data, 7. Antarmuka, 8. Keamanan, 9. Output Sistem.
   - Jika bagian adalah "KAJIAN_RELEVAN": Buat tabel komparasi penelitian terdahulu menggunakan format tabel Markdown:
     | No | Nama Peneliti & Tahun | Judul Penelitian | Metode Penelitian | Hasil Penelitian | Gap / Perbedaan Penelitian |
     Lengkapi dengan 3-5 baris studi terdahulu yang relevan dan jelaskan research gap-nya.
   - Jika bagian adalah "JADWAL_PENELITIAN": Buat tabel jadwal pelaksanaan menggunakan tabel Markdown:
     | No | Tahapan Kegiatan Penelitian | Waktu Pelaksanaan | Keterangan |

4. FORMAT OUTPUT:
   - Format penulisan menggunakan HTML bersih dan terstruktur langsung:
     * <h3>Nama Sub-Poin</h3> untuk judul sub-bagian atau poin spesifikasi
     * <p>...</p> untuk setiap paragraf analisis
     * <em>kata asing</em> untuk istilah teknis bahasa Inggris/asing (misal: <em>framework</em>, <em>waterfall</em>, <em>real time</em>) agar tercetak miring
     * <strong>...</strong> untuk penegasan konsep kunci
     * Tabel Markdown (| ... |) untuk data tabel jika bagian memerlukan matriks/tabel
   - HANYA keluarkan konten draf tanpa teks pembuka/penutup seperti "Tentu, ini drafnya...".`;
}
