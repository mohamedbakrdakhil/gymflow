/**
 * Helpers de réponse API cohérents
 * Format: { success, data, message, errors }
 */

function success(res, data = null, message = '', status = 200) {
  return res.status(status).json({ success: true, data, message, errors: [] });
}

function created(res, data = null, message = 'Créé') {
  return success(res, data, message, 201);
}

function error(res, message = 'Erreur', status = 400, errors = []) {
  return res.status(status).json({
    success: false,
    data: null,
    message,
    errors: Array.isArray(errors) ? errors : [errors],
  });
}

function notFound(res, message = 'Ressource introuvable') {
  return error(res, message, 404);
}

function unauthorized(res, message = 'Non authentifié') {
  return error(res, message, 401);
}

function forbidden(res, message = 'Accès refusé') {
  return error(res, message, 403);
}

module.exports = { success, created, error, notFound, unauthorized, forbidden };
