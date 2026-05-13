/**
 * Controller Coaches — CRUD coachs + création du compte user lié
 */
const { sequelize, Coach, User } = require('../models');
const { success, created, error, notFound } = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');
const { paginate, paginationMeta } = require('../utils/helpers');

async function list(req, res) {
  const { page, limit, offset } = paginate(req.query);
  const { rows, count } = await Coach.findAndCountAll({
    where: { gym_id: req.gymId },
    limit,
    offset,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'avatar_url', 'is_active'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
  return success(res, { items: rows, meta: paginationMeta(count, page, limit) });
}

async function getOne(req, res) {
  const coach = await Coach.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
    include: [{ model: User, as: 'user' }],
  });
  if (!coach) return notFound(res, 'Coach introuvable');
  return success(res, coach);
}

async function create(req, res) {
  const { email, password, first_name, last_name, phone, specialty, bio, certifications, hourly_rate } =
    req.body;

  const existing = await User.unscoped().findOne({ where: { email, gym_id: req.gymId } });
  if (existing) return error(res, 'Cet email est déjà utilisé dans cette salle', 409);

  const t = await sequelize.transaction();
  try {
    const user = await User.create(
      {
        gym_id: req.gymId,
        email,
        password_hash: password,
        role: ROLES.COACH,
        first_name,
        last_name,
        phone,
        email_verified: true,
      },
      { transaction: t },
    );

    const coach = await Coach.create(
      {
        gym_id: req.gymId,
        user_id: user.id,
        specialty,
        bio,
        certifications,
        hourly_rate,
      },
      { transaction: t },
    );

    await t.commit();
    return created(res, { coach, user: { id: user.id, email: user.email } }, 'Coach créé');
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function update(req, res) {
  const coach = await Coach.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
    include: [{ model: User, as: 'user' }],
  });
  if (!coach) return notFound(res, 'Coach introuvable');

  const { first_name, last_name, phone, specialty, bio, certifications, hourly_rate, is_active } =
    req.body;

  const t = await sequelize.transaction();
  try {
    if (coach.user) {
      const userUpdate = {};
      if (first_name !== undefined) userUpdate.first_name = first_name;
      if (last_name !== undefined) userUpdate.last_name = last_name;
      if (phone !== undefined) userUpdate.phone = phone;
      if (Object.keys(userUpdate).length) await coach.user.update(userUpdate, { transaction: t });
    }
    await coach.update(
      { specialty, bio, certifications, hourly_rate, is_active },
      { transaction: t },
    );
    await t.commit();
    return success(res, coach, 'Coach modifié');
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function remove(req, res) {
  const coach = await Coach.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
    include: [{ model: User, as: 'user' }],
  });
  if (!coach) return notFound(res, 'Coach introuvable');
  const t = await sequelize.transaction();
  try {
    await coach.destroy({ transaction: t });
    if (coach.user) await coach.user.destroy({ transaction: t });
    await t.commit();
    return success(res, null, 'Coach supprimé');
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

module.exports = { list, getOne, create, update, remove };
