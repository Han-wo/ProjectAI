import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LLM Fullstack Control Room",
  description: "Next.js + NestJS 기반 LLM 실험 환경"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
