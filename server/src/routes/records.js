import { Router } from 'express';
import db from '../db/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

/** 分页查询签到记录 */
function queryRecords({ whereSql, params, page, pageSize }) {
  const total = db.prepare(`SELECT COUNT(*) AS c FROM checkin_records r ${whereSql}`).get(...params).c;
  const list = db
    .prepare(
      `SELECT r.*, u.username, u.name FROM checkin_records r
       JOIN users u ON u.id = r.user_id
       ${whereSql}
       ORDER BY r.id DESC LIMIT ? OFFSET ?`
    )
    .all(...params, pageSize, (page - 1) * pageSize);
  return { list, total };
}

function rangeFilter(query) {
  const conds = [];
  const params = [];
  if (query.start) {
    conds.push('r.checkin_time >= ?');
    params.push(`${query.start} 00:00:00`);
  }
  if (query.end) {
    conds.push('r.checkin_time <= ?');
    params.push(`${query.end} 23:59:59`);
  }
  return { conds, params };
}

/** 我的记录（学生） */
router.get('/my', (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
  const { conds, params } = rangeFilter(req.query);
  const whereSql = `WHERE r.user_id = ?${conds.length ? ' AND ' + conds.join(' AND ') : ''}`;
  res.json({ ...queryRecords({ whereSql, params: [req.user.id, ...params], page, pageSize }), page, pageSize });
});

/** 全部记录（管理员，支持按用户名/姓名关键字过滤） */
router.get('/all', authenticate, requireAdmin, (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(req.query.pageSize) || 10, 1), 100);
  const { conds, params } = rangeFilter(req.query);
  let whereSql = '';
  if (req.query.keyword && String(req.query.keyword).trim()) {
    conds.push('(u.username LIKE ? OR u.name LIKE ?)');
    const kw = `%${String(req.query.keyword).trim()}%`;
    params.push(kw, kw);
  }
  if (conds.length) whereSql = 'WHERE ' + conds.join(' AND ');
  res.json({ ...queryRecords({ whereSql, params, page, pageSize }), page, pageSize });
});

export default router;
