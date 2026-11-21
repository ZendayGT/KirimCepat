const POLA = /^KC\d{8}\d{6}$/;

function tanggalWIB(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function buatResi(tanggal, urut) {
  if (!Number.isInteger(urut) || urut < 1 || urut > 999999) {
    throw new RangeError('Nomor urut resi harus 1 sampai 999999');
  }
  return 'KC' + tanggal.replace(/-/g, '') + String(urut).padStart(6, '0');
}

const resiValid = (resi) => POLA.test(resi);

module.exports = { tanggalWIB, buatResi, resiValid };