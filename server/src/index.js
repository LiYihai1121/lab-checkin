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
app.use(cors());
app.use(express.json());

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`实验室签到系统后端已启动: http://localhost:${PORT}`);
});
