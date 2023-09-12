import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { IUser } from '../../src/app/shared/interfaces/user.interface';

const db = admin.firestore();

/* When a new user is added to firebase, this function gets triggered.
   It adds a new user to firestore. */
exports.newUser = functions.auth.user().onCreate((user) => {
  const prefix = process.env.PREFIX || '';

  const newUser: IUser = {
    id: user.uid,
    name: user.displayName || '',
    wins: 0,
    losses: 0,
    defeats: 0,
    dominations: 0,
    stats: {
      '0:2': 0,
      '2:0': 0,
      '1:2': 0,
      '2:1': 0,
    },
  };
  return db.doc(prefix + 'Users/' + user.uid).set(newUser);
});
