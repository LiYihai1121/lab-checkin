import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import './db/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import qrcodeRoutes from './routes/qrcode.js';
import checkinRoutes from './routes/checkin.js';
import recordRoutes from './routes/records.js';
import statsRoutes from './routes/stats.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// 反向代理部署时设置 TRUST_PROXY=true（或写跳数），限流按真实客户端 IP 计数
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);
}

// 敏感接口限流：防暴力破解密码、找回码与签到码
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '尝试次数过多，请 15 分钟后再试' }
});
const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '尝试次数过多，请 15 分钟后再试' }
});
const checkinLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: '操作过于频繁，请稍后再试' }
});

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '32kb' }));

// 限流挂载在 cors/json 之后，避免预检请求被计数或拦截
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/password/reset', resetLimiter);
app.use('/api/checkin/in', checkinLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'lab-checkin', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/qrcode', qrcodeRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/stats', statsRoutes);

app.use((req, res) => res.status(404).json({ message: '接口不存在' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    return res.status(400).json({ message: '请求格式错误' });
  }
  res.status(500).json({ message: '服务器内部错误' });
});

const server = app.listen(PORT, () => {
  console.info(`实验室签到系统后端已启动: http://localhost:${PORT}`);
});

function shutdown(signal) {
  console.info(`[shutdown] 收到 ${signal}，正在停止服务...`);
  server.close(() => process.exit(0));
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));

// 捕获未处理的异常与拒绝，记录后优雅退出
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
  process.exit(1);
});
