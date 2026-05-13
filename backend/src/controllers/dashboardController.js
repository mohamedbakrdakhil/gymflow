/**
 * Controller Dashboard — stats agrégées pour la page d'accueil de l'owner
 */
const { Op, fn, col, literal } = require('sequelize');
const {
  Member,
  Subscription,
  Payment,
  CheckIn,
  Plan,
  sequelize,
} = require('../models');
const { addDays } = require('../utils/helpers');
const { success } = require('../utils/apiResponse');

/**
 * GET /api/dashboard/owner — vue d'ensemble
 */
async function ownerOverview(req, res) {
  const gymId = req.gymId;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const last30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const weekEnd = addDays(now, 7);

  const [
    totalMembers,
    activeMembers,
    newThisMonth,
    activeSubs,
    expiringThisWeek,
    revenueThisMonth,
    revenueAllTime,
    checkinsToday,
  ] = await Promise.all([
    Member.count({ where: { gym_id: gymId } }),
    Member.count({ where: { gym_id: gymId, status: 'active' } }),
    Member.count({
      where: { gym_id: gymId, created_at: { [Op.gte]: monthStart, [Op.lte]: monthEnd } },
    }),
    Subscription.count({
      where: { gym_id: gymId, status: 'active', end_date: { [Op.gte]: now } },
    }),
    Subscription.count({
      where: {
        gym_id: gymId,
        status: 'active',
        end_date: { [Op.between]: [now, weekEnd] },
      },
    }),
    Payment.sum('amount', {
      where: {
        gym_id: gymId,
        status: 'completed',
        paid_at: { [Op.between]: [monthStart, monthEnd] },
      },
    }),
    Payment.sum('amount', {
      where: { gym_id: gymId, status: 'completed' },
    }),
    CheckIn.count({
      where: {
        gym_id: gymId,
        check_in_time: {
          [Op.gte]: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        },
      },
    }),
  ]);

  // Évolution revenue 6 derniers mois
  const revenueByMonth = await Payment.findAll({
    where: {
      gym_id: gymId,
      status: 'completed',
      paid_at: { [Op.gte]: new Date(now.getFullYear(), now.getMonth() - 5, 1) },
    },
    attributes: [
      [fn('DATE_FORMAT', col('paid_at'), '%Y-%m'), 'month'],
      [fn('SUM', col('amount')), 'total'],
    ],
    group: [literal('month')],
    order: [[literal('month'), 'ASC']],
    raw: true,
  });

  // Check-ins 7 derniers jours
  const checkinsByDay = await CheckIn.findAll({
    where: {
      gym_id: gymId,
      check_in_time: { [Op.gte]: last30 },
    },
    attributes: [
      [fn('DATE', col('check_in_time')), 'day'],
      [fn('COUNT', col('id')), 'count'],
    ],
    group: [literal('day')],
    order: [[literal('day'), 'ASC']],
    raw: true,
  });

  // Top plans
  const topPlans = await Subscription.findAll({
    where: { gym_id: gymId },
    attributes: ['plan_id', [fn('COUNT', col('Subscription.id')), 'count']],
    group: ['plan_id', 'plan.id'],
    include: [{ model: Plan, as: 'plan', attributes: ['name', 'price'] }],
    order: [[literal('count'), 'DESC']],
    limit: 5,
  });

  return success(res, {
    members: { total: totalMembers, active: activeMembers, newThisMonth },
    subscriptions: { active: activeSubs, expiringThisWeek },
    revenue: {
      thisMonth: parseFloat(revenueThisMonth || 0),
      allTime: parseFloat(revenueAllTime || 0),
      byMonth: revenueByMonth,
    },
    checkins: { today: checkinsToday, byDay: checkinsByDay },
    topPlans,
  });
}

/**
 * GET /api/dashboard/member — vue membre
 */
async function memberOverview(req, res) {
  const member = await Member.findOne({
    where: { user_id: req.user.id, gym_id: req.gymId },
  });
  if (!member) return success(res, null);

  const activeSub = await Subscription.findOne({
    where: { member_id: member.id, status: 'active' },
    include: [{ model: Plan, as: 'plan' }],
    order: [['end_date', 'DESC']],
  });

  const recentCheckins = await CheckIn.findAll({
    where: { member_id: member.id },
    order: [['check_in_time', 'DESC']],
    limit: 10,
  });

  const totalCheckins = await CheckIn.count({ where: { member_id: member.id } });

  const totalPaid = (await Payment.sum('amount', {
    where: { member_id: member.id, status: 'completed' },
  })) || 0;

  return success(res, {
    member,
    activeSubscription: activeSub,
    recentCheckins,
    totalCheckins,
    totalPaid,
  });
}

module.exports = { ownerOverview, memberOverview };
