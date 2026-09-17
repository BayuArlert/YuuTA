import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Daftar prioritas model Gemini: Jika model utama sedang 503 (high demand), otomatis beralih ke cadangan
const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || "gemini-3.6-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.8-flash",
];

export class GeminiQuotaError extends Error {
  isRateLimit = true;
  constructor(
    message = "Batas kuota/token Gemini API Anda telah tercapai (Rate Limit / Quota Exceeded). Mohon tunggu 1-2 menit sebelum mencoba kembali, atau periksa kuota API Key di Google AI Studio."
  ) {
    super(message);
    this.name = "GeminiQuotaError";
  }
}

export class GeminiAuthError extends Error {
  isAuthError = true;
  constructor(
    message = "API Key Gemini tidak valid atau dinonaktifkan. Silakan periksa GEMINI_API_KEY di file konfigurasi .env.local."
  ) {
    super(message);
    this.name = "GeminiAuthError";
  }
}

export function isQuotaOrRateLimitError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof GeminiQuotaError) return true;
  const errorObj = err as { status?: number; message?: string };
  const status = errorObj.status;
  const msg = errorObj.message || String(err);
  return (
    status === 429 ||
    msg.includes("429") ||
    msg.includes("RESOURCE_EXHAUSTED") ||
    msg.includes("quota") ||
    msg.includes("Quota") ||
    msg.includes("Rate limit") ||
    msg.includes("rate limit") ||
    msg.includes("exceeded your current quota")
  );
}

export function isAuthError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof GeminiAuthError) return true;
  const errorObj = err as { status?: number; message?: string };
  const status = errorObj.status;
  const msg = errorObj.message || String(err);
  return (
    status === 400 ||
    status === 403 ||
    msg.includes("API_KEY_INVALID") ||
    msg.includes("API key not valid") ||
    msg.includes("API_KEY_SERVICE_BLOCKED")
  );
}

/**
 * Kirim prompt ke Gemini dengan automatic failover jika model utama sedang mengalami lonjakan beban (503 Service Unavailable).
 * Jika kuota/rate limit habis (429), melempar GeminiQuotaError dengan pesan yang sangat jelas.
 */
export async function callGemini(
  prompt: string,
  options?: { maxOutputTokens?: number; temperature?: number }
): Promise<string> {
  let lastError: unknown;

  for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
    const modelToTry = CANDIDATE_MODELS[i];
    try {
      const model = genAI.getGenerativeModel({
        model: modelToTry,
        generationConfig: {
          temperature: options?.temperature ?? 0.7,
          topP: 0.95,
          maxOutputTokens: options?.maxOutputTokens ?? 8192,
        },
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      console.warn(
        `[GEMINI_CALL] Model ${modelToTry} [${errorObj.status ?? "ERR"}]: ${errorObj.message ?? "error"}`
      );
      lastError = err;

      // Jika API Key tidak valid, jangan buang-buang waktu mencoba model lain
      if (isAuthError(err)) {
        throw new GeminiAuthError();
      }

      // Jika kuota/rate limit habis, lempar GeminiQuotaError jika semua model sudah dicoba atau jika 429
      if (isQuotaOrRateLimitError(err) && i === CANDIDATE_MODELS.length - 1) {
        throw new GeminiQuotaError();
      }

      // Tunggu jeda singkat sebelum mencoba kandidat berikutnya
      if (i < CANDIDATE_MODELS.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  if (isQuotaOrRateLimitError(lastError)) {
    throw new GeminiQuotaError();
  }
  if (isAuthError(lastError)) {
    throw new GeminiAuthError();
  }

  throw lastError;
}

/**
 * Bersihkan output teks/HTML yang mungkin dibungkus codeblock ```html atau ```
 */
export function cleanHtmlOrMarkdownFromLLM(raw: string): string {
  return raw
    .replace(/^```(?:html|markdown|md)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

/**
 * Parse JSON dari respons Gemini yang mungkin dibungkus markdown code block.
 * Dilengkapi fallback parser toleran jika ada karakter kontrol / newline.
 */
export function parseJsonFromLLM<T>(raw: string): T {
  // Strip markdown code fences jika ada
  let cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (initialError) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const extracted = cleaned.substring(firstBrace, lastBrace + 1);
      try {
        return JSON.parse(extracted) as T;
      } catch {
        const sanitized = extracted.replace(/(?<!\\)\n/g, "\\n");
        try {
          return JSON.parse(sanitized) as T;
        } catch {
          throw initialError;
        }
      }
    }
    throw initialError;
  }
}
