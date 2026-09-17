/**
 * Prompt builder untuk fitur Penulisan Bab:
 * 1. buildGuidedQuestionsPrompt — generate pertanyaan pemandu per bab
 * 2. buildAiFeedbackPrompt — analisis & feedback draf dari AI
 * 3. buildDraftGeneratorPrompt — generate draf lengkap satu bab per poin outline
 */

const SECTION_CONTEXT: Record<string, string> = {
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

  return `Kamu adalah dosen pembimbing akademik yang membantu mahasiswa menulis ${sectionContext}.

Judul penelitian: "${documentTitle}"
Topik: ${topic}

Poin-poin outline yang sudah dibuat untuk bagian ini:
${pointsList}

Tugas kamu: Buat TEPAT 5 pertanyaan pemandu spesifik yang membantu mahasiswa mengembangkan draf tulisan untuk bagian ini.

Kriteria pertanyaan:
- Pertanyaan harus spesifik dan relevan dengan topik penelitian di atas
- Pertanyaan mendorong mahasiswa BERPIKIR dan MENULIS sendiri (bukan minta AI jawab)
- Pertanyaan berurutan dan membangun satu sama lain secara logis
- Gunakan bahasa Indonesia yang lugas dan akademik
- Setiap pertanyaan harus bisa dijawab dari data/literatur/pengalaman penelitian mahasiswa

Format output HARUS berupa JSON valid (jangan tambahkan teks lain):
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

  return `Kamu adalah reviewer akademik yang memberikan umpan balik konstruktif untuk ${sectionContext}.

Judul penelitian: "${documentTitle}"
Topik: ${topic}

Poin-poin outline yang harus dicakup di bagian ini:
${pointsList}

Draf yang ditulis mahasiswa (${wordCount} kata):
---
${draftContent.substring(0, 3000)}${draftContent.length > 3000 ? "\n[... terpotong untuk efisiensi ...]" : ""}
---

Tugas kamu: Analisis draf di atas dan berikan feedback yang konstruktif.

Format output HARUS berupa JSON valid (jangan tambahkan teks lain):
{
  "score": 75,
  "summary": "Kalimat ringkas 1-2 baris tentang kualitas draf secara keseluruhan.",
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
}

Catatan: score adalah 0-100, penilaian kelengkapan dan kualitas akademik draf.`;
}

// ─── Draft Generator Prompt ───────────────────────────────────────────────────

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

  return `Kamu adalah asisten akademik dan peneliti berpengalaman tingkat magister/doktor.
Tugasmu adalah menulis draf lengkap dan komprehensif untuk bagian: ${sectionContext}.

Informasi Penelitian:
- Judul: "${documentTitle}"
- Topik / Fokus: ${topic}
- Gaya Sitasi: ${citationStyle}
- Bagian: ${sectionTitle}

Poin-poin Outline yang HARUS dikembangkan:
${pointsList}

Instruksi Penulisan Akademik:
1. BAHASA & GAYA:
   - Gunakan Bahasa Indonesia baku, ilmiah, dan akademis standar perguruan tinggi.
   - Hindari gaya kaku seperti mesin penerjemah (tidak boleh terasa "robot"). Gunakan variasi struktur kalimat aktif dan pasif yang mengalir secara alami, transisi antar-paragraf yang kohesif dan logis (misalnya: "Berdasarkan perspektif tersebut...", "Sejalan dengan hal itu...", "Dalam konteks empiris...").
   - Kembangkan argumentasi dengan kritis, berbasis penalaran ilmiah.

2. FORMAT PENULISAN & ISTILAH ASING:
   - WAJIB: Setiap istilah bahasa asing, istilah teknis bahasa Inggris, atau frasa serapan non-baku (contoh: *machine learning*, *deep learning*, *framework*, *state of the art*, *user experience*, *novelty*, *in situ*) WAJIB ditulis dengan tag <em>istilah asing</em> atau format miring agar otomatis terbaca miring (italic).
   - Buat sub-heading jelas menggunakan tag <h3>Nama Sub-Poin</h3> untuk setiap poin bahasan outline.
   - Susun teks dalam paragraf-paragraf yang rapi menggunakan tag <p>...</p>.
   - Boleh menyertakan contoh placeholder sitasi akademik yang relevan dan natural (contoh: (Sugiyono, 2021), (Smith et al., 2023), dll).

3. KELENGKAPAN:
   - Kembangkan setiap poin outline secara mendalam, jangan hanya 1-2 kalimat pendek. Berikan elaborasi 2-4 paragraf yang berbobot untuk setiap poin outline.

FORMAT OUTPUT:
Keluarkan HANYA konten HTML bersih dan terstruktur secara langsung tanpa pembungkus JSON dan tanpa teks pengantar.
Gunakan tag HTML:
- <h3>Nama Sub-Poin</h3> untuk judul sub-bagian per poin outline
- <p>...</p> untuk setiap paragraf pembahasan yang mendalam dan mengalir
- <em>istilah asing</em> untuk setiap kata atau istilah asing/Inggris agar otomatis tercetak miring
- <strong>...</strong> untuk penegasan konsep penting jika diperlukan`;
}

