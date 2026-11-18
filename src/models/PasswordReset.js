const { get, run } = require('../db');

function create(data) {
  run(
    `INSERT INTO password_resets (id, user_id, token, expires_at, used, created_at)
     VALUES (?, ?, ?, ?, 0, ?)`,
    [data.id, data.userId, data.token, data.expiresAt, data.createdAt],
  );
}

function findValid(token) {
  return get(
    `SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1`,
    [token, new Date().toISOString()],
  );
}

function markUsed(id) {
  run('UPDATE password_resets SET used = 1 WHERE id = ?', [id]);
}

function deleteForUser(userId) {
  run('DELETE FROM password_resets WHERE user_id = ?', [userId]);
}

module.exports = { create, findValid, markUsed, deleteForUser };
