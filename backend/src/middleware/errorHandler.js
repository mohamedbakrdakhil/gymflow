/**
 * Middleware central de gestion d'erreurs
 * Toujours en dernier dans la chaîne app.use()
 */
const logger = require('../utils/logger');
const { error } = require('../utils/apiResponse');

function errorHandler(err, req, res, _next) {
  logger.error(`${req.method} ${req.path} — ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    logger.error(err.stack);
  }

  // Erreurs Sequelize spécifiques
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return error(
      res,
      'Erreur de validation',
      400,
      err.errors?.map((e) => ({ field: e.path, message: e.message })) || [],
    );
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return error(res, 'Référence invalide (clé étrangère)', 400);
  }

  // Erreurs explicites avec statusCode
  const status = err.statusCode || err.status || 500;
  return error(
    res,
    status === 500 ? 'Erreur serveur interne' : err.message || 'Erreur',
    status,
  );
}

module.exports = errorHandler;
