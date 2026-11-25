import type { Metadata } from "next";
import { Geist_Mono, Great_Vibes } from "next/font/google";
import "./globals.css";

const greatVibes = Great_Vibes({
  weight: "400",
  subsets: ["latin", "cyrillic"],
  variable: "--font-great-vibes",
});

const geistMono = Geist_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Слово AI — Персональный AI-репетитор по русскому языку",
  description:
    "SaaS-платформа для изучения русского языка: этапы Начальный, Продвинутый и Эксперт, квизы, грамматика, Speaking, Listening и проверка произношения на базе Gemini 3.5 Flash Lite.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${greatVibes.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-mono bg-background text-foreground selection:bg-[#E19D29]/30 selection:text-[#2E3604]">
        {children}
      </body>
    </html>
  );
}
