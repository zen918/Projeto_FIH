const app = require('../src/app');
const { initDb } = require('../src/db');

let ready;

module.exports = async (req, res) => {
  if (!ready) ready = initDb();
  await ready;
  return app(req, res);
};
