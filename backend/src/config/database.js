/**
 * Configuration Sequelize pour MySQL
 */
const { Sequelize } = require('sequelize');
const env = require('./env');

const isSQLite = env.DB.DIALECT === 'sqlite';

const sequelize = isSQLite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || './gymflow_dev.sqlite',
      logging: false,
      define: { underscored: true, timestamps: true, paranoid: false },
    })
  : new Sequelize(env.DB.NAME, env.DB.USER, env.DB.PASSWORD, {
      host: env.DB.HOST,
      port: env.DB.PORT,
      dialect: env.DB.DIALECT,
      logging: false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      define: { underscored: true, timestamps: true, paranoid: false },
      timezone: '+00:00',
    });

module.exports = sequelize;
