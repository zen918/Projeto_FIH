PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'floricultura', 'comercio_cliente', 'pesquisador_lab')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'blocked')),
  avatar_url TEXT,
  organization_name TEXT NOT NULL,
  city TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS petal_collections (
  id TEXT PRIMARY KEY,
  florist_id TEXT NOT NULL REFERENCES users(id),
  weight_kg REAL NOT NULL CHECK (weight_kg > 0),
  quality_status TEXT NOT NULL CHECK (quality_status IN ('excelente', 'boa', 'regular', 'critica')),
  pickup_date TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'solicitada' CHECK (status IN ('solicitada', 'agendada', 'coletada', 'processada', 'cancelada')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bioplastic_batches (
  id TEXT PRIMARY KEY,
  batch_code TEXT NOT NULL UNIQUE,
  collection_id TEXT NOT NULL REFERENCES petal_collections(id),
  researcher_id TEXT NOT NULL REFERENCES users(id),
  formula_version TEXT NOT NULL,
  weight_produced_kg REAL NOT NULL CHECK (weight_produced_kg > 0),
  biodegradation_days INTEGER NOT NULL DEFAULT 35,
  tensile_strength REAL,
  trace_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'em_producao' CHECK (status IN ('em_producao', 'concluido', 'arquivado')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL REFERENCES users(id),
  batch_id TEXT NOT NULL REFERENCES bioplastic_batches(id),
  quantity_kg REAL NOT NULL CHECK (quantity_kg > 0),
  packaging_type TEXT NOT NULL CHECK (packaging_type IN ('sacola', 'filme', 'embalagem_rigida', 'outro')),
  status TEXT NOT NULL DEFAULT 'solicitado' CHECK (status IN ('solicitado', 'em_analise', 'aprovado', 'em_producao', 'entregue', 'cancelado')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_collections_florist ON petal_collections (florist_id);
CREATE INDEX IF NOT EXISTS idx_batches_collection ON bioplastic_batches (collection_id);
CREATE INDEX IF NOT EXISTS idx_batches_trace ON bioplastic_batches (trace_code);
CREATE INDEX IF NOT EXISTS idx_orders_client ON orders (client_id);
CREATE INDEX IF NOT EXISTS idx_orders_batch ON orders (batch_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets (token);
