"use client";

import { useState, useEffect, useCallback } from "react";
import { GeneratedOutline, OutlineSection } from "@/types";
import {
  Sparkles,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Lightbulb,
} from "lucide-react";

interface OutlineViewProps {
  documentId: string;
  initialOutline?: GeneratedOutline | null;
  outlineId?: string;
}

export default function OutlineView({ documentId, initialOutline, outlineId }: OutlineViewProps) {
  const [outline, setOutline] = useState<GeneratedOutline | null>(initialOutline ?? null);
  const [savedOutlineId, setSavedOutlineId] = useState<string | undefined>(outlineId);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingPoint, setEditingPoint] = useState<{ sectionKey: string; pointIdx: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [savedNotice, setSavedNotice] = useState(false);

  // Auto-generate jika belum ada outline
  useEffect(() => {
    if (!initialOutline) {
      handleGenerate();
    } else {
      const keys = new Set(initialOutline.sections.map((s) => s.key));
      setExpandedSections(keys);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/ai/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOutline(data.generatedOutline);
      setSavedOutlineId(data.outline.id);
      const keys = new Set<string>(data.generatedOutline.sections.map((s: OutlineSection) => s.key));
      setExpandedSections(keys);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal generate outline otomatis");
    } finally {
      setGenerating(false);
    }
  }, [documentId]);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const startEdit = (sectionKey: string, pointIdx: number, currentValue: string) => {
    setEditingPoint({ sectionKey, pointIdx });
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (!editingPoint || !outline) return;
    const updated: GeneratedOutline = {
      sections: outline.sections.map((s) =>
        s.key === editingPoint.sectionKey
          ? { ...s, points: s.points.map((p, i) => (i === editingPoint.pointIdx ? editValue : p)) }
          : s
      ),
    };
    setOutline(updated);
    setEditingPoint(null);
  };

  const addPoint = (sectionKey: string) => {
    if (!outline) return;
    const updated: GeneratedOutline = {
      sections: outline.sections.map((s) =>
        s.key === sectionKey ? { ...s, points: [...s.points, "Tuliskan poin pembahasan baru..."] } : s
      ),
    };
    setOutline(updated);
    const newIdx = updated.sections.find((s) => s.key === sectionKey)!.points.length - 1;
    startEdit(sectionKey, newIdx, "Tuliskan poin pembahasan baru...");
  };

  const deletePoint = (sectionKey: string, pointIdx: number) => {
    if (!outline) return;
    const updated: GeneratedOutline = {
      sections: outline.sections.map((s) =>
        s.key === sectionKey ? { ...s, points: s.points.filter((_, i) => i !== pointIdx) } : s
      ),
    };
    setOutline(updated);
  };

  const handleSave = async () => {
    if (!outline || !savedOutlineId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/ai/outline", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outlineId: savedOutlineId, generatedOutline: outline }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan outline");
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan outline");
    } finally {
      setSaving(false);
    }
  };

  if (generating) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-6">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center text-white shadow-xl shadow-sky-500/30">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-2xl bg-sky-400 animate-ping opacity-25" />
        </div>
        <div className="text-center max-w-sm">
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            YuuTA sedang menyusun outline...
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gemini AI merancang kerangka akademik dan pertanyaan pemandu sesuai standar penulisan.
          </p>
        </div>
        <div className="w-full max-w-md space-y-3 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !outline) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600">
          <AlertCircle className="w-6 h-6" />
        </div>
        <div>
          <p className="font-bold text-slate-900 dark:text-white">Gagal Membuat Outline</p>
          <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{error}</p>
        </div>
        <button
          id="btn-retry-generate"
          onClick={handleGenerate}
          className="btn-primary-sky px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-md"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Coba Generate Lagi</span>
        </button>
      </div>
    );
  }

  if (!outline) return null;

  return (
    <div className="space-y-5">
      {/* Guiding Helper Banner */}
      <div className="p-4 rounded-2xl bg-sky-50/90 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 flex items-start gap-3">
        <Lightbulb className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <strong className="text-slate-900 dark:text-white font-semibold">Tips Menulis Terstruktur:</strong> AI telah merumuskan poin-poin kunci untuk setiap bab. Klik pada teks poin mana pun untuk mengedit atau menambahkan detail spesifik sesuai instrumen penelitian Anda.
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 py-1">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Total {outline.sections.length} Bagian Terstruktur
        </div>

        <div className="flex items-center gap-2.5">
          {savedNotice && (
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>Perubahan Tersimpan!</span>
            </span>
          )}

          <button
            id="btn-regenerate"
            type="button"
            onClick={handleGenerate}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>Generate Ulang</span>
          </button>

          <button
            id="btn-save-outline"
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary-sky px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-60"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Outline</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sections Accordions */}
      <div className="space-y-3.5">
        {outline.sections.map((section, sIdx) => {
          const isExpanded = expandedSections.has(section.key);

          return (
            <div
              key={section.key}
              className="yuuta-card bg-white dark:bg-slate-900 border border-sky-100 dark:border-slate-800 overflow-hidden transition-all shadow-xs"
            >
              {/* Accordion Header */}
              <button
                type="button"
                id={`section-toggle-${section.key.toLowerCase()}`}
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/40 dark:bg-slate-800/30 hover:bg-sky-50/50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer border-b border-transparent"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-bold text-xs flex items-center justify-center shrink-0 border border-sky-200/60 dark:border-sky-800/60">
                    {sIdx + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                      {section.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {section.points.length} poin pembahasan inti
                    </p>
                  </div>
                </div>

                <div className="p-1 rounded-lg text-slate-400">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </button>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="p-4 sm:p-5 space-y-2.5 border-t border-slate-100 dark:border-slate-800">
                  {section.points.map((point, pIdx) => {
                    const isEditing = editingPoint?.sectionKey === section.key && editingPoint?.pointIdx === pIdx;

                    return (
                      <div
                        key={pIdx}
                        className={`group flex items-start gap-3 p-3 rounded-xl transition-all ${
                          isEditing
                            ? "bg-sky-50/80 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-700 ring-2 ring-sky-500/20"
                            : "bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 hover:border-sky-200 dark:hover:border-slate-700"
                        }`}
                      >
                        <span className="w-5 h-5 rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                          {pIdx + 1}
                        </span>

                        {isEditing ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              autoFocus
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") commitEdit();
                                if (e.key === "Escape") setEditingPoint(null);
                              }}
                              className="flex-1 px-3 py-1.5 rounded-lg text-sm bg-white dark:bg-slate-900 border border-sky-400 text-slate-900 dark:text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={commitEdit}
                              className="p-1.5 rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors cursor-pointer"
                              title="Simpan"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPoint(null)}
                              className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 transition-colors cursor-pointer"
                              title="Batal"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <p
                              onClick={() => startEdit(section.key, pIdx, point)}
                              className="flex-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed cursor-text"
                            >
                              {point}
                            </p>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                id={`edit-point-${section.key}-${pIdx}`}
                                onClick={() => startEdit(section.key, pIdx, point)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Edit Poin"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                id={`delete-point-${section.key}-${pIdx}`}
                                onClick={() => deletePoint(section.key, pIdx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                title="Hapus Poin"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}

                  {/* Add Point Button */}
                  <button
                    type="button"
                    id={`add-point-${section.key.toLowerCase()}`}
                    onClick={() => addPoint(section.key)}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 border border-dashed border-sky-300 dark:border-sky-800 hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Poin Pembahasan Baru</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
