import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { Database } from '../db/drizzle.module';
import {
  matchParticipants,
  matchRounds,
  matches,
  teamPlayers,
  teams,
  users,
} from '../db/schema';
import { CreateMatchDto } from './dto/create-match.dto';

@Injectable()
export class MatchesService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findAll() {
    const allMatches = await this.db
      .select()
      .from(matches)
      .orderBy(desc(matches.playedAt));
    const participants = await this.db.select().from(matchParticipants);
    const rounds = await this.db.select().from(matchRounds);

    return allMatches.map((match) => ({
      ...match,
      participants: participants.filter((p) => p.matchId === match.id),
      rounds: rounds.filter((r) => r.matchId === match.id),
    }));
  }

  async create(dto: CreateMatchDto) {
    const isSingle = dto.side0.playerIds.length === 1;
    if (dto.side1.playerIds.length !== dto.side0.playerIds.length) {
      throw new BadRequestException(
        'Both sides must have the same number of players',
      );
    }

    const roundsWon: [number, number] = [0, 0];
    for (const round of dto.rounds) {
      roundsWon[round.winnerSide]++;
    }

    return this.db.transaction(async (tx) => {
      const [match] = await tx.insert(matches).values({ isSingle }).returning();

      for (const side of [0, 1] as const) {
        const playerIds =
          side === 0 ? dto.side0.playerIds : dto.side1.playerIds;
        const teamId = isSingle
          ? null
          : await this.findOrCreateTeam(tx, playerIds);
        const userId = isSingle ? playerIds[0] : null;

        await tx.insert(matchParticipants).values({
          matchId: match.id,
          side,
          teamId,
          userId,
          roundsWon: roundsWon[side],
        });
      }

      for (const [index, round] of dto.rounds.entries()) {
        await tx.insert(matchRounds).values({
          matchId: match.id,
          roundNo: index + 1,
          winnerSide: round.winnerSide,
          domination: round.domination,
        });
      }

      return { id: match.id };
    });
  }

  async delete(id: string) {
    await this.db.delete(matches).where(eq(matches.id, id));
  }

  /**
   * Teams have no independent identity in the frontend - they're implied by
   * their exact player pairing. Looks up the team whose full, order-independent
   * member set matches the given players, creating it (with players) if none
   * exists yet. Runs inside the caller's transaction so a half-created team
   * never survives a failed match insert.
   */
  private async findOrCreateTeam(
    tx: Database,
    playerIds: string[],
  ): Promise<string> {
    const sorted = [...playerIds].sort();
    const sortedArray = sql.join(
      sorted.map((id) => sql`${id}::uuid`),
      sql`, `,
    );

    const existingRows = await tx.execute<{ team_id: string }>(sql`
      select team_id
      from ${teamPlayers}
      group by team_id
      having array_agg(user_id order by user_id) = ARRAY[${sortedArray}]
    `);

    if (existingRows.length > 0) {
      return existingRows[0].team_id;
    }

    const players = await tx
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, sorted));
    const name = sorted
      .map((id) => players.find((p) => p.id === id)?.name ?? id)
      .join(' - ');

    const [team] = await tx.insert(teams).values({ name }).returning();

    await tx
      .insert(teamPlayers)
      .values(sorted.map((userId) => ({ teamId: team.id, userId })));

    return team.id;
  }
}
