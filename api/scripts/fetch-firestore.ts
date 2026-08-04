import { FirestoreCollections } from './migrate-core';

export async function fetchCollections(
  firestore: FirebaseFirestore.Firestore,
  prefix: string,
): Promise<FirestoreCollections> {
  const [usersSnap, teamsSnap, matchesSnap, singleMatchesSnap, playtimeSnap] =
    await Promise.all([
      firestore.collection(`${prefix}Users`).get(),
      firestore.collection(`${prefix}Teams`).get(),
      firestore.collection(`${prefix}Matches`).get(),
      firestore.collection(`${prefix}Single-Matches`).get(),
      firestore.collection(`${prefix}Playtime`).get(),
    ]);

  console.log(
    `Found ${usersSnap.size} users, ${teamsSnap.size} teams, ` +
      `${matchesSnap.size} matches, ${singleMatchesSnap.size} single matches, ` +
      `${playtimeSnap.size} playtime entries.`,
  );

  return {
    users: usersSnap.docs.map((d) => ({
      id: d.id,
      data: d.data(),
    })),
    teams: teamsSnap.docs.map((d) => ({
      id: d.id,
      data: d.data(),
    })),
    matches: matchesSnap.docs.map((d) => ({
      id: d.id,
      data: d.data() as FirestoreCollections['matches'][number]['data'],
    })),
    singleMatches: singleMatchesSnap.docs.map((d) => ({
      id: d.id,
      data: d.data() as FirestoreCollections['singleMatches'][number]['data'],
    })),
    playtime: playtimeSnap.docs.map((d) => ({
      id: d.id,
      data: d.data() as FirestoreCollections['playtime'][number]['data'],
    })),
  };
}
