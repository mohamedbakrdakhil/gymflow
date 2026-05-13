/**
 * Model Plan — formule d'abonnement proposée par une salle (ex: "Mensuel", "Trimestriel")
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Plan = sequelize.define(
    'Plan',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      duration_days: { type: DataTypes.INTEGER, allowNull: false },
      price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      features: { type: DataTypes.JSON, allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'plans' },
  );

  Plan.associate = (models) => {
    Plan.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
    Plan.hasMany(models.Subscription, { foreignKey: 'plan_id', as: 'subscriptions' });
  };

  return Plan;
};
