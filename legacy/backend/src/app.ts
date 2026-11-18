import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env, isDemo } from './config/env';
import { authRoutes } from './routes/auth.routes';
import { apiRoutes } from './routes';
import { errorHandler, notFoundHandler } from './middleware/error';

export const app = express();

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.nodeEnv !== 'test') {
  app.use(morgan(isDemo ? 'dev' : 'combined'));
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Plastikkimik Pytangy API',
    version: '1.0.0',
    demoMode: isDemo,
    timestamp: new Date().toISOString(),
  });
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
    },
  },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
