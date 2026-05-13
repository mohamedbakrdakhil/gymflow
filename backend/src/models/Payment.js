/**
 * Model Payment — paiement rattaché à une subscription
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define(
    'Payment',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: false },
      subscription_id: { type: DataTypes.UUID, allowNull: true },
      member_id: { type: DataTypes.UUID, allowNull: false },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      payment_method: {
        type: DataTypes.ENUM('cash', 'card', 'bank_transfer', 'online_stripe', 'online_cmi'),
        allowNull: false,
      },
      reference: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      receipt_url: { type: DataTypes.STRING(500), allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'refunded', 'failed'),
        defaultValue: 'completed',
      },
      paid_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      transaction_id: { type: DataTypes.STRING(255), allowNull: true },
      notes: { type: DataTypes.TEXT, allowNull: true },
    },
    { tableName: 'payments' },
  );

  Payment.associate = (models) => {
    Payment.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
    Payment.belongsTo(models.Subscription, { foreignKey: 'subscription_id', as: 'subscription' });
    Payment.belongsTo(models.Member, { foreignKey: 'member_id', as: 'member' });
  };

  return Payment;
};
