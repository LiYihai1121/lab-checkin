import { Router } from 'express';
import crypto from 'node:crypto';
import db, { nowStr, fmtDate } from '../db/database.ts';
import { isUniqueConstraintError } from '../utils/helpers.ts';
import { authenticate, requireAdmin } from '../middleware/auth.ts';

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

  const expiresAt = addSeconds(new Date(), CODE_TTL_SECONDS);
  // 与活跃码撞唯一约束时换码重试（已先清理过期码，冲突概率极低）
  let code = '';
  let inserted = false;
  for (let attempt = 0; attempt < 5 && !inserted; attempt++) {
    code = randomCode();
    try {
      db.prepare('INSERT INTO checkin_codes (code, expires_at, created_at) VALUES (?, ?, ?)').run(
        code,
        fmtDate(expiresAt),
        nowStr(),
      );
      inserted = true;
    } catch (err) {
      if (!isUniqueConstraintError(err)) throw err;
    }
  }
  if (!inserted) {
    return res.status(503).json({ message: '签到码生成繁忙，请稍后重试' });
  }
  res.json({ code, expiresAt: expiresAt.getTime(), expiresIn: CODE_TTL_SECONDS });
});

function randomCode(): string {
  // 去除易混淆字符 0/O、1/I；crypto.randomInt 为密码学安全随机
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[crypto.randomInt(chars.length)];
  return s;
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export default router;
