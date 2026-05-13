/**
 * Middleware de validation Joi
 * Usage: validate(schema, 'body') | validate(schema, 'query') | validate(schema, 'params')
 */
const { error } = require('../utils/apiResponse');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error: err, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (err) {
      return error(
        res,
        'Validation échouée',
        400,
        err.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
      );
    }
    req[source] = value;
    next();
  };
}

module.exports = validate;
