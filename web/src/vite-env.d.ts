/// <reference types="vite/client" />

// 自定义环境变量声明：三大环境的构建标识与本地代理覆盖
interface ImportMetaEnv {
  /** 环境标识：development / test / production，缺省回退到构建 mode */
  readonly VITE_APP_ENV?: string;
  /** 本地开发服务器 /api 代理目标 */
  readonly VITE_API_PROXY_TARGET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
