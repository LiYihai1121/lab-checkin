import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'lab-checkin.db'));

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS checkin_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    code       TEXT UNIQUE NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS checkin_records (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(id),
    checkin_time     TEXT NOT NULL,
    checkout_time    TEXT,
    duration_minutes INTEGER,
    status           TEXT NOT NULL DEFAULT 'checked_in' CHECK (status IN ('checked_in','completed')),
    code_id          INTEGER
  );

  CREATE INDEX IF NOT EXISTS idx_records_user   ON checkin_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_records_status ON checkin_records(status);
  CREATE INDEX IF NOT EXISTS idx_records_time   ON checkin_records(checkin_time);
`);

/** 本地时间字符串 YYYY-MM-DD HH:mm:ss */
export function nowStr() {
  return fmtDate(new Date());
}

export function fmtDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 首次启动时创建默认管理员 admin / admin123 */
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  db.prepare('INSERT INTO users (username, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?)').run(
    'admin',
    bcrypt.hashSync('admin123', 10),
    '系统管理员',
    'admin',
    nowStr()
  );
  console.log('[init] 已创建默认管理员账号：admin / admin123（请登录后尽快修改密码）');
}

export default db;
