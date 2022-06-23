import * as functions from "firebase-functions";
// const functions = require('firebase-functions');
import * as admin from "firebase-admin";
// const admin = require('firebase-admin');
import { ITeam, IUser } from '../../src/app/shared/interfaces/user.interface';
// import { IPlayers } from '../../src/app/shared/interfaces/match.interface';
import { DocumentData, DocumentReference } from "firebase/firestore";


admin.initializeApp();

const db = admin.firestore();
const increment_value = admin.firestore.FieldValue.increment(1);
const prefix = 'T-';

/* Return players for given Team-ID */
function getTeamPlayers(teamId: string, players: DocumentReference<DocumentData>[]): DocumentReference<DocumentData>[] {
    let teamPlayers: DocumentReference<DocumentData>[] = [];

    players.forEach((player: DocumentReference<DocumentData>) => {
        if (teamId.includes(player.id)) {
            teamPlayers.push(player);
        }
    });

    return teamPlayers;
}

/* Create team if not existent */
async function createTeam(teamId: string, teamPlayers: DocumentReference<DocumentData>[]) {
    await db.doc(prefix + 'Teams/' + teamId).get().then(async teamDoc => {
        if (!teamDoc.exists) {
            const team: ITeam = {
                name: await createTeamName(teamPlayers),
                players: teamPlayers,
                wins: 0,
                losses: 0,
                stats: {
                  '0:2': 0,
                  '2:0': 0,
                  '1:2': 0,
                  '2:1': 0,
                },
                dominations: 0,
                defeats: 0
            };

            db.doc(prefix + 'Teams/' + teamId).set(team);
        }
    }).catch(err => {
        console.log(err);
    });
}

/* Create and return the Team Name */
async function createTeamName(teamPlayers: DocumentReference<DocumentData>[]) {
    let teamPlayersRefs: admin.firestore.DocumentSnapshot<admin.firestore.DocumentData>[] = [];
    
    for(const player of teamPlayers) {
        await db.doc(player.path).get().then(playerData => {
            teamPlayersRefs.push(playerData);
        });
    }

    const sortedTeam = teamPlayersRefs.sort((a, b) => a.id.localeCompare(b.id));
    const teamName = sortedTeam.map(player => player.get('name')).join('');

    return teamName;
}

/* Update stats for Users and Teams when match is added to firestore */
export const updateUsersAndTeams = functions.firestore.document(`${prefix}Matches/{documentId}`).onCreate(async (snap, context) => {
    const result = snap.data().result;
    const keys = Object.keys(result);
    const team1Id = keys[0];
    const resTeam1 =  result[keys[0]];
    const team2Id = keys[1];
    const resTeam2 =  result[keys[1]];
    const players = snap.get('players');
    const playersTeam1 = getTeamPlayers(team1Id, players);
    const playersTeam2 = getTeamPlayers(team2Id, players);

    await createTeam(team1Id, playersTeam1);
    await createTeam(team2Id, playersTeam2);

    let team1UpdateMap = new Map<string, admin.firestore.FieldValue>();
    let team2UpdateMap = new Map<string, admin.firestore.FieldValue>();

    if (resTeam1 === 2) {
        team1UpdateMap.set('wins', increment_value);
        team1UpdateMap.set('stats.' + resTeam1 + ':' + resTeam2, increment_value);
        team2UpdateMap.set('losses', increment_value);
        team2UpdateMap.set('stats.' + resTeam2 + ':' + resTeam1, increment_value);
    }
    else {
        team2UpdateMap.set('wins', increment_value);
        team2UpdateMap.set('stats.' + resTeam2 + ':' + resTeam1, increment_value);
        team1UpdateMap.set('losses', increment_value);
        team1UpdateMap.set('stats.' + resTeam1 + ':' + resTeam2, increment_value);
    }

    let preTeams: string[] = [];
    snap.data().dominations.forEach((dTeam: DocumentReference<DocumentData>) => {
        if (!preTeams.includes(dTeam.id)) { 
            if (dTeam.id === team1Id) {
                team1UpdateMap.set('dominations', increment_value);
            }
            else {
                team2UpdateMap.set('dominations', increment_value);
            }
            preTeams.push(dTeam.id);
        }
    });

    preTeams = [];
    snap.data().defeats.forEach((dTeam: DocumentReference<DocumentData>) => {
        if (!preTeams.includes(dTeam.id)) { 
            if (dTeam.id === team1Id) {
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

    db.doc(prefix + 'Teams/' + team1Id).update(team1UpdateObject);
    db.doc(prefix + 'Teams/' + team2Id).update(team2UpdateObject);
    db.doc(prefix + 'Users/' + playersTeam1[0].id).update(team1UpdateObject);
    db.doc(prefix + 'Users/' + playersTeam1[1].id).update(team1UpdateObject);
    db.doc(prefix + 'Users/' + playersTeam2[0].id).update(team2UpdateObject);
    db.doc(prefix + 'Users/' + playersTeam2[1].id).update(team2UpdateObject);

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