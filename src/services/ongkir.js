function beratVolumetrik(p, l, t) {
  return (p * l * t) / 6000;
}

function beratDihitung({ berat, p = 0, l = 0, t = 0 }) {
  return Math.ceil(Math.max(berat, beratVolumetrik(p, l, t)));
}

function hitungOngkir({ berat, p = 0, l = 0, t = 0, tarifPerKg }) {
  const kg = beratDihitung({ berat, p, l, t });
  return { berat_dihitung: kg, ongkir: kg * tarifPerKg };
}

module.exports = { beratVolumetrik, beratDihitung, hitungOngkir };