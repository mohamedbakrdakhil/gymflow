/**
 * Controller Payments — création (cash), reçus PDF, refund
 */
const { Op } = require('sequelize');
const { Payment, Member, Subscription, Plan, Gym, Notification } = require('../models');
const { generatePaymentReference, paginate, paginationMeta } = require('../utils/helpers');
const { generateReceipt } = require('../services/pdfService');
const { sendEmail, templates } = require('../services/emailService');
const { success, created, error, notFound } = require('../utils/apiResponse');
const logger = require('../utils/logger');

async function list(req, res) {
  const { page, limit, offset } = paginate(req.query);
  const { member_id, payment_method, status, from, to } = req.query;

  const where = { gym_id: req.gymId };
  if (member_id) where.member_id = member_id;
  if (payment_method) where.payment_method = payment_method;
  if (status) where.status = status;
  if (from || to) {
    where.paid_at = {};
    if (from) where.paid_at[Op.gte] = new Date(from);
    if (to) where.paid_at[Op.lte] = new Date(to);
  }

  const { rows, count } = await Payment.findAndCountAll({
    where,
    limit,
    offset,
    order: [['paid_at', 'DESC']],
    include: [
      { model: Member, as: 'member', attributes: ['id', 'first_name', 'last_name', 'member_code'] },
      { model: Subscription, as: 'subscription', include: [{ model: Plan, as: 'plan' }] },
    ],
  });

  return success(res, { items: rows, meta: paginationMeta(count, page, limit) });
}

async function getOne(req, res) {
  const payment = await Payment.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
    include: [
      { model: Member, as: 'member' },
      { model: Subscription, as: 'subscription', include: [{ model: Plan, as: 'plan' }] },
    ],
  });
  if (!payment) return notFound(res, 'Paiement introuvable');
  return success(res, payment);
}

async function create(req, res) {
  const { member_id, subscription_id, amount, payment_method, notes } = req.body;

  const member = await Member.findOne({ where: { id: member_id, gym_id: req.gymId } });
  if (!member) return error(res, 'Membre introuvable', 404);

  const payment = await Payment.create({
    gym_id: req.gymId,
    member_id,
    subscription_id,
    amount,
    payment_method,
    notes,
    reference: generatePaymentReference(),
    status: 'completed',
    paid_at: new Date(),
  });

  // Génération reçu PDF (async, non bloquant)
  generateReceiptAsync(payment.id, req.gymId).catch((e) =>
    logger.warn('Génération PDF échouée:', e.message),
  );

  // Email reçu (non bloquant)
  if (member.email) {
    const gym = await Gym.findByPk(req.gymId);
    const tpl = templates.paymentReceipt(
      member.first_name,
      parseFloat(amount).toFixed(2),
      payment.reference,
      gym?.name || 'votre salle',
    );
    sendEmail({ to: member.email, ...tpl }).catch((e) =>
      logger.warn('Email reçu non envoyé:', e.message),
    );
  }

  // Notification in-app si user lié
  if (member.user_id) {
    await Notification.create({
      gym_id: req.gymId,
      user_id: member.user_id,
      type: 'payment_received',
      title: 'Paiement reçu',
      message: `Votre paiement de ${parseFloat(amount).toFixed(2)} DH a été enregistré`,
      data: { payment_id: payment.id, reference: payment.reference },
    });
  }

  return created(res, payment, 'Paiement enregistré');
}

async function generateReceiptAsync(paymentId, gymId) {
  const payment = await Payment.findOne({
    where: { id: paymentId, gym_id: gymId },
    include: [
      { model: Member, as: 'member' },
      { model: Subscription, as: 'subscription', include: [{ model: Plan, as: 'plan' }] },
    ],
  });
  if (!payment) return;
  const gym = await Gym.findByPk(gymId);
  const url = await generateReceipt({
    payment,
    member: payment.member,
    gym,
    subscription: payment.subscription,
    plan: payment.subscription?.plan,
  });
  payment.receipt_url = url;
  await payment.save();
}

/**
 * GET /api/payments/:id/receipt — télécharge le PDF
 */
async function downloadReceipt(req, res) {
  const payment = await Payment.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
    include: [
      { model: Member, as: 'member' },
      { model: Subscription, as: 'subscription', include: [{ model: Plan, as: 'plan' }] },
    ],
  });
  if (!payment) return notFound(res, 'Paiement introuvable');

  // Génère à la volée si pas encore créé
  if (!payment.receipt_url) {
    const gym = await Gym.findByPk(req.gymId);
    const url = await generateReceipt({
      payment,
      member: payment.member,
      gym,
      subscription: payment.subscription,
      plan: payment.subscription?.plan,
    });
    payment.receipt_url = url;
    await payment.save();
  }

  return success(res, { receipt_url: payment.receipt_url });
}

async function refund(req, res) {
  const payment = await Payment.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!payment) return notFound(res, 'Paiement introuvable');
  if (payment.status === 'refunded') return error(res, 'Déjà remboursé', 400);
  await payment.update({ status: 'refunded', notes: req.body.reason });
  return success(res, payment, 'Paiement remboursé');
}

module.exports = { list, getOne, create, downloadReceipt, refund };
