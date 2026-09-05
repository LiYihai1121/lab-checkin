import { describe, it, expect, beforeAll } from 'vitest';
import crypto from 'node:crypto';
import request from 'supertest';
import { makeApp } from './helpers.ts';

const app = makeApp();

const INIT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const STU_PASSWORD = crypto.randomBytes(8).toString('hex');

describe('users admin API', () => {
  let adminToken: string;
  let studentToken: string;
  let studentId: number;

  beforeAll(async () => {
    const login = await request(app).post('/api/auth/login').send({ username: 'admin', password: INIT_ADMIN_PASSWORD });
    adminToken = login.body.token;

    const created = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'stu_list', password: STU_PASSWORD, name: '列表同学', role: 'student' });
    expect(created.status).toBe(200);
    studentId = created.body.id;

    const stuLogin = await request(app).post('/api/auth/login').send({ username: 'stu_list', password: STU_PASSWORD });
    studentToken = stuLogin.body.token;
  });

  it('forbids student from listing users', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  it('lists users with pagination', async () => {
    const res = await request(app).get('/api/users?page=1&pageSize=5').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
    expect(Array.isArray(res.body.list)).toBe(true);
  });

  it('validates create user input', async () => {
    const base = { password: crypto.randomBytes(8).toString('hex'), name: '校验', role: 'student' };
    const auth = { Authorization: `Bearer ${adminToken}` };
    expect(
      (
        await request(app)
          .post('/api/users')
          .set(auth)
          .send({ ...base, username: 'x' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/users')
          .set(auth)
          .send({ ...base, username: 'ok_name', password: '123' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/users')
          .set(auth)
          .send({ ...base, username: 'ok_name', name: ' ' })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post('/api/users')
          .set(auth)
          .send({ ...base, username: 'ok_name', role: 'boss' })
      ).status,
    ).toBe(400);
  });

  it('rejects duplicate username with 400', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'stu_list', password: crypto.randomBytes(8).toString('hex'), name: '重复', role: 'student' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/已存在/);
  });

  it('prevents demoting the last admin', async () => {
    const list = await request(app).get('/api/users?keyword=admin').set('Authorization', `Bearer ${adminToken}`);
    const adminRow = list.body.list.find((u: { username: string }) => u.username === 'admin');
    const res = await request(app)
      .put(`/api/users/${adminRow.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'student' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/管理员/);
  });

  it('edits name and role', async () => {
    const res = await request(app)
      .put(`/api/users/${studentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '改名同学' });
    expect(res.status).toBe(200);
    const list = await request(app).get('/api/users?keyword=stu_list').set('Authorization', `Bearer ${adminToken}`);
    expect(list.body.list[0].name).toBe('改名同学');
  });

  it('cannot delete self but can delete others', async () => {
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
    const selfDelete = await request(app)
      .delete(`/api/users/${me.body.user.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(selfDelete.status).toBe(400);

    const del = await request(app).delete(`/api/users/${studentId}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(200);
    const gone = await request(app).post('/api/auth/login').send({ username: 'stu_list', password: STU_PASSWORD });
    expect(gone.status).toBe(401);
  });
});
