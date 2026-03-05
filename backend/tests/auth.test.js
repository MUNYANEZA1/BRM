const request = require('supertest');
const app = require('../server');

describe('Basic API tests', () => {
  it('should respond to /health with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('should include CORS headers on preflight requests', async () => {
    const res = await request(app)
      .options('/api/auth/register')
      .set('Origin', 'https://example.com')
      .send();

    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  it('should protect registration route with validation', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});

    expect([400, 422]).toContain(res.statusCode);
    expect(res.body).toHaveProperty('success', false);
  });
});