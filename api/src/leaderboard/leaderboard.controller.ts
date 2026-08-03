import { Controller, Get, UseGuards } from '@nestjs/common';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { LeaderboardService } from './leaderboard.service';

@Controller('leaderboard')
@UseGuards(FirebaseAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('teams')
  getTeamLeaderboard() {
    return this.leaderboardService.getTeamLeaderboard();
  }

  @Get('users')
  getUserLeaderboard() {
    return this.leaderboardService.getUserLeaderboard();
  }
}
