/**
 * Configuration centralisée des variables d'environnement
 * Valide la présence des secrets critiques au démarrage
 */
require('dotenv').config();

const required = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DB_NAME'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Variable d'environnement manquante: ${key}`);
    if (process.env.NODE_ENV !== 'test') process.exit(1);
  }
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,

  DB: {
    HOST: process.env.DB_HOST || 'localhost',
    PORT: parseInt(process.env.DB_PORT, 10) || 3306,
    USER: process.env.DB_USER || 'root',
    PASSWORD: process.env.DB_PASSWORD || '',
    NAME: process.env.DB_NAME || 'gymflow',
    DIALECT: process.env.DB_DIALECT || 'mysql',
  },

  JWT: {
    SECRET: process.env.JWT_SECRET || 'dev_only_secret_change_me',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev_only_refresh_change_me',
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),

  SMTP: {
    HOST: process.env.SMTP_HOST || '',
    PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
    SECURE: process.env.SMTP_SECURE === 'true',
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM: process.env.EMAIL_FROM || 'noreply@gymflow.ma',
    FROM_NAME: process.env.EMAIL_FROM_NAME || 'GymFlow',
  },

  UPLOAD: {
    DIR: process.env.UPLOAD_DIR || 'uploads',
    MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5,
  },

  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  },

  CMI: {
    MERCHANT_ID: process.env.CMI_MERCHANT_ID || '',
    STORE_KEY: process.env.CMI_STORE_KEY || '',
  },

  RATE_LIMIT: {
    WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    AUTH_MAX: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5,
  },

  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
};
