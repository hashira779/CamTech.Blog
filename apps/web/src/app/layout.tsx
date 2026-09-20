import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/layout/ConsentBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Daily Discovery | Cambodia & World News, Visual Explanations & Tools",
  description: "A modern discovery, news, and utility platform providing verified Cambodia and international news, visual explanations, quizzes, and everyday tools.",
  metadataBase: new URL("http://localhost:3000"),
  openGraph: {
    title: "Daily Discovery",
    description: "Verified news, visual science discoveries, daily quizzes, and functional tools.",
    siteName: "Daily Discovery",
    locale: "en_US",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 antialiased selection:bg-rose-500 selection:text-white transition-colors duration-200`}>
        <ThemeProvider>
          <I18nProvider>
            <Header />
            <main className="flex-1 w-full">{children}</main>
            <Footer />
            <ConsentBanner />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
