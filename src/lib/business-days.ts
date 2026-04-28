// Add N business days to a date, skipping Sat/Sun. Doesn't account for SA
// public holidays — rare enough that we manually message customers if a
// timeline lands on a holiday.

export function addBusinessDays(start: Date, n: number): Date {
  const out = new Date(start);
  let added = 0;
  while (added < n) {
    out.setDate(out.getDate() + 1);
    const day = out.getDay();
    if (day !== 0 && day !== 6) added += 1;   // 0 = Sun, 6 = Sat
  }
  return out;
}

export function formatSaDate(d: Date): string {
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg",
    weekday: "short",
    day:     "numeric",
    month:   "short",
  }).format(d);
}
