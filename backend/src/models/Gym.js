/**
 * Model Gym (tenant)
 * Chaque salle de sport est un tenant isolé. gym_id sépare les données.
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Gym = sequelize.define(
    'Gym',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      subdomain: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      logo_url: { type: DataTypes.STRING(500), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      city: { type: DataTypes.STRING(100), allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      plan_type: {
        type: DataTypes.ENUM('basique', 'pro', 'premium'),
        allowNull: false,
        defaultValue: 'basique',
      },
      plan_started_at: { type: DataTypes.DATE, allowNull: true },
      plan_expires_at: { type: DataTypes.DATE, allowNull: true },
      status: {
        type: DataTypes.ENUM('active', 'suspended', 'trial', 'cancelled'),
        defaultValue: 'trial',
      },
      primary_color: { type: DataTypes.STRING(7), defaultValue: '#2563EB' },
      secondary_color: { type: DataTypes.STRING(7), defaultValue: '#F97316' },
      timezone: { type: DataTypes.STRING(50), defaultValue: 'Africa/Casablanca' },
    },
    { tableName: 'gyms' },
  );

  Gym.associate = (models) => {
    Gym.hasMany(models.User, { foreignKey: 'gym_id', as: 'users' });
    Gym.hasMany(models.Member, { foreignKey: 'gym_id', as: 'members' });
    Gym.hasMany(models.Plan, { foreignKey: 'gym_id', as: 'plans' });
    Gym.hasMany(models.Subscription, { foreignKey: 'gym_id', as: 'subscriptions' });
    Gym.hasMany(models.Payment, { foreignKey: 'gym_id', as: 'payments' });
    Gym.hasMany(models.CheckIn, { foreignKey: 'gym_id', as: 'checkIns' });
    Gym.hasMany(models.Coach, { foreignKey: 'gym_id', as: 'coaches' });
    Gym.hasMany(models.Class, { foreignKey: 'gym_id', as: 'classes' });
    Gym.hasMany(models.Program, { foreignKey: 'gym_id', as: 'programs' });
    Gym.hasMany(models.Notification, { foreignKey: 'gym_id', as: 'notifications' });
    Gym.hasOne(models.SaasSubscription, { foreignKey: 'gym_id', as: 'saasSubscription' });
  };

  return Gym;
};
