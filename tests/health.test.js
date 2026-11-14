jest.mock('../src/db', () => ({ ping: jest.fn() }));

const request = require('supertest');
const db = require('../src/db');
const app = require('../src/app');

describe('GET /health', () => {
  test('200 dan db up saat database tersambung', async () => {
    db.ping.mockResolvedValue();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', db: 'up' });
  });

  test('503 saat database mati', async () => {
    db.ping.mockRejectedValue(new Error('down'));
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.db).toBe('down');
  });
});