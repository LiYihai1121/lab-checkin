import { Router } from 'express';
import db, { nowStr } from '../db/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

/** 动态签到码有效期（秒） */
const CODE_TTL_SECONDS = 60;

/**
 * 生成动态时效二维码（管理员）
 * 返回 code 与过期时间；前端负责将 `${origin}/checkin?code=xxx` 渲染为二维码
 */
router.post('/generate', authenticate, requireAdmin, (req, res) => {
  // 清理已过期的旧验证码
  db.prepare('DELETE FROM checkin_codes WHERE expires_at <= ?').run(nowStr());

  let code;
  do {
    code = randomCode();
  } while (db.prepare('SELECT id FROM checkin_codes WHERE code = ? AND expires_at > ?').get(code, nowStr()));

  const expiresAt = addSeconds(new Date(), CODE_TTL_SECONDS);
  const fmt = (d) => {
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  };
  db.prepare('INSERT INTO checkin_codes (code, expires_at, created_at) VALUES (?, ?, ?)').run(
    code,
    fmt(expiresAt),
    nowStr()
  );
  res.json({ code, expiresAt: expiresAt.getTime(), expiresIn: CODE_TTL_SECONDS });
});

function randomCode() {
  // 去除易混淆字符 0/O、1/I
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function addSeconds(date, seconds) {
  return new Date(date.getTime() + seconds * 1000);
}

export default router;
