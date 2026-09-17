import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "YuuTA — Asisten Penulisan Akademik",
    template: "%s | YuuTA",
  },
  description:
    "YuuTA membantu kamu menyusun outline, memberi pertanyaan pemandu, dan mengecek konsistensi jurnal ilmiah dan skripsi. AI sebagai pendamping, bukan penulis pengganti.",
  keywords: ["skripsi", "jurnal", "penulisan akademik", "outline", "IMRaD", "AI"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${inter.variable} ${plusJakartaSans.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
