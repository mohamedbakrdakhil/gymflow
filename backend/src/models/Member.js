/**
 * Model Member — adhérent d'une salle
 * member_code unique par gym, qr_code globalement unique
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Member = sequelize.define(
    'Member',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: false },
      user_id: { type: DataTypes.UUID, allowNull: true },
      member_code: { type: DataTypes.STRING(50), allowNull: false },
      first_name: { type: DataTypes.STRING(100), allowNull: false },
      last_name: { type: DataTypes.STRING(100), allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      birth_date: { type: DataTypes.DATEONLY, allowNull: true },
      gender: { type: DataTypes.ENUM('male', 'female'), allowNull: true },
      photo_url: { type: DataTypes.STRING(500), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      emergency_contact_name: { type: DataTypes.STRING(100), allowNull: true },
      emergency_contact_phone: { type: DataTypes.STRING(20), allowNull: true },
      medical_notes: { type: DataTypes.TEXT, allowNull: true },
      qr_code: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      status: {
        type: DataTypes.ENUM('active', 'inactive', 'suspended'),
        defaultValue: 'active',
      },
      joined_at: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
      // Premium - composition corporelle
      weight_kg: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      height_cm: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
      bmi: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
      body_fat_percent: { type: DataTypes.DECIMAL(4, 2), allowNull: true },
      measurements: { type: DataTypes.JSON, allowNull: true },
      // Premium - nutrition
      daily_calories_target: { type: DataTypes.INTEGER, allowNull: true },
      macros_target: { type: DataTypes.JSON, allowNull: true },
    },
    {
      tableName: 'members',
      indexes: [{ unique: true, fields: ['member_code', 'gym_id'] }],
    },
  );

  Member.associate = (models) => {
    Member.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
    Member.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Member.hasMany(models.Subscription, { foreignKey: 'member_id', as: 'subscriptions' });
    Member.hasMany(models.Payment, { foreignKey: 'member_id', as: 'payments' });
    Member.hasMany(models.CheckIn, { foreignKey: 'member_id', as: 'checkIns' });
    Member.hasMany(models.ClassBooking, { foreignKey: 'member_id', as: 'bookings' });
    Member.hasMany(models.Program, { foreignKey: 'member_id', as: 'programs' });
  };

  return Member;
};
