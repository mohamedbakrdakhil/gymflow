const express = require('express');
const Joi = require('joi');
const c = require('../controllers/checkinController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole, requireFeature } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
router.use(authenticate, tenant, requireFeature('qrCheckIn'));

const scanSchema = Joi.object({
  qr_code: Joi.string().required(),
  method: Joi.string().valid('qr_code', 'manual', 'card').default('qr_code'),
});

const manualSchema = Joi.object({
  member_id: Joi.string().uuid().required(),
});

const listSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  member_id: Joi.string().uuid().optional(),
  from: Joi.date().iso().optional(),
  to: Joi.date().iso().optional(),
});

router.post(
  '/scan',
  requireRole('owner', 'coach'),
  validate(scanSchema),
  asyncHandler(c.scan),
);
router.post(
  '/manual',
  requireRole('owner', 'coach'),
  validate(manualSchema),
  asyncHandler(c.manual),
);
router.post('/:id/checkout', requireRole('owner', 'coach'), asyncHandler(c.checkout));

router.get('/today', requireRole('owner', 'coach'), asyncHandler(c.today));
router.get('/', requireRole('owner', 'coach'), validate(listSchema, 'query'), asyncHandler(c.list));

module.exports = router;
