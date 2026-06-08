import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "Project J - 数字成长花园",
  description: "父子共同建造、共同维护的数字成长空间。Build A Kingdom, Become A Better Human.",
  keywords: ["成长记录", "父子共创", "世界观设定", "帝国实验室", "梦想档案"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-parchment-pattern">
        <Navbar />
        <main className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-book-border/40 py-6 text-center text-[11px] text-ink/40 font-serif">
          © {new Date().getFullYear()} Project J. Build A Kingdom, Become A Better Human.
        </footer>
      </body>
    </html>
  );
}

