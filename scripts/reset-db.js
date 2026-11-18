const fs = require('node:fs');
const path = require('node:path');

const file = path.resolve(process.cwd(), process.env.DATABASE_FILE || path.join('data', 'plastikkimik.sqlite'));

if (fs.existsSync(file)) {
  fs.rmSync(file);
  console.log(`Banco removido: ${file}`);
} else {
  console.log(`Nenhum banco encontrado em ${file}. O próximo start recria o seed.`);
}
