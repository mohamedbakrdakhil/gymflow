const Joi = require('joi');

const createSubscriptionSchema = Joi.object({
  member_id: Joi.string().uuid().required(),
  plan_id: Joi.string().uuid().required(),
  start_date: Joi.date().iso().required(),
  price_paid: Joi.number().min(0).required(),
  discount: Joi.number().min(0).default(0),
  notes: Joi.string().max(1000).allow('', null),
  // Si fourni, crée aussi un Payment lié
  create_payment: Joi.boolean().default(false),
  payment_method: Joi.string()
    .valid('cash', 'card', 'bank_transfer', 'online_stripe', 'online_cmi')
    .default('cash'),
});

const updateSubscriptionSchema = Joi.object({
  end_date: Joi.date().iso().optional(),
  status: Joi.string().valid('active', 'expired', 'frozen', 'cancelled').optional(),
  notes: Joi.string().max(1000).allow('', null),
});

const listSubscriptionSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  member_id: Joi.string().uuid().optional(),
  status: Joi.string().valid('active', 'expired', 'frozen', 'cancelled', '').allow(''),
  expiring_in_days: Joi.number().integer().min(0).max(365).optional(),
});

module.exports = {
  createSubscriptionSchema,
  updateSubscriptionSchema,
  listSubscriptionSchema,
};
