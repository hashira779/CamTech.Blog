import React from "react";
import { escapeJsonForScript } from "@/lib/sanitize";

export interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
  id?: string;
}

/**
 * Structured data for search engines.
 *
 * The payload routinely contains an article title or place name taken from a wire feed, and this
 * element is written with `dangerouslySetInnerHTML`, so `JSON.stringify` alone was not enough: it
 * escapes quotes but not `<`, and a title containing `</script>` closed the script element and
 * turned the rest of the string into live markup in the document head.
 */
export function JsonLd({ data, id }: JsonLdProps) {
  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeJsonForScript(data) }}
    />
  );
}

export default JsonLd;
