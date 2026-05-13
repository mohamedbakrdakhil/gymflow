/**
 * Job — vérifie les abonnements qui vont expirer et crée des notifications
 * Exécuté chaque jour à 09:00
 */
const { Op } = require('sequelize');
const { Subscription, Member, Notification, Gym } = require('../models');
const { addDays, daysBetween } = require('../utils/helpers');
const { sendEmail, templates } = require('../services/emailService');
const { EXPIRY_ALERT_DAYS } = require('../config/constants');
const logger = require('../utils/logger');

async function checkExpirations() {
  logger.info('🔔 Vérification des abonnements expirants...');

  for (const days of EXPIRY_ALERT_DAYS) {
    const targetDate = addDays(new Date(), days);
    const targetStart = new Date(targetDate);
    targetStart.setHours(0, 0, 0, 0);
    const targetEnd = new Date(targetDate);
    targetEnd.setHours(23, 59, 59, 999);

    const expirings = await Subscription.findAll({
      where: {
        status: 'active',
        end_date: { [Op.between]: [targetStart, targetEnd] },
      },
      include: [
        { model: Member, as: 'member' },
        { model: Gym, as: 'gym' },
      ],
    });

    logger.info(`  → ${expirings.length} abonnement(s) expirent dans ${days} jour(s)`);

    for (const sub of expirings) {
      const member = sub.member;
      const gym = sub.gym;
      if (!member) continue;

      // Notification in-app si user lié
      if (member.user_id) {
        await Notification.create({
          gym_id: sub.gym_id,
          user_id: member.user_id,
          type: 'subscription_expiring',
          title: `Abonnement expire dans ${days} jour(s)`,
          message: `Pensez à renouveler votre abonnement avant le ${new Date(sub.end_date).toLocaleDateString('fr-FR')}`,
          data: { subscription_id: sub.id, days_left: days },
        });
      }

      // Email au membre + à l'owner
      if (member.email) {
        const tpl = templates.subscriptionExpiring(member.first_name, days, gym?.name || 'votre salle');
        sendEmail({ to: member.email, ...tpl }).catch((e) =>
          logger.warn(`Email expiration non envoyé à ${member.email}:`, e.message),
        );
      }
    }
  }

  // Marquer les abonnements expirés
  const now = new Date();
  const [expiredCount] = await Subscription.update(
    { status: 'expired' },
    { where: { status: 'active', end_date: { [Op.lt]: now } } },
  );
  if (expiredCount > 0) logger.info(`  → ${expiredCount} abonnement(s) marqué(s) expirés`);
}

module.exports = checkExpirations;
