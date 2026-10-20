import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { router } from './routes/api.routes.js';

export const app = express();

// Security headers
app.use(helmet());

// Cross-origin resource sharing
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

// Body parsing with limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (sanitized, excluding passwords/tokens)
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Rate Limiting (Disabled in development, high limit in production)
if (config.nodeEnv === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests from this IP, please try again later.' },
  });
  app.use('/api/', limiter);
}

// Mount API routes
app.use('/api', router);

// Centralized error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
  });
});
