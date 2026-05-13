/**
 * Middleware RBAC — restreint l'accès à un ou plusieurs rôles
 * Usage: requireRole('owner'), requireRole('owner', 'coach')
 */
const { forbidden } = require('../utils/apiResponse');

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.role) return forbidden(res, 'Rôle non défini');
    if (!allowedRoles.includes(req.role)) {
      return forbidden(res, `Accès refusé — rôle requis: ${allowedRoles.join(', ')}`);
    }
    next();
  };
}

/**
 * Middleware feature-gating — vérifie qu'une feature est activée selon le plan de la salle
 */
const { PLAN_FEATURES } = require('../config/constants');
function requireFeature(featureName) {
  return (req, res, next) => {
    const plan = req.gym?.plan_type || 'basique';
    const features = PLAN_FEATURES[plan] || {};
    if (!features[featureName]) {
      return forbidden(
        res,
        `Cette feature (${featureName}) nécessite un plan supérieur. Plan actuel: ${plan}`,
      );
    }
    next();
  };
}

module.exports = { requireRole, requireFeature };
