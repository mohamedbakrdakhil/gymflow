/**
 * Wrapper qui catch les rejections d'une route async et les passe au errorHandler
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
