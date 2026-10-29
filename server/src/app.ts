// Server: Express Application Configuration

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimiter, authRateLimiter, searchRateLimiter } from './middleware/rateLimiter.js';
import { requestLogger } from './middleware/requestLogger.js';

// Route imports
import { authRoutes } from './modules/auth/auth.routes.js';
import { documentsRoutes } from './modules/documents/documents.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { conversationsRoutes } from './modules/conversations/conversations.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { feedbackRoutes } from './modules/feedback/feedback.routes.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging (skip in test environment to keep test logs clean)
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Rate limiting (skip in test environment to prevent 429 during automated testing)
if (process.env.NODE_ENV !== 'test') {
  app.use('/api/', rateLimiter);
  app.use('/api/auth', authRateLimiter);
  app.use('/api/search', searchRateLimiter);
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: config.version,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
