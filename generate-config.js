const { writeFileSync } = require('fs');
const { version } = require('./package.json');

require('dotenv').config();

const targetPath = './src/config.json';

const config = {
  production: process.env.PRODUCTION === 'true',
  versionNumber: `v${version}`,
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
  ms: {
    tenant: process.env.MS_TENANT ?? '',
    clientId: process.env.MS_CLIENT_ID ?? '',
  },
};

writeFileSync(targetPath, JSON.stringify(config, null, 2));
console.log(`wrote runtime config to ${targetPath}`);
