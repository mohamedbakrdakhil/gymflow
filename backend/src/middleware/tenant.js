/**
 * Middleware tenant — vérifie que la salle existe et est active
 * À utiliser après authenticate. Pour super_admin, gym_id peut être null.
 */
const { Gym } = require('../models');
const { forbidden, notFound } = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');

async function tenantMiddleware(req, res, next) {
  try {
    if (req.role === ROLES.SUPER_ADMIN) return next();

    if (!req.gymId) return forbidden(res, 'Aucune salle associée à cet utilisateur');

    const gym = await Gym.findByPk(req.gymId);
    if (!gym) return notFound(res, 'Salle introuvable');

    if (gym.status === 'suspended') {
      return forbidden(res, 'Cette salle est suspendue — contactez le support');
    }
    if (gym.status === 'cancelled') {
      return forbidden(res, 'Cette salle est désactivée');
    }

    req.gym = gym;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = tenantMiddleware;
