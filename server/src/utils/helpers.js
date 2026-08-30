import bcrypt from 'bcryptjs';

export const BCRYPT_ROUNDS = 10;

export function hashPassword(plain) {
  return bcrypt.hashSync(String(plain), BCRYPT_ROUNDS);
}

/** 转义 LIKE 通配符，SQL 中需配合 ESCAPE '\' 使用 */
export function escapeLike(value) {
  return String(value ?? '').trim().replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

export function likePattern(keyword) {
  return `%${escapeLike(keyword)}%`;
}

/** 解析分页参数，page 从 1 起，pageSize 1-100 */
export function parsePagination(query) {
  const page = Math.max(parseInt(query?.page) || 1, 1);
  const pageSize = Math.min(Math.max(parseInt(query?.pageSize) || 10, 1), 100);
  return { page, pageSize };
}

export function isValidDateStr(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value));
}

/** node:sqlite 唯一约束冲突（其 code 固定为 ERR_SQLITE_ERROR，具体类型在 message 中） */
export function isUniqueConstraintError(err) {
  return err?.code === 'ERR_SQLITE_ERROR' && /UNIQUE constraint failed/i.test(String(err.message));
}
