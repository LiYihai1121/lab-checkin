import express from 'express';
import request from 'supertest';
import db, { nowStr } from '../src/db/database.js';
import checkinRoutes from '../src/routes/checkin.js';
import { signToken } from '../src/middleware/auth.js';

// Helper to create an app instance mounting the router
function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/checkin', checkinRoutes);
  return app;
}

describe('checkin routes (integration)', () => {
  let userId;
  let token;
  let codeValue;

  beforeAll(() => {
    // create a test user
    const now = nowStr();
    const result = db
      .prepare('INSERT INTO users (username, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(`testuser_${Date.now()}`, 'hash', '测试用户', 'student', now);
    userId = Number(result.lastInsertRowid);
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    token = signToken(userRow);

    // create a valid checkin code
    codeValue = `TESTCODE${Date.now()}`.slice(0, 20).toUpperCase();
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    const expiresStr = `${expires.getFullYear()}-${String(expires.getMonth() + 1).padStart(2,'0')}-${String(expires.getDate()).padStart(2,'0')} ${String(expires.getHours()).padStart(2,'0')}:${String(expires.getMinutes()).padStart(2,'0')}:${String(expires.getSeconds()).padStart(2,'0')}`;
    db.prepare('INSERT INTO checkin_codes (code, expires_at, created_at) VALUES (?, ?, ?)').run(codeValue, expiresStr, now);
  });

  afterAll(() => {
    // cleanup records and user
    db.prepare('DELETE FROM checkin_records WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    db.prepare('DELETE FROM checkin_codes WHERE code LIKE ?').run(`${codeValue}%`);
  });

  it('can check in with a valid code and then check out', async () => {
    const app = makeApp();

    // check in
    const resIn = await request(app)
      .post('/api/checkin/in')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: codeValue });

    expect(resIn.status).toBe(200);
    expect(resIn.body).toHaveProperty('message');
    expect(resIn.body.message).toMatch(/签到成功/);
    expect(resIn.body).toHaveProperty('record');

    // check out
    const resOut = await request(app)
      .post('/api/checkin/out')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(resOut.status).toBe(200);
    expect(resOut.body).toHaveProperty('message');
    expect(resOut.body.message).toMatch(/签退成功/);
    expect(resOut.body).toHaveProperty('record');
  });
});
