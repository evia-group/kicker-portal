import { Module } from '@nestjs/common';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { GameTypesModule } from '../game-types/game-types.module';

@Module({
  imports: [GameTypesModule],
  controllers: [MatchesController],
  providers: [MatchesService],
})
export class MatchesModule {}
