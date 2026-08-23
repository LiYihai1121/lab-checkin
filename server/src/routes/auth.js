import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database.js';
import { nowStr } from '../db/database.js';
import { authenticate, signToken } from '../middleware/auth.js';

const router = Router();

/** 登录 */
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ message: '请输入用户名和密码' });
  }
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username).trim());
  if (!user || !bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({ message: '用户名或密码错误' });
  }
  const info = { id: user.id, username: user.username, name: user.name, role: user.role };
  res.json({ token: signToken(info), user: info });
});

/** 当前登录用户信息 */
router.get('/me', authenticate, (req, res) => {
  const user = db
    .prepare('SELECT id, username, name, role, created_at FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(401).json({ message: '用户不存在' });
  res.json({ user });
});

/** 修改自己的密码 */
router.put('/password', authenticate, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: '请输入原密码和新密码' });
  }
  if (String(newPassword).length < 6) {
    return res.status(400).json({ message: '新密码至少 6 位' });
  }
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (!row || !bcrypt.compareSync(String(oldPassword), row.password_hash)) {
    return res.status(400).json({ message: '原密码错误' });
  }
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(
    bcrypt.hashSync(String(newPassword), 10),
    req.user.id
  );
  res.json({ message: '密码修改成功' });
});

export default router;
