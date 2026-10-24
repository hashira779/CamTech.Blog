"use client";

import { SectionHeader } from "@/components/ui/section-header";
import { useJourneyCopy } from "./copy";

type Chapter = "attractions" | "provinces" | "transport" | "guides" | "events";

/**
 * The page's section headings in the reader's language. The page itself is a server component,
 * so the copy table is read here and the existing `SectionHeader` does the drawing.
 */
export function JourneyHeader({ chapter, count = 0 }: { chapter: Chapter; count?: number }) {
  const { copy } = useJourneyCopy();
  switch (chapter) {
    case "attractions":
      return (
        <SectionHeader
          category="travel"
          label={copy.attractionsLabel}
          title={copy.attractionsTitle}
          description={copy.attractionsLead}
          actionHref="/travel/siem-reap?type=TEMPLE,ATTRACTION"
          actionLabel={copy.allAttractions}
        />
      );
    case "provinces":
      return (
        <SectionHeader
          category="travel"
          label={copy.exploreLabel}
          title={copy.exploreTitle}
          description={copy.exploreLead(count)}
        />
      );
    case "transport":
      return (
        <SectionHeader
          category="transport"
          label={copy.transportLabel}
          title={copy.transportTitle}
          description={copy.transportLead(count)}
          actionHref="/travel/transport"
          actionLabel={copy.allRoutes}
        />
      );
    case "guides":
      return <SectionHeader category="travel" label={copy.guidesLabel} title={copy.guidesTitle} description={copy.guidesLead} />;
    case "events":
      return (
        <SectionHeader category="travel" label={copy.eventsLabel} title={copy.eventsTitle} description={copy.eventsLead(count)} />
      );
  }
}
