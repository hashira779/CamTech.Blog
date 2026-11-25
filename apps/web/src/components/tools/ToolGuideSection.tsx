"use client";

import { useI18n } from "@/lib/i18n";
import { resolveToolGuide } from "@/lib/tool-guides";

/**
 * Shared bilingual guide section for `/cv-builder` and `/tools/[slug]`.
 */
export function ToolGuideSection({ slug, headingId = "tool-guide-title" }: { slug: string; headingId?: string }) {
  const { lang } = useI18n();
  const isKm = lang === "km";
  const resolved = resolveToolGuide(slug, lang);

  if (!resolved) return null;

  return (
    <section className="field-tool-guide" aria-labelledby={headingId}>
      <p className="field-eyebrow">{isKm ? "ការណែនាំរហ័ស" : "A quick guide"}</p>
      <h2 id={headingId}>{resolved.title}</h2>
      <p>{resolved.intro}</p>
      <ol>
        {resolved.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <aside>
        <strong>{isKm ? "គួរដឹងបន្ថែម" : "Good to know"}</strong>
        <p>{resolved.note}</p>
      </aside>
    </section>
  );
}
