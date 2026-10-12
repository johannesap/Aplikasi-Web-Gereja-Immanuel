// Asia/Jakarta = UTC+7 tanpa daylight saving, jadi offset tetap. Tidak bergantung pada dukungan Intl di Hermes.
const WIB_OFFSET = 7 * 3_600_000;
const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const pad = (n: number) => String(n).padStart(2, '0');
const wib = (iso: string) => new Date(new Date(iso).getTime() + WIB_OFFSET);
const sameWibDay = (a: string, b: string) => toWibInput(a).slice(0, 10) === toWibInput(b).slice(0, 10);

/** "Minggu, 12 Oktober 2026" */
export function formatDate(iso: string, withWeekday = true) {
  const d = wib(iso);
  const date = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  return withWeekday ? `${DAYS[d.getUTCDay()]}, ${date}` : date;
}

/** "09.00" */
export function formatClock(iso: string) {
  const d = wib(iso);
  return `${pad(d.getUTCHours())}.${pad(d.getUTCMinutes())}`;
}

/** "09.00 – 11.00 WIB", atau "09.00 WIB – Senin, 13 Oktober 2026 17.00 WIB" bila beda hari. */
export function formatTimeRange(startAt: string, endAt?: string | null) {
  if (!endAt) return `${formatClock(startAt)} WIB`;
  if (sameWibDay(startAt, endAt)) return `${formatClock(startAt)} – ${formatClock(endAt)} WIB`;
  return `${formatClock(startAt)} WIB – ${formatDate(endAt)} ${formatClock(endAt)} WIB`;
}

/** Untuk lencana tanggal: { day: "12", month: "Okt" } */
export function dateBadge(iso: string) {
  const d = wib(iso);
  return { day: String(d.getUTCDate()), month: MONTHS[d.getUTCMonth()].slice(0, 3) };
}

/** ISO → "2026-10-12 09:00" (WIB), untuk mengisi form. */
export function toWibInput(iso: string) {
  const d = wib(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

/** "2026-10-12 09:00" (WIB) → ISO UTC. Mengembalikan null bila format atau tanggal tidak valid. */
export function parseWibInput(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const utc = new Date(Date.UTC(y, mo - 1, d, h, mi) - WIB_OFFSET);
  // Menolak tanggal yang "bergeser", mis. 2026-02-30.
  return toWibInput(utc.toISOString()) === value.trim() ? utc.toISOString() : null;
}

export function isPast(startAt: string, endAt?: string | null, now = Date.now()) {
  return new Date(endAt || startAt).getTime() < now;
}
