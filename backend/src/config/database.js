/**
 * Configuration Sequelize pour MySQL
 */
const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.DB.NAME, env.DB.USER, env.DB.PASSWORD, {
  host: env.DB.HOST,
  port: env.DB.PORT,
  dialect: env.DB.DIALECT,
  logging: env.NODE_ENV === 'development' ? false : false,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define: {
    underscored: true,
    timestamps: true,
    paranoid: false,
  },
  timezone: '+00:00',
});

module.exports = sequelize;
