/**
 * Controller Members — CRUD + filtres + recherche + composition corporelle
 */
const { Op } = require('sequelize');
const { Member, Subscription, Plan } = require('../models');
const {
  generateMemberCode,
  generateQrToken,
  paginate,
  paginationMeta,
} = require('../utils/helpers');
const { success, created, error, notFound } = require('../utils/apiResponse');

/**
 * GET /api/members
 */
async function list(req, res) {
  const { page, limit, offset } = paginate(req.query);
  const { search, status, sort } = req.query;

  const where = { gym_id: req.gymId };
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { email: { [Op.like]: `%${search}%` } },
      { member_code: { [Op.like]: `%${search}%` } },
    ];
  }

  // Tri: '-created_at' = desc, 'last_name' = asc
  let order = [['created_at', 'DESC']];
  if (sort) {
    const desc = sort.startsWith('-');
    const field = desc ? sort.slice(1) : sort;
    const allowed = ['created_at', 'last_name', 'first_name', 'joined_at', 'status'];
    if (allowed.includes(field)) order = [[field, desc ? 'DESC' : 'ASC']];
  }

  const { rows, count } = await Member.findAndCountAll({
    where,
    limit,
    offset,
    order,
    include: [
      {
        model: Subscription,
        as: 'subscriptions',
        where: { status: 'active' },
        required: false,
        include: [{ model: Plan, as: 'plan' }],
        limit: 1,
        order: [['end_date', 'DESC']],
      },
    ],
  });

  return success(res, { items: rows, meta: paginationMeta(count, page, limit) });
}

/**
 * GET /api/members/:id
 */
async function getOne(req, res) {
  const member = await Member.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
    include: [
      {
        model: Subscription,
        as: 'subscriptions',
        include: [{ model: Plan, as: 'plan' }],
        order: [['end_date', 'DESC']],
      },
    ],
  });
  if (!member) return notFound(res, 'Membre introuvable');
  return success(res, member);
}

/**
 * POST /api/members
 */
async function create(req, res) {
  const payload = req.body;
  const member_code = generateMemberCode();
  const qr_code = generateQrToken();

  const member = await Member.create({
    ...payload,
    gym_id: req.gymId,
    member_code,
    qr_code,
    joined_at: new Date(),
  });
  return created(res, member, 'Membre créé');
}

/**
 * PUT /api/members/:id
 */
async function update(req, res) {
  const member = await Member.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!member) return notFound(res, 'Membre introuvable');
  await member.update(req.body);
  return success(res, member, 'Membre modifié');
}

/**
 * DELETE /api/members/:id
 */
async function remove(req, res) {
  const member = await Member.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!member) return notFound(res, 'Membre introuvable');
  await member.destroy();
  return success(res, null, 'Membre supprimé');
}

/**
 * POST /api/members/:id/photo
 */
async function uploadPhoto(req, res) {
  if (!req.file) return error(res, 'Aucun fichier reçu', 400);
  const member = await Member.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!member) return notFound(res, 'Membre introuvable');
  const photo_url = `/uploads/members/${req.file.filename}`;
  await member.update({ photo_url });
  return success(res, { photo_url }, 'Photo mise à jour');
}

/**
 * GET /api/members/:id/qr
 */
async function getQrCode(req, res) {
  const QRCode = require('qrcode');
  const member = await Member.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!member) return notFound(res, 'Membre introuvable');
  const dataUrl = await QRCode.toDataURL(member.qr_code, { width: 400, margin: 2 });
  return success(res, { qr_code: member.qr_code, image_data_url: dataUrl });
}

/**
 * PUT /api/members/:id/measurements (Premium)
 */
async function updateMeasurements(req, res) {
  const member = await Member.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!member) return notFound(res, 'Membre introuvable');
  const data = { ...req.body };
  // Calcul auto IMC si poids + taille fournis
  if (data.weight_kg && data.height_cm) {
    const h = data.height_cm / 100;
    data.bmi = +(data.weight_kg / (h * h)).toFixed(2);
  }
  await member.update(data);
  return success(res, member, 'Mesures mises à jour');
}

/**
 * PUT /api/members/:id/nutrition (Premium)
 */
async function updateNutrition(req, res) {
  const member = await Member.findOne({
    where: { id: req.params.id, gym_id: req.gymId },
  });
  if (!member) return notFound(res, 'Membre introuvable');
  await member.update(req.body);
  return success(res, member, 'Plan nutrition mis à jour');
}

/**
 * GET /api/members/export
 * Export CSV/Excel-compatible
 */
async function exportMembers(req, res) {
  const members = await Member.findAll({
    where: { gym_id: req.gymId },
    order: [['last_name', 'ASC']],
  });

  // Génération CSV simple
  const headers = [
    'Code',
    'Prénom',
    'Nom',
    'Email',
    'Téléphone',
    'Genre',
    'Date naissance',
    'Statut',
    'Inscrit le',
  ];
  const rows = members.map((m) => [
    m.member_code,
    m.first_name,
    m.last_name,
    m.email || '',
    m.phone || '',
    m.gender || '',
    m.birth_date || '',
    m.status,
    m.joined_at,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="membres.csv"');
  // BOM pour Excel
  res.send('﻿' + csv);
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  uploadPhoto,
  getQrCode,
  updateMeasurements,
  updateNutrition,
  exportMembers,
};
