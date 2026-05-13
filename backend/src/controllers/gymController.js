/**
 * Controller Gym — settings de la salle (info + white-label)
 */
const { Gym } = require('../models');
const { success, notFound, error } = require('../utils/apiResponse');

async function getCurrent(req, res) {
  const gym = await Gym.findByPk(req.gymId);
  if (!gym) return notFound(res, 'Salle introuvable');
  return success(res, gym);
}

async function update(req, res) {
  const gym = await Gym.findByPk(req.gymId);
  if (!gym) return notFound(res, 'Salle introuvable');

  const allowed = ['name', 'address', 'city', 'phone', 'email', 'timezone'];
  const update = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }
  await gym.update(update);
  return success(res, gym, 'Salle modifiée');
}

/**
 * PUT /api/gym/branding (Premium - white-label)
 */
async function updateBranding(req, res) {
  const gym = await Gym.findByPk(req.gymId);
  if (!gym) return notFound(res, 'Salle introuvable');
  if (gym.plan_type !== 'premium') {
    return error(res, 'Le white-label nécessite le plan Premium', 403);
  }

  const { primary_color, secondary_color } = req.body;
  await gym.update({ primary_color, secondary_color });
  return success(res, gym, 'Branding mis à jour');
}

async function uploadLogo(req, res) {
  if (!req.file) return error(res, 'Aucun fichier reçu', 400);
  const gym = await Gym.findByPk(req.gymId);
  if (!gym) return notFound(res, 'Salle introuvable');
  const logo_url = `/uploads/logos/${req.file.filename}`;
  await gym.update({ logo_url });
  return success(res, { logo_url }, 'Logo mis à jour');
}

module.exports = { getCurrent, update, updateBranding, uploadLogo };
