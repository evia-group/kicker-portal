// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
import 'zone.js/dist/zone-error';  // Included with Angular CLI.
