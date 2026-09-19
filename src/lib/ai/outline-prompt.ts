import { DocumentType } from "@prisma/client";

// ─── Template Metadata ────────────────────────────────────────────────────────

export const TEMPLATE_SECTIONS = {
  PROPOSAL: [
    { key: "JUDUL_PENELITIAN", title: "Judul Penelitian", order: 1 },
    { key: "LATAR_BELAKANG", title: "Latar Belakang", order: 2 },
    { key: "IDENTIFIKASI_MASALAH", title: "Identifikasi Masalah", order: 3 },
    { key: "PEMBATASAN_MASALAH", title: "Pembatasan Masalah", order: 4 },
    { key: "RUMUSAN_MASALAH", title: "Rumusan Masalah", order: 5 },
    { key: "TUJUAN_PENELITIAN", title: "Tujuan Penelitian", order: 6 },
    { key: "MANFAAT_PENELITIAN", title: "Manfaat Penelitian", order: 7 },
    { key: "SPESIFIKASI_PRODUK", title: "Spesifikasi Hasil Produk yang Dikembangkan", order: 8 },
    { key: "DESKRIPSI_TEORITIK", title: "Deskripsi Teoritik", order: 9 },
    { key: "KAJIAN_RELEVAN", title: "Kajian yang Relevan", order: 10 },
    { key: "KERANGKA_BERPIKIR", title: "Kerangka Berpikir", order: 11 },
    { key: "METODE_PENGEMBANGAN", title: "Metode Pengembangan Sistem", order: 12 },
    { key: "JADWAL_PENELITIAN", title: "Jadwal Kegiatan Penelitian", order: 13 },
    { key: "DAFTAR_PUSTAKA", title: "Daftar Pustaka", order: 14 },
  ],
  SKRIPSI: [
    { key: "BAB_I", title: "BAB I — Pendahuluan", order: 1 },
    { key: "BAB_II", title: "BAB II — Tinjauan Pustaka", order: 2 },
    { key: "BAB_III", title: "BAB III — Metodologi Penelitian", order: 3 },
    { key: "BAB_IV", title: "BAB IV — Hasil dan Pembahasan", order: 4 },
    { key: "BAB_V", title: "BAB V — Kesimpulan dan Saran", order: 5 },
  ],
  JURNAL: [
    { key: "INTRODUCTION", title: "Introduction", order: 1 },
    { key: "METHODS", title: "Methods", order: 2 },
    { key: "RESULTS", title: "Results", order: 3 },
    { key: "DISCUSSION", title: "Discussion", order: 4 },
  ],
} as const;

// ─── Outline Prompt Builder ───────────────────────────────────────────────────

/**
 * Membangun prompt untuk outline generator.
 * Output yang diharapkan: JSON dengan array poin per section.
 */
export function buildOutlinePrompt(
  topic: string,
  title: string,
  documentType: DocumentType,
  studyProgram?: string
): string {
  if (documentType === "PROPOSAL") {
    return buildProposalPrompt(topic, title, studyProgram);
  }
  if (documentType === "JURNAL") {
    return buildJurnalPrompt(topic, title);
  }
  return buildSkripsiPrompt(topic, title);
}

function buildProposalPrompt(topic: string, title: string, studyProgram: string = "Teknik Informatika"): string {
  const isTech = /informatika|komputer|sistem|software|web|aplikasi|teknik|algoritma|jaringan/i.test(studyProgram + " " + topic + " " + title);

  return `Kamu adalah dosen pembimbing akademik senior di Universitas STEKOM yang membimbing mahasiswa dalam menyusun Proposal Penelitian Skripsi (${studyProgram}).

Tugas kamu: Buat kerangka outline lengkap, terstruktur, dan presisi untuk ke-14 bagian proposal penelitian sesuai format resmi Universitas STEKOM berdasarkan topik dan judul di bawah ini.

Judul Penelitian: "${title}"
Topik & Objek Studi: ${topic}
Program Studi: ${studyProgram}

Pedoman Penyusunan Outline Berdasarkan Bagian:
1. JUDUL_PENELITIAN: 1 poin judul final yang jelas dan terarah.
2. LATAR_BELAKANG: 5-7 poin logis yang mengalir (urgensi masalah, kondisi lapangan nyata pada objek riset, data kunjungan/transaksi faktual, dampak keterlambatan solusi, solusi teknologi/metode yang diusulkan).
3. IDENTIFIKASI_MASALAH: 4-6 poin masalah nyata konkret di lapangan yang dihadapi objek studi.
4. PEMBATASAN_MASALAH: 3-5 poin batasan ruang lingkup sistem, batasan fitur, dan batasan teknologi yang digunakan.
5. RUMUSAN_MASALAH: 3-4 pertanyaan penelitian operasional yang diawali dengan kata tanya bagaimana.
6. TUJUAN_PENELITIAN: 3-4 tujuan konkret yang menjawab langsung setiap rumusan masalah.
7. MANFAAT_PENELITIAN: 2 sub-poin utama: Manfaat Teoritis (keilmuan) dan Manfaat Praktis (bagi pengguna & objek studi).
8. SPESIFIKASI_PRODUK: ${
    isTech
      ? "Rincian spesifikasi produk R&D: 1. Identitas Produk (teknologi/framework), 2. Tujuan Pengembangan, 3. Pengguna Sistem (Admin & Pelanggan/User), 4. Fitur Fungsional (Fitur Admin & Fitur Pelanggan), 5. Alur Proses, 6. Spesifikasi Data, 7. Antarmuka, 8. Keamanan, 9. Output Sistem."
      : "Rincian spesifikasi sistem / model penelitian: Identitas model, tujuan, pengguna, indikator variabel, spesifikasi operasional, dan hasil akhir sistem."
  }
9. DESKRIPSI_TEORITIK: 4-6 poin konsep teori, algoritma, framework, dan teori bidang keilmuan yang secara langsung mendasari penelitian ini.
10. KAJIAN_RELEVAN: 4-5 poin penelitian terdahulu yang relevan beserta identifikasi gap penelitian (perbedaan dan kebaruan penelitian ini).
11. KERANGKA_BERPIKIR: Poin-poin alur kerangka berpikir dari kondisi awal masalah, tindakan pengembangan, hingga kondisi akhir yang diharapkan.
12. METODE_PENGEMBANGAN: ${
    isTech
      ? "Tahapan metode rekayasa perangkat lunak (SDLC Waterfall/Agile: Analisis kebutuhan, Desain UML, Implementasi coding, dan Pengujian Black Box)."
      : "Tahapan metode penelitian (Desain riset, populasi/sampel, instrumen, teknik pengumpulan data, dan teknik analisis)."
  }
13. JADWAL_PENELITIAN: 4-6 tahapan kegiatan penelitian terjadwal dari pra-riset hingga laporan akhir.
14. DAFTAR_PUSTAKA: Panduan penulisan referensi standar APA 7th Edition dari jurnal bereputasi 5 tahun terakhir.

PENTING:
- Outline HANYA berupa daftar poin-poin kerangka terstruktur, bukan paragraf tulisan penuh.
- Gunakan Bahasa Indonesia akademik yang baku, kontekstual, dan tidak klise.
- Setiap poin harus spesifik sesuai objek penelitian "${title}".

Format output HARUS berupa JSON valid persis seperti berikut tanpa teks tambahan di luar JSON:
{
  "sections": [
    {
      "key": "JUDUL_PENELITIAN",
      "title": "Judul Penelitian",
      "points": ["..."]
    },
    {
      "key": "LATAR_BELAKANG",
      "title": "Latar Belakang",
      "points": ["..."]
    },
    {
      "key": "IDENTIFIKASI_MASALAH",
      "title": "Identifikasi Masalah",
      "points": ["..."]
    },
    {
      "key": "PEMBATASAN_MASALAH",
      "title": "Pembatasan Masalah",
      "points": ["..."]
    },
    {
      "key": "RUMUSAN_MASALAH",
      "title": "Rumusan Masalah",
      "points": ["..."]
    },
    {
      "key": "TUJUAN_PENELITIAN",
      "title": "Tujuan Penelitian",
      "points": ["..."]
    },
    {
      "key": "MANFAAT_PENELITIAN",
      "title": "Manfaat Penelitian",
      "points": ["..."]
    },
    {
      "key": "SPESIFIKASI_PRODUK",
      "title": "Spesifikasi Hasil Produk yang Dikembangkan",
      "points": ["..."]
    },
    {
      "key": "DESKRIPSI_TEORITIK",
      "title": "Deskripsi Teoritik",
      "points": ["..."]
    },
    {
      "key": "KAJIAN_RELEVAN",
      "title": "Kajian yang Relevan",
      "points": ["..."]
    },
    {
      "key": "KERANGKA_BERPIKIR",
      "title": "Kerangka Berpikir",
      "points": ["..."]
    },
    {
      "key": "METODE_PENGEMBANGAN",
      "title": "Metode Pengembangan Sistem",
      "points": ["..."]
    },
    {
      "key": "JADWAL_PENELITIAN",
      "title": "Jadwal Kegiatan Penelitian",
      "points": ["..."]
    },
    {
      "key": "DAFTAR_PUSTAKA",
      "title": "Daftar Pustaka",
      "points": ["..."]
    }
  ]
}`;
}

function buildJurnalPrompt(topic: string, title: string): string {
  return `Kamu adalah asisten akademik yang membantu peneliti menyusun kerangka (outline) jurnal ilmiah.

Tugas kamu: Buat outline untuk jurnal ilmiah dengan format IMRaD berdasarkan topik di bawah.

PENTING:
- Outline berisi POIN-POIN KERANGKA, bukan isi lengkap atau paragraf
- Setiap poin adalah sub-topik atau aspek yang perlu dibahas di bagian tersebut
- Berikan 5-8 poin per bagian
- Gunakan Bahasa Indonesia yang akademik
- Jangan menulis isi/konten, hanya judul/sub-topik kerangka

Judul: ${title}
Topik: ${topic}

Format output HARUS berupa JSON valid seperti berikut (jangan tambahkan teks lain di luar JSON):
{
  "sections": [
    {
      "key": "INTRODUCTION",
      "title": "Introduction",
      "points": [
        "Latar belakang masalah dan konteks penelitian",
        "..."
      ]
    },
    {
      "key": "METHODS",
      "title": "Methods",
      "points": ["..."]
    },
    {
      "key": "RESULTS",
      "title": "Results",
      "points": ["..."]
    },
    {
      "key": "DISCUSSION",
      "title": "Discussion",
      "points": ["..."]
    }
  ]
}`;
}

function buildSkripsiPrompt(topic: string, title: string): string {
  return `Kamu adalah asisten akademik yang membantu mahasiswa menyusun kerangka (outline) skripsi.

Tugas kamu: Buat outline untuk skripsi dengan format BAB I sampai BAB V berdasarkan topik di bawah.

PENTING:
- Outline berisi POIN-POIN KERANGKA, bukan isi lengkap atau paragraf
- Setiap poin adalah sub-topik atau aspek yang perlu dibahas di bab tersebut
- Berikan 5-8 poin per bab
- Gunakan Bahasa Indonesia yang akademik
- Jangan menulis isi/konten, hanya judul/sub-topik kerangka
- Sesuaikan poin dengan topik penelitian yang diberikan

Judul: ${title}
Topik: ${topic}

Format output HARUS berupa JSON valid seperti berikut (jangan tambahkan teks lain di luar JSON):
{
  "sections": [
    {
      "key": "BAB_I",
      "title": "BAB I — Pendahuluan",
      "points": [
        "Latar belakang masalah",
        "Identifikasi masalah",
        "Rumusan masalah",
        "Tujuan penelitian",
        "Manfaat penelitian",
        "Batasan penelitian"
      ]
    },
    {
      "key": "BAB_II",
      "title": "BAB II — Tinjauan Pustaka",
      "points": ["..."]
    },
    {
      "key": "BAB_III",
      "title": "BAB III — Metodologi Penelitian",
      "points": ["..."]
    },
    {
      "key": "BAB_IV",
      "title": "BAB IV — Hasil dan Pembahasan",
      "points": ["..."]
    },
    {
      "key": "BAB_V",
      "title": "BAB V — Kesimpulan dan Saran",
      "points": ["..."]
    }
  ]
}`;
}
