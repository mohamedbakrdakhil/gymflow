/**
 * Model Program — programme d'entraînement personnalisé créé par un coach
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Program = sequelize.define(
    'Program',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: false },
      coach_id: { type: DataTypes.UUID, allowNull: false },
      member_id: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      // exercises: tableau JSON { name, sets, reps, rest_seconds, notes, video_url? }
      exercises: { type: DataTypes.JSON, allowNull: true },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM('active', 'completed', 'paused'),
        defaultValue: 'active',
      },
    },
    { tableName: 'programs' },
  );

  Program.associate = (models) => {
    Program.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
    Program.belongsTo(models.Coach, { foreignKey: 'coach_id', as: 'coach' });
    Program.belongsTo(models.Member, { foreignKey: 'member_id', as: 'member' });
  };

  return Program;
};
