const express = require('express');
const Joi = require('joi');
const c = require('../controllers/superadminController');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
router.use(authenticate, requireRole('super_admin'));

const statusSchema = Joi.object({
  status: Joi.string().valid('active', 'suspended', 'trial', 'cancelled').required(),
});

const planSchema = Joi.object({
  plan_type: Joi.string().valid('basique', 'pro', 'premium').required(),
  plan_expires_at: Joi.date().iso().optional(),
});

router.get('/stats', asyncHandler(c.stats));
router.get('/gyms', asyncHandler(c.listGyms));
router.get('/gyms/:id', asyncHandler(c.getGym));
router.put('/gyms/:id/status', validate(statusSchema), asyncHandler(c.updateGymStatus));
router.put('/gyms/:id/plan', validate(planSchema), asyncHandler(c.updateGymPlan));
router.delete('/gyms/:id', asyncHandler(c.deleteGym));

module.exports = router;
