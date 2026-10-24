"use client";

import React, { useEffect, useState } from "react";
import { WeddingCard } from "@/types/wedding";
import { PremierRoyalKhmerCard } from "@/components/wedding/PremierRoyalKhmerCard";

/* Live preview canvas for the wedding editor. The editor embeds this page in
   an iframe so the card renders at a real device width (its vw sizes and md:
   breakpoints follow the frame, not the editor window), and streams the draft
   card in with postMessage. Only messages from this same origin are accepted. */
export default function WeddingPreviewFramePage() {
  const [card, setCard] = useState<WeddingCard | null>(null);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== window.parent) return;
      const data = e.data as { type?: string; card?: WeddingCard };
      if (data?.type === "wedding-preview:card" && data.card && typeof data.card === "object") {
        setCard(data.card);
      } else if (data?.type === "wedding-preview:top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "wedding-preview:ready" }, window.location.origin);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  if (!card) {
    return <div className="min-h-screen bg-[#f4eee3]" />;
  }
  return <PremierRoyalKhmerCard card={card} isPreview={true} />;
}
