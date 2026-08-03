/**
 * Pure transformation functions for the Firestore/RTDB -> Postgres migration.
 * No I/O here on purpose - everything takes plain data in, returns plain data
 * out, so the tricky parts (round reconstruction, the corrupted team
 * reference workaround) can be verified against fixtures without a live
 * Firestore connection.
 */

export interface FirestoreDocRef {
  id: string;
}

/**
 * Mirrors IMatch from src/app/shared/interfaces/match.interface.ts. `date`
 * is typed as required there, but real documents have been found without it
 * (see resolveTeamMatch) - typed optional here to match what's actually on
 * disk, not what the interface promises.
 */
export interface FirestoreMatchData {
  defeats: FirestoreDocRef[];
  dominations: FirestoreDocRef[];
  players: FirestoreDocRef[];
  result: Record<string, number>;
  teams: FirestoreDocRef[];
  type: string;
  date?: { toDate(): Date };
}

/** Mirrors ISingleMatch. No team/player refs, just the result map. */
export interface FirestoreSingleMatchData {
  defeats: FirestoreDocRef[];
  dominations: FirestoreDocRef[];
  result: Record<string, number>;
  type: string;
  date?: { toDate(): Date };
}

export interface ReconstructedRound {
  winnerSide: 0 | 1;
  domination: boolean;
}

/**
 * matches.service.ts's add() writes `dominations`/`defeats` as one entry per
 * domination round: the winning side's id into `dominations`, the losing
 * side's id into `defeats`, at the same index. Neither array records which
 * of a side's *wins* was the domination - only how many were. Round order is
 * therefore unrecoverable and, since Postgres only ever aggregates counts
 * per side (never per specific round), unnecessary to recover.
 */
export function reconstructRounds(
  roundsWonSide0: number,
  roundsWonSide1: number,
  dominationCountSide0: number,
  dominationCountSide1: number,
): ReconstructedRound[] {
  const rounds: ReconstructedRound[] = [];
  for (let i = 0; i < roundsWonSide0; i++) {
    rounds.push({ winnerSide: 0, domination: i < dominationCountSide0 });
  }
  for (let i = 0; i < roundsWonSide1; i++) {
    rounds.push({ winnerSide: 1, domination: i < dominationCountSide1 });
  }
  return rounds;
}

export interface ResolvedTeamMatch {
  side0TeamFirestoreId: string;
  side1TeamFirestoreId: string;
  roundsWon: [number, number];
  rounds: ReconstructedRound[];
  /** null when the document has no `date` field at all - seen on real T- data. */
  playedAt: Date | null;
}

/**
 * Resolves a team match's two team ids from `result`'s keys, not from the
 * `teams` field. `teams` holds the two DocumentReferences matches.service.ts
 * built with a stray `)}` appended to the path
 * (`Teams/${team1})}`) - a bug present in every team match ever
 * written, so it's unusable as an id source. `result`'s keys were built from
 * the same unmangled `team1`/`team2` variables and are reliable.
 */
export function resolveTeamMatch(doc: FirestoreMatchData): ResolvedTeamMatch {
  const [side0Id, side1Id] = Object.keys(doc.result);
  if (!side0Id || !side1Id) {
    throw new Error('Match result does not have exactly two team ids');
  }
  const roundsWon: [number, number] = [
    doc.result[side0Id],
    doc.result[side1Id],
  ];
  const dominationCountSide0 = doc.dominations.filter(
    (ref) => ref.id === side0Id,
  ).length;
  const dominationCountSide1 = doc.dominations.filter(
    (ref) => ref.id === side1Id,
  ).length;

  return {
    side0TeamFirestoreId: side0Id,
    side1TeamFirestoreId: side1Id,
    roundsWon,
    rounds: reconstructRounds(
      roundsWon[0],
      roundsWon[1],
      dominationCountSide0,
      dominationCountSide1,
    ),
    playedAt: doc.date ? doc.date.toDate() : null,
  };
}

export interface ResolvedSingleMatch {
  side0UserFirestoreId: string;
  side1UserFirestoreId: string;
  roundsWon: [number, number];
  rounds: ReconstructedRound[];
  /** null when the document has no `date` field at all - seen on real T- data. */
  playedAt: Date | null;
}

export function resolveSingleMatch(
  doc: FirestoreSingleMatchData,
): ResolvedSingleMatch {
  const [side0Id, side1Id] = Object.keys(doc.result);
  if (!side0Id || !side1Id) {
    throw new Error('Single match result does not have exactly two ids');
  }
  const roundsWon: [number, number] = [
    doc.result[side0Id],
    doc.result[side1Id],
  ];
  const dominationCountSide0 = doc.dominations.filter(
    (ref) => ref.id === side0Id,
  ).length;
  const dominationCountSide1 = doc.dominations.filter(
    (ref) => ref.id === side1Id,
  ).length;

  return {
    side0UserFirestoreId: side0Id,
    side1UserFirestoreId: side1Id,
    roundsWon,
    rounds: reconstructRounds(
      roundsWon[0],
      roundsWon[1],
      dominationCountSide0,
      dominationCountSide1,
    ),
    playedAt: doc.date ? doc.date.toDate() : null,
  };
}

/**
 * kicker-status.ts (RTDB trigger) copied startTime/endTime verbatim from
 * `/Kicker` into Playtime docs. The frontend reads them back as unix seconds
 * (`new Date(snapshot.val().startTime * 1000)` in navigation.component.ts),
 * so that's the format stored here too.
 */
export function parsePlaytimeTimestamp(value: string | number): Date {
  const seconds = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(seconds)) {
    throw new Error(`Cannot parse playtime timestamp: ${value}`);
  }
  return new Date(seconds * 1000);
}
