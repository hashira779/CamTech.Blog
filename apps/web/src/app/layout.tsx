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
  metadataBase: new URL(siteUrl),
  title: {
    default: "Daily Discovery | Cambodia & World News, Visual Explanations & Tools",
    template: "%s | Daily Discovery",
  },
  description: "A modern discovery, news, and utility platform providing verified Cambodia and international news, visual explanations, quizzes, and everyday tools.",
  keywords: [
    "Cambodia News",
    "World News",
    "CamTech",
    "Daily Discovery",
    "Science Visualizations",
    "Online Tools",
    "Daily Quiz",
    "Cambodia Travel Guides",
  ],
  authors: [{ name: "Daily Discovery Editorial Desk" }],
  creator: "Daily Discovery",
  publisher: "Daily Discovery",
  openGraph: {
    title: "Daily Discovery | Cambodia & World News, Visual Explanations & Tools",
    description: "A modern discovery, news, and utility platform providing verified Cambodia and international news, visual explanations, quizzes, and everyday tools.",
    siteName: "Daily Discovery",
    locale: "en_US",
    type: "website",
    url: siteUrl,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Daily Discovery - Verified News, Science Discoveries & Tools",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daily Discovery | Cambodia & World News, Visual Explanations & Tools",
    description: "A modern discovery, news, and utility platform providing verified Cambodia and international news, visual explanations, quizzes, and everyday tools.",
    creator: "@camtechblog",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('dd_theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');r.classList.remove('light');r.setAttribute('data-theme','dark');r.style.colorScheme='dark';}else{r.classList.remove('dark');r.classList.add('light');r.setAttribute('data-theme','light');r.style.colorScheme='light';}}catch(e){}})();`
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
      <body className={`${inter.className} min-h-screen flex flex-col bg-[#FAF9F6] dark:bg-[#090d16] text-neutral-900 dark:text-slate-100 antialiased selection:bg-teal-600 selection:text-white transition-colors duration-200`}>
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
