// Lapisan database. Semua aturan bisnis dipanggil dari sini, divalidasi di server.
const db = require('../db');
const { HttpError } = require('../errors');
const { hitungOngkir } = require('./ongkir');
const { tanggalWIB, buatResi } = require('./resi');
const { validasiTransisi } = require('./status');

async function dalamTransaksi(fn) {
  const conn = await db.pool.getConnection();
  try {
    await conn.beginTransaction();
    const hasil = await fn(conn);
    await conn.commit();
    return hasil;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function ambilTarif(zona, conn = db.pool) {
  const [rows] = await conn.query('SELECT tarif_per_kg FROM tarif_zona WHERE zona = ?', [zona]);
  if (!rows.length) throw new HttpError(400, `Zona "${zona}" tidak dikenal`);
  return rows[0].tarif_per_kg;
}

async function hitung(input) {
  const tarifPerKg = await ambilTarif(input.zona);
  return hitungOngkir({ ...input, tarifPerKg });
}

async function buat(input) {
  return dalamTransaksi(async (conn) => {
    const tarifPerKg = await ambilTarif(input.zona, conn);
    const { ongkir } = hitungOngkir({ ...input, tarifPerKg });

    // Nomor urut per tanggal, aman dari balapan karena baris counter terkunci di transaksi ini.
    const tanggal = tanggalWIB();
    await conn.query(
      'INSERT INTO resi_counter (tanggal, terakhir) VALUES (?, LAST_INSERT_ID(1)) ' +
        'ON DUPLICATE KEY UPDATE terakhir = LAST_INSERT_ID(terakhir + 1)',
      [tanggal],
    );
    const [[{ n }]] = await conn.query('SELECT LAST_INSERT_ID() AS n');
    const resi = buatResi(tanggal, Number(n));

    const [res] = await conn.query(
      'INSERT INTO shipments (resi, pengirim, penerima, alamat_tujuan, zona, berat_kg, ' +
        'panjang_cm, lebar_cm, tinggi_cm, ongkir) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [resi, input.pengirim, input.penerima, input.alamat_tujuan, input.zona,
        input.berat, input.p, input.l, input.t, ongkir],
    );
    await conn.query(
      'INSERT INTO status_history (shipment_id, status, catatan) VALUES (?,?,?)',
      [res.insertId, 'DIBUAT', 'Pengiriman dibuat'],
    );
    return { resi, ongkir, status: 'DIBUAT' };
  });
}

async function ubahStatus(resi, status, catatan) {
  return dalamTransaksi(async (conn) => {
    const [rows] = await conn.query('SELECT id, status FROM shipments WHERE resi = ? FOR UPDATE', [resi]);
    if (!rows.length) throw new HttpError(404, 'Resi tidak ditemukan');
    const pesan = validasiTransisi(rows[0].status, status);
    if (pesan) throw new HttpError(422, pesan);
    await conn.query('UPDATE shipments SET status = ? WHERE id = ?', [status, rows[0].id]);
    await conn.query(
      'INSERT INTO status_history (shipment_id, status, catatan) VALUES (?,?,?)',
      [rows[0].id, status, catatan],
    );
    return { resi, status };
  });
}

async function lacak(resi) {
  const [rows] = await db.pool.query(
    'SELECT id, resi, pengirim, penerima, alamat_tujuan, status FROM shipments WHERE resi = ?', [resi],
  );
  if (!rows.length) throw new HttpError(404, 'Resi tidak ditemukan');
  const [history] = await db.pool.query(
    'SELECT status, catatan, created_at FROM status_history WHERE shipment_id = ? ORDER BY id', [rows[0].id],
  );
  const { id, ...data } = rows[0];
  return { ...data, history };
}

module.exports = { hitung, buat, ubahStatus, lacak };