const { buatResi, tanggalWIB, resiValid } = require('../src/services/resi');

describe('Aturan bisnis: nomor resi', () => {
  test('format KC + tanggal + 6 digit urut', () => {
    expect(buatResi('2026-11-17', 1)).toBe('KC20261117000001');
    expect(buatResi('2026-11-17', 123456)).toBe('KC20261117123456');
  });

  test('resi hasil buat selalu lolos validasi format', () => {
    expect(resiValid(buatResi('2026-11-17', 42))).toBe(true);
    expect(resiValid('KC2026111700001')).toBe(false);
    expect(resiValid('XX20261117000001')).toBe(false);
  });

  test('1000 nomor urut berbeda menghasilkan 1000 resi unik', () => {
    const set = new Set();
    for (let i = 1; i <= 1000; i += 1) set.add(buatResi('2026-11-17', i));
    expect(set.size).toBe(1000);
  });

  test('nomor urut di luar 1-999999 ditolak', () => {
    expect(() => buatResi('2026-11-17', 0)).toThrow(RangeError);
    expect(() => buatResi('2026-11-17', 1000000)).toThrow(RangeError);
  });

  test('tanggal memakai zona WIB, bukan UTC', () => {
    // 20:00 UTC tanggal 16 = 03:00 WIB tanggal 17
    expect(tanggalWIB(new Date('2026-11-16T20:00:00Z'))).toBe('2026-11-17');
  });
});