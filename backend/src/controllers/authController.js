/**
 * Controller d'authentification
 */
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { sequelize, User, Gym, Plan } = require('../models');
const { generateTokenPair, verifyRefreshToken, signAccessToken } = require('../utils/jwt');
const { generateSubdomain, addDays } = require('../utils/helpers');
const { ROLES, DEFAULT_TRIAL_DAYS, PLAN_FEATURES } = require('../config/constants');
const { success, created, error, unauthorized } = require('../utils/apiResponse');
const { sendEmail, templates } = require('../services/emailService');
const env = require('../config/env');
const logger = require('../utils/logger');

/**
 * POST /api/auth/register-gym
 * Crée une nouvelle salle + un owner en une seule transaction
 */
async function registerGym(req, res) {
  const { gym: gymData, owner, plan_type } = req.body;

  // Vérifie si email owner déjà utilisé
  const existing = await User.unscoped().findOne({ where: { email: owner.email } });
  if (existing) return error(res, 'Cet email est déjà utilisé', 409);

  const t = await sequelize.transaction();
  try {
    // Génère subdomain unique
    let baseSubdomain = generateSubdomain(gymData.name) || 'gym';
    let subdomain = baseSubdomain;
    let attempt = 0;
    while (await Gym.findOne({ where: { subdomain }, transaction: t })) {
      attempt++;
      subdomain = `${baseSubdomain}-${attempt}`;
    }

    const planFeatures = PLAN_FEATURES[plan_type] || PLAN_FEATURES.basique;

    const gym = await Gym.create(
      {
        name: gymData.name,
        subdomain,
        address: gymData.address,
        city: gymData.city,
        phone: gymData.phone,
        email: gymData.email,
        plan_type,
        plan_started_at: new Date(),
        plan_expires_at: addDays(new Date(), DEFAULT_TRIAL_DAYS),
        status: 'trial',
      },
      { transaction: t },
    );

    const user = await User.create(
      {
        gym_id: gym.id,
        email: owner.email,
        password_hash: owner.password,
        role: ROLES.OWNER,
        first_name: owner.first_name,
        last_name: owner.last_name,
        phone: owner.phone,
        email_verified: false,
      },
      { transaction: t },
    );

    // Plans par défaut pour la salle
    await Plan.bulkCreate(
      [
        {
          gym_id: gym.id,
          name: 'Mensuel',
          duration_days: 30,
          price: 300,
          description: 'Abonnement mensuel standard',
        },
        {
          gym_id: gym.id,
          name: 'Trimestriel',
          duration_days: 90,
          price: 800,
          description: '3 mois - économisez 100 DH',
        },
        {
          gym_id: gym.id,
          name: 'Annuel',
          duration_days: 365,
          price: 2800,
          description: '12 mois - meilleur tarif',
        },
      ],
      { transaction: t },
    );

    await t.commit();

    // Email de bienvenue (non bloquant)
    try {
      const tpl = templates.welcome(gym.name, user.first_name);
      await sendEmail({ to: user.email, ...tpl });
    } catch (e) {
      logger.warn('Email bienvenue non envoyé:', e.message);
    }

    const tokens = generateTokenPair(user);
    return created(
      res,
      {
        user: { id: user.id, email: user.email, role: user.role, full_name: user.fullName() },
        gym: { id: gym.id, name: gym.name, subdomain: gym.subdomain, plan_type, features: planFeatures },
        ...tokens,
      },
      'Salle créée avec succès',
    );
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  const { email, password, subdomain } = req.body;

  const where = { email };
  if (subdomain) {
    const gym = await Gym.findOne({ where: { subdomain } });
    if (gym) where.gym_id = gym.id;
  }

  const user = await User.scope('withPassword').findOne({
    where,
    include: [{ model: Gym, as: 'gym' }],
  });
  if (!user || !user.is_active) return unauthorized(res, 'Identifiants invalides');

  const valid = await user.validPassword(password);
  if (!valid) return unauthorized(res, 'Identifiants invalides');

  user.last_login_at = new Date();
  await user.save();

  const tokens = generateTokenPair(user);
  const features = user.gym ? PLAN_FEATURES[user.gym.plan_type] : null;

  return success(res, {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      avatar_url: user.avatar_url,
      gym_id: user.gym_id,
    },
    gym: user.gym
      ? {
          id: user.gym.id,
          name: user.gym.name,
          subdomain: user.gym.subdomain,
          plan_type: user.gym.plan_type,
          logo_url: user.gym.logo_url,
          primary_color: user.gym.primary_color,
          secondary_color: user.gym.secondary_color,
          status: user.gym.status,
          features,
        }
      : null,
    ...tokens,
  });
}

/**
 * POST /api/auth/refresh-token
 */
async function refreshToken(req, res) {
  const { refresh_token } = req.body;
  let payload;
  try {
    payload = verifyRefreshToken(refresh_token);
  } catch (e) {
    return unauthorized(res, 'Refresh token invalide ou expiré');
  }
  const user = await User.findByPk(payload.sub);
  if (!user || !user.is_active) return unauthorized(res, 'Utilisateur introuvable');

  const accessToken = signAccessToken({
    sub: user.id,
    gym_id: user.gym_id,
    role: user.role,
    email: user.email,
  });
  return success(res, { accessToken });
}

/**
 * POST /api/auth/logout
 * Stateless (JWT) — le client supprime les tokens. Endpoint pour logger.
 */
async function logout(req, res) {
  return success(res, null, 'Déconnexion réussie');
}

/**
 * POST /api/auth/forgot-password
 */
async function forgotPassword(req, res) {
  const { email } = req.body;
  const user = await User.unscoped().findOne({ where: { email } });
  // Réponse identique même si user inexistant (sécurité)
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    user.reset_password_token = crypto.createHash('sha256').update(token).digest('hex');
    user.reset_password_expires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const link = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    try {
      const tpl = templates.resetPassword(user.first_name, link);
      await sendEmail({ to: user.email, ...tpl });
    } catch (e) {
      logger.warn('Email reset password non envoyé:', e.message);
    }
  }
  return success(res, null, 'Si un compte existe, un email vous a été envoyé');
}

/**
 * POST /api/auth/reset-password
 */
async function resetPassword(req, res) {
  const { token, password } = req.body;
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.unscoped().findOne({
    where: { reset_password_token: hashed },
  });
  if (!user || !user.reset_password_expires || user.reset_password_expires < new Date()) {
    return error(res, 'Token invalide ou expiré', 400);
  }
  user.password_hash = password;
  user.reset_password_token = null;
  user.reset_password_expires = null;
  await user.save();
  return success(res, null, 'Mot de passe réinitialisé');
}

/**
 * POST /api/auth/change-password (user authentifié)
 */
async function changePassword(req, res) {
  const { current_password, new_password } = req.body;
  const user = await User.scope('withPassword').findByPk(req.user.id);
  const valid = await user.validPassword(current_password);
  if (!valid) return error(res, 'Mot de passe actuel incorrect', 400);
  user.password_hash = new_password;
  await user.save();
  return success(res, null, 'Mot de passe modifié');
}

/**
 * GET /api/auth/me
 */
async function me(req, res) {
  const user = await User.findByPk(req.user.id, {
    include: [{ model: Gym, as: 'gym' }],
  });
  const features = user.gym ? PLAN_FEATURES[user.gym.plan_type] : null;
  return success(res, {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      avatar_url: user.avatar_url,
      gym_id: user.gym_id,
    },
    gym: user.gym
      ? {
          id: user.gym.id,
          name: user.gym.name,
          subdomain: user.gym.subdomain,
          plan_type: user.gym.plan_type,
          logo_url: user.gym.logo_url,
          primary_color: user.gym.primary_color,
          secondary_color: user.gym.secondary_color,
          status: user.gym.status,
          features,
        }
      : null,
  });
}

module.exports = {
  registerGym,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
};
