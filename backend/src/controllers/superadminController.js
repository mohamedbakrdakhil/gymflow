/**
 * Controller Super Admin — gestion globale des salles SaaS
 */
const { Op, fn, col, literal } = require('sequelize');
const { Gym, User, Member, SaasSubscription, Subscription, Payment } = require('../models');
const { success, notFound, error } = require('../utils/apiResponse');
const { paginate, paginationMeta } = require('../utils/helpers');
const { PLAN_FEATURES } = require('../config/constants');

async function listGyms(req, res) {
  const { page, limit, offset } = paginate(req.query);
  const where = {};
  if (req.query.status) where.status = req.query.status;
  if (req.query.plan_type) where.plan_type = req.query.plan_type;
  if (req.query.search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${req.query.search}%` } },
      { subdomain: { [Op.like]: `%${req.query.search}%` } },
    ];
  }

  const { rows, count } = await Gym.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    include: [{ model: SaasSubscription, as: 'saasSubscription' }],
  });

  // Enrichit avec count members
  const enriched = await Promise.all(
    rows.map(async (g) => {
      const memberCount = await Member.count({ where: { gym_id: g.id } });
      return { ...g.toJSON(), memberCount };
    }),
  );

  return success(res, { items: enriched, meta: paginationMeta(count, page, limit) });
}

async function getGym(req, res) {
  const gym = await Gym.findByPk(req.params.id, {
    include: [{ model: SaasSubscription, as: 'saasSubscription' }],
  });
  if (!gym) return notFound(res, 'Salle introuvable');
  return success(res, gym);
}

async function updateGymStatus(req, res) {
  const gym = await Gym.findByPk(req.params.id);
  if (!gym) return notFound(res, 'Salle introuvable');
  await gym.update({ status: req.body.status });
  return success(res, gym, `Statut changé en ${req.body.status}`);
}

async function updateGymPlan(req, res) {
  const gym = await Gym.findByPk(req.params.id);
  if (!gym) return notFound(res, 'Salle introuvable');
  const { plan_type, plan_expires_at } = req.body;
  await gym.update({
    plan_type,
    plan_expires_at: plan_expires_at || gym.plan_expires_at,
    status: 'active',
  });
  return success(res, gym, 'Plan modifié');
}

async function deleteGym(req, res) {
  const gym = await Gym.findByPk(req.params.id);
  if (!gym) return notFound(res, 'Salle introuvable');
  await gym.destroy();
  return success(res, null, 'Salle supprimée');
}

/**
 * GET /api/superadmin/stats — métriques globales du SaaS
 */
async function stats(req, res) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalGyms,
    activeGyms,
    trialGyms,
    suspendedGyms,
    totalMembers,
    gymsByPlan,
  ] = await Promise.all([
    Gym.count(),
    Gym.count({ where: { status: 'active' } }),
    Gym.count({ where: { status: 'trial' } }),
    Gym.count({ where: { status: 'suspended' } }),
    Member.count(),
    Gym.findAll({
      attributes: ['plan_type', [fn('COUNT', col('id')), 'count']],
      group: ['plan_type'],
      raw: true,
    }),
  ]);

  // Revenue SaaS estimé (basé sur plans actifs)
  const activeGymsByPlan = await Gym.findAll({
    where: { status: { [Op.in]: ['active', 'trial'] } },
    attributes: ['plan_type', [fn('COUNT', col('id')), 'count']],
    group: ['plan_type'],
    raw: true,
  });
  let estimatedMRR = 0;
  activeGymsByPlan.forEach((g) => {
    const price = PLAN_FEATURES[g.plan_type]?.monthlyPriceMAD || 0;
    estimatedMRR += price * parseInt(g.count, 10);
  });

  return success(res, {
    gyms: {
      total: totalGyms,
      active: activeGyms,
      trial: trialGyms,
      suspended: suspendedGyms,
      byPlan: gymsByPlan,
    },
    totalMembers,
    estimatedMRR,
  });
}

module.exports = { listGyms, getGym, updateGymStatus, updateGymPlan, deleteGym, stats };
