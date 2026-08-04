import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EntraAuthGuard } from '../auth/entra-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
@UseGuards(EntraAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  /** `?gameType=kicker|darts` wertet nur diese Spielart. Ohne Parameter wird
   *  wie bisher ueber alle gewertet. */
  @Get('teams')
  getTeamLeaderboard(@Query('gameType') gameType?: string) {
    return this.leaderboardService.getTeamLeaderboard(gameType);
  }

  @Get('users')
  getUserLeaderboard(
    @Query('mode') mode?: string,
    @Query('gameType') gameType?: string,
  ) {
    return this.leaderboardService.getUserLeaderboard(
      mode === 'single' ? 'single' : 'team',
      gameType,
    );
  }
}
