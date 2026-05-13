/**
 * Génération et vérification de tokens JWT
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT.SECRET, { expiresIn: env.JWT.EXPIRES_IN });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.JWT.REFRESH_SECRET, { expiresIn: env.JWT.REFRESH_EXPIRES_IN });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT.SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT.REFRESH_SECRET);
}

function generateTokenPair(user) {
  const payload = {
    sub: user.id,
    gym_id: user.gym_id || null,
    role: user.role,
    email: user.email,
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({ sub: user.id }),
  };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
};
