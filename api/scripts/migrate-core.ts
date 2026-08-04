import { sql } from 'drizzle-orm';
import type { Database } from '../src/db/drizzle.module';
import * as schema from '../src/db/schema';
import {
  FirestoreMatchData,
  FirestoreSingleMatchData,
  resolveSingleMatch,
  resolveTeamMatch,
  parsePlaytimeTimestamp,
} from './migrate-transform';

export interface FirestoreDoc<T> {
  id: string;
  data: T;
}

export interface FirestoreCollections {
  users: FirestoreDoc<{ name?: string }>[];
  teams: FirestoreDoc<{ name?: string; players?: { id: string }[] }>[];
  matches: FirestoreDoc<FirestoreMatchData>[];
  singleMatches: FirestoreDoc<FirestoreSingleMatchData>[];
  playtime: FirestoreDoc<{ startTime: string; endTime: string }>[];
}

export interface FirebaseUidMapping {
  [firebaseUid: string]: { entraOid?: string };
}

export interface MigrationResult {
  skippedMatches: number;
  skippedSingleMatches: number;
  matchesWithoutDate: number;
}

/**
 * Truncates the target tables and re-imports everything from the given
 * Firestore collection snapshots. Takes plain data rather than live
 * QuerySnapshots so it can run against fixtures in tests as well as against
 * a real Firestore read.
 */
export async function runMigration(
  db: Database,
  collections: FirestoreCollections,
  uidMapping: FirebaseUidMapping = {},
): Promise<MigrationResult> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`
      truncate table match_rounds, match_participants, matches,
        team_players, teams, playtime, users restart identity cascade
    `);

    const firestoreIdToUserId = new Map<string, string>();
    for (const doc of collections.users) {
      const [created] = await tx
        .insert(schema.users)
        .values({
          legacyFirebaseUid: doc.id,
          entraOid: uidMapping[doc.id]?.entraOid,
          name: doc.data.name ?? doc.id,
        })
        .returning();
      firestoreIdToUserId.set(doc.id, created.id);
    }

    const firestoreIdToTeamId = new Map<string, string>();
    for (const doc of collections.teams) {
      const [created] = await tx
        .insert(schema.teams)
        .values({ name: doc.data.name ?? doc.id })
        .returning();
      firestoreIdToTeamId.set(doc.id, created.id);

      for (const playerRef of doc.data.players ?? []) {
        const userId = firestoreIdToUserId.get(playerRef.id);
        if (!userId) {
          console.warn(
            `Team ${doc.id} references unknown player ${playerRef.id}, skipping membership row`,
          );
          continue;
        }
        await tx
          .insert(schema.teamPlayers)
          .values({ teamId: created.id, userId })
          .onConflictDoNothing();
      }
    }

    let skippedMatches = 0;
    let matchesWithoutDate = 0;
    for (const doc of collections.matches) {
      const resolved = resolveTeamMatch(doc.data);
      const side0TeamId = firestoreIdToTeamId.get(
        resolved.side0TeamFirestoreId,
      );
      const side1TeamId = firestoreIdToTeamId.get(
        resolved.side1TeamFirestoreId,
      );
      if (!side0TeamId || !side1TeamId) {
        console.warn(
          `Match ${doc.id} references a team missing from the Teams collection ` +
            `(${resolved.side0TeamFirestoreId} / ${resolved.side1TeamFirestoreId}), skipping`,
        );
        skippedMatches++;
        continue;
      }
      if (!resolved.playedAt) {
        console.warn(
          `Match ${doc.id} has no 'date' field, playedAt will default to the migration run time`,
        );
        matchesWithoutDate++;
      }

      const [match] = await tx
        .insert(schema.matches)
        .values({
          ...(resolved.playedAt ? { playedAt: resolved.playedAt } : {}),
          isSingle: false,
        })
        .returning();

      await tx.insert(schema.matchParticipants).values([
        {
          matchId: match.id,
          side: 0,
          teamId: side0TeamId,
          roundsWon: resolved.roundsWon[0],
        },
        {
          matchId: match.id,
          side: 1,
          teamId: side1TeamId,
          roundsWon: resolved.roundsWon[1],
        },
      ]);

      await tx.insert(schema.matchRounds).values(
        resolved.rounds.map((round, index) => ({
          matchId: match.id,
          roundNo: index + 1,
          winnerSide: round.winnerSide,
          domination: round.domination,
        })),
      );
    }

    let skippedSingleMatches = 0;
    for (const doc of collections.singleMatches) {
      const resolved = resolveSingleMatch(doc.data);
      const side0UserId = firestoreIdToUserId.get(
        resolved.side0UserFirestoreId,
      );
      const side1UserId = firestoreIdToUserId.get(
        resolved.side1UserFirestoreId,
      );
      if (!side0UserId || !side1UserId) {
        console.warn(
          `Single match ${doc.id} references an unknown user, skipping`,
        );
        skippedSingleMatches++;
        continue;
      }
      if (!resolved.playedAt) {
        console.warn(
          `Single match ${doc.id} has no 'date' field, playedAt will default to the migration run time`,
        );
        matchesWithoutDate++;
      }

      const [match] = await tx
        .insert(schema.matches)
        .values({
          ...(resolved.playedAt ? { playedAt: resolved.playedAt } : {}),
          isSingle: true,
        })
        .returning();

      await tx.insert(schema.matchParticipants).values([
        {
          matchId: match.id,
          side: 0,
          userId: side0UserId,
          roundsWon: resolved.roundsWon[0],
        },
        {
          matchId: match.id,
          side: 1,
          userId: side1UserId,
          roundsWon: resolved.roundsWon[1],
        },
      ]);

      await tx.insert(schema.matchRounds).values(
        resolved.rounds.map((round, index) => ({
          matchId: match.id,
          roundNo: index + 1,
          winnerSide: round.winnerSide,
          domination: round.domination,
        })),
      );
    }

    for (const doc of collections.playtime) {
      await tx.insert(schema.playtime).values({
        startTime: parsePlaytimeTimestamp(doc.data.startTime),
        endTime: parsePlaytimeTimestamp(doc.data.endTime),
      });
    }

    return { skippedMatches, skippedSingleMatches, matchesWithoutDate };
  });
}
