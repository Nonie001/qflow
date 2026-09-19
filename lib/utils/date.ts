const BANGKOK_TZ = "Asia/Bangkok";

/** Today's date in Asia/Bangkok, formatted as YYYY-MM-DD (matches Postgres `date`). */
export function todayInBangkok(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BANGKOK_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function formatTimeTH(iso: string | null): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: BANGKOK_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** Duration in whole minutes between two ISO timestamps. */
export function diffMinutes(startIso: string, endIso: string): number {
  return Math.max(
    0,
    Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000),
  );
}
