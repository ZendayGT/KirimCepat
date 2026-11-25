const express = require('express');
const svc = require('./services/shipments');
const { resiValid } = require('./services/resi');
const { HttpError } = require('./errors');
const { validasiUkuran, validasiPengiriman, validasiStatus } = require('./validasi');

const router = express.Router();
const wrap = (fn) => (req, res, next) => fn(req, res).catch(next);

function ambilResi(req) {
  const resi = String(req.params.resi || '').trim().toUpperCase();
  if (!resiValid(resi)) throw new HttpError(404, 'Resi tidak ditemukan');
  return resi;
}

router.post('/ongkir', wrap(async (req, res) => {
  res.json(await svc.hitung(validasiUkuran(req.body)));
}));

router.post('/shipments', wrap(async (req, res) => {
  res.status(201).json(await svc.buat(validasiPengiriman(req.body)));
}));

router.patch('/shipments/:resi/status', wrap(async (req, res) => {
  const resi = ambilResi(req);
  const { status, catatan } = validasiStatus(req.body);
  res.json(await svc.ubahStatus(resi, status, catatan));
}));

router.get('/track/:resi', wrap(async (req, res) => {
  res.json(await svc.lacak(ambilResi(req)));
}));

router.use((req, res) => res.status(404).json({ error: 'Endpoint tidak ditemukan' }));

// eslint-disable-next-line no-unused-vars
router.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ error: err.message });
  console.error(err);
  return res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

module.exports = router;