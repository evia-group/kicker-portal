import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, inArray, type SQL } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { Database } from '../db/drizzle.module';
import {
  matchParticipants,
  matchRounds,
  matches,
  teamPlayers,
} from '../db/schema';
import { GameTypesService } from '../game-types/game-types.service';

interface EntityMatchRow {
  entityId: string;
  matchId: string;
  side: number;
}

export interface LeaderboardEntry {
  id: string;
  wins: number;
  losses: number;
  dominations: number;
  defeats: number;
  stats: Record<string, number>;
  totalMatches: number;
}

@Injectable()
export class LeaderboardService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly gameTypesService: GameTypesService,
  ) {}

  /**
   * Einzel- und Doppelspiele werden getrennt gewertet, seit dieser Aenderung
   * zusaetzlich getrennt je Spielart. Ohne diese Trennung wuerden Kicker- und
   * Dart-Ergebnisse in einer Bestenliste zusammenlaufen und waeren nicht mehr
   * vergleichbar. Ohne `gameTypeKey` bleibt das Verhalten wie bisher, also
   * ueber alle Spielarten, damit bestehende Clients nichts verlieren.
   */
  private async matchFilter(gameTypeKey?: string): Promise<SQL | undefined> {
    if (!gameTypeKey) {
      return undefined;
    }
    const gameType = await this.gameTypesService.requireByKey(gameTypeKey);
    return eq(matches.gameTypeId, gameType.id);
  }

  async getTeamLeaderboard(gameTypeKey?: string): Promise<LeaderboardEntry[]> {
    const participants = await this.db
      .select({
        matchId: matchParticipants.matchId,
        side: matchParticipants.side,
        teamId: matchParticipants.teamId,
      })
      .from(matchParticipants)
      .innerJoin(matches, eq(matches.id, matchParticipants.matchId))
      .where(and(gt(matches.teamSize, 1), await this.matchFilter(gameTypeKey)));

    const entityRows: EntityMatchRow[] = participants
      .filter((p) => p.teamId)
      .map((p) => ({
        entityId: p.teamId as string,
        matchId: p.matchId,
        side: p.side,
      }));

    return this.aggregate(entityRows);
  }

  /**
   * Team and single (1v1) matches are aggregated separately per user - the
   * frontend's statistics page shows them as distinct leaderboards, so they
   * must not be merged into one entry here.
   */
  async getUserLeaderboard(
    mode: 'team' | 'single',
    gameTypeKey?: string,
  ): Promise<LeaderboardEntry[]> {
    const gameTypeCondition = await this.matchFilter(gameTypeKey);

    if (mode === 'single') {
      const singleParticipants = await this.db
        .select({
          matchId: matchParticipants.matchId,
          side: matchParticipants.side,
          userId: matchParticipants.userId,
        })
        .from(matchParticipants)
        .innerJoin(matches, eq(matches.id, matchParticipants.matchId))
        .where(and(eq(matches.teamSize, 1), gameTypeCondition));

      const entityRows: EntityMatchRow[] = singleParticipants
        .filter((p) => p.userId)
        .map((p) => ({
          entityId: p.userId as string,
          matchId: p.matchId,
          side: p.side,
        }));

      return this.aggregate(entityRows);
    }

    const teamParticipants = await this.db
      .select({
        matchId: matchParticipants.matchId,
        side: matchParticipants.side,
        teamId: matchParticipants.teamId,
      })
      .from(matchParticipants)
      .innerJoin(matches, eq(matches.id, matchParticipants.matchId))
      .where(and(gt(matches.teamSize, 1), gameTypeCondition));

    const teamIds = [
      ...new Set(teamParticipants.map((p) => p.teamId).filter(Boolean)),
    ] as string[];
    const memberships = teamIds.length
      ? await this.db
          .select()
          .from(teamPlayers)
          .where(inArray(teamPlayers.teamId, teamIds))
      : [];

    const entityRows: EntityMatchRow[] = teamParticipants.flatMap((p) =>
      memberships
        .filter((m) => m.teamId === p.teamId)
        .map((m) => ({
          entityId: m.userId,
          matchId: p.matchId,
          side: p.side,
        })),
    );

    return this.aggregate(entityRows);
  }

  private async aggregate(
    entityRows: EntityMatchRow[],
  ): Promise<LeaderboardEntry[]> {
    const matchIds = [...new Set(entityRows.map((r) => r.matchId))];
    if (matchIds.length === 0) {
      return [];
    }

    const allParticipants = await this.db
      .select({
        matchId: matchParticipants.matchId,
        side: matchParticipants.side,
        roundsWon: matchParticipants.roundsWon,
      })
      .from(matchParticipants)
      .where(inArray(matchParticipants.matchId, matchIds));

    const roundsWonByMatch = new Map<string, [number, number]>();
    for (const p of allParticipants) {
      const pair = roundsWonByMatch.get(p.matchId) ?? [0, 0];
      pair[p.side] = p.roundsWon;
      roundsWonByMatch.set(p.matchId, pair);
    }

    const rounds = await this.db
      .select()
      .from(matchRounds)
      .where(inArray(matchRounds.matchId, matchIds));
    const roundsByMatch = new Map<string, typeof rounds>();
    for (const round of rounds) {
      const list = roundsByMatch.get(round.matchId) ?? [];
      list.push(round);
      roundsByMatch.set(round.matchId, list);
    }

    const entries = new Map<string, LeaderboardEntry>();
    const getEntry = (id: string): LeaderboardEntry => {
      let entry = entries.get(id);
      if (!entry) {
        entry = {
          id,
          wins: 0,
          losses: 0,
          dominations: 0,
          defeats: 0,
          stats: {},
          totalMatches: 0,
        };
        entries.set(id, entry);
      }
      return entry;
    };

    for (const row of entityRows) {
      const entry = getEntry(row.entityId);
      const roundsWonPair = roundsWonByMatch.get(row.matchId);
      if (!roundsWonPair) {
        continue;
      }
      const own = roundsWonPair[row.side];
      const opponent = roundsWonPair[1 - row.side];

      entry.totalMatches++;
      if (own > opponent) {
        entry.wins++;
      } else {
        entry.losses++;
      }
      const key = `${own}:${opponent}`;
      entry.stats[key] = (entry.stats[key] ?? 0) + 1;

      for (const round of roundsByMatch.get(row.matchId) ?? []) {
        if (!round.domination) {
          continue;
        }
        if (round.winnerSide === row.side) {
          entry.dominations++;
        } else {
          entry.defeats++;
        }
      }
    }

    return [...entries.values()];
  }
}
