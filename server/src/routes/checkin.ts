import { Router } from 'express';
import db, { nowStr } from '../db/database.ts';
import { isUniqueConstraintError } from '../utils/helpers.ts';
import { authenticate } from '../middleware/auth.ts';
import type { CheckinRecordRow } from '../types.ts';

const router = Router();
router.use(authenticate);

/** 解析本地时间字符串为时间戳 */
function ts(str: string): number {
  return new Date(String(str).replace(' ', 'T')).getTime();
}

/** 当前签到状态：进行中的记录 + 今日汇总 */
router.get('/status', (req, res) => {
  const active = db
    .prepare(
      `SELECT r.*, u.name, u.username FROM checkin_records r
       JOIN users u ON u.id = r.user_id
       WHERE r.user_id = ? AND r.status = 'checked_in'
       ORDER BY r.id DESC LIMIT 1`,
    )
    .get(req.user.id) as (CheckinRecordRow & { name: string; username: string }) | undefined;
  const todayStr = nowStr().slice(0, 10);
  const stats = db
    .prepare(
      `SELECT COUNT(*) AS sessions, COALESCE(SUM(duration_minutes), 0) AS minutes
       FROM checkin_records WHERE user_id = ? AND checkin_time >= ?`,
    )
    .get(req.user.id, `${todayStr} 00:00:00`) as { sessions: number; minutes: number };
  res.json({ active: active || null, todaySessions: stats.sessions, todayMinutes: stats.minutes });
});

/** 签到（需有效动态码） */
router.post('/in', (req, res) => {
  const code = String(req.body?.code || '')
    .trim()
    .toUpperCase();
  if (!code) return res.status(400).json({ message: '请输入签到码' });

  const codeStmt = db.prepare('SELECT * FROM checkin_codes WHERE code = ? AND expires_at > ?');
  const codeRow = codeStmt.get(code, nowStr()) as { id: number } | undefined;
  if (!codeRow) {
    return res.status(400).json({ message: '签到码无效或已过期，请联系管理员' });
  }
  const activeStmt = db.prepare("SELECT id FROM checkin_records WHERE user_id = ? AND status = 'checked_in'");
  const active = activeStmt.get(req.user.id) as { id: number } | undefined;
  if (active) {
    return res.status(400).json({ message: '您已处于签到状态，请先签退' });
  }

  let result: { changes: number | bigint; lastInsertRowid: number | bigint };
  try {
    result = db
      .prepare("INSERT INTO checkin_records (user_id, checkin_time, status, code_id) VALUES (?, ?, 'checked_in', ?)")
      .run(req.user.id, nowStr(), codeRow.id);
  } catch (err) {
    // 并发签到由部分唯一索引兜底，避免同一用户出现两条进行中记录
    if (isUniqueConstraintError(err)) {
      return res.status(400).json({ message: '您已处于签到状态，请先签退' });
    }
    throw err;
  }
  const record = db.prepare('SELECT * FROM checkin_records WHERE id = ?').all(Number(result.lastInsertRowid))[0] as
    CheckinRecordRow | undefined;
  res.json({ message: '签到成功', record });
});

/** 签退 */
router.post('/out', (req, res) => {
  const active = db
    .prepare("SELECT * FROM checkin_records WHERE user_id = ? AND status = 'checked_in' ORDER BY id DESC LIMIT 1")
    .get(req.user.id) as CheckinRecordRow | undefined;
  if (!active) {
    return res.status(400).json({ message: '当前没有进行中的签到' });
  }
  const checkoutTime = nowStr();
  const durationMinutes = Math.max(0, Math.round((ts(checkoutTime) - ts(active.checkin_time)) / 60000));
  // 条件更新保证并发签退只结算一次
  const info = db
    .prepare(
      "UPDATE checkin_records SET checkout_time = ?, duration_minutes = ?, status = 'completed' WHERE id = ? AND status = 'checked_in'",
    )
    .run(checkoutTime, durationMinutes, active.id);
  if (info.changes === 0) {
    return res.status(400).json({ message: '当前没有进行中的签到' });
  }
  const record = db.prepare('SELECT * FROM checkin_records WHERE id = ?').all(active.id)[0] as CheckinRecordRow;
  res.json({ message: `签退成功，本次共 ${durationMinutes} 分钟`, record });
});

export default router;
