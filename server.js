const app = require('./src/app');
const { initDb } = require('./src/db');
const { port, isVercel } = require('./src/config/env');

initDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`\n  Plastikkimik Pytangy MVC`);
      console.log(`  http://localhost:${port}`);
      console.log(`  SQLite local persistente: ${isVercel ? 'não (Vercel)' : 'sim'}`);
      console.log(`  Contas demo: admin@fih.com · floricultura@jau.com · lab@senai.com · cliente@embalagens.com`);
      console.log(`  Senha demo: Demo@1234\n`);
    });
  })
  .catch((error) => {
    console.error('Falha ao iniciar o banco:', error);
    process.exit(1);
  });
