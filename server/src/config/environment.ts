import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { version } = require('../../package.json') as { version: string };

export type EnvName = 'development' | 'test' | 'production';

/**
 * 三大环境（开发 / 测试 / 生产）的集中定义：
 * 启动日志、/api/health、默认端口与默认数据库文件均据此区分。
 */
export interface EnvMeta {
  name: EnvName;
  label: string;
  isProduction: boolean;
  /** 未显式设置 PORT 时的默认监听端口 */
  port: number;
  /** 未显式设置 DB_PATH 时使用的 SQLite 文件名（位于 server/data/ 下） */
  dbFile: string;
}

const ENVIRONMENTS: Record<EnvName, EnvMeta> = {
  development: { name: 'development', label: '开发环境', isProduction: false, port: 3000, dbFile: 'lab-checkin.db' },
  test: { name: 'test', label: '测试环境', isProduction: false, port: 3100, dbFile: 'lab-checkin-test.db' },
  production: { name: 'production', label: '生产环境', isProduction: true, port: 3000, dbFile: 'lab-checkin.db' }
};

// NODE_ENV 只认 development / test / production，缺省或未识别值按开发环境兜底
const raw = (process.env.NODE_ENV ?? '').trim().toLowerCase();
export const environment: EnvMeta =
  (ENVIRONMENTS as Record<string, EnvMeta | undefined>)[raw] ?? ENVIRONMENTS.development;

export const appVersion: string = version;
