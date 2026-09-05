import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // 三大环境独立并行：开发 5173→后端3000，测试 5174→后端3100；生产构建同源部署
  const devPorts: Record<string, number> = { development: 5173, test: 5174 };
  const apiTargets: Record<string, string> = { development: 'http://localhost:3000', test: 'http://localhost:3100' };
  // 产物目录按环境区分，避免测试构建被误当作生产部署
  const outDirs: Record<string, string> = { production: 'dist', test: 'dist-test', development: 'dist-dev' };

  return {
    plugins: [
      vue(),
      // 生成 gzip 与 brotli 压缩文件以便部署时直接上行服务加速或 CDN 使用
      viteCompression({ algorithm: 'gzip' }),
      viteCompression({ algorithm: 'brotliCompress' }),
    ],
    server: {
      port: devPorts[mode] ?? 5173,
      proxy: {
        '/api': {
          // 默认指向当前环境的本地后端，可通过 web/.env 的 VITE_API_PROXY_TARGET 覆盖
          target: env.VITE_API_PROXY_TARGET || apiTargets[mode] || 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: outDirs[mode] ?? 'dist-dev',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('echarts')) return 'vendor_echarts';
              if (id.includes('element-plus')) return 'vendor_elementplus';
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
