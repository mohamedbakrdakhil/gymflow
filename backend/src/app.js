/**
 * Application Express GymFlow
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { error: errorResponse } = require('./utils/apiResponse');

const app = express();

// Sécurité headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (curl, mobile)
      if (!origin) return callback(null, true);
      if (env.ALLOWED_ORIGINS.includes(origin) || env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Origin non autorisé par CORS'));
    },
    credentials: true,
  }),
);

// Logging
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Body parsing
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Rate limiting global
const limiter = rateLimit({
  windowMs: env.RATE_LIMIT.WINDOW_MS,
  max: env.RATE_LIMIT.MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes, réessayez plus tard' },
});
app.use('/api', limiter);

// Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), env.UPLOAD.DIR)));

// Routes API
app.use('/api', routes);

// 404
app.use((req, res) => {
  return errorResponse(res, `Route introuvable: ${req.method} ${req.path}`, 404);
});

// Error handler central (toujours en dernier)
app.use(errorHandler);

module.exports = app;
