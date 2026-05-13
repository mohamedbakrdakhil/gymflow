/**
 * Initialisation des tâches cron
 */
const cron = require('node-cron');
const checkExpirations = require('./expirationAlerts');
const checkSaasBilling = require('./saasBilling');
const logger = require('../utils/logger');

function startCronJobs() {
  // Tous les jours à 09:00 — alertes expiration abonnements membres
  cron.schedule(
    '0 9 * * *',
    () => {
      checkExpirations().catch((e) => logger.error('Cron expirations échec:', e));
    },
    { timezone: 'Africa/Casablanca' },
  );

  // Tous les jours à 02:00 — billing SaaS
  cron.schedule(
    '0 2 * * *',
    () => {
      checkSaasBilling().catch((e) => logger.error('Cron SaaS billing échec:', e));
    },
    { timezone: 'Africa/Casablanca' },
  );

  logger.info('⏰ Cron jobs démarrés');
}

module.exports = startCronJobs;
