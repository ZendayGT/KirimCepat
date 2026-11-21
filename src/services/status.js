const URUTAN = ['DIBUAT', 'DIJEMPUT', 'TRANSIT', 'DIANTAR', 'DITERIMA'];

function validasiTransisi(dari, ke) {
  if (!URUTAN.includes(ke)) return `Status "${ke}" tidak dikenal`;
  const i = URUTAN.indexOf(dari);
  const j = URUTAN.indexOf(ke);
  if (j === i) return `Status sudah ${dari}`;
  if (j < i) return `Status tidak boleh mundur dari ${dari} ke ${ke}`;
  if (j > i + 1) return `Status tidak boleh melompat dari ${dari} ke ${ke}`;
  return null;
}

const bolehPindah = (dari, ke) => validasiTransisi(dari, ke) === null;

module.exports = { URUTAN, validasiTransisi, bolehPindah };