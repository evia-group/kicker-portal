import type { Database } from '../src/db/drizzle.module';
import * as schema from '../src/db/schema';
import {
  LeaderboardService,
  LeaderboardEntry,
} from '../src/leaderboard/leaderboard.service';
import { GameTypesService } from '../src/game-types/game-types.service';
import { FirestoreCollections } from './migrate-core';

interface RefAggregate {
  wins: number;
  losses: number;
  dominations: number;
  defeats: number;
  stats: Record<string, number>;
  totalMatches: number;
}

function emptyAggregate(): RefAggregate {
  return {
    wins: 0,
    losses: 0,
    dominations: 0,
    defeats: 0,
    stats: {},
    totalMatches: 0,
  };
}

/**
 * `sideId` is what dominations/defeats are keyed by in Firestore (a team id
 * for team matches, the player's own id for singles) - NOT necessarily the
 * same id the aggregate is filed under. A user playing a team match must
 * still be credited via their *team's* id, since that's what appears in
 * those arrays.
 */
function applyMatch(
  agg: Map<string, RefAggregate>,
  aggregateKey: string,
  sideId: string,
  ownRounds: number,
  opponentRounds: number,
  dominationRefs: { id: string }[],
  defeatRefs: { id: string }[],
) {
  const entry = agg.get(aggregateKey) ?? emptyAggregate();
  entry.totalMatches++;
  if (ownRounds > opponentRounds) {
    entry.wins++;
  } else {
    entry.losses++;
  }
  const key = `${ownRounds}:${opponentRounds}`;
  entry.stats[key] = (entry.stats[key] ?? 0) + 1;
  entry.dominations += dominationRefs.filter((r) => r.id === sideId).length;
  entry.defeats += defeatRefs.filter((r) => r.id === sideId).length;
  agg.set(aggregateKey, entry);
}

function diffAggregates(
  label: string,
  reference: Map<string, RefAggregate>,
  actual: LeaderboardEntry[],
  idLabel: (id: string) => string,
  errors: string[],
): number {
  let mismatches = 0;
  const actualById = new Map(actual.map((e) => [e.id, e]));
  const allIds = new Set([...reference.keys(), ...actualById.keys()]);

  for (const id of allIds) {
    const expected = reference.get(id);
    const got = actualById.get(id);
    if (!expected || !got) {
      errors.push(
        `[${label}] ${idLabel(id)}: ${
          expected ? 'missing in Postgres' : 'unexpected in Postgres'
        }`,
      );
      mismatches++;
      continue;
    }
    const fields: Exclude<keyof RefAggregate, 'stats'>[] = [
      'wins',
      'losses',
      'dominations',
      'defeats',
      'totalMatches',
    ];
    for (const field of fields) {
      if (expected[field] !== got[field]) {
        errors.push(
          `[${label}] ${idLabel(id)}.${field}: expected ${
            expected[field]
          }, got ${got[field]}`,
        );
        mismatches++;
      }
    }
    const statKeys = new Set([
      ...Object.keys(expected.stats),
      ...Object.keys(got.stats),
    ]);
    for (const key of statKeys) {
      if ((expected.stats[key] ?? 0) !== (got.stats[key] ?? 0)) {
        errors.push(
          `[${label}] ${idLabel(id)}.stats[${key}]: expected ${
            expected.stats[key] ?? 0
          }, got ${got.stats[key] ?? 0}`,
        );
        mismatches++;
      }
    }
  }
  return mismatches;
}

export interface VerificationReport {
  mismatchCount: number;
  errors: string[];
}

/**
 * Recomputes aggregates directly from the given Firestore-shaped collections
 * using logic re-derived independently from migrate-transform.ts (not a
 * shared implementation), then diffs against what the migrated Postgres
 * data + LeaderboardService produce.
 */
export async function verifyMigration(
  db: Database,
  collections: FirestoreCollections,
): Promise<VerificationReport> {
  const errors: string[] = [];

  const userIdByFirebaseUid = new Map(
    (await db.select().from(schema.users)).map((u) => [
      u.legacyFirebaseUid as string,
      u.id,
    ]),
  );

  const teamAggregates = new Map<string, RefAggregate>();
  const userTeamAggregates = new Map<string, RefAggregate>();
  const userSingleAggregates = new Map<string, RefAggregate>();

  for (const doc of collections.matches) {
    const [teamAId, teamBId] = Object.keys(doc.data.result);
    const roundsA = doc.data.result[teamAId];
    const roundsB = doc.data.result[teamBId];

    applyMatch(
      teamAggregates,
      teamAId,
      teamAId,
      roundsA,
      roundsB,
      doc.data.dominations,
      doc.data.defeats,
    );
    applyMatch(
      teamAggregates,
      teamBId,
      teamBId,
      roundsB,
      roundsA,
      doc.data.dominations,
      doc.data.defeats,
    );

    // `players`' first/second half is fixed to whichever side matches.service.ts's
    // add() called "team1"/"team2" when the match was recorded - that has no
    // guaranteed relationship to the key order Object.keys(result) happens to
    // return. Attribute each player to a side via actual Teams-collection
    // membership instead of assuming the two orders line up. dominations/
    // defeats are keyed by *team* id even for individual players, so sideId
    // stays the team id, not the player's own id.
    const teamADoc = collections.teams.find((t) => t.id === teamAId);
    const teamAMemberIds = new Set(
      (teamADoc?.data.players ?? []).map((p) => p.id),
    );
    for (const player of doc.data.players) {
      if (teamAMemberIds.has(player.id)) {
        applyMatch(
          userTeamAggregates,
          player.id,
          teamAId,
          roundsA,
          roundsB,
          doc.data.dominations,
          doc.data.defeats,
        );
      } else {
        applyMatch(
          userTeamAggregates,
          player.id,
          teamBId,
          roundsB,
          roundsA,
          doc.data.dominations,
          doc.data.defeats,
        );
      }
    }
  }

  for (const doc of collections.singleMatches) {
    const [userAId, userBId] = Object.keys(doc.data.result);
    const roundsA = doc.data.result[userAId];
    const roundsB = doc.data.result[userBId];
    applyMatch(
      userSingleAggregates,
      userAId,
      userAId,
      roundsA,
      roundsB,
      doc.data.dominations,
      doc.data.defeats,
    );
    applyMatch(
      userSingleAggregates,
      userBId,
      userBId,
      roundsB,
      roundsA,
      doc.data.dominations,
      doc.data.defeats,
    );
  }

  const dbTeams = await db.select().from(schema.teams);
  const dbMemberships = await db.select().from(schema.teamPlayers);

  const teamAggregatesByUuid = new Map<string, RefAggregate>();
  for (const [firestoreId, agg] of teamAggregates) {
    const teamDoc = collections.teams.find((d) => d.id === firestoreId);
    const memberUuids = (teamDoc?.data.players ?? [])
      .map((p) => userIdByFirebaseUid.get(p.id))
      .filter((id): id is string => !!id)
      .sort();

    const match = dbTeams.find((t) => {
      const members = dbMemberships
        .filter((m) => m.teamId === t.id)
        .map((m) => m.userId)
        .sort();
      return (
        members.length === memberUuids.length &&
        members.every((id, i) => id === memberUuids[i])
      );
    });
    if (match) {
      teamAggregatesByUuid.set(match.id, agg);
    } else {
      errors.push(
        `Could not resolve Postgres team for Firestore team ${firestoreId}`,
      );
    }
  }

  const mapAggregatesToUuid = (
    aggregates: Map<string, RefAggregate>,
  ): Map<string, RefAggregate> => {
    const byUuid = new Map<string, RefAggregate>();
    for (const [firebaseUid, agg] of aggregates) {
      const uuid = userIdByFirebaseUid.get(firebaseUid);
      if (uuid) {
        byUuid.set(uuid, agg);
      } else {
        errors.push(
          `Could not resolve Postgres user for Firestore user ${firebaseUid}`,
        );
      }
    }
    return byUuid;
  };

  const userTeamAggregatesByUuid = mapAggregatesToUuid(userTeamAggregates);
  const userSingleAggregatesByUuid = mapAggregatesToUuid(userSingleAggregates);

  // Bewusst ohne gameType-Argument: die Migration erzeugt ausschliesslich
  // Kickerspiele, und die Gegenprobe soll dieselben Zahlen sehen wie vor der
  // Einfuehrung der Spielarten.
  const leaderboardService = new LeaderboardService(
    db,
    new GameTypesService(db),
  );
  const actualTeams = await leaderboardService.getTeamLeaderboard();
  const actualUserTeams = await leaderboardService.getUserLeaderboard('team');
  const actualUserSingles = await leaderboardService.getUserLeaderboard(
    'single',
  );

  const teamNameById = new Map(dbTeams.map((t) => [t.id, t.name]));
  const userNameById = new Map(
    (await db.select().from(schema.users)).map((u) => [u.id, u.name]),
  );

  let mismatchCount = 0;
  mismatchCount += diffAggregates(
    'teams',
    teamAggregatesByUuid,
    actualTeams,
    (id) => teamNameById.get(id) ?? id,
    errors,
  );
  mismatchCount += diffAggregates(
    'users (team)',
    userTeamAggregatesByUuid,
    actualUserTeams,
    (id) => userNameById.get(id) ?? id,
    errors,
  );
  mismatchCount += diffAggregates(
    'users (single)',
    userSingleAggregatesByUuid,
    actualUserSingles,
    (id) => userNameById.get(id) ?? id,
    errors,
  );

  const dbMatchCount = (await db.select().from(schema.matches)).length;
  const expectedMatchCount =
    collections.matches.length + collections.singleMatches.length;
  if (dbMatchCount !== expectedMatchCount) {
    errors.push(
      `Match count mismatch: Firestore has ${expectedMatchCount}, Postgres has ${dbMatchCount}`,
    );
    mismatchCount++;
  }

  const dbUserCount = (await db.select().from(schema.users)).length;
  if (dbUserCount !== collections.users.length) {
    errors.push(
      `User count mismatch: Firestore has ${collections.users.length}, Postgres has ${dbUserCount}`,
    );
    mismatchCount++;
  }

  return { mismatchCount, errors };
}
