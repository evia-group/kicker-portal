import { Module } from '@nestjs/common';
import { GameTypesController } from './game-types.controller';
import { GameTypesService } from './game-types.service';

@Module({
  controllers: [GameTypesController],
  providers: [GameTypesService],
  // Matches und Leaderboard brauchen das Regelwerk, um zu validieren
  // beziehungsweise nach Spielart zu filtern.
  exports: [GameTypesService],
})
export class GameTypesModule {}
