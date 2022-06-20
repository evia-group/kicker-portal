import * as functions from "firebase-functions";
// const functions = require('firebase-functions');
import * as admin from "firebase-admin";
// const admin = require('firebase-admin');
import {IUser} from '../../src/app/shared/interfaces/user.interface';


admin.initializeApp();

const db = admin.firestore();
const increment_value = admin.firestore.FieldValue.increment(1);
const prefix = 'T-';

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript

// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

export const updateUser = functions.firestore.document(`${prefix}Matches/{documentId}`).onCreate((snap, context) => {
    const original = snap.data().players[0];
    console.log('path: ' + original.path);
    // const tmap = new Map(Object.entries(snap.data().result));
    const result = snap.data().result;
    const keys = Object.keys(result);
    const team1_id = keys[0];
    const res_team1 =  result[keys[0]];
    const team2_id = keys[1];
    // const res_team2 =  result[keys[1]];

    if (res_team1 === 2) {
        db.doc(prefix + 'Teams/' + team1_id).update({['wins']: increment_value});
        db.doc(prefix + 'Teams/' + team1_id).get().then(data => {
            // console.log(data.get('players')[0].path);
            data.get('players').forEach((player: any) => {
                db.doc(player.path).update({['wins']: increment_value});
            });
        });
        db.doc(prefix + 'Teams/' + team2_id).update({['losses']: increment_value});
        db.doc(prefix + 'Teams/' + team2_id).get().then(data => {
            data.get('players').forEach((player: any) => {
                db.doc(player.path).update({['losses']: increment_value});
            });
        });
    }
    else {
        db.doc(prefix + 'Teams/' + team2_id).update({['wins']: increment_value});
        db.doc(prefix + 'Teams/' + team2_id).get().then(data => {
            // console.log(data.get('players')[0].path);
            data.get('players').forEach((player: any) => {
                db.doc(player.path).update({['wins']: increment_value});
            });
        });
        db.doc(prefix + 'Teams/' + team1_id).update({['losses']: increment_value});
        db.doc(prefix + 'Teams/' + team1_id).get().then(data => {
            data.get('players').forEach((player: any) => {
                db.doc(player.path).update({['losses']: increment_value});
            });
        });
    }

    // keys.forEach(team => {
    //     console.log('result: ' + result[team]);

    //     if (result[team] === 2) {
    //         db.doc(prefix + 'Teams/' + team).update({['wins']: increment_value});
    //         db.doc(prefix + 'Teams/' + team).get().then(data => {
    //             console.log(data.get('players')[0].path);
    //             data.get('players').forEach((player: any) => {
    //                 db.doc(player.path).update({['wins']: increment_value});
    //             });
    //         });
    //     }
    //     else {
    //         db.doc(prefix + 'Teams/' + team).update({['losses']: increment_value});
    //         db.doc(prefix + 'Teams/' + team).get().then(data => {
    //             data.get('players').forEach((player: any) => {
    //                 db.doc(player.path).update({['losses']: increment_value});
    //             });
    //         });
    //     }
    // });
    // db.doc(original.path).get().then(async data => {
    //     const test = await data.get('id');
    //     console.log('id: ' + test);
    // });
    //   const test = db.doc(prefix + 'Users/9LrS2TeIzyfwb5onK65ALFSz3YQ2');
    //   console.log(context.params.documentId + ": " + test);
});

export const newUser = functions.auth.user().onCreate((user) => {
    console.log(user.email, user.uid);
    const newUser: IUser = {
        id: user.uid,
        name: '',
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
    db.doc(prefix + 'Users/' + user.uid).set(newUser);
    // db.doc(prefix + 'Users/' + user.uid).get().then(snap => {
    //     const newUser: IUser = {
    //             id: user.uid,
    //             name: '',
    //             wins: 0,
    //             losses: 0,
    //             defeats: 0,
    //             dominations: 0,
    //             stats: {
    //               '0:2': 0,
    //               '2:0': 0,
    //               '1:2': 0,
    //               '2:1': 0,
    //             },
    //           };
    //     // let data = snap.get('name');
    //     // console.log(data);
    //     db.doc(prefix + 'Users/' + user.uid).set(newUser);
    // });
});