/**
 * Smoke test do demo MVC.
 * Sobe o app em uma porta efêmera e valida rotas públicas, login e RBAC.
 * Uso: npm run check
 */
const assert = require('node:assert');
const app = require('../src/app');

const DEMO = [
  {
    email: 'admin@fih.com',
    home: '/app/admin',
    pages: ['/app/admin?status=pending', '/app/coletas', '/app/lotes', '/app/lotes/bat_1', '/app/pedidos', '/app/perfil'],
  },
  {
    email: 'floricultura@jau.com',
    home: '/app/coletas',
    pages: ['/app/coletas/nova', '/app/lotes', '/app/lotes/bat_1', '/app/perfil'],
  },
  {
    email: 'lab@senai.com',
    home: '/app/lotes',
    pages: ['/app/coletas', '/app/lotes/novo', '/app/lotes/bat_1', '/app/pedidos', '/app/perfil'],
  },
  {
    email: 'cliente@embalagens.com',
    home: '/app/pedidos',
    pages: ['/app/pedidos/novo', '/app/lotes', '/app/lotes/bat_1', '/app/selo', '/app/perfil'],
  },
];

function cookieFrom(response) {
  const list = typeof response.headers.getSetCookie === 'function'
    ? response.headers.getSetCookie()
    : [response.headers.get('set-cookie')].filter(Boolean);
  return list.map((header) => header.split(';')[0]).join('; ');
}

async function main() {
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let checks = 0;

  const expectStatus = async (path, status, options) => {
    const response = await fetch(`${base}${path}`, { redirect: 'manual', ...options });
    assert.strictEqual(response.status, status, `${path} respondeu ${response.status}, esperado ${status}`);
    checks += 1;
    return response;
  };

  try {
    const health = await expectStatus('/health', 200);
    const payload = await health.json();
    assert.strictEqual(payload.status, 'ok');
    assert.ok(payload.users >= 7, 'seed deve conter ao menos 7 usuários');

    const home = await expectStatus('/', 200);
    const homeHtml = await home.text();
    const cssVersion = homeHtml.match(/\/assets\/css\/app\.css\?v=([a-f0-9]{12})/);
    assert.ok(cssVersion, 'CSS URL deve conter a versão do conteúdo');
    checks += 1;
    await expectStatus(`/assets/css/app.css?v=${cssVersion[1]}`, 200);
    await expectStatus('/login', 200);
    await expectStatus('/cadastro', 200);
    await expectStatus('/rastreio', 200);
    await expectStatus('/recuperar-senha', 200);
    await expectStatus('/assets/css/app.css', 200);
    await expectStatus('/assets/js/app.js', 200);
    for (const image of [
      '/assets/images/rose-cycle.svg',
      '/assets/images/petal-collection.svg',
      '/assets/images/lab-bioplastic.svg',
      '/assets/images/traceable-package.svg',
      '/assets/images/circular-packaging.svg',
    ]) {
      await expectStatus(image, 200);
    }
    await expectStatus('/r/PYTA1B2', 200);
    await expectStatus('/r/PYTA1B2/qr.png', 200);

    const qr = await fetch(`${base}/r/PYTA1B2/qr.png`);
    assert.strictEqual(qr.headers.get('content-type'), 'image/png');
    checks += 1;

    await expectStatus('/app', 302);
    await expectStatus('/app/admin', 302);
    await expectStatus('/r/NAOEXISTE', 404);

    const pendingLogin = await fetch(`${base}/demo-login`, {
      method: 'POST',
      redirect: 'manual',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'email=contato%40florlux.com',
    });
    assert.strictEqual(pendingLogin.status, 302);
    checks += 1;

    for (const account of DEMO) {
      const login = await fetch(`${base}/demo-login`, {
        method: 'POST',
        redirect: 'manual',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `email=${encodeURIComponent(account.email)}`,
      });
      assert.strictEqual(login.status, 302, `login demo de ${account.email} deve redirecionar`);
      const cookie = cookieFrom(login);
      assert.ok(cookie.startsWith('pytangy.demo='), 'sessão deve ser criada');

      for (const path of ['/app', '/app/perfil', account.home, ...account.pages]) {
        const page = await fetch(`${base}${path}`, { headers: { Cookie: cookie }, redirect: 'manual' });
        assert.strictEqual(page.status, 200, `${account.email} deveria acessar ${path}`);
        checks += 1;
      }

      const forbidden = await fetch(`${base}/app/admin`, { headers: { Cookie: cookie }, redirect: 'manual' });
      const allowed = account.email === 'admin@fih.com';
      assert.strictEqual(
        forbidden.status,
        allowed ? 200 : 403,
        `RBAC de /app/admin para ${account.email} retornou ${forbidden.status}`,
      );
      checks += 1;
    }

    console.log(`Smoke test concluído: ${checks} verificações OK.`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((error) => {
  console.error('Smoke test falhou:', error);
  process.exitCode = 1;
});
