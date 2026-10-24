/* Links end up in public hrefs and srcs, so only plain web URLs are accepted
   (blocks javascript:, data: and friends). Relative upload paths are allowed. */
export function isSafeUrl(value?: string | null): boolean {
  if (!value) return true;
  const v = value.trim();
  if (v.startsWith("/") && !v.startsWith("//")) return true;
  try {
    const u = new URL(v);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}
