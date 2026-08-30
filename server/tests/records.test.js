import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import db, { fmtDate } from '../src/db/database.js';
import { makeApp } from './helpers.js';

const app = makeApp();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const STU_PASSWORD = crypto.randomBytes(8).toString('hex');

/** 通过登录接口换取 token（断言成功） */
async function login(username, password) {
  const body = { username, password };
  const res = await request(app).post('/api/auth/login').send(body);
  expect(res.status).toBe(200);
  return res.body.token;
}

async function createUser(adminToken, username, password, name) {
  const res = await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ username, password, name, role: 'student' });
  expect(res.status).toBe(200);
  return res.body.id;
}

describe('records', () => {
  let adminToken;
  let studentToken;
  let stuId;

  beforeAll(async () => {
    adminToken = await login('admin', ADMIN_PASSWORD);
    stuId = await createUser(adminToken, 'stu_rec', STU_PASSWORD, '记录同学');
    studentToken = await login('stu_rec', STU_PASSWORD);

    // 两条已完成记录：一条今天、一条 40 天前
    const today = fmtDate(new Date()).slice(0, 10);
    const old = fmtDate(new Date(Date.now() - 40 * 86400000)).slice(0, 10);
    db.prepare(
      "INSERT INTO checkin_records (user_id, checkin_time, checkout_time, duration_minutes, status) VALUES (?, ?, ?, ?, 'completed')"
    ).run(stuId, `${today} 09:00:00`, `${today} 10:00:00`, 60);
    db.prepare(
      "INSERT INTO checkin_records (user_id, checkin_time, checkout_time, duration_minutes, status) VALUES (?, ?, ?, ?, 'completed')"
    ).run(stuId, `${old} 09:00:00`, `${old} 10:00:00`, 60);
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/records/my')).status).toBe(401);
  });

  it('forbids students from /all', async () => {
    const res = await request(app)
      .get('/api/records/all')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('lists my records with pagination', async () => {
    const res = await request(app)
      .get('/api/records/my?page=1&pageSize=1')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.list).toHaveLength(1);
  });

  it('filters my records by date range', async () => {
    const today = fmtDate(new Date()).slice(0, 10);
    const res = await request(app)
      .get(`/api/records/my?start=${today}&end=${today}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(1);
  });

  it('rejects invalid and duplicated date params', async () => {
    const invalid = await request(app)
      .get('/api/records/my?start=not-a-date')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(invalid.status).toBe(400);

    const duplicated = await request(app)
      .get('/api/records/my?start=2026-01-01&start=2026-02-02')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(duplicated.status).toBe(400);
  });

  it('searches all records by keyword with escaped wildcards', async () => {
    const hit = await request(app)
      .get('/api/records/all?keyword=stu_rec')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(hit.status).toBe(200);
    expect(hit.body.total).toBe(2);

    // % 应作为字面字符处理，而不是匹配全部
    const literal = await request(app)
      .get('/api/records/all?keyword=%25')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(literal.status).toBe(200);
    expect(literal.body.total).toBe(0);
  });
});
