import jwt from 'jsonwebtoken';
import db from '../db/database.js';

// 生产环境必须显式配置 JWT_SECRET，防止使用公开默认值签发可伪造的 token
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('生产环境必须设置 JWT_SECRET 环境变量');
}
const JWT_SECRET = process.env.JWT_SECRET || 'lab-checkin-dev-secret-change-in-production';
const TOKEN_TTL = '24h';

/** 签发 JWT：payload 为用户基本信息 */
export function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_TTL }
  );
}

/**
 * 登录校验中间件：验证 token 后实时读取用户，使角色调整与账号删除即时生效
 * （JWT 有效期内被降级/删除的账号不再持有旧权限）
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登录' });
  }
  let payload;
  try {
    payload = jwt.verify(header.slice(7), JWT_SECRET);
  } catch {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }
  const user = db
    .prepare('SELECT id, username, name, role FROM users WHERE id = ?')
    .all(payload.id)[0];
  if (!user) {
    return res.status(401).json({ message: '账号不存在或已被删除' });
  }
  req.user = user;
  next();
}

/** 管理员权限中间件（需在 authenticate 之后使用） */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
}
