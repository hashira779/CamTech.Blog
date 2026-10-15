import type { Metadata } from "next";
import { Fraunces, Inter, Kantumruy_Pro } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme";
import { escapeJsonForScript } from "@/lib/sanitize";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ConsentBanner } from "@/components/layout/ConsentBanner";
import NextTopLoader from "nextjs-toploader";
import { PageTransition } from "@/components/layout/PageTransition";

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
  other: {
    "google-adsense-account": "ca-pub-1311307969887065",
  },
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
        {/* Google AdSense Account Verification */}
        <meta
          name="google-adsense-account"
          content="ca-pub-1311307969887065"
        />
        {/* Google AdSense Script for Site Approval & Auto Ads */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1311307969887065"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
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
            <ConsentBanner />
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
