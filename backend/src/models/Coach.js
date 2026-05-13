/**
 * Model Coach — coach lié à un User (rôle coach)
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Coach = sequelize.define(
    'Coach',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: false },
      user_id: { type: DataTypes.UUID, allowNull: false },
      specialty: { type: DataTypes.STRING(200), allowNull: true },
      bio: { type: DataTypes.TEXT, allowNull: true },
      certifications: { type: DataTypes.JSON, allowNull: true },
      hourly_rate: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    },
    { tableName: 'coaches' },
  );

  Coach.associate = (models) => {
    Coach.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
    Coach.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Coach.hasMany(models.Class, { foreignKey: 'coach_id', as: 'classes' });
    Coach.hasMany(models.Program, { foreignKey: 'coach_id', as: 'programs' });
  };

  return Coach;
};
