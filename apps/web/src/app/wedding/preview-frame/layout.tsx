import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wedding preview",
  robots: { index: false, follow: false },
};

export default function WeddingPreviewFrameLayout({ children }: { children: React.ReactNode }) {
  return children;
}
