import { Module } from '@nestjs/common';
import { DrizzleModule } from './db/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { MatchesModule } from './matches/matches.module';
import { PlaytimeModule } from './playtime/playtime.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { KickerModule } from './kicker/kicker.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    DrizzleModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    MatchesModule,
    PlaytimeModule,
    LeaderboardModule,
    KickerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
