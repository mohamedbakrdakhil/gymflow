const Joi = require('joi');

const createMemberSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  phone: Joi.string().max(20).allow('', null),
  email: Joi.string().email().allow('', null),
  birth_date: Joi.date().iso().allow(null),
  gender: Joi.string().valid('male', 'female').allow(null),
  address: Joi.string().max(500).allow('', null),
  emergency_contact_name: Joi.string().max(100).allow('', null),
  emergency_contact_phone: Joi.string().max(20).allow('', null),
  medical_notes: Joi.string().max(2000).allow('', null),
  status: Joi.string().valid('active', 'inactive', 'suspended').default('active'),
});

const updateMemberSchema = createMemberSchema.fork(
  ['first_name', 'last_name'],
  (s) => s.optional(),
);

const listMemberSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow('').default(''),
  status: Joi.string().valid('active', 'inactive', 'suspended', '').allow(''),
  sort: Joi.string().default('-created_at'),
});

const bodyMeasurementsSchema = Joi.object({
  weight_kg: Joi.number().min(0).max(500).allow(null),
  height_cm: Joi.number().min(0).max(300).allow(null),
  body_fat_percent: Joi.number().min(0).max(100).allow(null),
  measurements: Joi.object().allow(null),
});

const nutritionSchema = Joi.object({
  daily_calories_target: Joi.number().integer().min(500).max(10000).allow(null),
  macros_target: Joi.object({
    protein_g: Joi.number().min(0),
    carbs_g: Joi.number().min(0),
    fat_g: Joi.number().min(0),
  }).allow(null),
});

module.exports = {
  createMemberSchema,
  updateMemberSchema,
  listMemberSchema,
  bodyMeasurementsSchema,
  nutritionSchema,
};
