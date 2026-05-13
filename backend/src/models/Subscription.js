/**
 * Model Subscription — abonnement actif d'un membre à un plan
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subscription = sequelize.define(
    'Subscription',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: false },
      member_id: { type: DataTypes.UUID, allowNull: false },
      plan_id: { type: DataTypes.UUID, allowNull: false },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM('active', 'expired', 'frozen', 'cancelled'),
        defaultValue: 'active',
      },
      price_paid: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      discount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
      notes: { type: DataTypes.TEXT, allowNull: true },
      frozen_at: { type: DataTypes.DATE, allowNull: true },
      frozen_days_total: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    { tableName: 'subscriptions' },
  );

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
    Subscription.belongsTo(models.Member, { foreignKey: 'member_id', as: 'member' });
    Subscription.belongsTo(models.Plan, { foreignKey: 'plan_id', as: 'plan' });
    Subscription.hasMany(models.Payment, { foreignKey: 'subscription_id', as: 'payments' });
    Subscription.hasMany(models.CheckIn, { foreignKey: 'subscription_id', as: 'checkIns' });
  };

  return Subscription;
};
