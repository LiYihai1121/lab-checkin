import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/', 'data/', 'coverage/'] },
  tseslint.configs.recommended,
  {
    rules: {
      // 服务端按环境输出启动/初始化日志，允许 console
      'no-console': 'off',
      // node:sqlite 查询行经 `as` 断言定形，允许显式 any
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  }
);
