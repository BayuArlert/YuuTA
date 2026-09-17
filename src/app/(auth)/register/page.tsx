"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { ThemeToggle } from "@/components/providers/ThemeProvider";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Kata sandi minimal harus 8 karakter.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Pendaftaran gagal. Silakan coba lagi.");
        setLoading(false);
        return;
      }

      // Auto login setelah register
      const loginRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Terjadi gangguan saat memproses akun. Silakan coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Top Header */}
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

      {/* Main Centered Card */}
      <main className="w-full max-w-[440px] my-auto py-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-7 sm:p-9 shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mb-3 border border-sky-100 dark:border-sky-900/50">
              <Sparkles className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Daftar Akun Baru
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Mulai kelola draf skripsi & artikel jurnal Anda
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3 rounded-xl text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label
                htmlFor="reg-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Nama Lengkap
              </label>
              <div className="flex items-center w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
                <input
                  id="reg-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Contoh: Budi Santoso"
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none border-none p-0 focus:ring-0"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="reg-email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Alamat Email
              </label>
              <div className="flex items-center w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
                <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="budi@kampus.ac.id"
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none border-none p-0 focus:ring-0"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="reg-password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Kata Sandi
              </label>
              <div className="flex items-center w-full h-11 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus-within:border-sky-500 dark:focus-within:border-sky-400 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-sky-500/20 transition-all">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 mr-2.5" />
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Minimal 8 karakter"
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none border-none p-0 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 shrink-0 ml-1 cursor-pointer"
                  title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                <CheckCircle2
                  className={`w-3.5 h-3.5 ${
                    password.length >= 8 ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"
                  }`}
                />
                <span>Panjang sandi minimal 8 karakter</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-register"
              type="submit"
              disabled={loading}
              className="w-full h-11 mt-2 rounded-xl font-semibold text-sm bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-600/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <>
                  <span>Daftar Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-sky-600 dark:text-sky-400 hover:underline"
            >
              Masuk di sini
            </Link>
          </p>
        </div>

        {/* Feature Badges below the card */}
        <div className="grid grid-cols-3 gap-3 mt-6 text-center">
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1">
            <GraduationCap className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Skripsi BAB I–V</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1">
            <BookOpen className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Jurnal IMRaD</span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 flex flex-col items-center gap-1">
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
