import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "OWASP.WTF - AI-Powered Security Auditing",
  description:
    "Scan any codebase for OWASP vulnerabilities in seconds. AI-powered static analysis that actually understands your code.",
  keywords: [
    "OWASP",
    "security",
    "vulnerability scanner",
    "static analysis",
    "AI security",
    "code audit",
  ],
  openGraph: {
    title: "OWASP.WTF - AI-Powered Security Auditing",
    description:
      "Scan any codebase for OWASP vulnerabilities in seconds. AI-powered static analysis that actually understands your code.",
    type: "website",
    url: "https://owasp.wtf",
  },
  twitter: {
    card: "summary_large_image",
    title: "OWASP.WTF - AI-Powered Security Auditing",
    description:
      "Scan any codebase for OWASP vulnerabilities in seconds. AI-powered static analysis that actually understands your code.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
    >
      <body className="min-h-screen bg-bg-primary font-[family-name:var(--font-inter)] text-text-primary antialiased">
        {children}
      </body>
    </html>
  );
}
