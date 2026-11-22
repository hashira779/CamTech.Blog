"use client";

import Script from "next/script";

/* The adsbygoogle loader.

   lazyOnload: it starts only once the page has loaded and the browser is
   idle. Auto ads insert their own elements into the page, and if they do
   that before React has finished hydrating, the server HTML no longer
   matches (React error #418) and React throws the whole page away and
   renders it again on the client: a slow, janky start, worst on the
   reading pages. Loading after the page is ready avoids both. */
export function AdsLoader({ src }: { src: string }) {
  return <Script async src={src} crossOrigin="anonymous" strategy="lazyOnload" />;
}
