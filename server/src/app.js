// Server: Express Application Configuration
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Route imports
import { authRoutes } from './modules/auth/auth.routes.js';
import { documentsRoutes } from './modules/documents/documents.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { conversationsRoutes } from './modules/conversations/conversations.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { feedbackRoutes } from './modules/feedback/feedback.routes.js';

const app = express();

// CORS
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// Health check
app.get('/health', (_req, res) => {
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
