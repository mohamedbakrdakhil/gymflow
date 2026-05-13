const express = require('express');
const c = require('../controllers/dashboardController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole } = require('../middleware/role');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
router.use(authenticate, tenant);

router.get('/owner', requireRole('owner', 'coach'), asyncHandler(c.ownerOverview));
router.get('/member', requireRole('member'), asyncHandler(c.memberOverview));

module.exports = router;
