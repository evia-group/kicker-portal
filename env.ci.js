const { writeFile, existsSync, mkdirSync } = require('fs');
const { version } = require('./package.json');

require('dotenv').config();

function writeFileUsingFS(targetPathFS, environmentFileContentFS) {
  writeFile(targetPathFS, environmentFileContentFS, function (err) {
    if (err) {
      console.log(err);
    }
    if (environmentFileContentFS !== '') {
      console.log(`wrote variables to ${targetPathFS}`);
    }
  });
}

// Providing path to the `environments` directory
const envDirectory = './src/environments';

// creates the `environments` directory if it does not exist
if (!existsSync(envDirectory)) {
  mkdirSync(envDirectory);
}

//creates the `environment.prod.ts` and `environment.ts` file if it does not exist
writeFileUsingFS('./src/environments/environment.prod.ts', '');
writeFileUsingFS('./src/environments/environment.ts', '');

// choose the correct targetPath based on the environment chosen
const targetProdPath = './src/environments/environment.prod.ts';
const targetDevPath = './src/environments/environment.ts';

//actual content to be compiled dynamically and pasted into respective environment files
const environmentFileProdContent = `
  // This file was autogenerated by dynamically running setEnv.ts and using dotenv for managing API key secrecy
  export const environment = {
    production: true,
    versionNumber: 'v${version}',
    prefix: '',
    firebase: {
      apiKey: '${process.env.FIREBASE_API_KEY}',
      authDomain: '${process.env.FIREBASE_AUTH_DOMAIN}',
      databaseURL: '${process.env.FIREBASE_DATABASE_URL}',
      projectId: '${process.env.FIREBASE_PROJECT_ID}',
      storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET}',
      messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
      appId: '${process.env.FIREBASE_APP_ID}',
      measurementId: '${process.env.FIREBASE_MEASUREMENT_ID}'
    },
    globals: {
      team1: 0,
      team2: 1,
      round1: 0,
      round2: 1,
      round3: 2,
    },
    ms: {
      tenant: '${process.env.MS_TENANT}'
    }
  };
`;

const environmentFileDevContent = `
  // This file was autogenerated by dynamically running setEnv.ts and using dotenv for managing API key secrecy
  export const environment = {
    production: true,
    versionNumber: 'v${version}',
    prefix: 'T-',
    firebase: {
      apiKey: '${process.env.FIREBASE_API_KEY}',
      authDomain: '${process.env.FIREBASE_AUTH_DOMAIN}',
      databaseURL: '${process.env.FIREBASE_DATABASE_URL}',
      projectId: '${process.env.FIREBASE_PROJECT_ID}',
      storageBucket: '${process.env.FIREBASE_STORAGE_BUCKET}',
      messagingSenderId: '${process.env.FIREBASE_MESSAGING_SENDER_ID}',
      appId: '${process.env.FIREBASE_APP_ID}',
      measurementId: '${process.env.FIREBASE_MEASUREMENT_ID}'
    },
    globals: {
      team1: 0,
      team2: 1,
      round1: 0,
      round2: 1,
      round3: 2,
    },
    ms: {
      tenant: '${process.env.MS_TENANT}'
    }
  };
`;

writeFileUsingFS(targetProdPath, environmentFileProdContent); // appending data into the target file
writeFileUsingFS(targetDevPath, environmentFileDevContent); // appending data into the target file
