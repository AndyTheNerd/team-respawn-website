/**
 * Blog posts use `YYYY-MM-DD` for `dateIso`. Schema.org / Google JSON-LD
 * expects datetimes with an explicit timezone (e.g. `...Z`) for fields like
 * `VideoObject.uploadDate`.
 */
export function toSchemaDateTimeUtc(isoLike: string): string {
  const s = isoLike.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return `${s}T00:00:00.000Z`;
  }
  const ms = Date.parse(s);
  if (!Number.isNaN(ms)) {
    return new Date(ms).toISOString();
  }
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return `${m[1]}T00:00:00.000Z`;
  return s;
}
