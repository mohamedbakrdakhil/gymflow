const express = require('express');
const c = require('../controllers/paymentController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');
const v = require('../validators/paymentValidator');

const router = express.Router();
router.use(authenticate, tenant);

router.get('/', validate(v.listPaymentSchema, 'query'), asyncHandler(c.list));
router.get('/:id', asyncHandler(c.getOne));
router.get('/:id/receipt', asyncHandler(c.downloadReceipt));
router.post('/', requireRole('owner'), validate(v.createPaymentSchema), asyncHandler(c.create));
router.post('/:id/refund', requireRole('owner'), validate(v.refundSchema), asyncHandler(c.refund));

module.exports = router;
