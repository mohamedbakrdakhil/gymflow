/**
 * Point d'entrée du serveur GymFlow
 * - Démarrage HTTP server
 * - Synchronisation DB (en dev)
 * - Démarrage des jobs cron
 * - Gestion graceful shutdown
 */

require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');
const env = require('./src/config/env');
const startCronJobs = require('./src/jobs');

const PORT = env.PORT;

async function start() {
  try {
    // Test connexion DB
    await sequelize.authenticate();
    logger.info('✅ Connexion MySQL établie');

    // Sync models en dev (en prod on utilise migrations)
    if (env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      logger.info('✅ Models synchronisés');
    }

    const server = app.listen(PORT, () => {
      logger.info(`🚀 Serveur GymFlow démarré sur http://localhost:${PORT}`);
      logger.info(`   Env: ${env.NODE_ENV}`);
    });

    // Démarrage des tâches cron (alertes expirations, etc.)
    if (env.NODE_ENV !== 'test') {
      startCronJobs();
    }

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`Signal ${signal} reçu — arrêt gracieux...`);
      server.close(async () => {
        await sequelize.close();
        logger.info('✅ Serveur fermé proprement');
        process.exit(0);
      });
      // Force kill après 10s
      setTimeout(() => {
        logger.error('Arrêt forcé après timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Rejection:', err);
    });
  } catch (err) {
    logger.error('❌ Échec démarrage serveur:', err);
    process.exit(1);
  }
}

start();
