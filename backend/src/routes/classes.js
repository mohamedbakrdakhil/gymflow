const express = require('express');
const Joi = require('joi');
const c = require('../controllers/classController');
const authenticate = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const { requireRole, requireFeature } = require('../middleware/role');
const validate = require('../middleware/validate');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
router.use(authenticate, tenant, requireFeature('classes'));

const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const createSchema = Joi.object({
  coach_id: Joi.string().uuid().allow(null),
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(2000).allow('', null),
  day_of_week: Joi.string().valid(...days).required(),
  start_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .required(),
  end_time: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/)
    .required(),
  max_capacity: Joi.number().integer().min(1).max(500).default(20),
  room: Joi.string().max(50).allow('', null),
  is_active: Joi.boolean().default(true),
});

const bookSchema = Joi.object({
  booking_date: Joi.date().iso().required(),
  member_id: Joi.string().uuid().optional(),
});

const attendSchema = Joi.object({
  status: Joi.string().valid('attended', 'no_show').required(),
});

router.get('/schedule', asyncHandler(c.schedule));
router.get('/', asyncHandler(c.list));
router.get('/:id', asyncHandler(c.getOne));
router.get('/:id/bookings', requireRole('owner', 'coach'), asyncHandler(c.listBookings));

router.post('/', requireRole('owner'), validate(createSchema), asyncHandler(c.create));
router.put('/:id', requireRole('owner'), validate(createSchema.fork(['name', 'day_of_week', 'start_time', 'end_time'], (s) => s.optional())), asyncHandler(c.update));
router.delete('/:id', requireRole('owner'), asyncHandler(c.remove));

router.post('/:id/book', validate(bookSchema), asyncHandler(c.book));
router.delete('/bookings/:bookingId', asyncHandler(c.cancelBooking));
router.post(
  '/bookings/:bookingId/attend',
  requireRole('owner', 'coach'),
  validate(attendSchema),
  asyncHandler(c.markAttendance),
);

module.exports = router;
