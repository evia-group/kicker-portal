import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE } from '../db/drizzle.module';
import type { Database } from '../db/drizzle.module';
import { teamPlayers, teams, users } from '../db/schema';

@Injectable()
export class TeamsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findAll() {
    const allTeams = await this.db.select().from(teams);
    const memberships = await this.db
      .select({
        teamId: teamPlayers.teamId,
        userId: teamPlayers.userId,
        name: users.name,
      })
      .from(teamPlayers)
      .innerJoin(users, eq(users.id, teamPlayers.userId));

    return allTeams.map((team) => ({
      ...team,
      players: memberships
        .filter((m) => m.teamId === team.id)
        .map((m) => ({ id: m.userId, name: m.name })),
    }));
  }

  async delete(id: string) {
    await this.db.delete(teams).where(eq(teams.id, id));
  }
}
