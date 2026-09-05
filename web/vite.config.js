import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [
      vue(),
      // 生成 gzip 与 brotli 压缩文件以便部署时直接上行服务加速或 CDN 使用
      viteCompression({ algorithm: 'gzip' }),
      viteCompression({ algorithm: 'brotliCompress' })
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          // 默认指向本地后端，可通过 web/.env 的 VITE_API_PROXY_TARGET 覆盖
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: true
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('echarts')) return 'vendor_echarts';
              if (id.includes('element-plus')) return 'vendor_elementplus';
              return 'vendor';
            }
          }
        }
      }
    }
  };
});
