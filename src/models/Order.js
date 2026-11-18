const { all, get, run } = require('../db');

const BASE_SELECT = `
  SELECT o.*, b.batch_code, b.formula_version, b.trace_code, b.status AS batch_status,
         b.weight_produced_kg, b.researcher_id,
         uc.full_name AS client_name, uc.organization_name AS client_organization, uc.city AS client_city, uc.email AS client_email
  FROM orders o
  JOIN bioplastic_batches b ON b.id = o.batch_id
  JOIN users uc ON uc.id = o.client_id
`;

function mapOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    clientOrganization: row.client_organization,
    clientCity: row.client_city,
    clientEmail: row.client_email,
    batchId: row.batch_id,
    batchCode: row.batch_code,
    formulaVersion: row.formula_version,
    traceCode: row.trace_code,
    batchStatus: row.batch_status,
    batchWeightKg: Number(row.weight_produced_kg),
    quantityKg: Number(row.quantity_kg),
    packagingType: row.packaging_type,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function list({ clientId = '', status = '', batchId = '', limit = 200 } = {}) {
  const conditions = [];
  const params = [];
  if (clientId) {
    conditions.push('o.client_id = ?');
    params.push(clientId);
  }
  if (status) {
    conditions.push('o.status = ?');
    params.push(status);
  }
  if (batchId) {
    conditions.push('o.batch_id = ?');
    params.push(batchId);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit);
  return all(`${BASE_SELECT} ${where} ORDER BY o.created_at DESC LIMIT ?`, params).map(mapOrder);
}

function findById(id) {
  return mapOrder(get(`${BASE_SELECT} WHERE o.id = ?`, [id]));
}

function create(data) {
  run(
    `INSERT INTO orders (id, client_id, batch_id, quantity_kg, packaging_type, status, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'solicitado', ?, ?, ?)`,
    [data.id, data.clientId, data.batchId, data.quantityKg, data.packagingType, data.notes, data.createdAt, data.createdAt],
  );
  return findById(data.id);
}

function updateStatus(id, status) {
  run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id]);
  return findById(id);
}

function reservedKg(batchId) {
  const row = get(
    `SELECT COALESCE(SUM(quantity_kg), 0) AS total FROM orders WHERE batch_id = ? AND status != 'cancelado'`,
    [batchId],
  );
  return Number(row?.total || 0);
}

function summary({ clientId = '' } = {}) {
  const rows = list({ clientId, limit: 1000 });
  return {
    total: rows.length,
    active: rows.filter((row) => !['entregue', 'cancelado'].includes(row.status)).length,
    producing: rows.filter((row) => row.status === 'em_producao').length,
    delivered: rows.filter((row) => row.status === 'entregue').length,
    cancelled: rows.filter((row) => row.status === 'cancelado').length,
    contractedKg: rows.filter((row) => row.status !== 'cancelado').reduce((total, row) => total + row.quantityKg, 0),
  };
}

function recent(limit = 5, { clientId = '' } = {}) {
  return list({ clientId, limit });
}

module.exports = {
  list,
  findById,
  create,
  updateStatus,
  reservedKg,
  summary,
  recent,
  mapOrder,
};
