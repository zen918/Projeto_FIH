"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const server = app_1.app.listen(env_1.env.port, () => {
    console.log('');
    console.log('  ✿ Plastikkimik Pytangy API');
    console.log(`  ➜ http://localhost:${env_1.env.port}/api/health`);
    console.log(`  ➜ Ambiente: ${env_1.env.nodeEnv} | Modo demo: ${env_1.isDemo ? 'SIM' : 'NÃO'}`);
    if (env_1.isDemo) {
        console.log('  ➜ Contas demo (senha Demo@1234):');
        console.log('      admin@fih.com           · SuperAdmin');
        console.log('      floricultura@jau.com    · Floricultura');
        console.log('      lab@senai.com           · Pesquisador');
        console.log('      cliente@embalagens.com  · Comércio B2B');
    }
    console.log('');
});
function shutdown(signal) {
    console.log(`\n[api] recebido ${signal}, encerrando...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 8000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
//# sourceMappingURL=server.js.map