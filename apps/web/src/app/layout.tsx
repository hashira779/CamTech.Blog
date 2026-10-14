import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import NextTopLoader from "nextjs-toploader";
import { PageTransition } from "@/components/layout/PageTransition";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blog.camtech.cam";

export const metadata: Metadata = {
  title: "Daily Discovery | Cambodia & World News, Visual Explanations & Tools",
  description: "A modern discovery, news, and utility platform providing verified Cambodia and international news, visual explanations, quizzes, and everyday tools.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Daily Discovery",
    description: "Verified news, visual science discoveries, daily quizzes, and functional tools.",
    siteName: "Daily Discovery",
    locale: "en_US",
    type: "website",
    url: siteUrl,
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Daily Discovery",
              "alternateName": "CamTech Blog",
              "url": siteUrl,
              "potentialAction": {
                "@type": "SearchAction",
                "target": `${siteUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID && process.env.NEXT_PUBLIC_ADSENSE_ENABLED === "true" && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#FAF9F6] text-neutral-900 antialiased selection:bg-neutral-900 selection:text-white transition-colors duration-200`}>
        <NextTopLoader
          color="#0ea5e9"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #0ea5e9,0 0 5px #0ea5e9"
          zIndex={1600}
        />
        <ThemeProvider>
          <I18nProvider>
            <Header />
            <PageTransition>
              <main className="flex-1 w-full flex flex-col">{children}</main>
            </PageTransition>
            <Footer />
            <ConsentBanner />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
