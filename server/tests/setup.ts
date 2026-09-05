// 测试环境隔离：每个测试文件使用独立内存库，绝不触碰 server/data 下的开发库
process.env.DB_PATH = ':memory:';
process.env.CREATE_DEFAULT_ADMIN = 'true';
process.env.ADMIN_PASSWORD = 'admin-pass-123';
