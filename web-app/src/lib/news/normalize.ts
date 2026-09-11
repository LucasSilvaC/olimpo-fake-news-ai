export function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  return value.replace(/\s+/g, " ").trim() || null;
}

export function contentText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function names(value: unknown): string[] {
  const entries = Array.isArray(value) ? value : [value];
  return [
    ...new Set(
      entries
        .map((item) => cleanText(typeof item === "string" ? item : asRecord(item)?.name))
        .filter((item): item is string => Boolean(item)),
    ),
  ];
}

export function absoluteUrl(value: unknown, base: string): string | null {
  const text = cleanText(value);
  if (!text) return null;
  try {
    const url = new URL(text, base);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function dateText(value: unknown): string | null {
  const text = cleanText(value);
  if (!text || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(text) || !Number.isFinite(Date.parse(text)))
    return null;
  return text;
}
