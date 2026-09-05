import { Router } from 'express';
import db, { nowStr, fmtDate } from '../db/database.ts';
import { authenticate, requireAdmin } from '../middleware/auth.ts';

const router = Router();
router.use(authenticate, requireAdmin);

/** 概览：在馆人数、今日签到、用户总数、今日总时长 + 在馆列表 */
router.get('/overview', (req, res) => {
  const todayStr = nowStr().slice(0, 10);
  const countInLab = db.prepare("SELECT COUNT(*) AS c FROM checkin_records WHERE status = 'checked_in'").get() as {
    c: number;
  };
  const todayCountRow = db.prepare('SELECT COUNT(*) AS c FROM checkin_records WHERE checkin_time >= ?').get(
    `${todayStr} 00:00:00`
  ) as { c: number };
  const totalUsersRow = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'student'").get() as { c: number };
  const todayMinutesRow = db
    .prepare('SELECT COALESCE(SUM(duration_minutes), 0) AS m FROM checkin_records WHERE checkin_time >= ?')
    .get(`${todayStr} 00:00:00`) as { m: number };
  const inLabList = db
    .prepare(
      `SELECT r.id, r.checkin_time, u.name, u.username FROM checkin_records r
       JOIN users u ON u.id = r.user_id
       WHERE r.status = 'checked_in' ORDER BY r.checkin_time`
    )
    .all() as Array<{ id: number; checkin_time: string; name: string; username: string }>;
  res.json({
    inLab: countInLab.c,
    todayCount: todayCountRow.c,
    totalUsers: totalUsersRow.c,
    todayMinutes: todayMinutesRow.m,
    inLabList
  });
});

/** 近 N 天每日签到人次（默认 30，补齐无数据日期为 0） */
router.get('/daily', (req, res) => {
  const days = Math.min(Math.max(parseInt(String(req.query.days)) || 30, 1), 90);
  const rows = db
    .prepare(
      `SELECT substr(checkin_time, 1, 10) AS d, COUNT(*) AS c
       FROM checkin_records WHERE substr(checkin_time, 1, 10) >= ?
       GROUP BY d`
    )
    .all(dateOffsetStr(-days + 1).slice(0, 10)) as Array<{ d: string; c: number }>;
  const map = Object.fromEntries(rows.map((r) => [r.d, r.c]));
  const list = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = dateOffsetStr(-i).slice(0, 10);
    list.push({ date: d.slice(5), count: map[d] || 0 });
  }
  res.json(list);
});

/** 累计出勤时长排行 Top 10 */
router.get('/ranking', (req, res) => {
  const list = db
    .prepare(
      `SELECT u.name, u.username,
              COALESCE(SUM(r.duration_minutes), 0) AS minutes,
              COUNT(r.id) AS sessions
       FROM checkin_records r JOIN users u ON u.id = r.user_id
       GROUP BY r.user_id ORDER BY minutes DESC LIMIT 10`
    )
    .all() as Array<{ name: string; username: string; minutes: number; sessions: number }>;
  res.json(list);
});

function dateOffsetStr(offsetDays: number): string {
  return fmtDate(new Date(Date.now() + offsetDays * 86400000));
}

export default router;
