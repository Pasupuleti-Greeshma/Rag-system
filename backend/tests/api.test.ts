import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('API Security and Input Validation Tests', () => {
  it('GET /api/health should respond with status UP or DEGRADED without throwing', async () => {
    const res = await request(app).get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toHaveProperty('status');
  });

  it('POST /api/auth/register should reject invalid payload', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/documents should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Access token required');
  });

  it('GET /api/conversations should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/conversations');
    expect(res.status).toBe(401);
  });
});
