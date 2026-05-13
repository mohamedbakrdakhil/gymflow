const express = require('express');
const c = require('../controllers/subscriptionController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const v = require('../validators/subscriptionValidator');

const router = express.Router();
router.use(authenticate, tenant);

router.get('/', validate(v.listSubscriptionSchema, 'query'), asyncHandler(c.list));
router.get('/:id', asyncHandler(c.getOne));
router.post('/', requireRole('owner'), validate(v.createSubscriptionSchema), asyncHandler(c.create));
router.put('/:id', requireRole('owner'), validate(v.updateSubscriptionSchema), asyncHandler(c.update));
router.post('/:id/freeze', requireRole('owner'), asyncHandler(c.freeze));
router.post('/:id/unfreeze', requireRole('owner'), asyncHandler(c.unfreeze));
router.post('/:id/cancel', requireRole('owner'), asyncHandler(c.cancel));
router.delete('/:id', requireRole('owner'), asyncHandler(c.remove));

module.exports = router;
