import type { Metadata } from "next";
import { Fraunces, Inter, Kantumruy_Pro } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { escapeJsonForScript } from "@/lib/sanitize";
import { getAdsenseClient, getAdsenseScriptUrl } from "@/lib/ads";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BackToTop } from "@/components/layout/BackToTop";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import NextTopLoader from "nextjs-toploader";
import { PageTransition } from "@/components/layout/PageTransition";
import { AdsLoader } from "@/components/ads/AdsLoader";

/* Self-hosted by next/font, so the browser never calls Google. Kantumruy Pro
   rides in the same stack as a per-glyph fallback: Inter has no Khmer glyphs,
   so Khmer copy falls through to it automatically without lang-specific CSS.
   The variable names are deliberately not --font-sans / --font-display, which
   the @theme block owns. */
const ui = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  axes: ["opsz"],
  display: "swap",
});

const khmer = Kantumruy_Pro({
  subsets: ["khmer", "latin"],
  variable: "--font-khmer",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://blog.camtech.cam";

const siteName = "CamTech.Blog";
const siteDescription =
  "Cambodia and world news with source attribution, plus travel guides to all 25 provinces, daily quizzes and everyday web tools.";

// Null on any build that has no valid publisher account, which is what stops the verification
// meta tag and the adsbygoogle loader from being emitted at all. See src/lib/ads.ts.
const adsenseClient = getAdsenseClient();
const adsenseScriptUrl = getAdsenseScriptUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Cambodia & World News, Travel Guides and Tools`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    "Cambodia News",
    "World News",
    "CamTech",
    "Cambodia Travel Guides",
    "Science Visualizations",
    "Online Tools",
    "Daily Quiz",
  ],
  authors: [{ name: `${siteName} Editorial` }],
  creator: siteName,
  publisher: siteName,
  openGraph: {
    title: `${siteName} — Cambodia & World News, Travel Guides and Tools`,
    description: siteDescription,
    siteName,
    locale: "en_US",
    type: "website",
    url: siteUrl,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${siteName} — verified Cambodia and world news, travel guides and tools`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} — Cambodia & World News, Travel Guides and Tools`,
    description: siteDescription,
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
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/logo.png" },
    ],
  },
  other: adsenseClient ? { "google-adsense-account": adsenseClient } : {},
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${ui.variable} ${display.variable} ${khmer.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* The adsbygoogle loader. It carries the account in its query string, which is also what
            turns on Auto ads for the account, so it is emitted only when the publisher ID in this
            build validates. The verification meta tag comes from `metadata.other` above rather than
            being written twice. It loads once the page is ready (see AdsLoader). */}
        {adsenseScriptUrl && <AdsLoader src={adsenseScriptUrl} />}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: escapeJsonForScript({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: siteName,
              alternateName: "CamTech Blog",
              url: siteUrl,
              potentialAction: {
                "@type": "SearchAction",
                target: `${siteUrl}/search?q={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* Two things before first paint: this browser can run scripts (so scroll-reveal is
            allowed to hold content back — see `.dd-reveal`), and the saved theme. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var r=document.documentElement;r.classList.add('js');try{var t=localStorage.getItem('dd_theme');var d=t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){r.classList.add('dark');r.classList.remove('light');r.setAttribute('data-theme','dark');r.style.colorScheme='dark';}else{r.classList.remove('dark');r.classList.add('light');r.setAttribute('data-theme','light');r.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased transition-colors duration-200">
        <NextTopLoader
          color="var(--accent)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={2}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow={false}
          zIndex={1600}
        />
        <ThemeProvider>
          <I18nProvider>
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
              Skip to content
            </a>
            <Header />
            <PageTransition>
              <main id="main" className="flex w-full flex-1 flex-col">
                {children}
              </main>
            </PageTransition>
            <Footer />
            <BackToTop />
            <ConsentBanner />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
