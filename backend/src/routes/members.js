const express = require('express');
const c = require('../controllers/memberController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole, requireFeature } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const { uploadMemberPhoto } = require('../middleware/upload');
const v = require('../validators/memberValidator');

const router = express.Router();
router.use(authenticate, tenant);

const ownerOrCoach = requireRole('owner', 'coach', 'super_admin');

router.get('/export', ownerOrCoach, asyncHandler(c.exportMembers));
router.get('/', ownerOrCoach, validate(v.listMemberSchema, 'query'), asyncHandler(c.list));
router.get('/:id', ownerOrCoach, asyncHandler(c.getOne));
router.get('/:id/qr', ownerOrCoach, asyncHandler(c.getQrCode));

router.post(
  '/',
  requireRole('owner'),
  validate(v.createMemberSchema),
  asyncHandler(c.create),
);

router.put(
  '/:id',
  requireRole('owner'),
  validate(v.updateMemberSchema),
  asyncHandler(c.update),
);

router.delete('/:id', requireRole('owner'), asyncHandler(c.remove));

router.post(
  '/:id/photo',
  requireRole('owner'),
  uploadMemberPhoto.single('photo'),
  asyncHandler(c.uploadPhoto),
);

// Premium uniquement
router.put(
  '/:id/measurements',
  ownerOrCoach,
  requireFeature('nutrition'),
  validate(v.bodyMeasurementsSchema),
  asyncHandler(c.updateMeasurements),
);

router.put(
  '/:id/nutrition',
  ownerOrCoach,
  requireFeature('nutrition'),
  validate(v.nutritionSchema),
  asyncHandler(c.updateNutrition),
);

module.exports = router;
