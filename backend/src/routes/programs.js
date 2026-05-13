const express = require('express');
const Joi = require('joi');
const c = require('../controllers/programController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole, requireFeature } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
router.use(authenticate, tenant, requireFeature('coaches'));

const exerciseSchema = Joi.object({
  name: Joi.string().required(),
  sets: Joi.number().integer().min(1).optional(),
  reps: Joi.alternatives().try(Joi.number().integer(), Joi.string()).optional(),
  rest_seconds: Joi.number().integer().min(0).optional(),
  notes: Joi.string().allow('').optional(),
  video_url: Joi.string().uri().allow('').optional(),
});

const createSchema = Joi.object({
  member_id: Joi.string().uuid().required(),
  coach_id: Joi.string().uuid().optional(),
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(2000).allow('', null),
  exercises: Joi.array().items(exerciseSchema).default([]),
  start_date: Joi.date().iso().required(),
  end_date: Joi.date().iso().required(),
  status: Joi.string().valid('active', 'completed', 'paused').default('active'),
});

router.get('/', asyncHandler(c.list));
router.get('/:id', asyncHandler(c.getOne));
router.post('/', requireRole('owner', 'coach'), validate(createSchema), asyncHandler(c.create));
router.put(
  '/:id',
  requireRole('owner', 'coach'),
  validate(createSchema.fork(['member_id', 'name', 'start_date', 'end_date'], (s) => s.optional())),
  asyncHandler(c.update),
);
router.delete('/:id', requireRole('owner', 'coach'), asyncHandler(c.remove));

module.exports = router;
