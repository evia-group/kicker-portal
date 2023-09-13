import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { DocumentData, DocumentReference } from 'firebase/firestore';
import { ITeam } from '../../src/app/shared/interfaces/user.interface';

const db = admin.firestore();
const increment_value = admin.firestore.FieldValue.increment(1);

/* Return players for given Team-ID */
function getTeamPlayers(
  teamId: string,
  players: DocumentReference<DocumentData>[]
): DocumentReference<DocumentData>[] {
  return players.filter(
    (player) => teamId.startsWith(player.id) || teamId.endsWith(player.id)
  );
}

/* Create team if not existent */
function createTeam(
  teamId: string,
  teamPlayers: DocumentReference<DocumentData>[],
  prefix: string
) {
  return db
    .doc(prefix + 'Teams/' + teamId)
    .get()
    .then((teamDoc) => {
      if (!teamDoc.exists) {
        return createTeamName(teamPlayers).then((teamName) => {
          const team: ITeam = {
            name: teamName,
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
            defeats: 0,
          };
          return db.doc(prefix + 'Teams/' + teamId).set(team);
        });
      }
      return null;
    })
    .catch((error) => {
      console.log(error);
    });
}

/* Create and return the Team Name */
function createTeamName(teamPlayers: DocumentReference<DocumentData>[]) {
  const playerPromises = teamPlayers.map((player) => {
    return db.doc(player.path).get();
  });

  return Promise.all(playerPromises).then((teamPlayersRefs) => {
    const sortedTeam = teamPlayersRefs.sort((a, b) => a.id.localeCompare(b.id));
    return sortedTeam.map((player) => player.get('name')).join(' - ');
  });
}

/* The procedure for updating users and teams */
function updateUsersAndTeamsProcedure(
  snap: functions.firestore.QueryDocumentSnapshot
) {
  const prefix = process.env.PREFIX || '';
  const result = snap.data().result;
  const keys = Object.keys(result);
  const team1Id = keys[0];
  const resTeam1 = result[keys[0]];
  const team2Id = keys[1];
  const resTeam2 = result[keys[1]];
  const players = snap.get('players');
  const playersTeam1 = getTeamPlayers(team1Id, players);
  const playersTeam2 = getTeamPlayers(team2Id, players);

  return Promise.all([
    createTeam(team1Id, playersTeam1, prefix),
    createTeam(team2Id, playersTeam2, prefix),
  ]).then(() => {
    const team1UpdateMap = new Map<string, admin.firestore.FieldValue>();
    const team2UpdateMap = new Map<string, admin.firestore.FieldValue>();

    if (resTeam1 === 2) {
      team1UpdateMap.set('wins', increment_value);
      team1UpdateMap.set('stats.' + resTeam1 + ':' + resTeam2, increment_value);
      team2UpdateMap.set('losses', increment_value);
      team2UpdateMap.set('stats.' + resTeam2 + ':' + resTeam1, increment_value);
    } else {
      team2UpdateMap.set('wins', increment_value);
      team2UpdateMap.set('stats.' + resTeam2 + ':' + resTeam1, increment_value);
      team1UpdateMap.set('losses', increment_value);
      team1UpdateMap.set('stats.' + resTeam1 + ':' + resTeam2, increment_value);
    }

    let team1Counter = 0;
    let team2Counter = 0;

    snap
      .data()
      .dominations.forEach((dTeam: DocumentReference<DocumentData>) => {
        if (dTeam.id === team1Id) {
          team1Counter++;
        } else {
          team2Counter++;
        }
      });

    if (team1Counter > 0) {
      team1UpdateMap.set(
        'dominations',
        admin.firestore.FieldValue.increment(team1Counter)
      );
    }

    if (team2Counter > 0) {
      team2UpdateMap.set(
        'dominations',
        admin.firestore.FieldValue.increment(team2Counter)
      );
    }

    team1Counter = 0;
    team2Counter = 0;

    snap.data().defeats.forEach((dTeam: DocumentReference<DocumentData>) => {
      if (dTeam.id === team1Id) {
        team1Counter++;
      } else {
        team2Counter++;
      }
    });

    if (team1Counter > 0) {
      team1UpdateMap.set(
        'defeats',
        admin.firestore.FieldValue.increment(team1Counter)
      );
    }

    if (team2Counter > 0) {
      team2UpdateMap.set(
        'defeats',
        admin.firestore.FieldValue.increment(team2Counter)
      );
    }

    const team1UpdateObject = Object.fromEntries(team1UpdateMap);
    const team2UpdateObject = Object.fromEntries(team2UpdateMap);

    return Promise.all([
      db.doc(prefix + 'Teams/' + team1Id).update(team1UpdateObject),
      db.doc(prefix + 'Teams/' + team2Id).update(team2UpdateObject),
      db.doc(prefix + 'Users/' + playersTeam1[0].id).update(team1UpdateObject),
      db.doc(prefix + 'Users/' + playersTeam1[1].id).update(team1UpdateObject),
      db.doc(prefix + 'Users/' + playersTeam2[0].id).update(team2UpdateObject),
      db.doc(prefix + 'Users/' + playersTeam2[1].id).update(team2UpdateObject),
    ]);
  });
}

function addSingleMatchFields(document: admin.firestore.DocumentReference) {
  const newFieldsMap = new Map();
  newFieldsMap.set('s-wins', 0);
  newFieldsMap.set('s-losses', 0);
  newFieldsMap.set('s-dominations', 0);
  newFieldsMap.set('s-defeats', 0);
  newFieldsMap.set('s-stats.0:2', 0);
  newFieldsMap.set('s-stats.1:2', 0);
  newFieldsMap.set('s-stats.2:1', 0);
  newFieldsMap.set('s-stats.2:0', 0);

  return document.update(Object.fromEntries(newFieldsMap));
}

async function updateUsersProcedure(
  snap: functions.firestore.QueryDocumentSnapshot
) {
  const result = snap.data().result;
  const keys = Object.keys(result);
  const player1Id = keys[0];
  const resPlayer1 = result[keys[0]];
  const player2Id = keys[1];
  const resPlayer2 = result[keys[1]];
  const player1Reference = db.doc('Users/' + player1Id);
  const player2Reference = db.doc('Users/' + player2Id);

  const playersSnap = await Promise.all([
    player1Reference.get(),
    player2Reference.get(),
  ]);

  const playersToAddFields: Promise<admin.firestore.WriteResult>[] = [];
  playersSnap.forEach((playerSnap) => {
    if (playerSnap.exists) {
      const playerData = playerSnap.data();
      if (playerData && playerData['s-wins'] === undefined) {
        playersToAddFields.push(addSingleMatchFields(playerSnap.ref));
      }
    }
  });

  await Promise.all(playersToAddFields);

  const player1UpdateMap = new Map<string, admin.firestore.FieldValue>();
  const player2UpdateMap = new Map<string, admin.firestore.FieldValue>();

  if (resPlayer1 === 2) {
    player1UpdateMap.set('s-wins', increment_value);
    player1UpdateMap.set(
      's-stats.' + resPlayer1 + ':' + resPlayer2,
      increment_value
    );
    player2UpdateMap.set('s-losses', increment_value);
    player2UpdateMap.set(
      's-stats.' + resPlayer2 + ':' + resPlayer1,
      increment_value
    );
  } else {
    player2UpdateMap.set('s-wins', increment_value);
    player2UpdateMap.set(
      's-stats.' + resPlayer2 + ':' + resPlayer1,
      increment_value
    );
    player1UpdateMap.set('s-losses', increment_value);
    player1UpdateMap.set(
      's-stats.' + resPlayer1 + ':' + resPlayer2,
      increment_value
    );
  }

  let player1Counter = 0;
  let player2Counter = 0;

  snap
    .data()
    .dominations.forEach((dPlayer: DocumentReference<DocumentData>) => {
      if (dPlayer.id === player1Id) {
        player1Counter++;
      } else {
        player2Counter++;
      }
    });

  if (player1Counter > 0) {
    player1UpdateMap.set(
      's-dominations',
      admin.firestore.FieldValue.increment(player1Counter)
    );
  }

  if (player2Counter > 0) {
    player2UpdateMap.set(
      's-dominations',
      admin.firestore.FieldValue.increment(player2Counter)
    );
  }

  player1Counter = 0;
  player2Counter = 0;

  snap.data().defeats.forEach((dPlayer: DocumentReference<DocumentData>) => {
    if (dPlayer.id === player1Id) {
      player1Counter++;
    } else {
      player2Counter++;
    }
  });

  if (player1Counter > 0) {
    player1UpdateMap.set(
      's-defeats',
      admin.firestore.FieldValue.increment(player1Counter)
    );
  }

  if (player2Counter > 0) {
    player2UpdateMap.set(
      's-defeats',
      admin.firestore.FieldValue.increment(player2Counter)
    );
  }

  const player1UpdateObject = Object.fromEntries(player1UpdateMap);
  const player2UpdateObject = Object.fromEntries(player2UpdateMap);

  return Promise.all([
    player1Reference.update(player1UpdateObject),
    player2Reference.update(player2UpdateObject),
  ]);
}

/* Update stats for Users and Teams when match is added to firestore in testing environment */
exports.updateUsersAndTeamsT = functions.firestore
  .document('T-Matches/{documentId}')
  .onCreate((snap) => {
    return updateUsersAndTeamsProcedure(snap);
  });

/* Update stats for Users and Teams when match is added to firestore in production environment */
exports.updateUsersAndTeams = functions.firestore
  .document('Matches/{documentId}')
  .onCreate((snap) => {
    return updateUsersAndTeamsProcedure(snap);
  });

/* Update stats for Users when singe match (1vs1) is added to firestore */
exports.updateUsers = functions.firestore
  .document('Single-Matches/{documentId}')
  .onCreate((snap) => {
    return updateUsersProcedure(snap);
  });
