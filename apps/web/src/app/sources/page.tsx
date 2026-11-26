import { getSources } from "@/lib/api";
import { SourcesClient } from "@/components/sources/SourcesClient";

export const revalidate = 60;

export default async function SourcesDirectoryPage() {
  const sources = await getSources();
  const rows = [...(sources || [])].sort(
    (a, b) => a.country.localeCompare(b.country) || a.name.localeCompare(b.name)
  );
  const jurisdictions = new Set(rows.map((source) => source.country).filter(Boolean)).size;

  return <SourcesClient rows={rows} jurisdictions={jurisdictions} />;
}
