import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
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
  templateKey?: string;
  citationStyle: CitationStyleValue;
  authorName?: string;
  studentNim?: string;
  studyProgram?: string;
  institution?: string;
  academicYear?: string;
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
 * Membangun docx.Table dari array 2D string
 */
function createDocxTable(data: string[][]): Table {
  const tableRows: TableRow[] = [];
  const border = {
    style: BorderStyle.SINGLE,
    size: 4, // 0.5 pt
    color: "000000",
  };

  const borders = {
    top: border,
    bottom: border,
    left: border,
    right: border,
    insideHorizontal: border,
    insideVertical: border,
  };

  data.forEach((row, rowIndex) => {
    const isHeader = rowIndex === 0;
    const cells = row.map((cellText) => {
      const tokens = parseInlineFormatting(cellText.trim());
      const runs = tokens.map(
        (t) =>
          new TextRun({
            text: t.text,
            bold: isHeader ? true : t.bold,
            italics: t.italics,
            font: "Times New Roman",
            size: 20, // 10pt dalam tabel agar muat rapi
          })
      );

      return new TableCell({
        children: [
          new Paragraph({
            alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
            children: runs.length > 0 ? runs : [new TextRun({ text: "", font: "Times New Roman", size: 20 })],
            spacing: { before: 80, after: 80, line: 240 },
          }),
        ],
        margins: {
          top: 100,
          bottom: 100,
          left: 120,
          right: 120,
        },
        shading: isHeader
          ? {
              fill: "F1F5F9",
              type: ShadingType.CLEAR,
            }
          : undefined,
      });
    });

    tableRows.push(
      new TableRow({
        children: cells,
        tableHeader: isHeader,
      })
    );
  });

  return new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    borders,
    rows: tableRows,
  });
}

/**
 * Mendeteksi dan mengonversi tabel Markdown (| ... | ... |)
 */
function parseMarkdownTable(tableLines: string[]): Table | null {
  const rawRows = tableLines.map((line) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim())
  );

  // Filter baris pembatas (---)
  const contentRows = rawRows.filter((row) => !row.every((cell) => /^[-:\s]+$/.test(cell)));
  if (contentRows.length === 0) return null;

  return createDocxTable(contentRows);
}

/**
 * Mengubah konten HTML / Markdown ke array elemen docx (Paragraph & Table)
 */
function convertContentToDocxElements(rawContent: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
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

  // Pisahkan baris untuk mengecek adanya tabel Markdown
  const lines = rawContent.split("\n");
  let currentTableLines: string[] = [];
  let isInTable = false;

  const flushTable = () => {
    if (currentTableLines.length > 0) {
      const table = parseMarkdownTable(currentTableLines);
      if (table) {
        elements.push(new Paragraph({ spacing: { before: 120, after: 60 } }));
        elements.push(table);
        elements.push(new Paragraph({ spacing: { before: 60, after: 120 } }));
      }
      currentTableLines = [];
    }
  };

  // Pre-process: ekstrak tabel Markdown terlebih dahulu jika ada
  const nonTableChunks: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isTableLine = line.trim().startsWith("|") && line.trim().endsWith("|");

    if (isTableLine) {
      isInTable = true;
      currentTableLines.push(line);
    } else {
      if (isInTable) {
        flushTable();
        isInTable = false;
      }
      nonTableChunks.push(line);
    }
  }
  flushTable();

  // Jika ada tabel yang diekstrak terpisah, proses chunk non-tabel
  const cleanedText = nonTableChunks.join("\n");
  const hasBlockHtml = /<\/(?:p|h[1-6]|li|div|table)>/i.test(cleanedText);

  if (hasBlockHtml) {
    const blockRegex = /<(h[1-6]|p|li|blockquote)[\s\S]*?>([\s\S]*?)<\/\1>/gi;
    let match;
    let foundBlocks = 0;

    while ((match = blockRegex.exec(cleanedText)) !== null) {
      foundBlocks++;
      const tag = match[1].toLowerCase();
      const innerContent = match[2].trim();
      if (!innerContent) continue;

      const tokens = parseInlineFormatting(innerContent);
      const runs = tokens.map(
        (t) =>
          new TextRun({
            text: t.text,
            bold: tag.startsWith("h") ? true : t.bold,
            italics: t.italics,
            font: "Times New Roman",
            size: tag.startsWith("h") ? 24 : 24, // 12pt standar
          })
      );

      if (tag === "h1" || tag === "h2") {
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: runs,
            spacing: { before: 240, after: 120, line: 360 },
          })
        );
      } else if (tag === "h3" || tag === "h4") {
        elements.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_3,
            children: runs,
            spacing: { before: 200, after: 100, line: 360 },
          })
        );
      } else if (tag === "li") {
        elements.push(
          new Paragraph({
            bullet: { level: 0 },
            children: runs,
            spacing: { before: 40, after: 40, line: 360 },
          })
        );
      } else {
        elements.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 720 }, // 1.27 cm / 0.5 inci
            children: runs,
            spacing: { before: 60, after: 100, line: 360 }, // 1.5 line spacing
          })
        );
      }
    }

    if (foundBlocks > 0) {
      return elements;
    }
  }

  // Fallback pemrosesan baris teks biasa
  const rawParagraphs = cleanedText.split(/\n\s*\n/);
  for (const rawP of rawParagraphs) {
    const trimmed = rawP.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("### ")) {
      const headingText = trimmed.replace(/^###\s+/, "");
      elements.push(
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
          spacing: { before: 200, after: 100, line: 360 },
        })
      );
    } else if (trimmed.startsWith("## ")) {
      const headingText = trimmed.replace(/^##\s+/, "");
      elements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
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
    } else {
      const tokens = parseInlineFormatting(trimmed.replace(/\n/g, " "));
      elements.push(
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
          spacing: { before: 60, after: 100, line: 360 },
        })
      );
    }
  }

  return elements;
}

/**
 * Membuat Cover Resmi Proposal Skripsi Universitas STEKOM
 */
function createStekomProposalCover(data: ExportDocumentData): Paragraph[] {
  const currentYear = data.academicYear || new Date().getFullYear().toString();
  const studyProg = (data.studyProgram || "Teknik Informatika").toUpperCase();
  const author = data.authorName || "DWI PURNOMO";
  const nim = data.studentNim || "1122100154";

  return [
    // Judul Penelitian (Center, Bold, 14pt = 28 half-points)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 720, after: 360, line: 360 },
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          font: "Times New Roman",
          size: 28, // 14pt
        }),
      ],
    }),

    // Jenis Dokumen: PROPOSAL SKRIPSI (Center, Bold, 14pt)
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 1440, line: 360 },
      children: [
        new TextRun({
          text: "PROPOSAL SKRIPSI",
          bold: true,
          font: "Times New Roman",
          size: 28, // 14pt
        }),
      ],
    }),

    // OLEH :
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 240, line: 360 },
      children: [
        new TextRun({
          text: "OLEH :",
          bold: true,
          font: "Times New Roman",
          size: 24, // 12pt
        }),
      ],
    }),

    // Identitas Mahasiswa (Nama, NIM, Program Studi)
    new Paragraph({
      alignment: AlignmentType.LEFT,
      indent: { left: 2880 }, // Menjorok ke tengah secara proporsional
      spacing: { before: 60, after: 60, line: 360 },
      children: [
        new TextRun({
          text: "Nama             : ",
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
        new TextRun({
          text: author,
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      indent: { left: 2880 },
      spacing: { before: 60, after: 60, line: 360 },
      children: [
        new TextRun({
          text: "NIM             : ",
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
        new TextRun({
          text: nim,
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      indent: { left: 2880 },
      spacing: { before: 60, after: 1800, line: 360 },
      children: [
        new TextRun({
          text: "Program Studi: ",
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
        new TextRun({
          text: data.studyProgram || "Teknik Informatika",
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),

    // Bagian Footer Institusi STEKOM
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 60, line: 360 },
      children: [
        new TextRun({
          text: `PROGRAM STUDI S1 ${studyProg}`,
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60, line: 360 },
      children: [
        new TextRun({
          text: "UNIVERSITAS SAINS DAN TEKNOLOGI KOMPUTER",
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 120, line: 360 },
      children: [
        new TextRun({
          text: "( UNIVERSITAS STEKOM )",
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 360, line: 360 },
      children: [
        new TextRun({
          text: currentYear,
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
  ];
}

/**
 * Membuat Cover Standar Skripsi
 */
function createStandardSkripsiCover(data: ExportDocumentData): Paragraph[] {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1440, after: 360, line: 360 },
      children: [
        new TextRun({
          text: data.title.toUpperCase(),
          bold: true,
          font: "Times New Roman",
          size: 28,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360, after: 720, line: 360 },
      children: [
        new TextRun({
          text: "PROPOSAL SKRIPSI / TUGAS AKHIR",
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
      children: [
        new TextRun({
          text: data.academicYear || new Date().getFullYear().toString(),
          bold: true,
          font: "Times New Roman",
          size: 24,
        }),
      ],
    }),
  ];
}

/**
 * Membuat dokumen Word (.docx) berstandar resmi Universitas STEKOM & Akademik Indonesia
 *
 * Standar Margin STEKOM (dalam twips, 1 cm = 567 twips):
 * - Kiri (Left): 4.0 cm = 2268 twips
 * - Atas (Top): 3.0 cm = 1701 twips
 * - Kanan (Right): 3.0 cm = 1701 twips
 * - Bawah (Bottom): 3.0 cm = 1701 twips
 *
 * Font: Times New Roman 12pt, Spasi 1.5, Rata Kanan-Kiri (Justified)
 */
export async function generateDocumentWordBuffer(data: ExportDocumentData): Promise<Buffer> {
  const docElements: (Paragraph | Table)[] = [];
  const isProposal = data.documentType === "PROPOSAL" || data.templateKey === "STEKOM";

  // 1. Cover Proposal / Skripsi
  if (isProposal) {
    docElements.push(...createStekomProposalCover(data));
  } else {
    docElements.push(...createStandardSkripsiCover(data));
  }

  // Page break setelah cover
  docElements.push(new Paragraph({ children: [new PageBreak()] }));

  // 2. Konten Setiap Bagian / Bab
  const sortedSections = [...data.sections].sort((a, b) => a.orderIndex - b.orderIndex);

  for (let i = 0; i < sortedSections.length; i++) {
    const section = sortedSections[i];

    if (isProposal) {
      // Pada Proposal STEKOM:
      // Judul bagian ditulis Bold, 12pt (size 24), Left-aligned (rata kiri), tanpa page break per bagian
      // DAFTAR PUSTAKA atau bagian tertentu jika diperlukan
      const isDaftarPustaka = section.sectionKey === "DAFTAR_PUSTAKA" || /daftar\s+pustaka/i.test(section.title);

      if (isDaftarPustaka && i > 0) {
        docElements.push(new Paragraph({ children: [new PageBreak()] }));
      }

      docElements.push(
        new Paragraph({
          alignment: AlignmentType.LEFT,
          spacing: { before: isDaftarPustaka ? 240 : 280, after: 120, line: 360 },
          children: [
            new TextRun({
              text: section.title,
              bold: true,
              font: "Times New Roman",
              size: 24, // 12pt bold
            }),
          ],
        })
      );
    } else {
      // Pada format Skripsi BAB I-V
      const babMatch = section.title.match(/^(BAB\s+[IVXLCDM]+)\s*[:\-–]?\s*(.*)$/i);
      if (babMatch) {
        docElements.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 360, after: 120, line: 360 },
            children: [
              new TextRun({
                text: babMatch[1].toUpperCase(),
                bold: true,
                font: "Times New Roman",
                size: 28,
              }),
            ],
          })
        );
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
                  size: 28,
                }),
              ],
            })
          );
        }
      } else {
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
    }

    // Isi konten bagian (mendukung teks dan tabel)
    const contentElements = convertContentToDocxElements(section.content);
    docElements.push(...contentElements);

    // Untuk Skripsi BAB I-V, beri page break antar-bab
    if (!isProposal && i < sortedSections.length - 1) {
      docElements.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // Margin Resmi STEKOM:
  // Kiri: 4.0 cm = 2268 twips
  // Atas: 3.0 cm = 1701 twips
  // Kanan: 3.0 cm = 1701 twips
  // Bawah: 3.0 cm = 1701 twips
  // Kertas A4: 11906 x 16838 twips
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: 11906, // 21.0 cm
              height: 16838, // 29.7 cm
            },
            margin: {
              top: 1701, // 3 cm
              bottom: 1701, // 3 cm
              left: 2268, // 4 cm
              right: 1701, // 3 cm
            },
          },
        },
        children: docElements,
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
