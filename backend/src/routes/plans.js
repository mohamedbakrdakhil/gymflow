const express = require('express');
const c = require('../controllers/planController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const v = require('../validators/planValidator');

const router = express.Router();
router.use(authenticate, tenant);

router.get('/', asyncHandler(c.list));
router.get('/:id', asyncHandler(c.getOne));
router.post('/', requireRole('owner'), validate(v.createPlanSchema), asyncHandler(c.create));
router.put('/:id', requireRole('owner'), validate(v.updatePlanSchema), asyncHandler(c.update));
router.delete('/:id', requireRole('owner'), asyncHandler(c.remove));

module.exports = router;
