const fs = require('node:fs');
const path = require('node:path');
const initSqlJs = require('sql.js');
const { databaseFile, isVercel, demoPassword } = require('../config/env');
const { seed } = require('../../database/seed');

const schemaSql = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');

let SQL = null;
let db = null;
let readyPromise = null;
let seedInfo = null;

function persist() {
  if (isVercel || !db) return;
  fs.mkdirSync(path.dirname(databaseFile), { recursive: true });
  fs.writeFileSync(databaseFile, Buffer.from(db.export()));
}

function loadDatabase(SQLRuntime) {
  let instance = null;
  let loadedFromDisk = false;

  if (!isVercel && fs.existsSync(databaseFile)) {
    try {
      instance = new SQLRuntime.Database(fs.readFileSync(databaseFile));
      instance.exec('SELECT 1');
      loadedFromDisk = true;
    } catch (error) {
      console.warn('[db] Banco local inválido; recriando seed.', error.message);
      instance = null;
    }
  }

  if (!instance) instance = new SQLRuntime.Database();

  instance.run('PRAGMA foreign_keys = ON');
  instance.exec(schemaSql);

  const countResult = instance.exec('SELECT COUNT(*) AS total FROM users');
  const totalUsers = countResult[0]?.values?.[0]?.[0] ?? 0;

  if (totalUsers === 0) {
    seedInfo = seed(instance, demoPassword);
    console.log('[db] Seed de demonstração aplicado:', seedInfo);
  }

  return { instance, loadedFromDisk };
}

async function initDb() {
  if (db) return db;
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
    const wasmBinary = fs.readFileSync(wasmPath);
    SQL = await initSqlJs({ wasmBinary });
    const loaded = loadDatabase(SQL);
    db = loaded.instance;
    persist();
    console.log(
      `[db] SQLite ${isVercel ? 'efêmero (Vercel)' : `local em ${databaseFile}`} · ${loaded.loadedFromDisk ? 'arquivo carregado' : 'banco novo'}`,
    );
    return db;
  })();

  return readyPromise;
}

function requireDb() {
  if (!db) throw new Error('Banco de dados ainda não inicializado.');
  return db;
}

function all(sql, params = []) {
  const instance = requireDb();
  const statement = instance.prepare(sql);
  try {
    if (params.length) statement.bind(params);
    const rows = [];
    while (statement.step()) rows.push(statement.getAsObject());
    return rows;
  } finally {
    statement.free();
  }
}

function get(sql, params = []) {
  return all(sql, params)[0] ?? null;
}

function run(sql, params = []) {
  const instance = requireDb();
  instance.run(sql, params);
  const changes = instance.getRowsModified();
  persist();
  return changes;
}

function count(sql, params = []) {
  const row = get(sql, params);
  return row ? Number(Object.values(row)[0] || 0) : 0;
}

function getSeedInfo() {
  return seedInfo;
}

module.exports = { initDb, all, get, run, count, getSeedInfo };
