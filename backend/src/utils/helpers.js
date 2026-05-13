/**
 * Helpers généraux (formats, codes, dates)
 */
const crypto = require('crypto');

function generateMemberCode(prefix = 'M') {
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}${Date.now().toString().slice(-6)}${random}`;
}

function generatePaymentReference() {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `PAY-${Date.now()}-${random}`;
}

function generateQrToken() {
  return crypto.randomBytes(16).toString('hex');
}

function generateSubdomain(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(d1, d2) {
  const ms = new Date(d2).getTime() - new Date(d1).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function isExpired(date) {
  return new Date(date) < new Date();
}

function paginate(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginationMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNext: page * limit < total,
    hasPrev: page > 1,
  };
}

module.exports = {
  generateMemberCode,
  generatePaymentReference,
  generateQrToken,
  generateSubdomain,
  addDays,
  daysBetween,
  isExpired,
  paginate,
  paginationMeta,
};
