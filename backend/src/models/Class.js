/**
 * Model Class — cours collectif récurrent hebdomadaire
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Class = sequelize.define(
    'Class',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: false },
      coach_id: { type: DataTypes.UUID, allowNull: true },
      name: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      day_of_week: {
        type: DataTypes.ENUM(
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ),
        allowNull: false,
      },
      start_time: { type: DataTypes.TIME, allowNull: false },
      end_time: { type: DataTypes.TIME, allowNull: false },
      max_capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20 },
      room: { type: DataTypes.STRING(50), allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'classes' },
  );

  Class.associate = (models) => {
    Class.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
    Class.belongsTo(models.Coach, { foreignKey: 'coach_id', as: 'coach' });
    Class.hasMany(models.ClassBooking, { foreignKey: 'class_id', as: 'bookings' });
  };

  return Class;
};
