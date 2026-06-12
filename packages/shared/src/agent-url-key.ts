const AGENT_URL_KEY_DELIM_RE = /[^a-z0-9]+/g;
const AGENT_URL_KEY_TRIM_RE = /^-+|-+$/g;
const NON_ASCII_RE = /[^\x00-\x7F]/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuidLike(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  return UUID_RE.test(value.trim());
}

export function normalizeAgentUrlKey(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(AGENT_URL_KEY_DELIM_RE, "-")
    .replace(AGENT_URL_KEY_TRIM_RE, "");
  return normalized.length > 0 ? normalized : null;
}

/** Check whether a string contains non-ASCII characters that normalization would strip. */
export function hasNonAsciiContent(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  return NON_ASCII_RE.test(value);
}

/** Extract the first 8 hex chars from a valid UUID, or null. */
function shortIdFromUuid(value: string | null | undefined): string | null {
  if (typeof value !== "string" || !UUID_RE.test(value.trim())) return null;
  return value.trim().replace(/-/g, "").slice(0, 8).toLowerCase();
}

export function deriveAgentUrlKey(name: string | null | undefined, fallback?: string | null): string {
  const base = normalizeAgentUrlKey(name);
  if (base && !hasNonAsciiContent(name)) return base;
  // Non-ASCII content was stripped — append short UUID suffix for uniqueness.
  const shortId = shortIdFromUuid(fallback);
  if (base && shortId) return `${base}-${shortId}`;
  if (shortId) return shortId;
  return base ?? normalizeAgentUrlKey(fallback) ?? "agent";
}