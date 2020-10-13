// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  versionNumber: '#{versionNumber}#',
  prefix: '#{prefix}#',
  firebase: {
    apiKey: '#{firebaseApiKey}#',
    authDomain: '#{firebaseAuthDomain}#',
    databaseURL: '#{firebaseDatabaseURL}#',
    projectId: '#{firebaseProjectId}#',
    storageBucket: '#{firebaseStorageBucket}#',
    messagingSenderId: '#{firebaseMessagingSenderId}#',
    appId: '#{firebaseAppId}#',
  },
  globals: {
    team1: 0,
    team2: 1,
    round1: 0,
    round2: 1,
    round3: 2,
  }
};
