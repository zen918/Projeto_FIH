const bcrypt = require('bcryptjs');

const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days) {
  return new Date(Date.now() - days * DAY).toISOString();
}

function dateOnly(days) {
  return daysAgo(days).slice(0, 10);
}

function seed(db, password = 'Demo@1234') {
  const now = new Date().toISOString();
  const hash = bcrypt.hashSync(password, 10);

  const users = [
    ['usr_admin', 'Equipe FIH', 'admin@fih.com', hash, 'superadmin', 'active', null, 'Equipe FIH · SENAI Jaú', 'Jaú', '(14) 99999-0001', daysAgo(210), daysAgo(210)],
    ['usr_florist', 'Marina Rosa', 'floricultura@jau.com', hash, 'floricultura', 'active', null, 'Floricultura Rosa de Jaú', 'Jaú', '(14) 98888-1002', daysAgo(190), daysAgo(190)],
    ['usr_lab', 'Prof. Ana Beatriz', 'lab@senai.com', hash, 'pesquisador_lab', 'active', null, 'Laboratório de Biotecnologia SENAI', 'Jaú', '(14) 97777-2003', daysAgo(188), daysAgo(188)],
    ['usr_client', 'Rafael Verde', 'cliente@embalagens.com', hash, 'comercio_cliente', 'active', null, 'EcoEmbalagens B2B', 'Bauru', '(14) 96666-3004', daysAgo(170), daysAgo(170)],
    ['usr_florist2', 'Carlos Jardim', 'floricultura2@jau.com', hash, 'floricultura', 'active', null, 'Jardim das Acácias', 'Jaú', '(14) 95555-4005', daysAgo(120), daysAgo(120)],
    ['usr_pending', 'Lucia Prado', 'contato@florlux.com', hash, 'floricultura', 'pending', null, 'Florlux Distribuidora', 'Bariri', '(14) 94444-5006', daysAgo(2), daysAgo(2)],
    ['usr_client2', 'Camila Nobre', 'compras@verde.com', hash, 'comercio_cliente', 'active', null, 'Verde Vivo Embalagens', 'Pederneiras', '(14) 93333-6007', daysAgo(90), daysAgo(90)],
  ];

  for (const user of users) {
    db.run(
      `INSERT INTO users (id, full_name, email, password_hash, role, status, avatar_url, organization_name, city, phone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      user,
    );
  }

  const collections = [
    ['col_1', 'usr_florist', 18, 'excelente', dateOnly(154), 'Rua das Rosas, 120 · Jaú/SP', 'Pétalas de rosas vermelhas separadas após o expediente.', 'processada', daysAgo(160), daysAgo(130)],
    ['col_2', 'usr_florist2', 22.5, 'boa', dateOnly(128), 'Av. das Acácias, 88 · Jaú/SP', 'Pico pós-dia das mães, armazenado em câmara fria.', 'processada', daysAgo(135), daysAgo(110)],
    ['col_3', 'usr_florist', 16, 'excelente', dateOnly(108), 'Rua das Rosas, 120 · Jaú/SP', 'Rosas brancas e champagne provenientes do descarte de eventos.', 'processada', daysAgo(115), daysAgo(90)],
    ['col_4', 'usr_florist2', 14, 'regular', dateOnly(85), 'Av. das Acácias, 88 · Jaú/SP', 'Separação manual; parte das pétalas usada em teste de pigmento.', 'processada', daysAgo(92), daysAgo(70)],
    ['col_5', 'usr_florist', 20, 'boa', dateOnly(59), 'Rua das Rosas, 120 · Jaú/SP', 'Coleta extra de fim de semana.', 'processada', daysAgo(68), daysAgo(42)],
    ['col_6', 'usr_florist2', 24, 'excelente', dateOnly(34), 'Av. das Acácias, 88 · Jaú/SP', 'Lote grande após casamento; pétalas preservadas.', 'processada', daysAgo(42), daysAgo(18)],
    ['col_7', 'usr_florist', 13, 'boa', dateOnly(16), 'Rua das Rosas, 120 · Jaú/SP', 'Aguardando transporte para o laboratório.', 'coletada', daysAgo(20), daysAgo(3)],
    ['col_8', 'usr_florist2', 5.5, 'regular', dateOnly(-2), 'Av. das Acácias, 88 · Jaú/SP', 'Retirada solicitada para esta semana.', 'agendada', daysAgo(6), daysAgo(2)],
  ];

  for (const collection of collections) {
    db.run(
      `INSERT INTO petal_collections (id, florist_id, weight_kg, quality_status, pickup_date, address, notes, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      collection,
    );
  }

  const batches = [
    ['bat_1', 'LOTE-260301-A1B2', 'col_1', 'usr_lab', 'V1 - Amido + glicerol', 5.2, 34, 18.4, 'PYTA1B2', 'concluido', daysAgo(130), daysAgo(120)],
    ['bat_2', 'LOTE-260412-B2C3', 'col_2', 'usr_lab', 'V1 - Amido + glicerol', 6.5, 32, 19.1, 'PYTA2C3', 'concluido', daysAgo(110), daysAgo(100)],
    ['bat_3', 'LOTE-260520-C3D4', 'col_3', 'usr_lab', 'V2 - Pétalas + quitosana', 4.8, 28, 21.7, 'PYTA3D4', 'concluido', daysAgo(90), daysAgo(80)],
    ['bat_4', 'LOTE-260618-D4E5', 'col_4', 'usr_lab', 'V2 - Pétalas + quitosana', 5.6, 29, 20.9, 'PYTA4E5', 'concluido', daysAgo(70), daysAgo(55)],
    ['bat_5', 'LOTE-260809-E5F6', 'col_5', 'usr_lab', 'V3 - Blend flexível', 6, 36, 17.8, 'PYTA5F6', 'em_producao', daysAgo(40), daysAgo(20)],
    ['bat_6', 'LOTE-261005-F6G7', 'col_6', 'usr_lab', 'V3 - Blend flexível', 5, 37, 18.1, 'PYTA6G7', 'em_producao', daysAgo(15), daysAgo(8)],
  ];

  for (const batch of batches) {
    db.run(
      `INSERT INTO bioplastic_batches (id, batch_code, collection_id, researcher_id, formula_version, weight_produced_kg, biodegradation_days, tensile_strength, trace_code, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      batch,
    );
  }

  const orders = [
    ['ord_1', 'usr_client', 'bat_1', 2, 'sacola', 'entregue', 'Primeiro pedido piloto.', daysAgo(122), daysAgo(110)],
    ['ord_2', 'usr_client', 'bat_2', 2.5, 'filme', 'entregue', 'Filme para vitrine.', daysAgo(102), daysAgo(88)],
    ['ord_3', 'usr_client', 'bat_3', 1.5, 'embalagem_rigida', 'entregue', 'Caixas para cosméticos.', daysAgo(82), daysAgo(68)],
    ['ord_4', 'usr_client', 'bat_4', 2.8, 'sacola', 'entregue', 'Sacolas de eventos.', daysAgo(57), daysAgo(38)],
    ['ord_5', 'usr_client', 'bat_5', 1.2, 'filme', 'em_producao', 'Aguardando corte.', daysAgo(20), daysAgo(12)],
    ['ord_6', 'usr_client', 'bat_6', 1.6, 'sacola', 'aprovado', 'Amostra para loja conceito.', daysAgo(8), daysAgo(5)],
    ['ord_7', 'usr_client', 'bat_4', 1, 'embalagem_rigida', 'solicitado', 'Pedido recém-criado.', daysAgo(1), daysAgo(1)],
    ['ord_8', 'usr_client2', 'bat_2', 1, 'filme', 'entregue', 'Parceria de teste.', daysAgo(95), daysAgo(80)],
    ['ord_9', 'usr_client2', 'bat_6', 0.8, 'sacola', 'em_analise', 'Aguardando análise técnica.', daysAgo(4), daysAgo(3)],
  ];

  for (const order of orders) {
    db.run(
      `INSERT INTO orders (id, client_id, batch_id, quantity_kg, packaging_type, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      order,
    );
  }

  db.run('DELETE FROM password_resets');
  db.run('PRAGMA user_version = 1');
  return { seededAt: now, users: users.length, collections: collections.length, batches: batches.length, orders: orders.length };
}

module.exports = { seed };
