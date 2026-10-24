import { Moul } from "next/font/google";

/* Moul, the Khmer display face of the invitations, self-hosted by next/font
   for the /wedding routes only. It used to come from a render-blocking
   Google Fonts stylesheet in the root layout, loaded on every page of the
   site though only the wedding pages use it. */
const moul = Moul({
  weight: "400",
  // Moul only ever sets Khmer here; Latin falls through to the stack
  subsets: ["khmer"],
  variable: "--font-moul",
  display: "swap",
});

export default function WeddingLayout({ children }: { children: React.ReactNode }) {
  return <div className={`${moul.variable} contents`}>{children}</div>;
}
