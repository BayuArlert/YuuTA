"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { SectionWithDraft, AiFeedback } from "@/types";
import {
  Save,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BookOpen,
  HelpCircle,
  AlertCircle,
  TrendingUp,
  ThumbsUp,
  Lightbulb,
  X,
  ArrowRight,
  Loader2,
  FileText,
  PenLine,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Download,
  Wand2,
  CheckCircle,
} from "lucide-react";

interface CurrentSection {
  id: string;
  sectionKey: string;
  title: string;
  status: "EMPTY" | "DRAFT" | "DONE";
}

interface WritingEditorProps {
  documentId: string;
  documentTitle: string;
  documentTopic: string;
  sections: SectionWithDraft[];
  currentSection: CurrentSection;
  outlinePoints: string[];
  initialContent: string;
  prevSectionId: string | null;
  nextSectionId: string | null;
}

const STATUS_CONFIG = {
  EMPTY: { label: "Belum Mulai", color: "text-slate-500 dark:text-slate-400", dot: "bg-slate-300 dark:bg-slate-600" },
  DRAFT: { label: "Draft", color: "text-amber-600 dark:text-amber-400", dot: "bg-amber-400" },
  DONE: { label: "Selesai", color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-400" },
};

export default function WritingEditor({
  documentId,
  documentTitle,
  documentTopic,
  sections,
  currentSection,
  outlinePoints,
  initialContent,
  prevSectionId,
  nextSectionId,
}: WritingEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [wordCount, setWordCount] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);
  const [feedback, setFeedback] = useState<AiFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [draftGeneratedNotice, setDraftGeneratedNotice] = useState(false);
  const [exportingWord, setExportingWord] = useState(false);
  const [rightPanel, setRightPanel] = useState<"outline" | "questions" | "none">("outline");
  const [markingDone, setMarkingDone] = useState(false);
  const [aiErrorModal, setAiErrorModal] = useState<{
    title: string;
    message: string;
    isRateLimit?: boolean;
    isAuthError?: boolean;
  } | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-save function dengan retry otomatis
  const doSave = useCallback(
    async (text: string, done = false, retryCount = 0) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/sections/${currentSection.id}/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, markAsDone: done }),
        });
        if (!res.ok) throw new Error();
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
        if (done) router.refresh();
      } catch {
        if (retryCount < 2) {
          // Coba otomatis sekali lagi setelah 1.5 detik jika koneksi pool sedang pulih
          setTimeout(() => doSave(text, done, retryCount + 1), 1500);
        } else {
          setSaveStatus("error");
        }
      }
    },
    [currentSection.id, router]
  );

  const scheduleAutoSave = useCallback(
    (text: string) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("idle");
      saveTimerRef.current = setTimeout(() => doSave(text), 2000);
    },
    [doSave]
  );

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
    ],
    content: initialContent || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[450px] p-6 text-sm text-slate-800 dark:text-slate-200 outline-none leading-relaxed font-[var(--font-inter)]",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setContent(html);

      // Hitung kata dari text murni
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(text.trim() === "" ? 0 : words);

      scheduleAutoSave(html);
    },
  });

  // Sinkronisasi word count awal
  useEffect(() => {
    if (editor) {
      const text = editor.getText();
      const words = text.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(text.trim() === "" ? 0 : words);
    }
  }, [editor]);

  // Load pertanyaan pemandu
  const loadQuestions = useCallback(async () => {
    if (questionsLoaded) return;
    setQuestionsLoading(true);
    try {
      const res = await fetch(`/api/sections/${currentSection.id}/questions`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.questions) {
        setQuestions(data.questions);
        setQuestionsLoaded(true);
      }
    } catch {
      // silent
    } finally {
      setQuestionsLoading(false);
    }
  }, [currentSection.id, questionsLoaded]);

  const handleShowQuestions = () => {
    setRightPanel("questions");
    if (!questionsLoaded) loadQuestions();
  };

  // Generate Draf Otomatis oleh AI per poin outline
  const handleGenerateDraft = async () => {
    setGeneratingDraft(true);
    try {
      const res = await fetch(`/api/sections/${currentSection.id}/generate-draft`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok && data.htmlContent) {
        if (editor) {
          editor.commands.setContent(data.htmlContent);
          setContent(data.htmlContent);

          const text = editor.getText();
          const words = text.trim().split(/\s+/).filter(Boolean).length;
          setWordCount(words);

          // Batalkan timer auto-save tertunda agar tidak terjadi dobel request bersamaan
          if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
          // Simpan langsung ke database
          await doSave(data.htmlContent);
          setShowDraftModal(false);
          setDraftGeneratedNotice(true);
          setTimeout(() => setDraftGeneratedNotice(false), 4000);
        }
      } else {
        setAiErrorModal({
          title: data.isRateLimit
            ? "Batas Kuota / Rate Limit Token Tercapai"
            : data.isAuthError
            ? "API Key Tidak Valid"
            : "Gagal Menghasilkan Draf",
          message:
            data.error ||
            "Layanan AI tidak dapat merespons permintaan saat ini. Silakan coba kembali sesaat lagi.",
          isRateLimit: Boolean(data.isRateLimit),
          isAuthError: Boolean(data.isAuthError),
        });
      }
    } catch (err) {
      console.error(err);
      setAiErrorModal({
        title: "Kendala Koneksi",
        message: "Terjadi kesalahan jaringan atau koneksi saat memanggil AI. Silakan coba lagi.",
      });
    } finally {
      setGeneratingDraft(false);
    }
  };

  // Minta feedback AI
  const handleFeedback = async () => {
    if (wordCount < 30) return;
    setFeedbackLoading(true);
    setShowFeedback(true);
    try {
      const plainText = editor?.getText() || content;
      const res = await fetch(`/api/sections/${currentSection.id}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: plainText }),
      });
      const data = await res.json();
      if (res.ok && data.feedback) {
        setFeedback(data.feedback);
      } else {
        setShowFeedback(false);
        setAiErrorModal({
          title: data?.isRateLimit ? "Batas Kuota / Rate Limit Token Tercapai" : "Gagal Memuat Feedback",
          message: data?.error || "Gagal menganalisis draf melalui AI.",
          isRateLimit: Boolean(data?.isRateLimit),
        });
      }
    } catch {
      setShowFeedback(false);
      setAiErrorModal({
        title: "Kendala Koneksi",
        message: "Terjadi kesalahan jaringan saat memuat feedback AI.",
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Export Word (.docx)
  const handleExportWord = async () => {
    setExportingWord(true);
    try {
      // Simpan draf saat ini sebelum export
      if (editor) {
        await doSave(editor.getHTML());
      }

      const res = await fetch(`/api/documents/${documentId}/export`);
      if (!res.ok) {
        throw new Error("Gagal mengunduh dokumen");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const sanitized = documentTitle.replace(/[^a-zA-Z0-9_\-\s]/g, "").trim().replace(/\s+/g, "_") || "Skripsi";
      a.download = `${sanitized}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh file Word. Pastikan server aktif.");
    } finally {
      setExportingWord(false);
    }
  };

  // Tandai selesai
  const handleMarkDone = async () => {
    setMarkingDone(true);
    const textToSave = editor ? editor.getHTML() : content;
    await doSave(textToSave, true);
    setMarkingDone(false);
    router.refresh();
  };

  // Navigate to section
  const navigateToSection = (sectionId: string) => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      if (editor) doSave(editor.getHTML());
    }
    router.push(`/documents/${documentId}/write/${sectionId}`);
  };

  const completedCount = sections.filter((s) => s.status === "DONE").length;
  const progressPct = Math.round((completedCount / sections.length) * 100);

  return (
    <div className="flex gap-0 h-[calc(100vh-130px)] min-h-[600px]">
      {/* ── Left Sidebar: Section Navigator ── */}
      <div className="w-56 shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-l-2xl overflow-hidden">
        {/* Document Info */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Dokumen</p>
          <p className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">{documentTitle}</p>
          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">Progres</span>
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">{progressPct}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {completedCount}/{sections.length} bab selesai
            </p>
          </div>
        </div>

        {/* Section List */}
        <div className="flex-1 overflow-y-auto py-2">
          {sections.map((section) => {
            const isActive = section.id === currentSection.id;
            const cfg = STATUS_CONFIG[section.status];
            return (
              <button
                key={section.id}
                onClick={() => navigateToSection(section.id)}
                className={`w-full text-left px-4 py-3 border-l-2 transition-all ${
                  isActive
                    ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40"
                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <p
                  className={`text-xs font-semibold leading-snug ${
                    isActive ? "text-sky-700 dark:text-sky-300" : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {section.title.split("—")[0].trim()}
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
                  <span className={`text-[10px] font-medium ${cfg.color}`}>{cfg.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Links in Sidebar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <Link
            href={`/documents/${documentId}/outline`}
            className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors font-medium"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Lihat Outline</span>
          </Link>
          <button
            onClick={handleExportWord}
            disabled={exportingWord}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200/80 dark:border-sky-800/80 transition-all cursor-pointer disabled:opacity-50"
          >
            {exportingWord ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>Unduh Word (.docx)</span>
          </button>
        </div>
      </div>

      {/* ── Main Editor Area ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
        {/* Editor Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center border border-sky-200/60 dark:border-sky-800/60 shrink-0">
              <PenLine className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">{currentSection.title}</h2>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{documentTopic}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Save Status */}
            <span className="text-[10px] font-medium mr-1">
              {saveStatus === "saving" && (
                <span className="text-slate-400 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Save className="w-3 h-3" /> Tersimpan
                </span>
              )}
              {saveStatus === "error" && (
                <button
                  type="button"
                  onClick={() => doSave(editor ? editor.getHTML() : content)}
                  className="text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                  title="Klik untuk mencoba menyimpan kembali ke database"
                >
                  <AlertCircle className="w-3 h-3" /> Gagal simpan (Klik coba lagi)
                </button>
              )}
            </span>

            {/* AI Generate Draft Button (Prominent) */}
            <button
              onClick={() => {
                if (wordCount > 30) {
                  setShowDraftModal(true);
                } else {
                  handleGenerateDraft();
                }
              }}
              disabled={generatingDraft}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 text-white bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-500 hover:opacity-95 shadow-sm transition-all cursor-pointer disabled:opacity-60"
              title="AI menulis draf lengkap bab berdasarkan seluruh poin outline"
            >
              {generatingDraft ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Wand2 className="w-3.5 h-3.5" />
              )}
              <span>{generatingDraft ? "AI Menulis..." : "Generate Draf AI"}</span>
            </button>

            {/* Toolbar Buttons */}
            <button
              onClick={() => setRightPanel(rightPanel === "outline" ? "none" : "outline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                rightPanel === "outline"
                  ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800"
                  : "text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Outline</span>
            </button>

            <button
              onClick={handleShowQuestions}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                rightPanel === "questions"
                  ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800"
                  : "text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Pemandu</span>
            </button>

            <button
              onClick={handleFeedback}
              disabled={wordCount < 30}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Feedback AI</span>
            </button>
          </div>
        </div>

        {/* TipTap Rich Text Toolbar */}
        {editor && (
          <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 bg-slate-50/60 dark:bg-slate-900/40 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 rounded-md text-xs font-bold transition-colors ${
                editor.isActive("bold")
                  ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
              title="Tebal (Bold)"
            >
              <BoldIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 rounded-md text-xs italic transition-colors ${
                editor.isActive("italic")
                  ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
              title="Miring (Italic - Istilah Asing)"
            >
              <ItalicIcon className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-0.5 transition-colors ${
                editor.isActive("heading", { level: 2 })
                  ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
              title="Sub-bab (Heading 2)"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-0.5 transition-colors ${
                editor.isActive("heading", { level: 3 })
                  ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
              title="Poin Sub-bab (Heading 3)"
            >
              <Heading3 className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                editor.isActive("bulletList")
                  ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
              title="Daftar Poin"
            >
              <List className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 rounded-md text-xs transition-colors ${
                editor.isActive("orderedList")
                  ? "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
              }`}
              title="Daftar Bernomor"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 rounded-md text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 rounded-md text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              💡 Kata asing otomatis dicetak miring saat export Word
            </span>
          </div>
        )}

        {/* Notice Draf Generated */}
        {draftGeneratedNotice && (
          <div className="px-5 py-2 bg-sky-50 dark:bg-sky-950/60 border-b border-sky-200 dark:border-sky-800 flex items-center justify-between text-xs text-sky-800 dark:text-sky-200">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-sky-500" />
              Draf lengkap berhasil dibuat oleh AI dan tersimpan otomatis! Anda bebas mengedit tulisan di bawah.
            </span>
            <button onClick={() => setDraftGeneratedNotice(false)} className="text-sky-500 hover:text-sky-700">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Editor + Right Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* TipTap Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
              <EditorContent editor={editor} />
            </div>

            {/* Bottom Bar */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0 bg-slate-50/50 dark:bg-slate-900/80">
              <div className="flex items-center gap-4">
                {/* Word Count */}
                <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                  {wordCount.toLocaleString("id-ID")} kata
                </span>
                {/* Status Badge */}
                <span
                  className={`text-xs font-semibold flex items-center gap-1.5 ${
                    STATUS_CONFIG[currentSection.status].color
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[currentSection.status].dot}`}
                  />
                  {STATUS_CONFIG[currentSection.status].label}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Prev */}
                {prevSectionId && (
                  <button
                    onClick={() => navigateToSection(prevSectionId)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </button>
                )}

                {/* Mark Done */}
                {currentSection.status !== "DONE" && wordCount > 30 && (
                  <button
                    onClick={handleMarkDone}
                    disabled={markingDone}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {markingDone ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Tandai Selesai</span>
                  </button>
                )}

                {/* Next */}
                {nextSectionId && (
                  <button
                    onClick={() => navigateToSection(nextSectionId)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 btn-primary-sky cursor-pointer"
                  >
                    <span>Bab Berikutnya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel */}
          {rightPanel !== "none" && (
            <div className="w-72 shrink-0 border-l border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden bg-slate-50/60 dark:bg-slate-900/60">
              {/* Outline Panel */}
              {rightPanel === "outline" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Outline Bagian Ini</span>
                    </div>
                    <button
                      onClick={() => setRightPanel("none")}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
                    {outlinePoints.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                        Belum ada poin outline untuk bagian ini.
                      </p>
                    ) : (
                      outlinePoints.map((point, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-xs"
                        >
                          <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {point}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50">
                    <button
                      onClick={handleGenerateDraft}
                      disabled={generatingDraft}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm transition-all disabled:opacity-50"
                    >
                      {generatingDraft ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>Tulis Draf Otomatis AI</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Questions Panel */}
              {rightPanel === "questions" && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Pertanyaan Pemandu</span>
                    </div>
                    <button
                      onClick={() => setRightPanel("none")}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {questionsLoading ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
                        <p className="text-xs text-slate-400 dark:text-slate-500">Menyusun pertanyaan pemandu...</p>
                      </div>
                    ) : questions.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                          Klik tombol di bawah untuk membuat pertanyaan pemandu dari AI.
                        </p>
                        <button
                          onClick={loadQuestions}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 hover:bg-violet-100 transition-colors"
                        >
                          Muat Pertanyaan
                        </button>
                      </div>
                    ) : (
                      questions.map((q, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-violet-100 dark:border-violet-900/40 shadow-xs"
                        >
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <span className="w-4 h-4 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300 font-bold text-[9px] flex items-center justify-center shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                              Panduan Berpikir
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{q}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Konfirmasi Timpa Draf AI ── */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ganti Tulisan yang Ada?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Bagian ini sudah memiliki tulisan ({wordCount} kata).</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
              Jika Anda melanjutkan, AI akan menimpa tulisan ini dengan draf baru yang dikembangkan secara komprehensif dari semua poin outline.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDraftModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDraftModal(false);
                  handleGenerateDraft();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-all shadow-sm"
              >
                Ya, Buat Draf AI Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AI Feedback Modal ── */}
      {showFeedback && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Feedback AI untuk Bab Ini</h3>
              </div>
              <button
                onClick={() => setShowFeedback(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {feedbackLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Sedang menganalisis draf Anda...</p>
                </div>
              ) : feedback ? (
                <>
                  {/* Score */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Skor Kualitas Draf</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{feedback.summary}</p>
                    </div>
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 shrink-0 font-mono ml-3">
                      {feedback.score}/100
                    </div>
                  </div>

                  {/* Strengths */}
                  {feedback.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                        <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" /> Kelebihan
                      </p>
                      <ul className="space-y-1.5">
                        {feedback.strengths.map((s, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Improvements */}
                  {feedback.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-sky-500" /> Saran Perbaikan
                      </p>
                      <ul className="space-y-1.5">
                        {feedback.improvements.map((s, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0 mt-1.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Missing Points */}
                  {feedback.missingPoints?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Poin yang Belum Dibahas
                      </p>
                      <ul className="space-y-1.5">
                        {feedback.missingPoints.map((s, i) => (
                          <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Consistency */}
                  {feedback.consistency && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Konsistensi & Alur
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {feedback.consistency}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">Gagal memuat feedback.</p>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowFeedback(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Notifikasi Batas Limit Token / API Key ── */}
      {aiErrorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-start gap-3.5 mb-4">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  aiErrorModal.isRateLimit
                    ? "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                    : "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                }`}
              >
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                  {aiErrorModal.title}
                </h3>
                <span
                  className={`inline-block text-[10px] font-mono px-2 py-0.5 rounded-md mt-1 font-semibold uppercase ${
                    aiErrorModal.isRateLimit
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300"
                      : "bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300"
                  }`}
                >
                  {aiErrorModal.isRateLimit ? "HTTP 429 • LIMIT KUOTA TOKEN" : "GOOGLE AI ALERT"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {aiErrorModal.message}
            </p>

            {aiErrorModal.isRateLimit && (
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 mb-5 text-[11px] text-amber-900 dark:text-amber-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  💡 Tips Penanganan:
                </p>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800 dark:text-amber-300">
                  <li>Tunggu 1–2 menit: Gemini free tier membatasi frekuensi request per menit (RPM) dan token per menit (TPM). Pembatasan ini akan ter-reset otomatis setiap menit.</li>
                  <li>Atau periksa saldo/kuota proyek Anda di <strong>Google AI Studio</strong>.</li>
                </ul>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAiErrorModal(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setAiErrorModal(null);
                  handleGenerateDraft();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Coba Lagi Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
