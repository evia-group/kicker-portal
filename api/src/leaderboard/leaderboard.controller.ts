import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EntraAuthGuard } from '../auth/entra-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
@UseGuards(EntraAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('teams')
  getTeamLeaderboard() {
    return this.leaderboardService.getTeamLeaderboard();
  }

  @Get('users')
  getUserLeaderboard(@Query('mode') mode?: string) {
    return this.leaderboardService.getUserLeaderboard(
      mode === 'single' ? 'single' : 'team',
    );
  }
}
