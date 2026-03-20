import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter, authLimiter, uploadLimiter } from './middleware/rateLimiter';
import { doubleCsrfProtection } from './middleware/csrf';

import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import userRoutes from './routes/users';
import mediaRoutes from './routes/media';
import commentRoutes from './routes/comments';
import saveRoutes from './routes/saves';
import feedRoutes from './routes/feed';
import activityRoutes from './routes/activities';
import travelRoutes from './routes/travel';
import albumRoutes from './routes/albums';
import journalRoutes from './routes/journals';
import placesRoutes from './routes/places';
import mapRoutes from './routes/map';
import exploreRoutes from './routes/explore';
import reportRoutes from './routes/reports';

const app = express();

app.set('trust proxy', 1);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'api.mapbox.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'api.mapbox.com'],
      imgSrc: ["'self'", 'data:', 'blob:', '*.mapbox.com', env.R2_PUBLIC_URL].filter(Boolean) as string[],
      connectSrc: ["'self'", 'api.mapbox.com', 'events.mapbox.com', 'maps.googleapis.com', '*.sentry.io', env.R2_PUBLIC_URL].filter(Boolean) as string[],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));
const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Rate limiting
app.use('/api/v1', apiLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/media', uploadLimiter);

// CSRF protection for state-changing requests
app.use('/api/v1', doubleCsrfProtection);

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/posts', postRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/media', mediaRoutes);
app.use('/api/v1', commentRoutes);
app.use('/api/v1', saveRoutes);
app.use('/api/v1/feed', feedRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/travel', travelRoutes);
app.use('/api/v1/albums', albumRoutes);
app.use('/api/v1/journals', journalRoutes);
app.use('/api/v1/places', placesRoutes);
app.use('/api/v1/map', mapRoutes);
app.use('/api/v1/explore', exploreRoutes);
app.use('/api/v1/reports', reportRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
