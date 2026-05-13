/**
 * Controller Notifications
 */
const { Notification } = require('../models');
const { success, notFound } = require('../utils/apiResponse');
const { paginate, paginationMeta } = require('../utils/helpers');

async function list(req, res) {
  const { page, limit, offset } = paginate(req.query);
  const where = { user_id: req.user.id };
  if (req.query.unread_only === 'true') where.is_read = false;

  const { rows, count } = await Notification.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });
  return success(res, { items: rows, meta: paginationMeta(count, page, limit) });
}

async function unreadCount(req, res) {
  const count = await Notification.count({
    where: { user_id: req.user.id, is_read: false },
  });
  return success(res, { count });
}

async function markRead(req, res) {
  const notif = await Notification.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!notif) return notFound(res, 'Notification introuvable');
  await notif.update({ is_read: true });
  return success(res, notif);
}

async function markAllRead(req, res) {
  const [updated] = await Notification.update(
    { is_read: true },
    { where: { user_id: req.user.id, is_read: false } },
  );
  return success(res, { updated }, 'Toutes les notifications marquées comme lues');
}

async function remove(req, res) {
  const notif = await Notification.findOne({
    where: { id: req.params.id, user_id: req.user.id },
  });
  if (!notif) return notFound(res, 'Notification introuvable');
  await notif.destroy();
  return success(res, null, 'Notification supprimée');
}

module.exports = { list, unreadCount, markRead, markAllRead, remove };
