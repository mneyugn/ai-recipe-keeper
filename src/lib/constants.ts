/**
 * The list of allowed tags that can be suggested by the AI and assigned to recipes.
 */
export const ALLOWED_TAGS = [
  "obiad",
  "śniadanie",
  "kolacja",
  "deser",
  "ciasto",
  "zupa",
  "makaron",
  "mięso",
  "ryby",
  "wegetariańskie",
  "wegańskie",
  "latwe",
  "szybkie",
  "trudne",
] as const;

/**
 * A list of supported domains for URL-based recipe extraction.
 */
export const SUPPORTED_URL_DOMAINS = ["aniagotuje.pl", "kwestiasmaku.com"] as const;

// types
export type AllowedTag = (typeof ALLOWED_TAGS)[number];
export type SupportedUrlDomain = (typeof SUPPORTED_URL_DOMAINS)[number];
