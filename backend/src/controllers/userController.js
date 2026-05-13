/**
 * Controller User — profil de l'utilisateur connecté + gestion users d'une salle
 */
const { User } = require('../models');
const { success, notFound, error } = require('../utils/apiResponse');
const { paginate, paginationMeta } = require('../utils/helpers');

async function getMe(req, res) {
  const user = await User.findByPk(req.user.id);
  return success(res, user);
}

async function updateMe(req, res) {
  const user = await User.findByPk(req.user.id);
  const { first_name, last_name, phone } = req.body;
  const update = {};
  if (first_name !== undefined) update.first_name = first_name;
  if (last_name !== undefined) update.last_name = last_name;
  if (phone !== undefined) update.phone = phone;
  await user.update(update);
  return success(res, user, 'Profil mis à jour');
}

async function uploadMyAvatar(req, res) {
  if (!req.file) return error(res, 'Aucun fichier reçu', 400);
  const user = await User.findByPk(req.user.id);
  const avatar_url = `/uploads/avatars/${req.file.filename}`;
  await user.update({ avatar_url });
  return success(res, { avatar_url }, 'Avatar mis à jour');
}

/**
 * GET /api/users — owner liste les users de sa salle
 */
async function list(req, res) {
  const { page, limit, offset } = paginate(req.query);
  const where = { gym_id: req.gymId };
  if (req.query.role) where.role = req.query.role;

  const { rows, count } = await User.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });
  return success(res, { items: rows, meta: paginationMeta(count, page, limit) });
}

module.exports = { getMe, updateMe, uploadMyAvatar, list };
