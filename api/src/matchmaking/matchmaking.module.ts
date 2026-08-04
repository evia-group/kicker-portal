import { Module } from '@nestjs/common';
import { MatchmakingController } from './matchmaking.controller';
import { MatchmakingService } from './matchmaking.service';
import { MatchmakingGateway } from './matchmaking.gateway';
import { GameTypesModule } from '../game-types/game-types.module';

@Module({
  imports: [GameTypesModule],
  controllers: [MatchmakingController],
  providers: [MatchmakingService, MatchmakingGateway],
  // Das Kicker-Modul meldet hierher, wenn der Tisch frei wird.
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
