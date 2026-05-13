const express = require('express');
const c = require('../controllers/notificationController');
const authenticate = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
router.use(authenticate);

router.get('/', asyncHandler(c.list));
router.get('/unread-count', asyncHandler(c.unreadCount));
router.post('/mark-all-read', asyncHandler(c.markAllRead));
router.post('/:id/read', asyncHandler(c.markRead));
router.delete('/:id', asyncHandler(c.remove));

module.exports = router;
