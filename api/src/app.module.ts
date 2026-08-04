import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DrizzleModule } from './db/drizzle.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TeamsModule } from './teams/teams.module';
import { MatchesModule } from './matches/matches.module';
import { PlaytimeModule } from './playtime/playtime.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { KickerModule } from './kicker/kicker.module';
import { GameTypesModule } from './game-types/game-types.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { NotificationsModule } from './notifications/notifications.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Fuer den Aufraeumlauf der Warteschlange (MatchmakingService.expireStale).
    ScheduleModule.forRoot(),
    DrizzleModule,
    AuthModule,
    UsersModule,
    TeamsModule,
    GameTypesModule,
    MatchesModule,
    PlaytimeModule,
    LeaderboardModule,
    NotificationsModule,
    MatchmakingModule,
    KickerModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
