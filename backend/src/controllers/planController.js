const { Plan } = require('../models');
const { success, created, notFound } = require('../utils/apiResponse');

async function list(req, res) {
  const plans = await Plan.findAll({
    where: { gym_id: req.gymId },
    order: [['duration_days', 'ASC']],
  });
  return success(res, plans);
}

async function getOne(req, res) {
  const plan = await Plan.findOne({ where: { id: req.params.id, gym_id: req.gymId } });
  if (!plan) return notFound(res, 'Plan introuvable');
  return success(res, plan);
}

async function create(req, res) {
  const plan = await Plan.create({ ...req.body, gym_id: req.gymId });
  return created(res, plan, 'Plan créé');
}

async function update(req, res) {
  const plan = await Plan.findOne({ where: { id: req.params.id, gym_id: req.gymId } });
  if (!plan) return notFound(res, 'Plan introuvable');
  await plan.update(req.body);
  return success(res, plan, 'Plan modifié');
}

async function remove(req, res) {
  const plan = await Plan.findOne({ where: { id: req.params.id, gym_id: req.gymId } });
  if (!plan) return notFound(res, 'Plan introuvable');
  await plan.destroy();
  return success(res, null, 'Plan supprimé');
}

module.exports = { list, getOne, create, update, remove };
