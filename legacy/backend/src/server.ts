import { app } from './app';
import { env, isDemo } from './config/env';

const server = app.listen(env.port, () => {
  console.log('');
  console.log('  ✿ Plastikkimik Pytangy API');
  console.log(`  ➜ http://localhost:${env.port}/api/health`);
  console.log(`  ➜ Ambiente: ${env.nodeEnv} | Modo demo: ${isDemo ? 'SIM' : 'NÃO'}`);
  if (isDemo) {
    console.log('  ➜ Contas demo (senha Demo@1234):');
    console.log('      admin@fih.com           · SuperAdmin');
    console.log('      floricultura@jau.com    · Floricultura');
    console.log('      lab@senai.com           · Pesquisador');
    console.log('      cliente@embalagens.com  · Comércio B2B');
  }
  console.log('');
});

function shutdown(signal: string) {
  console.log(`\n[api] recebido ${signal}, encerrando...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 8000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
