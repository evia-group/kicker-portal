import { Module } from '@nestjs/common';
import { PlaytimeController } from './playtime.controller';
import { PlaytimeService } from './playtime.service';

@Module({
  controllers: [PlaytimeController],
  providers: [PlaytimeService],
  exports: [PlaytimeService],
})
export class PlaytimeModule {}
