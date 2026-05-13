const Joi = require('joi');

const createPaymentSchema = Joi.object({
  member_id: Joi.string().uuid().required(),
  subscription_id: Joi.string().uuid().allow(null),
  amount: Joi.number().min(0).required(),
  payment_method: Joi.string()
    .valid('cash', 'card', 'bank_transfer', 'online_stripe', 'online_cmi')
    .required(),
  notes: Joi.string().max(1000).allow('', null),
});

const listPaymentSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  member_id: Joi.string().uuid().optional(),
  payment_method: Joi.string().optional(),
  status: Joi.string().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});

const refundSchema = Joi.object({
  reason: Joi.string().max(500).allow('', null),
});

module.exports = { createPaymentSchema, listPaymentSchema, refundSchema };
