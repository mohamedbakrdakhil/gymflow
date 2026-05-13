/**
 * Middleware d'authentification JWT
 * - Lit le Bearer token de l'header Authorization
 * - Vérifie + décode + charge l'user
 * - Attache req.user, req.gymId, req.role
 */
const { verifyAccessToken } = require('../utils/jwt');
const { User } = require('../models');
const { unauthorized } = require('../utils/apiResponse');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return unauthorized(res, 'Token manquant');

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (e) {
      return unauthorized(res, 'Token invalide ou expiré');
    }

    const user = await User.findByPk(decoded.sub);
    if (!user || !user.is_active) {
      return unauthorized(res, 'Utilisateur introuvable ou désactivé');
    }

    req.user = user;
    req.gymId = user.gym_id;
    req.role = user.role;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = authenticate;
