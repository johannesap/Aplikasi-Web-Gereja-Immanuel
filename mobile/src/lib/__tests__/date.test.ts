import { formatDate, formatTimeRange, isPast, parseWibInput, toWibInput } from '../date';

describe('tanggal WIB', () => {
  it('menampilkan waktu dalam Asia/Jakarta (UTC+7)', () => {
    // 2026-10-11 17:30 UTC = Senin 12 Oktober 2026 00.30 WIB
    expect(formatDate('2026-10-11T17:30:00Z')).toBe('Senin, 12 Oktober 2026');
    expect(formatTimeRange('2026-10-11T17:30:00Z')).toBe('00.30 WIB');
  });

  it('rentang waktu di hari yang sama dan berbeda hari', () => {
    expect(formatTimeRange('2026-12-24T11:00:00Z', '2026-12-24T13:00:00Z')).toBe('18.00 – 20.00 WIB');
    expect(formatTimeRange('2026-12-24T11:00:00Z', '2026-12-25T03:00:00Z')).toBe('18.00 WIB – Jumat, 25 Desember 2026 10.00 WIB');
  });

  it('input form WIB bolak-balik ke ISO', () => {
    expect(parseWibInput('2026-12-24 18:00')).toBe('2026-12-24T11:00:00.000Z');
    expect(toWibInput('2026-12-24T11:00:00.000Z')).toBe('2026-12-24 18:00');
  });

  it('menolak format atau tanggal yang tidak valid', () => {
    expect(parseWibInput('24-12-2026 18:00')).toBeNull();
    expect(parseWibInput('2026-02-30 10:00')).toBeNull();
    expect(parseWibInput('2026-12-24 25:00')).toBeNull();
  });

  it('acara dianggap selesai berdasarkan waktu selesai bila ada', () => {
    const now = Date.parse('2026-10-12T00:00:00Z');
    expect(isPast('2026-10-11T00:00:00Z', null, now)).toBe(true);
    expect(isPast('2026-10-11T00:00:00Z', '2026-10-13T00:00:00Z', now)).toBe(false);
  });
});
