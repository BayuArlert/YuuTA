import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  PageBreak,
} from "docx";
import { DocumentTypeValue, CitationStyleValue } from "@/types";

export interface ExportSectionData {
  sectionKey: string;
  title: string;
  orderIndex: number;
  content: string;
}

export interface ExportDocumentData {
  title: string;
  topic: string;
  documentType: DocumentTypeValue;
  citationStyle: CitationStyleValue;
  authorName?: string;
  sections: ExportSectionData[];
}

interface InlineToken {
  text: string;
  bold?: boolean;
  italics?: boolean;
}

/**
 * Mengurai string inline HTML/Markdown menjadi daftar token teks dengan atribut format (bold, italic)
 */
function parseInlineFormatting(html: string): InlineToken[] {
  // Decode entitas HTML umum
  let text = html
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  // Ubah markdown bold & italic menjadi tag HTML standar untuk parsing seragam
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

  const tokens: InlineToken[] = [];
  // Regex untuk menangkap tag atau teks
  const tagRegex = /(<\/?(?:strong|b|em|i)>)/gi;
  const parts = text.split(tagRegex);

  let isBold = false;
  let isItalic = false;

  for (const part of parts) {
    if (!part) continue;
    const lower = part.toLowerCase();

    if (lower === "<strong>" || lower === "<b>") {
      isBold = true;
    } else if (lower === "</strong>" || lower === "</b>") {
      isBold = false;
    } else if (lower === "<em>" || lower === "<i>") {
      isItalic = true;
    } else if (lower === "</em>" || lower === "</i>") {
      isItalic = false;
    } else {
      // Hilangkan sisa tag HTML lain jika ada (misal span, a, dll)
      const cleanPart = part.replace(/<[^>]+>/g, "");
      if (cleanPart) {
        tokens.push({
          text: cleanPart,
          bold: isBold,
          italics: isItalic,
        });
      }
    }
  }

  return tokens;
}

/**
 * Mengubah konten HTML / Plaintext ke array Paragraph docx
 */
function convertContentToParagraphs(rawContent: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  if (!rawContent || !rawContent.trim()) {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: "(Bagian ini belum memiliki draf isi)",
            italics: true,
            font: "Times New Roman",
            size: 24, // 12pt
          }),
        ],
        spacing: { line: 360, before: 120, after: 120 },
      }),
    ];
  }

  // Jika input berupa HTML dengan tag block (h1, h2, h3, p, li)
  const hasBlockHtml = /<\/(?:p|h[1-6]|li|div)>/i.test(rawContent);

  if (hasBlockHtml) {
    // Normalisasi baris baru
    const blockRegex = /<(h[1-6]|p|li|blockquote)[\s\S]*?>([\s\S]*?)<\/\1>/gi;
    let match;
    let foundBlocks = 0;

    while ((match = blockRegex.exec(rawContent)) !== null) {
      foundBlocks++;
      const tag = match[1].toLowerCase();
      const innerContent = match[2].trim();
      if (!innerContent) continue;

      const tokens = parseInlineFormatting(innerContent);
      const runs = tokens.map(
        (t) =>
          new TextRun({
            text: t.text,
            bold: t.bold,
            italics: t.italics,
            font: "Times New Roman",
            size: tag.startsWith("h") ? 26 : 24, // 13pt untuk subhead, 12pt untuk body
          })
      );

      if (tag === "h1" || tag === "h2") {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: runs,
            spacing: { before: 280, after: 140, line: 360 },
          })
        );
      } else if (tag === "h3" || tag === "h4") {
        paragraphs.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: runs,
            spacing: { before: 240, after: 120, line: 360 },
          })
        );
      } else if (tag === "li") {
        paragraphs.push(
          new Paragraph({
            bullet: { level: 0 },
            children: runs,
            spacing: { before: 60, after: 60, line: 360 },
          })
        );
      } else {
        // Paragraf biasa (justify, first line indent 1.27 cm / 720 twips)
        paragraphs.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 720 },
            children: runs,
            spacing: { before: 80, after: 120, line: 360 }, // 1.5 line spacing
          })
        );
      }
    }

    if (foundBlocks > 0) {
      return paragraphs;
    }
  }

  // Fallback jika berupa plain text dengan baris baru ganda
  const rawParagraphs = rawContent.split(/\n\s*\n/);
  for (const rawP of rawParagraphs) {
    const trimmed = rawP.trim();
    if (!trimmed) continue;

    // Cek apakah heading markdown (### ...)
    if (trimmed.startsWith("### ")) {
      const headingText = trimmed.replace(/^###\s+/, "");
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          children: [
            new TextRun({
              text: headingText,
              bold: true,
              font: "Times New Roman",
              size: 24,
            }),
          ],
          spacing: { before: 240, after: 120, line: 360 },
        })
      );
    } else if (trimmed.startsWith("## ")) {
      const headingText = trimmed.replace(/^##\s+/, "");
      paragraphs.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          children: [
            new TextRun({
              text: headingText,
              bold: true,
              font: "Times New Roman",
              size: 26,
            }),
          ],
          spacing: { before: 280, after: 140, line: 360 },
        })
      );
    } else {
      const tokens = parseInlineFormatting(trimmed.replace(/\n/g, " "));
      paragraphs.push(
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          indent: { firstLine: 720 },
          children: tokens.map(
            (t) =>
              new TextRun({
                text: t.text,
                bold: t.bold,
                italics: t.italics,
                font: "Times New Roman",
                size: 24,
              })
          ),
          spacing: { before: 80, after: 120, line: 360 },
        })
      );
    }
  }

  return paragraphs;
}

/**
 * Membuat dokumen Word (.docx) berstandar akademik Indonesia
 * - Format Skripsi: Margin 4cm kiri, 4cm atas, 3cm kanan, 3cm bawah (4-4-3-3 cm)
 * - Font: Times New Roman 12pt
 * - Spasi: 1.5 Line Spacing
 * - Penulisan istilah asing otomatis miring (italics)
 */
export async function generateDocumentWordBuffer(data: ExportDocumentData): Promise<Buffer> {
  const docElements: Paragraph[] = [];

  // 1. Cover / Halaman Judul
  docElements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 360, line: 360 },
      children: [
        new TextRun({
          text: data.title.toUpperCase(),
          bold: true,
          font: "Times New Roman",
          size: 28, // 14pt
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 720, line: 360 },
      children: [
        new TextRun({
          text:
            data.documentType === "SKRIPSI"
              ? "PROPOSAL SKRIPSI / TUGAS AKHIR"
              : "DRAF MANUSKRIP ARTIKEL ILMIAH",
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1800, after: 240, line: 360 },
      children: [
        new TextRun({
          text: "Disusun Oleh:",
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 1800, line: 360 },
      children: [
        new TextRun({
          text: data.authorName ?? "Mahasiswa / Peneliti",
          bold: true,
          underline: {},
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 240, line: 360 },
      children: [
        new TextRun({
          text: `Gaya Sitasi: ${data.citationStyle} | Topik: ${data.topic}`,
          font: "Times New Roman",
          size: 20, // 10pt
          color: "666666",
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: new Date().getFullYear().toString(),
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    })
  );

  // Page break setelah cover
  docElements.push(new Paragraph({ children: [new PageBreak()] }));

  // 2. Setiap Bab / Section
  const sortedSections = [...data.sections].sort((a, b) => a.orderIndex - b.orderIndex);

  for (let i = 0; i < sortedSections.length; i++) {
    const section = sortedSections[i];

    // Cek apakah judul memiliki format "BAB I PENDAHULUAN" atau terpisah
    const babMatch = section.title.match(/^(BAB\s+[IVXLCDM]+)\s*[:\-–]?\s*(.*)$/i);

    if (babMatch) {
      // Heading BAB I (Center, Bold, 14pt)
      docElements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 360, after: 120, line: 360 },
          children: [
            new TextRun({
              text: babMatch[1].toUpperCase(),
              bold: true,
              font: "Times New Roman",
              size: 28, // 14pt
            }),
          ],
        })
      );
      // Sub judul BAB misal "PENDAHULUAN"
      if (babMatch[2]) {
        docElements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 360, line: 360 },
            children: [
              new TextRun({
                text: babMatch[2].toUpperCase(),
                bold: true,
                font: "Times New Roman",
                size: 28, // 14pt
              }),
            ],
          })
        );
      }
    } else {
      // Bagian jurnal atau non-bab
      docElements.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 360, after: 360, line: 360 },
          children: [
            new TextRun({
              text: section.title.toUpperCase(),
              bold: true,
              font: "Times New Roman",
              size: 28,
            }),
          ],
        })
      );
    }

    // Isi konten bab
    const contentParagraphs = convertContentToParagraphs(section.content);
    docElements.push(...contentParagraphs);

    // Tambah page break antar-bab (kecuali bab terakhir)
    if (i < sortedSections.length - 1) {
      docElements.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // Margin skripsi standar (dalam twips):
  // 1 cm = 567 twips
  // Kiri: 4 cm = 2268 twips
  // Atas: 4 cm = 2268 twips
  // Kanan: 3 cm = 1701 twips
  // Bawah: 3 cm = 1701 twips
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 2268,
              bottom: 1701,
              left: 2268,
              right: 1701,
            },
          },
        },
        children: docElements,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
