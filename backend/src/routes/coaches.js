const express = require('express');
const Joi = require('joi');
const c = require('../controllers/coachController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole, requireFeature } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
router.use(authenticate, tenant, requireFeature('coaches'));

const createSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  first_name: Joi.string().min(1).max(100).required(),
  last_name: Joi.string().min(1).max(100).required(),
  phone: Joi.string().max(20).allow('', null),
  specialty: Joi.string().max(200).allow('', null),
  bio: Joi.string().max(2000).allow('', null),
  certifications: Joi.array().items(Joi.string()).allow(null),
  hourly_rate: Joi.number().min(0).allow(null),
});

const updateSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).optional(),
  last_name: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().max(20).allow('', null),
  specialty: Joi.string().max(200).allow('', null),
  bio: Joi.string().max(2000).allow('', null),
  certifications: Joi.array().items(Joi.string()).allow(null),
  hourly_rate: Joi.number().min(0).allow(null),
  is_active: Joi.boolean().optional(),
});

router.get('/', asyncHandler(c.list));
router.get('/:id', asyncHandler(c.getOne));
router.post('/', requireRole('owner'), validate(createSchema), asyncHandler(c.create));
router.put('/:id', requireRole('owner'), validate(updateSchema), asyncHandler(c.update));
router.delete('/:id', requireRole('owner'), asyncHandler(c.remove));

module.exports = router;
