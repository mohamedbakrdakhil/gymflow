/**
 * Model User — comptes authentifiés (super_admin / owner / coach / member)
 * gym_id NULL uniquement pour super_admin
 */
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      gym_id: { type: DataTypes.UUID, allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: false, validate: { isEmail: true } },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role: {
        type: DataTypes.ENUM('super_admin', 'owner', 'coach', 'member'),
        allowNull: false,
      },
      first_name: { type: DataTypes.STRING(100), allowNull: false },
      last_name: { type: DataTypes.STRING(100), allowNull: false },
      phone: { type: DataTypes.STRING(20), allowNull: true },
      avatar_url: { type: DataTypes.STRING(500), allowNull: true },
      is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
      email_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
      reset_password_token: { type: DataTypes.STRING(255), allowNull: true },
      reset_password_expires: { type: DataTypes.DATE, allowNull: true },
      last_login_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'users',
      indexes: [{ unique: true, fields: ['email', 'gym_id'] }],
      defaultScope: { attributes: { exclude: ['password_hash', 'reset_password_token'] } },
      scopes: { withPassword: { attributes: { include: ['password_hash'] } } },
    },
  );

  User.beforeCreate(async (user) => {
    if (user.password_hash && !user.password_hash.startsWith('$2')) {
      user.password_hash = await bcrypt.hash(user.password_hash, 12);
    }
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password_hash') && !user.password_hash.startsWith('$2')) {
      user.password_hash = await bcrypt.hash(user.password_hash, 12);
    }
  });

  User.prototype.validPassword = async function (password) {
    return bcrypt.compare(password, this.password_hash);
  };

  User.prototype.fullName = function () {
    return `${this.first_name} ${this.last_name}`.trim();
  };

  User.associate = (models) => {
    User.belongsTo(models.Gym, { foreignKey: 'gym_id', as: 'gym' });
    User.hasOne(models.Member, { foreignKey: 'user_id', as: 'member' });
    User.hasOne(models.Coach, { foreignKey: 'user_id', as: 'coach' });
    User.hasMany(models.Notification, { foreignKey: 'user_id', as: 'notifications' });
  };

  return User;
};
