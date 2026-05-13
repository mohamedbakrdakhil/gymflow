/**
 * Routeur principal — monte toutes les routes API
 */
const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/users', require('./users'));
router.use('/gym', require('./gym'));
router.use('/dashboard', require('./dashboard'));
router.use('/members', require('./members'));
router.use('/plans', require('./plans'));
router.use('/subscriptions', require('./subscriptions'));
router.use('/payments', require('./payments'));
router.use('/checkins', require('./checkins'));
router.use('/coaches', require('./coaches'));
router.use('/classes', require('./classes'));
router.use('/programs', require('./programs'));
router.use('/notifications', require('./notifications'));
router.use('/superadmin', require('./superadmin'));

router.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

module.exports = router;
