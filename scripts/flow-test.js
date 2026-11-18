/**
 * Teste de fluxo completo do demo.
 * Usa um SQLite temporário e isolado para não alterar o banco local.
 * Uso: npm run test:flow
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const TEST_DB = path.join(os.tmpdir(), `plastikkimik-flow-${process.pid}.sqlite`);

process.env.DATABASE_FILE = TEST_DB;
process.env.SESSION_SECRET = 'plastikkimik-flow-test-secret';
process.env.DEMO_PASSWORD = 'Demo@1234';
process.env.SIGNUP_AUTO_APPROVE = 'true';

const app = require(path.join(ROOT, 'src/app'));
const { initDb } = require(path.join(ROOT, 'src/db'));
const Collection = require(path.join(ROOT, 'src/models/Collection'));
const Batch = require(path.join(ROOT, 'src/models/Batch'));
const Order = require(path.join(ROOT, 'src/models/Order'));
const User = require(path.join(ROOT, 'src/models/User'));
const { getSnapshot } = require(path.join(ROOT, 'src/services/impact'));

function cookies(response) {
  const list = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return list.map((header) => header.split(';')[0]).join('; ');
}

async function main() {
  await initDb();
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let checks = 0;
  const ok = (condition, label) => {
    if (!condition) throw new Error(label);
    checks += 1;
  };
  const login = async (email) => {
    const response = await fetch(`${base}/demo-login`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `email=${encodeURIComponent(email)}`,
    });
    ok(response.status === 302, `login ${email}`);
    return cookies(response);
  };
  const post = (cookie, url, body) =>
    fetch(`${base}${url}`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie },
      body: new URLSearchParams(body).toString(),
    });
  const get = (cookie, url) => fetch(`${base}${url}`, { redirect: 'manual', headers: { Cookie: cookie } });
  const today = new Date().toISOString().slice(0, 10);

  try {
    const florist = await login('floricultura@jau.com');
    const floristUser = User.findByEmail('floricultura@jau.com');

    // Validação deve retornar 422
    let res = await post(florist, '/app/coletas', {
      weightKg: '0',
      pickupDate: today,
      address: 'Rua Teste, 10',
      qualityStatus: 'boa',
      notes: 'inválida',
    });
    ok(res.status === 422, 'coleta inválida deve retornar 422');

    res = await post(florist, '/app/coletas', {
      weightKg: '9.5',
      pickupDate: today,
      address: 'Rua do Fluxo, 42 · Jaú/SP',
      qualityStatus: 'excelente',
      notes: 'FLOWTEST coleta automatizada',
    });
    ok(res.status === 302, 'coleta criada deve redirecionar');
    const collection = Collection.list({ floristId: floristUser.id, limit: 1000 })
      .find((item) => item.notes.includes('FLOWTEST'));
    ok(Boolean(collection), 'coleta criada deve existir');
    ok((await get(florist, '/app/coletas?status=solicitada')).status === 200, 'listagem filtrada');

    const lab = await login('lab@senai.com');
    for (const expected of ['agendada', 'coletada']) {
      res = await post(lab, `/app/coletas/${collection.id}/status`, { action: 'advance' });
      ok(res.status === 302, 'avançar coleta');
      ok(Collection.findById(collection.id).status === expected, `status da coleta deve ser ${expected}`);
    }

    res = await post(lab, '/app/lotes', {
      collectionId: collection.id,
      formulaVersion: 'V9 - Teste de fluxo',
      batchCode: '',
      weightProducedKg: '2.8',
      biodegradationDays: '30',
      tensileStrength: '19.5',
    });
    ok(res.status === 302, 'lote criado deve redirecionar');
    const batchId = res.headers.get('location').split('/').pop();
    const batch = Batch.findById(batchId);
    ok(Boolean(batch) && batch.traceCode.startsWith('PYTA'), 'lote deve ter trace code');
    ok((await get(lab, `/app/lotes/${batchId}`)).status === 200, 'detalhe do lote');
    ok((await get(florist, `/app/lotes/${batchId}`)).status === 200, 'floricultura vê o próprio lote');

    // Pedido do cliente: o impacto pessoal considera apenas entregas
    const client = await login('cliente@embalagens.com');
    const clientUser = User.findByEmail('cliente@embalagens.com');
    ok(getSnapshot(clientUser).personal.bioplasticProducedKg === 8.8, 'impacto inicial do cliente deve ser 8,8 kg');

    res = await post(client, '/app/pedidos', {
      batchId,
      quantityKg: '99',
      packagingType: 'sacola',
      notes: 'excesso',
    });
    ok(res.status === 422, 'pedido acima do disponível deve retornar 422');

    res = await post(client, '/app/pedidos', {
      batchId,
      quantityKg: '1',
      packagingType: 'sacola',
      notes: 'FLOWTEST pedido',
    });
    ok(res.status === 302, 'pedido criado');
    const order = Order.list({ batchId }).find((item) => item.notes.includes('FLOWTEST'));
    ok(Boolean(order), 'pedido deve existir');

    for (const expected of ['em_analise', 'aprovado', 'em_producao', 'entregue']) {
      res = await post(lab, `/app/pedidos/${order.id}/status`, { action: 'advance' });
      ok(res.status === 302, 'avançar pedido');
      ok(Order.findById(order.id).status === expected, `status do pedido deve ser ${expected}`);
    }

    ok((await get(client, '/app/selo')).status === 200, 'selo do cliente');
    ok(getSnapshot(clientUser).personal.bioplasticProducedKg === 9.8, 'impacto deve subir para 9,8 kg após a entrega');
    ok((await get(client, '/app/coletas')).status === 403, 'RBAC coleta para cliente');
    ok((await post(client, '/app/coletas', {})).status === 403, 'RBAC POST coleta para cliente');

    // Lote: concluir e arquivar (sem pedidos ativos; pedido entregue)
    await post(lab, `/app/lotes/${batchId}/status`, {});
    ok(Batch.findById(batchId).status === 'concluido', 'lote concluído');
    await post(lab, `/app/lotes/${batchId}/status`, {});
    ok(Batch.findById(batchId).status === 'arquivado', 'lote arquivado');

    // Admin
    const admin = await login('admin@fih.com');
    res = await post(admin, '/app/admin/usuarios/usr_pending/status', { action: 'approve' });
    ok(res.status === 302 && User.findById('usr_pending').status === 'active', 'admin aprova conta');
    res = await post(admin, '/app/admin/usuarios/usr_client2/status', { action: 'block' });
    ok(User.findById('usr_client2').status === 'blocked', 'admin bloqueia conta');
    res = await post(admin, '/app/admin/usuarios/usr_client2/status', { action: 'reactivate' });
    ok(User.findById('usr_client2').status === 'active', 'admin reativa conta');
    ok((await post(admin, '/app/admin/usuarios/usr_admin/status', { action: 'block' })).status === 302, 'admin não altera a si mesmo');
    ok(User.findById('usr_admin').status === 'active', 'superadmin permanece ativo');

    // Perfil
    res = await post(florist, '/app/perfil', {
      fullName: 'Marina Rosa',
      organizationName: 'Floricultura Rosa de Jaú',
      city: 'Jaú',
      phone: '(14) 98888-1002',
    });
    ok(res.status === 302, 'perfil atualizado');

    // Cadastro público
    const signup = await fetch(`${base}/cadastro`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        fullName: 'Teste Fluxo',
        email: 'flowtest@example.com',
        role: 'floricultura',
        organizationName: 'Fluxo Testes',
        city: 'Jaú',
        phone: '(14) 90000-0000',
        password: 'Teste1234',
        passwordConfirm: 'Teste1234',
      }).toString(),
    });
    ok(signup.status === 302, 'cadastro público');
    ok(User.findByEmail('flowtest@example.com').status === 'active', 'cadastro entra ativo');

    // Rastreio do novo lote
    ok((await fetch(`${base}/r/${batch.traceCode}`)).status === 200, 'rastreio do novo lote');

    console.log(`Flow test concluído: ${checks} verificações OK.`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    fs.rmSync(TEST_DB, { force: true });
    fs.rmSync(`${TEST_DB}-journal`, { force: true });
  }
}

main().catch((error) => {
  console.error('Flow test falhou:', error);
  process.exitCode = 1;
});
