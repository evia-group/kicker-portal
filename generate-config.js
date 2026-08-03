const { writeFileSync } = require('fs');
const { version } = require('./package.json');

require('dotenv').config();

const targetPath = './src/config.json';

const config = {
  production: process.env.PRODUCTION === 'true',
  versionNumber: `v${version}`,
  prefix: process.env.PREFIX ?? 'T-',
  useEmulators: process.env.USE_EMULATORS === 'true',
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY ?? '',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN ?? '',
    databaseURL: process.env.FIREBASE_DATABASE_URL ?? '',
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? '',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID ?? '',
    appId: process.env.FIREBASE_APP_ID ?? '',
    measurementId: process.env.FIREBASE_MEASUREMENT_ID ?? '',
  },
  ms: {
    tenant: process.env.MS_TENANT ?? '',
  },
};

writeFileSync(targetPath, JSON.stringify(config, null, 2));
console.log(`wrote runtime config to ${targetPath}`);
