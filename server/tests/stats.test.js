import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import db, { nowStr, fmtDate } from '../src/db/database.js';
import { makeApp } from './helpers.js';

const app = makeApp();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const STU_PASSWORD = crypto.randomBytes(8).toString('hex');
const STU2_PASSWORD = crypto.randomBytes(8).toString('hex');

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

describe('stats', () => {
  let adminToken;
  let studentToken;
  let stuId;
  let stu2Id;

  beforeAll(async () => {
    adminToken = await login('admin', ADMIN_PASSWORD);
    stuId = await createUser(adminToken, 'stu_stats', STU_PASSWORD, '统计同学');
    stu2Id = await createUser(adminToken, 'stu_active', STU2_PASSWORD, '在馆同学');
    studentToken = await login('stu_stats', STU_PASSWORD);

    // 最近 3 天窗口内最老一天的一条已完成记录（回归：修复前该天恒被统计为 0）
    const days = 3;
    const oldestDay = fmtDate(new Date(Date.now() - (days - 1) * 86400000)).slice(0, 10);
    db.prepare(
      "INSERT INTO checkin_records (user_id, checkin_time, checkout_time, duration_minutes, status) VALUES (?, ?, ?, ?, 'completed')"
    ).run(stuId, `${oldestDay} 10:00:00`, `${oldestDay} 11:30:00`, 90);
    // 一条进行中的记录（时长尚未结算）
    db.prepare("INSERT INTO checkin_records (user_id, checkin_time, status) VALUES (?, ?, 'checked_in')").run(
      stu2Id,
      nowStr()
    );
  });

  it('forbids students from stats endpoints', async () => {
    const auth = { Authorization: `Bearer ${studentToken}` };
    expect((await request(app).get('/api/stats/overview').set(auth)).status).toBe(403);
    expect((await request(app).get('/api/stats/daily').set(auth)).status).toBe(403);
    expect((await request(app).get('/api/stats/ranking').set(auth)).status).toBe(403);
  });

  it('daily includes the oldest day in the window', async () => {
    const res = await request(app)
      .get('/api/stats/daily?days=3')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    // 最老一天的记录必须被统计到（修复前边界比较错误导致恒为 0）
    expect(res.body[0].count).toBeGreaterThan(0);
  });

  it('overview counts in-lab users and today check-ins', async () => {
    const res = await request(app)
      .get('/api/stats/overview')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.inLab).toBe(1);
    expect(res.body.todayCount).toBe(1);
    expect(res.body.totalUsers).toBe(2);
    expect(res.body.inLabList).toHaveLength(1);
    expect(res.body.inLabList[0].username).toBe('stu_active');
  });

  it('ranking returns 0 (not null) for unfinished sessions', async () => {
    const res = await request(app)
      .get('/api/stats/ranking')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const unfinished = res.body.find((r) => r.username === 'stu_active');
    const finished = res.body.find((r) => r.username === 'stu_stats');
    expect(unfinished.minutes).toBe(0);
    expect(unfinished.sessions).toBe(1);
    expect(finished.minutes).toBe(90);
  });
});
