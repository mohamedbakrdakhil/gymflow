/**
 * Model CheckIn — entrée/sortie d'un membre (scan QR ou manuel)
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CheckIn = sequelize.define(
    'CheckIn',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: false },
      member_id: { type: DataTypes.UUID, allowNull: false },
      subscription_id: { type: DataTypes.UUID, allowNull: true },
      check_in_time: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      check_out_time: { type: DataTypes.DATE, allowNull: true },
      method: {
        type: DataTypes.ENUM('qr_code', 'manual', 'card'),
        defaultValue: 'qr_code',
      },
    },
    { tableName: 'check_ins', updatedAt: false },
  );

  CheckIn.associate = (models) => {
    CheckIn.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
    CheckIn.belongsTo(models.Member, { foreignKey: 'member_id', as: 'member' });
    CheckIn.belongsTo(models.Subscription, {
      foreignKey: 'subscription_id',
      as: 'subscription',
    });
  };

  return CheckIn;
};
