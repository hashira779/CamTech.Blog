"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

/* The adsbygoogle loader.

   lazyOnload: it starts only once the page has loaded and the browser is
   idle. Auto ads insert their own elements into the page, and if they do
   that before React has finished hydrating, the server HTML no longer
   matches (React error #418) and React throws the whole page away and
   renders it again on the client: a slow, janky start, worst on the
   wedding invitations. Loading after the page is ready avoids both.

   Not in the wedding editor's live preview frame: that is the couple's own
   working canvas, not a page anyone visits. */
export function AdsLoader({ src }: { src: string }) {
  const path = usePathname() || "";
  if (path.startsWith("/wedding/preview-frame")) return null;
  return <Script async src={src} crossOrigin="anonymous" strategy="lazyOnload" />;
}
