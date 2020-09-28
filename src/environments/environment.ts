// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyCvwwnn8z9MO74uL6K2ls1Zw3nYYIfGGuc',
    authDomain: 'kicker-portal.firebaseapp.com',
    databaseURL: 'https://kicker-portal.firebaseio.com',
    projectId: 'kicker-portal',
    storageBucket: 'kicker-portal.appspot.com',
    messagingSenderId: '1016427992922',
    appId: '1:1016427992922:web:020ddd0f7bfffeec'
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
