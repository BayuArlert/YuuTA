export interface OutlineSection {
  key: string;
  title: string;
  points: string[];
}

export interface GeneratedOutline {
  sections: OutlineSection[];
}

export type DocumentTypeValue = "PROPOSAL" | "SKRIPSI" | "JURNAL";
export type CitationStyleValue = "APA" | "IEEE" | "VANCOUVER";
export type SectionStatusValue = "EMPTY" | "DRAFT" | "DONE";

export interface SectionDraftData {
  id: string;
  sectionId: string;
  content: string;
  aiFeedback: string | null;
  guidedAnswers: Record<string, string> | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface SectionWithDraft {
  id: string;
  documentId: string;
  sectionKey: string;
  title: string;
  orderIndex: number;
  status: SectionStatusValue;
  draft: SectionDraftData | null;
}

export interface AiFeedback {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  missingPoints: string[];
  consistency: string;
}

export interface GuidedQuestions {
  questions: string[];
}

export interface DocumentWithSections {
  id: string;
  title: string;
  topic: string;
  documentType: DocumentTypeValue;
  templateKey?: string | null;
  authorName?: string | null;
  studentNim?: string | null;
  studyProgram?: string | null;
  institution?: string | null;
  academicYear?: string | null;
  citationStyle: CitationStyleValue;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  sections: {
    id: string;
    sectionKey: string;
    title: string;
    orderIndex: number;
    status: SectionStatusValue;
  }[];
  outlines: {
    id: string;
    generatedOutline: GeneratedOutline;
    isEdited: boolean;
    createdAt: Date;
  }[];
}
