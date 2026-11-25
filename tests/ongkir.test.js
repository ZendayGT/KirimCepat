const { hitungOngkir, beratDihitung } = require('../src/services/ongkir');

describe('Aturan bisnis: ongkir', () => {
  test('berat 1,2 kg dibulatkan ke atas menjadi 2 kg', () => {
    expect(hitungOngkir({ berat: 1.2, tarifPerKg: 8000 })).toEqual({ berat_dihitung: 2, ongkir: 16000 });
  });

  test('berat pas 2 kg tidak naik menjadi 3 kg', () => {
    expect(beratDihitung({ berat: 2 })).toBe(2);
  });

  test('berat volumetrik dipakai bila lebih besar dari berat aktual', () => {
    // 50x40x30 = 60000 / 6000 = 10 kg, lebih besar dari 1 kg
    expect(hitungOngkir({ berat: 1, p: 50, l: 40, t: 30, tarifPerKg: 12000 }))
      .toEqual({ berat_dihitung: 10, ongkir: 120000 });
  });

  test('berat aktual dipakai bila lebih besar dari volumetrik', () => {
    // 10x10x10 = 1000 / 6000 = 0,17 kg, kalah dari 5 kg
    expect(beratDihitung({ berat: 5, p: 10, l: 10, t: 10 })).toBe(5);
  });

  test('berat volumetrik pecahan dibulatkan ke atas', () => {
    // 30x30x30 = 27000 / 6000 = 4,5 kg menjadi 5 kg
    expect(beratDihitung({ berat: 1, p: 30, l: 30, t: 30 })).toBe(5);
  });

  test('ongkir mengikuti tarif zona', () => {
    expect(hitungOngkir({ berat: 3, tarifPerKg: 18000 }).ongkir).toBe(54000);
  });
});