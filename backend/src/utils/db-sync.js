/**
 * Utilitaire pour synchroniser la DB (create tables)
 * Usage:
 *   node src/utils/db-sync.js          → sync normal (création tables manquantes)
 *   node src/utils/db-sync.js --force  → drop + create (⚠️ détruit les données)
 *   node src/utils/db-sync.js --alter  → alter tables pour matcher les models
 */
require('dotenv').config();
const { sequelize } = require('../models');
const logger = require('./logger');

async function run() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const alter = args.includes('--alter');

  try {
    await sequelize.authenticate();
    logger.info('✅ Connexion DB OK');

    if (force) {
      logger.warn('⚠️  Mode --force : suppression de toutes les tables');
      await sequelize.sync({ force: true });
      logger.info('✅ Tables recréées');
    } else if (alter) {
      await sequelize.sync({ alter: true });
      logger.info('✅ Tables synchronisées (alter)');
    } else {
      await sequelize.sync();
      logger.info('✅ Tables synchronisées');
    }

    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error('❌ Échec sync DB:', err);
    process.exit(1);
  }
}

run();
