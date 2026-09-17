"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, Mail, Lock, ArrowRight, GraduationCap, BookOpen, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/providers/ThemeProvider";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau kata sandi tidak cocok. Silakan periksa kembali.");
        setLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Terjadi kesalahan saat masuk. Silakan coba beberapa saat lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Navbar */}
      <header className="w-full max-w-5xl flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
            Y
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Yuu<span className="text-sky-600 dark:text-sky-400">TA</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Centered Login Card */}
      <main className="w-full max-w-[420px] my-auto py-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-7 sm:p-9 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800">

          {/* Card Header — Brand badge inside card */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-900/60 mb-4">
              <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-sky-600 to-cyan-500 flex items-center justify-center text-white font-black text-xs">
                Y
              </div>
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 tracking-wide">
                YuuTA — Asisten Akademik
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Masuk ke Akun
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Asisten Penulisan Jurnal &amp; Skripsi
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Email
              </label>
              <div className="flex items-center w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@kampus.ac.id"
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none border-none p-0 focus:ring-0"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="flex items-center w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none border-none p-0 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 shrink-0 ml-1 cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-xl font-semibold text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Akun</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 dark:text-slate-500 font-medium">
                atau
              </span>
            </div>
          </div>

          {/* Google Sign-In */}
          <button
            id="btn-login-google"
            type="button"
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="w-full h-11 rounded-xl font-medium text-sm flex items-center justify-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
              <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
              <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
              <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"/>
            </svg>
            <span>Lanjut dengan Google</span>
          </button>

          {/* Register Link */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>

        {/* Feature Badges below the card */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1.5 text-center">
            <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Skripsi BAB I–V</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1.5 text-center">
            <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Jurnal IMRaD</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1.5 text-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>AI Pendamping</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl text-center py-2 text-xs text-slate-400 dark:text-slate-600">
        © 2026 YuuTA — Platform Asisten Penulisan Akademik Terstandar
      </footer>
    </div>
  );
}
