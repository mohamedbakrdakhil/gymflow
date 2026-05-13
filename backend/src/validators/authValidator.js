/**
 * Validators Joi pour les endpoints d'authentification
 */
const Joi = require('joi');

const registerGymSchema = Joi.object({
  gym: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    city: Joi.string().max(100).allow('', null),
    address: Joi.string().max(500).allow('', null),
    phone: Joi.string().max(20).allow('', null),
    email: Joi.string().email().allow('', null),
  }).required(),
  owner: Joi.object({
    first_name: Joi.string().min(2).max(100).required(),
    last_name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().max(20).allow('', null),
    password: Joi.string().min(8).max(100).required(),
  }).required(),
  plan_type: Joi.string().valid('basique', 'pro', 'premium').default('basique'),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  subdomain: Joi.string().allow('', null),
});

const refreshSchema = Joi.object({
  refresh_token: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).max(100).required(),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).max(100).required(),
});

module.exports = {
  registerGymSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
