const { HttpError } = require('./errors');

const MAX_BERAT = 1000; // kg
const MAX_UKURAN = 300; // cm

const bad = (msg) => new HttpError(400, msg);
const angka = (v) => (v === undefined || v === null || v === '' ? NaN : Number(v));

function validasiUkuran(body = {}) {
  const berat = angka(body.berat);
  if (!Number.isFinite(berat) || berat <= 0) throw bad('Berat harus berupa angka lebih dari 0');
  if (berat > MAX_BERAT) throw bad(`Berat maksimal ${MAX_BERAT} kg`);

  const dim = {};
  for (const [k, label] of [['p', 'panjang'], ['l', 'lebar'], ['t', 'tinggi']]) {
    const v = body[k] === undefined || body[k] === '' ? 0 : angka(body[k]);
    if (!Number.isFinite(v) || v < 0) throw bad(`Ukuran ${label} tidak valid`);
    if (v > MAX_UKURAN) throw bad(`Ukuran ${label} maksimal ${MAX_UKURAN} cm`);
    dim[k] = v;
  }

  const zona = String(body.zona ?? '').trim().toLowerCase();
  if (!zona) throw bad('Zona wajib diisi');
  return { berat, ...dim, zona };
}

function teks(body, key, label, max) {
  const v = String(body[key] ?? '').trim();
  if (!v) throw bad(`${label} wajib diisi`);
  if (v.length > max) throw bad(`${label} maksimal ${max} karakter`);
  return v;
}

function validasiPengiriman(body = {}) {
  const ukuran = validasiUkuran(body);
  return {
    ...ukuran,
    pengirim: teks(body, 'pengirim', 'Pengirim', 100),
    penerima: teks(body, 'penerima', 'Penerima', 100),
    alamat_tujuan: teks(body, 'alamat_tujuan', 'Alamat tujuan', 255),
  };
}

function validasiStatus(body = {}) {
  const status = String(body.status ?? '').trim().toUpperCase();
  if (!status) throw bad('Status wajib diisi');
  const catatan = String(body.catatan ?? '').trim();
  if (catatan.length > 255) throw bad('Catatan maksimal 255 karakter');
  return { status, catatan: catatan || null };
}

module.exports = { validasiUkuran, validasiPengiriman, validasiStatus };