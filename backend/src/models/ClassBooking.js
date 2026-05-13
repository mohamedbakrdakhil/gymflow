/**
 * Model ClassBooking — réservation d'un membre à une occurrence de cours
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClassBooking = sequelize.define(
    'ClassBooking',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      class_id: { type: DataTypes.UUID, allowNull: false },
      member_id: { type: DataTypes.UUID, allowNull: false },
      booking_date: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM('booked', 'attended', 'no_show', 'cancelled'),
        defaultValue: 'booked',
      },
      // Liste d'attente automatique
      is_waitlist: { type: DataTypes.BOOLEAN, defaultValue: false },
      waitlist_position: { type: DataTypes.INTEGER, allowNull: true },
    },
    {
      tableName: 'class_bookings',
      indexes: [{ unique: true, fields: ['class_id', 'member_id', 'booking_date'] }],
    },
  );

  ClassBooking.associate = (models) => {
    ClassBooking.belongsTo(models.Class, { foreignKey: 'class_id', as: 'class' });
    ClassBooking.belongsTo(models.Member, { foreignKey: 'member_id', as: 'member' });
  };

  return ClassBooking;
};
