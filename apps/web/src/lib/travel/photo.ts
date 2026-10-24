/**
 * Photograph provenance helpers for place rows.
 *
 * Audit, October 2026: 93 of the 120 place rows use their province's cover photograph
 * (`/images/destinations/<province>.jpg`) as their own `hero_image_url` — Koh Ker shows the
 * Preah Vihear cover, Long Set Beach the Sihanoukville one. The rows are left as they are (a
 * design change does not rewrite the directory); the interface labels such a picture as the
 * province's, keeps it out of feature slots, and does not count it as a photograph of the place.
 */
export function isProvinceStandIn(src?: string | null): boolean {
  return typeof src === "string" && src.startsWith("/images/destinations/");
}

/** Verification states that may carry the green "checked" mark. */
export function isVerifiedStatus(status?: string | null): boolean {
  return status === "VERIFIED" || status === "GROUND_VERIFIED";
}
