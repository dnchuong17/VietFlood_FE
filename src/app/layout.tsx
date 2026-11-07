import type { Metadata } from "next";
import { Be_Vietnam_Pro, Merriweather } from "next/font/google";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-body",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  fallback: ["Segoe UI", "Arial", "Helvetica", "sans-serif"],
});

const merriweather = Merriweather({
  variable: "--font-heading",
  subsets: ["latin", "vietnamese"],
  weight: ["700", "900"],
  display: "swap",
  fallback: ["Georgia", "Times New Roman", "serif"],
});

export const metadata: Metadata = {
  title: "VietFlood Insight",
  description: "Nền tảng frontend phục vụ phân tích tình hình lũ lụt tại Việt Nam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${beVietnamPro.variable} ${merriweather.variable} min-h-screen bg-slate-100 [font-family:var(--font-body)] text-slate-900 antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
