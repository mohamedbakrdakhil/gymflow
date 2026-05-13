/**
 * Controller Subscriptions — création, freeze/unfreeze, expiration
 */
const { Op } = require('sequelize');
const { sequelize, Subscription, Plan, Member, Payment } = require('../models');
const {
  addDays,
  daysBetween,
  generatePaymentReference,
  paginate,
  paginationMeta,
} = require('../utils/helpers');
const { success, created, error, notFound } = require('../utils/apiResponse');

async function list(req, res) {
  const { page, limit, offset } = paginate(req.query);
  const { member_id, status, expiring_in_days } = req.query;

  const where = { gym_id: req.gymId };
  if (member_id) where.member_id = member_id;
  if (status) where.status = status;
  if (expiring_in_days !== undefined) {
    const limitDate = addDays(new Date(), parseInt(expiring_in_days, 10));
    where.status = 'active';
    where.end_date = { [Op.between]: [new Date(), limitDate] };
  }

  const { rows, count } = await Subscription.findAndCountAll({
    where,
    limit,
    offset,
    order: [['end_date', 'ASC']],
    include: [
      { model: Plan, as: 'plan' },
      { model: Member, as: 'member', attributes: ['id', 'first_name', 'last_name', 'phone', 'member_code'] },
    ],
  });

  return success(res, { items: rows, meta: paginationMeta(count, page, limit) });
}

async function getOne(req, res) {
  const sub = await Subscription.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
    include: [
      { model: Plan, as: 'plan' },
      { model: Member, as: 'member' },
      { model: Payment, as: 'payments' },
    ],
  });
  if (!sub) return notFound(res, 'Abonnement introuvable');
  return success(res, sub);
}

async function create(req, res) {
  const { member_id, plan_id, start_date, price_paid, discount, notes, create_payment, payment_method } =
    req.body;

  const plan = await Plan.findOne({ where: { id: plan_id, gym_id: req.gymId } });
  if (!plan) return error(res, 'Plan introuvable', 404);

  const member = await Member.findOne({ where: { id: member_id, gym_id: req.gymId } });
  if (!member) return error(res, 'Membre introuvable', 404);

  const end_date = addDays(start_date, plan.duration_days);

  const t = await sequelize.transaction();
  try {
    const sub = await Subscription.create(
      {
        gym_id: req.gymId,
        member_id,
        plan_id,
        start_date,
        end_date,
        price_paid,
        discount: discount || 0,
        notes,
        status: 'active',
      },
      { transaction: t },
    );

    let payment = null;
    if (create_payment) {
      payment = await Payment.create(
        {
          gym_id: req.gymId,
          subscription_id: sub.id,
          member_id,
          amount: price_paid,
          payment_method,
          reference: generatePaymentReference(),
          status: 'completed',
          paid_at: new Date(),
        },
        { transaction: t },
      );
    }

    await t.commit();
    return created(res, { subscription: sub, payment }, 'Abonnement créé');
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function update(req, res) {
  const sub = await Subscription.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!sub) return notFound(res, 'Abonnement introuvable');
  await sub.update(req.body);
  return success(res, sub, 'Abonnement modifié');
}

/**
 * POST /api/subscriptions/:id/freeze — gel temporaire
 */
async function freeze(req, res) {
  const sub = await Subscription.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!sub) return notFound(res, 'Abonnement introuvable');
  if (sub.status !== 'active') return error(res, 'Seuls les abonnements actifs peuvent être gelés', 400);
  await sub.update({ status: 'frozen', frozen_at: new Date() });
  return success(res, sub, 'Abonnement gelé');
}

/**
 * POST /api/subscriptions/:id/unfreeze — dégel + extension end_date
 */
async function unfreeze(req, res) {
  const sub = await Subscription.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!sub) return notFound(res, 'Abonnement introuvable');
  if (sub.status !== 'frozen') return error(res, 'Cet abonnement n\'est pas gelé', 400);
  const frozenDays = daysBetween(sub.frozen_at, new Date());
  await sub.update({
    status: 'active',
    end_date: addDays(sub.end_date, frozenDays),
    frozen_at: null,
    frozen_days_total: sub.frozen_days_total + frozenDays,
  });
  return success(res, sub, `Abonnement réactivé (+${frozenDays} jours)`);
}

async function cancel(req, res) {
  const sub = await Subscription.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!sub) return notFound(res, 'Abonnement introuvable');
  await sub.update({ status: 'cancelled' });
  return success(res, sub, 'Abonnement annulé');
}

async function remove(req, res) {
  const sub = await Subscription.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!sub) return notFound(res, 'Abonnement introuvable');
  await sub.destroy();
  return success(res, null, 'Abonnement supprimé');
}

module.exports = { list, getOne, create, update, freeze, unfreeze, cancel, remove };
