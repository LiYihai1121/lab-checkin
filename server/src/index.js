import express from 'express';
import cors from 'cors';
import './db/database.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import qrcodeRoutes from './routes/qrcode.js';
import checkinRoutes from './routes/checkin.js';
import recordRoutes from './routes/records.js';
import statsRoutes from './routes/stats.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '32kb' }));

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
  console.log(`实验室签到系统后端已启动: http://localhost:${PORT}`);
});

function shutdown(signal) {
  console.log(`[shutdown] 收到 ${signal}，正在停止服务...`);
  server.close(() => process.exit(0));
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
