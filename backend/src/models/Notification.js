/**
 * Model Notification — notification in-app pour un utilisateur
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: true },
      user_id: { type: DataTypes.UUID, allowNull: false },
      type: {
        type: DataTypes.ENUM(
          'subscription_expiring',
          'payment_received',
          'class_reminder',
          'general',
        ),
        defaultValue: 'general',
      },
      title: { type: DataTypes.STRING(200), allowNull: false },
      message: { type: DataTypes.TEXT, allowNull: false },
      data: { type: DataTypes.JSON, allowNull: true },
      is_read: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    { tableName: 'notifications', updatedAt: false },
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
    Notification.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return Notification;
};
