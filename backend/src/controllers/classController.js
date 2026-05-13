/**
 * Controller Classes — cours collectifs + bookings + liste d'attente
 */
const { Op } = require('sequelize');
const { Class, ClassBooking, Coach, User, Member } = require('../models');
const { success, created, error, notFound } = require('../utils/apiResponse');
const { DAYS_OF_WEEK } = require('../config/constants');

async function list(req, res) {
  const where = { gym_id: req.gymId };
  if (req.query.day_of_week) where.day_of_week = req.query.day_of_week;
  if (req.query.is_active !== undefined) where.is_active = req.query.is_active === 'true';

  const classes = await Class.findAll({
    where,
    include: [
      {
        model: Coach,
        as: 'coach',
        include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name', 'avatar_url'] }],
      },
    ],
    order: [
      ['day_of_week', 'ASC'],
      ['start_time', 'ASC'],
    ],
  });
  return success(res, classes);
}

async function getOne(req, res) {
  const cls = await Class.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
    include: [
      {
        model: Coach,
        as: 'coach',
        include: [{ model: User, as: 'user' }],
      },
    ],
  });
  if (!cls) return notFound(res, 'Cours introuvable');
  return success(res, cls);
}

async function create(req, res) {
  const cls = await Class.create({ ...req.body, gym_id: req.gymId });
  return created(res, cls, 'Cours créé');
}

async function update(req, res) {
  const cls = await Class.findOne({ where: { id: req.params.id, gym_id: req.gymId } });
  if (!cls) return notFound(res, 'Cours introuvable');
  await cls.update(req.body);
  return success(res, cls, 'Cours modifié');
}

async function remove(req, res) {
  const cls = await Class.findOne({ where: { id: req.params.id, gym_id: req.gymId } });
  if (!cls) return notFound(res, 'Cours introuvable');
  await cls.destroy();
  return success(res, null, 'Cours supprimé');
}

/**
 * GET /api/classes/schedule — planning hebdo organisé par jour
 */
async function schedule(req, res) {
  const classes = await Class.findAll({
    where: { gym_id: req.gymId, is_active: true },
    include: [
      {
        model: Coach,
        as: 'coach',
        include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }],
      },
    ],
    order: [['start_time', 'ASC']],
  });

  const byDay = {};
  DAYS_OF_WEEK.forEach((d) => (byDay[d] = []));
  classes.forEach((c) => byDay[c.day_of_week].push(c));
  return success(res, byDay);
}

/**
 * POST /api/classes/:id/book — réservation
 */
async function book(req, res) {
  const { booking_date } = req.body;

  const cls = await Class.findOne({ where: { id: req.params.id, gym_id: req.gymId } });
  if (!cls) return notFound(res, 'Cours introuvable');
  if (!cls.is_active) return error(res, 'Ce cours est désactivé', 400);

  // Trouve le member lié à l'user (cas où req.user est un member) ou prend member_id du body
  let member_id = req.body.member_id;
  if (!member_id && req.role === 'member') {
    const m = await Member.findOne({ where: { user_id: req.user.id, gym_id: req.gymId } });
    if (!m) return error(res, 'Profil membre introuvable', 404);
    member_id = m.id;
  }
  if (!member_id) return error(res, 'member_id requis', 400);

  // Compte les réservations existantes pour cette occurrence
  const existing = await ClassBooking.count({
    where: { class_id: cls.id, booking_date, status: { [Op.in]: ['booked', 'attended'] }, is_waitlist: false },
  });

  let is_waitlist = false;
  let waitlist_position = null;
  if (existing >= cls.max_capacity) {
    is_waitlist = true;
    const wlCount = await ClassBooking.count({
      where: { class_id: cls.id, booking_date, is_waitlist: true, status: 'booked' },
    });
    waitlist_position = wlCount + 1;
  }

  try {
    const booking = await ClassBooking.create({
      class_id: cls.id,
      member_id,
      booking_date,
      is_waitlist,
      waitlist_position,
    });
    const message = is_waitlist
      ? `Cours complet — vous êtes en liste d'attente (position ${waitlist_position})`
      : 'Réservation confirmée';
    return created(res, booking, message);
  } catch (e) {
    if (e.name === 'SequelizeUniqueConstraintError') {
      return error(res, 'Réservation déjà existante pour cette date', 409);
    }
    throw e;
  }
}

/**
 * DELETE /api/classes/bookings/:bookingId — annulation
 * Promote le prochain en waitlist si applicable
 */
async function cancelBooking(req, res) {
  const booking = await ClassBooking.findByPk(req.params.bookingId, {
    include: [{ model: Class, as: 'class' }],
  });
  if (!booking || booking.class.gym_id !== req.gymId) {
    return notFound(res, 'Réservation introuvable');
  }

  await booking.update({ status: 'cancelled' });

  // Promote prochain de la waitlist
  if (!booking.is_waitlist) {
    const nextWaitlist = await ClassBooking.findOne({
      where: {
        class_id: booking.class_id,
        booking_date: booking.booking_date,
        is_waitlist: true,
        status: 'booked',
      },
      order: [['waitlist_position', 'ASC']],
    });
    if (nextWaitlist) {
      await nextWaitlist.update({ is_waitlist: false, waitlist_position: null });
    }
  }

  return success(res, null, 'Réservation annulée');
}

/**
 * GET /api/classes/:id/bookings — liste des réservations
 */
async function listBookings(req, res) {
  const cls = await Class.findOne({ where: { id: req.params.id, gym_id: req.gymId } });
  if (!cls) return notFound(res, 'Cours introuvable');

  const bookings = await ClassBooking.findAll({
    where: { class_id: cls.id, status: { [Op.in]: ['booked', 'attended'] } },
    include: [
      {
        model: Member,
        as: 'member',
        attributes: ['id', 'first_name', 'last_name', 'member_code', 'photo_url'],
      },
    ],
    order: [
      ['booking_date', 'DESC'],
      ['is_waitlist', 'ASC'],
      ['waitlist_position', 'ASC'],
    ],
  });
  return success(res, bookings);
}

/**
 * POST /api/classes/bookings/:bookingId/attend — marquer présence
 */
async function markAttendance(req, res) {
  const { status } = req.body;
  const booking = await ClassBooking.findByPk(req.params.bookingId, {
    include: [{ model: Class, as: 'class' }],
  });
  if (!booking || booking.class.gym_id !== req.gymId) return notFound(res, 'Réservation introuvable');
  await booking.update({ status });
  return success(res, booking, 'Présence enregistrée');
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  schedule,
  book,
  cancelBooking,
  listBookings,
  markAttendance,
};
