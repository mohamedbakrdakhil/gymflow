const express = require('express');
const Joi = require('joi');
const c = require('../controllers/gymController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const { uploadLogo } = require('../middleware/upload');

const router = express.Router();
router.use(authenticate, tenant);

const updateSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional(),
  address: Joi.string().max(500).allow('', null),
  city: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  email: Joi.string().email().allow('', null),
  timezone: Joi.string().max(50).optional(),
});

const brandingSchema = Joi.object({
  primary_color: Joi.string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .required(),
  secondary_color: Joi.string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .required(),
});

router.get('/', asyncHandler(c.getCurrent));
router.put('/', requireRole('owner'), validate(updateSchema), asyncHandler(c.update));
router.put(
  '/branding',
  requireRole('owner'),
  validate(brandingSchema),
  asyncHandler(c.updateBranding),
);
router.post(
  '/logo',
  requireRole('owner'),
  uploadLogo.single('logo'),
  asyncHandler(c.uploadLogo),
);

module.exports = router;
