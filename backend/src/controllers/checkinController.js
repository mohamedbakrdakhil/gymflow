/**
 * Controller Check-Ins — scan QR + check manuel + historique
 */
const { Op } = require('sequelize');
const { CheckIn, Member, Subscription, Plan } = require('../models');
const { paginate, paginationMeta } = require('../utils/helpers');
const { success, created, error, notFound } = require('../utils/apiResponse');

/**
 * POST /api/checkins/scan — scanner un QR code
 */
async function scan(req, res) {
  const { qr_code, method = 'qr_code' } = req.body;
  if (!qr_code) return error(res, 'QR code requis', 400);

  const member = await Member.findOne({
    where: { qr_code, gym_id: req.gymId },
  });
  if (!member) return error(res, 'Membre introuvable — QR invalide', 404);
  if (member.status !== 'active') {
    return error(res, `Membre ${member.status} — accès refusé`, 403);
  }

  // Vérifie abonnement actif
  const activeSub = await Subscription.findOne({
    where: {
      member_id: member.id,
      gym_id: req.gymId,
      status: 'active',
      end_date: { [Op.gte]: new Date() },
    },
    include: [{ model: Plan, as: 'plan' }],
    order: [['end_date', 'DESC']],
  });
  if (!activeSub) {
    return error(res, `Aucun abonnement actif pour ${member.first_name} ${member.last_name}`, 403);
  }

  // Évite double check-in dans les 5 dernières minutes
  const recent = await CheckIn.findOne({
    where: {
      member_id: member.id,
      check_in_time: { [Op.gte]: new Date(Date.now() - 5 * 60 * 1000) },
    },
  });
  if (recent) {
    return success(res, { member, checkin: recent, duplicate: true }, 'Check-in déjà enregistré');
  }

  const checkin = await CheckIn.create({
    gym_id: req.gymId,
    member_id: member.id,
    subscription_id: activeSub.id,
    method,
    check_in_time: new Date(),
  });

  return created(
    res,
    {
      member: {
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        photo_url: member.photo_url,
        member_code: member.member_code,
      },
      subscription: {
        id: activeSub.id,
        plan_name: activeSub.plan?.name,
        end_date: activeSub.end_date,
      },
      checkin,
    },
    `Bienvenue ${member.first_name} !`,
  );
}

/**
 * POST /api/checkins/manual — check-in manuel par member_id
 */
async function manual(req, res) {
  const { member_id } = req.body;
  const member = await Member.findOne({ where: { id: member_id, gym_id: req.gymId } });
  if (!member) return notFound(res, 'Membre introuvable');
  req.body.qr_code = member.qr_code;
  req.body.method = 'manual';
  return scan(req, res);
}

/**
 * POST /api/checkins/:id/checkout — sortie manuelle (optionnel)
 */
async function checkout(req, res) {
  const checkin = await CheckIn.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!checkin) return notFound(res, 'Check-in introuvable');
  await checkin.update({ check_out_time: new Date() });
  return success(res, checkin);
}

/**
 * GET /api/checkins — historique
 */
async function list(req, res) {
  const { page, limit, offset } = paginate(req.query);
  const { member_id, from, to } = req.query;

  const where = { gym_id: req.gymId };
  if (member_id) where.member_id = member_id;
  if (from || to) {
    where.check_in_time = {};
    if (from) where.check_in_time[Op.gte] = new Date(from);
    if (to) where.check_in_time[Op.lte] = new Date(to);
  }

  const { rows, count } = await CheckIn.findAndCountAll({
    where,
    limit,
    offset,
    order: [['check_in_time', 'DESC']],
    include: [
      {
        model: Member,
        as: 'member',
        attributes: ['id', 'first_name', 'last_name', 'photo_url', 'member_code'],
      },
    ],
  });

  return success(res, { items: rows, meta: paginationMeta(count, page, limit) });
}

/**
 * GET /api/checkins/today — résumé aujourd'hui
 */
async function today(req, res) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const checkins = await CheckIn.findAll({
    where: { gym_id: req.gymId, check_in_time: { [Op.between]: [start, end] } },
    order: [['check_in_time', 'DESC']],
    include: [
      {
        model: Member,
        as: 'member',
        attributes: ['id', 'first_name', 'last_name', 'photo_url', 'member_code'],
      },
    ],
  });

  return success(res, {
    count: checkins.length,
    unique_members: new Set(checkins.map((c) => c.member_id)).size,
    items: checkins,
  });
}

module.exports = { scan, manual, checkout, list, today };
