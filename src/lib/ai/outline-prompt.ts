import { DocumentType } from "@prisma/client";

// ─── Template Metadata ────────────────────────────────────────────────────────

export const TEMPLATE_SECTIONS = {
  JURNAL: [
    { key: "INTRODUCTION", title: "Introduction", order: 1 },
    { key: "METHODS", title: "Methods", order: 2 },
    { key: "RESULTS", title: "Results", order: 3 },
    { key: "DISCUSSION", title: "Discussion", order: 4 },
  ],
  SKRIPSI: [
    { key: "BAB_I", title: "BAB I — Pendahuluan", order: 1 },
    { key: "BAB_II", title: "BAB II — Tinjauan Pustaka", order: 2 },
    { key: "BAB_III", title: "BAB III — Metodologi Penelitian", order: 3 },
    { key: "BAB_IV", title: "BAB IV — Hasil dan Pembahasan", order: 4 },
    { key: "BAB_V", title: "BAB V — Kesimpulan dan Saran", order: 5 },
  ],
} as const;

// ─── Outline Prompt Builder ───────────────────────────────────────────────────

/**
 * Membangun prompt untuk outline generator.
 * Output yang diharapkan: JSON dengan array poin per section.
 *
 * Format JSON yang diharapkan dari LLM:
 * {
 *   "sections": [
 *     {
 *       "key": "BAB_I",
 *       "title": "BAB I — Pendahuluan",
 *       "points": ["Poin 1", "Poin 2", ...]
 *     },
 *     ...
 *   ]
 * }
 */
export function buildOutlinePrompt(
  topic: string,
  title: string,
  documentType: DocumentType
): string {
  if (documentType === "JURNAL") {
    return buildJurnalPrompt(topic, title);
  }
  return buildSkripsiPrompt(topic, title);
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
