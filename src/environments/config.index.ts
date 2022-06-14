import {writeFile} from 'fs';
// @ts-ignore
import {name, version} from '../package.json';


const targetPath = './src/environments/environment.prod.ts';

const envConfigFile = `export const environment = {
  production: true,
  versionNumber: ${version},
  prefix: '',
  firebase: {
    apiKey: ${process.env.FIREBASE_API_KEY},
    authDomain: ${process.env.FIREBASE_AUTH_DOMAIN},
    databaseURL: ${process.env.FIREBASE_DATABASE_URL},
    projectId: ${process.env.FIREBASE_PROJECT_ID},
    storageBucket: ${process.env.FIREBASE_STORAGE_BUCKET},
    messagingSenderId: ${process.env.FIREBASE_MESSAGING_SENDER_ID},
    appId: ${process.env.FIREBASE_APP_ID},
  },
  globals: {
    team1: 0,
    team2: 1,
    round1: 0,
    round2: 1,
    round3: 2,
  }
};
`;

writeFile(targetPath, envConfigFile, 'utf8', (err) => {
  if (err) {
    return console.log(err);
  }
});
