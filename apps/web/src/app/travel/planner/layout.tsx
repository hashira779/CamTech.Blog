import type { Metadata } from "next";

const TITLE = "Cambodia trip planner — build a day-by-day itinerary";
const DESCRIPTION =
  "Choose a province, the days you have and what you enjoy, and get an editable day-by-day route built from the places in our Cambodia directory. Save it on your device, share a link or print it.";

// The planner page is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/travel/planner" },
  openGraph: { type: "website", url: "/travel/planner", title: TITLE, description: DESCRIPTION },
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
