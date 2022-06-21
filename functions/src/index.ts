import * as functions from "firebase-functions";
// const functions = require('firebase-functions');
import * as admin from "firebase-admin";
// const admin = require('firebase-admin');
import {IUser} from '../../src/app/shared/interfaces/user.interface';


admin.initializeApp();

const db = admin.firestore();
const increment_value = admin.firestore.FieldValue.increment(1);
const prefix = 'T-';
// const batch = admin.firestore().batch();


function incrementDoc(path: string, field: string) {
    db.doc(path).update({[field]: increment_value});
    // batch.update(db.doc(path), {[field]: increment_value});
}

function updateDocs(id1: string, id2: string, stats: string) {
    incrementDoc(prefix + 'Teams/' + id1, 'wins');


    // db.doc(prefix + 'Teams' + id1).update({['stats']})
    // db.doc(prefix + 'Teams/' + id1).get().then(data => {
    //     console.log(data.get('stats'));
    // });
    db.doc(prefix + 'Teams/' + id1).update({['stats.'+ stats]: increment_value});

    // db.doc(prefix + 'Teams/' + team1_id).update({['wins']: increment_value});
    db.doc(prefix + 'Teams/' + id1).get().then(data => {
        data.get('players').forEach((player: any) => {
            incrementDoc(player.path, 'wins');
            db.doc(player.path).update({['stats.'+ stats]: increment_value});
            // batch.update(db.doc(player.path), {['wins']: increment_value});
            // db.doc(player.path).update({['wins']: increment_value});
        });
    });
    incrementDoc(prefix + 'Teams/' + id2, 'losses');
    db.doc(prefix + 'Teams/' + id2).update({['stats.'+ reverseString(stats)]: increment_value});
    // db.doc(prefix + 'Teams/' + team2_id).update({['losses']: increment_value});
    db.doc(prefix + 'Teams/' + id2).get().then(data => {
        data.get('players').forEach((player: any) => {
            incrementDoc(player.path, 'losses');
            db.doc(player.path).update({['stats.'+ reverseString(stats)]: increment_value});
            // db.doc(player.path).update({['losses']: increment_value});
        });
    });
}

function reverseString(str: string) {
    return str.split('').reverse().join('');
}

function updateDominationsAndDefeats(snap: any) {
    let preTeams: string[] = [];
    snap.data().dominations.forEach((dTeam: any) => {
        if (!preTeams.includes(dTeam.path)) { 
            incrementDoc(dTeam.path, 'dominations');
            preTeams.push(dTeam.path);
            db.doc(dTeam.path).get().then(data => {
                data.get('players').forEach((player: any) => {
                    incrementDoc(player.path, 'dominations');
                    // db.doc(player.path).update({['losses']: increment_value});
                });
            });
        }
    });

    preTeams = [];
    snap.data().defeats.forEach((dTeam: any) => {
        if (!preTeams.includes(dTeam.path)) { 
            incrementDoc(dTeam.path, 'defeats');
            preTeams.push(dTeam.path);
            db.doc(dTeam.path).get().then(data => {
                data.get('players').forEach((player: any) => {
                    incrementDoc(player.path, 'defeats');
                    // db.doc(player.path).update({['losses']: increment_value});
                });
            });
        }
    });
}

export const updateUsersAndTeams = functions.firestore.document(`${prefix}Matches/{documentId}`).onCreate((snap, context) => {
    const result = snap.data().result;
    const keys = Object.keys(result);
    const team1_id = keys[0];
    const res_team1 =  result[keys[0]];
    const team2_id = keys[1];
    const res_team2 =  result[keys[1]];

    if (res_team1 === 2) {
        updateDocs(team1_id, team2_id, res_team1 + ':' + res_team2);
        
    }
    else {
        updateDocs(team2_id, team1_id, res_team2 + ':' + res_team1);
    }

    updateDominationsAndDefeats(snap);

    // let preTeams: string[] = [];
    // snap.data().dominations.forEach((dTeam: any) => {
    //     if (!preTeams.includes(dTeam.path)) { 
    //         incrementDoc(dTeam.path, 'dominations');
    //         preTeams.push(dTeam.path);
    //     }
    // });

    // preTeams = [];
    // snap.data().defeats.forEach((dTeam: any) => {
    //     if (!preTeams.includes(dTeam.path)) { 
    //         incrementDoc(dTeam.path, 'defeats');
    //         preTeams.push(dTeam.path);
    //     }
    // });

    return null;
});

/* When a new user is added to firebase, this function gets triggered.
   It adds a new user to firestore. */
export const newUser = functions.auth.user().onCreate((user) => {
    const newUser: IUser = {
        id: user.uid,
        name: user.displayName!,
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

    return null;
});