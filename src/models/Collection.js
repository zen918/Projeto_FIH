const { all, get, run } = require('../db');

const BASE_SELECT = `
  SELECT c.*, u.full_name AS florist_name, u.organization_name AS florist_organization,
         u.city AS florist_city, u.email AS florist_email
  FROM petal_collections c
  JOIN users u ON u.id = c.florist_id
`;

function mapCollection(row) {
  if (!row) return null;
  return {
    id: row.id,
    floristId: row.florist_id,
    floristName: row.florist_name,
    floristOrganization: row.florist_organization,
    floristCity: row.florist_city,
    floristEmail: row.florist_email,
    weightKg: Number(row.weight_kg),
    qualityStatus: row.quality_status,
    pickupDate: row.pickup_date,
    address: row.address,
    notes: row.notes,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function list({ floristId = '', status = '', limit = 200 } = {}) {
  const conditions = [];
  const params = [];
  if (floristId) {
    conditions.push('c.florist_id = ?');
    params.push(floristId);
  }
  if (status) {
    conditions.push('c.status = ?');
    params.push(status);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit);
  return all(`${BASE_SELECT} ${where} ORDER BY c.created_at DESC LIMIT ?`, params).map(mapCollection);
}

function findById(id) {
  return mapCollection(get(`${BASE_SELECT} WHERE c.id = ?`, [id]));
}

function create(data) {
  run(
    `INSERT INTO petal_collections (id, florist_id, weight_kg, quality_status, pickup_date, address, notes, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'solicitada', ?, ?)`,
    [data.id, data.floristId, data.weightKg, data.qualityStatus, data.pickupDate, data.address, data.notes, data.createdAt, data.createdAt],
  );
  return findById(data.id);
}

function updateStatus(id, status) {
  run('UPDATE petal_collections SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id]);
  return findById(id);
}

function availableForBatch() {
  return all(
    `${BASE_SELECT}
     WHERE c.status IN ('coletada', 'processada')
       AND NOT EXISTS (SELECT 1 FROM bioplastic_batches b WHERE b.collection_id = c.id)
     ORDER BY c.created_at DESC`,
  ).map(mapCollection);
}

function summary({ floristId = '' } = {}) {
  const rows = list({ floristId, limit: 1000 });
  const active = rows.filter((item) => !['cancelada', 'processada'].includes(item.status));
  return {
    total: rows.length,
    weightKg: rows.filter((item) => item.status !== 'cancelada').reduce((total, item) => total + item.weightKg, 0),
    active: active.length,
    processed: rows.filter((item) => item.status === 'processada').length,
    pending: rows.filter((item) => item.status === 'solicitada').length,
  };
}

module.exports = {
  list,
  findById,
  create,
  updateStatus,
  availableForBatch,
  summary,
  mapCollection,
};
