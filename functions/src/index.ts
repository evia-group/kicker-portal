import * as functions from "firebase-functions";
// const functions = require('firebase-functions');
import * as admin from "firebase-admin";
// const admin = require('firebase-admin');
import {IUser} from '../../src/app/shared/interfaces/user.interface';
import { DocumentReference } from "firebase/firestore";


admin.initializeApp();

const db = admin.firestore();
const increment_value = admin.firestore.FieldValue.increment(1);
const prefix = 'T-';

export const updateUsersAndTeams = functions.firestore.document(`${prefix}Matches/{documentId}`).onCreate(async (snap, context) => {
    const result = snap.data().result;
    const keys = Object.keys(result);
    const team1_id = keys[0];
    const res_team1 =  result[keys[0]];
    const team2_id = keys[1];
    const res_team2 =  result[keys[1]];
    const playersTeam1 = await db.doc(prefix + 'Teams/' + team1_id).get().then(data => {
        return [data.get('players')[0].id, data.get('players')[1].id];
    });
    const playersTeam2 = await db.doc(prefix + 'Teams/' + team2_id).get().then(data => {
        return [data.get('players')[0].id, data.get('players')[1].id];
    });

    let team1UpdateMap = new Map<string, admin.firestore.FieldValue>();
    let team2UpdateMap = new Map<string, admin.firestore.FieldValue>();

    if (res_team1 === 2) {
        team1UpdateMap.set('wins', increment_value);
        team1UpdateMap.set('stats.' + res_team1 + ':' + res_team2, increment_value);
        team2UpdateMap.set('losses', increment_value);
        team2UpdateMap.set('stats.' + res_team2 + ':' + res_team1, increment_value);
    }
    else {
        team2UpdateMap.set('wins', increment_value);
        team2UpdateMap.set('stats.' + res_team2 + ':' + res_team1, increment_value);
        team1UpdateMap.set('losses', increment_value);
        team1UpdateMap.set('stats.' + res_team1 + ':' + res_team2, increment_value);
    }

    let preTeams: string[] = [];
    snap.data().dominations.forEach((dTeam: DocumentReference) => {
        if (!preTeams.includes(dTeam.id)) { 
            if (dTeam.id === team1_id) {
                team1UpdateMap.set('dominations', increment_value);
            }
            else {
                team2UpdateMap.set('dominations', increment_value);
            }
            preTeams.push(dTeam.id);
        }
    });

    preTeams = [];
    snap.data().defeats.forEach((dTeam: DocumentReference) => {
        if (!preTeams.includes(dTeam.id)) { 
            if (dTeam.id === team1_id) {
                team1UpdateMap.set('defeats', increment_value);
            }
            else {
                team2UpdateMap.set('defeats', increment_value);
            }
            preTeams.push(dTeam.id);
        }
    });

    const team1UpdateObject = Object.fromEntries(team1UpdateMap);
    const team2UpdateObject = Object.fromEntries(team2UpdateMap);

    db.doc(prefix + 'Teams/' + team1_id).update(team1UpdateObject);
    db.doc(prefix + 'Teams/' + team2_id).update(team2UpdateObject);
    db.doc(prefix + 'Users/' + playersTeam1[0]).update(team1UpdateObject);
    db.doc(prefix + 'Users/' + playersTeam1[1]).update(team1UpdateObject);
    db.doc(prefix + 'Users/' + playersTeam2[0]).update(team2UpdateObject);
    db.doc(prefix + 'Users/' + playersTeam2[1]).update(team2UpdateObject);

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