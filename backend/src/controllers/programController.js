/**
 * Controller Programs — programmes d'entraînement créés par un coach pour un member
 */
const { Program, Coach, Member } = require('../models');
const { success, created, error, notFound } = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');

async function list(req, res) {
  const where = { gym_id: req.gymId };

  // Member voit ses propres programmes
  if (req.role === ROLES.MEMBER) {
    const member = await Member.findOne({ where: { user_id: req.user.id, gym_id: req.gymId } });
    if (!member) return success(res, []);
    where.member_id = member.id;
  } else if (req.role === ROLES.COACH) {
    const coach = await Coach.findOne({ where: { user_id: req.user.id, gym_id: req.gymId } });
    if (!coach) return success(res, []);
    where.coach_id = coach.id;
  }

  if (req.query.member_id) where.member_id = req.query.member_id;
  if (req.query.status) where.status = req.query.status;

  const programs = await Program.findAll({
    where,
    include: [
      {
        model: Member,
        as: 'member',
        attributes: ['id', 'first_name', 'last_name', 'member_code', 'photo_url'],
      },
      { model: Coach, as: 'coach' },
    ],
    order: [['created_at', 'DESC']],
  });
  return success(res, programs);
}

async function getOne(req, res) {
  const prog = await Program.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
    include: [
      { model: Member, as: 'member' },
      { model: Coach, as: 'coach' },
    ],
  });
  if (!prog) return notFound(res, 'Programme introuvable');
  return success(res, prog);
}

async function create(req, res) {
  let coach_id = req.body.coach_id;
  if (req.role === ROLES.COACH) {
    const coach = await Coach.findOne({ where: { user_id: req.user.id, gym_id: req.gymId } });
    if (!coach) return error(res, 'Profil coach introuvable', 404);
    coach_id = coach.id;
  }

  const member = await Member.findOne({
    where: { id: req.body.member_id, gym_id: req.gymId },
  });
  if (!member) return error(res, 'Membre introuvable', 404);

  const prog = await Program.create({ ...req.body, coach_id, gym_id: req.gymId });
  return created(res, prog, 'Programme créé');
}

async function update(req, res) {
  const prog = await Program.findOne({ where: { id: req.params.id, gym_id: req.gymId } });
  if (!prog) return notFound(res, 'Programme introuvable');
  await prog.update(req.body);
  return success(res, prog, 'Programme modifié');
}

async function remove(req, res) {
  const prog = await Program.findOne({ where: { id: req.params.id, gym_id: req.gymId } });
  if (!prog) return notFound(res, 'Programme introuvable');
  await prog.destroy();
  return success(res, null, 'Programme supprimé');
}

module.exports = { list, getOne, create, update, remove };
