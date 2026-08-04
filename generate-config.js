const { writeFileSync } = require('fs');
const { version } = require('./package.json');

try {
  require('dotenv').config();
} catch {
  // dotenv isn't installed in the container runtime image - env vars are
  // already set there (docker-compose `environment:`), nothing to load.
}

const targetPath = process.argv[2] ?? './src/config.json';

const config = {
  production: process.env.PRODUCTION === 'true',
  versionNumber: `v${version}`,
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
  disableSso: process.env.DISABLE_SSO === 'true',
  ms: {
    tenant: process.env.MS_TENANT ?? '',
    clientId: process.env.MS_CLIENT_ID ?? '',
  },
};

writeFileSync(targetPath, JSON.stringify(config, null, 2));
console.log(`wrote runtime config to ${targetPath}`);
