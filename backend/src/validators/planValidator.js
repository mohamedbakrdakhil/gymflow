const Joi = require('joi');

const createPlanSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  duration_days: Joi.number().integer().min(1).max(3650).required(),
  price: Joi.number().min(0).required(),
  description: Joi.string().max(2000).allow('', null),
  features: Joi.array().items(Joi.string()).allow(null),
  is_active: Joi.boolean().default(true),
});

const updatePlanSchema = createPlanSchema.fork(
  ['name', 'duration_days', 'price'],
  (s) => s.optional(),
);

module.exports = { createPlanSchema, updatePlanSchema };
