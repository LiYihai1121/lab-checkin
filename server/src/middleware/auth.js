import jwt from 'jsonwebtoken';

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

/** 登录校验中间件 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: '未登录' });
  }
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }
}

/** 管理员权限中间件（需在 authenticate 之后使用） */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: '需要管理员权限' });
  }
  next();
}
