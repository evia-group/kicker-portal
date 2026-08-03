import { Module } from '@nestjs/common';
import { PlaytimeModule } from '../playtime/playtime.module';
import { KickerController } from './kicker.controller';
import { KickerService } from './kicker.service';
import { KickerGateway } from './kicker.gateway';
import { KickerApiKeyGuard } from './kicker-api-key.guard';

@Module({
  imports: [PlaytimeModule],
  controllers: [KickerController],
  providers: [KickerService, KickerGateway, KickerApiKeyGuard],
})
export class KickerModule {}
