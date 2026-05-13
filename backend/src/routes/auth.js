/**
 * Routes d'authentification
 */
const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const env = require('../config/env');
const v = require('../validators/authValidator');

const router = express.Router();

// Rate limit strict sur les endpoints sensibles
const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT.WINDOW_MS,
  max: env.RATE_LIMIT.AUTH_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de tentatives, réessayez plus tard' },
});

router.post(
  '/register-gym',
  authLimiter,
  validate(v.registerGymSchema),
  asyncHandler(authController.registerGym),
);

router.post('/login', authLimiter, validate(v.loginSchema), asyncHandler(authController.login));

router.post('/refresh-token', validate(v.refreshSchema), asyncHandler(authController.refreshToken));

router.post('/logout', authenticate, asyncHandler(authController.logout));

router.post(
  '/forgot-password',
  authLimiter,
  validate(v.forgotPasswordSchema),
  asyncHandler(authController.forgotPassword),
);

router.post(
  '/reset-password',
  authLimiter,
  validate(v.resetPasswordSchema),
  asyncHandler(authController.resetPassword),
);

router.post(
  '/change-password',
  authenticate,
  validate(v.changePasswordSchema),
  asyncHandler(authController.changePassword),
);

router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;
