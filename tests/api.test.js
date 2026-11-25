jest.mock('../src/db', () => ({ ping: jest.fn() }));
jest.mock('../src/services/shipments', () => ({
  hitung: jest.fn(), buat: jest.fn(), ubahStatus: jest.fn(), lacak: jest.fn(),
}));

const request = require('supertest');
const svc = require('../src/services/shipments');
const { HttpError } = require('../src/errors');
const app = require('../src/app');

const RESI = 'KC20261117000001';

beforeEach(() => jest.clearAllMocks());

describe('API /api', () => {
  test('POST /ongkir: berat 0 ditolak 400', async () => {
    const res = await request(app).post('/api/ongkir').send({ berat: 0, zona: 'dekat' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Berat/);
    expect(svc.hitung).not.toHaveBeenCalled();
  });

  test('POST /ongkir: input valid diteruskan dengan zona dinormalkan', async () => {
    svc.hitung.mockResolvedValue({ berat_dihitung: 2, ongkir: 16000 });
    const res = await request(app).post('/api/ongkir').send({ berat: 1.2, zona: ' DEKAT ' });
    expect(res.status).toBe(200);
    expect(res.body.ongkir).toBe(16000);
    expect(svc.hitung).toHaveBeenCalledWith(expect.objectContaining({ berat: 1.2, zona: 'dekat' }));
  });

  test('POST /shipments: data wajib kosong ditolak 400', async () => {
    const res = await request(app).post('/api/shipments').send({ berat: 1, zona: 'dekat' });
    expect(res.status).toBe(400);
    expect(svc.buat).not.toHaveBeenCalled();
  });

  test('POST /shipments: berhasil mengembalikan 201 dan resi', async () => {
    svc.buat.mockResolvedValue({ resi: RESI, ongkir: 8000, status: 'DIBUAT' });
    const res = await request(app).post('/api/shipments').send({
      pengirim: 'Andi', penerima: 'Budi', alamat_tujuan: 'Jl. Malang 1', zona: 'dekat', berat: 1,
    });
    expect(res.status).toBe(201);
    expect(res.body.resi).toBe(RESI);
  });

  test('PATCH status: lompatan status dari service menjadi 422 dengan pesan', async () => {
    svc.ubahStatus.mockRejectedValue(new HttpError(422, 'Status tidak boleh melompat dari DIBUAT ke TRANSIT'));
    const res = await request(app).patch(`/api/shipments/${RESI}/status`).send({ status: 'TRANSIT' });
    expect(res.status).toBe(422);
    expect(res.body.error).toMatch(/melompat/);
  });

  test('GET /track: format resi salah menjadi 404 tanpa menyentuh database', async () => {
    const res = await request(app).get('/api/track/ABC');
    expect(res.status).toBe(404);
    expect(svc.lacak).not.toHaveBeenCalled();
  });

  test('GET /track: resi valid mengembalikan riwayat', async () => {
    svc.lacak.mockResolvedValue({ resi: RESI, status: 'DIBUAT', history: [{ status: 'DIBUAT' }] });
    const res = await request(app).get(`/api/track/${RESI.toLowerCase()}`);
    expect(res.status).toBe(200);
    expect(res.body.history).toHaveLength(1);
    expect(svc.lacak).toHaveBeenCalledWith(RESI);
  });
});