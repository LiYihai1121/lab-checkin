import pluginVue from 'eslint-plugin-vue';
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript';
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting';
import globals from 'globals';

export default defineConfigWithVueTs(
  { ignores: ['node_modules/', 'dist/', 'dist-test/', 'dist-dev/'] },
  { files: ['**/*.{ts,mts,tsx,vue}'] },
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  skipFormatting,
  {
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // 单文件组件名与文件名保持一致（Login、Layout 等），不强制多词命名
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    // 响应拦截器统一剥壳，请求实例的默认泛型保持 any，具体形状由调用点泛型声明
    files: ['src/api/request.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
);
