/**
 * 三大环境（开发 / 测试 / 生产）的前端标识：
 * 页面标题后缀、界面徽标与控制台横幅据此区分，避免误把开发/测试当作生产。
 */
export type EnvTag = 'success' | 'warning' | 'danger' | 'info' | 'primary';

interface AppEnvMeta {
  name: 'development' | 'test' | 'production';
  label: string;
  tag: EnvTag;
  isProduction: boolean;
  /** 浏览器标签页基础标题（路由 afterEach 会拼接页面标题） */
  baseTitle: string;
}

const ENVIRONMENTS: Record<string, AppEnvMeta> = {
  development: {
    name: 'development',
    label: '开发环境',
    tag: 'warning',
    isProduction: false,
    baseTitle: '实验室签到系统（开发环境）'
  },
  test: {
    name: 'test',
    label: '测试环境',
    tag: 'danger',
    isProduction: false,
    baseTitle: '实验室签到系统（测试环境）'
  },
  production: {
    name: 'production',
    label: '生产环境',
    tag: 'success',
    isProduction: true,
    baseTitle: '实验室签到系统'
  }
};

// VITE_APP_ENV 由各 mode 环境文件注入，缺省回退到构建 mode
export const appEnv: AppEnvMeta =
  ENVIRONMENTS[import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development'] ??
  ENVIRONMENTS.development;

/** 应用启动时写入环境标题，并在非生产构建的控制台打出醒目横幅 */
export function applyEnvIdentity(): void {
  document.title = appEnv.baseTitle;
  if (!appEnv.isProduction) {
    console.info(
      `%c[实验室签到系统] 当前为${appEnv.label}构建，请勿用于真实数据`,
      'background:#163d3d;color:#f4c95d;padding:2px 8px;border-radius:4px;font-weight:600'
    );
  }
}
