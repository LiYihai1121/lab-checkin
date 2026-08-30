import { Router } from 'express';
import db from '../db/database.js';
import { likePattern, parsePagination, isValidDateStr } from '../utils/helpers.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();
router.use(authenticate);

/** 分页查询签到记录（COUNT 与列表保持相同的 JOIN，关键字条件才能复用） */
function queryRecords({ whereSql, params, page, pageSize }) {
  const total = db
    .prepare(`SELECT COUNT(*) AS c FROM checkin_records r JOIN users u ON u.id = r.user_id ${whereSql}`)
    .all(...params)[0].c;
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

/** 校验并规范化日期范围参数；非法时返回 error 提示 */
function rangeFilter(query) {
  const conds = [];
  const params = [];
  for (const key of ['start', 'end']) {
    const raw = query[key];
    if (raw === undefined) continue;
    if (Array.isArray(raw)) {
      return { error: '日期参数重复' };
    }
    if (!isValidDateStr(raw)) {
      return { error: '日期格式应为 YYYY-MM-DD' };
    }
    if (key === 'start') {
      conds.push('r.checkin_time >= ?');
      params.push(`${raw} 00:00:00`);
    } else {
      conds.push('r.checkin_time <= ?');
      params.push(`${raw} 23:59:59`);
    }
  }
  return { conds, params };
}

/** 我的记录（学生） */
router.get('/my', (req, res) => {
  const { page, pageSize } = parsePagination(req.query);
  const { error, conds, params } = rangeFilter(req.query);
  if (error) return res.status(400).json({ message: error });
  const whereSql = `WHERE r.user_id = ?${conds.length ? ' AND ' + conds.join(' AND ') : ''}`;
  res.json({ ...queryRecords({ whereSql, params: [req.user.id, ...params], page, pageSize }), page, pageSize });
});

/** 全部记录（管理员，支持按用户名/姓名关键字过滤） */
router.get('/all', requireAdmin, (req, res) => {
  const { page, pageSize } = parsePagination(req.query);
  const { error, conds, params } = rangeFilter(req.query);
  if (error) return res.status(400).json({ message: error });
  let whereSql = '';
  const kwRaw = String(req.query.keyword ?? '').trim();
  if (kwRaw) {
    conds.push("(u.username LIKE ? ESCAPE '\\' OR u.name LIKE ? ESCAPE '\\')");
    params.push(likePattern(kwRaw), likePattern(kwRaw));
  }
  if (conds.length) whereSql = 'WHERE ' + conds.join(' AND ');
  res.json({ ...queryRecords({ whereSql, params, page, pageSize }), page, pageSize });
});

export default router;
