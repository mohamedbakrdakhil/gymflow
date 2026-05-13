/**
 * Job — vérifie les abonnements SaaS qui expirent et suspend les salles non renouvelées
 * Exécuté chaque jour à 02:00
 */
const { Op } = require('sequelize');
const { Gym } = require('../models');
const logger = require('../utils/logger');

async function checkSaasBilling() {
  logger.info('💳 Vérification des abonnements SaaS...');

  // Salles dont le plan expire dans 3 jours — notif owner
  const expiringSoon = await Gym.findAll({
    where: {
      status: { [Op.in]: ['active', 'trial'] },
      plan_expires_at: {
        [Op.between]: [new Date(), new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)],
      },
    },
  });
  logger.info(`  → ${expiringSoon.length} salle(s) expirant dans 3 jours`);

  // Salles dont le plan a expiré → suspendre
  const expired = await Gym.findAll({
    where: {
      status: { [Op.in]: ['active', 'trial'] },
      plan_expires_at: { [Op.lt]: new Date() },
    },
  });
  for (const gym of expired) {
    gym.status = 'suspended';
    await gym.save();
    logger.warn(`  ⛔ Salle suspendue (plan expiré): ${gym.name} (${gym.id})`);
  }
}

module.exports = checkSaasBilling;
