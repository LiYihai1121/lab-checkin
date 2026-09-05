import express from 'express';
import authRoutes from '../src/routes/auth.ts';
import userRoutes from '../src/routes/users.ts';
import qrcodeRoutes from '../src/routes/qrcode.ts';
import checkinRoutes from '../src/routes/checkin.ts';
import recordRoutes from '../src/routes/records.ts';
import statsRoutes from '../src/routes/stats.ts';

/** 与生产一致的完整 API 应用（不挂载限流，避免测试被 429 干扰） */
export function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/qrcode', qrcodeRoutes);
  app.use('/api/checkin', checkinRoutes);
  app.use('/api/records', recordRoutes);
  app.use('/api/stats', statsRoutes);
  return app;
}
