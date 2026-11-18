const path = require('node:path');
require('dotenv').config();

const isVercel = process.env.VERCEL === '1' || Boolean(process.env.VERCEL_ENV);

module.exports = {
  port: Number(process.env.PORT || 3000),
  isVercel,
  sessionSecret: process.env.SESSION_SECRET || 'plastikkimik-pytangy-demo-secret',
  publicAppUrl: (process.env.PUBLIC_APP_URL || '').replace(/\/$/, ''),
  autoApproveSignup: process.env.SIGNUP_AUTO_APPROVE !== 'false',
  demoLogin: process.env.DEMO_LOGIN !== 'false',
  demoPassword: process.env.DEMO_PASSWORD || 'Demo@1234',
  databaseFile: path.resolve(process.env.DATABASE_FILE || path.join(process.cwd(), 'data', 'plastikkimik.sqlite')),
};
