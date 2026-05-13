const express = require('express');
const Joi = require('joi');
const c = require('../controllers/userController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const { uploadAvatar } = require('../middleware/upload');

const router = express.Router();
router.use(authenticate);

const updateMeSchema = Joi.object({
  first_name: Joi.string().min(1).max(100).optional(),
  last_name: Joi.string().min(1).max(100).optional(),
  phone: Joi.string().max(20).allow('', null),
});

router.get('/me', asyncHandler(c.getMe));
router.put('/me', validate(updateMeSchema), asyncHandler(c.updateMe));
router.post('/me/avatar', uploadAvatar.single('avatar'), asyncHandler(c.uploadMyAvatar));

// Liste users (owner seulement)
router.get('/', tenant, requireRole('owner'), asyncHandler(c.list));

module.exports = router;
