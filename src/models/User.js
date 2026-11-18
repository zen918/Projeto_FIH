const { all, get, run, count } = require('../db');

const COLUMNS = `
  id, full_name, email, password_hash, role, status, avatar_url,
  organization_name, city, phone, created_at, updated_at
`;

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    status: row.status,
    avatarUrl: row.avatar_url,
    organizationName: row.organization_name,
    city: row.city,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function findById(id) {
  return mapUser(get(`SELECT ${COLUMNS} FROM users WHERE id = ?`, [id]));
}

function findByEmail(email) {
  return mapUser(get(`SELECT ${COLUMNS} FROM users WHERE email = ?`, [String(email).toLowerCase()]));
}

function create(data) {
  run(
    `INSERT INTO users (id, full_name, email, password_hash, role, status, avatar_url, organization_name, city, phone, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.id,
      data.fullName,
      data.email.toLowerCase(),
      data.passwordHash,
      data.role,
      data.status,
      data.avatarUrl ?? null,
      data.organizationName,
      data.city,
      data.phone,
      data.createdAt,
      data.updatedAt,
    ],
  );
  return findById(data.id);
}

function updateProfile(id, data) {
  const current = findById(id);
  if (!current) return null;
  const next = {
    fullName: data.fullName ?? current.fullName,
    organizationName: data.organizationName ?? current.organizationName,
    city: data.city ?? current.city,
    phone: data.phone ?? current.phone,
  };
  run(
    `UPDATE users SET full_name = ?, organization_name = ?, city = ?, phone = ?, updated_at = ? WHERE id = ?`,
    [next.fullName, next.organizationName, next.city, next.phone, new Date().toISOString(), id],
  );
  return findById(id);
}

function updateAvatar(id, avatarUrl) {
  run('UPDATE users SET avatar_url = ?, updated_at = ? WHERE id = ?', [avatarUrl, new Date().toISOString(), id]);
  return findById(id);
}

function updatePassword(id, passwordHash) {
  run('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [passwordHash, new Date().toISOString(), id]);
}

function updateStatus(id, status) {
  run('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), id]);
  return findById(id);
}

function list({ status = '', q = '' } = {}) {
  const conditions = [];
  const params = [];
  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }
  if (q) {
    conditions.push('(LOWER(full_name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(organization_name) LIKE ?)');
    const term = `%${q.toLowerCase()}%`;
    params.push(term, term, term);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return all(`SELECT ${COLUMNS} FROM users ${where} ORDER BY created_at DESC`, params).map(mapUser);
}

function counts() {
  return {
    total: count('SELECT COUNT(*) FROM users'),
    active: count("SELECT COUNT(*) FROM users WHERE status = 'active'"),
    pending: count("SELECT COUNT(*) FROM users WHERE status = 'pending'"),
    blocked: count("SELECT COUNT(*) FROM users WHERE status = 'blocked'"),
    florists: count("SELECT COUNT(*) FROM users WHERE role = 'floricultura'"),
    labs: count("SELECT COUNT(*) FROM users WHERE role = 'pesquisador_lab'"),
    clients: count("SELECT COUNT(*) FROM users WHERE role = 'comercio_cliente'"),
  };
}

function recent(limit = 5) {
  return all(`SELECT ${COLUMNS} FROM users ORDER BY created_at DESC LIMIT ?`, [limit]).map(mapUser);
}

module.exports = {
  findById,
  findByEmail,
  create,
  updateProfile,
  updateAvatar,
  updatePassword,
  updateStatus,
  list,
  counts,
  recent,
  mapUser,
};
