const { all, get, run } = require('../db');

const BASE_SELECT = `
  SELECT b.*, c.weight_kg AS petals_kg, c.quality_status, c.pickup_date, c.notes AS collection_notes,
         c.address AS collection_address, c.created_at AS collection_created_at, c.florist_id,
         uf.full_name AS florist_name, uf.organization_name AS florist_organization,
         uf.city AS florist_city, uf.email AS florist_email,
         ur.full_name AS researcher_name, ur.organization_name AS researcher_organization,
         COALESCE((
           SELECT SUM(o.quantity_kg) FROM orders o
           WHERE o.batch_id = b.id AND o.status != 'cancelado'
         ), 0) AS reserved_kg
  FROM bioplastic_batches b
  JOIN petal_collections c ON c.id = b.collection_id
  JOIN users uf ON uf.id = c.florist_id
  JOIN users ur ON ur.id = b.researcher_id
`;

function mapBatch(row) {
  if (!row) return null;
  const reservedKg = Number(row.reserved_kg || 0);
  const producedKg = Number(row.weight_produced_kg);
  return {
    id: row.id,
    batchCode: row.batch_code,
    collectionId: row.collection_id,
    researcherId: row.researcher_id,
    researcherName: row.researcher_name,
    researcherOrganization: row.researcher_organization,
    formulaVersion: row.formula_version,
    weightProducedKg: producedKg,
    biodegradationDays: Number(row.biodegradation_days),
    tensileStrength: row.tensile_strength === null ? null : Number(row.tensile_strength),
    traceCode: row.trace_code,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    petalsKg: Number(row.petals_kg),
    qualityStatus: row.quality_status,
    pickupDate: row.pickup_date,
    collectionNotes: row.collection_notes,
    collectionAddress: row.collection_address,
    collectionCreatedAt: row.collection_created_at,
    floristId: row.florist_id,
    floristName: row.florist_name,
    floristOrganization: row.florist_organization,
    floristCity: row.florist_city,
    floristEmail: row.florist_email,
    reservedKg: Math.round(reservedKg * 1000) / 1000,
    availableKg: Math.max(0, Math.round((producedKg - reservedKg) * 1000) / 1000),
  };
}

function list({ floristId = '', status = '', search = '', includeArchived = true, limit = 200 } = {}) {
  const conditions = [];
  const params = [];
  if (floristId) {
    conditions.push('c.florist_id = ?');
    params.push(floristId);
  }
  if (status) {
    conditions.push('b.status = ?');
    params.push(status);
  }
  if (!includeArchived) conditions.push("b.status != 'arquivado'");
  if (search) {
    conditions.push('(LOWER(b.batch_code) LIKE ? OR LOWER(b.formula_version) LIKE ? OR LOWER(b.trace_code) LIKE ?)');
    const term = `%${search.toLowerCase()}%`;
    params.push(term, term, term);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  params.push(limit);
  return all(`${BASE_SELECT} ${where} ORDER BY b.created_at DESC LIMIT ?`, params).map(mapBatch);
}

function findById(id) {
  return mapBatch(get(`${BASE_SELECT} WHERE b.id = ?`, [id]));
}

function findByTraceCode(traceCode) {
  return mapBatch(get(`${BASE_SELECT} WHERE UPPER(b.trace_code) = ?`, [String(traceCode || '').toUpperCase()]));
}

function create(data) {
  run(
    `INSERT INTO bioplastic_batches
      (id, batch_code, collection_id, researcher_id, formula_version, weight_produced_kg, biodegradation_days, tensile_strength, trace_code, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'em_producao', ?, ?)`,
    [
      data.id,
      data.batchCode,
      data.collectionId,
      data.researcherId,
      data.formulaVersion,
      data.weightProducedKg,
      data.biodegradationDays,
      data.tensileStrength ?? null,
      data.traceCode,
      data.createdAt,
      data.createdAt,
    ],
  );
  return findById(data.id);
}

function updateStatus(id, status) {
  run('UPDATE bioplastic_batches SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id]);
  return findById(id);
}

function activeOrders(id) {
  const row = get(
    `SELECT COUNT(*) AS total FROM orders WHERE batch_id = ? AND status NOT IN ('entregue', 'cancelado')`,
    [id],
  );
  return Number(row?.total || 0);
}

function availableForOrder() {
  return list({ includeArchived: false, limit: 500 }).filter((batch) => batch.availableKg > 0);
}

function summary({ floristId = '' } = {}) {
  const rows = list({ floristId, limit: 1000 });
  return {
    total: rows.length,
    producedKg: rows.reduce((total, row) => total + row.weightProducedKg, 0),
    reservedKg: rows.reduce((total, row) => total + row.reservedKg, 0),
    availableKg: rows.reduce((total, row) => total + row.availableKg, 0),
    active: rows.filter((row) => row.status === 'em_producao').length,
    concluded: rows.filter((row) => row.status === 'concluido').length,
  };
}

function existsByCode(batchCode, traceCode, ignoreId = '') {
  const row = get(
    'SELECT id FROM bioplastic_batches WHERE (batch_code = ? OR trace_code = ?) AND id != ?',
    [batchCode, traceCode, ignoreId],
  );
  return Boolean(row);
}

module.exports = {
  list,
  findById,
  findByTraceCode,
  create,
  updateStatus,
  activeOrders,
  availableForOrder,
  summary,
  existsByCode,
  mapBatch,
};
