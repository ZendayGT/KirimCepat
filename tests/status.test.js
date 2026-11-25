const { validasiTransisi, bolehPindah } = require('../src/services/status');

describe('Aturan bisnis: status hanya maju', () => {
  test('maju satu langkah diizinkan', () => {
    expect(bolehPindah('DIBUAT', 'DIJEMPUT')).toBe(true);
    expect(bolehPindah('TRANSIT', 'DIANTAR')).toBe(true);
    expect(bolehPindah('DIANTAR', 'DITERIMA')).toBe(true);
  });

  test('melompat status ditolak', () => {
    expect(bolehPindah('DIBUAT', 'TRANSIT')).toBe(false);
    expect(validasiTransisi('DIBUAT', 'TRANSIT')).toMatch(/melompat/);
  });

  test('mundur ditolak', () => {
    expect(bolehPindah('TRANSIT', 'DIJEMPUT')).toBe(false);
    expect(validasiTransisi('TRANSIT', 'DIJEMPUT')).toMatch(/mundur/);
  });

  test('status yang sama ditolak', () => {
    expect(bolehPindah('TRANSIT', 'TRANSIT')).toBe(false);
  });

  test('status tidak dikenal ditolak', () => {
    expect(validasiTransisi('DIBUAT', 'HILANG')).toMatch(/tidak dikenal/);
  });

  test('DITERIMA adalah status akhir', () => {
    expect(bolehPindah('DITERIMA', 'DIBUAT')).toBe(false);
  });
});