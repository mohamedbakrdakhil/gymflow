/**
 * Model SaasSubscription — abonnement de la salle au SaaS GymFlow lui-même
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SaasSubscription = sequelize.define(
    'SaasSubscription',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: false, unique: true },
      plan_type: {
        type: DataTypes.ENUM('basique', 'pro', 'premium'),
        allowNull: false,
      },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      billing_cycle: {
        type: DataTypes.ENUM('monthly', 'yearly'),
        defaultValue: 'monthly',
      },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      next_billing_date: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM('active', 'cancelled', 'past_due'),
        defaultValue: 'active',
      },
      payment_method: { type: DataTypes.STRING(100), allowNull: true },
    },
    { tableName: 'saas_subscriptions' },
  );

  SaasSubscription.associate = (models) => {
    SaasSubscription.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
  };

  return SaasSubscription;
};
