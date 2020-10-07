// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyBbBYhVMNcLUm3PRatlB2IPACxO_VamlkA',
    authDomain: 'evia-desk.firebaseapp.com',
    databaseURL: 'https://evia-desk.firebaseio.com',
    projectId: 'evia-desk',
    storageBucket: 'evia-desk.appspot.com',
    messagingSenderId: '124473984293',
    appId: '1:124473984293:web:578828e4a4140cad2fc6cc',
  },
  globals: {
    team1: 0,
    team2: 1,
    round1: 0,
    round2: 1,
    round3: 2,
  }
};
