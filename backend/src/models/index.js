/**
 * Point d'entrée des models Sequelize
 * Charge tous les models et exécute les associations
 */
const sequelize = require('../config/database');

const Gym = require('./Gym')(sequelize);
const User = require('./User')(sequelize);
const Member = require('./Member')(sequelize);
const Plan = require('./Plan')(sequelize);
const Subscription = require('./Subscription')(sequelize);
const Payment = require('./Payment')(sequelize);
const CheckIn = require('./CheckIn')(sequelize);
const Coach = require('./Coach')(sequelize);
const Class = require('./Class')(sequelize);
const ClassBooking = require('./ClassBooking')(sequelize);
const Program = require('./Program')(sequelize);
const Notification = require('./Notification')(sequelize);
const SaasSubscription = require('./SaasSubscription')(sequelize);

const models = {
  Gym,
  User,
  Member,
  Plan,
  Subscription,
  Payment,
  CheckIn,
  Coach,
  Class,
  ClassBooking,
  Program,
  Notification,
  SaasSubscription,
};

Object.values(models).forEach((model) => {
  if (typeof model.associate === 'function') model.associate(models);
});

module.exports = { sequelize, ...models };
